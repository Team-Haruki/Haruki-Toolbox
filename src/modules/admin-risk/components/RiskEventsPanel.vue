<script setup lang="ts">
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideLoader2,
  LucidePlus,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { RiskEvent } from "@/types/admin"

interface Props {
  loading: boolean
  events: RiskEvent[]
  totalEvents: number
  eventPage: number
  eventPageSize: number
  actionLoading: boolean
  createOpen: boolean
  newSeverity: string
  newSource: string
  newAction: string
  newReason: string
  newTargetUserId: string
  creating: boolean
  eventTotalPages: () => number
  formatDate: (value: string) => string
}

const props = defineProps<Props>()
const { t } = useI18n()

const emit = defineEmits<{
  (event: "update:createOpen", value: boolean): void
  (event: "update:newSeverity", value: string): void
  (event: "update:newSource", value: string): void
  (event: "update:newAction", value: string): void
  (event: "update:newReason", value: string): void
  (event: "update:newTargetUserId", value: string): void
  (event: "create"): void
  (event: "resolve", eventId: string): void
  (event: "prevPage"): void
  (event: "nextPage"): void
}>()

function updateCreateOpen(value: boolean) {
  emit("update:createOpen", value)
}

function updateSource(value: string | number) {
  emit("update:newSource", String(value))
}

function updateAction(value: string | number) {
  emit("update:newAction", String(value))
}

function updateTargetUserId(value: string | number) {
  emit("update:newTargetUserId", String(value))
}

function severityLabel(severity: string) {
  const key = `adminRisk.severity.${severity}`
  const translated = t(key)
  return translated === key ? severity : translated
}

function statusLabel(status: string) {
  const key = `adminRisk.status.${status}`
  const translated = t(key)
  return translated === key ? status : translated
}
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="text-lg">{{ t("adminRisk.events.title") }}</CardTitle>
      <Dialog :open="props.createOpen" @update:open="updateCreateOpen">
        <DialogTrigger as-child>
          <Button size="sm">
            <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminRisk.events.createButton") }}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t("adminRisk.events.createDialogTitle") }}</DialogTitle>
          </DialogHeader>
          <div class="flex flex-col gap-3 py-4">
            <div class="flex flex-col gap-1.5">
              <Label>{{ t("adminRisk.events.fields.severity") }}</Label>
              <select
                :value="props.newSeverity"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                @change="emit('update:newSeverity', String(($event.target as HTMLSelectElement).value))"
              >
                <option value="low">{{ t("adminRisk.severity.low") }}</option>
                <option value="medium">{{ t("adminRisk.severity.medium") }}</option>
                <option value="high">{{ t("adminRisk.severity.high") }}</option>
                <option value="critical">{{ t("adminRisk.severity.critical") }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{{ t("adminRisk.events.fields.source") }}</Label>
              <Input
                :model-value="props.newSource"
                :placeholder="t('adminRisk.events.placeholders.source')"
                @update:model-value="updateSource"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{{ t("adminRisk.events.fields.action") }}</Label>
              <Input
                :model-value="props.newAction"
                :placeholder="t('adminRisk.events.placeholders.action')"
                @update:model-value="updateAction"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{{ t("adminRisk.events.fields.reason") }}</Label>
              <textarea
                :value="props.newReason"
                :placeholder="t('adminRisk.events.placeholders.reason')"
                rows="3"
                class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                @input="emit('update:newReason', String(($event.target as HTMLTextAreaElement).value))"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label>{{ t("adminRisk.events.fields.targetUserIdOptional") }}</Label>
              <Input
                :model-value="props.newTargetUserId"
                :placeholder="t('adminRisk.events.placeholders.targetUserId')"
                @update:model-value="updateTargetUserId"
              />
            </div>
          </div>
          <DialogFooter>
            <Button :disabled="props.creating" @click="emit('create')">
              <LucideLoader2 v-if="props.creating" class="w-4 h-4 mr-1 animate-spin" />
              {{ t("adminRisk.events.create") }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardHeader>
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
              <TableHead>{{ t("adminRisk.events.table.severity") }}</TableHead>
              <TableHead>{{ t("adminRisk.events.table.action") }}</TableHead>
              <TableHead>{{ t("adminRisk.events.table.reason") }}</TableHead>
              <TableHead class="hidden sm:table-cell">{{ t("adminRisk.events.table.user") }}</TableHead>
              <TableHead>{{ t("adminRisk.events.table.status") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminRisk.events.table.time") }}</TableHead>
              <TableHead class="w-16">{{ t("adminRisk.events.table.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="eventItem in props.events" :key="eventItem.id">
              <TableCell>
                <span
                  :class="[
                    'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                    eventItem.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    eventItem.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    eventItem.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                  ]"
                >
                  {{ severityLabel(eventItem.severity) }}
                </span>
              </TableCell>
              <TableCell class="font-medium">{{ eventItem.action }}</TableCell>
              <TableCell class="max-w-[200px] truncate text-muted-foreground">{{ eventItem.reason }}</TableCell>
              <TableCell class="hidden sm:table-cell text-muted-foreground text-sm">
                {{ eventItem.userName || eventItem.targetUserId || t("adminRisk.common.fallback") }}
              </TableCell>
              <TableCell>
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                    eventItem.status === 'open'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  ]"
                >
                  <LucideAlertTriangle v-if="eventItem.status === 'open'" class="w-3 h-3" />
                  <LucideCheckCircle2 v-else class="w-3 h-3" />
                  {{ statusLabel(eventItem.status) }}
                </span>
              </TableCell>
              <TableCell class="hidden md:table-cell text-muted-foreground text-sm">{{ props.formatDate(eventItem.createdAt) }}</TableCell>
              <TableCell>
                <Button
                  v-if="eventItem.status === 'open'"
                  variant="outline"
                  size="sm"
                  :disabled="props.actionLoading"
                  @click="emit('resolve', eventItem.id)"
                >
                  <LucideCheckCircle2 class="w-3.5 h-3.5" />
                  <span class="sr-only">{{ t("adminRisk.events.resolveAction") }}</span>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="props.events.length === 0">
              <TableCell :colspan="7" class="text-center py-8 text-muted-foreground">
                {{ t("adminRisk.events.empty") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
  </Card>

  <div v-if="props.totalEvents > props.eventPageSize" class="flex items-center justify-between px-2 mt-4">
    <span class="text-sm text-muted-foreground">
      {{ t("adminRisk.events.total", { total: props.totalEvents }) }}
    </span>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" :disabled="props.loading || props.eventPage <= 1" @click="emit('prevPage')">
        <LucideChevronLeft class="w-4 h-4" />
      </Button>
      <span class="text-sm tabular-nums">{{ props.eventPage }} / {{ props.eventTotalPages() }}</span>
      <Button
        variant="outline"
        size="sm"
        :disabled="props.loading || props.eventPage >= props.eventTotalPages()"
        @click="emit('nextPage')"
      >
        <LucideChevronRight class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
