import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { Card } from '@/components/ui/card'
import type { ThemeId } from '@/themes/registry'
import { themeList, themes } from '@/themes/registry'
import { applyTheme, declaredProperties } from '../helpers/css'

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
