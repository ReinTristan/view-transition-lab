import { describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SpeedSlider } from '@/components/controls/speed-slider'
import {
  BASE_DURATION,
  SPEED_MAX,
  SPEED_MIN,
  SPEED_STEP,
  useThemeStore,
} from '@/themes/use-theme-store'

describe('SpeedSlider', () => {
  // The range lives in the store because that is also what clamps whatever
  // comes back from localStorage. Repeating the numbers here would let the
  // widget and the persisted value drift apart.
  test('takes its range from the store, not from its own numbers', async () => {
    const screen = await render(<SpeedSlider />)
    // The visually hidden range input base-ui renders is where the real
    // min/max/step end up.
    const input = screen.container.querySelector('input[type="range"]')

    expect(input?.getAttribute('min')).toBe(String(SPEED_MIN))
    expect(input?.getAttribute('max')).toBe(String(SPEED_MAX))
    expect(input?.getAttribute('step')).toBe(String(SPEED_STEP))
  })

  test('the readout follows the store', async () => {
    const screen = await render(<SpeedSlider />)
    expect(screen.container.textContent).toContain(`1× · ${BASE_DURATION}ms`)

    useThemeStore.getState().setSpeed(2)
    await vi.waitFor(() => {
      expect(screen.container.textContent).toContain(
        `2× · ${BASE_DURATION / 2}ms`
      )
    })
  })
})
