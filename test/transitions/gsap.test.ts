import { gsap } from 'gsap'
import { describe, expect, test, vi } from 'vitest'
import { gsapEngine } from '@/transitions/gsap'
import type { TransitionContext } from '@/transitions/types'

function ctx(): TransitionContext {
  return { origin: { x: 10, y: 10 }, duration: 200, reducedMotion: false }
}

function progressNow(): number {
  return Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--vt-progress'
    ) || '0'
  )
}

/** The annex for the second bridge engine. */
describe('gsapEngine', () => {
  test('applies exactly once, in bridge mode', async () => {
    const apply = vi.fn(() => {
      expect(document.documentElement.dataset.vtMode).toBe('bridge')
    })

    await gsapEngine.run(apply, ctx())
    expect(apply).toHaveBeenCalledTimes(1)
  })

  test('GSAP owns the easing, not the browser', async () => {
    const samples: number[] = []
    let sampling = true
    const tick = () => {
      if (!sampling) return
      samples.push(progressNow())
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    await gsapEngine.run(() => {
      /* the theme swap is irrelevant here; the easing is the subject */
    }, ctx())
    sampling = false

    // power4.out is GSAP's spelling of Motion's cubic-bezier(0.22, 1, 0.36, 1),
    // so this is the same threshold the motion annex uses — and that is the
    // point. A linear ramp, which is what a stray CSS animation on the
    // pseudo-element would give, averages 0.5.
    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length
    expect(mean).toBeGreaterThan(0.55)
  })

  test('leaves no tween alive on the global timeline', async () => {
    await gsapEngine.run(() => {
      /* nothing to swap: the subject is what GSAP is left holding */
    }, ctx())

    // GSAP's very own leak: a tween that never completes keeps the global
    // timeline populated and the ticker running for the rest of the session.
    // Waited on rather than asserted flat, because autoRemoveChildren drops it
    // on a tick of its own and not synchronously with the promise.
    await vi.waitFor(() => {
      expect(gsap.globalTimeline.getChildren().length).toBe(0)
    })
  })
})
