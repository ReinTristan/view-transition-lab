export type ThemeId =
  | 'pastel'
  | 'anthropic'
  | 'frutiger'
  | 'y2k'
  | 'cyberpunk'
  | 'glass'
  | 'neobrutalism'

/**
 * Lightness of the theme. It comes from the theme's design, NEVER from
 * prefers-color-scheme: cyberpunk is dark because that is how it is designed,
 * not because the user has their system set to dark.
 *
 * It is written as data-scheme on <html> and is what activates the `dark:`
 * utilities the shadcn components ship hardcoded.
 */
export type ThemeScheme = 'light' | 'dark'

/**
 * How far the theme's design has actually got.
 *
 * pending    — minimum viable palette. Usable, not broken, but undesigned.
 * partial — has its own design and drove the base system's fixes, but checking
 *           it in the browser still turns up things missing.
 * done    — nothing pending. No theme is here yet.
 */
export type ThemeStatus = 'pending' | 'partial' | 'done'

export interface ThemeMeta {
  id: ThemeId
  label: string
  blurb: string
  scheme: ThemeScheme
  font: string
  /** 3-color sample for the picker. */
  swatch: [string, string, string]
  status: ThemeStatus
}

export const themes: Record<ThemeId, ThemeMeta> = {
  pastel: {
    id: 'pastel',
    label: 'Pastel soft',
    blurb: 'Lavender, pink and mint. High radius, soft shapes.',
    scheme: 'light',
    font: 'Quicksand',
    swatch: [
      'oklch(0.8 0.11 310)',
      'oklch(0.93 0.05 350)',
      'oklch(0.91 0.07 185)',
    ],
    status: 'partial',
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    blurb: 'Warm orange and editorial serif.',
    scheme: 'light',
    font: 'Source Serif 4',
    swatch: [
      'oklch(0.64 0.14 45)',
      'oklch(0.92 0.04 60)',
      'oklch(0.26 0.02 55)',
    ],
    status: 'pending',
  },
  frutiger: {
    id: 'frutiger',
    label: 'Frutiger Aero',
    blurb: 'Aqua and green, wet gloss, bubbles.',
    scheme: 'light',
    font: 'Titillium Web',
    swatch: [
      'oklch(0.68 0.15 215)',
      'oklch(0.85 0.13 165)',
      'oklch(0.9 0.11 195)',
    ],
    status: 'pending',
  },
  y2k: {
    id: 'y2k',
    label: 'Y2K futurism',
    blurb: 'Chrome and silver, metallic gradients, blobs.',
    scheme: 'light',
    font: 'Orbitron',
    swatch: [
      'oklch(0.7 0.14 285)',
      'oklch(0.82 0.09 320)',
      'oklch(0.84 0.02 265)',
    ],
    status: 'pending',
  },
  cyberpunk: {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    blurb: 'Dark by design, cyan and magenta neon.',
    scheme: 'dark',
    font: 'JetBrains Mono',
    swatch: [
      'oklch(0.82 0.18 190)',
      'oklch(0.7 0.24 330)',
      'oklch(0.15 0.03 285)',
    ],
    status: 'pending',
  },
  glass: {
    id: 'glass',
    label: 'Glassmorphism',
    blurb: 'Restrained glass, real backdrop-filter, 1px borders.',
    scheme: 'light',
    font: 'Manrope',
    swatch: [
      'oklch(0.5 0.07 255)',
      'oklch(0.86 0.05 250)',
      'oklch(0.92 0.04 220)',
    ],
    status: 'pending',
  },
  neobrutalism: {
    id: 'neobrutalism',
    label: 'Neobrutalism',
    blurb: 'Thick black border, hard shadow, zero radius.',
    scheme: 'light',
    font: 'Archivo',
    swatch: [
      'oklch(0.88 0.18 95)',
      'oklch(0.82 0.14 205)',
      'oklch(0.62 0.26 350)',
    ],
    status: 'partial',
  },
}

export const themeList: ThemeMeta[] = Object.values(themes)

/** Fixed, not derived from the system. */
export const DEFAULT_THEME: ThemeId = 'pastel'

export function isThemeId(value: string | undefined | null): value is ThemeId {
  return value != null && value in themes
}
