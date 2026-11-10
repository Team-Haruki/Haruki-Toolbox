<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import AdminMeterList from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import { formatNumberCN } from "@/lib/number-format"
import { buildBreakdownMeterItems, type RankedCounts } from "@/modules/admin-statistics/lib/logs-stats"

/**
 * One breakdown of a log page's stat block: a titled panel with a ranked
 * share-bar list. Entries beyond the ranking's limit are summed in a note
 * under the list, never dropped silently. `error` replaces the list with a
 * one-line message and a retry, for a breakdown whose own request failed
 * while the rest of the page loaded.
 */
const props = withDefaults(defineProps<{
  title: string
  description?: string
  ranked: RankedCounts
  /** Display text of a key; raw keys (action names, reasons) can be returned as is. */
  labelOf: (key: string) => string
  emptyText: string
  loading?: boolean
  error?: string | null
}>(), {
  description: undefined,
  loading: false,
  error: null,
})

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()

const items = computed(() =>
  buildBreakdownMeterItems(props.ranked, props.labelOf, (value) => formatNumberCN(value, "0")),
)
</script>

<template>
  <AdminPanel :title="title" :description="description">
    <div v-if="error && !loading" class="flex flex-col items-start gap-2 text-xs text-muted-foreground" role="alert">
      <p class="[overflow-wrap:anywhere]">{{ error }}</p>
      <Button variant="outline" size="sm" class="h-7 gap-1 px-2 text-xs" @click="emit('retry')">
        <LucideRefreshCcw class="size-3.5" aria-hidden="true" />
        {{ t("core.loadError.retry") }}
      </Button>
    </div>
    <template v-else>
      <!-- Re-keyed when the data lands, so the bars grow in from zero instead of appearing full. -->
      <AdminMeterList
        :key="loading ? 'loading' : 'ready'"
        :items="items"
        :total="ranked.total"
        :loading="loading"
        :empty-text="emptyText"
      />
      <p v-if="!loading && ranked.otherKinds > 0" class="mt-2.5 text-xs tabular-nums text-muted-foreground">
        {{ t("adminStatistics.common.otherEntries", { kinds: formatNumberCN(ranked.otherKinds, "0"), count: formatNumberCN(ranked.otherCount, "0") }) }}
      </p>
    </template>
  </AdminPanel>
</template>
