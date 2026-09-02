# Unit emblem SVGs

Drop-in replacements for the hosted unit icons (`static_images/icon_<unit>.png`).
A unit with no SVG here keeps using the PNG, so the set may be partial.

## Adding one

1. Save the emblem as `<unit>.svg`, using the master-data unit key as the
   filename: `piapro`, `light_sound`, `idol`, `street`, `theme_park`,
   `school_refusal`.
2. Run `bun scripts/build-unit-emblems.mjs`.
3. That regenerates `src/shared/sekai/unit-emblems.data.ts`; commit both.

The set may be partial, so emblems can land one at a time — a unit without an
SVG is untouched.

## Requirements

- Root element must carry a `viewBox` (any box — the file keeps its own, and
  scales to whatever size the UI renders it at).
- No `<script>`, no external references (fonts, `<image href>`, remote
  gradients). The markup is inlined into the page **and** into `data:` URLs, so
  anything it does not carry itself will not load.
- Everything else is fine: multiple paths, groups, gradients, `<style>` blocks,
  `fill-rule`. A designer's export drops in unmodified.

The build script enforces the above and fails loudly otherwise. It also scopes
every `id` and class name with the unit key — editors emit the same `cls-1` in
every file, which would cross-style the others if two emblems were ever inlined
into one document.

## How it reaches the UI

`resolveUnitLogoUrl()` in `src/shared/sekai/data-sources.ts` is the only
integration point. It returns a `data:` URL for any unit that has an emblem and
the hosted PNG for the rest, so all consumers — `<img :src>`,
`CatalogFieldOption.iconUrl`, `SekaiUnitLogo.vue` — switch over with no
component changes. An inlined emblem also costs no request and stays out of the
Service Worker's opaque image cache and its purge-and-retry recovery path.

## Current set

Six emblems, drawn as a ring plus glyph in a single colour on a transparent
interior — so unlike the PNG they carry no white disc and sit on whatever
background they are placed over.

| Unit | File | Colour |
| --- | --- | --- |
| VIRTUAL SINGER | `piapro.svg` | `#46baad` |
| Leo/need | `light_sound.svg` | `#3f55a4` |
| MORE MORE JUMP! | `idol.svg` | `#89c34d` |
| Vivid BAD SQUAD | `street.svg` | `#dd1d61` |
| Wonderlands×Showtime | `theme_park.svg` | `#f39518` |
| 25時、ナイトコードで。 | `school_refusal.svg` | `#814190` |

These are the artwork's own palette, deliberately not master data's
`unitProfiles.colorCode` — which is close but not identical, and is `#ffffff`
for `piapro` (VIRTUAL SINGER's rim really is white in the game art, which would
be invisible here).
