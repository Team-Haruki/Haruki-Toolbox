import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { getFriendLinks } from "@/modules/navigation/api/friend-links"
import type { FriendLinkItem } from "@/modules/navigation/types"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

export function useFriendLinks() {
  const { t } = useI18n()
  const friendLinks = ref<FriendLinkItem[]>([])
  const loading = ref(true)

  async function fetchFriendLinks() {
    loading.value = true
    try {
      friendLinks.value = await getFriendLinks()
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("navigationPages.friendLinks.toast.loadFailedTitle"),
        error,
        t("navigationPages.common.retryLater")
      )
    } finally {
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
