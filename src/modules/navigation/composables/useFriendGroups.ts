import { onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { getFriendGroups } from "@/modules/navigation/api/friend-groups"
import type { FriendGroupData } from "@/modules/navigation/types"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

export function useFriendGroups() {
  const { t } = useI18n()
  const groupData = ref<FriendGroupData[]>([])
  const openGroups = ref<string[]>([])

  async function fetchGroupData() {
    try {
      const rawData = await getFriendGroups()
      const data = rawData.filter((group) => group.groupList.length > 0)
      groupData.value = data
      openGroups.value = data.map((group) => group.group)
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("navigationPages.friendGroups.toast.loadFailedTitle"),
        error,
        t("navigationPages.common.retryLater")
      )
    }
  }

  onMounted(() => {
    void fetchGroupData()
  })

  return {
    groupData,
    openGroups,
  }
}
