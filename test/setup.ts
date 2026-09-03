import { afterEach, beforeEach, vi } from 'vitest'
import { DEFAULT_THEME } from '@/themes/registry'
import { DEFAULT_SPEED, useThemeStore } from '@/themes/use-theme-store'
import { cleanup } from '@/transitions/dom'
import { DEFAULT_ENGINE } from '@/transitions/types'
// Pulls in compiled Tailwind, the 7 theme files, slots.css and transitions.css
// — including the @property registration for --vt-progress. Without it there is
// no keepalive and no surface contract to read.
import '@/index.css'

// The store is a module singleton with persist middleware, so without this the
// tests contaminate each other in whatever order they happen to run.
beforeEach(() => {
  localStorage.clear()
  useThemeStore.setState({
    theme: DEFAULT_THEME,
    engine: DEFAULT_ENGINE,
    speed: DEFAULT_SPEED,
    hubTheme: null,
    running: false,
    queued: null,
  })

  const root = document.documentElement
  delete root.dataset.theme
  delete root.dataset.scheme
  delete root.dataset.vtRunning
  // cleanup() already knows the --vt-* list and data-vt-mode; repeating it here
  // would be a second copy to keep in sync.
  cleanup()
})

afterEach(() => {
  vi.restoreAllMocks()
})
