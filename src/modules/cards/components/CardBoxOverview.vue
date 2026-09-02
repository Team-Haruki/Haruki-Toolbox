<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { CollectionSummary } from "@/modules/cards/lib/card-box"

export type CardBoxOverviewRow = {
  key: string
  label: string
  iconUrls: readonly string[]
  color: string | null
  owned: number
  total: number
  percent: number
}

export type CardBoxOverviewGroup = {
  key: string
  title: string
  rows: readonly CardBoxOverviewRow[]
}

/**
 * Collection totals for the current filter scope: one overall bar and a
 * short bar per rarity, attribute and unit. Per-character progress is not
 * repeated here; every character section already carries its own.
 */
defineProps<{
  summary: CollectionSummary
  groups: readonly CardBoxOverviewGroup[]
}>()

const { t } = useI18n()
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <CardTitle class="flex flex-wrap items-baseline justify-between gap-2 text-base">
        <span>{{ t("cardBox.stats.title") }}</span>
        <span class="text-sm font-normal tabular-nums text-muted-foreground">
          {{ t("cardBox.summary", { owned: summary.owned, total: summary.total, percent: summary.percent }) }}
        </span>
      </CardTitle>
      <Progress :model-value="summary.percent" class="mt-2 h-2" />
    </CardHeader>
    <CardContent class="grid gap-x-10 gap-y-4 lg:grid-cols-3">
      <div v-for="group in groups" :key="group.key" class="flex min-w-0 flex-col gap-1.5">
        <h3 class="text-xs font-medium text-muted-foreground">{{ group.title }}</h3>
        <div v-for="row in group.rows" :key="row.key" class="flex items-center gap-2 text-xs" :title="`${row.label} ${row.owned}/${row.total}`">
          <span class="flex w-9 shrink-0 items-center justify-center">
            <img
              v-for="(iconUrl, index) in row.iconUrls"
              :key="`${row.key}-${index}`"
              :src="iconUrl"
              alt=""
              class="h-4 w-auto max-w-9 object-contain"
              :class="row.iconUrls.length > 1 ? '-ml-1 first:ml-0' : ''"
              loading="lazy"
              decoding="async"
            >
          </span>
          <span class="w-24 shrink-0 truncate sm:w-28">{{ row.label }}</span>
          <Progress :model-value="row.percent" :color="row.color ?? undefined" class="h-1.5 min-w-8 flex-1" />
          <span class="w-28 shrink-0 whitespace-nowrap text-right tabular-nums text-muted-foreground">
            {{ t("cardBox.stats.ownedOfTotal", { owned: row.owned, total: row.total }) }}
            · {{ t("cardBox.stats.percent", { percent: row.percent }) }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
