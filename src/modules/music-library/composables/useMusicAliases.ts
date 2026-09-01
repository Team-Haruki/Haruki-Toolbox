import { ref, watch, type Ref } from "vue"
import { fetchMusicAliases } from "@/shared/sekai/music-alias"

/** Community aliases of a song from the HarukiBot alias API (empty on miss). */
export function useMusicAliases(musicId: Ref<number | null>): Ref<readonly string[]> {
  const aliases = ref<readonly string[]>([])

  watch(musicId, (id) => {
    aliases.value = []
    if (id == null) {
      return
    }
    void fetchMusicAliases(id).then((result) => {
      if (musicId.value === id) {
        aliases.value = result
      }
    })
  }, { immediate: true })

  return aliases
}
