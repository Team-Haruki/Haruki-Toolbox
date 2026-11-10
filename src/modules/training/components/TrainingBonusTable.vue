<script setup lang="ts">
import { ref } from "vue"

export type TrainingBonusRow = {
  key: string | number
  name: string
  iconUrl: string | null
  color: string | null
  /** One formatted cell per column; null leaves the cell blank. */
  values: readonly (string | null)[]
  total: string
}

/**
 * Bonus breakdown as a table: one line per character / unit / attribute, a
 * column per source and the total last, so the sources compare down the
 * list. Under 30rem of its own width the source cells fold under the name as
 * "label value" pairs instead of columns.
 */
defineProps<{
  nameLabel: string
  totalLabel: string
  /** Source columns between the name and the total. */
  columns: readonly string[]
  rows: readonly TrainingBonusRow[]
  /** `round` for character avatars, `logo` for unit logos and attribute icons. */
  icon?: "round" | "logo"
}>()

// An icon that fails to load is dropped; its slot stays so the names align.
const failedIcons = ref<Set<string | number>>(new Set())

function markIconFailed(key: string | number) {
  const next = new Set(failedIcons.value)
  next.add(key)
  failedIcons.value = next
}
</script>

<template>
  <div class="@container" data-slot="training-bonus-table">
    <div class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-card">
      <div class="hidden items-end gap-2 bg-muted/30 px-3 py-1.5 text-[11px] leading-tight text-muted-foreground @min-[30rem]:flex">
        <span class="min-w-0 flex-1">{{ nameLabel }}</span>
        <span v-for="column in columns" :key="column" class="w-20 shrink-0 text-right">{{ column }}</span>
        <span class="w-16 shrink-0 text-right">{{ totalLabel }}</span>
      </div>
      <div
        v-for="row in rows"
        :key="row.key"
        class="flex flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-1.5"
      >
        <span class="h-5 w-1 shrink-0 rounded-full bg-border" :style="row.color ? { backgroundColor: row.color } : {}" aria-hidden="true" />
        <span :class="['flex shrink-0 items-center justify-center', icon === 'logo' ? 'h-5 w-8' : 'size-6']">
          <img
            v-if="row.iconUrl && !failedIcons.has(row.key)"
            :src="row.iconUrl"
            alt=""
            :class="icon === 'logo' ? 'max-h-5 max-w-8 object-contain' : 'size-6 rounded-full'"
            loading="lazy"
            decoding="async"
            @error="markIconFailed(row.key)"
          >
        </span>
        <span class="min-w-0 flex-1 truncate text-sm" :title="row.name">{{ row.name }}</span>
        <span
          v-if="columns.length > 0"
          class="order-last flex basis-full flex-wrap gap-x-3 pl-3 text-[11px] tabular-nums text-muted-foreground @min-[30rem]:order-none @min-[30rem]:basis-auto @min-[30rem]:flex-nowrap @min-[30rem]:gap-x-2 @min-[30rem]:pl-0 @min-[30rem]:text-xs"
        >
          <span
            v-for="(column, index) in columns"
            :key="column"
            :class="['@min-[30rem]:w-20 @min-[30rem]:shrink-0 @min-[30rem]:text-right', row.values[index] == null ? 'hidden @min-[30rem]:block' : '']"
          >
            <span class="mr-1 @min-[30rem]:hidden">{{ column }}</span>{{ row.values[index] ?? "—" }}
          </span>
        </span>
        <span class="w-16 shrink-0 text-right text-sm font-semibold tabular-nums">{{ row.total }}</span>
      </div>
    </div>
  </div>
</template>
