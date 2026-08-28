import type { ThemeId } from '@/themes/registry'
import {
  applyTheme,
  getDuration,
  getEngine,
  prefersReducedMotion,
  setEngine,
} from '@/themes/store'
import type { EngineId, TransitionEngine, TransitionMode } from './types'
import { DEFAULT_ENGINE } from './types'

/**
 * Lazy loading per engine: this way the weight the lab measures is real, and
 * not an average of having all five libraries in the initial bundle.
 *
 * Declared before engineList because the list derives `ready` from it.
 */
const loaders = {
  native: () => import('./native').then((m) => m.nativeEngine),
  motion: () => import('./motion').then((m) => m.motionEngine),
} satisfies Partial<Record<EngineId, () => Promise<TransitionEngine>>>

function hasLoader(id: EngineId): id is keyof typeof loaders {
  return id in loaders
}

export interface EngineMeta {
  id: EngineId
  label: string
  blurb: string
  modes: TransitionMode[]
  /** false while the engine is not implemented yet (lands in its own phase). */
  ready: boolean
}

/**
 * The single source of truth for what the UI says about an engine. The engine
 * modules themselves carry no metadata on purpose — see TransitionEngine.
 *
 * `ready` is derived from `loaders`, never written by hand: an engine cannot
 * advertise itself as implemented without something to load it with.
 */
export const engineList: EngineMeta[] = [
  {
    id: 'native',
    label: 'Native',
    blurb:
      'The browser does it all. The animation is CSS on the pseudo-element.',
    modes: ['native'],
    ready: hasLoader('native'),
  },
  {
    id: 'motion',
    label: 'Motion',
    blurb:
      'Bridge: Motion drives --vt-progress and the browser takes the snapshots.',
    modes: ['bridge', 'overlay'],
    ready: hasLoader('motion'),
  },
  {
    id: 'gsap',
    label: 'GSAP',
    blurb: 'Bridge and overlay with Flip, the FLIP philosophy made explicit.',
    modes: ['bridge', 'overlay'],
    ready: hasLoader('gsap'),
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    blurb:
      'CSS only, with sub-engines: tw-animate-css, animated, animations, motion and bare.',
    modes: ['native'],
    ready: hasLoader('tailwind'),
  },
  {
    id: 'anime',
    label: 'anime.js',
    blurb: 'Bridge and overlay, the rawest contrast between mechanisms.',
    modes: ['bridge', 'overlay'],
    ready: hasLoader('anime'),
  },
]

function loaderFor(id: EngineId) {
  if (hasLoader(id)) return loaders[id]

  // Falling back quietly is the one thing this lab must not do: the picker
  // would keep saying GSAP while native ran, and the bundle figures it reports
  // would be measuring something else entirely. Correcting the selection makes
  // the UI catch up with what actually executes — setEngine emits, so the
  // picker repaints to Native on its own.
  console.warn(
    `[transitions] no loader for "${id}" yet — falling back to native.`
  )
  setEngine(DEFAULT_ENGINE)
  return loaders.native
}

interface PendingRun {
  theme: ThemeId
  origin: { x: number; y: number }
  mutate?: () => void
}

/**
 * Prevents overlapping wipes: if a second theme change arrives while a
 * transition is still alive, the browser aborts the first one and the result is
 * a flicker. So the incoming click waits instead of running.
 *
 * A single slot, not a queue, and the last one wins: chaining every click would
 * make a rapid burst play a train of wipes long after you stopped clicking.
 */
let running = false
let queued: PendingRun | null = null

/**
 * `mutate` runs inside the very same DOM mutation as the theme swap, which is
 * what lets a route change ride along with the wipe instead of landing after
 * it. Anything left to React's batching would commit after the browser already
 * captured the "new" snapshot, and would pop in rather than being wiped in.
 *
 * It travels with the pending run too, so a click that had to wait still gets
 * its navigation and its hub marker in that same mutation.
 */
export async function runTransition(
  theme: ThemeId,
  origin: { x: number; y: number },
  mutate?: () => void
) {
  if (running) {
    queued = { theme, origin, mutate }
    return
  }
  running = true

  try {
    const engine = await loaderFor(getEngine())()
    await engine.run(
      () => {
        applyTheme(theme)
        mutate?.()
      },
      {
        origin,
        duration: getDuration(),
        reducedMotion: prefersReducedMotion(),
      }
    )
  } finally {
    running = false
    const next = queued
    queued = null
    // Drained in the finally so a throwing engine cannot strand the pending
    // run. Not awaited: nothing downstream waits on this promise, and awaiting
    // inside a finally would hold the caller's open until the whole chain ends.
    //
    // Deliberately not skipped when `next.theme` is already applied: it looks
    // like a no-op, but the picker's mutate also navigates, so double-clicking
    // one theme from / still has to land on /theme/:id.
    if (next) void runTransition(next.theme, next.origin, next.mutate)
  }
}

export type { EngineId, TransitionEngine, TransitionMode } from './types'
export { DEFAULT_ENGINE, ENGINE_IDS, isEngineId } from './types'
