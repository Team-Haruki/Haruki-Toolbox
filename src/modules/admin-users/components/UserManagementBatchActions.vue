<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideBan,
  LucideCheckCircle2,
  LucideLoader2,
  LucideLogOut,
  LucideSettings2,
  LucideShield,
  LucideShieldAlert,
  LucideShieldOff,
  LucideUser,
  LucideUserCog,
} from "lucide-vue-next"
import { roleLabel } from "@/modules/admin-users/constants"
import type { UserRole } from "@/types/common"

/**
 * `ban`, `forceLogout` and `setRole` run from a ConfirmDialog and reject on
 * failure so it can stay open with the error; `unban` and `setAllowCN` run
 * directly and report failures themselves.
 */
export interface UserBatchActions {
  ban: () => Promise<void>
  unban: () => Promise<void>
  forceLogout: () => Promise<void>
  setRole: () => Promise<void>
  setAllowCN: () => Promise<void>
}

type PendingAction = "ban" | "forceLogout" | "setRole"

const props = defineProps<{
  selectedCount: number
  batchLoading: boolean
  isSuperAdmin: boolean
  batchRoleTarget: UserRole
  batchAllowCnTarget: "true" | "false"
  actions: UserBatchActions
}>()

const emit = defineEmits<{
  (e: "update:batchRoleTarget", value: UserRole): void
  (e: "update:batchAllowCnTarget", value: "true" | "false"): void
}>()

const { t, locale } = useI18n()

const allowCNOpen = ref(false)
const roleOpen = ref(false)
const confirmOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const pending = ref<PendingAction | null>(null)

function requestConfirm(action: PendingAction) {
  pending.value = action
  confirmOpen.value = true
}

function requestRoleConfirm() {
  roleOpen.value = false
  requestConfirm("setRole")
}

function confirmAllowCN() {
  allowCNOpen.value = false
  void props.actions.setAllowCN()
}

const confirmDialog = computed(() => {
  const count = props.selectedCount
  switch (pending.value) {
    case "ban":
      return {
        title: t("adminUsers.management.batch.banDialogTitle"),
        description: t("adminUsers.management.batch.banDialogDescription", { count }),
        confirmLabel: t("adminUsers.management.batch.banDialogConfirm"),
        destructive: true,
        run: () => props.actions.ban(),
      }
    case "forceLogout":
      return {
        title: t("adminUsers.management.batch.forceLogoutDialogTitle"),
        description: t("adminUsers.management.batch.forceLogoutDialogDescription", { count }),
        confirmLabel: t("adminUsers.management.batch.forceLogoutDialogConfirm"),
        destructive: false,
        run: () => props.actions.forceLogout(),
      }
    case "setRole":
      return {
        title: t("adminUsers.management.batch.roleDialogTitle"),
        description: t("adminUsers.management.batch.roleDialogDescription", {
          count,
          role: roleLabel(props.batchRoleTarget, t),
        }),
        confirmLabel: t("adminUsers.management.batch.roleDialogConfirm"),
        destructive: false,
        run: () => props.actions.setRole(),
      }
    default:
      return null
  }
})
</script>

<template>
  <!-- Always rendered: the grid-rows trick animates the reveal so the layout
       never jumps when a selection appears or is cleared. -->
  <div
    class="grid transition-[grid-template-rows] duration-300 ease-in-out"
    :class="selectedCount > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    :inert="selectedCount === 0"
    :aria-hidden="selectedCount === 0 || undefined"
  >
    <div class="min-h-0 overflow-hidden">
      <div class="flex items-center gap-2 flex-wrap border-b bg-muted/40 px-4 py-3 sm:px-6">
        <span class="text-sm text-muted-foreground mr-2">
          {{ t("adminUsers.management.batch.selectedCount", { count: selectedCount }) }}
        </span>

        <Button variant="destructive" size="sm" :disabled="batchLoading" @click="requestConfirm('ban')">
          <LucideBan class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.banButton") }}
        </Button>

        <Button variant="outline" size="sm" :disabled="batchLoading" @click="actions.unban()">
          <LucideShieldOff class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.unbanButton") }}
        </Button>

        <Button variant="outline" size="sm" :disabled="batchLoading" @click="requestConfirm('forceLogout')">
          <LucideLogOut class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.forceLogoutButton") }}
        </Button>

        <Popover v-if="isSuperAdmin" v-model:open="roleOpen">
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" :disabled="batchLoading">
              <LucideUserCog class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.roleButton") }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-64 p-4">
            <div class="space-y-4">
              <h4 class="font-medium leading-none mb-3">{{ t("adminUsers.management.batch.roleTitle") }}</h4>
              <Label id="batch-user-role-label" for="batch-user-role" class="sr-only">
                {{ t("adminUsers.management.batch.roleTitle") }}
              </Label>
              <Select id="batch-user-role" :key="locale"
                :model-value="batchRoleTarget"
                @update:model-value="emit('update:batchRoleTarget', $event as UserRole)"
              >
                <SelectTrigger aria-labelledby="batch-user-role-label">
                  <SelectValue :placeholder="t('adminUsers.management.batch.rolePlaceholder')" />
                </SelectTrigger>
                <SelectContent>
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
              <div class="flex justify-end gap-2 mt-4">
                <Button size="sm" @click="requestRoleConfirm">{{ t("adminUsers.management.batch.roleConfirm") }}</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Popover v-model:open="allowCNOpen">
          <PopoverTrigger as-child>
            <Button variant="outline" size="sm" :disabled="batchLoading">
              <LucideSettings2 class="w-4 h-4 mr-1" />{{ t("adminUsers.management.batch.allowCNButton") }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-64 p-4">
            <div class="space-y-4">
              <h4 class="font-medium leading-none mb-3">{{ t("adminUsers.management.batch.allowCNTitle") }}</h4>
              <Label id="batch-user-cn-label" for="batch-user-cn" class="sr-only">
                {{ t("adminUsers.management.batch.allowCNTitle") }}
              </Label>
              <Select id="batch-user-cn" :key="locale"
                :model-value="batchAllowCnTarget"
                @update:model-value="emit('update:batchAllowCnTarget', $event as 'true' | 'false')"
              >
                <SelectTrigger aria-labelledby="batch-user-cn-label">
                  <SelectValue :placeholder="t('adminUsers.management.batch.allowCNPlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">
                    <div class="flex items-center gap-2">
                      <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
                      {{ t("adminUsers.management.batch.allowCNEnable") }}
                    </div>
                  </SelectItem>
                  <SelectItem value="false">
                    <div class="flex items-center gap-2">
                      <LucideBan class="w-4 h-4 text-red-500" />
                      {{ t("adminUsers.management.batch.allowCNDisable") }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <div class="flex justify-end gap-2 mt-4">
                <Button size="sm" @click="confirmAllowCN">{{ t("adminUsers.management.batch.allowCNConfirm") }}</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <LucideLoader2 v-if="batchLoading" class="w-4 h-4 animate-spin" />
      </div>
    </div>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmDialog?.title ?? ''"
      :description="confirmDialog?.description ?? ''"
      :confirm-label="confirmDialog?.confirmLabel"
      :destructive="confirmDialog?.destructive ?? false"
      :on-confirm="confirmDialog?.run"
    />
  </div>
</template>
