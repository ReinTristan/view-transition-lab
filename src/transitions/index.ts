import type { ThemeId } from '@/themes/registry'
import {
  applyTheme,
  getDuration,
  getEngine,
  prefersReducedMotion,
} from '@/themes/store'
import type { EngineId, TransitionEngine, TransitionMode } from './types'

export interface EngineMeta {
  id: EngineId
  label: string
  blurb: string
  modes: TransitionMode[]
  /** false while the engine is not implemented yet (lands in its own phase). */
  ready: boolean
}

export const engineList: EngineMeta[] = [
  {
    id: 'native',
    label: 'Native',
    blurb:
      'The browser does it all. The animation is CSS on the pseudo-element.',
    modes: ['native'],
    ready: true,
  },
  {
    id: 'motion',
    label: 'Motion',
    blurb:
      'Bridge: Motion drives --vt-progress and the browser takes the snapshots.',
    modes: ['bridge', 'overlay'],
    ready: true,
  },
  {
    id: 'gsap',
    label: 'GSAP',
    blurb: 'Bridge and overlay with Flip, the FLIP philosophy made explicit.',
    modes: ['bridge', 'overlay'],
    ready: false,
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    blurb:
      'CSS only, with sub-engines: tw-animate-css, animated, animations, motion and bare.',
    modes: ['native'],
    ready: false,
  },
  {
    id: 'anime',
    label: 'anime.js',
    blurb: 'Bridge and overlay, the rawest contrast between mechanisms.',
    modes: ['bridge', 'overlay'],
    ready: false,
  },
]

/**
 * Lazy loading per engine: this way the weight the lab measures is real, and
 * not an average of having all five libraries in the initial bundle.
 */
const loaders = {
  native: () => import('./native').then((m) => m.nativeEngine),
  motion: () => import('./motion').then((m) => m.motionEngine),
} satisfies Partial<Record<EngineId, () => Promise<TransitionEngine>>>

function loaderFor(id: EngineId) {
  return id in loaders ? loaders[id as keyof typeof loaders] : loaders.native
}

/**
 * Prevents overlapping wipes: if a second theme change arrives while a
 * transition is still alive, the browser aborts the first one and the result
 * is a flicker.
 */
let running = false

export async function runTransition(
  theme: ThemeId,
  origin: { x: number; y: number }
) {
  if (running) return
  running = true

  try {
    const engine = await loaderFor(getEngine())()
    await engine.run(() => applyTheme(theme), {
      origin,
      duration: getDuration(),
      reducedMotion: prefersReducedMotion(),
    })
  } finally {
    running = false
  }
}

export type { EngineId, TransitionEngine, TransitionMode } from './types'
