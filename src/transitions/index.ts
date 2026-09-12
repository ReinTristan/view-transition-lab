import type { ThemeId } from '@/themes/registry'
import { getDuration, useThemeStore } from '@/themes/use-theme-store'
import { prefersReducedMotion } from './dom'
import {
  engineLoader,
  engineMeta,
  fallbackLoader,
  reconcileMode,
  reconcileOption,
} from './registry'
import type { EngineId, TransitionMode } from './types'
import { DEFAULT_ENGINE } from './types'

/**
 * Resolves the engine+mode pair to something that actually runs.
 *
 * Falling back quietly is the one thing this lab must not do: the picker would
 * keep saying GSAP while vanilla ran, and the bundle figures it reports would be
 * measuring something else entirely. Correcting the selection makes the UI catch
 * up with what actually executes.
 *
 * Two ways to miss: an engine with no loaders at all, and an
 * engine that has loaders but not for the mode asked. The store reconciles the
 * mode on every setEngine, so the second one is only reachable from a
 * hand-edited persisted blob — which is exactly the case worth warning about.
 */
function loaderFor(id: EngineId, mode: TransitionMode) {
  const wanted = engineLoader(id, mode)
  if (wanted) return wanted

  const store = useThemeStore.getState()
  const meta = engineMeta(id)

  if (!meta.ready) {
    console.warn(
      `[transitions] no loader for "${id}" yet - falling back to ${DEFAULT_ENGINE}.`
    )
    store.setEngine(DEFAULT_ENGINE)
    return fallbackLoader
  }

  const corrected = reconcileMode(id, mode)
  console.warn(
    `[transitions] no "${mode}" loader for "${id}" yet - falling back to ${corrected}.`
  )
  store.setMode(corrected)
  return engineLoader(id, corrected) ?? fallbackLoader
}

/**
 * `mutate` runs inside the very same DOM mutation as the theme swap, which is
 * what lets a route change ride along with the wipe instead of landing after
 * it. Anything left to React's batching would commit after the browser already
 * captured the "new" snapshot, and would pop in rather than being wiped in.
 *
 * It travels with the pending run too, so a click that had to wait still gets
 * its navigation and its hub marker in that same mutation.
 *
 * This module holds no state of its own: the anti-overlap slot lives in the
 * store, which is what gives the UI a real `running` flag to read.
 */
export async function runTransition(
  theme: ThemeId,
  origin: { x: number; y: number },
  mutate?: () => void
) {
  const store = useThemeStore.getState()

  // Anti-overlap: a second theme change while a wipe is still alive would make
  // the browser abort the first one and flicker. A single slot, not a queue,
  // and the last one wins — chaining every click would make a rapid burst play
  // a train of wipes long after you stopped clicking.
  if (store.running) {
    store.setQueued({ theme, origin, mutate })
    return
  }
  store.setRunning(true)

  try {
    const engine = await loaderFor(store.engine, store.mode)()
    // Read again, not from `store`: loaderFor may have just corrected the
    // selection, and the option has to belong to the engine that really runs.
    const { engine: resolved, engineOptions } = useThemeStore.getState()
    await engine.run(
      () => {
        // setTheme writes the attributes synchronously before it touches the
        // store, so this whole callback is one DOM mutation — see paintTheme.
        useThemeStore.getState().setTheme(theme)
        mutate?.()
      },
      {
        origin,
        duration: getDuration(),
        reducedMotion: prefersReducedMotion(),
        option: reconcileOption(resolved, engineOptions[resolved]),
      }
    )
  } finally {
    const { setRunning, setQueued, queued: next } = useThemeStore.getState()
    setRunning(false)
    setQueued(null)
    // Drained in the finally so a throwing engine cannot strand the pending
    // run. Not awaited: nothing downstream waits on this promise, and awaiting
    // inside a finally would hold the caller's open until the whole chain ends.
    //
    // Deliberately not skipped when `next.theme` is already applied: it looks
    // like a no-op, but the picker's mutate also navigates, so double-clicking
    // one theme from / still has to land on /theme/:id.
    if (next) void runTransition(next.theme, next.origin, next.mutate)
  }
}

export type {
  EngineMeta,
  EngineOption,
  EngineOptionChoice,
} from './registry'
export {
  engineList,
  engineMeta,
  reconcileMode,
  reconcileOption,
} from './registry'
export type {
  EngineId,
  TransitionEngine,
  TransitionMode,
} from './types'
export {
  DEFAULT_ENGINE,
  DEFAULT_MODE,
  ENGINE_IDS,
  isEngineId,
  isTransitionMode,
  TRANSITION_MODES,
} from './types'
