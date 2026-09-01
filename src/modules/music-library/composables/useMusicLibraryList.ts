import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useMusicCatalogList } from "./useMusicCatalogList"

/**
 * Public adapter kept for the deck-recommend song picker: the same return
 * shape as before (`entries`, `characterMap`, `musicEventBoxes`,
 * `musicVocalCharacters`, `tagOptions`, `yearOptions`, `loading`, `error`,
 * `regionState`, `reload`), now served by the canonical catalog indexes.
 */
export function useMusicLibraryList(region: Ref<SekaiRegion>) {
  const list = useMusicCatalogList(region)

  return {
    entries: list.entries,
    characterMap: list.characterMap,
    musicEventBoxes: list.musicEventBoxes,
    musicVocalCharacters: list.musicVocalCharacters,
    tagOptions: list.tagOptions,
    yearOptions: list.yearOptions,
    loading: list.loading,
    error: list.error,
    regionState: list.regionState,
    reload: list.reload,
  }
}
