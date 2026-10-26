<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion } from "@/types"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"

/**
 * The region's master download, for pages sitting on a skeleton: "downloading
 * game data… 42 %". Renders nothing while the worker is idle, so pages mount
 * it next to their skeleton and let the store decide whether to show it.
 */
const props = withDefaults(defineProps<{
  region: SekaiRegion
  class?: string
}>(), {
  class: undefined,
})

const { t } = useI18n()
const sekaiDataStore = useSekaiDataStore()

const state = computed(() => sekaiDataStore.regionStates[props.region])
const visible = computed(() => state.value?.refreshing === true)
const progress = computed(() => Math.max(0, Math.min(100, Math.round(state.value?.progress ?? 0))))
</script>

<template>
  <div
    v-if="visible"
    :class="cn('grid gap-2 rounded-md border bg-muted/20 p-3', props.class)"
    role="status"
    aria-live="polite"
    data-slot="catalog-download-progress"
  >
    <p class="text-xs text-muted-foreground tabular-nums">
      {{ t("catalog.results.downloading", { progress }) }}
    </p>
    <Progress :model-value="progress" />
  </div>
</template>
