import type { EngineId, TransitionContext, TransitionMode } from './types'

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
 * The only preference media query the project consults: light and dark are
 * decided by the theme, never by the system. It sits next to the support check
 * because both answer the same kind of question — what does the browser say.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Gets the document ready for the wipe: circle origin, radius, duration, engine,
 * mode and option. The attributes are what the stylesheets select on, and each
 * answers a different question:
 *
 *   data-vt-mode   — how the wipe is produced. It is what bridge.css keys on,
 *                    shared by motion, gsap and anime on purpose: the three run
 *                    the identical mechanism and only differ in who ticks it.
 *   data-vt-engine — who is running it. The native mode has two tenants that
 *                    write different CSS (vanilla by hand, tailwind through
 *                    utilities), so that mode splits per engine instead.
 *   data-vt-option — which variant of that engine, for the engines that own an
 *                    extra axis (tailwind's sub-engines). Absent otherwise.
 *
 * The rule, in one line: CSS per mode where the engines share the mechanism,
 * CSS per engine where they do not. Each module passes its own engine and mode
 * as literals — no engine ever branches on either axis. The option is not a
 * literal: it changes at runtime within one engine, so it comes in `ctx`.
 */
export function prepare(
  ctx: TransitionContext,
  engine: EngineId,
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

  root.dataset.vtEngine = engine
  root.dataset.vtMode = mode
  if (ctx.option) root.dataset.vtOption = ctx.option
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
  delete root.dataset.vtEngine
  delete root.dataset.vtMode
  delete root.dataset.vtOption
  for (const prop of VT_PROPS) {
    root.style.removeProperty(prop)
  }
}
