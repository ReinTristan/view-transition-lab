import type { ThemeId } from './registry'
import { themes } from './registry'

/**
 * The favicon is the ThemeSwatch: three stripes inside a capsule, the same mark
 * the picker uses. It is generated from ThemeMeta.swatch instead of being one
 * file per theme, so a theme's colours and its favicon cannot drift apart.
 *
 * The capsule is deliberately fatter than the component's: at 16px the rounding
 * eats colour, so it takes the full width and half the height — about 15x8 real
 * pixels, ~5px per stripe. And it drops the component's `ring-1
 * ring-foreground/20`: a 1px stroke on a 15px shape spends colour instead of
 * defining it. That ring is the only intentional difference between the two.
 *
 * The square around the capsule stays transparent; the browser tab paints it.
 */
export function faviconSvg(swatch: readonly [string, string, string]): string {
  const stripes = swatch
    .map(
      (color, i) =>
        `<rect x="${1 + i * 10}" y="8" width="10" height="16" fill="${color}"/>`
    )
    .join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><clipPath id="c"><rect x="1" y="8" width="30" height="16" rx="8"/></clipPath><g clip-path="url(#c)">${stripes}</g></svg>`
}

/**
 * Rewrites the tab icon for a theme. Creates the <link> when it is missing so
 * the function does not depend on index.html carrying the tag.
 */
export function paintFavicon(id: ThemeId) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')

  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    document.head.append(link)
  }

  link.href = `data:image/svg+xml,${encodeURIComponent(faviconSvg(themes[id].swatch))}`
}
