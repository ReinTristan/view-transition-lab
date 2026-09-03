import { describe, expect, test } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { ThemeSwapper } from '@/components/controls/theme-swapper'
import { themeList } from '@/themes/registry'
import { useThemeStore } from '@/themes/use-theme-store'
import { settle } from '../helpers/lab'

describe('ThemeSwapper', () => {
  test('the swatch-only buttons keep an accessible name', async () => {
    const screen = await render(<ThemeSwapper />)

    for (const theme of themeList) {
      expect(
        screen.container.querySelector(`[aria-label="${theme.label}"]`)
      ).not.toBeNull()
    }
  })

  // It swaps without leaving the page, and remembers what the hub goes back to.
  test('writes the hub marker instead of navigating', async () => {
    const screen = await render(<ThemeSwapper />)
    const button = screen.container.querySelector(
      '[aria-label="Cyberpunk"]'
    ) as HTMLElement

    await userEvent.click(button)
    await settle()

    expect(useThemeStore.getState().hubTheme).toBe('cyberpunk')
    expect(useThemeStore.getState().theme).toBe('cyberpunk')
  })
})
