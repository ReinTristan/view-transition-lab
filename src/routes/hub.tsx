import { Showcase } from '@/components/showcase/showcase'
import { themeList, themes } from '@/themes/registry'
import { useEngineId, useThemeId } from '@/themes/use-theme'
import { engineList } from '@/transitions'

export function HubRoute() {
  const themeId = useThemeId()
  const engineId = useEngineId()
  const theme = themes[themeId]
  const engine = engineList.find((item) => item.id === engineId)
  const ready = themeList.filter((item) => item.ready).length

  return (
    <div className='space-y-10 pt-6'>
      <header className='space-y-3'>
        <h1 className='font-heading font-semibold text-2xl'>
          Theme wipes with the View Transitions API
        </h1>
        <p className='max-w-2xl text-muted-foreground text-sm'>
          Three orthogonal axes: the theme, the engine running the animation and
          the mechanism that engine uses. The showcase below is the same on
          every route, so any difference you see comes from the theme.
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
              {ready} of {themeList.length}
            </dd>
          </div>
        </dl>
      </header>

      <Showcase />
    </div>
  )
}
