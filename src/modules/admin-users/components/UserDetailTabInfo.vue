<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {
    LucideBan,
    LucideCheckCircle2,
    LucideLoader2,
    LucideLogOut,
    LucidePencil,
    LucideRefreshCw,
    LucideShield,
    LucideShieldAlert,
    LucideShieldOff,
    LucideTrash2,
    LucideUndo2,
    LucideUser,
} from "lucide-vue-next"
import type { AdminUserDetail } from "@/types/admin"
import type { UserRole } from "@/types/common"
import { formatDateTime, isUserRole, roleLabel } from "@/modules/admin-users/constants"

/**
 * The actions this tab asks for confirmation before running. Each one rejects
 * on failure so the confirm dialog can stay open and show the error inline.
 */
export interface UserDetailInfoActions {
    ban: () => Promise<void>
    delete: () => Promise<void>
    forceLogout: () => Promise<void>
    resetPassword: () => Promise<void>
    changeRole: (role: UserRole) => Promise<void>
}

type PendingAction =
    | { kind: "ban" }
    | { kind: "delete" }
    | { kind: "forceLogout" }
    | { kind: "resetPassword" }
    | { kind: "roleChange"; role: UserRole }

const props = defineProps<{
    user: AdminUserDetail
    isSuperAdmin: boolean
    actionLoading: boolean
    busy: boolean
    actions: UserDetailInfoActions
}>()

const emit = defineEmits<{
    (e: "open-email-edit"): void
    (e: "toggle-cn-mysekai", value: boolean | "indeterminate"): void
    (e: "unban"): void
    (e: "restore"): void
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
        case "ban":
            return {
                title: t("adminUsers.detail.info.banDialogTitle"),
                description: t("adminUsers.detail.info.banDialogDescription", { name }),
                confirmLabel: t("adminUsers.common.confirm"),
                destructive: true,
                run: () => props.actions.ban(),
            }
        case "delete":
            return {
                title: t("adminUsers.detail.info.deleteDialogTitle"),
                description: t("adminUsers.detail.info.deleteDialogDescription", { name }),
                confirmLabel: t("adminUsers.detail.info.deleteDialogConfirm"),
                destructive: true,
                run: () => props.actions.delete(),
            }
        case "forceLogout":
            return {
                title: t("adminUsers.detail.info.forceLogoutDialogTitle"),
                description: t("adminUsers.detail.info.forceLogoutDialogDescription", { name }),
                confirmLabel: t("adminUsers.detail.info.forceLogoutDialogConfirm"),
                destructive: false,
                run: () => props.actions.forceLogout(),
            }
        case "resetPassword":
            return {
                title: t("adminUsers.detail.info.resetPasswordDialogTitle"),
                description: t("adminUsers.detail.info.resetPasswordDialogDescription", { name }),
                confirmLabel: t("adminUsers.detail.info.resetPasswordDialogConfirm"),
                destructive: true,
                run: () => props.actions.resetPassword(),
            }
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
        default:
            return null
    }
})
</script>

<template>
  <Card>
    <CardContent class="flex flex-col gap-6">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div class="bg-muted/30 p-4 rounded-lg border flex flex-col justify-center">
          <span class="text-muted-foreground text-xs mb-1">{{ t("adminUsers.detail.info.role") }}</span>
          <div class="font-semibold text-base flex items-center gap-1.5">
            <span :class="[
              user.userData.role === 'super_admin' ? 'text-red-500' :
              user.userData.role === 'admin' ? 'text-blue-500' :
              'text-muted-foreground'
            ]">
              <LucideShieldAlert v-if="user.userData.role === 'super_admin'" class="w-4 h-4" />
              <LucideShield v-else-if="user.userData.role === 'admin'" class="w-4 h-4" />
              <LucideUser v-else class="w-4 h-4" />
            </span>
            {{ roleLabel(user.userData.role, t) }}
          </div>
        </div>
        <div class="bg-muted/30 p-4 rounded-lg border flex flex-col justify-center">
          <span class="text-muted-foreground text-xs mb-1">{{ t("adminUsers.detail.info.accountStatus") }}</span>
          <div class="font-semibold text-base">
            <span :class="user.banned ? 'text-red-500 flex items-center gap-1.5' : 'text-green-500 flex items-center gap-1.5'">
              <LucideBan v-if="user.banned" class="w-4 h-4" />
              <LucideCheckCircle2 v-else class="w-4 h-4" />
              {{ user.banned ? t("adminUsers.status.banned") : t("adminUsers.status.normal") }}
            </span>
          </div>
        </div>
        <div class="bg-muted/30 p-4 rounded-lg border flex flex-col justify-center">
          <div class="flex items-center justify-between mb-1">
            <span class="text-muted-foreground text-xs">{{ t("adminUsers.detail.info.email") }}</span>
            <Button
              variant="ghost"
              size="sm"
              class="h-5 px-1.5 text-[10px]"
              :title="t('adminUsers.common.edit')"
              :aria-label="t('adminUsers.common.edit')"
              @click="emit('open-email-edit')"
            >
              <LucidePencil class="w-3 h-3" />
            </Button>
          </div>
          <div class="font-medium text-sm truncate" :title="user.userData.emailInfo?.email || t('adminUsers.common.unbound')">
            {{ user.userData.emailInfo?.email || t("adminUsers.common.unbound") }}
          </div>
        </div>
        <div class="bg-muted/30 p-4 rounded-lg border flex flex-col justify-center">
          <span class="text-muted-foreground text-xs mb-1">{{ t("adminUsers.detail.info.registeredAt") }}</span>
          <div class="font-medium text-sm text-muted-foreground">
            {{ user.createdAt ? formatDateTime(user.createdAt) : "—" }}
          </div>
        </div>
      </div>

      <div class="rounded-lg border divide-y">
        <div v-if="isSuperAdmin" class="flex items-center justify-between gap-4 p-4">
          <Label id="admin-user-role-label" for="admin-user-role" class="text-sm font-medium">{{ t("adminUsers.detail.info.changeRole") }}</Label>
          <Select
            id="admin-user-role"
            :key="locale"
            :model-value="user.userData.role"
            :disabled="actionLoading"
            @update:model-value="handleRoleChange"
          >
            <SelectTrigger aria-labelledby="admin-user-role-label" class="w-40">
              <SelectValue />
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
        </div>
        <div class="flex items-center justify-between gap-4 p-4">
          <Label for="allowCNMysekai" class="text-sm font-medium cursor-pointer">
            {{ t("adminUsers.detail.info.allowCNFeature") }}
          </Label>
          <Switch
            id="allowCNMysekai"
            :model-value="user.userData.allowCNMysekai ?? false"
            :disabled="busy"
            @update:model-value="emit('toggle-cn-mysekai', !!$event)"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-4 mt-2 border-t text-sm text-muted-foreground">
        <Button v-if="user.banned" variant="outline" size="sm" :disabled="actionLoading" @click="emit('unban')">
          <LucideShieldOff class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.unban") }}
        </Button>
        <Button v-else variant="destructive" size="sm" :disabled="actionLoading" @click="requestConfirm({ kind: 'ban' })">
          <LucideBan class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.ban") }}
        </Button>

        <Button variant="outline" size="sm" :disabled="actionLoading" @click="requestConfirm({ kind: 'forceLogout' })">
          <LucideLogOut class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.forceLogout") }}
        </Button>
        <Button variant="outline" size="sm" :disabled="actionLoading" @click="requestConfirm({ kind: 'resetPassword' })">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.resetPassword") }}
        </Button>

        <Button v-if="user.deleted" variant="outline" size="sm" :disabled="actionLoading" @click="emit('restore')">
          <LucideUndo2 class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.restore") }}
        </Button>
        <Button v-else variant="destructive" size="sm" :disabled="actionLoading" @click="requestConfirm({ kind: 'delete' })">
          <LucideTrash2 class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.delete") }}
        </Button>

        <LucideLoader2 v-if="actionLoading" class="w-4 h-4 animate-spin self-center" />
      </div>
    </CardContent>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmDialog?.title ?? ''"
      :description="confirmDialog?.description ?? ''"
      :confirm-label="confirmDialog?.confirmLabel"
      :destructive="confirmDialog?.destructive ?? false"
      :on-confirm="confirmDialog?.run"
    />
  </Card>
</template>
