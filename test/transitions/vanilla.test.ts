import { describe, expect, test, vi } from 'vitest'
import type { TransitionContext } from '@/transitions/types'
import { vanillaEngine } from '@/transitions/vanilla'
import { fakeReducedMotion } from '../helpers/lab'

function ctx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return {
    origin: { x: 10, y: 10 },
    duration: 120,
    reducedMotion: false,
    ...overrides,
  }
}

/**
 * The annex for the reference engine: what needs a fake `apply` and therefore
 * cannot go through runTransition, which owns the real one.
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
