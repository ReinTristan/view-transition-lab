import { useCallback, useSyncExternalStore } from 'react'
import { runTransition } from '@/transitions'
import type { ThemeId } from './registry'
import {
  getEngine,
  getSpeed,
  getTheme,
  setEngine,
  setSpeed,
  subscribe,
} from './store'

/**
 * Reads the theme from the DOM via useSyncExternalStore. React only mirrors the
 * value to render the picker UI; writing is applyTheme's job.
 */
export function useThemeId(): ThemeId {
  return useSyncExternalStore(subscribe, getTheme)
}

export function useEngineId() {
  return useSyncExternalStore(subscribe, getEngine)
}

export function useSpeed() {
  return useSyncExternalStore(subscribe, getSpeed)
}

/**
 * Returns a click handler that switches the theme using the active engine's
 * wipe, taking the click point as the origin.
 *
 * `mutate` is handed straight to runTransition, so whatever it does happens in
 * the same DOM mutation as the theme swap.
 */
export function useThemeSwitcher() {
  return useCallback(
    (
      id: ThemeId,
      event?: { clientX: number; clientY: number },
      mutate?: () => void
    ) => {
      const origin = event
        ? { x: event.clientX, y: event.clientY }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2 }
      return runTransition(id, origin, mutate)
    },
    []
  )
}

export { setEngine, setSpeed }
