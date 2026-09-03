import type { ThemeId } from '@/themes/registry'
import { themes } from '@/themes/registry'

/**
 * Every style rule in the page, layers and media blocks walked through.
 * Tailwind wraps most of what it emits in @layer, so a flat pass over
 * `cssRules` would miss almost everything.
 */
function* styleRules(
  rules: CSSRuleList
): Generator<CSSStyleRule, void, undefined> {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) yield rule
    if (rule instanceof CSSGroupingRule) yield* styleRules(rule.cssRules)
  }
}

function allStyleRules(): CSSStyleRule[] {
  const out: CSSStyleRule[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    // Same-origin in dev, but a cross-origin sheet would throw on access.
    try {
      out.push(...styleRules(sheet.cssRules))
    } catch {
      // Nothing to read here; skip it.
    }
  }
  return out
}

/** Selector text with quoting normalised: [data-theme="x"] and [data-theme=x]. */
function normalise(selector: string): string {
  return selector.replace(/["']/g, '')
}

/**
 * The custom properties a theme *declares*, which is not the same question as
 * what it computes: index.css gives :root a fallback for most of the surface
 * layer, so a computed-value check would pass even for a theme that declares
 * nothing at all.
 */
export function declaredProperties(id: ThemeId): Set<string> {
  const declared = new Set<string>()
  const target = `[data-theme=${id}]`

  for (const rule of allStyleRules()) {
    if (!normalise(rule.selectorText).includes(target)) continue
    for (let i = 0; i < rule.style.length; i++) {
      const prop = rule.style.item(i)
      if (prop.startsWith('--')) declared.add(prop)
    }
  }
  return declared
}

/** Paints a theme on <html> exactly the way the store's paintTheme does. */
export function applyTheme(id: ThemeId) {
  const root = document.documentElement
  root.dataset.theme = id
  root.dataset.scheme = themes[id].scheme
}
