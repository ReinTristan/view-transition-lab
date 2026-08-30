import { useCallback } from 'react'
import type { ThemeId } from '@/themes/registry'
import { runTransition } from '@/transitions'

/**
 * Returns a click handler that switches the theme using the active engine's
 * wipe, taking the click point as the origin.
 *
 * It lives here and not in the store on purpose: it imports runTransition, and
 * transitions/index.ts imports the store — putting it there would close a real
 * module cycle.
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
