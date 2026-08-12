import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

/**
 * Helpers over the 3D runtime `part-registry` / `runtime-role-catalog`
 * documents. Options must come from the runtime registry — masterdata
 * costume ids are a superset of what the exporter actually shipped, and the
 * per-role defaults live in the role catalog.
 */

export const COSTUME_SLOTS = ["body", "hair", "head"] as const

export type CostumeSlot = (typeof COSTUME_SLOTS)[number]

export type RuntimeCostumeOption = {
  /** Runtime `costume3dId` accepted by the 3D engine recipe. */
  id: number
  name: string
  colorId: number | null
  colorName: string
  /** Costume thumbnail asset name (`startapp/thumbnail/costume/...`). */
  thumbnailAssetbundleName: string
  costume3dGroupId: number | null
  /** Head-slot only: full `head_and_hair` sets replace the hairstyle. */
  includesHair: boolean
}

type RegistryEntry = {
  costume3dId: number
  effectiveType: "body" | "hair" | "head" | "head_optional"
  packagePath: string
  name: string
  colorId: number | null
  colorName: string
  thumbnailAssetbundleName: string
  costume3dGroupId: number | null
}

const HEAD_ONLY_TYPES = new Set(["head_only", "head_all", "head_front", "head_back"])

/**
 * Reconstruct a costume thumbnail asset name when the master ships it empty.
 *
 * Nuverse regions (cn/tw/kr) leave `costume3ds.assetbundleName` blank for ~95%
 * of rows, so their costumes render with no thumbnail. The name is fully
 * derivable from the row's own `costume3dId`/`partType`/`colorId` — this is a
 * direct port of haruki-cloud's `buildCostumeAssetBundleName`, and the derived
 * value matches jp's real names (e.g. cn costume3dId 1002/body/color1 →
 * `cos0001_body`, color2 → `cos0001_body_01`), so it resolves against the jp
 * asset mirror even where the regional bucket is missing the file.
 */
export function buildCostumeThumbnailAssetbundleName(
  costume3dId: number,
  partType: string,
  colorId: number | null,
  override: string,
): string {
  const trimmed = override.trim()
  // A real name already carries a part suffix (e.g. `body_seifuku_a`); keep it.
  if (trimmed.includes("_")) {
    return trimmed
  }

  const part = partType.trim()
  if (part === "") {
    return trimmed
  }

  const base = trimmed !== "" ? trimmed : String(Math.floor(costume3dId / 1000)).padStart(4, "0")
  let name = `cos${base}_${part}`
  if (colorId != null && colorId >= 2) {
    name += `_${String(colorId - 1).padStart(2, "0")}`
  }
  return name
}

/**
 * Port of the engine's part-type normalization: `head_and_hair` head sources
 * act as full heads, `head_only`-style heads act as optional accessories.
 */
export function normalizeRuntimePartType(
  partType: string,
  headAssetbundleType: string | null,
): RegistryEntry["effectiveType"] | null {
  const lowered = partType.trim().toLowerCase()
  const base = lowered === "accessory" || lowered === "head_optional"
    ? "head_optional"
    : lowered === "body" || lowered === "head" || lowered === "hair" ? lowered : null
  if (base == null) {
    return null
  }

  const headType = (headAssetbundleType ?? "").trim().toLowerCase()
  if ((base === "head" || base === "head_optional") && headType === "head_and_hair") {
    return "head"
  }
  if (base === "head" && HEAD_ONLY_TYPES.has(headType)) {
    return "head_optional"
  }

  return base
}

function normalizeRegistryEntries(rawRegistry: unknown, characterId: number): RegistryEntry[] {
  const container = rawRegistry != null && typeof rawRegistry === "object" && !Array.isArray(rawRegistry)
    ? (rawRegistry as Record<string, unknown>).entries
    : rawRegistry
  const entries: RegistryEntry[] = []
  for (const record of normalizeCatalogRecords(container)) {
    const costume3dId = normalizeCatalogNumber(record.costume3dId)
    const entryCharacterId = normalizeCatalogNumber(record.characterId)
    if (costume3dId == null || entryCharacterId !== characterId) {
      continue
    }
    if (normalizeCatalogString(record.status) === "missing") {
      continue
    }

    const rawPartType = normalizeCatalogString(record.partType)
    const effectiveType = normalizeRuntimePartType(
      rawPartType,
      normalizeCatalogString(record.headCostume3dAssetbundleType) || null,
    )
    if (effectiveType == null) {
      continue
    }

    const colorId = normalizeCatalogNumber(record.colorId)
    entries.push({
      costume3dId,
      effectiveType,
      packagePath: normalizeCatalogString(record.packagePath),
      name: normalizeCatalogString(record.name) || `#${costume3dId}`,
      colorId,
      colorName: normalizeCatalogString(record.colorName),
      thumbnailAssetbundleName: buildCostumeThumbnailAssetbundleName(
        costume3dId,
        rawPartType,
        colorId,
        normalizeCatalogString(record.costumeAssetbundleName),
      ),
      costume3dGroupId: normalizeCatalogNumber(record.costume3dGroupId),
    })
  }

  return entries
}

function toOption(entry: RegistryEntry): RuntimeCostumeOption {
  return {
    id: entry.costume3dId,
    name: entry.name,
    colorId: entry.colorId,
    colorName: entry.colorName,
    thumbnailAssetbundleName: entry.thumbnailAssetbundleName,
    costume3dGroupId: entry.costume3dGroupId,
    includesHair: entry.effectiveType === "head",
  }
}

/**
 * Selectable options per slot from one role's part registry. The head slot
 * accepts both full heads and optional accessories, but ids whose sources are
 * ambiguous (same id, several independent packages) are skipped because the
 * plain recipe cannot disambiguate them without `headPackagePath`.
 */
export function listRuntimeCostumeOptions(
  rawRegistry: unknown,
  characterId: number,
  slot: CostumeSlot,
): RuntimeCostumeOption[] {
  const entries = normalizeRegistryEntries(rawRegistry, characterId)

  if (slot === "body" || slot === "hair") {
    const seen = new Set<number>()
    const options: RuntimeCostumeOption[] = []
    for (const entry of entries) {
      if (entry.effectiveType === slot && !seen.has(entry.costume3dId)) {
        seen.add(entry.costume3dId)
        options.push(toOption(entry))
      }
    }

    return options.sort((a, b) => a.id - b.id)
  }

  const headEntries = entries.filter(
    (entry) => entry.effectiveType === "head" || entry.effectiveType === "head_optional",
  )
  const sourcesById = new Map<number, Set<string>>()
  for (const entry of headEntries) {
    const sources = sourcesById.get(entry.costume3dId) ?? new Set<string>()
    sources.add(`${entry.effectiveType}|${entry.packagePath}`)
    sourcesById.set(entry.costume3dId, sources)
  }

  const seen = new Set<number>()
  const options: RuntimeCostumeOption[] = []
  for (const entry of headEntries) {
    if (seen.has(entry.costume3dId) || (sourcesById.get(entry.costume3dId)?.size ?? 0) !== 1) {
      continue
    }
    seen.add(entry.costume3dId)
    options.push(toOption(entry))
  }

  return options.sort((a, b) => a.id - b.id)
}

/**
 * Names/color names for every runtime costume of a character, keyed by
 * `costume3dId`. Unlike {@link listRuntimeCostumeOptions} this keeps ambiguous
 * head ids (they are dropped from selectable options but still need a display
 * name), so it is the complete name source for Nuverse regions whose master
 * ships costume names blank.
 */
export function buildRuntimeCostumeNameMap(
  rawRegistry: unknown,
  characterId: number,
): Map<number, { name: string; colorName: string }> {
  const map = new Map<number, { name: string; colorName: string }>()
  for (const entry of normalizeRegistryEntries(rawRegistry, characterId)) {
    if (!map.has(entry.costume3dId)) {
      map.set(entry.costume3dId, { name: entry.name, colorName: entry.colorName })
    }
  }
  return map
}

export type CostumeRoleDefaults = {
  bodyCostume3dId: number
  headCostume3dId: number
  hairCostume3dId: number
}

/** The role catalog's stock body/head/hair for one `<characterId>:<unit>` role. */
export function resolveRoleDefaults(
  rawRoleCatalog: unknown,
  characterId: number,
  unit: string,
): CostumeRoleDefaults | null {
  const container = rawRoleCatalog != null && typeof rawRoleCatalog === "object" && !Array.isArray(rawRoleCatalog)
    ? (rawRoleCatalog as Record<string, unknown>).roles
    : rawRoleCatalog
  for (const record of normalizeCatalogRecords(container)) {
    if (normalizeCatalogNumber(record.characterId) !== characterId
      || normalizeCatalogString(record.unit) !== unit) {
      continue
    }

    const bodyCostume3dId = normalizeCatalogNumber(record.bodyCostume3dId)
    const headCostume3dId = normalizeCatalogNumber(record.headCostume3dId)
    const hairCostume3dId = normalizeCatalogNumber(record.hairCostume3dId)
    if (bodyCostume3dId != null && headCostume3dId != null && hairCostume3dId != null) {
      return { bodyCostume3dId, headCostume3dId, hairCostume3dId }
    }
  }

  return null
}

/** First option matching the default id, else the first option. */
export function pickDefaultOptionId(
  options: readonly RuntimeCostumeOption[],
  defaultId: number | null | undefined,
): number | null {
  if (defaultId != null && options.some((option) => option.id === defaultId)) {
    return defaultId
  }

  return options[0]?.id ?? null
}
