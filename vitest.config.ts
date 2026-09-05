import { playwright } from '@vitest/browser-playwright'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

/**
 * Kept apart from vite.config.ts and merged in, so the app config stays
 * readable on its own. The merge is not a formality: the tests need the very
 * same pipeline the app gets — the `@` alias and, above all, Tailwind v4
 * compiling the theme CSS for real. Half of what this suite asserts is computed
 * styles, and there is nothing to compute without it.
 *
 * Browser mode rather than jsdom, because none of this is simulable outside a
 * real engine: startViewTransition does not exist in jsdom, the
 * ::view-transition-* pseudo-elements are not DOM nodes, and the surface
 * contract only shows up in a real cascade.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    // Pre-bundled up front on purpose. Vitest reloads a test file the moment
    // Vite discovers a new dependency mid-run, which shows up as a flake with
    // no cause; the engines are dynamic imports, so they are precisely what
    // gets discovered late.
    optimizeDeps: {
      include: [
        'motion',
        'gsap',
        'react',
        'react-dom',
        'react-dom/client',
        'react/jsx-dev-runtime',
        'react-router',
        'zustand',
        'vitest-browser-react',
        'class-variance-authority',
        '@base-ui/react/button',
        '@base-ui/react/select',
        '@base-ui/react/separator',
        '@base-ui/react/slider',
      ],
    },
    test: {
      include: ['test/**/*.test.{ts,tsx}'],
      setupFiles: ['./test/setup.ts'],
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        // src/components/ui is 61 shadcn files nobody is going to test. Inside
        // the include the percentage would not measure the lab, it would
        // measure shadcn.
        include: [
          'src/themes/**',
          'src/transitions/**',
          'src/hooks/**',
          'src/components/controls/**',
          'src/components/layout/**',
        ],
      },
    },
  })
)
