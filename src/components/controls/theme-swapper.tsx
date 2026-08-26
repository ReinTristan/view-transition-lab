import { ThemeSwatch } from '@/components/controls/theme-swatch'
import { CHROME_PANEL } from '@/components/layout/chrome'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { themeList } from '@/themes/registry'
import { setHubTheme } from '@/themes/store'
import { useThemeId, useThemeSwitcher } from '@/themes/use-theme'

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
 * same DOM mutation as applyTheme. That also means the anti-overlap lock in
 * runTransition swallowing a click leaves the marker untouched, which is right:
 * the theme did not change either.
 */
export function ThemeSwapper({ className }: { className?: string }) {
  const active = useThemeId()
  const switchTheme = useThemeSwitcher()

  return (
    <section
      aria-label='Swap theme without leaving the hub'
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
