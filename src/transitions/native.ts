import { cleanup, prepare, supportsViewTransitions } from './dom'
import type { TransitionEngine } from './types'

/**
 * The reference engine: the browser does absolutely everything. The animation
 * lives in transitions.css as keyframes on ::view-transition-new(root); all
 * that is left in JS is computing the origin and making the call.
 */
export const nativeEngine: TransitionEngine = {
  id: 'native',
  label: 'Native',
  modes: ['native'],

  async run(apply, ctx) {
    if (ctx.reducedMotion || !supportsViewTransitions()) {
      apply()
      return
    }

    prepare(ctx, 'native')
    try {
      await document.startViewTransition(apply).finished
    } finally {
      cleanup()
    }
  },
}
