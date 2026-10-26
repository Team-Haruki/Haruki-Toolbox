<script setup lang="ts">
import { computed } from "vue"
import type { OAuthClientStatistics, OAuthClientTrendPoint } from "@/types/admin"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { VisXYContainer, VisLine, VisAxis, VisScatter, VisCrosshair, VisTooltip } from "@unovis/vue"
import { LucideChartLine } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import FieldError from "@/shared/components/FieldError.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"

const props = withDefaults(
  defineProps<{
    open: boolean
    loading: boolean
    stats: OAuthClientStatistics | null
    /** A failed load; shown inline with a retry. */
    error?: ErrorDescription | null
    clientId?: string
    statsFrom?: Date
    statsTo?: Date
    statsBucket: "hour" | "day"
    /** "Start is after end", shown under the pickers. */
    timeRangeError?: string | null
  }>(),
  {
    stats: null,
    error: null,
    clientId: "",
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
const { t } = useI18n()

type SummaryKey = keyof OAuthClientStatistics["summary"]
type TileGroup = { titleKey: string; keys: readonly SummaryKey[] }

// Two groups of four: what exists for the client, and what the range produced.
const tileGroups: readonly TileGroup[] = [
  {
    titleKey: "adminOAuthClients.statsDialog.authorizations",
    keys: ["authorizationTotal", "authorizationActive", "authorizationRevoked", "authorizationCreatedInRange"],
  },
  {
    titleKey: "adminOAuthClients.statsDialog.tokens",
    keys: ["tokenTotal", "tokenActive", "tokenRevoked", "tokenIssuedInRange"],
  },
]

const seriesColors = { authorizations: "#3b82f6", tokens: "#22c55e" } as const
const trend = computed(() => props.stats?.trend ?? [])

function x(_: OAuthClientTrendPoint, index: number) {
  return index
}
function yAuthorizations(point: OAuthClientTrendPoint) {
  return point.authorizationCreated
}
function yTokens(point: OAuthClientTrendPoint) {
  return point.tokenIssued
}

function formatBucket(value: string | undefined) {
  if (props.statsBucket === "day") {
    return formatLocalizedDateTime(value, { month: "short", day: "numeric" }, "")
  }
  return formatLocalizedDateTime(value, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }, "")
}

function xTickFormat(index: number) {
  return formatBucket(trend.value[index]?.bucketStart)
}

function crosshairTemplate(point: OAuthClientTrendPoint) {
  // Content only: the unovis tooltip wrapper draws the box.
  return `<div style="font-size:12px;line-height:1.55">
    <div style="font-weight:600;margin-bottom:2px">${formatBucket(point.bucketStart)}</div>
    <div style="color:${seriesColors.authorizations}">${t("adminOAuthClients.statsDialog.trendAuthorizations")}: ${point.authorizationCreated}</div>
    <div style="color:${seriesColors.tokens}">${t("adminOAuthClients.statsDialog.trendTokens")}: ${point.tokenIssued}</div>
  </div>`
}

const rangeLabel = computed(() => {
  const from = props.stats?.from
  const to = props.stats?.to
  if (!from || !to) return ""
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
  return `${formatLocalizedDateTime(from, options, "")} – ${formatLocalizedDateTime(to, options, "")}`
})

const timeRangeErrorId = "oauth-stats-time-range-error"
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.statsDialog.title") }}</DialogTitle>
        <DialogDescription v-if="props.clientId">
          <code class="rounded bg-muted px-1.5 py-0.5 text-xs">{{ props.clientId }}</code>
        </DialogDescription>
      </DialogHeader>

      <template v-if="props.loading">
        <div class="grid gap-3 sm:grid-cols-4">
          <Skeleton v-for="i in 8" :key="i" class="h-16 w-full rounded-lg" />
        </div>
        <Skeleton class="h-48 w-full rounded-lg" />
      </template>
      <LoadErrorState
        v-else-if="props.error"
        :title="t('adminOAuthClients.toast.loadStatsFailedTitle')"
        :description="props.error.message"
        :detail="props.error.detail"
        @retry="emit('retry')"
      />
      <template v-else-if="props.stats">
        <p v-if="rangeLabel" class="text-xs text-muted-foreground">
          {{ t("adminOAuthClients.statsDialog.rangeLabel", { range: rangeLabel }) }}
        </p>
        <section v-for="group in tileGroups" :key="group.titleKey" class="flex flex-col gap-2">
          <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ t(group.titleKey) }}</h3>
          <div class="grid gap-2 sm:grid-cols-4">
            <div v-for="key in group.keys" :key="key" class="rounded-lg border p-3">
              <div class="text-xl font-bold leading-tight tabular-nums">{{ formatNumberCN(props.stats.summary[key], "0") }}</div>
              <div class="text-xs text-muted-foreground">{{ t(`adminOAuthClients.statsDialog.summary.${key}`) }}</div>
            </div>
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {{ t("adminOAuthClients.statsDialog.trendTitle") }}
          </h3>
          <div v-if="trend.length > 0" class="h-48">
            <VisXYContainer :data="trend" :height="192">
              <VisLine :x="x" :y="yAuthorizations" :color="seriesColors.authorizations" curveType="monotoneX" />
              <VisScatter :x="x" :y="yAuthorizations" :color="seriesColors.authorizations" :size="4" />
              <VisLine :x="x" :y="yTokens" :color="seriesColors.tokens" curveType="monotoneX" />
              <VisScatter :x="x" :y="yTokens" :color="seriesColors.tokens" :size="4" />
              <VisCrosshair :template="crosshairTemplate" />
              <VisTooltip />
              <VisAxis type="x" :tickFormat="xTickFormat" />
              <VisAxis type="y" />
            </VisXYContainer>
          </div>
          <div v-else class="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
            <LucideChartLine class="h-6 w-6 text-muted-foreground/60" />
            <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.statsDialog.trendEmpty") }}</p>
          </div>
          <div v-if="trend.length > 0" class="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seriesColors.authorizations }" />
              {{ t("adminOAuthClients.statsDialog.trendAuthorizations") }}
            </span>
            <span class="flex items-center gap-1.5">
              <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: seriesColors.tokens }" />
              {{ t("adminOAuthClients.statsDialog.trendTokens") }}
            </span>
          </div>
        </section>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-8 text-center">
          <LucideChartLine class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.common.empty") }}</p>
        </div>
      </template>

      <Separator />

      <form class="flex flex-col gap-3" novalidate @submit.prevent="emit('apply')">
        <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {{ t("adminOAuthClients.statsDialog.filters") }}
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <Label for="oauth-stats-from" class="text-sm">{{ t("adminOAuthClients.statsDialog.from") }}</Label>
            <DateTimePicker24h
              id="oauth-stats-from"
              :model-value="props.statsFrom"
              :placeholder="t('adminOAuthClients.statsDialog.from')"
              :aria-invalid="props.timeRangeError ? true : undefined"
              :aria-describedby="props.timeRangeError ? timeRangeErrorId : undefined"
              @update:model-value="emit('update:statsFrom', $event)"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="oauth-stats-to" class="text-sm">{{ t("adminOAuthClients.statsDialog.to") }}</Label>
            <DateTimePicker24h
              id="oauth-stats-to"
              :model-value="props.statsTo"
              :placeholder="t('adminOAuthClients.statsDialog.to')"
              :aria-invalid="props.timeRangeError ? true : undefined"
              :aria-describedby="props.timeRangeError ? timeRangeErrorId : undefined"
              @update:model-value="emit('update:statsTo', $event)"
            />
          </div>
        </div>
        <FieldError :id="timeRangeErrorId" :message="props.timeRangeError" />
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div class="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label id="oauth-stats-bucket-label" for="oauth-stats-bucket" class="text-sm">{{ t("adminOAuthClients.statsDialog.bucket") }}</Label>
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
            <Button type="submit" :disabled="props.loading">{{ t("adminOAuthClients.statsDialog.apply") }}</Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>
