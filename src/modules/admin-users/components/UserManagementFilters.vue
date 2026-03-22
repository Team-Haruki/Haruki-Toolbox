<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Label } from "@/components/ui/label"
import {
  LucideBan,
  LucideCheckCircle2,
  LucideSearch,
  LucideShield,
  LucideShieldAlert,
  LucideUser,
} from "lucide-vue-next"

type RoleFilter = "all" | "user" | "admin" | "super_admin"
type BooleanFilter = "all" | "true" | "false"
type SortFilter =
  | "id_desc"
  | "id_asc"
  | "name_desc"
  | "name_asc"
  | "created_at_desc"
  | "created_at_asc"

defineProps<{
  search: string
  roleFilter: RoleFilter
  bannedFilter: BooleanFilter
  allowCnMysekaiFilter: BooleanFilter
  sortFilter: SortFilter
  createdFrom?: Date
  createdTo?: Date
}>()

const emit = defineEmits<{
  (e: "update:search", value: string): void
  (e: "update:roleFilter", value: RoleFilter): void
  (e: "update:bannedFilter", value: BooleanFilter): void
  (e: "update:allowCnMysekaiFilter", value: BooleanFilter): void
  (e: "update:sortFilter", value: SortFilter): void
  (e: "update:createdFrom", value: Date | undefined): void
  (e: "update:createdTo", value: Date | undefined): void
}>()

const { t, locale } = useI18n()

function parseDate(value: unknown) {
  return value instanceof Date ? value : undefined
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap gap-4 items-end">
    <div class="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3 xl:w-[320px] 2xl:w-[384px]">
      <Label class="text-xs">{{ t("adminUsers.management.filters.searchLabel") }}</Label>
      <div class="relative">
        <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          :model-value="search"
          :placeholder="t('adminUsers.management.filters.searchPlaceholder')"
          class="pl-9"
          @update:model-value="emit('update:search', String($event ?? ''))"
        />
      </div>
    </div>

    <div class="flex flex-col gap-1.5 xl:w-32">
      <Label class="text-xs">{{ t("adminUsers.management.filters.roleLabel") }}</Label>
      <Select :key="locale" :model-value="roleFilter" @update:model-value="emit('update:roleFilter', $event as RoleFilter)">
        <SelectTrigger class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t("adminUsers.management.filters.roleAll") }}</SelectItem>
          <SelectItem value="user">
            <div class="flex items-center gap-2">
              <LucideUser class="w-4 h-4 text-muted-foreground" />
              {{ t("adminUsers.role.user") }}
            </div>
          </SelectItem>
          <SelectItem value="admin">
            <div class="flex items-center gap-2">
              <LucideShield class="w-4 h-4 text-blue-500" />
              {{ t("adminUsers.role.admin") }}
            </div>
          </SelectItem>
          <SelectItem value="super_admin">
            <div class="flex items-center gap-2">
              <LucideShieldAlert class="w-4 h-4 text-red-500" />
              {{ t("adminUsers.role.superAdmin") }}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1.5 xl:w-32">
      <Label class="text-xs">{{ t("adminUsers.management.filters.statusLabel") }}</Label>
      <Select :key="locale" :model-value="bannedFilter" @update:model-value="emit('update:bannedFilter', $event as BooleanFilter)">
        <SelectTrigger class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t("adminUsers.management.filters.statusAll") }}</SelectItem>
          <SelectItem value="false">
            <div class="flex items-center gap-2">
              <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
              {{ t("adminUsers.status.normal") }}
            </div>
          </SelectItem>
          <SelectItem value="true">
            <div class="flex items-center gap-2">
              <LucideBan class="w-4 h-4 text-red-500" />
              {{ t("adminUsers.status.banned") }}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1.5 xl:w-32">
      <Label class="text-xs">{{ t("adminUsers.management.filters.allowCNLabel") }}</Label>
      <Select :key="locale"
        :model-value="allowCnMysekaiFilter"
        @update:model-value="emit('update:allowCnMysekaiFilter', $event as BooleanFilter)"
      >
        <SelectTrigger class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{{ t("adminUsers.management.filters.allowCNAll") }}</SelectItem>
          <SelectItem value="true">
            <div class="flex items-center gap-2">
              <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
              {{ t("adminUsers.common.allowed") }}
            </div>
          </SelectItem>
          <SelectItem value="false">
            <div class="flex items-center gap-2">
              <LucideBan class="w-4 h-4 text-red-500" />
              {{ t("adminUsers.common.denied") }}
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1.5 xl:w-36">
      <Label class="text-xs">{{ t("adminUsers.management.filters.sortLabel") }}</Label>
      <Select :key="locale" :model-value="sortFilter" @update:model-value="emit('update:sortFilter', $event as SortFilter)">
        <SelectTrigger class="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="id_desc">{{ t("adminUsers.management.filters.sortIdDesc") }}</SelectItem>
          <SelectItem value="id_asc">{{ t("adminUsers.management.filters.sortIdAsc") }}</SelectItem>
          <SelectItem value="name_desc">{{ t("adminUsers.management.filters.sortNameDesc") }}</SelectItem>
          <SelectItem value="name_asc">{{ t("adminUsers.management.filters.sortNameAsc") }}</SelectItem>
          <SelectItem value="created_at_desc">{{ t("adminUsers.management.filters.sortCreatedAtDesc") }}</SelectItem>
          <SelectItem value="created_at_asc">{{ t("adminUsers.management.filters.sortCreatedAtAsc") }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex flex-col gap-1.5 xl:w-48">
      <Label class="text-xs">{{ t("adminUsers.management.filters.createdFromLabel") }}</Label>
      <div class="w-full">
        <DateTimePicker24h
          :model-value="createdFrom"
          :placeholder="t('adminUsers.management.filters.createdFromPlaceholder')"
          @update:model-value="emit('update:createdFrom', parseDate($event))"
        />
      </div>
    </div>

    <div class="flex flex-col gap-1.5 xl:w-48">
      <Label class="text-xs">{{ t("adminUsers.management.filters.createdToLabel") }}</Label>
      <div class="w-full">
        <DateTimePicker24h
          :model-value="createdTo"
          :placeholder="t('adminUsers.management.filters.createdToPlaceholder')"
          @update:model-value="emit('update:createdTo', parseDate($event))"
        />
      </div>
    </div>
  </div>
</template>
