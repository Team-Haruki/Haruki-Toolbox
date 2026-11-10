<script setup lang="ts">
import { computed, ref, useId } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Label } from "@/components/ui/label"
import {
  LucideBan,
  LucideCircleCheck,
  LucideRotateCcw,
  LucideSearch,
  LucideSlidersHorizontal,
} from "lucide-vue-next"
import { roleLabel } from "@/modules/admin-users/constants"
import UserRoleSelectItems from "./UserRoleSelectItems.vue"

type RoleFilter = "all" | "user" | "admin" | "super_admin"
type BooleanFilter = "all" | "true" | "false"
type SortFilter =
  | "id_desc"
  | "id_asc"
  | "name_desc"
  | "name_asc"
  | "created_at_desc"
  | "created_at_asc"

/**
 * The list's toolbar: the search box with its two buttons, then the filters
 * on one line. Each select names itself inside its trigger ("Role" until a
 * role is picked, then "Role · Admin"), so the line needs no label row. On a
 * narrow list the filters fold behind a button that counts the active ones.
 */
const props = defineProps<{
  search: string
  roleFilter: RoleFilter
  bannedFilter: BooleanFilter
  allowCnMysekaiFilter: BooleanFilter
  sortFilter: SortFilter
  createdFrom?: Date
  createdTo?: Date
  hasActiveFilters?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: "update:search", value: string): void
  (e: "update:roleFilter", value: RoleFilter): void
  (e: "update:bannedFilter", value: BooleanFilter): void
  (e: "update:allowCnMysekaiFilter", value: BooleanFilter): void
  (e: "update:sortFilter", value: SortFilter): void
  (e: "update:createdFrom", value: Date | undefined): void
  (e: "update:createdTo", value: Date | undefined): void
  /** Enter in the search box or the 查询 button: query now instead of after the debounce. */
  (e: "apply"): void
  (e: "reset"): void
}>()

const { t, locale } = useI18n()
const panelId = `${useId()}-filters`

// Only matters below the width where the filters sit on the toolbar anyway.
const expanded = ref(false)

const SORT_LABEL_KEYS: Record<SortFilter, string> = {
  id_desc: "adminUsers.management.filters.sortIdDesc",
  id_asc: "adminUsers.management.filters.sortIdAsc",
  name_desc: "adminUsers.management.filters.sortNameDesc",
  name_asc: "adminUsers.management.filters.sortNameAsc",
  created_at_desc: "adminUsers.management.filters.sortCreatedAtDesc",
  created_at_asc: "adminUsers.management.filters.sortCreatedAtAsc",
}
const SORT_OPTIONS = Object.keys(SORT_LABEL_KEYS) as SortFilter[]

/** Filters other than the search text that differ from their default. */
const activeFilterCount = computed(() => [
  props.roleFilter !== "all",
  props.bannedFilter !== "all",
  props.allowCnMysekaiFilter !== "all",
  props.sortFilter !== "id_desc",
  !!props.createdFrom,
  !!props.createdTo,
].filter(Boolean).length)

const roleValueLabel = computed(() => props.roleFilter === "all" ? null : roleLabel(props.roleFilter, t))
const statusValueLabel = computed(() => {
  if (props.bannedFilter === "all") return null
  return props.bannedFilter === "true" ? t("adminUsers.status.banned") : t("adminUsers.status.normal")
})
const allowCNValueLabel = computed(() => {
  if (props.allowCnMysekaiFilter === "all") return null
  return props.allowCnMysekaiFilter === "true" ? t("adminUsers.common.allowed") : t("adminUsers.common.denied")
})

function parseDate(value: unknown) {
  return value instanceof Date ? value : undefined
}
</script>

<template>
  <form
    class="flex flex-col gap-2 border-b border-border/60 px-3 py-3"
    novalidate
    data-testid="admin-users-filters"
    @submit.prevent="emit('apply')"
  >
    <div class="flex items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <Label for="admin-user-filter-search" class="sr-only">{{ t("adminUsers.management.filters.searchLabel") }}</Label>
        <LucideSearch class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id="admin-user-filter-search"
          :model-value="search"
          :placeholder="t('adminUsers.management.filters.searchPlaceholder')"
          class="pl-9"
          @update:model-value="emit('update:search', String($event ?? ''))"
        />
      </div>

      <Button
        type="button"
        variant="outline"
        class="shrink-0 gap-1.5 px-2.5 @min-[48rem]/users:hidden"
        :aria-expanded="expanded"
        :aria-controls="panelId"
        :title="t('adminUsers.management.filters.toggle')"
        :aria-label="t('adminUsers.management.filters.toggle')"
        @click="expanded = !expanded"
      >
        <LucideSlidersHorizontal class="size-4" aria-hidden="true" />
        <span
          v-if="activeFilterCount > 0"
          class="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold tabular-nums text-primary-foreground"
        >
          {{ activeFilterCount }}
        </span>
      </Button>

      <Button
        type="submit"
        class="shrink-0 gap-1.5 px-2.5 @min-[48rem]/users:px-3"
        :disabled="loading"
        :title="t('admin.filters.search')"
        :aria-label="t('admin.filters.search')"
      >
        <LucideSearch class="size-4" aria-hidden="true" />
        <span class="hidden @min-[48rem]/users:inline">{{ t("admin.filters.search") }}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        class="shrink-0 gap-1.5 px-2.5 @min-[48rem]/users:px-3"
        :disabled="!hasActiveFilters"
        :title="t('admin.filters.reset')"
        :aria-label="t('admin.filters.reset')"
        @click="emit('reset')"
      >
        <LucideRotateCcw class="size-4" aria-hidden="true" />
        <span class="hidden @min-[48rem]/users:inline">{{ t("admin.filters.reset") }}</span>
      </Button>
    </div>

    <div
      :id="panelId"
      :class="[
        expanded ? 'grid' : 'hidden',
        'grid-cols-2 gap-2 @min-[48rem]/users:flex @min-[48rem]/users:flex-wrap @min-[48rem]/users:items-center',
      ]"
    >
      <div class="min-w-0">
        <Label id="admin-user-filter-role-label" for="admin-user-filter-role" class="sr-only">{{ t("adminUsers.management.filters.roleLabel") }}</Label>
        <Select id="admin-user-filter-role" :key="locale" :model-value="roleFilter" @update:model-value="emit('update:roleFilter', $event as RoleFilter)">
          <SelectTrigger aria-labelledby="admin-user-filter-role-label" class="w-full @min-[48rem]/users:w-fit">
            <span class="flex min-w-0 items-center gap-1.5">
              <span class="shrink-0 text-muted-foreground">{{ t("adminUsers.management.filters.roleLabel") }}</span>
              <span v-if="roleValueLabel" class="min-w-0 truncate font-medium">{{ roleValueLabel }}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("adminUsers.management.filters.roleAll") }}</SelectItem>
            <UserRoleSelectItems />
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-0">
        <Label id="admin-user-filter-status-label" for="admin-user-filter-status" class="sr-only">{{ t("adminUsers.management.filters.statusLabel") }}</Label>
        <Select id="admin-user-filter-status" :key="locale" :model-value="bannedFilter" @update:model-value="emit('update:bannedFilter', $event as BooleanFilter)">
          <SelectTrigger aria-labelledby="admin-user-filter-status-label" class="w-full @min-[48rem]/users:w-fit">
            <span class="flex min-w-0 items-center gap-1.5">
              <span class="shrink-0 text-muted-foreground">{{ t("adminUsers.management.filters.statusLabel") }}</span>
              <span v-if="statusValueLabel" class="min-w-0 truncate font-medium">{{ statusValueLabel }}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("adminUsers.management.filters.statusAll") }}</SelectItem>
            <SelectItem value="false">
              <div class="flex items-center gap-2">
                <LucideCircleCheck class="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {{ t("adminUsers.status.normal") }}
              </div>
            </SelectItem>
            <SelectItem value="true">
              <div class="flex items-center gap-2">
                <LucideBan class="size-4 text-destructive" aria-hidden="true" />
                {{ t("adminUsers.status.banned") }}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-0">
        <Label id="admin-user-filter-cn-label" for="admin-user-filter-cn" class="sr-only">{{ t("adminUsers.management.filters.allowCNLabel") }}</Label>
        <Select
          id="admin-user-filter-cn"
          :key="locale"
          :model-value="allowCnMysekaiFilter"
          @update:model-value="emit('update:allowCnMysekaiFilter', $event as BooleanFilter)"
        >
          <SelectTrigger aria-labelledby="admin-user-filter-cn-label" class="w-full @min-[48rem]/users:w-fit">
            <span class="flex min-w-0 items-center gap-1.5">
              <span class="min-w-0 truncate text-muted-foreground">{{ t("adminUsers.management.filters.allowCNShort") }}</span>
              <span v-if="allowCNValueLabel" class="shrink-0 font-medium">{{ allowCNValueLabel }}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{{ t("adminUsers.management.filters.allowCNAll") }}</SelectItem>
            <SelectItem value="true">
              <div class="flex items-center gap-2">
                <LucideCircleCheck class="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                {{ t("adminUsers.common.allowed") }}
              </div>
            </SelectItem>
            <SelectItem value="false">
              <div class="flex items-center gap-2">
                <LucideBan class="size-4 text-destructive" aria-hidden="true" />
                {{ t("adminUsers.common.denied") }}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="min-w-0">
        <Label id="admin-user-filter-sort-label" for="admin-user-filter-sort" class="sr-only">{{ t("adminUsers.management.filters.sortLabel") }}</Label>
        <Select id="admin-user-filter-sort" :key="locale" :model-value="sortFilter" @update:model-value="emit('update:sortFilter', $event as SortFilter)">
          <SelectTrigger aria-labelledby="admin-user-filter-sort-label" class="w-full @min-[48rem]/users:w-fit">
            <span class="flex min-w-0 items-center gap-1.5">
              <span class="shrink-0 text-muted-foreground">{{ t("adminUsers.management.filters.sortLabel") }}</span>
              <span class="min-w-0 truncate font-medium tabular-nums">{{ t(SORT_LABEL_KEYS[sortFilter]) }}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in SORT_OPTIONS" :key="option" :value="option">
              {{ t(SORT_LABEL_KEYS[option]) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="col-span-2 min-w-0 @min-[48rem]/users:w-44">
        <Label for="admin-user-filter-created-from" class="sr-only">{{ t("adminUsers.management.filters.createdFromLabel") }}</Label>
        <DateTimePicker24h
          id="admin-user-filter-created-from"
          :model-value="createdFrom"
          :placeholder="t('adminUsers.management.filters.createdFromLabel')"
          @update:model-value="emit('update:createdFrom', parseDate($event))"
        />
      </div>

      <div class="col-span-2 min-w-0 @min-[48rem]/users:w-44">
        <Label for="admin-user-filter-created-to" class="sr-only">{{ t("adminUsers.management.filters.createdToLabel") }}</Label>
        <DateTimePicker24h
          id="admin-user-filter-created-to"
          :model-value="createdTo"
          :placeholder="t('adminUsers.management.filters.createdToLabel')"
          @update:model-value="emit('update:createdTo', parseDate($event))"
        />
      </div>
    </div>
  </form>
</template>
