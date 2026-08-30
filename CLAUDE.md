# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
pnpm dev        # vite dev server, http://localhost:5173
pnpm build      # tsc -b (TypeScript 7) + vite build
pnpm lint       # biome check --write, repo-wide
pnpm preview    # serve the production build
```

Biome is the only linter and formatter here — it lints and formats in the same pass. oxlint
came with the Vite scaffold and was removed; if you find a reference to it, it is stale.

`pnpm lint` writes, and it writes **repo-wide on purpose** — including `src/components/ui/`.
That is a deliberate call: one command that leaves the whole tree consistent beats a scoped
one that has to be kept in sync by hand. Those files are already Biome-clean, so the pass is
a no-op on them today; if one ever does get reformatted, that is expected, not an accident.

There is no test setup in this repo — no test runner, no test script, no test files. Don't
invent one unless asked.

## What this project is

A proof of concept of the **View Transitions API** applied to a theme switcher. The point is
that **the same interaction is implemented N times behind one common interface**, so the
implementations can be compared honestly. Three orthogonal axes:

- **Theme** (7) — autonomous aesthetics, not light/dark variants of one design.
- **Engine** (5) — who runs the animation: native, Motion, GSAP, Tailwind, anime.js.
- **Mode** (3) — `native` (declarative CSS on the pseudo-element), `bridge` (the browser takes
  the snapshots, a JS library drives the progress), `overlay` (no VT API at all).

Currently implemented: 7 themes (2 partially designed — `pastel` and `neobrutalism`, the
furthest along but **not** finished — 5 are pendings with a minimum viable palette), and 2 engines
(`native`, `motion`).

## Architecture: the load-bearing decisions

These are the things that are not discoverable by reading one file.

### The store owns the theme; the DOM attribute is its render target

State lives in a Zustand store (`src/themes/use-theme-store.ts`), persisted under a single
`vtd` key by the `persist` middleware. `data-theme` / `data-scheme` on `<html>` are **not** a
second source of truth: CSS has no other input — `[data-theme='cyberpunk']` can only read the
DOM — so the attribute is where the state gets painted.

**`paintTheme()` writes it synchronously from inside the `setTheme` action, never from an
effect.** If the write reacted to the store value through `useEffect` it would run
post-commit, and `startViewTransition` would already have captured a "new" snapshot identical
to the old one — the wipe would render empty. This is the classic first-time bug here.

It has to be `<html>` and not a wrapper: 14 components portalize into `body`, so a themed div
inside `#root` would leave every dialog, popover and tooltip outside the theme.

Since the anti-FOUC script was removed from `index.html`, `hydrateDom()` in `main.tsx` is the
only thing that paints the attributes on load, and it runs before `createRoot`. It lands after
the bundle parses, so a grey-to-theme flash on load is expected and accepted for now.

### The theme decides lightness, never `prefers-color-scheme`

The project **never reads `prefers-color-scheme`**. Cyberpunk is dark because it is designed
that way, and looks identical whether the OS is in light or dark mode.

The shadcn components ship 86 hardcoded `dark:` utilities, so something has to activate them.
Instead of the `.dark` class, `src/index.css` defines a variant keyed on an attribute derived
from the theme registry:

```css
@custom-variant dark (&:is([data-scheme='dark'], [data-scheme='dark'] *));
```

`<html data-theme="cyberpunk" data-scheme="dark">`, where `data-scheme` comes from
`ThemeMeta.scheme` in `src/themes/registry.ts`. The only preference media query consulted
anywhere is `prefers-reduced-motion`.

### The bridge keepalive is the most fragile part

`::view-transition-*` pseudo-elements **are not DOM nodes**, so GSAP and anime.js have nothing
to grab. The bridge is a custom property: the library animates a scalar and writes it to
`--vt-progress` on `:root`, and the pseudo-element's `clip-path` consumes it, because custom
properties do inherit that far.

The catch: with no active animation on the pseudo-element, the browser considers the
transition finished as soon as `ready` resolves — before the library paints a single frame.
The fix is an **inert** animation of the same duration that holds the transition open. It
lives in `src/styles/transitions.css` and is engine-agnostic:

```css
[data-vt-mode='bridge']::view-transition-new(root) {
  clip-path: circle(calc(var(--vt-progress) * var(--vt-radius)) at var(--vt-x) var(--vt-y));
  animation: vt-keepalive var(--vt-duration) linear forwards;
}
```

### The engine contract

Every engine implements `TransitionEngine` (`src/transitions/types.ts`): animate a scalar from
0 to 1 and write it with `setProgress()` from `src/transitions/dom.ts`. `motion.ts` is the
reference implementation for bridge mode.

Engines are **dynamically imported** from `src/transitions/index.ts` so the bundle weight the
lab measures is real (`native` is 0.26 kB, `motion` 61.49 kB). `runTransition()` also holds an
anti-overlap lock — a second theme change while a transition is live would make the browser
abort the first one and flicker.

Note the import direction between the two directories: `themes/use-theme-store.ts` imports
`transitions/types` (a leaf module with no imports of its own) while `transitions/index.ts`
imports the store. Keep new shared types in `transitions/types.ts`.

`useThemeSwitcher` lives in `src/hooks/use-theme-switcher.ts` and **not** in the store,
precisely because it imports `runTransition` — putting it in the store would close a real
cycle. `transitions/index.ts` holds no state of its own: the anti-overlap slot
(`running` / `queued`) is in the store, which is what gives the UI a real `running` flag.

### CSS layering

`src/index.css` is the import root — fonts, the `dark` variant, `@theme inline`, then
`styles/transitions.css` and every `styles/themes/*.css`. Adding a theme file means adding its
`@import` there too.

Fonts go through an indirection (`--font-sans: var(--theme-font-sans, …)`) because
`@theme inline` bakes the value into the utility; without the intermediate `var()` all 7
themes would be pinned to Geist.

**The surface contract**: the ~25 shadcn color tokens are not enough for seven distinct
aesthetics, so there is a second layer every theme must define — `--surface-bg`,
`--surface-blur`, `--surface-border-w`, `--surface-shadow`, `--surface-gloss`, `--glow`,
`--overlay-bg`, `--overlay-blur`. `styles/themes/slots.css` applies them via `[data-slot]`
selectors, theme-agnostically.

Two traps that `slots.css` already solves — don't reintroduce them:

- shadcn uses `ring-1 ring-foreground/10` as the border on floating surfaces, and the ring
  paints **outside** the border-box. A theme that only thickened the border would get a 1px
  halo. The fix is declaring `box-shadow` in `slots.css`, which **replaces** the whole shadow
  chain Tailwind composes, ring included.
- `button`/`toggle`/`select` at `xs`/`sm` use `rounded-[min(var(--radius-md),10px)]`, which
  follows the token only up to 10–12px. It *looks* like it respects `--radius` but caps it.

`rounded-full` (16 slots) does not respond to `--radius` at all; `neobrutalism.css` lists them
explicitly.

### The mandatory chart convention

`src/components/ui/chart.tsx` does **not** read `--chart-1..5`. Its `THEMES` map is pinned to
`{ light: '', dark: '.dark' }` and it generates CSS via `dangerouslySetInnerHTML`, with no hook
for `[data-theme]`.

**Consumers always write `color: 'var(--chart-N)'` and never the `theme: { light, dark }`
form.** The indirection resolves at paint time, against whatever the active `[data-theme]` set.
The other form would make per-theme palettes impossible.

Note that `chartConfig` keys generate the custom property names, so renaming a key means
updating its `dataKey` and `fill` in the same edit.

## Conventions

**Language**: code comments and UI copy are written in **English**. Documentation in `docs/`
and conversation with the user are in Spanish.

**Biome**: single quotes in TS, no semicolons, 2 spaces, width 80.

**`src/components/ui/` is shadcn-generated.** Biome does pass over it (see Commands), but
don't go editing it by hand: almost all theming happens from CSS instead, and only four files
have been touched, each for a specific reason:

- `chart.tsx` — added `data-slot` markers; the swatch color moved from an inline
  `backgroundColor` to a `--color-swatch` custom property, because an inline style beats any
  theme rule.
- `calendar.tsx` — added a `data-calendar-day` marker. **Not** `data-slot`: `Button` spreads
  `{...props}` after its own `data-slot="button"`, so overriding it would drop the cell out of
  every button rule.
- `scroll-area.tsx` — removed an unused `import * as React` that broke `pnpm build` under
  `noUnusedLocals`.
- `sidebar.tsx` — its `useIsMobile` import now reads `!useIsDesktop()` from
  `src/hooks/use-media-query.ts`. The component is unused, but `tsc -b` typechecks it anyway,
  so it was the one thing pinning the old hook in place.

**TypeScript**: `erasableSyntaxOnly` (no enums, no parameter properties), `verbatimModuleSyntax`
(`import type` required), `noExplicitAny` is an error, `@/` aliases `src/`. TypeScript 7 native.

**Theme work is one individual plan per theme.** Don't batch the remaining themes into a single
task — each has its own obstacles against the base system.

## Local-only files

`docs/` (`workflow.md`, `tasks.md`) holds the user's working notes and is **not committed** —
it is excluded via `.git/info/exclude`. It is the richest context available, but never assume
it exists for anyone else, and don't reference it from committed files.

**The start point**: at the start of any session, read `docs/` to get the context of the
current or next task, which may include touching a theme, an engine, a mode, or the design
direction of the lab.

- `docs/workflow.md` — project-wide context: the three axes, why the common interface exists,
  what the PoC is trying to prove. Read it whole before writing any individual theme or
  engine plan.
- `docs/tasks.md` — the per-theme breakdown: current status table (which themes are done vs.
  pendings), each theme's design direction, and **the specific obstacles that theme faces against
  the base system**. This is the input to the individual plan.

This file describes decisions that are already made and stable; `docs/` describes what is
still in motion. When they disagree about current state, `docs/` wins — and say so.

Skip the read only for work that is genuinely unrelated (tooling, build config, a README
edit). If `docs/` is missing, just proceed — it means someone else cloned the repo.

## Known issues

- There is a grey-to-theme flash on every load: nothing paints `data-theme` before the bundle
  parses. `hydrateDom()` runs as early as JS can, which is still after the HTML. Accepted for
  now — the fix means putting something back in `index.html`, and that brings back a second
  copy of the scheme map to keep in sync.
- `@vtbag/inspection-chamber` (frame-by-frame view transition debugging) is installed and its
  dev import lives in `src/main.tsx`, but it is **commented out**: its overlay covered the
  whole page. Unresolved. The speed slider in the top bar (0.25×–2×) is the working way to
  inspect a transition meanwhile.
- `avatar.tsx` blend modes (`mix-blend-darken`) are still unhandled and are unpredictable over
  translucent surfaces — relevant to `glass` and `frutiger`.
