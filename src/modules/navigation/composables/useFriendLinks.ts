import { onMounted, ref, shallowRef } from "vue"
import { getFriendLinks } from "@/modules/navigation/api/friend-links"
import type { FriendLinkItem } from "@/modules/navigation/types"

export function useFriendLinks() {
  const friendLinks = ref<FriendLinkItem[]>([])
  const loading = ref(true)
  /** The last failure, rendered inline by the page (no toast: the page itself is the feedback). */
  const error = shallowRef<unknown>(null)
  let latestRequestId = 0

  async function fetchFriendLinks() {
    const requestId = ++latestRequestId
    loading.value = true
    error.value = null
    try {
      const links = await getFriendLinks()
      if (requestId !== latestRequestId) return
      friendLinks.value = links
    } catch (loadError: unknown) {
      if (requestId !== latestRequestId) return
      friendLinks.value = []
      error.value = loadError
    } finally {
      if (requestId !== latestRequestId) return
      loading.value = false
    }
  }

  onMounted(() => {
    void fetchFriendLinks()
  })

  return {
    friendLinks,
    loading,
    error,
    reload: fetchFriendLinks,
  }
}
