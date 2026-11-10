<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideInfo, LucideScrollText } from "lucide-vue-next"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import LogsResultChip from "@/modules/admin-statistics/components/LogsResultChip.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { SystemLogEntry } from "@/modules/admin-statistics/api/system-log"
import { resolveSystemLogTarget } from "@/modules/admin-statistics/lib/logs-system-query"

/**
 * The system-log rows: one divided list inside the page's panel (the parent
 * draws the border and is the `@container`). From 46rem of list width a row
 * sits in fixed columns under a caption row (result, time, the action over
 * its request, actor); below that it folds to the result, time and actor on
 * one line and the action and request under them at full width, rather than
 * scrolling sideways. Long actions and paths wrap. A
 * click anywhere on a row opens its detail; the button at the end of the row
 * is the same action for keyboard and assistive tech.
 */
defineProps<{
  logs: readonly SystemLogEntry[]
  loading: boolean
  error: ErrorDescription | null
  /** Whether filters are narrowing the list, for the empty state's wording. */
  filtered: boolean
  formatTime: (iso?: string) => string
}>()

const emit = defineEmits<{
  detail: [id: SystemLogEntry["id"]]
  retry: []
}>()

const { t, te } = useI18n()

// One template for the caption row and every row, so the columns line up.
const WIDE_COLUMNS = "@min-[46rem]:grid-cols-[4.5rem_5.25rem_minmax(0,1fr)_minmax(0,8.5rem)_2rem]"

function actorTypeLabel(type?: string): string {
  const path = `adminStatistics.systemLogs.actorType.${type}`
  return type && te(path) ? t(path) : type || t("adminStatistics.systemLogs.actorType.unknown")
}

/** A user or an admin has an account page; anonymous and system actors do not. */
function actorLink(log: SystemLogEntry): string | null {
  return log.actorUserId ? `/admin/users/${encodeURIComponent(log.actorUserId)}` : null
}
</script>

<template>
  <div v-if="loading" class="flex flex-col gap-2 p-3" data-testid="system-logs-loading">
    <Skeleton v-for="index in 8" :key="index" class="h-9 w-full" />
  </div>
  <LoadErrorState
    v-else-if="error"
    :title="t('adminStatistics.systemLogs.toast.loadFailedTitle')"
    :description="error.message"
    :detail="error.detail"
    :retrying="loading"
    @retry="emit('retry')"
  />
  <EmptyState
    v-else-if="logs.length === 0"
    :icon="LucideScrollText"
    :title="t('adminStatistics.systemLogs.table.empty')"
    :description="filtered ? t('adminStatistics.systemLogs.table.emptyFiltered') : t('adminStatistics.systemLogs.table.emptyHint')"
  />
  <div v-else class="divide-y divide-border/60" data-testid="system-logs-list">
    <!-- Column captions; a narrow list is self-explanatory without them. -->
    <div :class="['hidden items-center gap-x-3 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground @min-[46rem]:grid', WIDE_COLUMNS]">
      <span>{{ t("adminStatistics.systemLogs.table.result") }}</span>
      <span>{{ t("adminStatistics.systemLogs.table.time") }}</span>
      <span>{{ t("adminStatistics.systemLogs.table.actionAndRequest") }}</span>
      <span>{{ t("adminStatistics.systemLogs.table.actor") }}</span>
      <span class="sr-only">{{ t("adminStatistics.systemLogs.detail.title") }}</span>
    </div>

    <div
      v-for="log in logs"
      :key="log.id"
      :class="[
        'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 transition-colors hover:bg-muted/40 @min-[46rem]:py-1.5',
        WIDE_COLUMNS,
      ]"
      :title="t('adminStatistics.systemLogs.table.openDetail')"
      data-testid="system-log-row"
      @click="emit('detail', log.id)"
    >
      <LogsResultChip :success="log.result === 'success'" class="order-1 justify-self-start" />

      <!-- What happened: the action and what it acted on, over the request that carried it. -->
      <div class="order-4 col-span-3 min-w-0 @min-[46rem]:order-3 @min-[46rem]:col-span-1">
        <p class="text-[13px] leading-5 [overflow-wrap:anywhere]">
          <span class="font-mono">{{ log.action }}</span>
          <span v-if="resolveSystemLogTarget(log)" class="ml-1.5 font-mono text-xs text-muted-foreground">
            <span aria-hidden="true">→ </span>{{ resolveSystemLogTarget(log) }}
          </span>
        </p>
        <p v-if="log.method || log.path" class="flex min-w-0 items-baseline gap-1.5 text-xs leading-5 text-muted-foreground">
          <span v-if="log.method" class="shrink-0 rounded bg-muted px-1 font-mono text-[11px] leading-4 font-medium text-foreground/80">{{ log.method }}</span>
          <span class="min-w-0 font-mono [overflow-wrap:anywhere]">{{ log.path }}</span>
        </p>
      </div>

      <button
        type="button"
        class="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none order-3 pointer-coarse:size-10 @min-[46rem]:order-5"
        :title="t('adminStatistics.systemLogs.detail.title')"
        :aria-label="t('adminStatistics.systemLogs.detail.title')"
        @click.stop="emit('detail', log.id)"
      >
        <LucideInfo class="size-4" aria-hidden="true" />
      </button>

      <!-- Beside the result on a narrow list (the action then takes the full width below); columns on a wide one. -->
      <div class="order-2 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs text-muted-foreground @min-[46rem]:contents">
        <!-- The date and the time break onto two lines in the narrow time column. -->
        <span class="tabular-nums @min-[46rem]:order-2 @min-[46rem]:leading-5">{{ formatTime(log.eventTime) }}</span>

        <span class="flex min-w-0 flex-wrap items-baseline gap-x-1.5 @min-[46rem]:order-4 @min-[46rem]:flex-col @min-[46rem]:leading-5">
          <RouterLink
            v-if="actorLink(log)"
            :to="actorLink(log)!"
            class="min-w-0 font-medium text-primary tabular-nums underline-offset-4 [overflow-wrap:anywhere] hover:underline"
            @click.stop
          >
            {{ log.actorUserId }}
          </RouterLink>
          <span class="min-w-0 [overflow-wrap:anywhere]">{{ log.actorRole || actorTypeLabel(log.actorType) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
