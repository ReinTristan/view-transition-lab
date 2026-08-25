import type { ThemeMeta } from '@/themes/registry'

/** The three-colour sample shared by both theme controls. */
export function ThemeSwatch({ theme }: { theme: ThemeMeta }) {
  return (
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
  )
}
