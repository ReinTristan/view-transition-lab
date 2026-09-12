import { describe, expect, test, vi } from 'vitest'
import { useThemeStore } from '@/themes/use-theme-store'
import type { TransitionContext } from '@/transitions/types'
import { vanillaEngine } from '@/transitions/vanilla'
import { fakeReducedMotion } from '../helpers/lab'
import { trace } from '../helpers/trace'

function ctx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    origin: { x: 10, y: 10 },
    duration: 120,
    reducedMotion: false,
    option: null,
    ...overrides,
  }
}

/**
 * The annex for the reference engine: what needs a fake `apply` and therefore
 * cannot go through runTransition, which owns the real one — plus the one thing
 * the conformance suite no longer names, which keyframes the wipe is.
 */
describe('vanillaEngine', () => {
  test('applies exactly once', async () => {
    const apply = vi.fn()
    await vanillaEngine.run(apply, ctx())

    expect(apply).toHaveBeenCalledTimes(1)
  })

  test('declares native mode to the stylesheet while it runs', async () => {
    const seen: (string | undefined)[] = []
    await vanillaEngine.run(() => {
      seen.push(document.documentElement.dataset.vtMode)
    }, ctx())

    expect(seen).toEqual(['native'])
  })

  // Used to live in the conformance suite's native branch, back when vanilla
  // was that mode's only tenant. It is vanilla's name, so it is vanilla's test.
  test('wipes with the hand-written vt-reveal keyframes', async () => {
    useThemeStore.getState().setSpeed(2)
    const result = await trace('anthropic')

    expect(result.animations).toContain('vt-reveal')
  })

  test('short-circuits under reduced motion, without touching the API', async () => {
    fakeReducedMotion()
    const start = vi.spyOn(document, 'startViewTransition')
    const apply = vi.fn()

    await vanillaEngine.run(apply, ctx({ reducedMotion: true }))

    expect(apply).toHaveBeenCalledTimes(1)
    expect(start).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.vtMode).toBeUndefined()
  })
})
