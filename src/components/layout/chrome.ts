/**
 * The floating-panel look shared by every piece of lab chrome. It lives here,
 * and not duplicated per panel, because the panels are supposed to be
 * indistinguishable: two copies of the class list would drift.
 *
 * pointer-events-auto is load-bearing. The sticky container that groups the
 * panels spans the full width, so it turns pointer events off and each panel
 * turns them back on for its own box.
 *
 * app-chrome pins the fonts to Geist. Colour still follows the theme, because
 * bg-background is a themed token — controls that changed typeface with every
 * theme would make comparing themes impossible.
 */
export const CHROME_PANEL =
  'app-chrome pointer-events-auto w-fit max-w-[calc(100%-1.5rem)] rounded-2xl border border-border bg-background/80 px-3 py-2 shadow-lg backdrop-blur-md'
