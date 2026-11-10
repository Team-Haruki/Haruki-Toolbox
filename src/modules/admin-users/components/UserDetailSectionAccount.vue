<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArmchair, LucideQrCode, LucideRefreshCw, LucideShieldCheck, LucideTrash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { AdminUserDetail } from "@/types/admin"
import type { UserRole } from "@/types/common"
import { isUserRole, roleLabel } from "@/modules/admin-users/constants"
import UserRoleSelectItems from "./UserRoleSelectItems.vue"

/**
 * The confirmed actions of this block. Each one rejects on failure so the
 * confirm dialog can stay open and show the error inline. `regenerateIOS`
 * also serves the first "generate" (no code yet), which runs without
 * confirmation and reports failures itself.
 */
export interface UserDetailAccountActions {
  changeRole: (role: UserRole) => Promise<void>
  regenerateIOS: () => Promise<void>
  deleteIOS: () => Promise<void>
}

type PendingAction =
  | { kind: "roleChange"; role: UserRole }
  | { kind: "regenerateIOS" }
  | { kind: "deleteIOS" }

/**
 * The switches an admin sets on the account itself: its role (super admins
 * only), the CN MySekai permission and the iOS upload code.
 */
const props = defineProps<{
  user: AdminUserDetail
  isSuperAdmin: boolean
  /** An account-level action (ban, role change, …) is running. */
  actionLoading: boolean
  /** A smaller task (permission toggle, upload code) is running. */
  busy: boolean
  uploadCode: string | null
  actions: UserDetailAccountActions
}>()

const emit = defineEmits<{
  (e: "toggle-cn-mysekai", value: boolean | "indeterminate"): void
}>()

const { t, locale } = useI18n()

const confirmOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const pending = ref<PendingAction | null>(null)

function requestConfirm(action: PendingAction) {
  pending.value = action
  confirmOpen.value = true
}

function handleRoleChange(value: unknown) {
  if (!isUserRole(value) || value === props.user.userData.role) return
  requestConfirm({ kind: "roleChange", role: value })
}

const confirmDialog = computed(() => {
  const action = pending.value
  const name = props.user.userData.name
  switch (action?.kind) {
    case "roleChange": {
      const role = action.role
      return {
        title: t("adminUsers.detail.info.roleDialogTitle"),
        description: t("adminUsers.detail.info.roleDialogDescription", { name, role: roleLabel(role, t) }),
        confirmLabel: t("adminUsers.detail.info.roleDialogConfirm"),
        destructive: false,
        run: () => props.actions.changeRole(role),
      }
    }
    case "regenerateIOS":
      return {
        title: t("adminUsers.detail.ios.regenerateDialogTitle"),
        description: t("adminUsers.detail.ios.regenerateDialogDescription", { name }),
        confirmLabel: t("adminUsers.detail.ios.regenerateDialogConfirm"),
        destructive: false,
        run: () => props.actions.regenerateIOS(),
      }
    case "deleteIOS":
      return {
        title: t("adminUsers.detail.ios.deleteDialogTitle"),
        description: t("adminUsers.detail.ios.deleteDialogDescription"),
        confirmLabel: t("adminUsers.common.confirm"),
        destructive: true,
        run: () => props.actions.deleteIOS(),
      }
    default:
      return null
  }
})

const allowCN = computed(() => props.user.userData.allowCNMysekai ?? false)
</script>

<template>
  <AdminPanel :title="t('adminUsers.detail.account.title')" flush data-testid="admin-user-account">
    <div class="@container divide-y divide-border/60">
      <SettingsRow
        v-if="isSuperAdmin"
        :icon="LucideShieldCheck"
        :label="t('adminUsers.detail.info.role')"
        :help="t('adminUsers.detail.account.roleHelp')"
        label-for="admin-user-role"
        label-id="admin-user-role-label"
      >
        <Select
          id="admin-user-role"
          :aria-label="t('adminUsers.detail.info.role')"
          :key="locale"
          :model-value="user.userData.role"
          :disabled="actionLoading"
          @update:model-value="handleRoleChange"
        >
          <SelectTrigger aria-labelledby="admin-user-role-label" class="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <UserRoleSelectItems />
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        :icon="LucideArmchair"
        :tone="allowCN ? 'success' : 'default'"
        :label="t('adminUsers.detail.info.allowCNFeature')"
        label-for="allowCNMysekai"
      >
        <Switch
          id="allowCNMysekai"
          :model-value="allowCN"
          :disabled="busy"
          @update:model-value="emit('toggle-cn-mysekai', !!$event)"
        />
      </SettingsRow>

      <SettingsRow
        :icon="LucideQrCode"
        :label="t('adminUsers.detail.ios.title')"
        :help="uploadCode ? t('adminUsers.detail.account.iosHelp') : t('adminUsers.detail.ios.empty')"
      >
        <template v-if="uploadCode">
          <code class="max-w-full rounded bg-muted px-2 py-1 font-mono text-sm tabular-nums [overflow-wrap:anywhere]" data-testid="admin-user-ios-code">{{ uploadCode }}</code>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground pointer-coarse:size-10"
            :disabled="busy"
            :title="t('adminUsers.detail.ios.regenerate')"
            :aria-label="t('adminUsers.detail.ios.regenerate')"
            @click="requestConfirm({ kind: 'regenerateIOS' })"
          >
            <LucideRefreshCw class="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
            :disabled="busy"
            :title="t('adminUsers.detail.ios.delete')"
            :aria-label="t('adminUsers.detail.ios.delete')"
            @click="requestConfirm({ kind: 'deleteIOS' })"
          >
            <LucideTrash2 class="size-4" aria-hidden="true" />
          </Button>
        </template>
        <Button v-else variant="outline" size="sm" :disabled="busy" @click="actions.regenerateIOS()">
          <LucideRefreshCw class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.ios.generate") }}
        </Button>
      </SettingsRow>
    </div>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmDialog?.title ?? ''"
      :description="confirmDialog?.description ?? ''"
      :confirm-label="confirmDialog?.confirmLabel"
      :destructive="confirmDialog?.destructive ?? false"
      :on-confirm="confirmDialog?.run"
    />
  </AdminPanel>
</template>
