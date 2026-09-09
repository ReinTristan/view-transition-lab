import type { EngineId, TransitionEngine, TransitionMode } from './types'
import { DEFAULT_MODE, isTransitionMode } from './types'

type EngineLoader = () => Promise<TransitionEngine>

/**
 * Lazy loading per engine AND per mode: this way the weight the lab measures is
 * real, and not an average of having all five libraries in the initial bundle.
 *
 * The second level is what keeps the mode axis honest. A module is one engine in
 * one mode, so `readyModes` below is derived from these keys instead of being
 * written by hand — motion used to advertise `['bridge', 'overlay']` with
 * nothing able to run overlay, which is exactly the drift that killed
 * TransitionEngine's own `modes` copy. The day motion-overlay.ts exists, adding
 * its key here lights up the picker, the reconciliation and the tests at once.
 *
 * Declared before engineList because the list derives `ready` and `readyModes`
 * from it.
 */
const loaders = {
  native: { native: () => import('./native').then((m) => m.nativeEngine) },
  motion: { bridge: () => import('./motion').then((m) => m.motionEngine) },
  gsap: { bridge: () => import('./gsap').then((m) => m.gsapEngine) },
  anime: { bridge: () => import('./anime').then((m) => m.animeEngine) },
} satisfies Partial<
  Record<EngineId, Partial<Record<TransitionMode, EngineLoader>>>
>

/**
 * The one loader that is always there: the default pair. It is what loaderFor
 * hands back when the selection cannot run, so the fallback needs no cast and no
 * non-null assertion to prove it exists.
 */
export const fallbackLoader: EngineLoader = loaders.native.native

/** The modes an engine can actually run, straight from the loader table. */
function loadedModes(id: EngineId): TransitionMode[] {
  const byMode: Partial<Record<TransitionMode, EngineLoader>> =
    id in loaders ? loaders[id as keyof typeof loaders] : {}
  return Object.keys(byMode).filter(isTransitionMode)
}

/** The one lookup that reaches the table. Undefined means "not implemented". */
export function engineLoader(
  id: EngineId,
  mode: TransitionMode
): EngineLoader | undefined {
  if (!(id in loaders)) return undefined
  const byMode: Partial<Record<TransitionMode, EngineLoader>> =
    loaders[id as keyof typeof loaders]
  return byMode[mode]
}

/**
 * A control that only some engines have — tailwind's sub-engine picker today.
 *
 * Modelled as a descriptor rather than a component with `if (engine ===
 * 'tailwind')` on purpose: the bar walks it without knowing which engine it is,
 * so the day GSAP wants to choose between Flip and a tween, the bar does not
 * have to learn about it.
 *
 * `status` is hand-written, unlike `ready`. There is nothing to derive it from:
 * a tailwind sub-engine is CSS, not a module, so it has no loader of its own.
 * Same shape as ThemeMeta.status, and it means the same thing.
 */
export interface EngineOptionChoice {
  id: string
  label: string
  blurb: string
  status: 'ready' | 'pending'
}

export interface EngineOption {
  id: string
  label: string
  choices: EngineOptionChoice[]
}

export interface EngineMeta {
  id: EngineId
  label: string
  blurb: string
  /** Every mode the engine is meant to do, implemented or not. For display. */
  modes: TransitionMode[]
  /** Derived from `loaders`: the subset that can be selected today. */
  readyModes: TransitionMode[]
  /** false while the engine is not implemented yet (lands in its own phase). */
  ready: boolean
  /** Extra axis owned by this engine alone. */
  options?: EngineOption
}

/**
 * The five ways of producing a CSS animation in Tailwind v4 — not five
 * animation libraries, five mechanisms, which is what justifies the sub-axis.
 * The order is the implementation order: bare first, because it is the only one
 * with no external dependency, so anything that breaks there belongs to the
 * tailwind engine itself and not to a library.
 *
 * Declared before the engine exists so the tailwind plan only has to add a
 * loader and flip a status: the bar never learns a new special case.
 */
const tailwindVariants: EngineOption = {
  id: 'variant',
  label: 'Library',
  choices: [
    {
      id: 'bare',
      label: 'Tailwind v4 bare',
      blurb: 'transition-* with @starting-style. No library at all.',
      status: 'pending',
    },
    {
      id: 'tw-animate-css',
      label: 'tw-animate-css',
      blurb: 'enter/exit pairs, built for Radix and Base UI data-state.',
      status: 'pending',
    },
    {
      id: 'tailwind-animations',
      label: 'tailwind-animations',
      blurb: 'Named animations, v4 native, written with @utility.',
      status: 'pending',
    },
    {
      id: 'tailwindcss-animated',
      label: 'tailwindcss-animated',
      blurb: 'Composition by modifiers: duration, delay, easing, direction.',
      status: 'pending',
    },
    {
      id: 'tailwindcss-motion',
      label: 'tailwindcss-motion',
      blurb: 'Composition by motion axes, each with its own timing.',
      status: 'pending',
    },
  ],
}

/**
 * The single source of truth for what the UI says about an engine. The engine
 * modules themselves carry no metadata on purpose — see TransitionEngine.
 *
 * `ready` and `readyModes` are derived from `loaders`, never written by hand: an
 * engine cannot advertise itself as implemented without something to load it
 * with. `modes` is the hand-written half — what it is *meant* to do — and a test
 * holds readyModes ⊆ modes so the two cannot drift.
 */
export const engineList: EngineMeta[] = [
  {
    id: 'native',
    label: 'Native',
    blurb:
      'The browser does it all. The animation is CSS on the pseudo-element.',
    modes: ['native'],
    readyModes: loadedModes('native'),
    ready: loadedModes('native').length > 0,
  },
  {
    id: 'motion',
    label: 'Motion',
    blurb:
      'Bridge: Motion drives --vt-progress and the browser takes the snapshots.',
    modes: ['bridge', 'overlay'],
    readyModes: loadedModes('motion'),
    ready: loadedModes('motion').length > 0,
  },
  {
    id: 'gsap',
    label: 'GSAP',
    blurb:
      "Bridge: GSAP's ticker drives --vt-progress. Flip arrives with overlay.",
    modes: ['bridge', 'overlay'],
    readyModes: loadedModes('gsap'),
    ready: loadedModes('gsap').length > 0,
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    blurb:
      'CSS only, with sub-engines: tw-animate-css, animated, animations, motion and bare.',
    modes: ['native'],
    readyModes: loadedModes('tailwind'),
    ready: loadedModes('tailwind').length > 0,
    options: tailwindVariants,
  },
  {
    id: 'anime',
    label: 'anime.js',
    blurb:
      "Bridge: anime.js's shared rAF loop drives --vt-progress. Overlay comes later.",
    modes: ['bridge', 'overlay'],
    readyModes: loadedModes('anime'),
    ready: loadedModes('anime').length > 0,
  },
]

export function engineMeta(id: EngineId): EngineMeta {
  const meta = engineList.find((engine) => engine.id === id)
  // engineList covers every EngineId — registry.test.ts holds that — so this is
  // unreachable. Throwing beats a non-null assertion that hides the day it is not.
  if (!meta) throw new Error(`[transitions] no metadata for engine "${id}"`)
  return meta
}

/**
 * Not every engine does every mode, so changing engine has to correct the
 * selected mode instead of leaving an impossible pair behind. Same policy as
 * loaderFor's: correct the selection, never degrade quietly.
 *
 * Falls back to a declared-but-pending mode for an engine with no loaders at all
 * (tailwind today), so the picker shows what that engine is meant to do rather
 * than an unrelated default.
 */
export function reconcileMode(
  id: EngineId,
  mode: TransitionMode
): TransitionMode {
  const meta = engineMeta(id)
  if (meta.readyModes.includes(mode)) return mode
  return meta.readyModes[0] ?? meta.modes[0] ?? DEFAULT_MODE
}

/** The engine's option choice, or its first one. Null when it has no options. */
export function reconcileOption(id: EngineId, choice: unknown): string | null {
  const { options } = engineMeta(id)
  if (!options) return null
  const found = options.choices.find((item) => item.id === choice)
  return found?.id ?? options.choices[0].id
}
