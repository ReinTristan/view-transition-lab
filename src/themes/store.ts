import type { EngineId } from '@/transitions/types'
import type { ThemeId } from './registry'
import { DEFAULT_THEME, isThemeId, themes } from './registry'

const KEY_THEME = 'vtd:theme'
const KEY_ENGINE = 'vtd:engine'
const KEY_SPEED = 'vtd:speed'
const KEY_HUB_THEME = 'vtd:hub-theme'

/** Base wipe duration, before applying the multiplier. */
export const BASE_DURATION = 600

const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Safari in private mode can throw on write. The change is already applied
    // to the DOM, so all that is lost is persistence.
  }
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

/* --- Theme ---------------------------------------------------------------- */

/**
 * The DOM is the source of truth, not a useState. The anti-FOUC script in
 * index.html already set the attribute before the first paint.
 */
export function getTheme(): ThemeId {
  const current = document.documentElement.dataset.theme
  return isThemeId(current) ? current : DEFAULT_THEME
}

/**
 * The only theme write in the whole app, and always synchronous.
 *
 * If the theme lived in React state, batching would delay the DOM mutation
 * until after the commit and `startViewTransition` would capture a "new"
 * snapshot identical to the old one: the wipe would look empty.
 */
export function applyTheme(id: ThemeId) {
  const root = document.documentElement
  root.dataset.theme = id
  root.dataset.scheme = themes[id].scheme
  write(KEY_THEME, id)
  emit()
}

/* --- Engine --------------------------------------------------------------- */

let engineId: EngineId = (read(KEY_ENGINE) as EngineId | null) ?? 'native'

export function getEngine(): EngineId {
  return engineId
}

export function setEngine(id: EngineId) {
  engineId = id
  write(KEY_ENGINE, id)
  emit()
}

/* --- Speed ---------------------------------------------------------------- */

let speed = Number(read(KEY_SPEED)) || 1

export function getSpeed(): number {
  return speed
}

export function setSpeed(value: number) {
  speed = value
  write(KEY_SPEED, String(value))
  emit()
}

/** Effective duration in ms, already scaled by the speed multiplier. */
export function getDuration(): number {
  return Math.round(BASE_DURATION / speed)
}

/* --- Hub marker ----------------------------------------------------------- */

/**
 * The theme `/` returns to. This is NOT a second copy of the active theme —
 * that one lives in the DOM and nowhere else. It answers a different question:
 * "which theme should the hub restore to?". It is never read to render an
 * active state, only once when the hub mounts, so it cannot desync from the
 * live theme the way a mirrored copy would.
 *
 * Validated on read: a stale id in localStorage falls back to "no marker"
 * rather than forcing a theme that no longer exists.
 */
export function getHubTheme(): ThemeId | null {
  const stored = read(KEY_HUB_THEME)
  return isThemeId(stored) ? stored : null
}

/** No emit(): nothing renders from the marker, so it stays out of the store's
 *  subscription surface. */
export function setHubTheme(id: ThemeId) {
  write(KEY_HUB_THEME, id)
}

/* --- Accessibility -------------------------------------------------------- */

/**
 * The only preference media query the project consults. Light and dark are
 * decided by the theme, not by the system.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
