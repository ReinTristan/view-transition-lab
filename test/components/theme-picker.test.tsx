import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { ThemePicker } from '@/components/controls/theme-picker'
import { themeList } from '@/themes/registry'
import { useThemeStore } from '@/themes/use-theme-store'
import { settle } from '../helpers/lab'

function Location() {
  return <span data-testid='location'>{useLocation().pathname}</span>
}

function renderPicker() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemePicker />
      <Location />
    </MemoryRouter>
  )
}

describe('ThemePicker', () => {
  test('renders one button per registered theme', async () => {
    const screen = await renderPicker()
    const buttons = screen.container.querySelectorAll('[data-slot="button"]')

    expect(buttons).toHaveLength(themeList.length)
    for (const theme of themeList) {
      expect(screen.container.textContent).toContain(theme.label)
    }
  })

  test('marks only the active theme as pressed', async () => {
    useThemeStore.getState().setTheme('glass')
    const screen = await renderPicker()

    const pressed = screen.container.querySelectorAll('[aria-pressed="true"]')
    expect(pressed).toHaveLength(1)
    expect(pressed[0].textContent).toContain('Glassmorphism')
  })

  test('flags the themes whose design is still pending', async () => {
    const screen = await renderPicker()
    const wip = screen.container.querySelectorAll('[data-slot="button"]')
    const flagged = Array.from(wip).filter((button) =>
      button.textContent?.includes('wip')
    )

    expect(flagged).toHaveLength(
      themeList.filter((theme) => theme.status === 'pending').length
    )
  })

  // The wipe grows from where you clicked, which is why the handler takes the
  // event and not just the id.
  test('takes the wipe origin from the click point', async () => {
    useThemeStore.getState().setSpeed(0.25)
    const screen = await renderPicker()

    const button = screen.container.querySelector(
      '[aria-pressed="false"]'
    ) as HTMLElement
    const box = button.getBoundingClientRect()

    await userEvent.click(button)
    await vi.waitFor(() => {
      expect(
        document.documentElement.style.getPropertyValue('--vt-x')
      ).not.toBe('')
    })

    const x = Number.parseFloat(
      document.documentElement.style.getPropertyValue('--vt-x')
    )
    const y = Number.parseFloat(
      document.documentElement.style.getPropertyValue('--vt-y')
    )

    expect(x).toBeGreaterThanOrEqual(box.left)
    expect(x).toBeLessThanOrEqual(box.right)
    expect(y).toBeGreaterThanOrEqual(box.top)
    expect(y).toBeLessThanOrEqual(box.bottom)

    await settle()
  })

  // The picker is the navigation: that is what separates it from the swapper.
  test('routes to the theme it swaps to', async () => {
    const screen = await renderPicker()
    const button = screen.container.querySelector(
      '[aria-pressed="false"]'
    ) as HTMLElement
    const id = themeList.find((theme) =>
      button.textContent?.includes(theme.label)
    )?.id

    await userEvent.click(button)
    await settle()

    const location = screen.container.querySelector('[data-testid="location"]')
    expect(location?.textContent).toBe(`/theme/${id}`)
  })
})
