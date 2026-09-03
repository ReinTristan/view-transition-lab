import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useThemeStore } from '@/themes/use-theme-store'
import { engineList, runTransition } from '@/transitions'
import {
  CENTRE,
  fakeReducedMotion,
  withoutViewTransitions,
} from '../helpers/lab'
import { trace } from '../helpers/trace'

const store = () => useThemeStore.getState()
const implemented = engineList.filter((engine) => engine.ready)

/**
 * The conformance suite. It enumerates engineList rather than a hand-written
 * list, so gsap, tailwind and anime enrol themselves the day their `ready`
 * flips — nothing here has to be edited to cover them.
 *
 * It drives through runTransition instead of importing the engine module, for
 * the same reason: the loader, the lock and the store writes are part of what a
 * new engine has to fit into. The per-engine annexes next door cover whatever
 * needs a fake `apply`.
 */
describe.each(implemented)('engine: $id', (meta) => {
  beforeEach(() => {
    store().setEngine(meta.id)
    store().setSpeed(2)
  })

  test('reduced motion skips the API and still swaps the theme', async () => {
    const start = vi.spyOn(document, 'startViewTransition')
    fakeReducedMotion()

    await runTransition('cyberpunk', CENTRE)

    expect(start).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBe('cyberpunk')
  })

  test('a browser with no View Transitions API still swaps the theme', async () => {
    const restore = withoutViewTransitions()
    try {
      await runTransition('glass', CENTRE)
      expect(document.documentElement.dataset.theme).toBe('glass')
    } finally {
      restore()
    }
  })

  test('leaves nothing behind when it is done', async () => {
    await runTransition('y2k', CENTRE)

    const root = document.documentElement
    expect(root.dataset.vtMode).toBeUndefined()
    for (const prop of [
      '--vt-x',
      '--vt-y',
      '--vt-radius',
      '--vt-duration',
      '--vt-progress',
    ]) {
      expect(root.style.getPropertyValue(prop)).toBe('')
    }
  })

  test('lasts roughly as long as it was told to', async () => {
    const result = await trace('frutiger')

    // A tolerant window on purpose: asserting exact milliseconds against a
    // compositor is how a suite becomes a coin flip.
    expect(result.elapsed).toBeGreaterThan(result.expected * 0.4)
    expect(result.elapsed).toBeLessThan(result.expected * 4)
  })

  test('animates the root pseudo-element in its declared mode', async () => {
    const result = await trace('anthropic')
    const mode = [...result.modes][0]

    expect(meta.modes).toContain(mode)
    expect([...result.pseudos]).toContain('::view-transition-new(root)')

    if (mode === 'native') {
      // The animation is declarative, in transitions.css, and the JS bridge is
      // never touched.
      expect(result.animations).toContain('vt-reveal')
      expect(Math.max(...result.progress)).toBe(0)
      return
    }

    if (mode === 'bridge') {
      // The keepalive is the most fragile piece of the whole project: with no
      // active animation on the pseudo-element the browser closes the
      // transition as soon as `ready` resolves, before the library paints a
      // single frame. If this assertion goes, the wipe is invisible.
      expect(result.animations).toContain('vt-keepalive')

      const monotonic = result.progress.every(
        (value, index) => index === 0 || value >= result.progress[index - 1]
      )
      expect(monotonic).toBe(true)
      expect(Math.max(...result.progress)).toBeCloseTo(1, 2)

      // Proof that frames were actually painted mid-wipe, not just a jump from
      // 0 to 1 after the transition had already closed.
      const midway = result.progress.filter(
        (value) => value > 0.05 && value < 0.95
      )
      expect(midway.length).toBeGreaterThan(0)
      return
    }

    // overlay — no engine implements it yet. When one does, it lands here.
    expect(mode).toBe('overlay')
  })
})
