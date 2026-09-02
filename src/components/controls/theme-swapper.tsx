import { ThemeSwatch } from '@/components/controls/theme-swatch'
import { CHROME_PANEL } from '@/components/layout/chrome'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useThemeSwitcher } from '@/hooks/use-theme-switcher'
import { cn } from '@/lib/utils'
import { themeList } from '@/themes/registry'
import {
  useIsTransitioning,
  useThemeId,
  useThemeStore,
} from '@/themes/use-theme-store'

/**
 * The second way to change the theme: swap it without leaving the page. It only
 * makes sense on the hub, so AppShell is the one that decides to mount it —
 * /theme/:id is pinned to a theme by definition.
 *
 * It brings its own chrome panel so the shell only has to place it, and it is
 * deliberately the lighter of the two controls: swatch-only buttons against the
 * picker's labelled ones. The panel gives the visual coherence, the button
 * weight still says which one is the navigation.
 *
 * The marker is written as the transition's `mutate`, so it lands in the very
 * same DOM mutation as the theme swap. A click that arrives mid-wipe is held by
 * runTransition's anti-overlap slot and its mutate travels with it, so the
 * marker still lands together with the theme it belongs to — never ahead of a
 * swap that has not happened yet.
 */
export function ThemeSwapper({ className }: { className?: string }) {
  const active = useThemeId()
  const switchTheme = useThemeSwitcher()
  const setHubTheme = useThemeStore((state) => state.setHubTheme)
  const running = useIsTransitioning()

  return (
    <section
      aria-label='Swap theme without leaving the hub'
      aria-busy={running}
      className={cn(CHROME_PANEL, className)}
    >
      <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
        {/* Says what it does differently, not what the component is called:
            with both panels stacked, that is the useful distinction. */}
        <span className='font-heading text-muted-foreground text-xs'>
          swap only
        </span>
        <Separator orientation='vertical' />
        <div className='flex flex-wrap gap-1'>
          {themeList.map((theme) => (
            <Button
              key={theme.id}
              size='icon-sm'
              variant={theme.id === active ? 'secondary' : 'ghost'}
              aria-pressed={theme.id === active}
              // The label is the accessible name that dropping the text took
              // away.
              aria-label={theme.label}
              title={theme.blurb}
              onClick={(event) =>
                switchTheme(theme.id, event, () => setHubTheme(theme.id))
              }
            >
              <ThemeSwatch theme={theme} />
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
