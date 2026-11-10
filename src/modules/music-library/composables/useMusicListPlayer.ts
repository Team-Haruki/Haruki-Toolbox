import { inject, provide, type InjectionKey, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { MusicLibraryEntry, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { pickPreferredVocal } from "@/modules/music-library/player/player-track"
import { useGlobalMusicPlayer } from "./useGlobalMusicPlayer"
import { createMusicPlayerTrack } from "./useMusicPlayerTrack"

export type MusicListPlayer = {
  /** The song has at least one version with audio (false until the vocals index is loaded). */
  canPlay: (entry: MusicLibraryEntry) => boolean
  isCurrent: (entry: MusicLibraryEntry) => boolean
  isPlaying: (entry: MusicLibraryEntry) => boolean
  /** Starts the song's preferred version (settings) in the site-wide player, or pauses / resumes it when it is the one loaded. */
  toggle: (entry: MusicLibraryEntry) => void
}

const MUSIC_LIST_PLAYER_KEY: InjectionKey<MusicListPlayer> = Symbol("music-list-player")

export type MusicListPlayerOptions = {
  region: Ref<SekaiRegion>
  preference: Ref<SekaiAssetEndpointPreference>
  vocalsByMusic: Ref<ReadonlyMap<number, readonly MusicVocalEntry[]> | null>
  characterMap: Ref<ReadonlyMap<number, CatalogCharacter>>
}

/** Lets the tiles and rows under a song list start playback without the list passing handlers down. */
export function provideMusicListPlayer(options: MusicListPlayerOptions): MusicListPlayer {
  const { t, te } = useI18n()
  const player = useGlobalMusicPlayer()
  const settingsStore = useSettingsStore()

  const vocalsOf = (entry: MusicLibraryEntry) => options.vocalsByMusic.value?.get(entry.id) ?? []
  const isCurrent = (entry: MusicLibraryEntry) => (
    player.state.track?.musicId === entry.id && player.state.track.region === options.region.value
  )

  const listPlayer: MusicListPlayer = {
    canPlay: (entry) => vocalsOf(entry).some((vocal) => vocal.assetbundleName),
    isCurrent,
    isPlaying: (entry) => isCurrent(entry) && player.playing.value,
    toggle: (entry) => {
      if (isCurrent(entry)) {
        player.toggle()
        return
      }
      const track = createMusicPlayerTrack({
        region: options.region.value,
        preference: options.preference.value,
        entry,
        vocals: vocalsOf(entry),
        characterMap: options.characterMap.value,
      }, { t, te })
      if (track) {
        player.play(track, pickPreferredVocal(track, settingsStore.preferredVocalType).id)
      }
    },
  }
  provide(MUSIC_LIST_PLAYER_KEY, listPlayer)
  return listPlayer
}

/** Null outside a song list that offers playback (the deck-recommend song picker, for one). */
export function useMusicListPlayer(): MusicListPlayer | null {
  return inject(MUSIC_LIST_PLAYER_KEY, null)
}
