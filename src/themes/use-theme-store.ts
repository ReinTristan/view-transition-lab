import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { DEFAULT_ENGINE, type EngineId, isEngineId } from '@/transitions/types'
import type { ThemeId } from './registry'
import { DEFAULT_THEME, isThemeId, themes } from './registry'

/** Base wipe duration, before applying the multiplier. */
export const BASE_DURATION = 600

/**
 * The slider's range lives here, not in the control, so the persisted value and
 * the widget rendering it cannot disagree.
 */
export const SPEED_MIN = 0.25
export const SPEED_MAX = 2
export const SPEED_STEP = 0.25
export const DEFAULT_SPEED = 1

function clampSpeed(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SPEED
  // Multiples of 0.25 are exact in binary, so snapping adds no drift.
  const snapped = Math.round(value / SPEED_STEP) * SPEED_STEP
  return Math.min(SPEED_MAX, Math.max(SPEED_MIN, snapped))
}

/**
 * Projects the theme onto <html>. Synchronous on purpose: it runs inside
 * startViewTransition's callback, and anything deferred to a commit would let
 * the browser capture a "new" snapshot identical to the old one — an empty wipe.
 * This is why the write lives in the action and NEVER in an effect reacting to
 * the store value.
 *
 * It also has to be <html> rather than a wrapper: 14 components portalize into
 * body, so a themed div inside #root would leave every dialog, popover and
 * tooltip outside the theme.
 */
function paintTheme(id: ThemeId) {
  const root = document.documentElement
  root.dataset.theme = id
  root.dataset.scheme = themes[id].scheme
}

/** A theme change that arrived while a wipe was still running. */
export interface PendingRun {
  theme: ThemeId
  origin: { x: number; y: number }
  mutate?: () => void
}

interface ThemeState {
  theme: ThemeId
  engine: EngineId
  speed: number
  /**
   * The theme `/` returns to. NOT a second copy of the active theme: it answers
   * a different question — "which theme should the hub restore to?" — and is
   * only read once, when the hub mounts.
   */
  hubTheme: ThemeId | null
  /** True while a wipe is alive. Never persisted. */
  running: boolean
  /** The click held back by the anti-overlap slot. Never persisted. */
  queued: PendingRun | null

  setTheme: (id: ThemeId) => void
  setEngine: (id: EngineId) => void
  setSpeed: (value: number) => void
  setHubTheme: (id: ThemeId) => void
  setRunning: (value: boolean) => void
  setQueued: (run: PendingRun | null) => void
}

/** The persisted slice: state minus the actions and minus the lock. */
type PersistedState = Pick<
  ThemeState,
  'theme' | 'engine' | 'speed' | 'hubTheme'
>

/**
 * Validates whatever came back from storage. A hand-edited or stale blob used
 * to reach the app through a cast, and the damage was quiet: the engine Select
 * kept a `value` matching none of its items and the loader silently ran native
 * while the picker still claimed GSAP.
 *
 * `persisted` is unknown by contract, so it gets narrowed field by field and
 * anything unrecognisable falls back to the default rather than the whole blob
 * being thrown away.
 */
function mergePersisted(persisted: unknown, current: ThemeState): ThemeState {
  if (typeof persisted !== 'object' || persisted === null) return current
  const saved = persisted as Partial<Record<keyof PersistedState, unknown>>

  return {
    ...current,
    theme: isThemeId(saved.theme) ? saved.theme : current.theme,
    engine: isEngineId(saved.engine) ? saved.engine : current.engine,
    speed:
      typeof saved.speed === 'number' ? clampSpeed(saved.speed) : current.speed,
    hubTheme: isThemeId(saved.hubTheme) ? saved.hubTheme : null,
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: DEFAULT_THEME,
      engine: DEFAULT_ENGINE,
      speed: DEFAULT_SPEED,
      hubTheme: null,
      running: false,
      queued: null,

      // The DOM write comes first and synchronously — see paintTheme.
      setTheme: (id) => {
        paintTheme(id)
        set({ theme: id })
      },
      setEngine: (id) => set({ engine: id }),
      setSpeed: (value) => set({ speed: clampSpeed(value) }),
      setHubTheme: (id) => set({ hubTheme: id }),
      setRunning: (value) => set({ running: value }),
      setQueued: (run) => set({ queued: run }),
    }),
    {
      name: 'vtd',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // The lock never persists. A stale one would leave the app booting up
      // convinced a wipe is already running, swallowing the first click.
      partialize: (state): PersistedState => ({
        theme: state.theme,
        engine: state.engine,
        speed: state.speed,
        hubTheme: state.hubTheme,
      }),
      merge: mergePersisted,
      // Write the sanitised values back over whatever was in storage. Without
      // this, mergePersisted fixes the state but the bad blob stays on disk
      // looking authoritative — confusing in a lab where you read localStorage
      // by hand, and it would resurface the moment merge ever changed.
      onRehydrateStorage: () => (state) => {
        state?.setSpeed(state.speed)
      },
    }
  )
)

/**
 * Writes the restored theme onto <html>. Call it before createRoot: since the
 * anti-FOUC script was removed nothing else sets the attributes on load, and
 * without this the page keeps the neutral :root palette until the first click.
 *
 * localStorage is synchronous, so persist has already rehydrated by the time
 * the store is created and this reads the restored value, not the default.
 */
export function hydrateDom() {
  paintTheme(useThemeStore.getState().theme)
}

/** Effective duration in ms, already scaled by the speed multiplier. */
export function getDuration(): number {
  return Math.round(BASE_DURATION / useThemeStore.getState().speed)
}

/* --- Selectors ------------------------------------------------------------ */

export function useThemeId(): ThemeId {
  return useThemeStore((state) => state.theme)
}

export function useEngineId(): EngineId {
  return useThemeStore((state) => state.engine)
}

export function useSpeed(): number {
  return useThemeStore((state) => state.speed)
}

export function useIsTransitioning(): boolean {
  return useThemeStore((state) => state.running)
}
