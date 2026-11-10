import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { resolveSekaiVocalTypeLabel } from "@/shared/sekai/labels"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveMusicJacketUrl, resolveMusicLongAudioUrl } from "@/modules/music-library/lib/music-assets"
import type { MusicLibraryEntry, MusicVocalCharacter, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import { buildPlayerTrack, type PlayerTrack } from "@/modules/music-library/player/player-track"

export type MusicPlayerTrackSource = {
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  entry: Pick<MusicLibraryEntry, "id" | "title" | "assetbundleName" | "fillerSec">
  vocals: readonly MusicVocalEntry[]
  characterMap: ReadonlyMap<number, CatalogCharacter>
  outsideCharacterNames?: ReadonlyMap<number, string>
}

type Translator = Pick<ReturnType<typeof useI18n>, "t" | "te">

/**
 * A song as the global player wants it. A singer whose name is not known yet
 * (the outside-character names load later) is listed without one rather than
 * as "unknown": the bar leaves empty names out.
 */
export function createMusicPlayerTrack(source: MusicPlayerTrackSource, translator: Translator): PlayerTrack | null {
  const singerName = (character: MusicVocalCharacter): string => {
    if (character.characterId == null) return ""
    if (character.characterType === "game_character") {
      return source.characterMap.get(character.characterId)?.name ?? ""
    }
    return source.outsideCharacterNames?.get(character.characterId) ?? ""
  }
  return buildPlayerTrack({
    region: source.region,
    musicId: source.entry.id,
    title: source.entry.title,
    jacketUrl: resolveMusicJacketUrl(source.region, source.entry.assetbundleName, source.preference),
    fillerSec: source.entry.fillerSec,
    vocals: source.vocals,
    resolveUrl: (vocal) => resolveMusicLongAudioUrl(source.region, vocal.assetbundleName, source.preference),
    typeLabel: (vocal) => resolveSekaiVocalTypeLabel(translator, vocal.musicVocalType),
    singerName,
    singerUnit: (character) => (
      character.characterType === "game_character" && character.characterId != null
        ? source.characterMap.get(character.characterId)?.unit ?? null
        : null
    ),
  })
}

/** Reactive form for a page that shows one song. */
export function useMusicPlayerTrack(source: MaybeRefOrGetter<MusicPlayerTrackSource | null>): ComputedRef<PlayerTrack | null> {
  const { t, te } = useI18n()
  return computed(() => {
    const value = toValue(source)
    return value ? createMusicPlayerTrack(value, { t, te }) : null
  })
}
