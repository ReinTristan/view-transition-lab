import { expect, test } from 'vitest'

// Not a real test of the lab: it is the check that the rig itself is sound.
// If these two pass, the browser is real and index.css made it into the page.
test('the browser under test supports view transitions', () => {
  expect('startViewTransition' in document).toBe(true)
})

test('index.css is loaded in the test page', () => {
  const radius = getComputedStyle(document.documentElement).getPropertyValue(
    '--radius'
  )
  expect(radius.trim()).not.toBe('')
})
