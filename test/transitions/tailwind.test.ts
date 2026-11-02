import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { ThemeId } from '@/themes/registry'
import { getDuration, useThemeStore } from '@/themes/use-theme-store'
import { runTransition } from '@/transitions'
import { tailwindEngine } from '@/transitions/tailwind'
import type { TransitionContext } from '@/transitions/types'
import { CENTRE } from '../helpers/lab'
import { trace } from '../helpers/trace'

const store = () => useThemeStore.getState()

function ctx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    origin: { x: 10, y: 10 },
    duration: 200,
    reducedMotion: false,
    option: 'core',
    ...overrides,
  }
}

beforeEach(() => {
  store().setSpeed(2)
  store().setEngine('tailwind')
})

/**
 * The annex for tailwind. The conformance suite enrols the engine once, with
 * whichever sub-engine is selected; what differs between the five lives here.
 *
 * One describe per sub-engine rather than a test.each, so a broken one cannot
 * take the other four down with it.
 */
describe('tailwindEngine', () => {
  test('applies exactly once, with engine, mode and option already set', async () => {
    const seen: Record<string, string | undefined>[] = []
    await tailwindEngine.run(() => {
      const { vtEngine, vtMode, vtOption } = document.documentElement.dataset
      seen.push({ vtEngine, vtMode, vtOption })
    }, ctx())

    // All three inside the mutation: the sub-engine's rule selects on the
    // engine AND the option, so one of them missing means no wipe at all.
    expect(seen).toEqual([
      { vtEngine: 'tailwind', vtMode: 'native', vtOption: 'core' },
    ])
  })

  // Switched off, not deleted. Since tailwindcss-motion landed all five
  // sub-engines are ready, so there is no pending choice left to point this
  // at. The day one is declared with no CSS, aim the blob at it and turn this
  // back into `test`.
  test.skip('a sub-engine with no rule yet never reaches the stylesheet', async () => {
    // setState and not setEngineOption: the action reconciles, so a pending
    // choice only gets this far from a hand-edited blob.
    useThemeStore.setState({
      engineOptions: { tailwind: 'tailwindcss-motion' },
    })

    let option: string | undefined
    await runTransition('y2k', CENTRE, () => {
      option = document.documentElement.dataset.vtOption
    })

    expect(option).toBe('core')
  })
})

describe('sub-engine: core', () => {
  beforeEach(() => {
    store().setEngineOption('tailwind', 'core')
  })

  // What sets core apart from the other four, which will each bring an
  // animationName of their own.
  test('the wipe is a CSS transition, not an animation', async () => {
    const result = await trace('cyberpunk')

    expect(result.transitions).toContain('clip-path')
    const own = [...result.animations].filter(
      (name) => !name.startsWith('-ua-')
    )
    expect(own).toEqual([])
  })

  // Exact, unlike the conformance suite's tolerant window: this is the timing
  // the cascade declared, not a wall clock. It is what proves
  // duration-(--vt-duration) compiled and beat the default that
  // transition-[clip-path] writes first.
  test('the transition declares exactly the duration it was given', async () => {
    const start = vi.spyOn(document, 'startViewTransition')
    const running = runTransition('glass', CENTRE)

    await vi.waitFor(() => expect(start).toHaveBeenCalled())
    await start.mock.results[0].value.ready

    const clip = await vi.waitFor(() => {
      const found = document
        .getAnimations()
        .find(
          (animation): animation is CSSTransition =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === 'clip-path' &&
            animation.effect instanceof KeyframeEffect &&
            animation.effect.pseudoElement === '::view-transition-new(root)'
        )
      expect(found).toBeDefined()
      return found
    })

    expect(clip?.effect?.getComputedTiming().duration).toBe(getDuration())
    await running
  })
})

/**
 * The four that animate instead of transitioning. None of their libraries has
 * a clip-path, so none of them draws the circle: each asks for the closest
 * thing its own vocabulary has, on the enter half only. What tells them apart
 * is which keyframes run, so that is the table.
 *
 * A loop of describes, still one per sub-engine: a broken one fails its own
 * block and leaves the other three alone.
 */
const animated = [
  { id: 'tw-animate-css', names: ['enter'] },
  { id: 'tailwind-animations', names: ['zoom-in'] },
  { id: 'tailwindcss-animated', names: ['fade'] },
  // One animation per motion axis, which is the library's whole idea.
  { id: 'tailwindcss-motion', names: ['motion-opacity-in', 'motion-scale-in'] },
]

const NEW = '::view-transition-new(root)'
const OLD = '::view-transition-old(root)'

function on(pseudo: string): CSSAnimation[] {
  return document
    .getAnimations()
    .filter(
      (animation): animation is CSSAnimation =>
        animation instanceof CSSAnimation &&
        animation.effect instanceof KeyframeEffect &&
        animation.effect.pseudoElement === pseudo
    )
}

// Reads the pseudo-elements once the transition is ready, while it still runs.
async function duringWipe<T>(theme: ThemeId, read: () => T): Promise<T> {
  const start = vi.spyOn(document, 'startViewTransition')
  const running = runTransition(theme, CENTRE)

  await vi.waitFor(() => expect(start).toHaveBeenCalled())
  await start.mock.results[0].value.ready

  const result = read()
  await running
  return result
}

for (const { id, names } of animated) {
  describe(`sub-engine: ${id}`, () => {
    beforeEach(() => {
      store().setEngineOption('tailwind', id)
    })

    test('the wipe is its own keyframes, not a clip-path', async () => {
      const result = await trace('cyberpunk')

      const own = [...result.animations].filter(
        (name) => !name.startsWith('-ua-')
      )
      expect(own.sort()).toEqual(names)
      expect(result.transitions).not.toContain('clip-path')
    })

    // Proves the library's duration modifier reached the animation, over the
    // default it ships with — every one of the four has its own fallback.
    test('every animation declares exactly the duration it was given', async () => {
      const timings = await duringWipe('glass', () =>
        on(NEW).map((animation) => [
          animation.animationName,
          animation.effect?.getComputedTiming().duration,
        ])
      )

      expect(Object.fromEntries(timings)).toEqual(
        Object.fromEntries(names.map((name) => [name, getDuration()]))
      )
    })

    // Only the enter half: with mix-blend-mode: normal, fading the old
    // snapshot out at the same time would dip through the background.
    test('the old snapshot stays still', async () => {
      const old = await duringWipe('pastel', () => on(OLD))
      expect(old).toEqual([])
    })
  })
}
