import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router'
import { ThemeSwatch } from '@/components/controls/theme-swatch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { themeList } from '@/themes/registry'
import { useThemeId, useThemeSwitcher } from '@/themes/use-theme'

/**
 * The navigation, which happens to also be a theme control: a click swaps the
 * theme and moves to /theme/:id. It is the heavier of the two theme controls on
 * purpose — visual weight is what tells "go to this theme's page" apart from
 * ThemeSwapper's "just repaint what I'm looking at".
 *
 * Both controls read the active theme from the DOM via useThemeId, so they
 * cannot disagree with each other. The older desync came from marking active by
 * route on one side and by DOM on the other.
 *
 * The wipe origin comes from the exact click point, which is why the handler
 * receives the event and not just the theme id.
 */
export function ThemePicker({ className }: { className?: string }) {
  const active = useThemeId()
  const switchTheme = useThemeSwitcher()
  const navigate = useNavigate()

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {themeList.map((theme) => (
        <Button
          key={theme.id}
          size='sm'
          variant={theme.id === active ? 'secondary' : 'ghost'}
          aria-pressed={theme.id === active}
          title={theme.blurb}
          onClick={(event) =>
            // flushSync commits the route inside the transition's mutation
            // window. Left to React's batching it would land after the "new"
            // snapshot was taken, and the new header would pop in instead of
            // being uncovered by the wipe. This only works because App.tsx
            // passes useTransitions={false}: otherwise the router wraps its
            // update in startTransition, which flushSync cannot force.
            switchTheme(theme.id, event, () => {
              flushSync(() => {
                void navigate(`/theme/${theme.id}`)
              })
            })
          }
        >
          <ThemeSwatch theme={theme} />
          {theme.label}
          {theme.status === 'pending' && (
            <span className='text-[0.65rem] text-muted-foreground'>wip</span>
          )}
        </Button>
      ))}
    </div>
  )
}
