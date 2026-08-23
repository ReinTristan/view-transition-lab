# view-transition-lab

A small lab for understanding and practicing the **View Transitions API**.

The main idea is to get **the same interaction** using multiple animation engines to compare flavors and options testing it with multiple themes through a theme switcher.

> [!Warning] Work in progress. This is a proof of concept. I'm not a designer neither and artist so if the themes lack of some characteristics or style let me know.

## Current state

**Themes** — seven different themes, with not light/dark variants of a single design. Each one
brings its own style.

| Theme | Font | Style | Status | 
|---|---|---| --- |
| Pastel soft | Quicksand | Pastel tones of lavender, pink and mint over warm white. Wide radius, diffuse low-opacity shadows, soft gradient background. | ✔️ partially-designed |
| Neobrutalism | Archivo | Acid yellow, electric cyan and magenta over off-white and pure black. Zero radius, 3px borders, solid offset shadows — buttons shift into their shadow when pressed. |✔️ partially-designed |
| Anthropic | Source Serif 4 | Warm orange and editorial serif, inspired by the Anthropic and Claude pages. Plenty of air, marked typographic hierarchy, low saturation except for the accent. |🎨 palette |
| Frutiger Aero | Titillium Web | The colorful future of the 2000s: aqua and green, wet gloss, bubbles, nature. High saturation and vertical sky-to-grass gradients. |🎨 palette |
| Y2K futurism | Orbitron | The other 2000s: chrome and silver, hard metallic gradients with abrupt stops, blob shapes and techno type. The widest radius of the seven. |🎨 palette |
| Cyberpunk | JetBrains Mono | Cyan and magenta neon glowing over very dark violet. Monospaced type and a tight radius. |🎨 palette |
| Glassmorphism | Manrope | The transparent one: real `backdrop-filter`, hairline borders, and a neutral gradient background so the glass has something to blur. No gloss. |🎨 palette |

The current ones were implemented first to test the contrast of opposites designs. The rest are more sibling themes thats why are implemented later.

**Engines** — who runs the wipe animation:

***Current***

| engine | mode | mechanism |
|---|---|---|
| Native | `native` | Declarative CSS animation on `::view-transition-new(root)`. |
| Motion | `bridge` | The browser takes the snapshots; engine drives the progress.|

Engines are loaded lazily, so the bundle weight the lab measures is real.

***Upcoming***
| engine | mode | mechanism |
|---|---|---|
| GSAP | `bridge` | The browser takes the snapshots; engine drives the progress. |
| Anime.js | `bridge` | The browser takes the snapshots; engine drives the progress. |
| Tailwind| `native` | Declarative through tailwind (varies between plugins) |


## Methodology

- **The DOM is the source of truth for the theme, not React.** Changing the theme mutates
  `document.documentElement` synchronously; React only mirrors the value to render the picker.
  If the theme lived in `useState`, batching would delay the mutation and `startViewTransition`
  would capture a "new" snapshot identical to the old one.
- **The project never reads `prefers-color-scheme`.** Cyberpunk is dark because it is designed
  that way, and it looks identical whether the OS is in light or dark mode. The only preference
  media query consulted anywhere is `prefers-reduced-motion`.
- **The `bridge` mode.** `::view-transition-*` pseudo-elements are not DOM nodes, so JS
  libraries have nothing to grab. The bridge is a custom property: the library animates a
  scalar, writes it to `--vt-progress`, and the pseudo-element's `clip-path` consumes it.

## Stack

React 19 · TypeScript 7 · Vite · Tailwind v4 · shadcn/ui (on Base UI) · React Router · Motion ·
Biome · oxlint

## Development

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm build
pnpm lint
```

Requires a browser with [View Transitions API support](https://caniuse.com/view-transitions).

License [MIT](./LICENSE.md)