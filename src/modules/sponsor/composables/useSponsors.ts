import { onMounted, ref } from "vue"
import { getSponsorPageData } from "@/modules/sponsor/api/sponsors"
import type { SponsorPageData, SponsorSummary, SponsorSupporter } from "@/modules/sponsor/types"

function createEmptySummary(): SponsorSummary {
  return {
    totalAmount: null,
    supporterCount: 0,
    generatedAt: "",
  }
}

export function useSponsors() {
  const supporters = ref<SponsorSupporter[]>([])
  const summary = ref<SponsorSummary>(createEmptySummary())
  const loading = ref(true)
  const loadFailed = ref(false)
  let latestRequestId = 0

  async function fetchSponsors() {
    const requestId = ++latestRequestId
    loading.value = true
    loadFailed.value = false

    try {
      const data: SponsorPageData = await getSponsorPageData()
      if (requestId !== latestRequestId) return
      supporters.value = data.supporters
      summary.value = data.summary
    } catch {
      if (requestId !== latestRequestId) return
      supporters.value = []
      summary.value = createEmptySummary()
      loadFailed.value = true
    } finally {
      if (requestId !== latestRequestId) return
      loading.value = false
    }
  }

  onMounted(() => {
    void fetchSponsors()
  })

  return {
    supporters,
    summary,
    loading,
    loadFailed,
  }
}
