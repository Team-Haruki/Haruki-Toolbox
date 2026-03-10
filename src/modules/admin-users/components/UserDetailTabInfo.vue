<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { isUserRole, roleLabel } from "@/modules/admin-users/constants"

defineProps<{
    user: AdminUserDetail
    isSuperAdmin: boolean
    actionLoading: boolean
}>()

const emit = defineEmits<{
    (e: "open-email-edit"): void
    (e: "role-change", role: UserRole): void
    (e: "toggle-cn-mysekai", value: boolean | "indeterminate"): void
    (e: "unban"): void
    (e: "ban"): void
    (e: "force-logout"): void
    (e: "reset-password"): void
    (e: "restore"): void
    (e: "delete"): void
}>()

const { t } = useI18n()

function handleRoleChange(value: unknown) {
    if (!isUserRole(value)) return
    emit("role-change", value)
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>{{ user.userData.name }}</CardTitle>
      <CardDescription>ID: {{ user.userData.userId }}</CardDescription>
    </CardHeader>
    <CardContent class="flex flex-col gap-6">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
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
        <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
          <span class="text-muted-foreground text-xs mb-1">{{ t("adminUsers.detail.info.accountStatus") }}</span>
          <div class="font-semibold text-base">
            <span :class="user.banned ? 'text-red-500 flex items-center gap-1.5' : 'text-green-500 flex items-center gap-1.5'">
              <LucideBan v-if="user.banned" class="w-4 h-4" />
              <LucideCheckCircle2 v-else class="w-4 h-4" />
              {{ user.banned ? t("adminUsers.status.banned") : t("adminUsers.status.normal") }}
            </span>
          </div>
        </div>
        <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
          <div class="flex items-center justify-between mb-1">
            <span class="text-muted-foreground text-xs">{{ t("adminUsers.detail.info.email") }}</span>
            <Button variant="ghost" size="sm" class="h-5 px-1.5 text-[10px]" @click="emit('open-email-edit')">
              <LucidePencil class="w-3 h-3" />
            </Button>
          </div>
          <div class="font-medium text-sm truncate" :title="user.userData.emailInfo?.email || t('adminUsers.common.unbound')">
            {{ user.userData.emailInfo?.email || t("adminUsers.common.unbound") }}
          </div>
        </div>
        <div class="bg-muted/30 p-4 rounded-xl border flex flex-col justify-center">
          <span class="text-muted-foreground text-xs mb-1">{{ t("adminUsers.detail.info.registeredAt") }}</span>
          <div class="font-medium text-sm text-muted-foreground">{{ t("adminUsers.detail.info.comingSoon") }}</div>
        </div>
      </div>

      <div v-if="isSuperAdmin" class="flex items-center gap-3">
        <Label>{{ t("adminUsers.detail.info.changeRole") }}</Label>
        <Select :model-value="user.userData.role" @update:model-value="handleRoleChange">
          <SelectTrigger class="w-40">
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

      <div class="flex items-center gap-3 bg-muted/20 p-3 rounded-lg border w-fit">
        <Checkbox
          id="allowCNMysekai"
          :model-value="user.userData.allowCNMysekai ?? false"
          @update:model-value="emit('toggle-cn-mysekai', $event)"
        />
        <Label for="allowCNMysekai" class="text-sm font-medium cursor-pointer">
          {{ t("adminUsers.detail.info.allowCNFeature") }}
        </Label>
      </div>

      <div class="flex flex-wrap items-center gap-2 pt-4 mt-2 border-t text-sm text-muted-foreground">
        <template v-if="user.banned">
          <Button variant="outline" size="sm" :disabled="actionLoading" @click="emit('unban')">
            <LucideShieldOff class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.unban") }}
          </Button>
        </template>
        <template v-else>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm" :disabled="actionLoading">
                <LucideBan class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.ban") }}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ t("adminUsers.detail.info.banDialogTitle") }}</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ t("adminUsers.detail.info.banDialogDescription", { name: user.userData.name }) }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
                <AlertDialogAction @click="emit('ban')">{{ t("adminUsers.common.confirm") }}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </template>

        <Button variant="outline" size="sm" :disabled="actionLoading" @click="emit('force-logout')">
          <LucideLogOut class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.forceLogout") }}
        </Button>
        <Button variant="outline" size="sm" :disabled="actionLoading" @click="emit('reset-password')">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.resetPassword") }}
        </Button>

        <template v-if="user.deleted">
          <Button variant="outline" size="sm" :disabled="actionLoading" @click="emit('restore')">
            <LucideUndo2 class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.restore") }}
          </Button>
        </template>
        <template v-else>
          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm" :disabled="actionLoading">
                <LucideTrash2 class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.info.delete") }}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ t("adminUsers.detail.info.deleteDialogTitle") }}</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ t("adminUsers.detail.info.deleteDialogDescription", { name: user.userData.name }) }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ t("adminUsers.common.cancel") }}</AlertDialogCancel>
                <AlertDialogAction @click="emit('delete')">{{ t("adminUsers.detail.info.deleteDialogConfirm") }}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </template>

        <LucideLoader2 v-if="actionLoading" class="w-4 h-4 animate-spin self-center" />
      </div>
    </CardContent>
  </Card>
</template>
