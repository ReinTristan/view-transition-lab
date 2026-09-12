/**
 * The ids as data, not just as a union: the store has to validate what comes
 * back from localStorage, and a bare type erases at build time. Same shape as
 * the themes' isThemeId() in registry.ts.
 */
export const ENGINE_IDS = [
  'vanilla',
  'motion',
  'gsap',
  'tailwind',
  'anime',
] as const

export type EngineId = (typeof ENGINE_IDS)[number]

/** Fixed, not derived from anything. Same idea as DEFAULT_THEME. */
export const DEFAULT_ENGINE: EngineId = 'vanilla'

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
 *
 * Data and not just a union, for the same reason ENGINE_IDS is: the mode is a
 * persisted axis now, so something has to guard what comes back from disk.
 */
export const TRANSITION_MODES = ['native', 'bridge', 'overlay'] as const

export type TransitionMode = (typeof TRANSITION_MODES)[number]

/** Fixed, and the mode DEFAULT_ENGINE implements. A test holds the pair. */
export const DEFAULT_MODE: TransitionMode = 'native'

export function isTransitionMode(value: unknown): value is TransitionMode {
  return (
    typeof value === 'string' &&
    (TRANSITION_MODES as readonly string[]).includes(value)
  )
}

export interface TransitionContext {
  /** Click point, origin of the wipe circle. */
  origin: { x: number; y: number }
  /** Milliseconds, already scaled by the speed multiplier. */
  duration: number
  reducedMotion: boolean
  /**
   * The choice picked on the engine's own extra axis, already reconciled — or
   * null when the engine declares none. Unlike the engine and the mode it is not
   * a literal of the module: it changes at runtime within one engine, so it
   * travels here and prepare() projects it for the stylesheet to select on.
   */
  option: string | null
}

/**
 * An engine is only `run`. It deliberately carries no id, label or modes: those
 * are EngineMeta's job in transitions/registry.ts, and that list is what the UI
 * renders. Declaring them twice is what let motion.ts drift into claiming a
 * different set of modes than the picker showed, with nothing reading the copy
 * that was wrong.
 *
 * A module is one engine in one mode: `loaders` is keyed by both, so each module
 * passes its own data-vt-engine and data-vt-mode literally and never has to
 * branch on either.
 */
export interface TransitionEngine {
  /**
   * `apply` mutates the DOM (data-theme + data-scheme). Each engine decides
   * when to call it: inside startViewTransition in native and bridge modes, or
   * midway through its own animation in overlay mode.
   */
  run(apply: () => void, ctx: TransitionContext): Promise<void>
}
