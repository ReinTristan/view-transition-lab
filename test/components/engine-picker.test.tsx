import { describe, expect, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { EnginePicker } from '@/components/controls/engine-picker'
import { useThemeStore } from '@/themes/use-theme-store'
import { engineList } from '@/transitions'

async function openTheSelect() {
  const screen = await render(<EnginePicker />)
  const trigger = screen.container.querySelector(
    '[data-slot="select-trigger"]'
  ) as HTMLElement

  await userEvent.click(trigger)
  await vi.waitFor(() => {
    expect(document.querySelectorAll('[data-slot="select-item"]').length).toBe(
      engineList.length
    )
  })

  return Array.from(document.querySelectorAll('[data-slot="select-item"]'))
}

describe('EnginePicker', () => {
  test('names the engine the store has selected', async () => {
    useThemeStore.getState().setEngine('motion')
    const screen = await render(<EnginePicker />)

    // The label from engineList, not the raw id: SelectValue is handed a
    // formatter. Harmless-looking for native/motion, but it is what keeps the
    // trigger from printing 'gsap' next to 'Native' the day GSAP lands.
    expect(
      screen.container.querySelector('[data-slot="select-trigger"]')
        ?.textContent
    ).toContain('Motion')
  })

  // An engine with no loader must not look pickable: choosing it would run
  // native while the picker claimed otherwise.
  test('offers every engine but blocks the ones not implemented', async () => {
    const items = await openTheSelect()

    for (const engine of engineList) {
      const item = items.find((node) =>
        node.textContent?.includes(engine.label)
      )
      expect(item, `no item for ${engine.label}`).toBeDefined()

      if (engine.ready) {
        expect(item?.hasAttribute('data-disabled')).toBe(false)
      } else {
        expect(item?.hasAttribute('data-disabled')).toBe(true)
        expect(item?.textContent).toContain('pending')
      }
    }
  })

  test('picking an implemented engine writes it to the store', async () => {
    const items = await openTheSelect()
    const motion = items.find((node) =>
      node.textContent?.includes('Motion')
    ) as HTMLElement

    await userEvent.click(motion)
    await vi.waitFor(() => {
      expect(useThemeStore.getState().engine).toBe('motion')
    })
  })
})
