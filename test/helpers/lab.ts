import { expect, vi } from 'vitest'
import { useThemeStore } from '@/themes/use-theme-store'

/** Centre of the viewport — the origin the route effects use. */
export const CENTRE = { x: 0, y: 0 }

/** Waits until no wipe is alive, draining anything the slot held back. */
export async function settle(timeout = 5000) {
  await vi.waitFor(
    () => {
      expect(useThemeStore.getState().running).toBe(false)
    },
    { timeout, interval: 10 }
  )
}

/**
 * Makes prefersReducedMotion() answer true. dom.ts calls window.matchMedia at
 * call time, so a spy is enough and it is undone by restoreAllMocks.
 */
export function fakeReducedMotion() {
  vi.spyOn(window, 'matchMedia').mockReturnValue({
    matches: true,
  } as MediaQueryList)
}

/**
 * Takes the View Transitions API away for the duration of one test.
 *
 * It has to come off Document.prototype: supportsViewTransitions() asks with
 * `in`, which walks the prototype chain, so deleting an own property on the
 * document instance would change nothing.
 */
export function withoutViewTransitions(): () => void {
  const descriptor = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'startViewTransition'
  )
  Reflect.deleteProperty(Document.prototype, 'startViewTransition')

  return () => {
    if (descriptor) {
      Object.defineProperty(
        Document.prototype,
        'startViewTransition',
        descriptor
      )
    }
  }
}

/** Records which attributes of <html> changed together in one batch. */
export function watchRootAttributes() {
  const batches: string[][] = []
  const observer = new MutationObserver((records) => {
    batches.push(
      records
        .map((record) => record.attributeName)
        .filter((name): name is string => name !== null)
    )
  })
  observer.observe(document.documentElement, { attributes: true })

  return {
    batches,
    stop: () => observer.disconnect(),
  }
}
