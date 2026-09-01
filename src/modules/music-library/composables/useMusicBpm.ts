import { computed, ref, watch, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import {
  BPM_DIFFICULTY_CANDIDATES,
  parseChartBpm,
  resolveMusicScoreUrl,
  type ChartBpmInfo,
} from "@/modules/music-library/lib/music-bpm"
import type { MusicLibraryEntry } from "@/modules/music-library/lib/music-data"
import type { MusicDifficulty } from "@/modules/music-library/lib/music-difficulties"
import { formatBpmLabel } from "@/modules/music-library/lib/music-player"

const CANCELLED = Symbol("bpm-load-cancelled")

/**
 * BPM read from the first available chart of the song (expert → append →
 * master → …, the bot's lookup order). Charts are public assets; failures
 * (missing chart, CORS) simply hide the row.
 */
export function useMusicBpm(
  entry: Ref<MusicLibraryEntry | null>,
  region: Ref<SekaiRegion>,
  preference: Ref<SekaiAssetEndpointPreference>,
): { bpmInfo: Ref<ChartBpmInfo | null>; bpmLabel: ComputedRef<string | null> } {
  const bpmInfo = ref<ChartBpmInfo | null>(null)
  let loadToken = 0

  async function fetchCandidate(url: string, token: number): Promise<ChartBpmInfo | null | typeof CANCELLED> {
    try {
      const response = await fetch(url)
      if (token !== loadToken) {
        return CANCELLED
      }
      if (!response.ok) {
        return null
      }
      const parsed = parseChartBpm(await response.text())
      if (token !== loadToken) {
        return CANCELLED
      }
      return parsed != null && parsed.mainBpm > 0 ? parsed : null
    } catch {
      return token === loadToken ? null : CANCELLED
    }
  }

  async function loadFirstAvailable(urls: readonly string[], token: number) {
    for (const url of urls) {
      const parsed = await fetchCandidate(url, token)
      if (parsed === CANCELLED) {
        return
      }
      if (parsed) {
        bpmInfo.value = parsed
        return
      }
    }
  }

  watch(
    () => [entry.value, region.value, preference.value] as const,
    ([nextEntry, nextRegion, nextPreference]) => {
      const token = ++loadToken
      bpmInfo.value = null
      if (!nextEntry) {
        return
      }

      const available = BPM_DIFFICULTY_CANDIDATES
        .filter((difficulty) => nextEntry.difficulties[difficulty as MusicDifficulty] != null)
      const candidates = available.length > 0 ? available : [...BPM_DIFFICULTY_CANDIDATES]
      const urls = candidates
        .map((difficulty) => resolveMusicScoreUrl(nextRegion, nextEntry.id, difficulty, nextPreference))
        .filter((url): url is string => url != null)
      void loadFirstAvailable(urls, token)
    },
    { immediate: true },
  )

  return { bpmInfo, bpmLabel: computed(() => formatBpmLabel(bpmInfo.value)) }
}
