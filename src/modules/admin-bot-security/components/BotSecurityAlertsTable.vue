<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  LucideCheckCircle2,
  LucideEyeOff,
  LucideInfo,
  LucideLoader2,
  LucideMoreHorizontal,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideShieldCheck,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN } from "@/lib/number-format"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import BotSecurityKindChip from "@/modules/admin-bot-security/components/BotSecurityKindChip.vue"
import BotSecurityEnforcementBadge from "@/modules/admin-bot-security/components/BotSecurityEnforcementBadge.vue"
import BotSecurityStatusBadge from "@/modules/admin-bot-security/components/BotSecurityStatusBadge.vue"
import {
  type BotSecurityAlertAction,
  botSecurityActionsFor,
  formatBotSecurityWindow,
  resolveBotSecurityHandlerLabel,
} from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert } from "@/types/admin"

const props = defineProps<{
  loading: boolean
  /** A failed load; shown in place of the (empty) table with a retry. */
  error: ErrorDescription | null
  alerts: BotSecurityAlert[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  actionSaving: boolean
  kindLabel: (kind: string) => string
  statusLabel: (status: string) => string
  formatTime: (value?: string | null) => string
  formatShortTime: (value?: string | null) => string
}>()

const emit = defineEmits<{
  (event: "detail", alert: BotSecurityAlert): void
  (event: "action", alert: BotSecurityAlert, action: BotSecurityAlertAction): void
  (event: "refresh"): void
  (event: "retry"): void
  (event: "prev-page"): void
  (event: "next-page"): void
  (event: "go-to-page", page: number): void
  (event: "update:pageSize", pageSize: number): void
}>()

const { t } = useI18n()

const ACTION_ICONS = {
  resolve: LucideCheckCircle2,
  ignore: LucideEyeOff,
  reopen: LucideRotateCcw,
} as const

// The columns follow the panel's own width (it sits beside the admin nav):
// below 36rem only the kind and the menu remain, and the kind cell carries
// the time, the bot and the status; wider panels move them into columns.
// The table is fixed-layout and its text wraps, so it never scrolls sideways.
const HEAD = "px-3 py-2 text-left text-xs font-medium text-muted-foreground"
const CELL = "px-3 py-2 align-top"

function fallback(value: string | null | undefined) {
  return value && value.trim() ? value : t("adminBotSecurity.common.fallback")
}

function hasClientInfo(alert: BotSecurityAlert) {
  return !!alert.clientVersion.trim() || !!alert.buildId.trim()
}
</script>

<template>
  <AdminPanel :title="t('adminBotSecurity.table.title')" flush>
    <template #actions>
      <Button
        variant="outline"
        size="sm"
        class="h-8"
        :disabled="props.loading"
        :title="t('adminBotSecurity.actions.refresh')"
        :aria-label="t('adminBotSecurity.actions.refresh')"
        @click="emit('refresh')"
      >
        <LucideLoader2 v-if="props.loading" class="size-4 animate-spin" aria-hidden="true" />
        <LucideRefreshCw v-else class="size-4" aria-hidden="true" />
        <span class="hidden sm:inline">{{ t("adminBotSecurity.actions.refresh") }}</span>
      </Button>
    </template>

    <div class="@container">
      <div v-if="props.loading" class="flex flex-col divide-y divide-border/60" aria-busy="true">
        <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-2.5">
          <Skeleton class="h-5 w-24 rounded-full" />
          <Skeleton class="h-4 flex-1" />
          <Skeleton class="h-5 w-16 rounded-full" />
        </div>
      </div>
      <LoadErrorState
        v-else-if="props.error"
        :title="t('adminBotSecurity.table.loadError')"
        :description="props.error.message"
        :detail="props.error.detail"
        :retry-label="t('adminBotSecurity.actions.retry')"
        :retrying="props.loading"
        @retry="emit('retry')"
      />
      <EmptyState v-else-if="props.alerts.length === 0" :icon="LucideShieldCheck" :title="t('adminBotSecurity.table.empty')" />
      <table v-else class="w-full table-fixed border-collapse text-sm">
        <!-- Column widths live here, not on the cells: a hidden column drops out together with its cells. -->
        <colgroup>
          <col class="hidden w-36 @min-[36rem]:table-column">
          <col>
          <col class="hidden w-44 @min-[46rem]:table-column">
          <col class="hidden w-40 @min-[62rem]:table-column">
          <col class="hidden w-28 @min-[54rem]:table-column">
          <col class="hidden w-36 @min-[36rem]:table-column">
          <col class="w-12">
        </colgroup>
        <!-- One column is left on a phone: its caption says nothing, so it is for screen readers only. -->
        <thead class="sr-only @min-[36rem]:not-sr-only">
          <tr class="border-b border-border/60">
            <th scope="col" :class="[HEAD, 'hidden pl-4 @min-[36rem]:table-cell']">{{ t("adminBotSecurity.table.alertTime") }}</th>
            <th scope="col" :class="[HEAD, 'pl-4 @min-[36rem]:pl-3']">{{ t("adminBotSecurity.table.kind") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[46rem]:table-cell']">{{ t("adminBotSecurity.table.bot") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[62rem]:table-cell']">{{ t("adminBotSecurity.table.client") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[54rem]:table-cell']">{{ t("adminBotSecurity.table.count") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[36rem]:table-cell']">{{ t("adminBotSecurity.table.status") }}</th>
            <th scope="col" :class="[HEAD, 'pr-3']">
              <span class="sr-only">{{ t("adminBotSecurity.table.actions") }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr
            v-for="alert in props.alerts"
            :key="alert.id"
            :data-alert-id="alert.id"
            class="transition-colors hover:bg-muted/40"
          >
            <td
              :class="[CELL, 'hidden pl-4 text-xs tabular-nums text-muted-foreground @min-[36rem]:table-cell']"
              :title="props.formatTime(alert.alertTime)"
            >
              <span class="block pt-0.5">{{ props.formatShortTime(alert.alertTime) }}</span>
              <span class="block text-muted-foreground/70">#{{ alert.id }}</span>
            </td>
            <td :class="[CELL, 'pl-4 @min-[36rem]:pl-3']">
              <div class="flex min-w-0 flex-col items-start gap-1">
                <div class="flex min-w-0 max-w-full flex-wrap items-center gap-1">
                  <BotSecurityKindChip :kind="alert.kind" :label="props.kindLabel(alert.kind)" />
                  <BotSecurityEnforcementBadge :enforced="alert.enforced" />
                  <BotSecurityStatusBadge class="@min-[36rem]:hidden" :status="alert.status" :label="props.statusLabel(alert.status)" />
                </div>
                <p
                  v-if="alert.reason.trim()"
                  class="line-clamp-1 max-w-full text-xs text-muted-foreground [overflow-wrap:anywhere]"
                  :title="alert.reason"
                >
                  {{ alert.reason }}
                </p>
                <!-- What the hidden columns would say, while the panel is narrow. -->
                <p class="flex max-w-full flex-wrap gap-x-2 text-xs tabular-nums text-muted-foreground @min-[46rem]:hidden">
                  <span class="@min-[36rem]:hidden">#{{ alert.id }} · {{ props.formatShortTime(alert.alertTime) }}</span>
                  <span v-if="alert.botId" class="font-mono [overflow-wrap:anywhere]">
                    {{ t("adminBotSecurity.table.botShort", { botId: alert.botId }) }}
                  </span>
                  <span v-else-if="alert.sourceIp" class="font-mono [overflow-wrap:anywhere]">
                    {{ t("adminBotSecurity.table.sourceIpShort", { ip: alert.sourceIp }) }}
                  </span>
                </p>
              </div>
            </td>
            <td :class="[CELL, 'hidden @min-[46rem]:table-cell']">
              <div class="flex min-w-0 flex-col text-xs text-muted-foreground [overflow-wrap:anywhere]">
                <span class="font-mono text-sm text-foreground">{{ fallback(alert.botId) }}</span>
                <span v-if="alert.botId">
                  {{ t("adminBotSecurity.table.ownerQq", { qq: fallback(alert.ownerQq) }) }}
                </span>
                <span v-if="alert.sourceIp" class="font-mono">
                  {{ t("adminBotSecurity.table.sourceIpShort", { ip: alert.sourceIp }) }}
                </span>
              </div>
            </td>
            <td :class="[CELL, 'hidden @min-[62rem]:table-cell']">
              <div v-if="hasClientInfo(alert)" class="flex min-w-0 flex-col [overflow-wrap:anywhere]">
                <span class="line-clamp-1 text-sm" :title="alert.clientVersion">{{ fallback(alert.clientVersion) }}</span>
                <span
                  v-if="alert.buildId"
                  class="line-clamp-1 font-mono text-xs text-muted-foreground"
                  :title="alert.buildId"
                >
                  {{ alert.buildId }}
                </span>
              </div>
              <span v-else class="text-sm text-muted-foreground">{{ t("adminBotSecurity.common.fallback") }}</span>
            </td>
            <td :class="[CELL, 'hidden @min-[54rem]:table-cell']">
              <div class="flex flex-col whitespace-nowrap">
                <span class="text-sm tabular-nums">
                  <span class="font-medium">{{ formatNumberCN(alert.count, "0") }}</span>
                  <span class="text-muted-foreground"> / {{ formatNumberCN(alert.threshold, "0") }}</span>
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ t("adminBotSecurity.table.within", { window: formatBotSecurityWindow(alert.windowSeconds, t) }) }}
                </span>
              </div>
            </td>
            <td :class="[CELL, 'hidden @min-[36rem]:table-cell']">
              <div class="flex min-w-0 flex-col items-start gap-1">
                <BotSecurityStatusBadge :status="alert.status" :label="props.statusLabel(alert.status)" />
                <p v-if="alert.handledBy" class="max-w-full text-xs text-muted-foreground [overflow-wrap:anywhere]">
                  <RouterLink
                    :to="{ name: 'admin.userDetail', params: { userId: alert.handledBy.userId } }"
                    class="text-foreground underline-offset-4 hover:underline"
                    :title="t('adminBotSecurity.table.handledByShort', { name: resolveBotSecurityHandlerLabel(alert.handledBy) })"
                  >
                    {{ resolveBotSecurityHandlerLabel(alert.handledBy) }}
                  </RouterLink>
                  <span class="block tabular-nums">{{ props.formatShortTime(alert.handledAt) }}</span>
                </p>
              </div>
            </td>
            <td :class="[CELL, 'pr-3 text-right']">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-muted-foreground pointer-coarse:size-10"
                    :title="t('adminBotSecurity.table.openMenu', { id: alert.id })"
                    :aria-label="t('adminBotSecurity.table.openMenu', { id: alert.id })"
                  >
                    <LucideMoreHorizontal class="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="emit('detail', alert)">
                    <LucideInfo class="mr-2 size-4" aria-hidden="true" />
                    {{ t("adminBotSecurity.actions.details") }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    v-for="action in botSecurityActionsFor(alert.status)"
                    :key="action"
                    :disabled="props.actionSaving"
                    @click="emit('action', alert, action)"
                  >
                    <component :is="ACTION_ICONS[action]" class="mr-2 size-4" aria-hidden="true" />
                    {{ t(`adminBotSecurity.actions.${action}`) }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="!props.error" #footer>
      <AdminPagination
        :total="props.total"
        :page="props.page"
        :page-size="props.pageSize"
        :total-pages="props.totalPages"
        :disabled="props.loading"
        :total-label="t('adminBotSecurity.pagination.total', { total: formatNumberCN(props.total, '0') })"
        @update:page-size="emit('update:pageSize', $event)"
        @prev-page="emit('prev-page')"
        @next-page="emit('next-page')"
        @go-to-page="emit('go-to-page', $event)"
      />
    </template>
  </AdminPanel>
</template>
