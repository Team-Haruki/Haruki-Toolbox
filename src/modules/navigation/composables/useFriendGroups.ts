import { onMounted, ref, shallowRef } from "vue"
import { getFriendGroups } from "@/modules/navigation/api/friend-groups"
import type { FriendGroupData } from "@/modules/navigation/types"

export function useFriendGroups() {
  const groupData = ref<FriendGroupData[]>([])
  const openGroups = ref<string[]>([])
  const loading = ref(true)
  /** The last failure, rendered inline by the page (no toast: the page itself is the feedback). */
  const error = shallowRef<unknown>(null)
  let latestRequestId = 0

  async function fetchGroupData() {
    const requestId = ++latestRequestId
    loading.value = true
    error.value = null
    try {
      const rawData = await getFriendGroups()
      if (requestId !== latestRequestId) return
      const data = rawData.filter((group) => group.groupList.length > 0)
      groupData.value = data
      openGroups.value = data.map((group) => group.group)
    } catch (loadError: unknown) {
      if (requestId !== latestRequestId) return
      groupData.value = []
      openGroups.value = []
      error.value = loadError
    } finally {
      if (requestId !== latestRequestId) return
      loading.value = false
    }
  }

  onMounted(() => {
    void fetchGroupData()
  })

  return {
    groupData,
    openGroups,
    loading,
    error,
    reload: fetchGroupData,
  }
}
