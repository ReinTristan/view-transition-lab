import { useCallback, useMemo, useSyncExternalStore } from 'react'

// useSyncExternalStore and not useState + useEffect: the snapshot is read
// during render, so the first paint already has the right value. The effect
// version renders false, paints, and only then corrects itself — which is why
// those hooks end up exposing an isLoading flag to cover the flash.
export function useMediaQuery(query: string) {
  // One MediaQueryList shared by both callbacks. getSnapshot runs on every
  // render, and calling matchMedia there would allocate a new list each time.
  const mql = useMemo(() => window.matchMedia(query), [query])

  const subscribe = useCallback(
    (cb: () => void) => {
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    [mql]
  )

  return useSyncExternalStore(subscribe, () => mql.matches)
}

// 768px is Tailwind's md:, so what JS decides and what the classes decide flip
// on the same pixel. A max-width variant would not: it overlaps at exactly 768,
// where both it and md: are true at once.
export const useIsDesktop = () => useMediaQuery('(min-width: 768px)')
export const useIsTouch = () => useMediaQuery('(pointer: coarse)')
