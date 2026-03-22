<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { UploadLogsTable } from "@/modules/admin-statistics/components"
import {
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "@/modules/admin-statistics/lib/upload-log-meta"
import {
  Table,
  TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
  LucideCheckCircle2,
  LucideXCircle,
} from "lucide-vue-next"
import type { UploadLog, UserActivity } from "@/types/admin"
import { formatDateTime } from "@/modules/admin-users/constants"

defineProps<{
    loading: boolean
    activities: UserActivity[]
    uploadLogs: UploadLog[]
}>()

const { t } = useI18n()

function formatActivityTime(value: string) {
  return formatDateTime(value)
}

function formatUploadTime(value?: string) {
  return formatDateTime(value ?? "")
}

function methodLabel(value?: string) {
  return resolveUploadMethodLabel(value, t)
}

function serverLabel(value?: string) {
  return resolveUploadServerLabel(value, t)
}

function dataTypeLabel(value?: string) {
  return resolveUploadDataTypeLabel(value, t)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("adminUsers.detail.activity.title") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <template v-if="loading">
          <Skeleton v-for="i in 3" :key="i" class="h-10 w-full mb-2" />
        </template>
        <template v-else-if="activities.length > 0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("adminUsers.detail.activity.columns.action") }}</TableHead>
                <TableHead>{{ t("adminUsers.detail.activity.columns.result") }}</TableHead>
                <TableHead class="hidden sm:table-cell">{{ t("adminUsers.detail.activity.columns.path") }}</TableHead>
                <TableHead>{{ t("adminUsers.detail.activity.columns.time") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="activity in activities" :key="activity.id">
                <TableCell class="font-medium text-sm">{{ activity.action }}</TableCell>
                <TableCell>
                  <span :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                    activity.result === 'success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  ]">
                    <LucideCheckCircle2 v-if="activity.result === 'success'" class="w-3.5 h-3.5" />
                    <LucideXCircle v-else class="w-3.5 h-3.5" />
                    {{ activity.result === 'success' ? t("adminUsers.common.success") : t("adminUsers.common.failed") }}
                  </span>
                </TableCell>
                <TableCell class="hidden sm:table-cell text-muted-foreground text-sm">{{ activity.path || "—" }}</TableCell>
                <TableCell class="text-sm text-muted-foreground whitespace-nowrap">
                  {{ formatActivityTime(activity.eventTime) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
        <template v-else>
          <p class="text-center text-muted-foreground py-8">{{ t("adminUsers.detail.activity.empty") }}</p>
        </template>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("adminUsers.detail.activity.uploadLogsTitle") }}</CardTitle>
        <CardDescription>{{ t("adminUsers.detail.activity.uploadLogsDescription") }}</CardDescription>
      </CardHeader>
      <CardContent class="p-0">
        <UploadLogsTable
          :loading="loading"
          :logs="uploadLogs"
          :total="uploadLogs.length"
          :page="1"
          :total-pages="1"
          :method-label="methodLabel"
          :server-label="serverLabel"
          :data-type-label="dataTypeLabel"
          :format-time="formatUploadTime"
          :show-pagination="false"
        />
      </CardContent>
    </Card>
  </div>
</template>
