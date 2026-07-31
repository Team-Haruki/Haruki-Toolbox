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

    const effectiveType = normalizeRuntimePartType(
      normalizeCatalogString(record.partType),
      normalizeCatalogString(record.headCostume3dAssetbundleType) || null,
    )
    if (effectiveType == null) {
      continue
    }

    entries.push({
      costume3dId,
      effectiveType,
      packagePath: normalizeCatalogString(record.packagePath),
      name: normalizeCatalogString(record.name) || `#${costume3dId}`,
      colorId: normalizeCatalogNumber(record.colorId),
      colorName: normalizeCatalogString(record.colorName),
      thumbnailAssetbundleName: normalizeCatalogString(record.costumeAssetbundleName),
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
