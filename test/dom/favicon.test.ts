import { describe, expect, test } from 'vitest'
import { faviconSvg } from '@/themes/favicon'
import { DEFAULT_THEME, themeList, themes } from '@/themes/registry'
import { useThemeStore } from '@/themes/use-theme-store'
// ?raw and not fetch('/favicon.svg'): in browser mode the served root is
// Vitest's own, so that URL returns Vitest's favicon, not the project's.
import staticFavicon from '../../public/favicon.svg?raw'

function currentIcon(): string {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  expect(link, 'no link[rel=icon] in the document').not.toBeNull()
  return decodeURIComponent(
    (link as HTMLLinkElement).href.replace('data:image/svg+xml,', '')
  )
}

describe.each(themeList.map((theme) => theme.id))('theme %s', (id) => {
  // The favicon is painted from inside paintTheme, so it rides along with
  // data-theme instead of reacting to it. A new theme is covered by this the
  // day it lands in the registry, with no test to write.
  test('paints its swatch into the tab icon', () => {
    useThemeStore.getState().setTheme(id)
    const svg = currentIcon()

    for (const color of themes[id].swatch) {
      expect(svg, `${id} is missing ${color}`).toContain(color)
    }
  })
})

describe('the tab icon', () => {
  test('is a data URI, so it costs no request', () => {
    useThemeStore.getState().setTheme('cyberpunk')
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

    expect(link?.href.startsWith('data:image/svg+xml,')).toBe(true)
    expect(link?.type).toBe('image/svg+xml')
  })

  test('changes when the theme does', () => {
    useThemeStore.getState().setTheme('pastel')
    const soft = currentIcon()
    useThemeStore.getState().setTheme('neobrutalism')

    expect(currentIcon()).not.toBe(soft)
  })
})

describe('the static fallback', () => {
  // public/favicon.svg covers the moment before the bundle runs, so its colours
  // are a second copy of the default theme's swatch. This is what makes that
  // copy fail loudly instead of quietly showing the wrong theme.
  test('matches what the default theme would paint', () => {
    expect(staticFavicon.trim()).toBe(faviconSvg(themes[DEFAULT_THEME].swatch))
  })
})
