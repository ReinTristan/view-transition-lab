import { NavLink, Outlet } from 'react-router'
import { EnginePicker } from '@/components/controls/engine-picker'
import { SpeedSlider } from '@/components/controls/speed-slider'
import { ThemePicker } from '@/components/controls/theme-picker'
import { Separator } from '@/components/ui/separator'

export function AppShell() {
  return (
    <div className='min-h-dvh'>
      {/* Sticky rather than fixed on purpose: the pill keeps its own box in the
          flow, so the page below never needs a padding-top guessed from the
          bar's height, and it still floats once you scroll.

          app-chrome keeps the controls on Geist: if the bar changed typeface
          with every theme, comparing themes would be impossible without the
          controls themselves shifting around. The rounding is a literal value
          and not --radius for the same reason — only the colors follow the
          theme. The buttons inside do follow it, which is the point. */}
      <header className='app-chrome sticky top-3 z-30 mx-auto mt-3 w-fit max-w-[calc(100%-1.5rem)] rounded-2xl border border-border bg-background/80 px-3 py-2 shadow-lg backdrop-blur-md'>
        <div className='flex flex-wrap items-center gap-x-4 gap-y-2'>
          <NavLink to='/' className='font-heading font-semibold text-sm'>
            view transitions
          </NavLink>
          <Separator orientation='vertical' className='h-5' />
          <EnginePicker />
          <SpeedSlider />
        </div>
        <Separator className='my-2' />
        {/* The picker is the navigation too: each button routes to /theme/:id. */}
        <ThemePicker />
      </header>

      <main className='mx-auto max-w-6xl px-4 pb-24'>
        <Outlet />
      </main>
    </div>
  )
}
