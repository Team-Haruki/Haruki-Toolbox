<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucidePlus,
  LucideRefreshCw,
  LucideTicket,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useNowTick } from "@/composables/useNowTick"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import TicketListRow from "@/modules/tickets/components/TicketListRow.vue"
import {
  USER_TICKET_ROW_GRID,
  USER_TICKET_STATUS_FILTERS,
  userTicketStatusLabelKey,
} from "@/modules/tickets/lib/user-ticket"
import { useTicketList } from "@/modules/tickets/composables/useTicketList"

const { t } = useI18n()

const {
  loading,
  loadError,
  tickets,
  total,
  page,
  pageSize,
  totalPages,
  statusFilter,
  waitingCount,
  prevPage,
  nextPage,
  reload,
  setStatusFilter,
} = useTicketList()

// Ages ("42 minutes ago") move on while the page stays open.
const now = useNowTick(60_000)

/** The first load has nothing to show yet; later loads keep the rows on screen. */
const firstLoad = computed(() => loading.value && tickets.value.length === 0 && !loadError.value)
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 py-1 sm:py-2" data-testid="ticket-list">
    <PageHeader :title="t('tickets.list.title')">
      <template #actions>
        <Button as-child>
          <RouterLink :to="{ name: 'tickets.create' }">
            <LucidePlus aria-hidden="true" />
            {{ t("tickets.list.createButton") }}
          </RouterLink>
        </Button>
        <Button
          variant="outline"
          size="icon"
          :disabled="loading"
          :aria-label="t('tickets.list.refresh')"
          :title="t('tickets.list.refresh')"
          data-testid="ticket-refresh"
          @click="reload"
        >
          <LucideRefreshCw :class="loading && !firstLoad ? 'animate-spin motion-reduce:animate-none' : ''" aria-hidden="true" />
        </Button>
      </template>
    </PageHeader>

    <!-- Filter: one chip per status, in the user's own words; the chip that waits for them carries its count. -->
    <ToggleGroup
      type="single"
      :model-value="statusFilter"
      :aria-label="t('tickets.list.filterLabel')"
      data-testid="ticket-status-filter"
      @update:model-value="setStatusFilter"
    >
      <ToggleGroupItem v-for="status in USER_TICKET_STATUS_FILTERS" :key="status" :value="status" :data-status="status">
        {{ t(userTicketStatusLabelKey(status)) }}
        <span
          v-if="status === 'pending_user' && waitingCount"
          :class="[
            '-mr-1 inline-flex min-w-4.5 items-center justify-center rounded-full px-1 text-[11px] leading-4.5 font-semibold tabular-nums',
            statusFilter === status ? 'bg-primary-foreground/20' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
          ]"
          :title="t('tickets.list.waitingCount', { count: waitingCount }, waitingCount)"
          data-testid="ticket-waiting-count"
        >
          <span aria-hidden="true">{{ waitingCount }}</span>
          <span class="sr-only">{{ t("tickets.list.waitingCount", { count: waitingCount }, waitingCount) }}</span>
        </span>
      </ToggleGroupItem>
    </ToggleGroup>

    <!-- One surface for every state: rows, skeleton, empty, failure. -->
    <section class="@container overflow-hidden rounded-xl border bg-card" :aria-busy="loading">
      <div v-if="firstLoad" class="divide-y divide-border/60" role="status" :aria-label="t('tickets.list.loading')">
        <div v-for="index in 4" :key="index" class="flex flex-col gap-2 px-4 py-3">
          <Skeleton class="h-4 w-3/5" />
          <Skeleton class="h-3 w-2/5" />
        </div>
      </div>

      <!-- A failed load never looks like "no tickets". -->
      <div v-else-if="loadError" class="px-4">
        <LoadErrorState
          :title="t('tickets.list.toast.loadFailedTitle')"
          :description="loadError.message"
          :detail="loadError.detail"
          :retrying="loading"
          @retry="reload"
        />
      </div>

      <template v-else-if="tickets.length > 0">
        <div
          :class="['hidden items-center gap-x-3 border-b border-border/60 px-4 py-1.5 text-[11px] text-muted-foreground @min-[40rem]:grid', USER_TICKET_ROW_GRID]"
          aria-hidden="true"
        >
          <span>{{ t("tickets.list.columns.ticket") }}</span>
          <span>{{ t("tickets.list.columns.status") }}</span>
          <span class="text-right">{{ t("tickets.list.updatedAt") }}</span>
        </div>
        <ul role="list" :class="['divide-y divide-border/60 transition-opacity motion-reduce:transition-none', loading ? 'opacity-60' : '']">
          <li v-for="ticket in tickets" :key="ticket.ticketId">
            <TicketListRow :ticket="ticket" :now="now" />
          </li>
        </ul>
        <!-- The whole set's size, and the pager once it spans pages. -->
        <div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border/60 py-2 pr-2 pl-4">
          <p class="text-xs tabular-nums text-muted-foreground" aria-live="polite" data-testid="ticket-total">
            {{ t("tickets.list.total", { total }, total) }}
            <template v-if="total > pageSize"> · {{ t("tickets.list.pagination.page", { page, total: totalPages }) }}</template>
          </p>
          <nav v-if="total > pageSize" class="flex items-center gap-1" :aria-label="t('tickets.list.pagination.label')">
            <Button variant="ghost" size="sm" :disabled="page <= 1 || loading" data-testid="ticket-prev-page" @click="prevPage">
              <LucideChevronLeft aria-hidden="true" />
              {{ t("tickets.list.pagination.prevPage") }}
            </Button>
            <Button variant="ghost" size="sm" :disabled="page >= totalPages || loading" data-testid="ticket-next-page" @click="nextPage">
              {{ t("tickets.list.pagination.nextPage") }}
              <LucideChevronRight aria-hidden="true" />
            </Button>
          </nav>
        </div>
      </template>

      <div v-else class="px-4">
        <EmptyState
          v-if="statusFilter === 'all'"
          :icon="LucideTicket"
          :title="t('tickets.list.empty')"
        >
          <template #action>
            <Button as-child variant="outline" size="sm">
              <RouterLink :to="{ name: 'tickets.create' }">
                <LucidePlus aria-hidden="true" />
                {{ t("tickets.list.createButton") }}
              </RouterLink>
            </Button>
          </template>
        </EmptyState>
        <EmptyState
          v-else
          :icon="LucideTicket"
          :title="t('tickets.list.emptyFiltered', { status: t(userTicketStatusLabelKey(statusFilter)) })"
        >
          <template #action>
            <Button variant="outline" size="sm" @click="setStatusFilter('all')">
              {{ t("tickets.list.showAll") }}
            </Button>
          </template>
        </EmptyState>
      </div>
    </section>
  </div>
</template>
