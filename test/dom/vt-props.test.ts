import { describe, expect, test, vi } from 'vitest'
import {
  cleanup,
  prefersReducedMotion,
  prepare,
  setProgress,
  supportsViewTransitions,
} from '@/transitions/dom'
import type { TransitionContext } from '@/transitions/types'

const root = document.documentElement

function ctx(x: number, y: number): TransitionContext {
  return { origin: { x, y }, duration: 600, reducedMotion: false }
}

function readVar(name: string): string {
  return getComputedStyle(root).getPropertyValue(name).trim()
}

describe('prepare', () => {
  test('writes the mode and the five custom properties', () => {
    prepare(ctx(10, 20), 'bridge')

    expect(root.dataset.vtMode).toBe('bridge')
    expect(root.style.getPropertyValue('--vt-x')).toBe('10px')
    expect(root.style.getPropertyValue('--vt-y')).toBe('20px')
    expect(root.style.getPropertyValue('--vt-duration')).toBe('600ms')
    expect(root.style.getPropertyValue('--vt-progress')).toBe('0')
    expect(root.style.getPropertyValue('--vt-radius')).not.toBe('')
  })

  // The real innerWidth/innerHeight of a real browser is exactly what jsdom
  // cannot give, and getting this wrong leaves the old theme peeking out of a
  // corner when the circle finishes.
  test('the radius reaches the farthest corner from a corner origin', () => {
    prepare(ctx(0, 0), 'native')

    const expected = Math.hypot(window.innerWidth, window.innerHeight)
    const actual = Number.parseFloat(root.style.getPropertyValue('--vt-radius'))
    expect(actual).toBeCloseTo(expected, 5)
  })

  test('the radius halves when the origin is centred', () => {
    prepare(ctx(window.innerWidth / 2, window.innerHeight / 2), 'native')

    const expected = Math.hypot(window.innerWidth / 2, window.innerHeight / 2)
    const actual = Number.parseFloat(root.style.getPropertyValue('--vt-radius'))
    expect(actual).toBeCloseTo(expected, 5)
  })
})

describe('the bridge property', () => {
  test('setProgress lands on the computed style', () => {
    prepare(ctx(0, 0), 'bridge')
    setProgress(0.5)

    expect(readVar('--vt-progress')).toBe('0.5')
  })

  // Proof that the @property registration in transitions.css is live: a
  // registered <number> computes to a normalised number, an unregistered
  // custom property would hand back the token exactly as written.
  test('--vt-progress is registered as a number, not an opaque token', () => {
    prepare(ctx(0, 0), 'bridge')
    setProgress(0.5)
    root.style.setProperty('--vt-progress', '0.500')

    expect(readVar('--vt-progress')).toBe('0.5')
  })
})

describe('cleanup', () => {
  test('leaves nothing behind', () => {
    prepare(ctx(10, 20), 'bridge')
    setProgress(0.7)

    cleanup()

    expect(root.dataset.vtMode).toBeUndefined()
    for (const prop of [
      '--vt-x',
      '--vt-y',
      '--vt-radius',
      '--vt-duration',
      '--vt-progress',
    ]) {
      expect(root.style.getPropertyValue(prop)).toBe('')
    }
  })
})

describe('what the browser says', () => {
  test('view transitions are supported here', () => {
    expect(supportsViewTransitions()).toBe(true)
  })

  test('prefersReducedMotion reads the media query at call time', () => {
    expect(typeof prefersReducedMotion()).toBe('boolean')

    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
    } as MediaQueryList)
    expect(prefersReducedMotion()).toBe(true)
  })
})
