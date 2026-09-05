import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useThemeStore } from '@/themes/use-theme-store'
import { runTransition } from '@/transitions'
import { CENTRE, settle, watchRootAttributes } from '../helpers/lab'

const store = () => useThemeStore.getState()

beforeEach(() => {
  // The shortest wipe the slider allows, so the suite is not mostly waiting.
  store().setSpeed(2)
  store().setEngine('native')
})

describe('the busy flag', () => {
  test('is raised synchronously and dropped when the wipe ends', async () => {
    const running = runTransition('y2k', CENTRE)

    // No await: setRunning happens before the engine loader is awaited, which
    // is the whole point — a React commit would race the snapshot capture.
    expect(store().running).toBe(true)
    expect(document.documentElement.hasAttribute('data-vt-running')).toBe(true)

    await running
    expect(store().running).toBe(false)
    expect(document.documentElement.hasAttribute('data-vt-running')).toBe(false)
  })
})

describe('the anti-overlap slot', () => {
  test('a change arriving mid-wipe is held, not run', async () => {
    const first = runTransition('y2k', CENTRE)
    await runTransition('glass', CENTRE)

    expect(store().queued?.theme).toBe('glass')
    expect(document.documentElement.dataset.theme).not.toBe('glass')

    await first
    await settle()
  })

  test('the last one wins, and the ones in between are dropped', async () => {
    const first = runTransition('y2k', CENTRE)
    await runTransition('glass', CENTRE)
    await runTransition('frutiger', CENTRE)

    // A single slot, not a queue: chaining every click would keep painting
    // wipes long after you stopped clicking.
    expect(store().queued?.theme).toBe('frutiger')

    await first
    await settle()
    expect(document.documentElement.dataset.theme).toBe('frutiger')
  })

  test('a throwing run still releases the slot and drains it', async () => {
    // Only the first transition is sabotaged; the drained one runs for real.
    // Faked rather than thrown from `mutate` on purpose: a real callback that
    // throws also rejects the transition's `ready` and `updateCallbackDone`,
    // which nothing awaits, and the test would drown in unhandled rejections
    // that say nothing about the slot.
    vi.spyOn(document, 'startViewTransition').mockImplementationOnce((arg) => {
      if (typeof arg === 'function') arg()
      const finished = Promise.reject(new Error('engine exploded'))
      finished.catch(() => {
        /* handled here so the fake rejection is not reported as unhandled */
      })
      return {
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        finished,
        skipTransition: () => {
          /* nothing to skip: this transition is a stand-in */
        },
      } as unknown as ReturnType<Document['startViewTransition']>
    })

    const boom = runTransition('y2k', CENTRE)
    await runTransition('glass', CENTRE)

    // The failure is not swallowed — but the lock is released in the finally,
    // so a broken engine cannot strand the app with a wipe that never ends.
    await expect(boom).rejects.toThrow()
    await settle()

    expect(store().running).toBe(false)
    expect(store().queued).toBeNull()
    expect(document.documentElement.dataset.theme).toBe('glass')
  })
})

describe('the mutation window', () => {
  test('mutate lands in the same DOM mutation as the theme', async () => {
    const watcher = watchRootAttributes()

    await runTransition('cyberpunk', CENTRE, () => {
      document.documentElement.dataset.testMarker = 'landed'
    })
    watcher.stop()

    // Same batch, not two turns of the task queue: anything left to React's
    // batching would commit after the "new" snapshot was taken and pop in
    // instead of being wiped in.
    const together = watcher.batches.some(
      (batch) =>
        batch.includes('data-theme') && batch.includes('data-test-marker')
    )
    expect(together).toBe(true)

    delete document.documentElement.dataset.testMarker
  })
})

describe('an engine with no loader', () => {
  test('warns and corrects the selection instead of degrading quietly', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* silenced: the warning is the assertion, not noise */
    })
    store().setEngine('tailwind')

    await runTransition('glass', CENTRE)

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('no loader for "tailwind"')
    )
    // The picker must stop announcing an engine that is not the one running.
    expect(store().engine).toBe('native')
  })
})
