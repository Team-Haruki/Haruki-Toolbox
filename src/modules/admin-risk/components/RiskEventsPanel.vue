<script setup lang="ts">
import { Card, CardContent, CardTitle } from "@/components/ui/card"
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
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideChevronLeft,
  LucideChevronRight,
  LucideLoader2,
  LucidePlus,
  LucideShieldCheck,
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

const severityOptions = ["low", "medium", "high", "critical"] as const

function updateCreateOpen(value: boolean) {
  emit("update:createOpen", value)
}

function updateSeverity(value: unknown) {
  if (typeof value === "string") emit("update:newSeverity", value)
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
  <Card class="gap-0 py-0 overflow-hidden">
    <div class="flex flex-row items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
      <CardTitle class="text-base">{{ t("adminRisk.events.title") }}</CardTitle>
      <Dialog :open="props.createOpen" @update:open="updateCreateOpen">
        <DialogTrigger as-child>
          <Button size="sm">
            <LucidePlus class="w-4 h-4" /> {{ t("adminRisk.events.createButton") }}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t("adminRisk.events.createDialogTitle") }}</DialogTitle>
          </DialogHeader>
          <div class="flex flex-col gap-3 py-4">
            <div class="flex flex-col gap-1.5">
              <Label for="risk-event-severity">{{ t("adminRisk.events.fields.severity") }}</Label>
              <Select id="risk-event-severity" :model-value="props.newSeverity" @update:model-value="updateSeverity">
                <SelectTrigger id="risk-event-severity" class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in severityOptions" :key="option" :value="option">
                    {{ t(`adminRisk.severity.${option}`) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="risk-event-source">{{ t("adminRisk.events.fields.source") }}</Label>
              <Input
                id="risk-event-source"
                :model-value="props.newSource"
                :placeholder="t('adminRisk.events.placeholders.source')"
                @update:model-value="updateSource"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="risk-event-action">{{ t("adminRisk.events.fields.action") }}</Label>
              <Input
                id="risk-event-action"
                :model-value="props.newAction"
                :placeholder="t('adminRisk.events.placeholders.action')"
                @update:model-value="updateAction"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="risk-event-reason">{{ t("adminRisk.events.fields.reason") }}</Label>
              <textarea
                id="risk-event-reason"
                :value="props.newReason"
                :placeholder="t('adminRisk.events.placeholders.reason')"
                rows="3"
                class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                @input="emit('update:newReason', String(($event.target as HTMLTextAreaElement).value))"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="risk-event-target-user">{{ t("adminRisk.events.fields.targetUserIdOptional") }}</Label>
              <Input
                id="risk-event-target-user"
                :model-value="props.newTargetUserId"
                :placeholder="t('adminRisk.events.placeholders.targetUserId')"
                @update:model-value="updateTargetUserId"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline" :disabled="props.creating">
                {{ t("common.cancel") }}
              </Button>
            </DialogClose>
            <Button :disabled="props.creating" @click="emit('create')">
              <LucideLoader2 v-if="props.creating" class="w-4 h-4 animate-spin" />
              {{ t("adminRisk.events.create") }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    <CardContent class="p-0">
      <template v-if="props.loading">
        <div class="p-6 flex flex-col gap-3">
          <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
        </div>
      </template>
      <template v-else-if="props.events.length === 0">
        <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <LucideShieldCheck class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminRisk.events.empty") }}</p>
          <Button size="sm" variant="outline" @click="updateCreateOpen(true)">
            <LucidePlus class="w-4 h-4" />
            {{ t("adminRisk.events.createButton") }}
          </Button>
        </div>
      </template>
      <template v-else>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="pl-6">{{ t("adminRisk.events.table.severity") }}</TableHead>
              <TableHead>{{ t("adminRisk.events.table.action") }}</TableHead>
              <TableHead>{{ t("adminRisk.events.table.reason") }}</TableHead>
              <TableHead class="hidden md:table-cell">{{ t("adminRisk.events.table.user") }}</TableHead>
              <TableHead>{{ t("adminRisk.events.table.status") }}</TableHead>
              <TableHead class="hidden lg:table-cell">{{ t("adminRisk.events.table.time") }}</TableHead>
              <TableHead class="pr-6">{{ t("adminRisk.events.table.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="eventItem in props.events" :key="eventItem.id">
              <TableCell class="pl-6">
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
              <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
                {{ eventItem.userName || eventItem.targetUserId || t("adminRisk.common.fallback") }}
              </TableCell>
              <TableCell>
                <span
                  :class="[
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
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
              <TableCell class="hidden lg:table-cell text-muted-foreground text-sm whitespace-nowrap">{{ props.formatDate(eventItem.createdAt) }}</TableCell>
              <TableCell class="pr-6">
                <Button
                  v-if="eventItem.status === 'open'"
                  variant="outline"
                  size="sm"
                  :disabled="props.actionLoading"
                  :title="t('adminRisk.events.resolveAction')"
                  :aria-label="t('adminRisk.events.resolveAction')"
                  @click="emit('resolve', eventItem.id)"
                >
                  <LucideCheckCircle2 class="w-3.5 h-3.5" />
                  <span class="hidden xl:inline">{{ t("adminRisk.events.resolveAction") }}</span>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </template>
    </CardContent>
    <div
      v-if="props.totalEvents > 0"
      class="flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6"
    >
      <span class="text-sm text-muted-foreground">
        {{ t("adminRisk.events.total", { total: props.totalEvents }) }}
      </span>
      <div v-if="props.totalEvents > props.eventPageSize" class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="props.loading || props.eventPage <= 1"
          :title="t('adminRisk.events.pagination.prev')"
          :aria-label="t('adminRisk.events.pagination.prev')"
          @click="emit('prevPage')"
        >
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ props.eventPage }} / {{ props.eventTotalPages() }}</span>
        <Button
          variant="outline"
          size="sm"
          :disabled="props.loading || props.eventPage >= props.eventTotalPages()"
          :title="t('adminRisk.events.pagination.next')"
          :aria-label="t('adminRisk.events.pagination.next')"
          @click="emit('nextPage')"
        >
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
</template>
