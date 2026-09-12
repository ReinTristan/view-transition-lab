import { beforeEach, describe, expect, test, vi } from 'vitest'
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

  test('a sub-engine with no rule yet never reaches the stylesheet', async () => {
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
