import { gsap } from 'gsap'
import { cleanup, prepare, setProgress, supportsViewTransitions } from './dom'
import type { TransitionEngine } from './types'

/**
 * Second bridge engine, and the one that makes the comparison say something.
 *
 * The shape is identical to motion.ts on purpose: same snapshots, same
 * keepalive, same clip-path. What changes is who runs the frames — GSAP's
 * ticker instead of Motion's loop — and that is the variable the lab is trying
 * to isolate. Even the easing is held constant: `power4.out` is GSAP's spelling
 * of the very same curve Motion is handed as cubic-bezier(0.22, 1, 0.36, 1),
 * quint out. If the two engines look different, something is broken rather than
 * interesting.
 *
 * GSAP's CSSPlugin could write --vt-progress on :root by itself
 * (gsap.to(root, { '--vt-progress': 1 })) and it would work. It is not used:
 * setProgress() is the one place that owns that write for all three bridge
 * engines, and what GSAP animates here is what every bridge engine animates —
 * a scalar from 0 to 1.
 */
export const gsapEngine: TransitionEngine = {
  async run(apply, ctx) {
    if (ctx.reducedMotion || !supportsViewTransitions()) {
      apply()
      return
    }

    prepare(ctx, 'bridge')
    const transition = document.startViewTransition(apply)

    try {
      await transition.ready
      // A fresh proxy per run, so two wipes can never share a target and leave
      // GSAP's overwrite logic deciding which of them lives.
      const driver = { value: 0 }
      // GSAP 3 tweens are thenable, so awaiting one resolves on complete.
      await gsap.to(driver, {
        value: 1,
        duration: ctx.duration / 1000,
        ease: 'power4.out',
        onUpdate: () => setProgress(driver.value),
      })
      await transition.finished
    } finally {
      cleanup()
    }
  },
}
