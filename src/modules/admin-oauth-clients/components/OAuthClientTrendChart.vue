<script setup lang="ts">
/**
 * New authorizations and issued tokens per time bucket, as the statistics
 * response lists them. Both are counts on one axis. A series with no value
 * in the range is not drawn (a line lying on the baseline says nothing), and
 * the table view lists the same buckets for anyone who cannot use the chart.
 */
import { computed, ref, useTemplateRef } from "vue"
import { useElementSize } from "@vueuse/core"
import { useI18n } from "vue-i18n"
import { VisAxis, VisCrosshair, VisLine, VisScatter, VisTooltip, VisXYContainer } from "@unovis/vue"
import { LucideChartLine, LucideTable } from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"
import type { OAuthClientTrendPoint } from "@/types/admin"
import { integerAxisTicks, pickTickIndexes, summarizeOAuthClientTrend } from "@/modules/admin-oauth-clients/lib/client-stats"

const props = defineProps<{
  trend: readonly OAuthClientTrendPoint[]
  bucket: "hour" | "day"
}>()

const { t } = useI18n()

type SeriesKey = "authorizations" | "tokens"
type Series = { key: SeriesKey; label: string; color: string; sum: number; y: (point: OAuthClientTrendPoint) => number }

// Categorical slots 1 and 2 of the validated palette; the dark steps are set in the style block.
const SERIES_COLOR: Record<SeriesKey, string> = {
  authorizations: "var(--oauth-trend-authorizations)",
  tokens: "var(--oauth-trend-tokens)",
}

const summary = computed(() => summarizeOAuthClientTrend(props.trend))

const series = computed<Series[]>(() => {
  const all: Series[] = [
    {
      key: "authorizations",
      label: t("adminOAuthClients.statsDialog.trendAuthorizations"),
      color: SERIES_COLOR.authorizations,
      sum: summary.value.authorizationSum,
      y: (point) => point.authorizationCreated,
    },
    {
      key: "tokens",
      label: t("adminOAuthClients.statsDialog.trendTokens"),
      color: SERIES_COLOR.tokens,
      sum: summary.value.tokenSum,
      y: (point) => point.tokenIssued,
    },
  ]
  return all.filter((entry) => entry.sum > 0)
})

const hasActivity = computed(() => series.value.length > 0)
const data = computed(() => [...props.trend])

const view = ref<"chart" | "table">("chart")

const wrap = useTemplateRef<HTMLElement>("wrap")
const { width } = useElementSize(wrap)

const CHART_HEIGHT = 208
const x = (_point: OAuthClientTrendPoint, index: number) => index

// Counts are whole numbers: the axis gets whole-number ticks and ends on one.
const yTicks = computed(() => integerAxisTicks(Math.max(0, ...summary.value.authorizations, ...summary.value.tokens)))
const yDomain = computed<[number, number]>(() => [0, yTicks.value[yTicks.value.length - 1] ?? 4])

/** A bucket label is ~90 px wide ("11/10 14:00"); a day label about half of that. */
const xTicks = computed(() => {
  const labelWidth = props.bucket === "day" ? 64 : 96
  const fit = Math.floor((width.value || 560) / labelWidth)
  return pickTickIndexes(props.trend.length, Math.max(2, Math.min(8, fit)))
})

/** Dots mark the points only while they are far enough apart to read as points. */
const showMarkers = computed(() => props.trend.length <= 32 && (width.value || 560) / Math.max(1, props.trend.length) >= 16)

function formatBucket(value: string | undefined) {
  if (props.bucket === "day") {
    return formatLocalizedDateTime(value, { month: "numeric", day: "numeric" }, "")
  }
  return formatLocalizedDateTime(value, { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }, "")
}

function xTickFormat(index: number) {
  return Number.isInteger(index) ? formatBucket(props.trend[index]?.bucketStart) : ""
}

function yTickFormat(value: number) {
  return Number.isInteger(value) ? formatNumberCN(value) : ""
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)
}

// The unovis tooltip takes markup; every piece of text in it is escaped, and
// the values lead while the series names follow in the muted tone.
function crosshairTemplate(point: OAuthClientTrendPoint) {
  const rows = series.value.map((entry) => `
    <div style="display:flex;align-items:center;gap:8px">
      <span style="width:12px;height:2px;border-radius:1px;background:${entry.color};flex:none"></span>
      <span style="font-weight:600;font-variant-numeric:tabular-nums">${escapeHtml(formatNumberCN(entry.y(point)))}</span>
      <span style="color:var(--muted-foreground)">${escapeHtml(entry.label)}</span>
    </div>`).join("")
  return `<div style="font-size:12px;line-height:1.6">
    <div style="color:var(--muted-foreground);font-variant-numeric:tabular-nums">${escapeHtml(formatBucket(point.bucketStart))}</div>${rows}
  </div>`
}

const crosshairY = computed(() => series.value.map((entry) => entry.y))
const crosshairColor = (_point: OAuthClientTrendPoint, index: number) => series.value[index]?.color ?? SERIES_COLOR.authorizations

const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true

/** Only the buckets in which something happened: a day of hourly zeros is not worth 24 lines. */
const tableRows = computed(() => props.trend.filter((point) => point.authorizationCreated > 0 || point.tokenIssued > 0))

const chartLabel = computed(() => t("adminOAuthClients.statsDialog.trendSummary", {
  authorizations: formatNumberCN(summary.value.authorizationSum),
  tokens: formatNumberCN(summary.value.tokenSum),
  buckets: formatNumberCN(props.trend.length),
}))

const peakLabel = computed(() => {
  const peak = summary.value.peak
  return peak
    ? t("adminOAuthClients.statsDialog.trendPeak", {
        time: formatBucket(peak.bucketStart),
        count: formatNumberCN(peak.authorizations + peak.tokens),
      })
    : ""
})
</script>

<template>
  <div class="oauth-trend flex flex-col gap-3" data-testid="oauth-client-trend">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <!-- With one series the heading already says what the line is; a legend only appears for two. -->
      <ul v-if="series.length > 1" class="flex flex-wrap gap-x-4 gap-y-1 text-xs" role="list" data-testid="oauth-client-trend-legend">
        <li v-for="entry in series" :key="entry.key" class="flex items-center gap-1.5">
          <span class="h-0.5 w-3 shrink-0 rounded-full" :style="{ backgroundColor: entry.color }" aria-hidden="true" />
          <span>{{ entry.label }}</span>
          <span class="tabular-nums text-muted-foreground">{{ formatNumberCN(entry.sum) }}</span>
        </li>
      </ul>
      <p v-else-if="series.length === 1" class="flex items-center gap-1.5 text-xs">
        <span class="h-0.5 w-3 shrink-0 rounded-full" :style="{ backgroundColor: series[0]!.color }" aria-hidden="true" />
        <span>{{ series[0]!.label }}</span>
        <span class="tabular-nums text-muted-foreground">{{ formatNumberCN(series[0]!.sum) }}</span>
      </p>
      <span v-else />

      <div
        v-if="hasActivity"
        class="ml-auto inline-flex shrink-0 rounded-md border p-0.5"
        role="group"
        :aria-label="t('adminOAuthClients.statsDialog.trendView')"
      >
        <button
          v-for="option in (['chart', 'table'] as const)"
          :key="option"
          type="button"
          :aria-pressed="view === option"
          :title="t(`adminOAuthClients.statsDialog.trendView${option === 'chart' ? 'Chart' : 'Table'}`)"
          :aria-label="t(`adminOAuthClients.statsDialog.trendView${option === 'chart' ? 'Chart' : 'Table'}`)"
          :class="[
            'inline-flex size-6 items-center justify-center rounded-sm transition-colors pointer-coarse:size-9',
            view === option ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
          ]"
          @click="view = option"
        >
          <LucideChartLine v-if="option === 'chart'" class="size-3.5" aria-hidden="true" />
          <LucideTable v-else class="size-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div v-if="!hasActivity" class="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <LucideChartLine class="size-6 text-muted-foreground/60" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">{{ t("adminOAuthClients.statsDialog.trendEmpty") }}</p>
    </div>

    <template v-else-if="view === 'chart'">
      <div ref="wrap" class="min-w-0" role="img" :aria-label="chartLabel" :style="{ height: `${CHART_HEIGHT}px` }">
        <VisXYContainer
          :data="data"
          :height="CHART_HEIGHT"
          :y-domain="yDomain"
          :duration="reducedMotion ? 0 : 600"
          :margin="{ top: 8, right: 16, bottom: 4, left: 4 }"
        >
          <!-- Straight segments between buckets: a smoothed curve would draw values nothing measured. -->
          <template v-for="entry in series" :key="entry.key">
            <VisLine :x="x" :y="entry.y" :color="entry.color" :line-width="2" curve-type="linear" />
            <VisScatter
              v-if="showMarkers"
              :x="x"
              :y="entry.y"
              :color="entry.color"
              :size="7"
              stroke-color="var(--background)"
              :stroke-width="2"
            />
          </template>
          <VisCrosshair :x="x" :y="crosshairY" :color="crosshairColor" :template="crosshairTemplate" />
          <VisTooltip />
          <VisAxis
            type="x"
            :tick-values="xTicks"
            :tick-format="xTickFormat"
            :grid-line="false"
            :tick-line="false"
            :domain-line="true"
          />
          <VisAxis type="y" :tick-values="yTicks" :tick-format="yTickFormat" :tick-line="false" :domain-line="false" />
        </VisXYContainer>
      </div>
      <p v-if="peakLabel" class="text-xs text-muted-foreground">{{ peakLabel }}</p>
    </template>

    <div v-else class="max-h-60 overflow-y-auto rounded-lg border border-border/60">
      <table class="w-full text-left text-xs tabular-nums">
        <caption class="sr-only">{{ chartLabel }}</caption>
        <thead class="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th scope="col" class="px-3 py-1.5 font-medium">{{ t("adminOAuthClients.statsDialog.trendBucket") }}</th>
            <th scope="col" class="px-3 py-1.5 text-right font-medium">{{ t("adminOAuthClients.statsDialog.trendAuthorizations") }}</th>
            <th scope="col" class="px-3 py-1.5 text-right font-medium">{{ t("adminOAuthClients.statsDialog.trendTokens") }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr v-for="point in tableRows" :key="point.bucketStart">
            <th scope="row" class="px-3 py-1.5 font-normal">{{ formatBucket(point.bucketStart) }}</th>
            <td class="px-3 py-1.5 text-right">{{ formatNumberCN(point.authorizationCreated) }}</td>
            <td class="px-3 py-1.5 text-right">{{ formatNumberCN(point.tokenIssued) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="border-t border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        {{ t("adminOAuthClients.statsDialog.trendTableNote", { shown: formatNumberCN(tableRows.length), total: formatNumberCN(props.trend.length) }) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.oauth-trend {
  --oauth-trend-authorizations: #2a78d6;
  --oauth-trend-tokens: #eb6834;
}

.dark .oauth-trend {
  --oauth-trend-authorizations: #3987e5;
  --oauth-trend-tokens: #d95926;
}
</style>
