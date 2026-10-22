<script setup lang="ts">
import { computed } from "vue"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideSearch,
  LucideCopy,
  LucideDownload,
  LucideInfo,
  LucideCheckCircle,
  LucideX,
  LucideXCircle,
  LucideScrollText,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import { useSystemLogs } from "@/modules/admin-statistics/composables/useSystemLogs"
import { formatNumberCN } from "@/lib/number-format"
import type { SystemLog } from "@/types/admin"

const { t } = useI18n()

const {
  loading,
  loadError,
  logs,
  page,
  pageSize,
  total,
  totalPages,
  search,
  summary,
  summaryLoading,
  summaryError,
  detailOpen,
  detailLog,
  detailLoading,
  detailError,
  detailText,
  showDetail,
  retryDetail,
  copyDetail,
  handleExport,
  applySearch,
  resetSearch,
  reload,
  loadSummary,
  prevPage,
  nextPage,
  goToPage,
  resultColor,
  formatTime,
} = useSystemLogs()

const summaryCards = computed(() => [
  { key: "total", label: t("adminStatistics.systemLogs.summary.total"), value: summary.value?.total, color: "text-foreground" },
  { key: "success", label: t("adminStatistics.common.success"), value: summary.value?.success, color: "text-green-500" },
  { key: "failure", label: t("adminStatistics.common.failure"), value: summary.value?.failure, color: "text-red-500" },
])

// The actions column stays pinned at the right edge, so the detail button is
// reachable when a narrow content area makes the table scroll sideways.
const STICKY_ACTIONS = "sticky right-0 bg-card shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.12)]"

function handleRowKeydown(event: KeyboardEvent, log: SystemLog) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    void showDetail(log.id)
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card v-if="summaryError">
      <CardContent class="py-2">
        <LoadErrorState
          :title="t('adminStatistics.systemLogs.toast.loadSummaryFailedTitle')"
          :description="summaryError.message"
          :detail="summaryError.detail"
          :retrying="summaryLoading"
          @retry="loadSummary"
        />
      </CardContent>
    </Card>
    <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <Card v-for="item in summaryCards" :key="item.key">
        <CardContent class="p-4">
          <div class="text-sm text-muted-foreground">{{ item.label }}</div>
          <template v-if="summaryLoading">
            <Skeleton class="h-8 w-16 mt-1" />
          </template>
          <template v-else>
            <div :class="['text-2xl font-bold tabular-nums mt-1', item.color]">
              {{ formatNumberCN(item.value) }}
            </div>
          </template>
        </CardContent>
      </Card>
    </div>

    <Card class="gap-0 overflow-hidden py-0">
      <CardContent class="p-0">
        <div class="flex flex-wrap items-center gap-3 border-b p-4">
          <div class="relative min-w-[200px] flex-1">
            <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              v-model="search"
              :aria-label="t('adminStatistics.systemLogs.searchPlaceholder')"
              :placeholder="t('adminStatistics.systemLogs.searchPlaceholder')"
              class="pl-9 pr-9"
              @keydown.enter.prevent="applySearch"
            />
            <button
              v-if="search"
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:text-foreground"
              :title="t('adminStatistics.systemLogs.resetSearch')"
              :aria-label="t('adminStatistics.systemLogs.resetSearch')"
              @click="resetSearch"
            >
              <LucideX class="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" :disabled="loading" @click="applySearch">
            <LucideSearch class="w-4 h-4 mr-1" />
            {{ t("admin.filters.search") }}
          </Button>
          <Button variant="outline" size="sm" @click="handleExport">
            <LucideDownload class="w-4 h-4 mr-1" />
            {{ t("adminStatistics.systemLogs.exportButton") }}
          </Button>
        </div>

        <template v-if="loading">
          <div class="flex flex-col gap-3 p-6">
            <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
          </div>
        </template>
        <template v-else-if="loadError">
          <LoadErrorState
            :title="t('adminStatistics.systemLogs.toast.loadFailedTitle')"
            :description="loadError.message"
            :detail="loadError.detail"
            :retrying="loading"
            @retry="reload"
          />
        </template>
        <template v-else-if="logs.length === 0">
          <div class="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
            <LucideScrollText class="h-8 w-8 text-muted-foreground/60" />
            <p class="text-sm text-muted-foreground">{{ t("adminStatistics.systemLogs.table.empty") }}</p>
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-24 pl-4">{{ t("adminStatistics.systemLogs.table.result") }}</TableHead>
                <TableHead>{{ t("adminStatistics.systemLogs.table.time") }}</TableHead>
                <TableHead>{{ t("adminStatistics.systemLogs.table.action") }}</TableHead>
                <TableHead class="hidden md:table-cell">{{ t("adminStatistics.systemLogs.table.request") }}</TableHead>
                <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.systemLogs.table.user") }}</TableHead>
                <TableHead :class="['w-12 pr-4', STICKY_ACTIONS]">
                  <span class="sr-only">{{ t("adminStatistics.systemLogs.detail.title") }}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="log in logs"
                :key="log.id"
                class="cursor-pointer"
                role="button"
                tabindex="0"
                :title="t('adminStatistics.systemLogs.table.openDetail')"
                @click="showDetail(log.id)"
                @keydown="handleRowKeydown($event, log)"
              >
                <TableCell class="pl-4">
                  <span :class="['inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium', resultColor(log.result)]">
                    <LucideCheckCircle v-if="log.result === 'success'" class="w-3 h-3 shrink-0" />
                    <LucideXCircle v-else class="w-3 h-3 shrink-0" />
                    {{ log.result === 'success' ? t('adminStatistics.common.success') : t('adminStatistics.common.failure') }}
                  </span>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm whitespace-nowrap">
                  {{ formatTime(log.eventTime) }}
                </TableCell>
                <TableCell class="max-w-[220px] truncate font-mono text-sm" :title="log.action">{{ log.action }}</TableCell>
                <TableCell class="hidden md:table-cell max-w-[260px] truncate text-muted-foreground text-sm font-mono" :title="`${log.method || ''} ${log.path || ''}`.trim()">
                  {{ log.method || t("adminStatistics.common.fallback") }} {{ log.path || "" }}
                </TableCell>
                <TableCell class="hidden lg:table-cell text-muted-foreground text-sm">
                  {{ log.actorUserId || t("adminStatistics.common.fallback") }}
                  <span v-if="log.actorRole" class="text-xs opacity-60">({{ log.actorRole }})</span>
                </TableCell>
                <TableCell :class="['pr-4', STICKY_ACTIONS]">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    :title="t('adminStatistics.systemLogs.detail.title')"
                    :aria-label="t('adminStatistics.systemLogs.detail.title')"
                    @click.stop="showDetail(log.id)"
                  >
                    <LucideInfo class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>

        <div v-if="!loadError" class="border-t px-4 py-3">
          <AdminPagination
            :total="total"
            :page="page"
            :page-size="pageSize"
            :total-pages="totalPages"
            :disabled="loading"
            :total-label="t('adminStatistics.systemLogs.pagination.total', { total: formatNumberCN(total, '0') })"
            @update:page-size="pageSize = $event"
            @prev-page="prevPage"
            @next-page="nextPage"
            @go-to-page="goToPage"
          />
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="detailOpen">
      <DialogScrollContent class="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ t("adminStatistics.systemLogs.detail.title") }}</DialogTitle>
        </DialogHeader>
        <template v-if="detailLoading">
          <Skeleton class="h-32 w-full" />
        </template>
        <template v-else-if="detailError">
          <LoadErrorState
            :title="t('adminStatistics.systemLogs.toast.loadDetailFailedTitle')"
            :description="detailError.message"
            :detail="detailError.detail"
            :retrying="detailLoading"
            @retry="retryDetail"
          />
        </template>
        <template v-else-if="detailLog">
          <div class="flex flex-col gap-3 text-sm">
            <div class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">{{ t("adminStatistics.systemLogs.detail.result") }}</span>
              <span :class="['inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium', resultColor(detailLog.result)]">
                {{ detailLog.result === 'success' ? t('adminStatistics.common.success') : t('adminStatistics.common.failure') }}
              </span>
            </div>
            <div class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">{{ t("adminStatistics.systemLogs.detail.time") }}</span>
              <span>{{ formatTime(detailLog.eventTime) }}</span>
            </div>
            <div class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">{{ t("adminStatistics.systemLogs.detail.action") }}</span>
              <span class="font-mono break-all">{{ detailLog.action }}</span>
            </div>
            <div v-if="detailLog.method" class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">{{ t("adminStatistics.systemLogs.detail.request") }}</span>
              <span class="font-mono break-all">{{ detailLog.method }} {{ detailLog.path }}</span>
            </div>
            <div v-if="detailLog.actorUserId" class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">{{ t("adminStatistics.systemLogs.detail.user") }}</span>
              <span>{{ detailLog.actorUserId }}
                <span v-if="detailLog.actorRole" class="text-xs text-muted-foreground">({{ detailLog.actorRole }})</span>
              </span>
            </div>
            <div v-if="detailLog.ip" class="flex gap-2">
              <span class="text-muted-foreground w-16 flex-shrink-0">IP</span>
              <span class="font-mono">{{ detailLog.ip }}</span>
            </div>
            <div v-if="detailLog.userAgent" class="flex flex-col gap-1">
              <span class="text-muted-foreground">User Agent</span>
              <p class="bg-muted p-3 rounded-md text-xs break-words">{{ detailLog.userAgent }}</p>
            </div>
            <div v-if="detailText" class="flex flex-col gap-1">
              <div class="flex items-center justify-between gap-2">
                <span class="text-muted-foreground">{{ t("adminStatistics.systemLogs.detail.detail") }}</span>
                <Button variant="ghost" size="sm" class="h-7" @click="copyDetail">
                  <LucideCopy class="w-3.5 h-3.5 mr-1" />
                  {{ t("adminStatistics.systemLogs.detail.copy") }}
                </Button>
              </div>
              <pre class="max-h-[50vh] overflow-auto bg-muted p-3 rounded-md text-xs whitespace-pre-wrap break-words">{{ detailText }}</pre>
            </div>
          </div>
        </template>
        <DialogFooter v-if="!detailLoading && !detailError">
          <Button variant="outline" @click="detailOpen = false">{{ t("common.close") }}</Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>
  </div>
</template>
