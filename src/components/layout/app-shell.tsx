import { NavLink, Outlet, useMatch } from 'react-router'
import { EnginePicker } from '@/components/controls/engine-picker'
import { SpeedSlider } from '@/components/controls/speed-slider'
import { ThemePicker } from '@/components/controls/theme-picker'
import { ThemeSwapper } from '@/components/controls/theme-swapper'
import { CHROME_PANEL } from '@/components/layout/chrome'
import { GithubIcon } from '@/components/ui/github-icon'
import { Separator } from '@/components/ui/separator'
import { useIsDesktop } from '@/hooks/use-media-query'
import { useIsTransitioning } from '@/themes/use-theme-store'

export function AppShell() {
  // useMatch and not location.pathname so it survives a basename. The only
  // route knowledge the shell has, and it earns it: the swapper is meaningless
  // on /theme/:id, which is pinned to a theme by definition.
  const isHub = useMatch('/') !== null
  const isDesktop = useIsDesktop()
  // The visual half of this lives in CSS, keyed on data-vt-running: see
  // paintRunning. This is only the semantics, and a frame of React lag costs
  // nothing there. aria-busy and not aria-disabled — the controls still answer.
  const running = useIsTransitioning()
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
        <header className={CHROME_PANEL} aria-busy={running}>
          <nav className='flex flex-col flex-wrap items-center gap-x-4 gap-y-2 md:flex-row'>
            <NavLink to='/' className='font-heading font-semibold text-sm'>
              view transitions
            </NavLink>
            <Separator orientation={separatorOrientation} />
            <EnginePicker />
            <Separator orientation={separatorOrientation} />
            <SpeedSlider />
            <Separator orientation={separatorOrientation} />
            {/* End of the row and not pushed right: CHROME_PANEL is w-fit, so
                the panel hugs its content and there is no right edge to push
                against. The busy-state rule leaves it alone on purpose — it
                dims what is interactive, not the whole bar. */}
            <a
              href='https://github.com/ReinTristan/view-transition-lab'
              target='_blank'
              rel='noreferrer'
              className='flex items-center gap-1.5 text-muted-foreground text-xs transition-colors hover:text-foreground'
            >
              made by ReinTristan
              <GithubIcon className='size-3.5' />
            </a>
          </nav>
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
