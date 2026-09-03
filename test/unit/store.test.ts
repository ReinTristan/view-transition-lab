import { beforeEach, describe, expect, test } from 'vitest'
import { DEFAULT_THEME } from '@/themes/registry'
import {
  BASE_DURATION,
  DEFAULT_SPEED,
  getDuration,
  hydrateDom,
  useThemeStore,
} from '@/themes/use-theme-store'

/** What persist actually wrote to disk, already parsed. */
function readPersisted(): Record<string, unknown> {
  const raw = localStorage.getItem('vtd')
  expect(raw).not.toBeNull()
  const parsed = JSON.parse(raw ?? '{}') as { state: Record<string, unknown> }
  return parsed.state
}

/** Puts a blob on disk and makes persist read it, merge included. */
async function rehydrateFrom(state: Record<string, unknown>) {
  localStorage.setItem('vtd', JSON.stringify({ state, version: 1 }))
  await useThemeStore.persist.rehydrate()
}

describe('speed', () => {
  test.each([
    [3, 2],
    [-1, 0.25],
    [0.4, 0.5],
    [0.3, 0.25],
    [1.13, 1.25],
  ])('setSpeed(%s) clamps and quantises to %s', (input, expected) => {
    useThemeStore.getState().setSpeed(input)
    expect(useThemeStore.getState().speed).toBe(expected)
  })

  test.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'setSpeed(%s) falls back to the default',
    (input) => {
      useThemeStore.getState().setSpeed(input)
      expect(useThemeStore.getState().speed).toBe(DEFAULT_SPEED)
    }
  )

  test('getDuration scales the base duration', () => {
    useThemeStore.getState().setSpeed(2)
    expect(getDuration()).toBe(Math.round(BASE_DURATION / 2))
  })
})

describe('persistence', () => {
  test('a bad field falls back on its own, without dropping the whole blob', async () => {
    await rehydrateFrom({
      theme: 'not-a-theme',
      engine: 'motion',
      speed: 1.5,
      hubTheme: 'also-not-a-theme',
    })

    const state = useThemeStore.getState()
    expect(state.theme).toBe(DEFAULT_THEME)
    expect(state.engine).toBe('motion')
    expect(state.speed).toBe(1.5)
    expect(state.hubTheme).toBeNull()
  })

  test('a non-object blob leaves the current state alone', async () => {
    useThemeStore.getState().setTheme('cyberpunk')
    await rehydrateFrom('nonsense' as unknown as Record<string, unknown>)
    expect(useThemeStore.getState().theme).toBe('cyberpunk')
  })

  test('the lock never reaches disk', () => {
    const store = useThemeStore.getState()
    store.setRunning(true)
    store.setQueued({ theme: 'y2k', origin: { x: 0, y: 0 } })

    const persisted = readPersisted()
    expect(persisted).not.toHaveProperty('running')
    expect(persisted).not.toHaveProperty('queued')
    expect(persisted.theme).toBe(DEFAULT_THEME)
  })

  test('a stale speed is rewritten on disk, not just in memory', async () => {
    await rehydrateFrom({ theme: 'glass', engine: 'native', speed: 9 })

    expect(useThemeStore.getState().speed).toBe(2)
    expect(readPersisted().speed).toBe(2)
  })
})

describe('the DOM as render target', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme
    delete document.documentElement.dataset.scheme
  })

  test('setTheme paints the attributes synchronously', () => {
    useThemeStore.getState().setTheme('cyberpunk')

    // No await, no tick: if this ever needs one, startViewTransition would be
    // capturing a "new" snapshot identical to the old one and the wipe would
    // render empty.
    expect(document.documentElement.dataset.theme).toBe('cyberpunk')
    expect(document.documentElement.dataset.scheme).toBe('dark')
  })

  test('the scheme comes from the registry, not from the system', () => {
    useThemeStore.getState().setTheme('pastel')
    expect(document.documentElement.dataset.scheme).toBe('light')
  })

  test('setRunning paints and removes the busy attribute', () => {
    useThemeStore.getState().setRunning(true)
    expect(document.documentElement.hasAttribute('data-vt-running')).toBe(true)

    useThemeStore.getState().setRunning(false)
    // Removed, not left as an empty string: the CSS selector matches on
    // presence alone.
    expect(document.documentElement.hasAttribute('data-vt-running')).toBe(false)
  })

  test('hydrateDom paints the restored theme', async () => {
    await rehydrateFrom({ theme: 'neobrutalism', engine: 'native', speed: 1 })
    delete document.documentElement.dataset.theme

    hydrateDom()
    expect(document.documentElement.dataset.theme).toBe('neobrutalism')
  })
})
