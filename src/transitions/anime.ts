import { animate } from 'animejs'
import { cleanup, prepare, setProgress, supportsViewTransitions } from './dom'
import type { TransitionEngine } from './types'

/**
 * Third bridge engine, and the last one that compares like for like.
 *
 * The shape is motion.ts's and gsap.ts's, deliberately: same snapshots, same
 * keepalive, same clip-path, so the only variable left is who runs the frames.
 * That is what anime brings to the comparison — one engine-wide rAF loop shared
 * by every animation on the page, against GSAP's ticker and Motion's driver per
 * animation. The loop parks itself as soon as the last animation is done.
 *
 * The curve is held constant too: `outQuint` is anime's spelling of GSAP's
 * `power4.out`, both of them 1-(1-x)^5, which the cubic-bezier(0.22, 1, 0.36, 1)
 * Motion is handed approximates. Three engines naming one curve in their own
 * vocabulary; if they look different, something is broken rather than
 * interesting.
 *
 * anime could write --vt-progress by itself, targeting documentElement. It is
 * not used, for the same reason gsap.ts skips CSSPlugin: setProgress() is the
 * one place that owns that write for all three bridge engines, and what anime
 * animates here is what every bridge engine animates — a scalar from 0 to 1.
 */
export const animeEngine: TransitionEngine = {
  async run(apply, ctx) {
    if (ctx.reducedMotion || !supportsViewTransitions()) {
      apply()
      return
    }

    prepare(ctx, 'bridge')
    const transition = document.startViewTransition(apply)

    try {
      await transition.ready
      // A fresh proxy per run, the same as gsap.ts: two wipes sharing one
      // target would leave anime's tween composition deciding which lives.
      const driver = { value: 0 }
      // Two details here are anime's own, and both differ from the other two
      // bridge engines: `duration` is milliseconds rather than seconds, and
      // `onUpdate` is handed the animation instead of the value — hence reading
      // the scalar back off the proxy rather than passing setProgress bare.
      // JSAnimation is thenable, so awaiting one resolves on complete.
      await animate(driver, {
        value: 1,
        duration: ctx.duration,
        ease: 'outQuint',
        onUpdate: () => setProgress(driver.value),
      })
      await transition.finished
    } finally {
      cleanup()
    }
  },
}
