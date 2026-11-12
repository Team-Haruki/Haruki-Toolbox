<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
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
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideSearch,
  LucideBell,
  LucideLoader2,
  LucideRefreshCw,
  LucideRotateCcw,
  LucideUsers,
  LucideShield,
  LucideShieldAlert,
} from "lucide-vue-next"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsLinkRow from "@/shared/components/settings/SettingsLinkRow.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import { roleLabel } from "@/modules/admin-users/constants"
import AdminTicketChip from "@/modules/tickets/components/AdminTicketChip.vue"
import AdminTicketListRow from "@/modules/tickets/components/AdminTicketListRow.vue"
import AdminTicketListStats from "@/modules/tickets/components/AdminTicketListStats.vue"
import { ADMIN_TICKET_ROW_GRID } from "@/modules/tickets/lib/admin-ticket-display"
import { useAdminTicketList } from "@/modules/tickets/composables/useAdminTicketList"

const { t, locale } = useI18n()

const {
  loading,
  loadError,
  tickets,
  page,
  pageSize,
  total,
  totalPages,
  search,
  quickFilter,
  statusFilter,
  priorityFilter,
  hasActiveFilters,
  ticketNotificationsEnabled,
  ticketNotificationsLoading,
  ticketNotificationsError,
  ticketNotificationsSaving,
  loadTicketNotificationPreference,
  ticketNotificationRecipients,
  ticketNotificationRecipientsLoading,
  ticketNotificationRecipientsSavingUserId,
  ticketNotificationRecipientsDialogOpen,
  isSuperAdmin,
  quickFilterOptions,
  statusOptions,
  priorityOptions,
  setTicketNotificationsEnabled,
  openTicketNotificationRecipientsDialog,
  refreshTicketNotificationRecipients,
  setTicketNotificationRecipientEnabled,
  refreshTickets,
  statsSummary,
  statsLoading,
  statsFailed,
  reloadStats,
  applySearch,
  resetFilters,
  prevPage,
  nextPage,
  goToPage,
} = useAdminTicketList()
</script>

<template>
  <!-- Everything below lays itself out against this column (it sits beside the
       admin nav), not the viewport. On a narrow column the breakdown panels
       move under the list, so the queue stays near the top of a phone. -->
  <div class="@container w-full" data-testid="admin-ticket-list">
    <div class="flex flex-col gap-4">
      <AdminTicketListStats
        class="order-2 @min-[52rem]:order-none"
        :summary="statsSummary"
        :loading="statsLoading"
        :failed="statsFailed"
        :rows="tickets"
        :rows-loading="loading"
        @retry="reloadStats"
      />

      <section class="order-1 overflow-hidden rounded-xl border bg-card @min-[52rem]:order-none" data-testid="admin-ticket-table">
        <!-- Filters -->
        <form
          class="grid grid-cols-2 gap-2 border-b border-border/60 p-3 @min-[34rem]:grid-cols-[repeat(3,minmax(0,1fr))_auto] @min-[52rem]:grid-cols-[minmax(0,1fr)_9.5rem_9.5rem_8.5rem_auto]"
          novalidate
          @submit.prevent="applySearch"
        >
          <div class="relative col-span-full @min-[52rem]:col-span-1">
            <LucideSearch class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input v-model="search" :placeholder="t('tickets.adminList.searchPlaceholder')" :aria-label="t('tickets.adminList.searchPlaceholder')" class="pl-9" />
          </div>
          <div class="min-w-0">
            <Label id="admin-ticket-quick-filter-label" for="admin-ticket-quick-filter" class="sr-only">{{ t("tickets.adminList.quickFilters.all") }}</Label>
            <Select id="admin-ticket-quick-filter" :key="locale" v-model="quickFilter">
              <SelectTrigger class="w-full" aria-labelledby="admin-ticket-quick-filter-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in quickFilterOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="min-w-0">
            <Label id="admin-ticket-status-filter-label" for="admin-ticket-status-filter" class="sr-only">{{ t("tickets.filters.allStatus") }}</Label>
            <Select id="admin-ticket-status-filter" :key="locale" v-model="statusFilter">
              <SelectTrigger class="w-full" aria-labelledby="admin-ticket-status-filter-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="min-w-0">
            <Label id="admin-ticket-priority-filter-label" for="admin-ticket-priority-filter" class="sr-only">{{ t("tickets.filters.allPriorities") }}</Label>
            <Select id="admin-ticket-priority-filter" :key="locale" v-model="priorityFilter">
              <SelectTrigger class="w-full" aria-labelledby="admin-ticket-priority-filter-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in priorityOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex items-center justify-end gap-1.5">
            <Button
              type="submit"
              size="icon"
              class="pointer-coarse:size-10"
              :disabled="loading"
              :title="t('admin.filters.search')"
              :aria-label="t('admin.filters.search')"
            >
              <LucideSearch aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              class="pointer-coarse:size-10"
              :disabled="!hasActiveFilters"
              :title="t('admin.filters.reset')"
              :aria-label="t('admin.filters.reset')"
              @click="resetFilters"
            >
              <LucideRotateCcw aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              class="pointer-coarse:size-10"
              :disabled="loading"
              :title="t('tickets.adminList.refreshButton')"
              :aria-label="t('tickets.adminList.refreshButton')"
              @click="refreshTickets"
            >
              <LucideLoader2 v-if="loading" class="animate-spin" aria-hidden="true" />
              <LucideRefreshCw v-else aria-hidden="true" />
            </Button>
          </div>
        </form>

        <!-- Rows -->
        <div v-if="loading && tickets.length === 0" class="divide-y divide-border/60" aria-busy="true">
          <div v-for="index in 6" :key="index" class="flex items-center gap-3 px-4 py-3">
            <div class="min-w-0 flex-1 space-y-1.5">
              <Skeleton class="h-4 w-2/3" />
              <Skeleton class="h-3 w-1/3" />
            </div>
            <Skeleton class="h-5 w-20" />
          </div>
        </div>
        <LoadErrorState
          v-else-if="loadError"
          :title="t('tickets.adminList.toast.loadFailedTitle')"
          :description="loadError.message"
          :detail="loadError.detail"
          :retrying="loading"
          @retry="refreshTickets"
        />
        <EmptyState
          v-else-if="tickets.length === 0"
          :title="hasActiveFilters ? t('tickets.adminList.emptyFiltered') : t('tickets.adminList.empty')"
        >
          <template v-if="hasActiveFilters" #action>
            <Button type="button" variant="outline" size="sm" @click="resetFilters">
              <LucideRotateCcw aria-hidden="true" />
              {{ t("admin.filters.reset") }}
            </Button>
          </template>
        </EmptyState>
        <template v-else>
          <div
            :class="['hidden items-center gap-x-3 border-b border-border/60 bg-muted/40 px-4 py-2 text-xs text-muted-foreground @min-[52rem]:grid', ADMIN_TICKET_ROW_GRID]"
            aria-hidden="true"
          >
            <span>{{ t("tickets.adminList.table.subject") }}</span>
            <span>{{ t("tickets.adminList.table.people") }}</span>
            <span>{{ t("tickets.adminList.table.category") }}</span>
            <span>{{ t("tickets.adminList.table.priority") }}</span>
            <span>{{ t("tickets.adminList.table.status") }}</span>
            <span class="text-right">{{ t("tickets.adminList.table.updatedAt") }}</span>
          </div>
          <ul
            role="list"
            :class="['divide-y divide-border/60 transition-opacity', loading ? 'opacity-60' : '']"
            :aria-label="t('tickets.adminList.title')"
            :aria-busy="loading"
          >
            <li v-for="ticketItem in tickets" :key="ticketItem.ticketId">
              <AdminTicketListRow :ticket="ticketItem" />
            </li>
          </ul>
        </template>

        <!-- Pagination footer: not before the first answer, when the total is not known yet. -->
        <footer v-if="!loadError && !(loading && tickets.length === 0)" class="border-t border-border/60 px-4 py-2.5">
          <AdminPagination
            :total="total"
            :page="page"
            :page-size="pageSize"
            :total-pages="totalPages"
            :disabled="loading"
            :total-label="t('tickets.adminList.total', { total })"
            @update:page-size="pageSize = $event"
            @prev-page="prevPage"
            @next-page="nextPage"
            @go-to-page="goToPage"
          />
        </footer>
      </section>

      <!-- Notifications -->
      <SettingsGroup class="order-3" surface="card" :title="t('tickets.adminList.notifications.title')">
        <SettingsRow
          :icon="LucideBell"
          :label="t('tickets.adminList.notifications.label')"
          :help="t('tickets.adminList.notifications.description')"
          label-for="ticket-notification-toggle"
          :tone="ticketNotificationsEnabled ? 'primary' : 'default'"
        >
          <!-- A secondary widget: its load failure stays inline (no toast). -->
          <template v-if="ticketNotificationsError && !ticketNotificationsLoading" #note>
            <p class="mt-1 text-xs text-destructive-tint-foreground" role="alert">
              {{ t("tickets.adminList.notifications.loadFailedTitle") }}：{{ ticketNotificationsError.message }}
              <button type="button" class="ml-1 inline-flex min-h-8 items-center underline underline-offset-4 pointer-coarse:min-h-10" @click="loadTicketNotificationPreference">
                {{ t("core.loadError.retry") }}
              </button>
            </p>
          </template>
          <LucideLoader2
            v-if="ticketNotificationsLoading || ticketNotificationsSaving"
            class="size-4 shrink-0 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
          <Switch
            id="ticket-notification-toggle"
            class="shrink-0"
            :model-value="ticketNotificationsEnabled"
            :disabled="ticketNotificationsLoading || ticketNotificationsSaving || !!ticketNotificationsError"
            @update:model-value="setTicketNotificationsEnabled"
          />
        </SettingsRow>
        <SettingsLinkRow
          v-if="isSuperAdmin"
          :icon="LucideUsers"
          :label="t('tickets.adminList.notifications.manageButton')"
          :help="t('tickets.adminList.notifications.manageHelp')"
          @click="openTicketNotificationRecipientsDialog"
        />
      </SettingsGroup>
    </div>

    <Dialog v-model:open="ticketNotificationRecipientsDialogOpen">
      <DialogContent size="2xl">
        <DialogHeader>
          <DialogTitle>{{ t("tickets.adminList.notifications.manageDialogTitle") }}</DialogTitle>
          <DialogDescription>
            {{ t("tickets.adminList.notifications.manageDialogDescription") }}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm text-muted-foreground tabular-nums">
              {{ t("tickets.adminList.notifications.manageDialogSummary", { total: ticketNotificationRecipients.length }) }}
            </span>
            <Button
              variant="outline"
              size="sm"
              :disabled="ticketNotificationRecipientsLoading"
              @click="refreshTicketNotificationRecipients"
            >
              <LucideLoader2 v-if="ticketNotificationRecipientsLoading" class="size-4 animate-spin" />
              <LucideRefreshCw v-else class="size-4" />
              {{ t("tickets.adminList.notifications.manageRefresh") }}
            </Button>
          </div>

          <div v-if="ticketNotificationRecipientsLoading" class="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <LucideLoader2 class="size-4 animate-spin" />
            {{ t("tickets.adminList.notifications.manageLoading") }}
          </div>
          <EmptyState
            v-else-if="ticketNotificationRecipients.length === 0"
            size="sm"
            :icon="LucideUsers"
            :title="t('tickets.adminList.notifications.manageEmpty')"
          />
          <div v-else class="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t("tickets.adminList.notifications.manageTable.name") }}</TableHead>
                  <TableHead>{{ t("tickets.adminList.notifications.manageTable.role") }}</TableHead>
                  <TableHead class="hidden sm:table-cell">{{ t("tickets.adminList.notifications.manageTable.email") }}</TableHead>
                  <TableHead class="text-right">{{ t("tickets.adminList.notifications.manageTable.enabled") }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="recipient in ticketNotificationRecipients" :key="recipient.userId">
                  <TableCell>
                    <div class="font-medium">{{ recipient.name || recipient.userId }}</div>
                    <div class="text-xs text-muted-foreground tabular-nums [overflow-wrap:anywhere]">{{ recipient.userId }}</div>
                    <div v-if="recipient.banned" class="mt-1 text-xs text-destructive-tint-foreground">
                      {{ t("tickets.adminList.notifications.manageBannedHint") }}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AdminTicketChip
                      :tone="recipient.role === 'super_admin' ? 'danger' : 'info'"
                      :icon="recipient.role === 'super_admin' ? LucideShieldAlert : LucideShield"
                    >
                      {{ roleLabel(recipient.role, t) }}
                    </AdminTicketChip>
                  </TableCell>
                  <TableCell class="hidden sm:table-cell text-muted-foreground">
                    {{ recipient.email || "—" }}
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex items-center justify-end gap-2">
                      <LucideLoader2
                        v-if="ticketNotificationRecipientsSavingUserId === recipient.userId"
                        class="size-4 animate-spin text-muted-foreground"
                      />
                      <Switch
                        :id="`ticket-notification-recipient-${recipient.userId}`"
                        :aria-label="`${t('tickets.adminList.notifications.manageTable.enabled')} · ${recipient.name || recipient.userId}`"
                        :model-value="recipient.ticketEmailNotificationsEnabled"
                        :disabled="ticketNotificationRecipientsSavingUserId === recipient.userId"
                        @update:model-value="setTicketNotificationRecipientEnabled(recipient.userId, Boolean($event))"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  </div>
</template>
