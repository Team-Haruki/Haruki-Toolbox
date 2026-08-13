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
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideDownload,
  LucideInfo,
  LucideCheckCircle,
  LucideXCircle,
  LucideScrollText,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { useSystemLogs } from "@/modules/admin-statistics/composables/useSystemLogs"
import { formatNumberCN } from "@/lib/number-format"

const { t } = useI18n()

const {
  loading,
  logs,
  page,
  total,
  totalPages,
  search,
  summary,
  summaryLoading,
  detailOpen,
  detailLog,
  detailLoading,
  showDetail,
  handleExport,
  prevPage,
  nextPage,
  resultColor,
  formatTime,
} = useSystemLogs()

const summaryCards = computed(() => [
  { key: "total", label: t("adminStatistics.systemLogs.summary.total"), value: summary.value?.total, color: "text-foreground" },
  { key: "success", label: t("adminStatistics.common.success"), value: summary.value?.success, color: "text-green-500" },
  { key: "failure", label: t("adminStatistics.common.failure"), value: summary.value?.failure, color: "text-red-500" },
])
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <Input v-model="search" :placeholder="t('adminStatistics.systemLogs.searchPlaceholder')" class="pl-9" />
          </div>
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
                <TableHead class="w-24">{{ t("adminStatistics.systemLogs.table.result") }}</TableHead>
                <TableHead>{{ t("adminStatistics.systemLogs.table.action") }}</TableHead>
                <TableHead class="hidden md:table-cell">{{ t("adminStatistics.systemLogs.table.request") }}</TableHead>
                <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.systemLogs.table.user") }}</TableHead>
                <TableHead>{{ t("adminStatistics.systemLogs.table.time") }}</TableHead>
                <TableHead class="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="log in logs" :key="log.id">
                <TableCell>
                  <span :class="['inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium', resultColor(log.result)]">
                    <LucideCheckCircle v-if="log.result === 'success'" class="w-3 h-3 shrink-0" />
                    <LucideXCircle v-else class="w-3 h-3 shrink-0" />
                    {{ log.result === 'success' ? t('adminStatistics.common.success') : t('adminStatistics.common.failure') }}
                  </span>
                </TableCell>
                <TableCell class="max-w-[200px] truncate font-mono text-sm">{{ log.action }}</TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground text-sm font-mono">
                  {{ log.method || t("adminStatistics.common.fallback") }} {{ log.path || "" }}
                </TableCell>
                <TableCell class="hidden lg:table-cell text-muted-foreground text-sm">
                  {{ log.actorUserId || t("adminStatistics.common.fallback") }}
                  <span v-if="log.actorRole" class="text-xs opacity-60">({{ log.actorRole }})</span>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm whitespace-nowrap">
                  {{ formatTime(log.eventTime) }}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8"
                    :title="t('adminStatistics.systemLogs.detail.title')"
                    :aria-label="t('adminStatistics.systemLogs.detail.title')"
                    @click="showDetail(log.id)"
                  >
                    <LucideInfo class="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
          <span class="text-sm text-muted-foreground">
            {{ t("adminStatistics.systemLogs.pagination.total", { total }) }}
          </span>
          <div class="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :disabled="page <= 1"
              :title="t('adminStatistics.systemLogs.pagination.prev')"
              :aria-label="t('adminStatistics.systemLogs.pagination.prev')"
              @click="prevPage"
            >
              <LucideChevronLeft class="w-4 h-4" />
            </Button>
            <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
            <Button
              variant="outline"
              size="icon"
              class="h-8 w-8"
              :disabled="page >= totalPages"
              :title="t('adminStatistics.systemLogs.pagination.next')"
              :aria-label="t('adminStatistics.systemLogs.pagination.next')"
              @click="nextPage"
            >
              <LucideChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="detailOpen">
      <DialogContent class="max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ t("adminStatistics.systemLogs.detail.title") }}</DialogTitle>
        </DialogHeader>
        <template v-if="detailLoading">
          <Skeleton class="h-32 w-full" />
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
            <div v-if="detailLog.detail" class="flex flex-col gap-1">
              <span class="text-muted-foreground">{{ t("adminStatistics.systemLogs.detail.detail") }}</span>
              <pre class="bg-muted p-3 rounded-md text-xs overflow-x-auto whitespace-pre-wrap break-words">{{ detailLog.detail }}</pre>
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>
  </div>
</template>
