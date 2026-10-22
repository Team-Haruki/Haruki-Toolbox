<script setup lang="ts">
/**
 * A small "count per key" bar list for the dashboard: bindings per server,
 * uploads per method or per data type. The rows come from `toBreakdownItems`.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumberCN } from "@/lib/number-format"
import type { BreakdownItem } from "@/modules/admin-statistics/lib/dashboard-breakdown"

defineProps<{
  title: string
  description?: string
  items: BreakdownItem[]
  loading: boolean
  emptyText: string
}>()

function percent(share: number) {
  return `${(share * 100).toFixed(1)}%`
}
</script>

<template>
  <Card class="gap-3 py-4">
    <CardHeader class="px-4">
      <CardTitle class="text-sm font-medium">{{ title }}</CardTitle>
      <CardDescription v-if="description" class="text-xs">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent class="px-4">
      <div v-if="loading" class="flex flex-col gap-2.5">
        <Skeleton v-for="i in 3" :key="i" class="h-6 w-full" />
      </div>
      <p v-else-if="items.length === 0" class="py-4 text-center text-xs text-muted-foreground">{{ emptyText }}</p>
      <ul v-else class="flex flex-col gap-2.5" role="list">
        <li v-for="item in items" :key="item.key" class="flex flex-col gap-1">
          <div class="flex items-baseline justify-between gap-3 text-xs">
            <span class="min-w-0 truncate" :title="item.label">{{ item.label }}</span>
            <span class="shrink-0 tabular-nums text-muted-foreground">
              {{ formatNumberCN(item.count, "0") }} · {{ percent(item.share) }}
            </span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div class="h-full rounded-full bg-primary/70" :style="{ width: percent(item.share) }" />
          </div>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
