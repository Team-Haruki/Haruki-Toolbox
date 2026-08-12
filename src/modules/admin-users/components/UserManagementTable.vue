<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  LucideAlertCircle,
  LucideBan,
  LucideCheckCircle2,
  LucideShield,
  LucideShieldAlert,
  LucideTrash2,
  LucideUser,
  LucideUsers,
} from "lucide-vue-next"
import { formatDate, getAllowCNMysekai, roleLabel } from "@/modules/admin-users/constants"
import type { AdminUser } from "@/types/admin"

const props = defineProps<{
  loading: boolean
  error: boolean
  users: AdminUser[]
  selectedIds: string[]
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "toggleSelectAll"): void
  (e: "toggleSelect", userId: string): void
  (e: "goToUser", userId: string): void
  (e: "retry"): void
}>()

const selectAllState = computed<boolean | "indeterminate">(() => {
  if (props.selectedIds.length === 0) return false
  if (props.selectedIds.length === props.users.length) return true
  return "indeterminate"
})

function formatCreatedAt(iso?: string) {
  return formatDate(iso, { year: "numeric", month: "2-digit", day: "2-digit" })
}

function isSelected(userId: string) {
  return props.selectedIds.includes(userId)
}

function handleRowKeydown(event: KeyboardEvent, userId: string) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    emit("goToUser", userId)
  }
}
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-12 cursor-pointer" @click.stop="emit('toggleSelectAll')">
          <Checkbox
            :model-value="selectAllState"
            class="pointer-events-none"
          />
        </TableHead>
        <TableHead>{{ t("adminUsers.management.table.columns.username") }}</TableHead>
        <TableHead class="hidden md:table-cell">{{ t("adminUsers.management.table.columns.email") }}</TableHead>
        <TableHead>{{ t("adminUsers.management.table.columns.role") }}</TableHead>
        <TableHead>{{ t("adminUsers.management.table.columns.allowCN") }}</TableHead>
        <TableHead>{{ t("adminUsers.management.table.columns.status") }}</TableHead>
        <TableHead class="hidden lg:table-cell">{{ t("adminUsers.management.table.columns.createdAt") }}</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <!-- Loading: skeleton rows keep the table footprint stable -->
      <template v-if="loading">
        <TableRow v-for="i in 5" :key="`skeleton-${i}`" class="hover:bg-transparent">
          <TableCell><Skeleton class="h-4 w-4 rounded" /></TableCell>
          <TableCell><Skeleton class="h-4 w-24" /></TableCell>
          <TableCell class="hidden md:table-cell"><Skeleton class="h-4 w-40" /></TableCell>
          <TableCell><Skeleton class="h-5 w-20 rounded-full" /></TableCell>
          <TableCell><Skeleton class="h-5 w-16 rounded-full" /></TableCell>
          <TableCell><Skeleton class="h-5 w-16 rounded-full" /></TableCell>
          <TableCell class="hidden lg:table-cell"><Skeleton class="h-4 w-20" /></TableCell>
        </TableRow>
      </template>
      <template v-else>
        <TableRow
          v-for="user in users"
          :key="user.userId"
          class="cursor-pointer hover:bg-muted/50 transition-colors"
          role="button"
          tabindex="0"
          @click="emit('goToUser', user.userId)"
          @keydown="handleRowKeydown($event, user.userId)"
        >
          <TableCell class="cursor-pointer" @click.stop="emit('toggleSelect', user.userId)">
            <Checkbox
              :model-value="isSelected(user.userId)"
              class="pointer-events-none"
            />
          </TableCell>
          <TableCell class="font-medium">{{ user.name }}</TableCell>
          <TableCell class="hidden md:table-cell text-muted-foreground">
            {{ user.email || "—" }}
          </TableCell>
          <TableCell>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                user.role === 'super_admin'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : user.role === 'admin'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
              ]"
            >
              <LucideShieldAlert v-if="user.role === 'super_admin'" class="w-3.5 h-3.5" />
              <LucideShield v-else-if="user.role === 'admin'" class="w-3.5 h-3.5" />
              <LucideUser v-else class="w-3.5 h-3.5" />
              {{ roleLabel(user.role, t) }}
            </span>
          </TableCell>
          <TableCell>
            <span
              v-if="getAllowCNMysekai(user) !== undefined"
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                getAllowCNMysekai(user)
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              ]"
            >
              <LucideCheckCircle2 v-if="getAllowCNMysekai(user)" class="w-3.5 h-3.5" />
              <LucideBan v-else class="w-3.5 h-3.5" />
              {{ getAllowCNMysekai(user) ? t("adminUsers.common.allowed") : t("adminUsers.common.denied") }}
            </span>
            <span v-else class="text-muted-foreground text-sm">—</span>
          </TableCell>
          <TableCell>
            <span
              :class="[
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                user.banned
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : user.deleted
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
              ]"
            >
              <LucideBan v-if="user.banned" class="w-3.5 h-3.5" />
              <LucideTrash2 v-else-if="user.deleted" class="w-3.5 h-3.5" />
              <LucideCheckCircle2 v-else class="w-3.5 h-3.5" />
              {{
                user.banned
                  ? t("adminUsers.status.banned")
                  : user.deleted
                    ? t("adminUsers.status.deleted")
                    : t("adminUsers.status.normal")
              }}
            </span>
          </TableCell>
          <TableCell class="hidden lg:table-cell text-muted-foreground text-sm">
            {{ formatCreatedAt(user.createdAt) }}
          </TableCell>
        </TableRow>
        <TableRow v-if="error && users.length === 0" class="hover:bg-transparent">
          <TableCell :colspan="7" class="p-0">
            <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <LucideAlertCircle class="h-8 w-8 text-muted-foreground/60" />
              <p class="text-sm text-muted-foreground">{{ t("adminUsers.management.table.loadError") }}</p>
              <Button variant="outline" size="sm" @click="emit('retry')">
                {{ t("adminUsers.management.table.retry") }}
              </Button>
            </div>
          </TableCell>
        </TableRow>
        <TableRow v-else-if="users.length === 0" class="hover:bg-transparent">
          <TableCell :colspan="7" class="p-0">
            <div class="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <LucideUsers class="h-8 w-8 text-muted-foreground/60" />
              <p class="text-sm text-muted-foreground">{{ t("adminUsers.management.table.empty") }}</p>
            </div>
          </TableCell>
        </TableRow>
      </template>
    </TableBody>
  </Table>
</template>
