<script setup lang="ts">
import { RouterLink } from "vue-router"
import { LucideCheckCircle, LucideChevronLeft, LucideChevronRight, LucideXCircle } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "prev-page"): void
  (event: "next-page"): void
}>()
</script>

<template>
  <Card>
    <CardContent class="p-0">
      <template v-if="props.loading">
        <div class="p-6 flex flex-col gap-3">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="pl-6">{{ t("adminStatistics.uploadLogs.table.status") }}</TableHead>
              <TableHead>{{ t("adminStatistics.uploadLogs.table.user") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminStatistics.uploadLogs.table.server") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminStatistics.uploadLogs.table.method") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminStatistics.uploadLogs.table.dataType") }}</TableHead>
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
              <TableCell class="hidden md:table-cell text-sm text-muted-foreground">
                {{ props.serverLabel(log.server) }}
              </TableCell>
              <TableCell class="hidden md:table-cell text-sm text-muted-foreground">
                {{ props.methodLabel(log.uploadMethod) }}
              </TableCell>
              <TableCell class="hidden lg:table-cell text-sm text-muted-foreground">
                {{ props.dataTypeLabel(log.dataType) }}
              </TableCell>
              <TableCell class="text-sm text-muted-foreground whitespace-nowrap pr-6">
                {{ props.formatTime(log.uploadTime) }}
              </TableCell>
            </TableRow>
            <TableRow v-if="props.logs.length === 0">
              <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">
                {{ t("adminStatistics.uploadLogs.table.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
  </Card>

  <div class="flex items-center justify-between px-2">
    <span class="text-sm text-muted-foreground">
      {{ t("adminStatistics.uploadLogs.pagination.total", { total: formatNumberCN(props.total, '0') }) }}
    </span>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" :disabled="props.page <= 1" @click="emit('prev-page')">
        <LucideChevronLeft class="w-4 h-4" />
      </Button>
      <span class="text-sm tabular-nums">{{ props.page }} / {{ props.totalPages }}</span>
      <Button variant="outline" size="sm" :disabled="props.page >= props.totalPages" @click="emit('next-page')">
        <LucideChevronRight class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
