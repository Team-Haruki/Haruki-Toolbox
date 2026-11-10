<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  LucideCheckCircle2,
  LucideInfo,
  LucideLoader2,
  LucidePlus,
  LucideRefreshCw,
  LucideShieldCheck,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN } from "@/lib/number-format"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { RiskEventItem } from "@/modules/admin-risk/api/types"
import RiskSeverityBadge from "@/modules/admin-risk/components/RiskSeverityBadge.vue"
import RiskStatusBadge from "@/modules/admin-risk/components/RiskStatusBadge.vue"
import { RISK_EVENT_FILTER_ALL } from "@/modules/admin-risk/composables/useRiskEvents"
import {
  RISK_EVENT_RANGE_LABEL_KEYS,
  RISK_EVENT_RANGES,
  RISK_EVENT_STATUSES,
  RISK_SEVERITIES,
  type RiskEventRange,
} from "@/modules/admin-risk/lib/event-stats"

/**
 * The event list: the time window and the two filters in the heading, then
 * dense rows. The columns follow the panel's own width; below 34rem the
 * action cell carries the status, the time and the user as well.
 */
const props = defineProps<{
  loading: boolean
  error: ErrorDescription | null
  events: RiskEventItem[]
  totalEvents: number
  eventPage: number
  eventPageSize: number
  totalPages: number
  actionLoading: boolean
  formatDate: (value?: string | null) => string
}>()

const range = defineModel<RiskEventRange>("range", { required: true })
const statusFilter = defineModel<string>("statusFilter", { required: true })
const severityFilter = defineModel<string>("severityFilter", { required: true })

const emit = defineEmits<{
  (event: "create"): void
  (event: "detail", item: RiskEventItem): void
  (event: "resolve", item: RiskEventItem): void
  (event: "refresh"): void
  (event: "retry"): void
  (event: "update:eventPageSize", value: number): void
  (event: "prevPage"): void
  (event: "nextPage"): void
  (event: "goToPage", page: number): void
}>()

const { t, locale } = useI18n()

function updateRange(value: unknown) {
  const next = RISK_EVENT_RANGES.find((option) => option === value)
  if (next) range.value = next
}

function updateStatus(value: unknown) {
  if (typeof value === "string") statusFilter.value = value
}

function updateSeverity(value: unknown) {
  if (typeof value === "string") severityFilter.value = value
}

const HEAD = "px-3 py-2 text-left text-xs font-medium text-muted-foreground"
const CELL = "px-3 py-2 align-top"
const ICON_BUTTON = "size-8 text-muted-foreground pointer-coarse:size-10"
</script>

<template>
  <AdminPanel :title="t('adminRisk.events.title')" flush>
    <template #actions>
      <Button
        variant="outline"
        size="icon"
        class="size-8 pointer-coarse:size-10"
        :disabled="props.loading"
        :title="t('adminRisk.events.refresh')"
        :aria-label="t('adminRisk.events.refresh')"
        @click="emit('refresh')"
      >
        <LucideLoader2 v-if="props.loading" class="size-4 animate-spin" aria-hidden="true" />
        <LucideRefreshCw v-else class="size-4" aria-hidden="true" />
      </Button>
      <!-- A failed list load disables creation: the new event could not be shown either way. -->
      <Button size="sm" class="h-8 pointer-coarse:h-10" :disabled="!!props.error" @click="emit('create')">
        <LucidePlus class="size-4" aria-hidden="true" />
        {{ t("adminRisk.events.createButton") }}
      </Button>
    </template>

    <!-- The window and the two filters apply as soon as one is chosen. They sit
         under the heading: its action slot does not wrap on a phone. -->
    <div class="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-2.5" data-testid="risk-event-filters">
      <Select :key="`range-${locale}`" :model-value="range" @update:model-value="updateRange">
        <SelectTrigger size="sm" class="w-auto gap-1.5 text-xs" :aria-label="t('adminRisk.filters.range')">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in RISK_EVENT_RANGES" :key="option" :value="option">
            {{ t(RISK_EVENT_RANGE_LABEL_KEYS[option]) }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select :key="`status-${locale}`" :model-value="statusFilter" @update:model-value="updateStatus">
        <SelectTrigger size="sm" class="w-auto gap-1.5 text-xs" :aria-label="t('adminRisk.filters.status')">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="RISK_EVENT_FILTER_ALL">{{ t("adminRisk.filters.allStatuses") }}</SelectItem>
          <SelectItem v-for="option in RISK_EVENT_STATUSES" :key="option" :value="option">
            {{ t(`adminRisk.status.${option}`) }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select :key="`severity-${locale}`" :model-value="severityFilter" @update:model-value="updateSeverity">
        <SelectTrigger size="sm" class="w-auto gap-1.5 text-xs" :aria-label="t('adminRisk.filters.severity')">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="RISK_EVENT_FILTER_ALL">{{ t("adminRisk.filters.allSeverities") }}</SelectItem>
          <SelectItem v-for="option in RISK_SEVERITIES" :key="option" :value="option">
            {{ t("adminRisk.filters.severityOption", { severity: t(`adminRisk.severity.${option}`) }) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="@container">
      <div v-if="props.loading" class="flex flex-col divide-y divide-border/60" aria-busy="true">
        <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-2.5">
          <Skeleton class="h-5 w-14 rounded-full" />
          <Skeleton class="h-4 flex-1" />
          <Skeleton class="h-5 w-16 rounded-full" />
        </div>
      </div>
      <LoadErrorState
        v-else-if="props.error"
        :title="t('adminRisk.toast.loadEventsFailedTitle')"
        :description="props.error.message"
        :detail="props.error.detail"
        :retrying="props.loading"
        @retry="emit('retry')"
      />
      <EmptyState
        v-else-if="props.events.length === 0"
        :icon="LucideShieldCheck"
        :title="t('adminRisk.events.empty')"
        :description="t('adminRisk.events.emptyHint', { range: t(RISK_EVENT_RANGE_LABEL_KEYS[range]) })"
      >
        <template #action>
          <Button size="sm" variant="outline" @click="emit('create')">
            <LucidePlus class="size-4" aria-hidden="true" />
            {{ t("adminRisk.events.createButton") }}
          </Button>
        </template>
      </EmptyState>
      <table v-else class="w-full table-fixed border-collapse text-sm">
        <!-- Column widths live here, not on the cells: a hidden column drops out together with its cells. -->
        <colgroup>
          <col class="hidden w-24 @min-[34rem]:table-column">
          <col>
          <col class="hidden w-28 @min-[54rem]:table-column">
          <col class="hidden w-32 @min-[46rem]:table-column">
          <col class="hidden w-24 @min-[34rem]:table-column">
          <col class="hidden w-36 @min-[40rem]:table-column">
          <col class="w-24">
        </colgroup>
        <!-- A phone keeps the action column only: its caption says nothing, so it is for screen readers only. -->
        <thead class="sr-only @min-[34rem]:not-sr-only">
          <tr class="border-b border-border/60">
            <th scope="col" :class="[HEAD, 'hidden pl-4 @min-[34rem]:table-cell']">{{ t("adminRisk.events.table.severity") }}</th>
            <th scope="col" :class="[HEAD, 'pl-4 @min-[34rem]:pl-3']">{{ t("adminRisk.events.table.action") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[54rem]:table-cell']">{{ t("adminRisk.events.fields.source") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[46rem]:table-cell']">{{ t("adminRisk.events.table.user") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[34rem]:table-cell']">{{ t("adminRisk.events.table.status") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[40rem]:table-cell']">{{ t("adminRisk.events.table.time") }}</th>
            <th scope="col" :class="[HEAD, 'pr-3 text-right']">
              <span class="sr-only">{{ t("adminRisk.events.table.actions") }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr
            v-for="eventItem in props.events"
            :key="eventItem.id"
            :data-event-id="eventItem.id"
            class="transition-colors hover:bg-muted/40"
          >
            <td :class="[CELL, 'hidden pl-4 @min-[34rem]:table-cell']">
              <RiskSeverityBadge :severity="eventItem.severity" />
            </td>
            <td :class="[CELL, 'pl-4 @min-[34rem]:pl-3']">
              <div class="flex min-w-0 flex-col gap-0.5">
                <div class="flex min-w-0 flex-wrap items-center gap-1 @min-[34rem]:hidden">
                  <RiskSeverityBadge :severity="eventItem.severity" />
                  <RiskStatusBadge :status="eventItem.status" />
                </div>
                <p class="font-medium [overflow-wrap:anywhere]">{{ eventItem.action || t("adminRisk.common.fallback") }}</p>
                <p
                  v-if="eventItem.reason"
                  class="line-clamp-2 text-xs text-muted-foreground [overflow-wrap:anywhere]"
                  :title="eventItem.reason"
                >
                  {{ eventItem.reason }}
                </p>
                <!-- What the hidden columns would say, while the panel is narrow. -->
                <p class="flex flex-wrap gap-x-2 text-xs tabular-nums text-muted-foreground @min-[54rem]:hidden">
                  <span class="@min-[40rem]:hidden">{{ props.formatDate(eventItem.eventTime) }}</span>
                  <span v-if="eventItem.source" class="[overflow-wrap:anywhere]">{{ eventItem.source }}</span>
                  <span v-if="eventItem.targetUserId" class="font-mono [overflow-wrap:anywhere] @min-[46rem]:hidden">
                    {{ t("adminRisk.events.userShort", { userId: eventItem.targetUserId }) }}
                  </span>
                </p>
              </div>
            </td>
            <td :class="[CELL, 'hidden text-xs text-muted-foreground [overflow-wrap:anywhere] @min-[54rem]:table-cell']">
              <span class="block pt-0.5">{{ eventItem.source || t("adminRisk.common.fallback") }}</span>
            </td>
            <td :class="[CELL, 'hidden @min-[46rem]:table-cell']">
              <RouterLink
                v-if="eventItem.targetUserId"
                :to="{ name: 'admin.userDetail', params: { userId: eventItem.targetUserId } }"
                class="block pt-0.5 font-mono text-xs underline-offset-4 [overflow-wrap:anywhere] hover:underline"
              >
                {{ eventItem.targetUserId }}
              </RouterLink>
              <span v-else class="text-muted-foreground">{{ t("adminRisk.common.fallback") }}</span>
            </td>
            <td :class="[CELL, 'hidden @min-[34rem]:table-cell']">
              <RiskStatusBadge :status="eventItem.status" />
            </td>
            <td :class="[CELL, 'hidden text-xs tabular-nums text-muted-foreground @min-[40rem]:table-cell']">
              <span class="block pt-0.5">{{ props.formatDate(eventItem.eventTime) }}</span>
              <span class="block text-muted-foreground/70">#{{ eventItem.id }}</span>
            </td>
            <td :class="[CELL, 'pr-3']">
              <div class="flex justify-end gap-0.5">
                <Button
                  v-if="eventItem.status === 'open'"
                  variant="ghost"
                  size="icon"
                  :class="ICON_BUTTON"
                  :disabled="props.actionLoading"
                  :title="t('adminRisk.events.resolveAction')"
                  :aria-label="t('adminRisk.events.resolveAction')"
                  @click="emit('resolve', eventItem)"
                >
                  <LucideCheckCircle2 class="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  :class="ICON_BUTTON"
                  :title="t('adminRisk.events.details')"
                  :aria-label="t('adminRisk.events.details')"
                  @click="emit('detail', eventItem)"
                >
                  <LucideInfo class="size-4" aria-hidden="true" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="!props.error" #footer>
      <AdminPagination
        :total="props.totalEvents"
        :page="props.eventPage"
        :page-size="props.eventPageSize"
        :total-pages="props.totalPages"
        :disabled="props.loading"
        :total-label="t('adminRisk.events.total', { total: formatNumberCN(props.totalEvents, '0') })"
        @update:page-size="emit('update:eventPageSize', $event)"
        @prev-page="emit('prevPage')"
        @next-page="emit('nextPage')"
        @go-to-page="emit('goToPage', $event)"
      />
    </template>
  </AdminPanel>
</template>
