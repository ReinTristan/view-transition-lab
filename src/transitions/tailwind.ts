import { cleanup, prepare, supportsViewTransitions } from './dom'
import type { TransitionEngine } from './types'

/**
 * Tailwind in native mode: the browser runs the wipe, and the CSS that drives
 * it is written through Tailwind utilities instead of by hand.
 *
 * A deliberate twin of vanilla.ts, the way gsap.ts and anime.ts are twins of
 * motion.ts: the only thing that differs here is the engine literal. Which of
 * the five sub-engines runs is not decided in this file — it never reads
 * ctx.option. prepare() projects it as data-vt-option, and each sub-engine's
 * rule in styles/transitions/tailwind/ selects on it.
 */
export const tailwindEngine: TransitionEngine = {
  async run(apply, ctx) {
    if (ctx.reducedMotion || !supportsViewTransitions()) {
      apply()
      return
    }

    prepare(ctx, 'tailwind', 'native')
    try {
      await document.startViewTransition(apply).finished
    } finally {
      cleanup()
    }
  },
}
