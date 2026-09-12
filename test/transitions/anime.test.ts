import { engine } from 'animejs'
import { describe, expect, test, vi } from 'vitest'
import { animeEngine } from '@/transitions/anime'
import type { TransitionContext } from '@/transitions/types'

function ctx(): TransitionContext {
  return {
    origin: { x: 10, y: 10 },
    duration: 200,
    reducedMotion: false,
    option: null,
  }
}

function progressNow(): number {
  return Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--vt-progress'
    ) || '0'
  )
}

/** The annex for the third bridge engine. */
describe('animeEngine', () => {
  test('applies exactly once, in bridge mode', async () => {
    const apply = vi.fn(() => {
      expect(document.documentElement.dataset.vtMode).toBe('bridge')
    })

    await animeEngine.run(apply, ctx())
    expect(apply).toHaveBeenCalledTimes(1)
  })

  test('anime owns the easing, not the browser', async () => {
    const samples: number[] = []
    let sampling = true
    const tick = () => {
      if (!sampling) return
      samples.push(progressNow())
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    await animeEngine.run(() => {
      /* the theme swap is irrelevant here; the easing is the subject */
    }, ctx())
    sampling = false

    // Same threshold as the motion and gsap annexes, and that is the point:
    // outQuint is anime's spelling of power4.out, so all three are running one
    // curve. A linear ramp — what a stray CSS animation on the pseudo-element
    // would give — averages 0.5.
    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length
    expect(mean).toBeGreaterThan(0.55)
  })

  test('lets its shared loop go back to sleep', async () => {
    await animeEngine.run(() => {
      /* nothing to swap: the subject is what anime is left running */
    }, ctx())

    // anime's very own leak, and the flip side of what makes it different from
    // the other two: every animation on the page rides one engine-wide rAF
    // loop, so an animation that never completes keeps that loop ticking for
    // the whole session. reqId back to 0 is the loop having parked itself.
    // Waited on rather than asserted flat, because tickEngine clears it on the
    // frame after the last one, not synchronously with the promise.
    await vi.waitFor(() => {
      expect(engine.reqId).toBe(0)
    })
  })
})
