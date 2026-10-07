<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumberCN } from "@/lib/number-format"
import type { BotSecuritySummary } from "@/types/admin"

const props = defineProps<{
  loading: boolean
  summary: BotSecuritySummary | null
  kindLabel: (kind: string) => string
}>()

const emit = defineEmits<{
  (event: "select-kind", kind: string): void
}>()

const { t } = useI18n()

const tiles = computed(() => [
  {
    key: "open",
    label: t("adminBotSecurity.summary.open"),
    value: props.summary?.open,
    tone: props.summary && props.summary.open > 0 ? "text-red-600 dark:text-red-400" : "text-foreground",
  },
  { key: "last24h", label: t("adminBotSecurity.summary.last24h"), value: props.summary?.last24h, tone: "text-foreground" },
  { key: "last7d", label: t("adminBotSecurity.summary.last7d"), value: props.summary?.last7d, tone: "text-foreground" },
])
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="grid grid-cols-3 gap-3">
      <div v-for="tile in tiles" :key="tile.key" class="min-w-0 rounded-xl border bg-card p-3 shadow-sm sm:p-4">
        <p class="truncate text-xs text-muted-foreground sm:text-sm" :title="tile.label">{{ tile.label }}</p>
        <Skeleton v-if="props.loading" class="mt-1 h-8 w-14" />
        <p v-else :class="['mt-1 text-2xl font-semibold tracking-tight tabular-nums', tile.tone]">
          {{ formatNumberCN(tile.value) }}
        </p>
      </div>
    </div>

    <div class="rounded-xl border bg-card p-3 shadow-sm sm:p-4">
      <p class="text-xs text-muted-foreground sm:text-sm">{{ t("adminBotSecurity.summary.byKind") }}</p>
      <div v-if="props.loading" class="mt-2 flex flex-wrap gap-2">
        <Skeleton v-for="i in 3" :key="i" class="h-7 w-28 rounded-full" />
      </div>
      <p v-else-if="!props.summary" class="mt-2 text-sm text-muted-foreground">
        {{ t("adminBotSecurity.summary.unavailable") }}
      </p>
      <p v-else-if="props.summary.byKind.length === 0" class="mt-2 text-sm text-muted-foreground">
        {{ t("adminBotSecurity.summary.noOpen") }}
      </p>
      <div v-else class="mt-2 flex flex-wrap gap-2">
        <button
          v-for="entry in props.summary.byKind"
          :key="entry.kind"
          type="button"
          class="inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :title="t('adminBotSecurity.summary.filterByKind', { kind: props.kindLabel(entry.kind) })"
          @click="emit('select-kind', entry.kind)"
        >
          <span class="min-w-0 truncate">{{ props.kindLabel(entry.kind) }}</span>
          <span class="rounded-full bg-red-100 px-1.5 text-[11px] tabular-nums text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {{ formatNumberCN(entry.count) }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
