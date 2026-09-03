import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { AppShell } from '@/components/layout/app-shell'
import { useThemeStore } from '@/themes/use-theme-store'

const SWAPPER = '[aria-label="Swap theme without leaving the hub"]'

function renderShell(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<div data-testid='page' />} />
          <Route path='theme/:themeId' element={<div data-testid='page' />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  // /theme/:id is pinned to a theme by definition, so a control that swaps
  // without navigating has nothing to say there.
  test('mounts the swapper on the hub only', async () => {
    const hub = await renderShell('/')
    expect(hub.container.querySelector(SWAPPER)).not.toBeNull()

    const route = await renderShell('/theme/pastel')
    expect(route.container.querySelector(SWAPPER)).toBeNull()
  })

  // aria-busy and not aria-disabled: nothing sets pointer-events and the
  // controls are not disabled — the browser simply stops routing clicks to them
  // while the pseudo-elements are painted.
  test('marks both panels busy while a wipe is alive', async () => {
    const screen = await renderShell('/')

    useThemeStore.getState().setRunning(true)
    await vi.waitFor(() => {
      const busy = screen.container.querySelectorAll('[aria-busy="true"]')
      expect(busy).toHaveLength(2)
    })

    useThemeStore.getState().setRunning(false)
    await vi.waitFor(() => {
      expect(
        screen.container.querySelectorAll('[aria-busy="true"]')
      ).toHaveLength(0)
    })
  })
})
