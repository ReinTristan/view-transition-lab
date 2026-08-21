import type { TransitionContext, TransitionMode } from './types'

const VT_PROPS = [
  '--vt-x',
  '--vt-y',
  '--vt-radius',
  '--vt-duration',
  '--vt-progress',
]

export function supportsViewTransitions(): boolean {
  return 'startViewTransition' in document
}

/**
 * Gets the document ready for the wipe: circle origin, radius, duration and
 * mode. The mode is read from transitions.css to decide whether CSS drives the
 * animation or a library does.
 */
export function prepare(
  ctx: TransitionContext,
  mode: Exclude<TransitionMode, 'overlay'>
) {
  const root = document.documentElement
  const { x, y } = ctx.origin
  // Radius needed for the circle to reach the farthest corner from the click
  // point; otherwise the old theme peeks out of a corner when it finishes.
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  )

  root.dataset.vtMode = mode
  root.style.setProperty('--vt-x', `${x}px`)
  root.style.setProperty('--vt-y', `${y}px`)
  root.style.setProperty('--vt-radius', `${radius}px`)
  root.style.setProperty('--vt-duration', `${ctx.duration}ms`)
  root.style.setProperty('--vt-progress', '0')
}

/** The bridge itself: Motion, GSAP and anime.js call this on every frame. */
export function setProgress(value: number) {
  document.documentElement.style.setProperty('--vt-progress', String(value))
}

export function cleanup() {
  const root = document.documentElement
  delete root.dataset.vtMode
  for (const prop of VT_PROPS) {
    root.style.removeProperty(prop)
  }
}
