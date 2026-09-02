import type { SekaiUnit } from "./catalog"
import { SEKAI_UNIT_EMBLEM_SVGS } from "./unit-emblems.data"

/**
 * Opt-in inline-SVG unit emblems.
 *
 * This is a hook, not a feature: the table is empty until someone drops emblem
 * SVGs into `assets/unit-emblems/<unit>.svg` and runs
 * `bun scripts/build-unit-emblems.mjs`. While it is empty every unit logo keeps
 * resolving to the hosted `icon_<unit>.png`, exactly as before.
 *
 * The whole integration point is `resolveUnitLogoUrl` in `data-sources.ts`: it
 * returns a `data:` URL for any unit that has an emblem here. That means every
 * consumer — `<img :src>`, `CatalogFieldOption.iconUrl`, `SekaiUnitLogo` —
 * picks the SVG up with no component changes, and units without one are
 * unaffected, so the set can be filled in a unit at a time.
 *
 * Each emblem is stored as a whole `<svg>` with its own `viewBox`, so it
 * scales to any of the icon sizes. The build script guarantees it is
 * self-contained — no `<script>`, no external references, ids and class names
 * scoped per unit — since the markup is inlined into `data:` URLs.
 */
export const SEKAI_UNIT_EMBLEMS: Partial<Record<SekaiUnit, string>> = SEKAI_UNIT_EMBLEM_SVGS

export function isSekaiUnitWithEmblem(unit: string): unit is SekaiUnit {
  return Object.hasOwn(SEKAI_UNIT_EMBLEM_SVGS, unit)
}

/** The emblem's markup, or `null` for a unit that has none yet. */
export function buildSekaiUnitEmblemSvg(unit: string): string | null {
  return SEKAI_UNIT_EMBLEM_SVGS[unit] ?? null
}

/**
 * `data:` URLs, so an emblem costs no request and stays off the Service
 * Worker's opaque image cache and out of the purge-and-retry recovery path.
 * Built once at module load; empty while no emblems exist.
 */
export const SEKAI_UNIT_EMBLEM_DATA_URLS: Partial<Record<SekaiUnit, string>> = Object.fromEntries(
  Object.keys(SEKAI_UNIT_EMBLEM_SVGS).map((unit) => [
    unit,
    `data:image/svg+xml,${encodeURIComponent(buildSekaiUnitEmblemSvg(unit) ?? "")}`,
  ]),
)

/** The emblem's `data:` URL, or `null` for a unit that has none yet. */
export function resolveUnitEmblemDataUrl(unit: string): string | null {
  return SEKAI_UNIT_EMBLEM_DATA_URLS[unit as SekaiUnit] ?? null
}
