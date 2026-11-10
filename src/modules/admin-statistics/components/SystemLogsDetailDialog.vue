<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCopy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import LogsResultChip from "@/modules/admin-statistics/components/LogsResultChip.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { SystemLogEntry } from "@/modules/admin-statistics/api/system-log"
import { resolveSystemLogTarget } from "@/modules/admin-statistics/lib/logs-system-query"

/** One system log in full: the row's fields plus IP, user agent, request id and the metadata JSON. */
const props = defineProps<{
  log: SystemLogEntry | null
  loading: boolean
  error: ErrorDescription | null
  /** The metadata, already pretty-printed; empty when the log carries none. */
  detailText: string
  formatTime: (iso?: string) => string
}>()

const open = defineModel<boolean>("open", { required: true })

const emit = defineEmits<{
  retry: []
  copy: []
}>()

const { t, te } = useI18n()

type Row = { key: string; label: string; value: string; mono?: boolean }

const rows = computed<Row[]>(() => {
  const log = props.log
  if (!log) return []
  const actorTypePath = `adminStatistics.systemLogs.actorType.${log.actorType}`
  const actorType = log.actorType && te(actorTypePath) ? t(actorTypePath) : log.actorType ?? ""
  const actor = [log.actorUserId, log.actorRole ? `(${log.actorRole})` : ""].filter(Boolean).join(" ")
  const rows: Array<Row | null> = [
    { key: "action", label: t("adminStatistics.systemLogs.detail.action"), value: log.action, mono: true },
    resolveSystemLogTarget(log)
      ? { key: "target", label: t("adminStatistics.systemLogs.detail.target"), value: resolveSystemLogTarget(log)!, mono: true }
      : null,
    log.method || log.path
      ? { key: "request", label: t("adminStatistics.systemLogs.detail.request"), value: [log.method, log.path].filter(Boolean).join(" "), mono: true }
      : null,
    actor ? { key: "user", label: t("adminStatistics.systemLogs.detail.user"), value: actor } : null,
    actorType ? { key: "actorType", label: t("adminStatistics.systemLogs.detail.actorType"), value: actorType } : null,
    log.ip ? { key: "ip", label: "IP", value: log.ip, mono: true } : null,
    log.requestId ? { key: "requestId", label: t("adminStatistics.systemLogs.detail.requestId"), value: log.requestId, mono: true } : null,
  ]
  return rows.filter((row): row is Row => row !== null)
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ t("adminStatistics.systemLogs.detail.title") }}</DialogTitle>
        <!-- Which log this is: its id and when it happened. -->
        <DialogDescription class="tabular-nums">
          {{ log ? `#${log.id} · ${formatTime(log.eventTime)}` : t("adminStatistics.common.fallback") }}
        </DialogDescription>
      </DialogHeader>
      <template v-if="loading">
        <Skeleton class="h-32 w-full" />
      </template>
      <template v-else-if="error">
        <LoadErrorState
          :title="t('adminStatistics.systemLogs.toast.loadDetailFailedTitle')"
          :description="error.message"
          :detail="error.detail"
          :retrying="loading"
          @retry="emit('retry')"
        />
      </template>
      <template v-else-if="log">
        <div class="flex min-w-0 flex-col gap-3 text-sm">
          <dl class="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2">
            <dt class="text-muted-foreground">{{ t("adminStatistics.systemLogs.detail.result") }}</dt>
            <dd><LogsResultChip :success="log.result === 'success'" /></dd>
            <template v-for="row in rows" :key="row.key">
              <dt class="text-muted-foreground">{{ row.label }}</dt>
              <dd :class="['min-w-0 [overflow-wrap:anywhere]', row.mono ? 'font-mono text-[13px]' : 'tabular-nums']">{{ row.value }}</dd>
            </template>
          </dl>
          <div v-if="log.userAgent" class="flex flex-col gap-1">
            <span class="text-muted-foreground">User Agent</span>
            <p class="rounded-md bg-muted p-3 text-xs [overflow-wrap:anywhere]">{{ log.userAgent }}</p>
          </div>
          <div v-if="detailText" class="flex flex-col gap-1">
            <div class="flex items-center justify-between gap-2">
              <span class="text-muted-foreground">{{ t("adminStatistics.systemLogs.detail.detail") }}</span>
              <Button variant="ghost" size="sm" class="h-7" @click="emit('copy')">
                <LucideCopy class="mr-1 size-3.5" aria-hidden="true" />
                {{ t("adminStatistics.systemLogs.detail.copy") }}
              </Button>
            </div>
            <pre class="max-h-[50vh] overflow-auto rounded-md bg-muted p-3 text-xs break-words whitespace-pre-wrap">{{ detailText }}</pre>
          </div>
        </div>
      </template>
      <DialogFooter v-if="!loading && !error">
        <Button variant="outline" @click="open = false">{{ t("common.close") }}</Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
