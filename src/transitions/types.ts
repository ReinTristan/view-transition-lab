/**
 * The ids as data, not just as a union: the store has to validate what comes
 * back from localStorage, and a bare type erases at build time. Same shape as
 * the themes' isThemeId() in registry.ts.
 */
export const ENGINE_IDS = [
  'native',
  'motion',
  'gsap',
  'tailwind',
  'anime',
] as const

export type EngineId = (typeof ENGINE_IDS)[number]

/** Fixed, not derived from anything. Same idea as DEFAULT_THEME. */
export const DEFAULT_ENGINE: EngineId = 'native'

export function isEngineId(value: unknown): value is EngineId {
  return (
    typeof value === 'string' &&
    (ENGINE_IDS as readonly string[]).includes(value)
  )
}

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

/**
 * An engine is only `run`. It deliberately carries no id, label or modes: those
 * are EngineMeta's job in transitions/index.ts, and that list is what the UI
 * renders. Declaring them twice is what let motion.ts drift into claiming a
 * different set of modes than the picker showed, with nothing reading the copy
 * that was wrong.
 */
export interface TransitionEngine {
  /**
   * `apply` mutates the DOM (data-theme + data-scheme). Each engine decides
   * when to call it: inside startViewTransition in native and bridge modes, or
   * midway through its own animation in overlay mode.
   */
  run(apply: () => void, ctx: TransitionContext): Promise<void>
}
