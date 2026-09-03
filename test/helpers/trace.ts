import type { ThemeId } from '@/themes/registry'
import { getDuration } from '@/themes/use-theme-store'
import { runTransition } from '@/transitions'

export interface Trace {
  /** data-vt-mode seen while the wipe was alive. */
  modes: Set<string>
  /** --vt-progress sampled once per frame. */
  progress: number[]
  /** CSS animation names running on a ::view-transition-* pseudo-element. */
  animations: Set<string>
  pseudos: Set<string>
  /** Wall-clock length of the whole run. */
  elapsed: number
  /** What the engine was supposed to take. */
  expected: number
}

/**
 * Runs one wipe and samples it frame by frame.
 *
 * document.getAnimations() is the only window there is into the pseudo-elements:
 * they are not DOM nodes, so getComputedStyle cannot reach them, but their
 * animations do show up on the document timeline with `pseudoElement` set.
 */
export async function trace(theme: ThemeId): Promise<Trace> {
  const root = document.documentElement
  const modes = new Set<string>()
  const animations = new Set<string>()
  const pseudos = new Set<string>()
  const progress: number[] = []
  let sampling = true

  const sample = () => {
    if (!sampling) return

    if (root.dataset.vtMode) modes.add(root.dataset.vtMode)
    progress.push(
      Number.parseFloat(
        getComputedStyle(root).getPropertyValue('--vt-progress') || '0'
      )
    )

    for (const animation of document.getAnimations()) {
      const effect = animation.effect
      const pseudo =
        effect instanceof KeyframeEffect ? effect.pseudoElement : null
      if (!pseudo?.startsWith('::view-transition')) continue

      pseudos.add(pseudo)
      if ('animationName' in animation) {
        animations.add(String(animation.animationName))
      }
    }

    requestAnimationFrame(sample)
  }

  const expected = getDuration()
  const started = performance.now()
  requestAnimationFrame(sample)
  await runTransition(theme, {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  })
  sampling = false

  return {
    modes,
    progress,
    animations,
    pseudos,
    elapsed: performance.now() - started,
    expected,
  }
}
