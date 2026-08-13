<script setup lang="ts">
import { computed, ref } from "vue"
import { RouterLink } from "vue-router"
import { LucideCheckCircle, LucideChevronLeft, LucideChevronRight, LucideInbox, LucideInfo, LucideXCircle } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { UploadLog } from "@/types/admin"
import { formatNumberCN } from "@/lib/number-format"

interface Props {
  loading: boolean
  logs: UploadLog[]
  total: number
  page: number
  totalPages: number
  methodLabel: (method?: string) => string
  serverLabel: (server?: string) => string
  dataTypeLabel: (type?: string) => string
  formatTime: (iso?: string) => string
  showPagination?: boolean
}

const props = defineProps<Props>()
const { t } = useI18n()
const shouldShowPagination = computed(() => props.showPagination !== false)
const showFailureDialog = ref(false)
const selectedFailureLog = ref<UploadLog | null>(null)
const emit = defineEmits<{
  (event: "prev-page"): void
  (event: "next-page"): void
}>()

function openFailureDialog(log: UploadLog) {
  selectedFailureLog.value = log
  showFailureDialog.value = true
}
</script>

<template>
  <Card class="gap-0 py-0 overflow-hidden">
    <CardContent class="p-0">
      <template v-if="props.loading">
        <div class="p-6 flex flex-col gap-3">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <template v-else-if="props.logs.length === 0">
        <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <LucideInbox class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.empty") }}</p>
        </div>
      </template>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="pl-6">{{ t("adminStatistics.uploadLogs.table.status") }}</TableHead>
              <TableHead>{{ t("adminStatistics.uploadLogs.table.user") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.uploadLogs.table.server") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.uploadLogs.table.method") }}</TableHead>
              <TableHead class="hidden xl:table-cell">{{ t("adminStatistics.uploadLogs.table.dataType") }}</TableHead>
              <TableHead>
                <span class="hidden xl:inline">{{ t("adminStatistics.uploadLogs.table.error") }}</span>
                <span class="sr-only xl:hidden">{{ t("adminStatistics.uploadLogs.table.error") }}</span>
              </TableHead>
              <TableHead class="pr-6">{{ t("adminStatistics.uploadLogs.table.time") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="log in props.logs" :key="log.id">
              <TableCell class="pl-6">
                <span
                  v-if="log.success"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  <LucideCheckCircle class="w-3 h-3" />
                  {{ t("adminStatistics.common.success") }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                >
                  <LucideXCircle class="w-3 h-3" />
                  {{ t("adminStatistics.common.failure") }}
                </span>
              </TableCell>
              <TableCell>
                <RouterLink :to="`/admin/users/${log.userId}`" class="flex flex-col hover:underline text-primary">
                  <span class="font-medium text-sm">{{ log.userName || log.userId }}</span>
                  <span v-if="log.gameUserId" class="text-xs text-muted-foreground/80">
                    UID: {{ log.gameUserId }}
                  </span>
                </RouterLink>
              </TableCell>
              <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                {{ props.serverLabel(log.server) }}
              </TableCell>
              <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                {{ props.methodLabel(log.uploadMethod) }}
              </TableCell>
              <TableCell class="hidden xl:table-cell text-sm text-muted-foreground">
                {{ props.dataTypeLabel(log.dataType) }}
              </TableCell>
              <TableCell>
                <Button
                  v-if="!log.success && log.errorMessage"
                  variant="outline"
                  size="sm"
                  :title="t('adminStatistics.uploadLogs.table.viewError')"
                  :aria-label="t('adminStatistics.uploadLogs.table.viewError')"
                  @click="openFailureDialog(log)"
                >
                  <LucideInfo class="w-4 h-4 xl:mr-1" />
                  <span class="hidden xl:inline">{{ t("adminStatistics.uploadLogs.table.viewError") }}</span>
                </Button>
                <span v-else class="hidden text-sm text-muted-foreground xl:inline">
                  {{ t("adminStatistics.common.fallback") }}
                </span>
              </TableCell>
              <TableCell class="text-sm text-muted-foreground whitespace-nowrap pr-6">
                {{ props.formatTime(log.uploadTime) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
    <div
      v-if="shouldShowPagination"
      class="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6"
    >
      <span class="text-sm text-muted-foreground">
        {{ t("adminStatistics.uploadLogs.pagination.total", { total: formatNumberCN(props.total, '0') }) }}
      </span>
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.page <= 1"
          :title="t('adminStatistics.uploadLogs.pagination.prev')"
          :aria-label="t('adminStatistics.uploadLogs.pagination.prev')"
          @click="emit('prev-page')"
        >
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ props.page }} / {{ props.totalPages }}</span>
        <Button
          variant="outline"
          size="sm"
          :disabled="props.page >= props.totalPages"
          :title="t('adminStatistics.uploadLogs.pagination.next')"
          :aria-label="t('adminStatistics.uploadLogs.pagination.next')"
          @click="emit('next-page')"
        >
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>

  <Dialog :open="showFailureDialog" @update:open="showFailureDialog = $event">
    <DialogScrollContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ t("adminStatistics.uploadLogs.errorDialog.title") }}</DialogTitle>
        <p class="text-sm text-muted-foreground">
          {{ t("adminStatistics.uploadLogs.errorDialog.description") }}
        </p>
      </DialogHeader>

      <div class="space-y-3">
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.user") }}</div>
            <div class="text-sm font-medium break-all">
              {{ selectedFailureLog?.userName || selectedFailureLog?.userId || t("adminStatistics.common.fallback") }}
            </div>
          </div>
          <div class="space-y-1">
            <div class="text-xs text-muted-foreground">{{ t("adminStatistics.uploadLogs.table.time") }}</div>
            <div class="text-sm">
              {{ props.formatTime(selectedFailureLog?.uploadTime) }}
            </div>
          </div>
        </div>

        <div class="rounded-md border bg-muted/20 px-3 py-3 text-sm whitespace-pre-wrap break-words">
          {{ selectedFailureLog?.errorMessage || t("adminStatistics.common.fallback") }}
        </div>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button>{{ t("adminStatistics.uploadLogs.errorDialog.close") }}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
