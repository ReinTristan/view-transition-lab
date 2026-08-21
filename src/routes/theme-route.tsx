import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router'
import { Showcase } from '@/components/showcase/showcase'
import { Badge } from '@/components/ui/badge'
import { isThemeId, themes } from '@/themes/registry'
import { getTheme } from '@/themes/store'
import { runTransition } from '@/transitions'

/**
 * Route with a forced theme. Landing here fires the same wipe as the picker,
 * only centered on the screen instead of on the click point: it reuses the
 * active engine with no separate code path.
 */
export function ThemeRoute() {
  const { themeId } = useParams()

  useEffect(() => {
    if (!isThemeId(themeId) || getTheme() === themeId) return
    void runTransition(themeId, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })
  }, [themeId])

  if (!isThemeId(themeId)) return <Navigate to='/' replace />

  const theme = themes[themeId]

  return (
    <div className='space-y-10 pt-6'>
      {/* Provisional hero. Each theme's bespoke hero arrives with its own
          individual plan; until then every route shares this one. */}
      <header className='space-y-3'>
        <div className='flex items-center gap-2'>
          <h1 className='font-heading font-semibold text-2xl'>{theme.label}</h1>
          {theme.ready ? (
            <Badge variant='secondary'>reference</Badge>
          ) : (
            <Badge variant='outline'>provisional palette</Badge>
          )}
        </div>
        <p className='max-w-2xl text-muted-foreground text-sm'>{theme.blurb}</p>
        <p className='text-muted-foreground text-xs'>
          {theme.font} · {theme.scheme} · looks the same whether the system is
          in light or dark
        </p>
      </header>

      <Showcase />
    </div>
  )
}
