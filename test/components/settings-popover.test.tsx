import { describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { SettingsPopover } from '@/components/controls/settings-popover'
import { useThemeStore } from '@/themes/use-theme-store'
import { engineMeta } from '@/transitions'

/** Opens the popover and hands back the popup, which portalizes into body. */
async function openSettings() {
  const screen = await render(<SettingsPopover />)
  await userEvent.click(
    screen.container.querySelector(
      '[data-slot="popover-trigger"]'
    ) as HTMLElement
  )

  return await vi.waitFor(() => {
    const popup = document.querySelector('[data-slot="popover-content"]')
    expect(popup).not.toBeNull()
    return popup as HTMLElement
  })
}

/** The trigger of one control, by the id its label points at. */
function control(popup: HTMLElement, id: string) {
  return popup.querySelector(`#${id}`)
}

describe('SettingsPopover', () => {
  test('carries the chrome font class into the portal', async () => {
    const popup = await openSettings()

    // The popup is a child of body, so it is outside .app-chrome and outside
    // #root. Without the class it would take the active theme's typeface AND
    // would stop matching the busy-state selector in transitions.css.
    expect(popup.classList.contains('app-chrome')).toBe(true)
  })

  test('holds the axes the bar no longer shows', async () => {
    const popup = await openSettings()

    expect(control(popup, 'engine')).not.toBeNull()
    expect(control(popup, 'mode')).not.toBeNull()
    expect(popup.querySelector('input[type="range"]')).not.toBeNull()
  })

  // The option axis is declared by the engine, not by the bar: nothing here
  // knows the word "tailwind".
  test('shows an engine-owned axis only for the engine that declares one', async () => {
    const popup = await openSettings()
    expect(popup.querySelector('[id^="engine-option-"]')).toBeNull()

    useThemeStore.getState().setEngine('tailwind')
    await vi.waitFor(() => {
      expect(popup.querySelector('[id^="engine-option-"]')).not.toBeNull()
    })
  })

  test('offers every mode the engine declares and blocks the ones with no module', async () => {
    useThemeStore.getState().setEngine('motion')
    const popup = await openSettings()
    const motion = engineMeta('motion')

    await userEvent.click(control(popup, 'mode') as HTMLElement)
    // Scoped to the popup that is actually open: the settings panel holds more
    // than one select, and Base UI keeps every list in the DOM.
    const items = await vi.waitFor(() => {
      const found = document.querySelectorAll(
        '[data-slot="select-content"][data-open] [data-slot="select-item"]'
      )
      expect(found.length).toBe(motion.modes.length)
      return Array.from(found)
    })

    const overlay = items.find((node) =>
      node.textContent?.includes('overlay')
    ) as HTMLElement
    // Declared but not implemented: visible, so the axis reads as a map, and
    // blocked, so it cannot announce something that would not run.
    expect(overlay.hasAttribute('data-disabled')).toBe(true)
    expect(overlay.textContent).toContain('pending')
  })

  // The scrollbar bug, and the test that would have caught it. Base UI ships
  // Select.Root with modal={true}, which locks page scroll while the list is
  // open: <body> gets an inline overflow:hidden and, on a browser with classic
  // scrollbars, <html> gets a scrollbar-gutter to pay back the 15px — the page
  // bar disappears and its reserved groove stays painted in its place.
  //
  // The popover was never the culprit: Popover.Root defaults to modal={false}.
  // control-select.tsx turns the select's off.
  test('opening a select does not lock page scroll', async () => {
    const popup = await openSettings()
    await userEvent.click(control(popup, 'engine') as HTMLElement)
    await vi.waitFor(() => {
      expect(
        document.querySelector('[data-slot="select-content"][data-open]')
      ).not.toBeNull()
    })
    // The lock is acquired from a setTimeout(0), so an absence has to be given
    // room to fail to appear.
    await new Promise((resolve) => setTimeout(resolve, 50))

    const root = document.documentElement
    expect(document.body.getAttribute('style') ?? '').not.toContain('overflow')
    expect(root.getAttribute('style') ?? '').not.toContain('overflow')
    expect(root.hasAttribute('data-base-ui-scroll-locked')).toBe(false)
  })

  test('the mode select follows the engine instead of keeping an impossible pair', async () => {
    useThemeStore.getState().setEngine('motion')
    const popup = await openSettings()
    expect(control(popup, 'mode')?.textContent).toContain('bridge')

    useThemeStore.getState().setEngine('vanilla')
    await vi.waitFor(() => {
      expect(control(popup, 'mode')?.textContent).toContain('native')
    })
  })
})
