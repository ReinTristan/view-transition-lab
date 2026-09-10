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

describe('the engine and mode pair', () => {
  // Not every engine does every mode, so the mode cannot be set on its own.
  // Correcting it here — rather than at loaderFor — means the picker never shows
  // a pair that nothing can run.
  test('setEngine drags the mode to one the engine can run', () => {
    const store = () => useThemeStore.getState()

    store().setEngine('motion')
    expect(store().mode).toBe('bridge')

    store().setEngine('vanilla')
    expect(store().mode).toBe('native')
  })

  test('setMode refuses a mode the current engine cannot run', () => {
    const store = () => useThemeStore.getState()
    store().setEngine('motion')

    // overlay is declared by motion but has no module yet, so it is not
    // selectable. The day it lands, this falls out on its own.
    store().setMode('overlay')
    expect(store().mode).toBe('bridge')
  })

  test('an engine option falls back to the first choice, not to nothing', () => {
    const store = () => useThemeStore.getState()

    store().setEngineOption('tailwind', 'not-a-variant')
    expect(store().engineOptions.tailwind).toBe('core')

    // vanilla declares no option axis at all: there is nothing to write. The
    // choice is deliberately nonsense — it must not read as a real one.
    store().setEngineOption('vanilla', 'anything')
    expect(store().engineOptions.vanilla).toBeUndefined()
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

  test('a persisted mode is validated against its own engine', async () => {
    // bridge is a real mode and vanilla is a real engine — the pair is what is
    // wrong, which is why isTransitionMode alone would let this through.
    await rehydrateFrom({
      theme: 'glass',
      engine: 'vanilla',
      mode: 'bridge',
      speed: 1,
    })

    const state = useThemeStore.getState()
    expect(state.mode).toBe('native')
    // The rest of the blob survives: one bad field does not cost the others.
    expect(state.theme).toBe('glass')
    expect(state.speed).toBe(1)
  })

  test('a rotten engine option is cleaned entry by entry', async () => {
    await rehydrateFrom({
      engine: 'vanilla',
      engineOptions: { tailwind: 'gone-from-the-list', 'not-an-engine': 'x' },
    })

    const { engineOptions } = useThemeStore.getState()
    expect(engineOptions.tailwind).toBe('core')
    expect(Object.keys(engineOptions)).toEqual(['tailwind'])
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
    await rehydrateFrom({ theme: 'glass', engine: 'vanilla', speed: 9 })

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
    await rehydrateFrom({ theme: 'neobrutalism', engine: 'vanilla', speed: 1 })
    delete document.documentElement.dataset.theme

    hydrateDom()
    expect(document.documentElement.dataset.theme).toBe('neobrutalism')
  })
})
