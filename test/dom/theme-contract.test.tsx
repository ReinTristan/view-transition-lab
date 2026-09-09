import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Card } from '@/components/ui/card'
import type { ThemeId } from '@/themes/registry'
import { themeList, themes } from '@/themes/registry'
import { applyTheme, declaredProperties, declaredValue } from '../helpers/css'

/**
 * The second layer every theme must define. The ~25 shadcn colour tokens are
 * not enough for seven autonomous aesthetics, and slots.css applies these
 * theme-agnostically — so a theme that skips one silently inherits a flat
 * treatment instead of failing loudly.
 */
const SURFACE_CONTRACT = [
  '--surface-bg',
  '--surface-blur',
  '--surface-border-w',
  '--surface-shadow',
  '--surface-gloss',
  '--glow',
  '--overlay-bg',
  '--overlay-blur',
]

describe.each(themeList.map((theme) => theme.id))('theme %s', (id) => {
  test('declares the whole surface contract', () => {
    const declared = declaredProperties(id)
    const missing = SURFACE_CONTRACT.filter((prop) => !declared.has(prop))

    expect(missing, `${id} declares no ${missing.join(', ')}`).toEqual([])
  })

  test('declares its own radius and typeface', () => {
    const declared = declaredProperties(id)

    expect(declared.has('--radius')).toBe(true)
    expect(declared.has('--theme-font-sans')).toBe(true)
  })

  test('paints the scheme the registry says', () => {
    applyTheme(id)
    expect(document.documentElement.dataset.scheme).toBe(themes[id].scheme)
  })

  // The cascade guard. index.css keeps a neutral :root of defaults, and it has
  // to stay a *default*: it lives in @layer base so the unlayered theme files
  // outrank it. Unlayered, it sat after their @imports and won on source order
  // at equal specificity — every theme computed 0.625rem and nothing painted.
  //
  // --radius and not a colour on purpose: a scalar compares as a string without
  // depending on how the browser normalises oklch() or a multi-line gradient.
  test('its own tokens beat the neutral defaults', () => {
    applyTheme(id)
    const computed = getComputedStyle(document.documentElement)
      .getPropertyValue('--radius')
      .trim()

    expect(computed).toBe(declaredValue(id, '--radius'))
  })
})

describe('the surface reaches the components', () => {
  async function cardStyle(id: ThemeId) {
    applyTheme(id)
    const screen = await render(<Card>surface</Card>)
    const card = screen.container.querySelector('[data-slot="card"]')
    expect(card).not.toBeNull()

    const style = getComputedStyle(card as Element)
    return { borderWidth: style.borderTopWidth, boxShadow: style.boxShadow }
  }

  // slots.css declares box-shadow to REPLACE the whole chain Tailwind composes,
  // ring included — a theme that merely thickened the border would get a 1px
  // halo. If this stops differing, that replacement has come undone.
  test('two opposite themes paint the same card differently', async () => {
    const soft = await cardStyle('pastel')
    const hard = await cardStyle('neobrutalism')

    expect(soft.borderWidth).not.toBe(hard.borderWidth)
    expect(soft.boxShadow).not.toBe(hard.boxShadow)
  })
})

describe('the theme decides lightness, never the system', () => {
  test('the dark variant keys on the attribute alone', async () => {
    const screen = await render(
      <div data-testid='probe' className='bg-blue-500 dark:bg-red-500' />
    )
    const probe = screen.container.querySelector(
      '[data-testid="probe"]'
    ) as HTMLElement

    document.documentElement.dataset.scheme = 'light'
    const light = getComputedStyle(probe).backgroundColor

    document.documentElement.dataset.scheme = 'dark'
    const dark = getComputedStyle(probe).backgroundColor

    // The OS preference is never touched here, and that is the point.
    expect(light).not.toBe(dark)
  })
})

/**
 * The scrollbar was the one piece of chrome no theme owned, so it stayed grey
 * while all seven changed everything around it.
 *
 * Deliberately NOT part of SURFACE_CONTRACT above: no theme declares these. The
 * default in index.css derives them from --foreground and --background, so all
 * seven get a matching bar for free and a theme only writes its own when it
 * wants something louder. Which is also why these assert the *computed*
 * property and not the token: unregistered custom properties compute to their
 * substitution value, so every theme would read back the same color-mix() text.
 */
describe('the scrollbar follows the theme', () => {
  test.each(themeList.map((theme) => theme.id))('%s colours its own', (id) => {
    applyTheme(id)
    const style = getComputedStyle(document.documentElement)

    expect(style.scrollbarColor).not.toBe('auto')
    expect(style.scrollbarWidth).toBe('auto')
  })

  // The proof the derivation is real and not a shared grey: the lightest theme
  // and the only dark one cannot land on the same thumb.
  test('two opposite themes do not land on the same colour', () => {
    applyTheme('pastel')
    const light = getComputedStyle(document.documentElement).scrollbarColor
    applyTheme('cyberpunk')
    const dark = getComputedStyle(document.documentElement).scrollbarColor

    expect(light).not.toBe(dark)
  })
})
