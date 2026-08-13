<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRankBorderContext } from "../composables/rank-border-context"
import { PERSONAL_COLLECTION_LIMIT } from "../lib/rank-border-constants"
import RankDetailComparisonSection from "./RankDetailComparisonSection.vue"
import RankDetailHistorySection from "./RankDetailHistorySection.vue"
import RankDetailProfileSection from "./RankDetailProfileSection.vue"
import RankDetailStatsSection from "./RankDetailStatsSection.vue"
import RankDetailTrendSection from "./RankDetailTrendSection.vue"

const { t } = useI18n()

withDefaults(defineProps<{ showClose?: boolean }>(), {
  showClose: false,
})
const emit = defineEmits<{ close: [] }>()

const { detail } = useRankBorderContext()

const {
  detail: activeDetail,
  detailDialogTab,
  updateDetailDialogTab,
} = detail
</script>

<template>
            <div v-if="activeDetail" class="rank-border-detail-panel grid gap-3 p-3 sm:p-4">
                <RankDetailProfileSection
                  :active-detail="activeDetail"
                  :show-close="showClose"
                  @close="emit('close')"
                />

                <Tabs
                  v-if="activeDetail.result.rank <= PERSONAL_COLLECTION_LIMIT"
                  :model-value="detailDialogTab"
                  class="rank-border-detail-tabs"
                  @update:model-value="updateDetailDialogTab"
                >
                  <TabsList class="h-8">
                    <TabsTrigger value="player" class="h-7 px-2.5 text-xs">{{ t("rankBorder.sections.playerTracking") }}</TabsTrigger>
                    <TabsTrigger value="border" class="h-7 px-2.5 text-xs">{{ t("rankBorder.sections.borderTracking") }}</TabsTrigger>
                  </TabsList>
                </Tabs>

                <RankDetailComparisonSection />

                <div class="rank-border-detail-grid">
                  <RankDetailStatsSection :active-detail="activeDetail" />
                  <RankDetailTrendSection />
                  <RankDetailHistorySection />
                </div>
            </div>
</template>

<style scoped>
.rank-border-detail-tabs {
  flex: 0 0 auto;
}

.rank-border-detail-panel__header {
  min-width: 0;
}

.rank-border-detail-grid {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  grid-auto-rows: auto;
  grid-template-areas:
    "stats"
    "trend"
    "heatmap";
  align-content: start;
  gap: 0.75rem;
}

@media (min-width: 768px) and (max-width: 1180px) {
  .rank-border-detail-grid {
    gap: 0.625rem;
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  .rank-border-detail-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-template-areas:
      "stats"
      "trend"
      "heatmap";
    padding-bottom: 0.625rem;
    overflow: visible;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  .rank-border-detail-panel__header h2 {
    font-size: 1rem;
    line-height: 1.25;
  }

  .rank-border-detail-panel__header p {
    font-size: 0.75rem;
    line-height: 1.25;
  }
}

@media (max-width: 767px) {
  .rank-border-detail-panel__header {
    min-height: 0;
    padding-right: 2.25rem;
  }

  .rank-border-detail-panel__header p {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .rank-border-detail-grid {
    display: grid;
    min-height: 0;
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: auto;
    grid-template-areas:
      "stats"
      "trend"
      "heatmap";
    align-content: start;
    gap: 0.625rem;
    padding: 0.125rem 0.125rem 0.75rem;
  }
}
</style>
