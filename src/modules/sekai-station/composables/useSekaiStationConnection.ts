import { onBeforeUnmount, onMounted } from "vue"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"

/**
 * Keeps the room stream open while the calling component is mounted. The feed
 * store outlives the page, so the list is still there when the user comes back
 * and the server's five-minute replay merges into it.
 */
export function useSekaiStationConnection() {
  const feed = useSekaiStationFeedStore()
  onMounted(() => feed.connect())
  onBeforeUnmount(() => feed.disconnect())
  return feed
}
