import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

export const COSTUME_PART_TYPES = ["body", "hair", "head"] as const

export type CostumePartType = (typeof COSTUME_PART_TYPES)[number]

export type CostumeOption = {
  /** Runtime `costume3dId` accepted by the 3D engine recipe. */
  id: number
  costume3dGroupId: number | null
  partType: CostumePartType
  characterId: number
  name: string
  colorId: number | null
  colorName: string
  assetbundleName: string
  /** `costume3dType === "default"` — the character's stock part. */
  isDefault: boolean
  seq: number
}

function isCostumePartType(value: string): value is CostumePartType {
  return (COSTUME_PART_TYPES as readonly string[]).includes(value)
}

/** All costume parts of one character for one slot, master `seq` order. */
export function listCostumeOptions(
  rawCostume3ds: unknown,
  characterId: number,
  partType: CostumePartType,
): CostumeOption[] {
  const options: CostumeOption[] = []
  for (const record of normalizeCatalogRecords(rawCostume3ds)) {
    const id = normalizeCatalogNumber(record.id)
    const recordCharacterId = normalizeCatalogNumber(record.characterId)
    const recordPartType = normalizeCatalogString(record.partType)
    if (id == null || recordCharacterId !== characterId
      || !isCostumePartType(recordPartType) || recordPartType !== partType) {
      continue
    }

    options.push({
      id,
      costume3dGroupId: normalizeCatalogNumber(record.costume3dGroupId),
      partType: recordPartType,
      characterId,
      name: normalizeCatalogString(record.name) || `#${id}`,
      colorId: normalizeCatalogNumber(record.colorId),
      colorName: normalizeCatalogString(record.colorName),
      assetbundleName: normalizeCatalogString(record.assetbundleName),
      isDefault: normalizeCatalogString(record.costume3dType) === "default",
      seq: normalizeCatalogNumber(record.seq) ?? Number.MAX_SAFE_INTEGER,
    })
  }

  return options.sort((a, b) => a.seq - b.seq || a.id - b.id)
}

/** First default entry, else the first option; null when the slot is empty. */
export function pickDefaultCostumeId(options: readonly CostumeOption[]): number | null {
  return (options.find((option) => option.isDefault) ?? options[0])?.id ?? null
}

export type CostumeDefaultPartIds = {
  headCostume3dId: number | null
  hairCostume3dId: number | null
}

/** The character's stock head/hair ids, used to complete a body-only recipe. */
export function resolveDefaultCostumePartIds(
  rawCostume3ds: unknown,
  characterId: number,
): CostumeDefaultPartIds {
  return {
    headCostume3dId: pickDefaultCostumeId(listCostumeOptions(rawCostume3ds, characterId, "head")),
    hairCostume3dId: pickDefaultCostumeId(listCostumeOptions(rawCostume3ds, characterId, "hair")),
  }
}

/** `<characterId>:<unit>` role id consumed by the 3D engine. */
export function buildCostumeRoleId(characterId: number, unit: string | null): string | null {
  if (!unit) {
    return null
  }

  return `${characterId}:${unit}`
}
