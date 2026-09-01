import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildCardSkillIndex, type CardSkillRecord } from "@/modules/cards/lib/card-skill"

/**
 * The only resource that reads `skills.json`: normalized skill records for
 * the detail page plus the skillId → filter-type map the list filter uses.
 */
export const CARD_SKILLS_KEY = "cards/skills"
export const CARD_SKILLS_FILES = ["skills"] as const

export type CardSkillsIndex = {
  byId: Map<number, CardSkillRecord>
  filterTypeBySkillId: Map<number, string>
}

export function buildCardSkillsIndex(files: Record<string, unknown>): CardSkillsIndex {
  const byId = buildCardSkillIndex(files.skills)
  const filterTypeBySkillId = new Map<number, string>()
  for (const [id, record] of byId) {
    filterTypeBySkillId.set(id, record.filterType)
  }
  return { byId, filterTypeBySkillId }
}

export function useCardSkills(region: Ref<SekaiRegion>): CatalogResource<CardSkillsIndex> {
  return useCatalogResource(region, CARD_SKILLS_KEY, CARD_SKILLS_FILES, buildCardSkillsIndex)
}
