import { useEffect } from 'react'
import { Showcase } from '@/components/showcase/showcase'
import { themeList, themes } from '@/themes/registry'
import {
  useEngineId,
  useThemeId,
  useThemeStore,
} from '@/themes/use-theme-store'
import { engineList, runTransition } from '@/transitions'

export function HubRoute() {
  const themeId = useThemeId()
  const engineId = useEngineId()
  const theme = themes[themeId]
  const engine = engineList.find((item) => item.id === engineId)
  const done = themeList.filter((item) => item.status === 'done').length

  // The hub restores the theme you last swapped to here, so leaving to a theme
  // page and coming back does not lose it. Centered origin, same as landing on
  // /theme/:id: there is no click point to take it from.
  //
  // Mount only on purpose, and read through getState() rather than a selector:
  // hubTheme changes on every swap made here, so subscribing to it would make
  // the write re-trigger the restore in a loop.
  useEffect(() => {
    const { hubTheme: pinned, theme } = useThemeStore.getState()
    if (!pinned || theme === pinned) return
    void runTransition(pinned, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
  }, [])

  return (
    <div className='space-y-10 pt-6'>
      <header className='space-y-3'>
        <h1 className='font-heading font-semibold text-2xl'>
          Theme wipes with the View Transitions API
        </h1>
        <p className='max-w-2xl text-muted-foreground text-sm'>
          Three orthogonal axes: the theme, the engine running the animation and
          the mechanism that engine uses. The showcase below is the same on
          every route, so any difference you see comes from the theme. The
          second panel up there swaps the theme in place; the bar goes to each
          theme's own route instead, and coming back here restores the one you
          left.
        </p>
        <dl className='flex flex-wrap gap-x-8 gap-y-2 text-xs'>
          <div>
            <dt className='text-muted-foreground'>Theme</dt>
            <dd className='font-medium'>
              {theme.label} · {theme.font} · {theme.scheme}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>Engine</dt>
            <dd className='font-medium'>
              {engine?.label} · {engine?.modes.join(' / ')}
            </dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>Finished themes</dt>
            <dd className='font-medium'>
              {done} of {themeList.length}
            </dd>
          </div>
        </dl>
      </header>

      <Showcase />
    </div>
  )
}
