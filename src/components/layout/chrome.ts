/**
 * The typographic anchor of the lab chrome, on its own so it can travel to
 * surfaces that are not panels — the settings popover portalizes into body, so
 * it is neither inside CHROME_PANEL nor styled by it.
 *
 * It does two jobs there, and both are load-bearing:
 *
 * - It pins the fonts to Geist against [data-theme]. Controls that changed
 *   typeface with every theme would make comparing themes impossible, which is
 *   the whole point of the bar.
 * - It is half of the busy-state selector. transitions.css dims
 *   `[data-vt-running] .app-chrome :is(button, select-trigger, slider)`, and the
 *   popup is a descendant of <html> but not of the panel: without this class the
 *   controls inside it would stay bright through the wipe.
 */
export const CHROME_FONT = 'app-chrome'

/**
 * The floating-panel look shared by every piece of lab chrome. It lives here,
 * and not duplicated per panel, because the panels are supposed to be
 * indistinguishable: two copies of the class list would drift.
 *
 * pointer-events-auto is load-bearing. The sticky container that groups the
 * panels spans the full width, so it turns pointer events off and each panel
 * turns them back on for its own box.
 *
 * Colour still follows the theme, because bg-background is a themed token —
 * only the typeface is pinned.
 */
export const CHROME_PANEL = `${CHROME_FONT} pointer-events-auto w-fit max-w-[calc(100%-1.5rem)] rounded-2xl border border-border bg-background/80 px-3 py-2 shadow-lg backdrop-blur-md`
