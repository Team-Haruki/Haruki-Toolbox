<script setup lang="ts">
import { ref } from "vue"
import { RouterLink } from "vue-router"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  LucideArrowRightLeft,
  LucideBadgeCheck,
  LucideGlobe,
  LucideMoreHorizontal,
  LucidePencil,
  LucideShieldQuestion,
  LucideTrash2,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import AdminPagination from "@/modules/admin/components/AdminPagination.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"
import GameBindingServerBadge from "@/modules/admin-game-bindings/components/GameBindingServerBadge.vue"
import { countSharing, hasPublicApiSharing } from "@/modules/admin-game-bindings/lib/binding-stats"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN } from "@/lib/number-format"

/**
 * The bindings as dense rows: the account (server tile and UID), its owner,
 * whether it is verified and how much it shares. The columns follow the
 * panel's own width; on a phone the account cell carries the rest.
 */
interface Props {
  loading: boolean
  error: ErrorDescription | null
  bindings: GlobalGameBinding[]
  selected: Set<string>
  selectAll: boolean
  total: number
  page: number
  pageSize: number
  totalPages: number
  actionLoading: boolean
  bindingKey: (binding: GlobalGameBinding) => string
  serverLabel: (server: string) => string
  /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
  batchDelete: () => Promise<void>
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "toggle-select", key: string): void
  (event: "toggle-select-all"): void
  (event: "open-edit", binding: GlobalGameBinding): void
  (event: "open-reassign", binding: GlobalGameBinding): void
  (event: "open-delete", binding: GlobalGameBinding): void
  (event: "retry"): void
  (event: "prev-page"): void
  (event: "next-page"): void
  (event: "go-to-page", page: number): void
  (event: "update:pageSize", pageSize: number): void
}>()

const batchConfirmOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const batchCount = ref(0)

function requestBatchDelete() {
  batchCount.value = props.selected.size
  batchConfirmOpen.value = true
}

function isSelected(binding: GlobalGameBinding): boolean {
  return props.selected.has(props.bindingKey(binding))
}

/** "Suite 3/5 · MySekai 1/5"; an upload without settings is left out. */
function sharingText(binding: GlobalGameBinding): string {
  const suite = countSharing(binding.suite)
  const mysekai = countSharing(binding.mysekai)
  return [
    suite ? t("adminGameBindings.table.sharing.suite", { on: suite.on, total: suite.total }) : null,
    mysekai ? t("adminGameBindings.table.sharing.mysekai", { on: mysekai.on, total: mysekai.total }) : null,
  ].filter((part) => part !== null).join(" · ")
}

/** Staff owners are marked: an admin's binding is not handled like a player's. */
function roleLabel(role: string | undefined): string | null {
  if (role === "admin") return t("adminGameBindings.table.role.admin")
  if (role === "super_admin") return t("adminGameBindings.table.role.superAdmin")
  return null
}

const HEAD = "px-3 py-2 text-left text-xs font-medium text-muted-foreground"
const CELL = "px-3 py-2 align-top"
const CHIP = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium"
const VERIFIED_CHIP = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
const UNVERIFIED_CHIP = "bg-amber-500/15 text-amber-800 dark:text-amber-300"
</script>

<template>
  <AdminPanel :title="t('adminGameBindings.table.title')" flush>
    <template #actions>
      <span
        v-if="props.selected.size > 0"
        class="text-xs tabular-nums text-muted-foreground"
        role="status"
      >
        {{ t("adminGameBindings.table.selectedCount", { count: props.selected.size }) }}
      </span>
      <Button
        variant="destructive"
        size="sm"
        class="h-8 pointer-coarse:h-10"
        :disabled="props.selected.size === 0 || props.actionLoading"
        @click="requestBatchDelete"
      >
        <LucideTrash2 class="size-4" aria-hidden="true" />
        {{ t("adminGameBindings.table.batchUnbind") }}
      </Button>
    </template>

    <div class="@container">
      <div v-if="props.loading" class="flex flex-col divide-y divide-border/60" aria-busy="true">
        <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-2.5">
          <Skeleton class="size-4 rounded" />
          <Skeleton class="size-6 rounded" />
          <Skeleton class="h-4 flex-1" />
          <Skeleton class="h-5 w-16 rounded-full" />
        </div>
      </div>
      <LoadErrorState
        v-else-if="props.error"
        :title="t('adminGameBindings.toast.loadFailedTitle')"
        :description="props.error.message"
        :detail="props.error.detail"
        :retrying="props.loading"
        @retry="emit('retry')"
      />
      <EmptyState v-else-if="props.bindings.length === 0" :title="t('adminGameBindings.table.empty')" />
      <table v-else class="w-full table-fixed border-collapse text-sm">
        <!-- Column widths live here, not on the cells: a hidden column drops out together with its cells. -->
        <colgroup>
          <col class="w-10">
          <col>
          <col class="hidden w-64 @min-[40rem]:table-column">
          <col class="hidden w-24 @min-[32rem]:table-column">
          <col class="hidden w-44 @min-[52rem]:table-column">
          <col class="w-12">
        </colgroup>
        <thead>
          <tr class="border-b border-border/60">
            <th scope="col" :class="[HEAD, 'pl-4 pr-0']">
              <Checkbox
                :model-value="props.selectAll"
                :aria-label="t('adminGameBindings.table.selectAll')"
                @update:model-value="emit('toggle-select-all')"
              />
            </th>
            <th scope="col" :class="HEAD">{{ t("adminGameBindings.table.columns.account") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[40rem]:table-cell']">{{ t("adminGameBindings.table.columns.user") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[32rem]:table-cell']">{{ t("adminGameBindings.table.columns.verified") }}</th>
            <th scope="col" :class="[HEAD, 'hidden @min-[52rem]:table-cell']">{{ t("adminGameBindings.table.columns.sharing") }}</th>
            <th scope="col" :class="[HEAD, 'pr-3']">
              <span class="sr-only">{{ t("adminGameBindings.table.columns.actions") }}</span>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          <tr
            v-for="binding in props.bindings"
            :key="props.bindingKey(binding)"
            :data-binding="props.bindingKey(binding)"
            :data-state="isSelected(binding) ? 'selected' : undefined"
            class="transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5"
          >
            <td :class="[CELL, 'pl-4 pr-0']">
              <span class="flex h-6 items-center">
                <Checkbox
                  :model-value="isSelected(binding)"
                  :aria-label="t('adminGameBindings.table.selectRowOf', { gameUserId: binding.gameUserId })"
                  @update:model-value="emit('toggle-select', props.bindingKey(binding))"
                />
              </span>
            </td>
            <td :class="CELL">
              <div class="flex min-w-0 flex-col gap-1">
                <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <GameBindingServerBadge :server="binding.server" :label="props.serverLabel(binding.server)" />
                  <span class="min-w-0 font-mono text-[13px] font-medium tabular-nums [overflow-wrap:anywhere]">{{ binding.gameUserId }}</span>
                </div>
                <!-- What the hidden columns would say, while the panel is narrow. -->
                <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground @min-[52rem]:hidden">
                  <span :class="[CHIP, binding.verified ? VERIFIED_CHIP : UNVERIFIED_CHIP, '@min-[32rem]:hidden']">
                    <component :is="binding.verified ? LucideBadgeCheck : LucideShieldQuestion" class="size-3" aria-hidden="true" />
                    {{ binding.verified ? t("adminGameBindings.status.verified") : t("adminGameBindings.status.unverified") }}
                  </span>
                  <span class="min-w-0 [overflow-wrap:anywhere] @min-[40rem]:hidden">{{ binding.userName || binding.userId }}</span>
                  <span v-if="sharingText(binding)" class="tabular-nums">{{ sharingText(binding) }}</span>
                  <span v-if="hasPublicApiSharing(binding)" class="inline-flex items-center gap-1 text-destructive-tint-foreground">
                    <LucideGlobe class="size-3" aria-hidden="true" />
                    {{ t("adminGameBindings.table.sharing.publicApi") }}
                  </span>
                </div>
              </div>
            </td>
            <td :class="[CELL, 'hidden @min-[40rem]:table-cell']">
              <div class="flex min-w-0 flex-col">
                <div class="flex min-w-0 items-center gap-1.5">
                  <RouterLink
                    :to="{ name: 'admin.userDetail', params: { userId: binding.userId } }"
                    class="min-w-0 truncate font-medium underline-offset-4 hover:underline"
                    :title="binding.userName || String(binding.userId)"
                  >
                    {{ binding.userName || binding.userId }}
                  </RouterLink>
                  <span
                    v-if="roleLabel(binding.ownerRole)"
                    class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                  >
                    {{ roleLabel(binding.ownerRole) }}
                  </span>
                </div>
                <span class="truncate text-xs tabular-nums text-muted-foreground" :title="binding.ownerEmail">
                  <template v-if="binding.userName">ID {{ binding.userId }}</template>
                  <template v-if="binding.userName && binding.ownerEmail"> · </template>
                  <template v-if="binding.ownerEmail">{{ binding.ownerEmail }}</template>
                </span>
              </div>
            </td>
            <td :class="[CELL, 'hidden @min-[32rem]:table-cell']">
              <span :class="[CHIP, binding.verified ? VERIFIED_CHIP : UNVERIFIED_CHIP]">
                <component :is="binding.verified ? LucideBadgeCheck : LucideShieldQuestion" class="size-3" aria-hidden="true" />
                {{ binding.verified ? t("adminGameBindings.status.verified") : t("adminGameBindings.status.unverified") }}
              </span>
            </td>
            <td :class="[CELL, 'hidden @min-[52rem]:table-cell']">
              <div class="flex min-w-0 flex-col gap-0.5 text-xs tabular-nums text-muted-foreground">
                <span class="pt-0.5">{{ sharingText(binding) || t("adminGameBindings.table.sharing.none") }}</span>
                <span v-if="hasPublicApiSharing(binding)" class="inline-flex items-center gap-1 text-destructive-tint-foreground">
                  <LucideGlobe class="size-3 shrink-0" aria-hidden="true" />
                  {{ t("adminGameBindings.table.sharing.publicApi") }}
                </span>
              </div>
            </td>
            <td :class="[CELL, 'pr-3 text-right']">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-muted-foreground pointer-coarse:size-10"
                    :title="t('adminGameBindings.table.openMenu')"
                    :aria-label="t('adminGameBindings.table.openMenu')"
                  >
                    <LucideMoreHorizontal class="size-4" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{{ t("adminGameBindings.table.columns.actions") }}</DropdownMenuLabel>
                  <DropdownMenuItem @click="emit('open-edit', binding)">
                    <LucidePencil class="mr-2 size-4" aria-hidden="true" />
                    {{ t("adminGameBindings.table.menu.edit") }}
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="emit('open-reassign', binding)">
                    <LucideArrowRightLeft class="mr-2 size-4" aria-hidden="true" />
                    {{ t("adminGameBindings.table.menu.reassign") }}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive focus:text-destructive" @click="emit('open-delete', binding)">
                    <LucideTrash2 class="mr-2 size-4" aria-hidden="true" />
                    {{ t("adminGameBindings.table.menu.unbind") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template v-if="!props.error" #footer>
      <AdminPagination
        :total="props.total"
        :page="props.page"
        :page-size="props.pageSize"
        :total-pages="props.totalPages"
        :disabled="props.loading"
        :total-label="t('adminGameBindings.table.total', { total: formatNumberCN(props.total, '0') })"
        @update:page-size="emit('update:pageSize', $event)"
        @prev-page="emit('prev-page')"
        @next-page="emit('next-page')"
        @go-to-page="emit('go-to-page', $event)"
      />
    </template>

    <ConfirmDialog
      v-model:open="batchConfirmOpen"
      :title="t('adminGameBindings.table.batchDialog.title')"
      :description="t('adminGameBindings.table.batchDialog.description', { count: batchCount })"
      :cancel-label="t('adminGameBindings.table.batchDialog.cancel')"
      :confirm-label="t('adminGameBindings.table.batchDialog.confirm')"
      destructive
      :on-confirm="props.batchDelete"
    />
  </AdminPanel>
</template>
