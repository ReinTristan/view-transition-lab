import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { themeList } from '@/themes/registry'
import { useThemeId, useThemeSwitcher } from '@/themes/use-theme'

/**
 * The only theme control, and the app's navigation at the same time: a click
 * swaps the theme and moves to /theme/:id. Keeping both jobs here is what stops
 * the "active theme" from being tracked in two places that can disagree.
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
          <span
            aria-hidden
            className='flex shrink-0 overflow-hidden rounded-full ring-1 ring-foreground/20'
          >
            {theme.swatch.map((color) => (
              <span
                key={color}
                className='size-2'
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          {theme.label}
          {theme.status === 'pending' && (
            <span className='text-[0.65rem] text-muted-foreground'>wip</span>
          )}
        </Button>
      ))}
    </div>
  )
}
