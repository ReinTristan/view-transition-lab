import { describe, expect, test } from 'vitest'
import type { ThemeId } from '@/themes/registry'
import { DEFAULT_THEME, isThemeId, themeList, themes } from '@/themes/registry'
import { engineList } from '@/transitions'
import { DEFAULT_ENGINE, ENGINE_IDS, isEngineId } from '@/transitions/types'

/**
 * The engine modules as Vite sees them — a record of lazy `import()`s, plus the
 * list of what exists. Used to check that `ready` is not a claim: an engine that
 * advertises itself as implemented has to have a module that actually loads and
 * exposes a `run`.
 *
 * The pattern takes the `@` alias, but the keys come back resolved from the
 * project root, so that is what the lookup below has to use.
 */
const engineModules = import.meta.glob<Record<string, unknown>>(
  '@/transitions/*.ts'
)

describe('guards', () => {
  test.each([undefined, null, 42, '', 'pastels', 'PASTEL', {}])(
    'isThemeId(%o) is false',
    (value) => {
      expect(isThemeId(value)).toBe(false)
    }
  )

  test.each([undefined, null, 42, '', 'motions', 'Motion', {}])(
    'isEngineId(%o) is false',
    (value) => {
      expect(isEngineId(value)).toBe(false)
    }
  )

  test('every registered id passes its own guard', () => {
    for (const id of Object.keys(themes)) expect(isThemeId(id)).toBe(true)
    for (const id of ENGINE_IDS) expect(isEngineId(id)).toBe(true)
  })

  test('the defaults are valid ids', () => {
    expect(isThemeId(DEFAULT_THEME)).toBe(true)
    expect(isEngineId(DEFAULT_ENGINE)).toBe(true)
  })
})

describe('theme registry', () => {
  test('every entry knows its own key', () => {
    for (const [key, meta] of Object.entries(themes)) {
      expect(meta.id).toBe(key)
    }
  })

  test('themeList is the whole registry', () => {
    expect(themeList).toHaveLength(Object.keys(themes).length)
    expect(themeList.map((theme) => theme.id).sort()).toEqual(
      Object.keys(themes).sort()
    )
  })

  test('every theme carries a three-colour swatch and a scheme', () => {
    for (const theme of themeList) {
      expect(theme.swatch).toHaveLength(3)
      expect(['light', 'dark']).toContain(theme.scheme)
    }
  })
})

describe('engine registry', () => {
  test('engineList covers every engine id exactly once', () => {
    const ids = engineList.map((engine) => engine.id)
    expect(ids.sort()).toEqual([...ENGINE_IDS].sort())
    expect(new Set(ids).size).toBe(ids.length)
  })

  // The guard against an engine announcing itself before it exists — the drift
  // that once had the picker saying GSAP while native ran.
  test.each(engineList.filter((engine) => engine.ready).map((e) => e.id))(
    '%s claims ready and really loads',
    async (id) => {
      const load = engineModules[`/src/transitions/${id}.ts`]
      expect(load, `no module for "${id}"`).toBeDefined()

      const mod = await load()
      const engine = Object.values(mod).find(
        (value): value is { run: unknown } =>
          typeof value === 'object' && value !== null && 'run' in value
      )
      expect(engine).toBeDefined()
      expect(typeof engine?.run).toBe('function')
    }
  )

  test('every engine declares at least one mode', () => {
    for (const engine of engineList) {
      expect(engine.modes.length).toBeGreaterThan(0)
    }
  })
})

describe('cross-checks', () => {
  test('every theme id has a CSS file imported by index.css', async () => {
    const files = import.meta.glob('@/styles/themes/*.css')
    const names = Object.keys(files).map(
      (path) => path.split('/').pop()?.replace('.css', '') as ThemeId
    )
    for (const id of Object.keys(themes)) expect(names).toContain(id)
  })
})
