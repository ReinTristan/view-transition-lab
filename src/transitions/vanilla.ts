import { cleanup, prepare, supportsViewTransitions } from './dom'
import type { TransitionEngine } from './types'

/**
 * The reference engine: no library at all, the browser does everything. The
 * animation lives in transitions/vanilla.css as hand-written keyframes on
 * ::view-transition-new(root); all that is left in JS is computing the origin
 * and making the call.
 *
 * It is `vanilla` and not `native` because `native` is already the name of a
 * *mode*, and this engine is not its only inhabitant: tailwind runs in native
 * mode too. The mode is "the animation is declarative CSS on the
 * pseudo-element"; this engine is "and that CSS was written by hand".
 */
export const vanillaEngine: TransitionEngine = {
  async run(apply, ctx) {
    if (ctx.reducedMotion || !supportsViewTransitions()) {
      apply()
      return
    }

    prepare(ctx, 'vanilla', 'native')
    try {
      await document.startViewTransition(apply).finished
    } finally {
      cleanup()
    }
  },
}
