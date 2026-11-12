<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink } from "vue-router"
import { LucideInbox, LucideInfo } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import LogsResultChip from "@/modules/admin-statistics/components/LogsResultChip.vue"
import type { UploadLog } from "@/types/admin"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN } from "@/lib/number-format"
import { formatByteSize, formatDurationMs } from "@/modules/admin-statistics/lib/logs-stats"
import {
  resolveUploadAuthMethodLabel,
  resolveUploadAuthorizationSourceLabel,
  resolveUploadLogActor,
  resolveUploadLogOwnerId,
} from "@/modules/admin-statistics/lib/upload-log-meta"

/**
 * The upload-log rows: one bordered, divided list with the pager in its
 * footer. From 50rem of its own width a row sits in fixed columns under a
 * caption row (status, time, owner over the game UID, uploader, server,
 * method over data type, processing time); below that everything but the
 * status and the owner folds onto a second line rather than scrolling
 * sideways. A failed upload carries its error under the row. A click on a row
 * opens the full record; the button at the end is the same action for
 * keyboard and assistive tech.
 */
interface Props {
  loading: boolean
  logs: UploadLog[]
  total: number
  page: number
  totalPages: number
  methodLabel: (method?: string) => string
  serverLabel: (server?: string) => string
  dataTypeLabel: (type?: string) => string
  formatTime: (iso?: string) => string
  /** A failed load; shown in place of the (empty) table with a retry. */
  error?: ErrorDescription | null
  pageSize?: number
  showPagination?: boolean
  /** Drops the list's own border and corners, for a host that already frames it (a panel body). */
  embedded?: boolean
}

const props = withDefaults(defineProps<Props>(), { error: null, pageSize: 20, showPagination: true, embedded: false })
const { t } = useI18n()
const shouldShowPagination = computed(() => props.showPagination && !props.error)
const showDetailDialog = ref(false)
const selectedLog = ref<UploadLog | null>(null)
const emit = defineEmits<{
  (event: "prev-page"): void
  (event: "next-page"): void
  (event: "go-to-page", page: number): void
  (event: "update:pageSize", pageSize: number): void
  (event: "retry"): void
}>()

const fallback = computed(() => t("adminStatistics.common.fallback"))

// One template for the caption row and every row, so the columns line up.
const WIDE_COLUMNS = "@min-[50rem]:grid-cols-[4.5rem_5.25rem_minmax(0,7fr)_minmax(0,5fr)_3rem_minmax(0,7rem)_4.25rem_2rem]"

function openDetailDialog(log: UploadLog) {
  selectedLog.value = log
  showDetailDialog.value = true
}

function ownerId(log: UploadLog) {
  return resolveUploadLogOwnerId(log)
}

function actorOf(log: UploadLog) {
  return resolveUploadLogActor(log)
}

function authMethodLabel(value?: string) {
  return resolveUploadAuthMethodLabel(value, t)
}

function authorizationSourceLabel(value?: string) {
  return resolveUploadAuthorizationSourceLabel(value, t)
}

function orFallback(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return fallback.value
  }
  return String(value)
}

function clientLabel(log: UploadLog | null) {
  if (!log) return fallback.value
  const parts = [log.clientName, log.clientVersion].filter((part): part is string => !!part)
  return parts.length > 0 ? parts.join(" ") : fallback.value
}

function platformLabel(log: UploadLog | null) {
  if (!log) return fallback.value
  const parts = [log.platform, log.osVersion, log.appArch].filter((part): part is string => !!part)
  return parts.length > 0 ? parts.join(" / ") : fallback.value
}

/** The one-line reason under a failed row: error code, stage and message, whichever the log carries. */
function failureLine(log: UploadLog): string {
  const head = [log.errorCode, log.failureStage].filter((part): part is string => !!part).join(" · ")
  const message = log.errorMessage?.trim() ?? ""
  return head && message ? `${head}: ${message}` : head || message
}

const detailRows = computed(() => {
  const log = selectedLog.value
  if (!log) return []
  const actor = actorOf(log)
  const duration = formatDurationMs(log.processingDurationMs)
  const size = formatByteSize(log.requestBytes)
  return [
    { label: t("adminStatistics.uploadLogs.table.time"), value: props.formatTime(log.uploadTime) },
    { label: t("adminStatistics.uploadLogs.table.server"), value: props.serverLabel(log.server) },
    { label: t("adminStatistics.uploadLogs.detail.gameUserId"), value: orFallback(log.gameUserId) },
    { label: t("adminStatistics.uploadLogs.table.dataType"), value: props.dataTypeLabel(log.dataType) },
    { label: t("adminStatistics.uploadLogs.table.method"), value: props.methodLabel(log.uploadMethod) },
    { label: t("adminStatistics.uploadLogs.detail.authMethod"), value: authMethodLabel(log.authMethod) },
    { label: t("adminStatistics.uploadLogs.detail.authorizationSource"), value: authorizationSourceLabel(log.authorizationSource) },
    { label: t("adminStatistics.uploadLogs.detail.grantId"), value: orFallback(log.grantId), hint: log.grantId != null ? t("adminStatistics.uploadLogs.detail.grantIdHint") : undefined },
    { label: t("adminStatistics.uploadLogs.detail.actorKind"), value: t(`adminStatistics.uploadLogs.actor.${actor.kind}`) },
    { label: t("adminStatistics.uploadLogs.detail.oauthClientId"), value: orFallback(log.oauthClientId) },
    { label: t("adminStatistics.uploadLogs.detail.client"), value: clientLabel(log) },
    { label: t("adminStatistics.uploadLogs.detail.platform"), value: platformLabel(log) },
    { label: t("adminStatistics.uploadLogs.detail.requestId"), value: orFallback(log.requestId) },
    { label: t("adminStatistics.uploadLogs.detail.duration"), value: orFallback(duration), hidden: !duration },
    { label: t("adminStatistics.uploadLogs.detail.requestSize"), value: orFallback(size), hidden: !size },
    { label: t("adminStatistics.uploadLogs.detail.claimedGameUserId"), value: orFallback(log.claimedGameUserId), hidden: !log.claimedGameUserId },
    { label: t("adminStatistics.uploadLogs.detail.failureStage"), value: orFallback(log.failureStage), hidden: log.success !== false },
    { label: t("adminStatistics.uploadLogs.detail.errorCode"), value: orFallback(log.errorCode), hidden: log.success !== false },
  ].filter((row) => !row.hidden)
})
</script>

<template>
  <div
    :class="['@container flex min-w-0 flex-col', embedded ? '' : 'overflow-hidden rounded-xl border bg-card']"
    data-slot="upload-logs-table"
  >
    <div v-if="props.loading" class="flex flex-col gap-2 p-3" data-testid="upload-logs-loading">
      <Skeleton v-for="i in 8" :key="i" class="h-9 w-full" />
    </div>
    <LoadErrorState
      v-else-if="props.error"
      :title="t('adminStatistics.uploadLogs.toast.loadFailedTitle')"
      :description="props.error.message"
      :detail="props.error.detail"
      :retrying="props.loading"
      @retry="emit('retry')"
    />
    <EmptyState
      v-else-if="props.logs.length === 0"
      :icon="LucideInbox"
      :title="t('adminStatistics.uploadLogs.table.empty')"
    />
    <div v-else class="divide-y divide-border/60" data-testid="upload-logs-list">
      <!-- Column captions; a narrow list is self-explanatory without them. -->
      <div :class="['hidden items-center gap-x-3 bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground @min-[50rem]:grid', WIDE_COLUMNS]">
        <span>{{ t("adminStatistics.uploadLogs.table.status") }}</span>
        <span>{{ t("adminStatistics.uploadLogs.table.time") }}</span>
        <span>{{ t("adminStatistics.uploadLogs.table.owner") }}</span>
        <span>{{ t("adminStatistics.uploadLogs.table.actor") }}</span>
        <span>{{ t("adminStatistics.uploadLogs.table.server") }}</span>
        <span class="truncate">{{ t("adminStatistics.uploadLogs.table.methodAndDataType") }}</span>
        <span class="text-right">{{ t("adminStatistics.uploadLogs.table.duration") }}</span>
        <span class="sr-only">{{ t("adminStatistics.uploadLogs.table.details") }}</span>
      </div>

      <div
        v-for="log in props.logs"
        :key="log.id"
        :class="[
          'grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 transition-colors hover:bg-muted/40 @min-[50rem]:py-1.5',
          WIDE_COLUMNS,
        ]"
        data-testid="upload-log-row"
        @click="openDetailDialog(log)"
      >
        <LogsResultChip :success="!!log.success" class="justify-self-start @min-[50rem]:order-1" />

        <!-- Owner: the user the data belongs to, with the game UID beside (wide: under) the name. -->
        <div class="flex min-w-0 flex-wrap items-baseline gap-x-2 text-[13px] leading-5 @min-[50rem]:order-3 @min-[50rem]:flex-col">
          <RouterLink
            v-if="ownerId(log)"
            :to="`/admin/users/${ownerId(log)}`"
            class="min-w-0 max-w-full font-medium text-primary underline-offset-4 [overflow-wrap:anywhere] hover:underline"
            @click.stop
          >
            {{ log.userName || ownerId(log) }}
          </RouterLink>
          <!-- No owner: unauthorized or unverified attempt. The claimed UID is
               never used to look one up client-side. -->
          <span v-else class="text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.noOwner") }}</span>
          <span v-if="log.gameUserId" class="max-w-full text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">
            UID: {{ log.gameUserId }}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          class="size-8 shrink-0 px-0 has-[>svg]:px-0 text-muted-foreground hover:text-foreground pointer-coarse:size-10 @min-[50rem]:order-8"
          :title="log.success ? t('adminStatistics.uploadLogs.table.viewDetails') : t('adminStatistics.uploadLogs.table.viewError')"
          :aria-label="t('adminStatistics.uploadLogs.table.viewDetails')"
          @click.stop="openDetailDialog(log)"
        >
          <LucideInfo class="size-4" aria-hidden="true" />
        </Button>

        <!-- Its own line on a narrow list; columns on a wide one. -->
        <div class="col-span-3 flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5 text-xs leading-5 text-muted-foreground @min-[50rem]:contents">
          <!-- The date and the time break onto two lines in the narrow time column. -->
          <span class="tabular-nums @min-[50rem]:order-2">{{ props.formatTime(log.uploadTime) }}</span>
          <span class="@min-[50rem]:order-5">{{ props.serverLabel(log.server) }}</span>
          <span class="flex min-w-0 flex-wrap items-baseline gap-x-3 @min-[50rem]:order-6 @min-[50rem]:flex-col">
            <span class="max-w-full [overflow-wrap:anywhere] @min-[50rem]:text-foreground/80">{{ props.methodLabel(log.uploadMethod) }}</span>
            <span class="max-w-full [overflow-wrap:anywhere]">{{ props.dataTypeLabel(log.dataType) }}</span>
          </span>
          <span
            :class="[
              'tabular-nums whitespace-nowrap @min-[50rem]:order-7 @min-[50rem]:text-right',
              formatDurationMs(log.processingDurationMs) ? '' : 'hidden @min-[50rem]:inline',
            ]"
            :title="formatByteSize(log.requestBytes) ?? undefined"
          >
            {{ formatDurationMs(log.processingDurationMs) ?? fallback }}
          </span>

          <!-- Who performed the upload, relative to the owner. -->
          <span class="flex min-w-0 flex-wrap items-baseline gap-x-1.5 @min-[50rem]:order-4 @min-[50rem]:flex-col">
            <template v-if="actorOf(log).kind === 'owner'">
              {{ t("adminStatistics.uploadLogs.actor.owner") }}
            </template>
            <template v-else-if="actorOf(log).kind === 'delegate'">
              <RouterLink
                :to="`/admin/users/${actorOf(log).actorUserId}`"
                class="min-w-0 max-w-full font-medium text-primary tabular-nums underline-offset-4 [overflow-wrap:anywhere] hover:underline"
                @click.stop
              >
                {{ actorOf(log).actorUserId }}
              </RouterLink>
              <span>{{ authorizationSourceLabel(log.authorizationSource) }}</span>
            </template>
            <template v-else>
              <span>{{ t("adminStatistics.uploadLogs.actor.unknown") }}</span>
              <span v-if="log.authMethod" class="text-muted-foreground/80">{{ authMethodLabel(log.authMethod) }}</span>
            </template>
          </span>
        </div>

        <p
          v-if="log.success === false && failureLine(log)"
          class="col-span-full min-w-0 truncate text-xs text-destructive-tint-foreground @min-[50rem]:order-9 @min-[50rem]:pl-[5.25rem]"
          :title="failureLine(log)"
          data-testid="upload-log-row-error"
        >
          {{ failureLine(log) }}
        </p>
      </div>
    </div>

    <div v-if="shouldShowPagination" class="border-t border-border/60 px-4 py-2.5">
      <AdminPagination
        :total="props.total"
        :page="props.page"
        :page-size="props.pageSize"
        :total-pages="props.totalPages"
        :disabled="props.loading"
        :total-label="t('adminStatistics.uploadLogs.pagination.total', { total: formatNumberCN(props.total, '0') })"
        @update:page-size="emit('update:pageSize', $event)"
        @prev-page="emit('prev-page')"
        @next-page="emit('next-page')"
        @go-to-page="emit('go-to-page', $event)"
      />
    </div>

    <Dialog :open="showDetailDialog" @update:open="showDetailDialog = $event">
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {{ selectedLog?.success === false ? t("adminStatistics.uploadLogs.errorDialog.title") : t("adminStatistics.uploadLogs.detail.title") }}
          </DialogTitle>
          <DialogDescription>
            {{ t("adminStatistics.uploadLogs.detail.description") }}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div v-if="selectedLog" class="flex items-center gap-2">
            <LogsResultChip :success="!!selectedLog.success" />
            <span class="text-xs tabular-nums text-muted-foreground">#{{ selectedLog.id }}</span>
          </div>
          <dl class="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div class="min-w-0">
              <dt class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.owner") }}</dt>
              <dd class="text-sm font-medium [overflow-wrap:anywhere]">
                {{ selectedLog ? (selectedLog.userName || ownerId(selectedLog) || t("adminStatistics.uploadLogs.table.noOwner")) : fallback }}
              </dd>
            </div>
            <div class="min-w-0">
              <dt class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.actor") }}</dt>
              <dd class="text-sm font-medium [overflow-wrap:anywhere]">
                {{ selectedLog ? (actorOf(selectedLog).actorUserId ?? t("adminStatistics.uploadLogs.actor.unknown")) : fallback }}
              </dd>
            </div>
            <div v-for="row in detailRows" :key="row.label" class="min-w-0">
              <dt class="text-xs text-muted-foreground">{{ row.label }}</dt>
              <dd class="text-sm tabular-nums [overflow-wrap:anywhere]">{{ row.value }}</dd>
              <dd v-if="row.hint" class="text-xs text-muted-foreground/80">{{ row.hint }}</dd>
            </div>
          </dl>

          <div v-if="selectedLog?.success === false" class="flex min-w-0 flex-col gap-1 border-t border-border/60 pt-4">
            <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.error") }}</div>
            <p class="text-sm whitespace-pre-wrap text-destructive-tint-foreground [overflow-wrap:anywhere]">{{ selectedLog?.errorMessage || fallback }}</p>
          </div>
        </DialogBody>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">{{ t("adminStatistics.uploadLogs.errorDialog.close") }}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
