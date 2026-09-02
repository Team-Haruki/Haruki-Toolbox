<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideTrophy } from "lucide-vue-next"
import { resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import type { UnitLegendItem } from "../lib/player-profile"

/** Ranked per-unit averages under a radar: emblem, unit, value; the leader carries a trophy. */
defineProps<{
  items: readonly UnitLegendItem[]
}>()

const { t } = useI18n()

const failedLogos = ref<Set<string>>(new Set())

function markLogoFailed(unit: string) {
  failedLogos.value = new Set(failedLogos.value).add(unit)
}
</script>

<template>
  <div v-if="items.length > 0" class="mt-3 flex flex-col gap-1.5 text-xs">
    <span class="text-muted-foreground">{{ t("playerProfile.unitAverage") }}</span>
    <ol class="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
      <li
        v-for="item in items"
        :key="item.unit"
        :class="['flex min-w-0 items-center gap-1.5', item.top ? 'font-semibold' : 'text-muted-foreground']"
      >
        <img
          v-if="!failedLogos.has(item.unit)"
          :src="resolveUnitLogoUrl(item.unit)"
          alt=""
          class="h-3.5 w-auto max-w-8 shrink-0 object-contain"
          loading="lazy"
          @error="markLogoFailed(item.unit)"
        >
        <span v-else class="size-2.5 shrink-0 rounded-full" :style="{ backgroundColor: item.color ?? 'currentColor' }" />
        <span class="truncate">{{ t(`cards.unit.${item.unit}`) }}</span>
        <span class="ml-auto shrink-0 tabular-nums">{{ item.detail }}</span>
        <LucideTrophy v-if="item.top" class="size-3 shrink-0 text-amber-500" />
      </li>
    </ol>
  </div>
</template>
