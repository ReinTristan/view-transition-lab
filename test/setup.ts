import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup as unmountComponents } from 'vitest-browser-react'
import { DEFAULT_THEME } from '@/themes/registry'
import { DEFAULT_SPEED, useThemeStore } from '@/themes/use-theme-store'
import { cleanup } from '@/transitions/dom'
import { DEFAULT_ENGINE, DEFAULT_MODE } from '@/transitions/types'
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
    mode: DEFAULT_MODE,
    engineOptions: {},
    speed: DEFAULT_SPEED,
    hubTheme: null,
    running: false,
    queued: null,
  })

  const root = document.documentElement
  delete root.dataset.theme
  delete root.dataset.scheme
  delete root.dataset.vtRunning
  // cleanup() already knows the --vt-* list and the data-vt-* attributes;
  // repeating it here would be a second copy to keep in sync.
  cleanup()
})

afterEach(async () => {
  vi.restoreAllMocks()
  // Unmount whatever a test rendered. Without this the trees pile up, and the
  // ones that portalize into body — popover, select, dialog — leave open popups
  // covering the page: the next test's click gets intercepted by a panel from
  // the previous one, and document-wide queries count items twice.
  await unmountComponents()
})
