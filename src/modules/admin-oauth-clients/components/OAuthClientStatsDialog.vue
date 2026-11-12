<script setup lang="ts">
/**
 * One client's numbers for a time range: the range filter on top (it scopes
 * everything under it), four counters, how many of the authorizations and
 * tokens are still active, the per-bucket trend, and what admins did to the
 * client in the same range (the audit summary). While a new range loads the
 * previous numbers stay up, dimmed, so nothing jumps.
 */
import { computed } from "vue"
import type { OAuthClientStatistics } from "@/types/admin"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Button } from "@/components/ui/button"
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideChartLine,
  LucideLoader2,
  LucideTicket,
  LucideTicketPlus,
  LucideUserCheck,
  LucideUserPlus,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import FieldError from "@/shared/components/FieldError.vue"
import AdminAnimatedNumber from "@/modules/admin/components/AdminAnimatedNumber.vue"
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import AdminSparkline from "@/modules/admin/components/AdminSparkline.vue"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN, formatPercent } from "@/lib/number-format"
import {
  OAUTH_CLIENT_AUDIT_ACTION_KEYS,
  type OAuthClientAuditSummary,
  ratePercent,
  summarizeOAuthClientTrend,
} from "@/modules/admin-oauth-clients/lib/client-stats"
import OAuthClientTrendChart from "./OAuthClientTrendChart.vue"

const props = withDefaults(
  defineProps<{
    open: boolean
    loading: boolean
    stats: OAuthClientStatistics | null
    /** A failed load; shown inline with a retry. */
    error?: ErrorDescription | null
    /** Admin actions on the client in the same range; null while loading or when its request failed. */
    audit?: OAuthClientAuditSummary | null
    auditError?: ErrorDescription | null
    clientId?: string
    clientName?: string
    statsFrom?: Date
    statsTo?: Date
    statsBucket: "hour" | "day"
    /** "Start is after end", shown under the pickers. */
    timeRangeError?: string | null
  }>(),
  {
    stats: null,
    error: null,
    audit: null,
    auditError: null,
    clientId: "",
    clientName: "",
    statsFrom: undefined,
    statsTo: undefined,
    timeRangeError: null,
  }
)

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:statsFrom", value: Date | undefined): void
  (event: "update:statsTo", value: Date | undefined): void
  (event: "update:statsBucket", value: "hour" | "day"): void
  (event: "apply"): void
  (event: "reset"): void
  (event: "retry"): void
}>()
const { t, te } = useI18n()

const trend = computed(() => props.stats?.trend ?? [])
const trendSummary = computed(() => summarizeOAuthClientTrend(trend.value))
/** The bucket the loaded numbers were built with, which lags the select until "apply". */
const loadedBucket = computed(() => props.stats?.bucket ?? props.statsBucket)

const rangeLabel = computed(() => {
  const from = props.stats?.from
  const to = props.stats?.to
  if (!from || !to) return ""
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  return `${formatLocalizedDateTime(from, options, "")} – ${formatLocalizedDateTime(to, options, "")}`
})

const ACTIVE_COLOR = "var(--color-emerald-500)"
const REVOKED_COLOR = "color-mix(in oklab, var(--muted-foreground) 55%, transparent)"

function shareText(part: number, total: number): string {
  const share = ratePercent(part, total)
  return share === null ? formatNumberCN(part) : `${formatNumberCN(part)} · ${formatPercent(share, 0)}`
}

function stateItems(active: number, revoked: number, total: number): AdminMeterItem[] {
  return [
    { key: "active", label: t("adminOAuthClients.statsDialog.stateActive"), value: active, text: shareText(active, total), color: ACTIVE_COLOR },
    { key: "revoked", label: t("adminOAuthClients.statsDialog.stateRevoked"), value: revoked, text: shareText(revoked, total), color: REVOKED_COLOR },
  ]
}

const authorizationState = computed(() => {
  const summary = props.stats?.summary
  return summary ? stateItems(summary.authorizationActive, summary.authorizationRevoked, summary.authorizationTotal) : []
})
const tokenState = computed(() => {
  const summary = props.stats?.summary
  return summary ? stateItems(summary.tokenActive, summary.tokenRevoked, summary.tokenTotal) : []
})

/** The six most frequent audit actions; the rest fold into the panel's "other" line. */
const AUDIT_ACTION_LIMIT = 6

function auditActionLabel(action: string): string {
  const suffix = OAUTH_CLIENT_AUDIT_ACTION_KEYS.get(action)
  const key = suffix ? `adminOAuthClients.statsDialog.audit.action.${suffix}` : ""
  return key && te(key) ? t(key) : action
}

const auditActions = computed<AdminMeterItem[]>(() => {
  const audit = props.audit
  if (!audit) return []
  return audit.byAction.slice(0, AUDIT_ACTION_LIMIT).map((row) => ({
    key: row.key,
    label: auditActionLabel(row.key),
    value: row.count,
    text: shareText(row.count, audit.total),
  }))
})

const auditOtherCount = computed(() =>
  (props.audit?.byAction ?? []).slice(AUDIT_ACTION_LIMIT).reduce((sum, row) => sum + row.count, 0)
)

const auditSuccessRate = computed(() => (props.audit ? ratePercent(props.audit.success, props.audit.total) : null))

function formatRate(value: number): string {
  return formatPercent(value, 1)
}

const timeRangeErrorId = "oauth-stats-time-range-error"
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <!-- Without a client id there is no visible description; the title then stands in for screen readers. -->
    <DialogContent size="xl" :description="props.clientId ? undefined : t('adminOAuthClients.statsDialog.title')">
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.statsDialog.title") }}</DialogTitle>
        <DialogDescription v-if="props.clientId" class="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span v-if="props.clientName" class="font-medium text-foreground [overflow-wrap:anywhere]">{{ props.clientName }}</span>
          <code class="font-mono text-xs [overflow-wrap:anywhere]">{{ props.clientId }}</code>
        </DialogDescription>
      </DialogHeader>

      <DialogBody class="@container">
        <!-- The range comes first: every number under it is for this range. -->
        <form
          class="rounded-xl border bg-card px-4 py-3"
          novalidate
          :aria-label="t('adminOAuthClients.statsDialog.filters')"
          @submit.prevent="emit('apply')"
        >
          <div class="grid gap-3 @min-[40rem]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_9rem_auto] @min-[40rem]:items-end">
            <div class="flex min-w-0 flex-col gap-1.5">
              <Label for="oauth-stats-from" class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.from") }}</Label>
              <DateTimePicker24h
                id="oauth-stats-from"
                :model-value="props.statsFrom"
                :placeholder="t('adminOAuthClients.statsDialog.from')"
                :aria-invalid="props.timeRangeError ? true : undefined"
                :aria-describedby="props.timeRangeError ? timeRangeErrorId : undefined"
                @update:model-value="emit('update:statsFrom', $event)"
              />
            </div>
            <div class="flex min-w-0 flex-col gap-1.5">
              <Label for="oauth-stats-to" class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.to") }}</Label>
              <DateTimePicker24h
                id="oauth-stats-to"
                :model-value="props.statsTo"
                :placeholder="t('adminOAuthClients.statsDialog.to')"
                :aria-invalid="props.timeRangeError ? true : undefined"
                :aria-describedby="props.timeRangeError ? timeRangeErrorId : undefined"
                @update:model-value="emit('update:statsTo', $event)"
              />
            </div>
            <div class="flex min-w-0 flex-col gap-1.5">
              <Label id="oauth-stats-bucket-label" for="oauth-stats-bucket" class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.bucket") }}</Label>
              <Select id="oauth-stats-bucket" :model-value="props.statsBucket" @update:model-value="value => emit('update:statsBucket', value === 'day' ? 'day' : 'hour')">
                <SelectTrigger aria-labelledby="oauth-stats-bucket-label" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hour">{{ t("adminOAuthClients.statsDialog.hour") }}</SelectItem>
                  <SelectItem value="day">{{ t("adminOAuthClients.statsDialog.day") }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex shrink-0 justify-end gap-2">
              <Button type="button" variant="outline" @click="emit('reset')">{{ t("common.reset") }}</Button>
              <Button type="submit" :disabled="props.loading">
                <LucideLoader2 v-if="props.loading" class="size-4 animate-spin" aria-hidden="true" />
                {{ t("adminOAuthClients.statsDialog.apply") }}
              </Button>
            </div>
          </div>
          <FieldError :id="timeRangeErrorId" class="mt-2" :message="props.timeRangeError" />
          <p v-if="rangeLabel && !props.timeRangeError" class="mt-2 text-xs tabular-nums text-muted-foreground" data-testid="oauth-stats-range">
            {{ t("adminOAuthClients.statsDialog.rangeLabel", { range: rangeLabel }) }}
          </p>
        </form>

        <template v-if="props.loading && !props.stats">
          <AdminStatGrid :columns="4">
            <AdminStatTile v-for="i in 4" :key="i" label=" " loading />
          </AdminStatGrid>
          <Skeleton class="h-56 w-full rounded-xl" />
        </template>
        <div v-else-if="props.error" class="rounded-xl border bg-card">
          <LoadErrorState
            :title="t('adminOAuthClients.toast.loadStatsFailedTitle')"
            :description="props.error.message"
            :detail="props.error.detail"
            @retry="emit('retry')"
          />
        </div>
        <div
          v-else-if="props.stats"
          :class="['flex min-w-0 flex-col gap-4 transition-opacity duration-200', props.loading ? 'opacity-60' : '']"
          :aria-busy="props.loading || undefined"
          data-testid="oauth-stats-content"
        >
          <AdminStatGrid :columns="4">
            <AdminStatTile
              :label="t('adminOAuthClients.statsDialog.summary.authorizationTotal')"
              :value="props.stats.summary.authorizationTotal"
              :icon="LucideUserCheck"
              tone="primary"
              data-stat="authorizationTotal"
            />
            <AdminStatTile
              :label="t('adminOAuthClients.statsDialog.summary.authorizationCreatedInRange')"
              :value="props.stats.summary.authorizationCreatedInRange"
              :icon="LucideUserPlus"
              tone="info"
              data-stat="authorizationCreatedInRange"
            >
              <AdminSparkline
                v-if="trendSummary.authorizationSum > 0 && trend.length > 1"
                :values="trendSummary.authorizations"
                class="text-[#2a78d6] dark:text-[#3987e5]"
                :label="t('adminOAuthClients.statsDialog.trendAuthorizations')"
              />
            </AdminStatTile>
            <AdminStatTile
              :label="t('adminOAuthClients.statsDialog.summary.tokenTotal')"
              :value="props.stats.summary.tokenTotal"
              :icon="LucideTicket"
              data-stat="tokenTotal"
            />
            <AdminStatTile
              :label="t('adminOAuthClients.statsDialog.summary.tokenIssuedInRange')"
              :value="props.stats.summary.tokenIssuedInRange"
              :icon="LucideTicketPlus"
              tone="warning"
              data-stat="tokenIssuedInRange"
            >
              <AdminSparkline
                v-if="trendSummary.tokenSum > 0 && trend.length > 1"
                :values="trendSummary.tokens"
                class="text-[#eb6834] dark:text-[#d95926]"
                :label="t('adminOAuthClients.statsDialog.trendTokens')"
              />
            </AdminStatTile>
          </AdminStatGrid>

          <div class="grid gap-4 @min-[40rem]:grid-cols-2">
            <AdminPanel :title="t('adminOAuthClients.statsDialog.authorizations')" :description="t('adminOAuthClients.statsDialog.authorizationStateHint')">
              <AdminMeterList
                v-if="props.stats.summary.authorizationTotal > 0"
                :items="authorizationState"
                :total="props.stats.summary.authorizationTotal"
              />
              <p v-else class="py-2 text-center text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.noAuthorizations") }}</p>
            </AdminPanel>
            <AdminPanel :title="t('adminOAuthClients.statsDialog.tokens')" :description="t('adminOAuthClients.statsDialog.tokenStateHint')">
              <AdminMeterList
                v-if="props.stats.summary.tokenTotal > 0"
                :items="tokenState"
                :total="props.stats.summary.tokenTotal"
              />
              <p v-else class="py-2 text-center text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.noTokens") }}</p>
            </AdminPanel>
          </div>

          <AdminPanel
            :title="t('adminOAuthClients.statsDialog.trendTitle')"
            :description="t(loadedBucket === 'day' ? 'adminOAuthClients.statsDialog.trendHintDay' : 'adminOAuthClients.statsDialog.trendHintHour')"
          >
            <OAuthClientTrendChart :trend="trend" :bucket="loadedBucket" />
          </AdminPanel>

          <AdminPanel
            :title="t('adminOAuthClients.statsDialog.audit.title')"
            :description="t('adminOAuthClients.statsDialog.audit.description')"
            data-testid="oauth-stats-audit"
          >
            <p v-if="props.auditError" class="py-2 text-center text-xs text-muted-foreground" role="alert">
              {{ t("adminOAuthClients.statsDialog.audit.loadFailed") }}
              <span class="[overflow-wrap:anywhere]">{{ props.auditError.message }}</span>
            </p>
            <p v-else-if="!props.audit || props.audit.total === 0" class="py-2 text-center text-xs text-muted-foreground">
              {{ t("adminOAuthClients.statsDialog.audit.empty") }}
            </p>
            <div v-else class="grid gap-x-8 gap-y-4 @min-[40rem]:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
              <dl class="grid grid-cols-2 content-start gap-x-4 gap-y-3">
                <div>
                  <dt class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.audit.total") }}</dt>
                  <dd class="text-lg leading-tight font-semibold"><AdminAnimatedNumber :value="props.audit.total" /></dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.audit.successRate") }}</dt>
                  <dd class="text-lg leading-tight font-semibold">
                    <AdminAnimatedNumber v-if="auditSuccessRate !== null" :value="auditSuccessRate" :format="formatRate" />
                    <span v-else class="text-muted-foreground">—</span>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.audit.success") }}</dt>
                  <dd class="text-lg leading-tight font-semibold"><AdminAnimatedNumber :value="props.audit.success" /></dd>
                </div>
                <div>
                  <dt class="text-xs text-muted-foreground">{{ t("adminOAuthClients.statsDialog.audit.failure") }}</dt>
                  <dd class="text-lg leading-tight font-semibold"><AdminAnimatedNumber :value="props.audit.failure" /></dd>
                </div>
              </dl>
              <div class="min-w-0">
                <AdminMeterList :items="auditActions" :total="props.audit.total" />
                <p v-if="auditOtherCount > 0" class="mt-2.5 text-xs tabular-nums text-muted-foreground">
                  {{ t("adminOAuthClients.statsDialog.audit.other", { count: formatNumberCN(auditOtherCount) }) }}
                </p>
              </div>
            </div>
          </AdminPanel>
        </div>
        <div v-else class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card py-8 text-center">
          <LucideChartLine class="size-8 text-muted-foreground/60" aria-hidden="true" />
          <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.common.empty") }}</p>
        </div>
      </DialogBody>
    </DialogContent>
  </Dialog>
</template>
