<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucidePlus,
  LucideChevronLeft,
  LucideChevronRight,
} from "lucide-vue-next"
import {
  ticketPriorityBadgeClass,
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketStatusIcon,
  ticketStatusLabel,
  ticketStatusTextClass,
} from "@/modules/tickets/lib/display"
import { isTicketCategory, ticketCategoryLabel } from "@/modules/tickets/lib/meta"
import { useTicketList } from "@/modules/tickets/composables/useTicketList"

const { t, locale } = useI18n()

function formatTicketDate(iso?: string) {
  if (!iso) return t("tickets.common.dateFallback")
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return t("tickets.common.dateFallback")
  return date.toLocaleDateString(locale.value, { year: "numeric", month: "2-digit", day: "2-digit" })
}

function formatCategory(category: string) {
  return isTicketCategory(category) ? ticketCategoryLabel(category, t) : category
}

const {
  loading,
  tickets,
  total,
  page,
  pageSize,
  totalPages,
  statusFilter,
  statusOptions,
  prevPage,
  nextPage,
  openCreateTicket,
  openTicketDetail,
} = useTicketList()

function handleTicketCardKeydown(event: KeyboardEvent, ticketId: string) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    openTicketDetail(ticketId)
  }
}
</script>

<template>
  <div class="w-full max-w-3xl mx-auto flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t("tickets.list.title") }}</h1>
      <Button @click="openCreateTicket">
        <LucidePlus class="w-4 h-4 mr-1" /> {{ t("tickets.list.createButton") }}
      </Button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-3">
      <Select v-model="statusFilter">
        <SelectTrigger class="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Ticket list -->
    <template v-if="loading">
      <Skeleton v-for="i in 3" :key="i" class="h-24 w-full" />
    </template>
    <template v-else-if="tickets.length > 0">
      <Card
        v-for="ticket in tickets"
        :key="ticket.ticketId"
        class="cursor-pointer hover:shadow-md transition-shadow"
        role="button"
        tabindex="0"
        @click="openTicketDetail(ticket.ticketId)"
        @keydown="handleTicketCardKeydown($event, ticket.ticketId)"
      >
        <CardContent class="py-0 flex flex-col gap-2">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-base truncate">{{ ticket.subject }}</h3>
              <div class="flex items-center gap-2 mt-1 flex-wrap">
                <span :class="['inline-flex items-center gap-1 text-xs font-medium', ticketStatusTextClass(ticket.status)]">
                  <component :is="ticketStatusIcon(ticket.status)" class="w-3.5 h-3.5" />
                  {{ ticketStatusLabel(ticket.status) }}
                </span>
                <span :class="['inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', ticketPriorityBadgeClass(ticket.priority)]">
                  <component :is="ticketPriorityIcon(ticket.priority)" class="w-3.5 h-3.5" v-if="ticketPriorityIcon(ticket.priority)" />
                  {{ ticketPriorityLabel(ticket.priority) }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ formatCategory(ticket.category) }}
                </span>
              </div>
            </div>
            <span class="text-xs text-muted-foreground whitespace-nowrap">
              {{ formatTicketDate(ticket.updatedAt) }}
            </span>
          </div>
        </CardContent>
      </Card>
    </template>
    <template v-else>
      <Card>
        <CardContent class="py-12 text-center text-muted-foreground">
          {{ t("tickets.list.empty") }}
        </CardContent>
      </Card>
    </template>

    <!-- Pagination -->
    <div v-if="total > pageSize" class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">{{ t("tickets.list.total", { total }) }}</span>
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
