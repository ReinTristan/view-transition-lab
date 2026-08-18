export type EngineId = 'native' | 'motion' | 'gsap' | 'tailwind' | 'anime'

/**
 * How the wipe is produced.
 *
 * native  — declarative CSS animation on the pseudo-element.
 * bridge  — the browser takes the snapshots and a JS library drives the
 *           progress by writing --vt-progress on :root. Pseudo-elements are not
 *           DOM nodes, so no library can animate them directly: the custom
 *           property is the only bridge.
 * overlay — no View Transitions API. A real element animated by the library,
 *           with the theme swap happening mid-animation.
 */
export type TransitionMode = 'native' | 'bridge' | 'overlay'

export interface TransitionContext {
  /** Click point, origin of the wipe circle. */
  origin: { x: number; y: number }
  /** Milliseconds, already scaled by the speed multiplier. */
  duration: number
  reducedMotion: boolean
}

export interface TransitionEngine {
  id: EngineId
  label: string
  modes: TransitionMode[]
  /**
   * `apply` mutates the DOM (data-theme + data-scheme). Each engine decides
   * when to call it: inside startViewTransition in native and bridge modes, or
   * midway through its own animation in overlay mode.
   */
  run(apply: () => void, ctx: TransitionContext): Promise<void>
}
