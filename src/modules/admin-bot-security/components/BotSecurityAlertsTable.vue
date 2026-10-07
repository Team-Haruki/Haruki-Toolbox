<script setup lang="ts">
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  LucideAlertCircle,
  LucideCheckCircle2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideEyeOff,
  LucideInfo,
  LucideLoader2,
  LucideMoreHorizontal,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideShieldCheck,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumberCN } from "@/lib/number-format"
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
  error: boolean
  alerts: BotSecurityAlert[]
  total: number
  page: number
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
}>()

const { t } = useI18n()

const ACTION_ICONS = {
  resolve: LucideCheckCircle2,
  ignore: LucideEyeOff,
  reopen: LucideRotateCcw,
} as const

// The actions column stays pinned at the right edge, so it remains reachable
// when a narrow content area makes the table scroll sideways.
const STICKY_ACTIONS = "sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]"

function fallback(value: string | null | undefined) {
  return value && value.trim() ? value : t("adminBotSecurity.common.fallback")
}

function hasClientInfo(alert: BotSecurityAlert) {
  return !!alert.clientVersion.trim() || !!alert.buildId.trim()
}
</script>

<template>
  <Card class="gap-0 py-0 overflow-hidden">
    <div class="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
      <CardTitle class="text-base">{{ t("adminBotSecurity.table.title") }}</CardTitle>
      <Button
        variant="outline"
        size="sm"
        :disabled="props.loading"
        :title="t('adminBotSecurity.actions.refresh')"
        :aria-label="t('adminBotSecurity.actions.refresh')"
        @click="emit('refresh')"
      >
        <LucideLoader2 v-if="props.loading" class="w-4 h-4 animate-spin" />
        <LucideRefreshCw v-else class="w-4 h-4" />
        <span class="hidden sm:inline">{{ t("adminBotSecurity.actions.refresh") }}</span>
      </Button>
    </div>
    <CardContent class="p-0">
      <template v-if="props.loading">
        <div class="flex flex-col gap-3 p-6">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <template v-else-if="props.error && props.alerts.length === 0">
        <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <LucideAlertCircle class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminBotSecurity.table.loadError") }}</p>
          <Button variant="outline" size="sm" @click="emit('retry')">
            <LucideRotateCcw class="w-3.5 h-3.5" />
            {{ t("adminBotSecurity.actions.retry") }}
          </Button>
        </div>
      </template>
      <template v-else-if="props.alerts.length === 0">
        <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <LucideShieldCheck class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminBotSecurity.table.empty") }}</p>
        </div>
      </template>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="hidden pl-6 sm:table-cell">{{ t("adminBotSecurity.table.alertTime") }}</TableHead>
              <TableHead class="pl-4 sm:pl-2">{{ t("adminBotSecurity.table.kind") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminBotSecurity.table.bot") }}</TableHead>
              <TableHead class="hidden 2xl:table-cell">{{ t("adminBotSecurity.table.client") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminBotSecurity.table.count") }}</TableHead>
              <TableHead class="hidden sm:table-cell">{{ t("adminBotSecurity.table.status") }}</TableHead>
              <TableHead class="hidden xl:table-cell">{{ t("adminBotSecurity.table.handler") }}</TableHead>
              <TableHead :class="['w-12 pr-4 text-right sm:pr-6', STICKY_ACTIONS]">
                <span class="sr-only">{{ t("adminBotSecurity.table.actions") }}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="alert in props.alerts" :key="alert.id" :data-alert-id="alert.id">
              <TableCell
                class="hidden pl-6 align-top text-sm text-muted-foreground whitespace-nowrap sm:table-cell"
                :title="props.formatTime(alert.alertTime)"
              >
                {{ props.formatShortTime(alert.alertTime) }}
              </TableCell>
              <TableCell class="pl-4 align-top sm:pl-2">
                <div class="flex min-w-0 max-w-[200px] flex-col items-start gap-1">
                  <span class="text-sm font-medium break-words whitespace-normal">{{ props.kindLabel(alert.kind) }}</span>
                  <BotSecurityEnforcementBadge :enforced="alert.enforced" />
                  <!-- Phones hide the time, bot and status columns; keep them here. -->
                  <span class="text-xs text-muted-foreground sm:hidden">{{ props.formatShortTime(alert.alertTime) }}</span>
                  <span v-if="alert.botId" class="font-mono text-xs text-muted-foreground break-all whitespace-normal md:hidden">
                    {{ t("adminBotSecurity.table.botShort", { botId: alert.botId }) }}
                  </span>
                  <BotSecurityStatusBadge class="sm:hidden" :status="alert.status" :label="props.statusLabel(alert.status)" />
                </div>
              </TableCell>
              <TableCell class="hidden align-top md:table-cell">
                <div class="flex min-w-0 max-w-[180px] flex-col whitespace-normal">
                  <span class="font-mono text-sm break-all">{{ fallback(alert.botId) }}</span>
                  <span v-if="alert.botId" class="text-xs text-muted-foreground break-all">
                    {{ t("adminBotSecurity.table.ownerQq", { qq: fallback(alert.ownerQq) }) }}
                  </span>
                  <span v-if="alert.sourceIp" class="font-mono text-xs text-muted-foreground break-all">
                    {{ t("adminBotSecurity.table.sourceIpShort", { ip: alert.sourceIp }) }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="hidden align-top 2xl:table-cell">
                <div v-if="hasClientInfo(alert)" class="flex min-w-0 max-w-[200px] flex-col whitespace-normal">
                  <span class="text-sm break-all line-clamp-2" :title="alert.clientVersion">{{ fallback(alert.clientVersion) }}</span>
                  <span
                    v-if="alert.buildId"
                    class="font-mono text-xs text-muted-foreground break-all line-clamp-2"
                    :title="alert.buildId"
                  >
                    {{ alert.buildId }}
                  </span>
                </div>
                <span v-else class="text-sm text-muted-foreground">{{ t("adminBotSecurity.common.fallback") }}</span>
              </TableCell>
              <TableCell class="hidden align-top lg:table-cell">
                <div class="flex flex-col whitespace-nowrap">
                  <span class="text-sm tabular-nums">{{ formatNumberCN(alert.count, "0") }} / {{ formatNumberCN(alert.threshold, "0") }}</span>
                  <span class="text-xs text-muted-foreground">
                    {{ t("adminBotSecurity.table.within", { window: formatBotSecurityWindow(alert.windowSeconds, t) }) }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="hidden align-top sm:table-cell">
                <div class="flex flex-col items-start gap-1">
                  <BotSecurityStatusBadge :status="alert.status" :label="props.statusLabel(alert.status)" />
                  <!-- Below xl the handler column is hidden. -->
                  <span v-if="alert.handledBy" class="max-w-[140px] truncate text-xs text-muted-foreground xl:hidden">
                    {{ t("adminBotSecurity.table.handledByShort", { name: resolveBotSecurityHandlerLabel(alert.handledBy) }) }}
                  </span>
                </div>
              </TableCell>
              <TableCell class="hidden align-top xl:table-cell">
                <div v-if="alert.handledBy" class="flex min-w-0 max-w-[160px] flex-col whitespace-normal">
                  <RouterLink
                    :to="{ name: 'admin.userDetail', params: { userId: alert.handledBy.userId } }"
                    class="text-sm text-primary hover:underline break-all"
                  >
                    {{ resolveBotSecurityHandlerLabel(alert.handledBy) }}
                  </RouterLink>
                  <span class="text-xs text-muted-foreground whitespace-nowrap">{{ props.formatShortTime(alert.handledAt) }}</span>
                </div>
                <span v-else class="text-sm text-muted-foreground">{{ t("adminBotSecurity.common.fallback") }}</span>
              </TableCell>
              <TableCell :class="['pr-4 align-top text-right sm:pr-6', STICKY_ACTIONS]">
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      class="h-8 w-8 p-0"
                      :title="t('adminBotSecurity.table.openMenu', { id: alert.id })"
                      :aria-label="t('adminBotSecurity.table.openMenu', { id: alert.id })"
                    >
                      <LucideMoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="emit('detail', alert)">
                      <LucideInfo class="w-4 h-4 mr-2" />
                      {{ t("adminBotSecurity.actions.details") }}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      v-for="action in botSecurityActionsFor(alert.status)"
                      :key="action"
                      :disabled="props.actionSaving"
                      @click="emit('action', alert, action)"
                    >
                      <component :is="ACTION_ICONS[action]" class="w-4 h-4 mr-2" />
                      {{ t(`adminBotSecurity.actions.${action}`) }}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
    <div
      v-if="props.total > 0"
      class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 sm:px-6"
    >
      <span class="text-sm text-muted-foreground">
        {{ t("adminBotSecurity.pagination.total", { total: formatNumberCN(props.total, "0") }) }}
      </span>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.loading || props.page <= 1"
          :title="t('adminBotSecurity.pagination.prev')"
          :aria-label="t('adminBotSecurity.pagination.prev')"
          @click="emit('prev-page')"
        >
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ props.page }} / {{ props.totalPages }}</span>
        <Button
          variant="outline"
          size="sm"
          :disabled="props.loading || props.page >= props.totalPages"
          :title="t('adminBotSecurity.pagination.next')"
          :aria-label="t('adminBotSecurity.pagination.next')"
          @click="emit('next-page')"
        >
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
</template>
