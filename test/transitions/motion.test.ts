import { describe, expect, test, vi } from 'vitest'
import { motionEngine } from '@/transitions/motion'
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

/** The annex for the reference bridge engine. */
describe('motionEngine', () => {
  test('applies exactly once, in bridge mode', async () => {
    const apply = vi.fn(() => {
      expect(document.documentElement.dataset.vtMode).toBe('bridge')
    })

    await motionEngine.run(apply, ctx())
    expect(apply).toHaveBeenCalledTimes(1)
  })

  test('Motion owns the easing, not the browser', async () => {
    const samples: number[] = []
    let sampling = true
    const tick = () => {
      if (!sampling) return
      samples.push(progressNow())
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    await motionEngine.run(() => {
      /* the theme swap is irrelevant here; the easing is the subject */
    }, ctx())
    sampling = false

    // cubic-bezier(0.22, 1, 0.36, 1) is a hard ease-out: it spends most of its
    // time near the end. A linear ramp — which is what a stray CSS animation
    // driving the pseudo-element would give — averages 0.5.
    const mean = samples.reduce((sum, v) => sum + v, 0) / samples.length
    expect(mean).toBeGreaterThan(0.55)
  })
})
