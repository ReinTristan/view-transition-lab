import { animate } from 'motion'
import { cleanup, prepare, setProgress, supportsViewTransitions } from './dom'
import type { TransitionEngine } from './types'

/**
 * First engine in bridge mode, and the proof that the abstraction holds.
 *
 * Motion cannot touch ::view-transition-new(root): it is not a DOM node and
 * there is no handle to hand it. What it does instead is animate a scalar from
 * 0 to 1 and write it into --vt-progress, which the pseudo-element's clip-path
 * consumes because custom properties do inherit down to it.
 *
 * The keepalive in transitions.css is what makes this work: without an active
 * animation on the pseudo-element the browser would close the transition as
 * soon as `ready` resolved, before Motion painted a single frame.
 */
export const motionEngine: TransitionEngine = {
  id: 'motion',
  label: 'Motion',
  modes: ['bridge'],

  async run(apply, ctx) {
    if (ctx.reducedMotion || !supportsViewTransitions()) {
      apply()
      return
    }

    prepare(ctx, 'bridge')
    const transition = document.startViewTransition(apply)

    try {
      await transition.ready
      await animate(0, 1, {
        duration: ctx.duration / 1000,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: setProgress,
      })
      await transition.finished
    } finally {
      cleanup()
    }
  },
}
