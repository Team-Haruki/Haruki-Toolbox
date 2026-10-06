<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink } from "vue-router"
import { LucideCheckCircle, LucideChevronLeft, LucideChevronRight, LucideInbox, LucideInfo, LucideXCircle } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UploadLog } from "@/types/admin"
import { formatNumberCN } from "@/lib/number-format"
import {
  resolveUploadAuthMethodLabel,
  resolveUploadAuthorizationSourceLabel,
  resolveUploadLogActor,
  resolveUploadLogOwnerId,
} from "@/modules/admin-statistics/lib/upload-log-meta"

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
  showPagination?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const shouldShowPagination = computed(() => props.showPagination !== false)
const showDetailDialog = ref(false)
const selectedLog = ref<UploadLog | null>(null)
const emit = defineEmits<{
  (event: "prev-page"): void
  (event: "next-page"): void
}>()

const fallback = computed(() => t("adminStatistics.common.fallback"))

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

const detailRows = computed(() => {
  const log = selectedLog.value
  if (!log) return []
  const actor = actorOf(log)
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
    { label: t("adminStatistics.uploadLogs.detail.claimedGameUserId"), value: orFallback(log.claimedGameUserId), hidden: !log.claimedGameUserId },
    { label: t("adminStatistics.uploadLogs.detail.failureStage"), value: orFallback(log.failureStage), hidden: log.success !== false },
    { label: t("adminStatistics.uploadLogs.detail.errorCode"), value: orFallback(log.errorCode), hidden: log.success !== false },
  ].filter((row) => !row.hidden)
})
</script>

<template>
  <Card class="gap-0 py-0 overflow-hidden">
    <CardContent class="p-0">
      <template v-if="props.loading">
        <div class="p-6 flex flex-col gap-3">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <template v-else-if="props.logs.length === 0">
        <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <LucideInbox class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.empty") }}</p>
        </div>
      </template>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="pl-6">{{ t("adminStatistics.uploadLogs.table.status") }}</TableHead>
              <TableHead>{{ t("adminStatistics.uploadLogs.table.owner") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminStatistics.uploadLogs.table.actor") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.uploadLogs.table.server") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.uploadLogs.table.method") }}</TableHead>
              <TableHead class="hidden xl:table-cell">{{ t("adminStatistics.uploadLogs.table.dataType") }}</TableHead>
              <TableHead>
                <span class="hidden xl:inline">{{ t("adminStatistics.uploadLogs.table.details") }}</span>
                <span class="sr-only xl:hidden">{{ t("adminStatistics.uploadLogs.table.details") }}</span>
              </TableHead>
              <TableHead class="pr-6">{{ t("adminStatistics.uploadLogs.table.time") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="log in props.logs" :key="log.id">
              <TableCell class="pl-6">
                <span
                  v-if="log.success"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <LucideCheckCircle class="w-3 h-3" />
                  {{ t("adminStatistics.common.success") }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                >
                  <LucideXCircle class="w-3 h-3" />
                  {{ t("adminStatistics.common.failure") }}
                </span>
              </TableCell>
              <TableCell>
                <RouterLink
                  v-if="ownerId(log)"
                  :to="`/admin/users/${ownerId(log)}`"
                  class="flex flex-col hover:underline text-primary"
                >
                  <span class="font-medium text-sm">{{ log.userName || ownerId(log) }}</span>
                  <span v-if="log.gameUserId" class="text-xs text-muted-foreground/80">
                    UID: {{ log.gameUserId }}
                  </span>
                </RouterLink>
                <!-- No owner: unauthorized or unverified attempt. The claimed UID is
                     never used to look one up client-side. -->
                <div v-else class="flex flex-col">
                  <span class="text-sm text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.noOwner") }}</span>
                  <span v-if="log.gameUserId" class="text-xs text-muted-foreground/80">
                    UID: {{ log.gameUserId }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="hidden md:table-cell text-sm">
                <template v-if="actorOf(log).kind === 'owner'">
                  <span class="text-muted-foreground">{{ t("adminStatistics.uploadLogs.actor.owner") }}</span>
                </template>
                <template v-else-if="actorOf(log).kind === 'delegate'">
                  <RouterLink
                    :to="`/admin/users/${actorOf(log).actorUserId}`"
                    class="flex flex-col hover:underline text-primary"
                  >
                    <span class="font-medium">{{ actorOf(log).actorUserId }}</span>
                    <span class="text-xs text-muted-foreground/80">
                      {{ authorizationSourceLabel(log.authorizationSource) }}
                    </span>
                  </RouterLink>
                </template>
                <template v-else>
                  <span class="flex flex-col text-muted-foreground">
                    <span>{{ t("adminStatistics.uploadLogs.actor.unknown") }}</span>
                    <span v-if="log.authMethod" class="text-xs text-muted-foreground/80">
                      {{ authMethodLabel(log.authMethod) }}
                    </span>
                  </span>
                </template>
              </TableCell>
              <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                {{ props.serverLabel(log.server) }}
              </TableCell>
              <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                {{ props.methodLabel(log.uploadMethod) }}
              </TableCell>
              <TableCell class="hidden xl:table-cell text-sm text-muted-foreground">
                {{ props.dataTypeLabel(log.dataType) }}
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  :title="t('adminStatistics.uploadLogs.table.viewDetails')"
                  :aria-label="t('adminStatistics.uploadLogs.table.viewDetails')"
                  @click="openDetailDialog(log)"
                >
                  <LucideInfo class="w-4 h-4 xl:mr-1" />
                  <span class="hidden xl:inline">
                    {{ log.success ? t("adminStatistics.uploadLogs.table.viewDetails") : t("adminStatistics.uploadLogs.table.viewError") }}
                  </span>
                </Button>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground whitespace-nowrap pr-6">
                {{ props.formatTime(log.uploadTime) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
    <div
      v-if="shouldShowPagination"
      class="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6"
    >
      <span class="text-sm text-muted-foreground">
        {{ t("adminStatistics.uploadLogs.pagination.total", { total: formatNumberCN(props.total, '0') }) }}
      </span>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.page <= 1"
          :title="t('adminStatistics.uploadLogs.pagination.prev')"
          :aria-label="t('adminStatistics.uploadLogs.pagination.prev')"
          @click="emit('prev-page')"
        >
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ props.page }} / {{ props.totalPages }}</span>
        <Button
          variant="outline"
          size="sm"
          :disabled="props.page >= props.totalPages"
          :title="t('adminStatistics.uploadLogs.pagination.next')"
          :aria-label="t('adminStatistics.uploadLogs.pagination.next')"
          @click="emit('next-page')"
        >
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>

  <Dialog :open="showDetailDialog" @update:open="showDetailDialog = $event">
    <DialogScrollContent class="sm:max-w-[640px]">
      <DialogHeader>
        <DialogTitle>
          {{ selectedLog?.success === false ? t("adminStatistics.uploadLogs.errorDialog.title") : t("adminStatistics.uploadLogs.detail.title") }}
        </DialogTitle>
        <p class="text-sm text-muted-foreground">
          {{ t("adminStatistics.uploadLogs.detail.description") }}
        </p>
      </DialogHeader>

      <div class="space-y-3">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.owner") }}</div>
            <div class="text-sm font-medium break-all">
              {{ selectedLog ? (selectedLog.userName || ownerId(selectedLog) || t("adminStatistics.uploadLogs.table.noOwner")) : fallback }}
            </div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.actor") }}</div>
            <div class="text-sm font-medium break-all">
              {{ selectedLog ? (actorOf(selectedLog).actorUserId ?? t("adminStatistics.uploadLogs.actor.unknown")) : fallback }}
            </div>
          </div>
          <div v-for="row in detailRows" :key="row.label" class="space-y-1">
            <div class="text-xs text-muted-foreground">{{ row.label }}</div>
            <div class="text-sm break-all">{{ row.value }}</div>
            <div v-if="row.hint" class="text-xs text-muted-foreground/80">{{ row.hint }}</div>
          </div>
        </div>

        <div v-if="selectedLog?.success === false" class="space-y-1">
          <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.error") }}</div>
          <div class="rounded-md border bg-muted/20 px-3 py-3 text-sm whitespace-pre-wrap break-words">
            {{ selectedLog?.errorMessage || fallback }}
          </div>
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button>{{ t("adminStatistics.uploadLogs.errorDialog.close") }}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
