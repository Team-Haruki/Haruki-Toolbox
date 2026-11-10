<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { LucideChevronRight, LucideCopy, LucideRotateCcw, LucideUsers } from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import { copyTextToClipboard } from "@/lib/clipboard"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatDate, formatDateTime, getAllowCNMysekai } from "@/modules/admin-users/constants"
import { avatarInitial } from "@/modules/admin-users/lib/user-display"
import type { AdminUser } from "@/types/admin"
import UserChip from "./UserChip.vue"
import UserRoleChip from "./UserRoleChip.vue"
import UserStatusChip from "./UserStatusChip.vue"

/**
 * The users as one dense list. From 55rem of list width it reads as a table:
 * a caption row, then avatar, name over ID, email, role, status, CN MySekai,
 * sign-up date and the row actions in fixed columns. Below that each row
 * folds to two lines (name and chips, then ID, email and date) — the same
 * elements re-placed by container queries, so every value is in the DOM once.
 *
 * The parent is the `@container/users` and draws the border.
 */
const props = defineProps<{
  loading: boolean
  /** A failed load; shown in place of the (empty) list with a retry. */
  error: ErrorDescription | null
  users: AdminUser[]
  selectedIds: string[]
  /** With filters on, the empty state offers to clear them. */
  hasActiveFilters?: boolean
}>()

const emit = defineEmits<{
  (e: "toggleSelectAll"): void
  (e: "toggleSelect", userId: string): void
  (e: "goToUser", userId: string): void
  (e: "retry"): void
  (e: "resetFilters"): void
}>()

const { t } = useI18n()

// The column template shared by the caption row and every user row.
const WIDE_GRID = "@min-[55rem]/users:grid-cols-[minmax(0,1.1fr)_minmax(0,1.25fr)_6rem_6.5rem_5.5rem_5rem] @min-[55rem]/users:gap-x-3"

const selectAllState = computed<boolean | "indeterminate">(() => {
  if (props.selectedIds.length === 0) return false
  if (props.selectedIds.length === props.users.length) return true
  return "indeterminate"
})

// The first load has nothing to show yet; later loads keep the rows on
// screen (dimmed) so paging and filtering do not flash a skeleton.
const showSkeleton = computed(() => props.loading && props.users.length === 0)

function isSelected(userId: string) {
  return props.selectedIds.includes(userId)
}

function createdDate(user: AdminUser) {
  return formatDate(user.createdAt)
}

function createdDateTime(user: AdminUser) {
  return user.createdAt ? formatDateTime(user.createdAt) : undefined
}

async function copyUserId(userId: string) {
  if (await copyTextToClipboard(userId)) {
    toast.success(t("adminUsers.common.idCopied"))
  } else {
    toast.error(t("adminUsers.common.copyFailed"))
  }
}
</script>

<template>
  <LoadErrorState
    v-if="error"
    :title="t('adminUsers.management.table.loadError')"
    :description="error.message"
    :detail="error.detail"
    :retry-label="t('adminUsers.management.table.retry')"
    :retrying="loading"
    @retry="emit('retry')"
  />

  <div v-else-if="!showSkeleton && users.length === 0" class="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
    <LucideUsers class="size-8 text-muted-foreground/60" aria-hidden="true" />
    <p class="text-sm font-medium">{{ t("adminUsers.management.table.empty") }}</p>
    <template v-if="hasActiveFilters">
      <p class="max-w-sm text-xs text-muted-foreground">{{ t("adminUsers.management.table.emptyFiltered") }}</p>
      <Button variant="outline" size="sm" class="mt-1" @click="emit('resetFilters')">
        <LucideRotateCcw class="size-4" aria-hidden="true" />
        {{ t("admin.filters.reset") }}
      </Button>
    </template>
  </div>

  <div v-else data-testid="admin-users-table" :aria-busy="loading || undefined">
    <!-- Caption row. On a narrow list only the select-all box and its label. -->
    <div class="flex items-center gap-3 border-b border-border/60 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
      <span class="flex w-4 shrink-0 items-center justify-center pointer-coarse:size-10">
        <Checkbox
          :model-value="selectAllState"
          :disabled="showSkeleton"
          :aria-label="t('adminUsers.management.table.selectPage')"
          @update:model-value="emit('toggleSelectAll')"
        />
      </span>
      <span class="hidden w-8 shrink-0 @min-[55rem]/users:block" aria-hidden="true" />
      <span class="min-w-0 flex-1 @min-[55rem]/users:hidden">{{ t("adminUsers.management.table.selectPage") }}</span>
      <div :class="['hidden min-w-0 flex-1 items-center @min-[55rem]/users:grid', WIDE_GRID]">
        <span class="truncate">{{ t("adminUsers.management.table.columns.user") }}</span>
        <span class="truncate">{{ t("adminUsers.management.table.columns.email") }}</span>
        <span class="truncate">{{ t("adminUsers.management.table.columns.role") }}</span>
        <span class="truncate">{{ t("adminUsers.management.table.columns.status") }}</span>
        <span class="truncate" :title="t('adminUsers.management.table.columns.allowCN')">{{ t("adminUsers.management.filters.allowCNShort") }}</span>
        <span class="truncate">{{ t("adminUsers.management.table.columns.createdAt") }}</span>
      </div>
      <span class="hidden w-16 shrink-0 @min-[55rem]/users:block pointer-coarse:w-20" aria-hidden="true" />
    </div>

    <ul v-if="showSkeleton" class="divide-y divide-border/60" aria-hidden="true">
      <li v-for="index in 8" :key="index" class="flex items-center gap-3 px-3 py-2.5">
        <Skeleton class="size-4 shrink-0 rounded" />
        <Skeleton class="size-8 shrink-0 rounded-full" />
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton class="h-4 w-40 max-w-full" />
          <Skeleton class="h-3 w-64 max-w-full" />
        </div>
        <Skeleton class="hidden h-5 w-16 rounded-full @min-[55rem]/users:block" />
        <Skeleton class="hidden h-5 w-16 rounded-full @min-[55rem]/users:block" />
        <Skeleton class="hidden h-4 w-20 @min-[55rem]/users:block" />
      </li>
    </ul>

    <ul
      v-else
      :class="['divide-y divide-border/60 transition-opacity', loading ? 'opacity-60' : '']"
      :aria-label="t('adminUsers.management.title')"
    >
      <li
        v-for="user in users"
        :key="user.userId"
        :class="[
          'flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40',
          isSelected(user.userId) ? 'bg-primary/5' : '',
        ]"
        :data-user-id="user.userId"
        @click="emit('goToUser', user.userId)"
      >
        <span class="flex w-4 shrink-0 items-center justify-center pointer-coarse:size-10" @click.stop>
          <Checkbox
            :model-value="isSelected(user.userId)"
            :aria-label="t('adminUsers.management.table.selectUser', { name: user.name })"
            @update:model-value="emit('toggleSelect', user.userId)"
          />
        </span>

        <Avatar class="size-8 border" aria-hidden="true">
          <AvatarImage v-if="user.avatarPath" :src="user.avatarPath" alt="" />
          <AvatarFallback class="text-xs font-semibold text-muted-foreground">{{ avatarInitial(user.name) }}</AvatarFallback>
        </Avatar>

        <div :class="['grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-0.5', WIDE_GRID]">
          <RouterLink
            :to="{ name: 'admin.userDetail', params: { userId: user.userId } }"
            class="max-w-full min-w-0 justify-self-start truncate rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/60 @min-[55rem]/users:col-start-1 @min-[55rem]/users:row-start-1"
            :title="user.name"
            @click.stop
          >
            {{ user.name }}
          </RouterLink>

          <div class="flex min-w-0 items-center justify-end gap-1.5 @min-[55rem]/users:contents">
            <div
              :class="[
                'min-w-0 items-center @min-[55rem]/users:col-start-3 @min-[55rem]/users:row-span-2 @min-[55rem]/users:row-start-1 @min-[55rem]/users:flex',
                user.role === 'user' ? 'hidden' : 'flex',
              ]"
            >
              <UserRoleChip :role="user.role" />
            </div>
            <!-- On a phone-width list only a status that needs attention takes room from the name. -->
            <div
              :class="[
                'min-w-0 items-center @min-[30rem]/users:flex @min-[55rem]/users:col-start-4 @min-[55rem]/users:row-span-2 @min-[55rem]/users:row-start-1',
                user.banned ? 'flex' : 'hidden',
              ]"
            >
              <UserStatusChip :banned="user.banned" :deleted="user.deleted" />
            </div>
            <div class="hidden min-w-0 items-center @min-[55rem]/users:col-start-5 @min-[55rem]/users:row-span-2 @min-[55rem]/users:row-start-1 @min-[55rem]/users:flex">
              <UserChip v-if="getAllowCNMysekai(user) !== undefined" :tone="getAllowCNMysekai(user) ? 'success' : 'default'">
                {{ getAllowCNMysekai(user) ? t("adminUsers.common.allowed") : t("adminUsers.common.denied") }}
              </UserChip>
              <span v-else class="text-xs text-muted-foreground">—</span>
            </div>
          </div>

          <!-- Second line of a folded row: ID and email; the date joins from 30rem. -->
          <div class="col-span-2 flex min-w-0 items-center gap-x-2 text-xs text-muted-foreground @min-[55rem]/users:contents">
            <span
              class="shrink-0 font-mono tabular-nums @min-[55rem]/users:col-start-1 @min-[55rem]/users:row-start-2 @min-[55rem]/users:truncate"
              :title="user.userId"
            >
              {{ user.userId }}
            </span>
            <span
              class="min-w-0 flex-1 truncate @min-[55rem]/users:col-start-2 @min-[55rem]/users:row-span-2 @min-[55rem]/users:row-start-1 @min-[55rem]/users:text-sm"
              :title="user.email || undefined"
            >
              {{ user.email || "—" }}
            </span>
            <span
              class="hidden shrink-0 tabular-nums @min-[30rem]/users:inline @min-[55rem]/users:col-start-6 @min-[55rem]/users:row-span-2 @min-[55rem]/users:row-start-1"
              :title="createdDateTime(user)"
            >
              {{ createdDate(user) }}
            </span>
          </div>
        </div>

        <div class="flex shrink-0 items-center @min-[55rem]/users:w-16 @min-[55rem]/users:justify-end pointer-coarse:@min-[55rem]/users:w-20" @click.stop>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="hidden size-8 text-muted-foreground @min-[55rem]/users:inline-flex pointer-coarse:size-10"
            :title="t('adminUsers.common.copyId')"
            :aria-label="t('adminUsers.common.copyId')"
            @click="copyUserId(user.userId)"
          >
            <LucideCopy class="size-3.5" aria-hidden="true" />
          </Button>
          <Button as-child variant="ghost" size="icon" class="size-8 text-muted-foreground pointer-coarse:size-10">
            <RouterLink
              :to="{ name: 'admin.userDetail', params: { userId: user.userId } }"
              :title="t('adminUsers.management.table.viewDetail')"
              :aria-label="t('adminUsers.management.table.viewDetail')"
            >
              <LucideChevronRight class="size-4" aria-hidden="true" />
            </RouterLink>
          </Button>
        </div>
      </li>
    </ul>
  </div>
</template>
