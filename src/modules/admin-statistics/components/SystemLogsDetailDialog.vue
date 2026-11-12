<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCopy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
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

const DT = "w-24 shrink-0 text-xs leading-5 text-muted-foreground"
const DD = "min-w-0 flex-1 text-sm [overflow-wrap:anywhere]"
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent size="lg">
      <DialogHeader>
        <DialogTitle>{{ t("adminStatistics.systemLogs.detail.title") }}</DialogTitle>
        <!-- Which log this is: its id and when it happened. -->
        <DialogDescription class="tabular-nums">
          {{ log ? `#${log.id} · ${formatTime(log.eventTime)}` : t("adminStatistics.common.fallback") }}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Skeleton v-if="loading" class="h-32 w-full" />
        <LoadErrorState
          v-else-if="error"
          :title="t('adminStatistics.systemLogs.toast.loadDetailFailedTitle')"
          :description="error.message"
          :detail="error.detail"
          :retrying="loading"
          @retry="emit('retry')"
        />
        <template v-else-if="log">
          <SettingsGroup>
            <dl class="divide-y divide-border/60">
              <div class="flex gap-3 px-4 py-2.5">
                <dt :class="DT">{{ t("adminStatistics.systemLogs.detail.result") }}</dt>
                <dd :class="DD"><LogsResultChip :success="log.result === 'success'" /></dd>
              </div>
              <div v-for="row in rows" :key="row.key" class="flex gap-3 px-4 py-2.5">
                <dt :class="DT">{{ row.label }}</dt>
                <dd :class="[DD, row.mono ? 'font-mono text-[13px]' : 'tabular-nums']">{{ row.value }}</dd>
              </div>
              <div v-if="log.userAgent" class="flex gap-3 px-4 py-2.5">
                <dt :class="DT">User Agent</dt>
                <dd :class="[DD, 'text-xs leading-5']">{{ log.userAgent }}</dd>
              </div>
            </dl>
          </SettingsGroup>
          <SettingsGroup v-if="detailText" :title="t('adminStatistics.systemLogs.detail.detail')">
            <template #action>
              <Button variant="ghost" size="sm" class="h-7 pointer-coarse:h-9" @click="emit('copy')">
                <LucideCopy class="size-3.5" aria-hidden="true" />
                {{ t("adminStatistics.systemLogs.detail.copy") }}
              </Button>
            </template>
            <pre class="whitespace-pre-wrap px-4 py-3 font-mono text-xs leading-relaxed [overflow-wrap:anywhere]">{{ detailText }}</pre>
          </SettingsGroup>
        </template>
      </DialogBody>
      <DialogFooter v-if="!loading && !error">
        <Button variant="outline" @click="open = false">{{ t("common.close") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
