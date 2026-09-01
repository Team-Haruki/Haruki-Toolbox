import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import {
  buildCatalogCharacterMap,
  buildCatalogUnitColorMap,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  SEKAI_UNITS,
  type CatalogCharacter,
  type SekaiUnit,
} from "@/shared/sekai/catalog"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"

/**
 * Canonical cross-catalog resources. Module-level indexes (cards, events,
 * gachas, musics) live in their owning module's `composables/use*Index.ts`
 * and are exported from the module barrel; this file holds the ones every
 * catalog shares.
 */

export const CHARACTERS_INDEX_KEY = "shared/characters"
export const CHARACTERS_INDEX_FILES = ["gameCharacters", "gameCharacterUnits"] as const

/** One `gameCharacterUnits` row: the (character, unit) pair referenced by event bonuses and stamps. */
export type CatalogCharacterUnit = {
  id: number
  gameCharacterId: number
  unit: SekaiUnit | null
  colorCode: string | null
}

export type CharactersIndex = {
  /** Characters by `gameCharacterId`, in id order. */
  characters: CatalogCharacter[]
  characterMap: Map<number, CatalogCharacter>
  /** Representative unit colors from `gameCharacterUnits.colorCode`. */
  unitColorMap: Map<SekaiUnit, string>
  /** `gameCharacterUnits` rows by their own id. */
  characterUnitById: Map<number, CatalogCharacterUnit>
  /** `gameCharacterUnits` row ids per character (VS members have several). */
  characterUnitIdsByCharacter: Map<number, number[]>
}

function isSekaiUnit(value: string): value is SekaiUnit {
  return (SEKAI_UNITS as readonly string[]).includes(value)
}

export function buildCharactersIndex(files: Record<string, unknown>): CharactersIndex {
  const characterMap = buildCatalogCharacterMap(files.gameCharacters)
  const characters = [...characterMap.values()].sort((a, b) => a.id - b.id)
  const unitColorMap = buildCatalogUnitColorMap(files.gameCharacterUnits)

  const characterUnitById = new Map<number, CatalogCharacterUnit>()
  const characterUnitIdsByCharacter = new Map<number, number[]>()
  for (const record of normalizeCatalogRecords(files.gameCharacterUnits)) {
    const id = normalizeCatalogNumber(record.id)
    const gameCharacterId = normalizeCatalogNumber(record.gameCharacterId)
    if (!id || !gameCharacterId) {
      continue
    }
    const unit = normalizeCatalogString(record.unit)
    const row: CatalogCharacterUnit = {
      id,
      gameCharacterId,
      unit: isSekaiUnit(unit) ? unit : null,
      colorCode: normalizeCatalogString(record.colorCode) || null,
    }
    characterUnitById.set(id, row)
    const ids = characterUnitIdsByCharacter.get(gameCharacterId)
    if (ids) {
      ids.push(id)
    } else {
      characterUnitIdsByCharacter.set(gameCharacterId, [id])
    }
  }

  return { characters, characterMap, unitColorMap, characterUnitById, characterUnitIdsByCharacter }
}

export function useCharactersIndex(region: Ref<SekaiRegion>): CatalogResource<CharactersIndex> {
  return useCatalogResource(region, CHARACTERS_INDEX_KEY, CHARACTERS_INDEX_FILES, buildCharactersIndex)
}
