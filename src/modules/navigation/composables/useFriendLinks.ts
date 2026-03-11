import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { getFriendLinks } from "@/modules/navigation/api/friend-links"
import type { FriendLinkItem } from "@/modules/navigation/types"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

export function useFriendLinks() {
  const { t } = useI18n()
  const friendLinks = ref<FriendLinkItem[]>([])
  const loading = ref(true)
  let latestRequestId = 0

  async function fetchFriendLinks() {
    const requestId = ++latestRequestId
    loading.value = true
    try {
      const links = await getFriendLinks()
      if (requestId !== latestRequestId) return
      friendLinks.value = links
    } catch (error: unknown) {
      if (requestId !== latestRequestId) return
      friendLinks.value = []
      toastErrorWithExtractedMessage(
        t("navigationPages.friendLinks.toast.loadFailedTitle"),
        error,
        t("navigationPages.common.retryLater")
      )
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
  }
}
