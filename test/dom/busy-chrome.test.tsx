import { describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'
import { CHROME_PANEL } from '@/components/layout/chrome'
import { Button } from '@/components/ui/button'

async function renderChrome() {
  const screen = await render(
    <div className={CHROME_PANEL}>
      <Button>Theme</Button>
    </div>
  )
  return screen.container.querySelector('[data-slot="button"]') as HTMLElement
}

/**
 * The visual half of the busy state. It is CSS keyed on data-vt-running, which
 * setRunning writes synchronously, and nothing in React defends it.
 */
describe('the chrome while a wipe runs', () => {
  test('the controls dim', async () => {
    const button = await renderChrome()
    expect(getComputedStyle(button).opacity).toBe('1')

    document.documentElement.dataset.vtRunning = ''
    expect(getComputedStyle(button).opacity).toBe('0.5')
  })

  // button.tsx carries transition-all, so without `transition: none` the
  // opacity would ease from 1 to 0.5. The browser captures the old snapshot at
  // t=0, when that ease has barely started, and freezes it: the control ends up
  // dimmed on the live half of the wipe and bright on the frozen one, split
  // down the middle by the circle's edge.
  test('the dimming snaps instead of easing', async () => {
    const button = await renderChrome()
    document.documentElement.dataset.vtRunning = ''

    expect(getComputedStyle(button).transitionDuration).toBe('0s')
  })

  // The cursor follows the hit-tested element, and mid-wipe that is the root —
  // which is why the rule lives on :root and not on the controls.
  test('the progress cursor goes on the root', async () => {
    await renderChrome()
    document.documentElement.dataset.vtRunning = ''

    expect(getComputedStyle(document.documentElement).cursor).toBe('progress')
  })
})
