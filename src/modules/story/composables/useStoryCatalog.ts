import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCardsIndex } from "@/modules/cards"
import { useEventsIndex } from "@/modules/events"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import { useCatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  STORY_MASTER_FILES,
  STORY_OPTIONAL_FILES,
  buildStoryCatalog,
  type StoryCatalog,
} from "@/modules/story/lib/story-catalog"

export const STORY_MASTERS_KEY = "story/masters"

/** The story master files as loaded (the catalog itself also needs the shared indexes). */
function pickStoryFiles(files: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const name of STORY_MASTER_FILES) out[name] = files[name]
  return out
}

export type StoryCatalogResource = {
  catalog: ComputedRef<StoryCatalog | null>
  loading: ComputedRef<boolean>
  error: ComputedRef<string | null>
  reload: () => Promise<void>
}

/** Every story of a region, grouped like the game's story screens. */
export function useStoryCatalog(region: Ref<SekaiRegion>, enabled?: Ref<boolean>): StoryCatalogResource {
  const stories = useCatalogResource(region, STORY_MASTERS_KEY, STORY_MASTER_FILES, pickStoryFiles, {
    optional: STORY_OPTIONAL_FILES,
    enabled,
  })
  const events = useEventsIndex(region)
  const cards = useCardsIndex(region)
  const characters = useCharactersIndex(region)
  const parts = [stories, events, cards, characters]

  const catalog = computed(() => {
    const s = stories.data.value
    const e = events.data.value
    const c = cards.data.value
    const ch = characters.data.value
    if (!s || !e || !c || !ch) return null
    return buildStoryCatalog({ stories: s, events: e.byId, cards: c.byId, characters: ch.characterMap })
  })

  return {
    catalog,
    loading: computed(() => parts.some((p) => p.loading.value)),
    error: computed(() => parts.map((p) => p.error.value).find((v) => v) ?? null),
    reload: async () => {
      await Promise.all(parts.map((p) => p.reload()))
    },
  }
}
