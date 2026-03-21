<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { formatLocalizedDate } from "@/lib/date-time"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
} from "lucide-vue-next"
import {
  ticketPriorityBadgeClass,
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusBadgeClass,
  ticketStatusIcon,
  ticketStatusLabel,
} from "@/modules/tickets/lib/display"
import { useAdminTicketList } from "@/modules/tickets/composables/useAdminTicketList"

const { t, locale } = useI18n()

function formatTicketDate(iso?: string) {
  return formatLocalizedDate(iso, { year: "numeric", month: "2-digit", day: "2-digit" }, t("tickets.common.dateFallback"))
}

const {
  loading,
  tickets,
  page,
  total,
  totalPages,
  search,
  statusFilter,
  priorityFilter,
  statusOptions,
  priorityOptions,
  prevPage,
  nextPage,
  openTicket,
} = useAdminTicketList()

function handleRowKeydown(event: KeyboardEvent, ticketId: string) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    openTicket(ticketId)
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- Toolbar -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">{{ t("tickets.adminList.title") }}</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div class="relative flex-1 min-w-[200px]">
            <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input v-model="search" :placeholder="t('tickets.adminList.searchPlaceholder')" class="pl-9" />
          </div>
          <Select :key="locale" v-model="statusFilter">
            <SelectTrigger class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select :key="locale" v-model="priorityFilter">
            <SelectTrigger class="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in priorityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

    <!-- Ticket table -->
    <Card>
      <CardContent class="p-0">
        <template v-if="loading">
          <div class="p-6 flex flex-col gap-3">
            <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("tickets.adminList.table.subject") }}</TableHead>
                <TableHead>{{ t("tickets.adminList.table.status") }}</TableHead>
                <TableHead>{{ t("tickets.adminList.table.priority") }}</TableHead>
                <TableHead class="hidden sm:table-cell">{{ t("tickets.adminList.table.creator") }}</TableHead>
                <TableHead class="hidden md:table-cell">{{ t("tickets.adminList.table.assignee") }}</TableHead>
                <TableHead>{{ t("tickets.adminList.table.updatedAt") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="ticketItem in tickets"
                :key="ticketItem.ticketId"
                class="cursor-pointer hover:bg-muted/50 transition-colors"
                role="button"
                tabindex="0"
                @click="openTicket(ticketItem.ticketId)"
                @keydown="handleRowKeydown($event, ticketItem.ticketId)"
              >
                <TableCell class="font-medium max-w-[200px] truncate">{{ ticketItem.subject }}</TableCell>
                <TableCell>
                  <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', ticketStatusBadgeClass(ticketItem.status)]">
                    <component :is="ticketStatusIcon(ticketItem.status)" class="w-3.5 h-3.5" />
                    {{ ticketStatusLabel(ticketItem.status) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', ticketPriorityBadgeClass(ticketItem.priority)]">
                    <component :is="ticketPriorityIcon(ticketItem.priority)" class="w-3.5 h-3.5" />
                    {{ ticketPriorityLabel(ticketItem.priority) }}
                  </span>
                </TableCell>
                <TableCell class="hidden sm:table-cell text-muted-foreground">{{ ticketItem.creatorUserName || ticketItem.creatorUserId }}</TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground">
                  {{ ticketItem.assigneeAdminName || ticketItem.assigneeAdminId || t("tickets.adminList.unassigned") }}
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatTicketDate(ticketItem.updatedAt) }}</TableCell>
              </TableRow>
              <TableRow v-if="tickets.length === 0">
                <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">{{ t("tickets.adminList.empty") }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">{{ t("tickets.adminList.total", { total }) }}</span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
