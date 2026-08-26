import { NavLink, Outlet, useMatch } from 'react-router'
import { EnginePicker } from '@/components/controls/engine-picker'
import { SpeedSlider } from '@/components/controls/speed-slider'
import { ThemePicker } from '@/components/controls/theme-picker'
import { ThemeSwapper } from '@/components/controls/theme-swapper'
import { CHROME_PANEL } from '@/components/layout/chrome'
import { Separator } from '@/components/ui/separator'
import { useIsDesktop } from '@/hooks/use-media-query'

export function AppShell() {
  // useMatch and not location.pathname so it survives a basename. The only
  // route knowledge the shell has, and it earns it: the swapper is meaningless
  // on /theme/:id, which is pinned to a theme by definition.
  const isHub = useMatch('/') !== null
  const isDesktop = useIsDesktop()
  const separatorOrientation = isDesktop ? 'vertical' : 'horizontal'
  return (
    <div className='min-h-dvh'>
      {/* Sticky rather than fixed on purpose: the stack keeps its own box in
          the flow, so the page below never needs a padding-top guessed from the
          bar's height, and it still floats once you scroll. It also means the
          hole shrinks by itself when the swapper unmounts.

          pointer-events-none is load-bearing. This container spans the full
          width, so without it the transparent gutters either side of the pills
          would swallow every click at that height. CHROME_PANEL turns events
          back on for each pill's own box. */}
      <div className='pointer-events-none sticky top-3 z-30 mt-3 flex flex-col items-center gap-2'>
        <header className={CHROME_PANEL}>
          <div className='flex flex-col flex-wrap items-center gap-x-4 gap-y-2 md:flex-row'>
            <NavLink to='/' className='font-heading font-semibold text-sm'>
              view transitions
            </NavLink>
            <Separator orientation={separatorOrientation} />
            <EnginePicker />
            <Separator orientation={separatorOrientation} />
            <SpeedSlider />
          </div>
          <Separator className='my-2' />
          {/* The picker is the navigation too: each button routes to /theme/:id. */}
          <ThemePicker />
        </header>

        {isHub && <ThemeSwapper />}
      </div>

      <main className='mx-auto max-w-6xl px-4 pb-24'>
        <Outlet />
      </main>
    </div>
  )
}
