<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import {
  LucideBan,
  LucideCopy,
  LucideKeyRound,
  LucideLoader2,
  LucideLogOut,
  LucidePencil,
  LucideShieldOff,
  LucideTrash2,
  LucideUndo2,
} from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { copyTextToClipboard } from "@/lib/clipboard"
import type { AdminUserDetail } from "@/types/admin"
import { formatDateTime } from "@/modules/admin-users/constants"
import { avatarInitial } from "@/modules/admin-users/lib/user-display"
import { visibleBanReason } from "@/modules/admin-users/lib/soft-delete"
import UserChip from "./UserChip.vue"
import UserRoleChip from "./UserRoleChip.vue"
import UserStatusChip from "./UserStatusChip.vue"

/**
 * The actions the header asks for confirmation before running. Each one
 * rejects on failure so the confirm dialog can stay open and show the error
 * inline.
 */
export interface UserDetailHeaderActions {
  ban: () => Promise<void>
  delete: (confirmUserId: string) => Promise<void>
  forceLogout: () => Promise<void>
  resetPassword: () => Promise<void>
}

type PendingAction = "ban" | "delete" | "forceLogout" | "resetPassword"

/**
 * Who this page is about: avatar, name, role and status, the account-level
 * actions, and the key facts (ID, email, sign-up time, ban reason) as a
 * label-over-value strip along the bottom.
 */
const props = defineProps<{
  user: AdminUserDetail
  actionLoading: boolean
  actions: UserDetailHeaderActions
}>()

const emit = defineEmits<{
  (e: "open-email-edit"): void
  (e: "unban"): void
  (e: "restore"): void
}>()

const { t } = useI18n()

const confirmOpen = ref(false)
const deleteConfirmation = ref("")
// Kept after the dialog closes so its text does not change mid fade-out.
const pending = ref<PendingAction | null>(null)

function requestConfirm(action: PendingAction) {
  pending.value = action
  deleteConfirmation.value = ""
  confirmOpen.value = true
}

const confirmDialog = computed(() => {
  const name = props.user.userData.name
  switch (pending.value) {
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
        description: t("adminUsers.detail.info.deleteDialogDescription", { name, userId: props.user.userData.userId }),
        confirmLabel: t("adminUsers.detail.info.deleteDialogConfirm"),
        destructive: true,
        run: () => {
          if (deleteConfirmation.value.trim() !== props.user.userData.userId) {
            throw new Error(t("adminUsers.detail.info.deleteConfirmationMismatch"))
          }
          return props.actions.delete(deleteConfirmation.value.trim())
        },
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
    default:
      return null
  }
})

const email = computed(() => props.user.userData.emailInfo?.email || "")
const banReason = computed(() => visibleBanReason(props.user))

async function copyUserId() {
  if (await copyTextToClipboard(props.user.userData.userId)) {
    toast.success(t("adminUsers.common.idCopied"))
  } else {
    toast.error(t("adminUsers.common.copyFailed"))
  }
}
</script>

<template>
  <section class="@container overflow-hidden rounded-xl border bg-card" data-testid="admin-user-header">
    <div class="flex flex-col gap-3 px-4 py-4 @min-[52rem]:flex-row @min-[52rem]:items-center @min-[52rem]:justify-between">
      <div class="flex min-w-0 items-center gap-3">
        <Avatar class="size-14 border">
          <AvatarImage v-if="user.userData.avatarPath" :src="user.userData.avatarPath" :alt="user.userData.name" />
          <AvatarFallback class="text-lg font-semibold text-muted-foreground">
            {{ avatarInitial(user.userData.name) }}
          </AvatarFallback>
        </Avatar>
        <div class="flex min-w-0 flex-col gap-1.5">
          <h2 class="min-w-0 text-lg leading-tight font-semibold [overflow-wrap:anywhere]">{{ user.userData.name }}</h2>
          <div class="flex flex-wrap items-center gap-1.5">
            <UserRoleChip :role="user.userData.role" />
            <UserStatusChip :banned="user.banned" :deleted="user.deleted" />
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 @min-[52rem]:shrink-0 @min-[52rem]:justify-end">
        <LucideLoader2 v-if="actionLoading" class="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
        <Button v-if="user.banned" variant="outline" size="sm" :disabled="actionLoading" @click="emit('unban')">
          <LucideShieldOff class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.info.unban") }}
        </Button>
        <Button
          v-else
          variant="outline"
          size="sm"
          class="text-destructive hover:text-destructive"
          :disabled="actionLoading"
          @click="requestConfirm('ban')"
        >
          <LucideBan class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.info.ban") }}
        </Button>
        <Button variant="outline" size="sm" :disabled="actionLoading" @click="requestConfirm('forceLogout')">
          <LucideLogOut class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.info.forceLogout") }}
        </Button>
        <Button variant="outline" size="sm" :disabled="actionLoading" @click="requestConfirm('resetPassword')">
          <LucideKeyRound class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.info.resetPassword") }}
        </Button>
        <Button v-if="user.deleted" variant="outline" size="sm" :disabled="actionLoading" @click="emit('restore')">
          <LucideUndo2 class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.info.restore") }}
        </Button>
        <Button variant="destructive" size="sm" :disabled="actionLoading" @click="requestConfirm('delete')">
          <LucideTrash2 class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.info.delete") }}
        </Button>
      </div>
    </div>

    <!-- The gaps show the border colour through, as in the stat grid. -->
    <dl class="grid grid-cols-1 gap-px border-t border-border/60 bg-border/60 @min-[30rem]:grid-cols-2 @min-[52rem]:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]">
      <div class="min-w-0 bg-card px-4 py-2.5">
        <dt class="text-xs text-muted-foreground">{{ t("adminUsers.detail.header.userId") }}</dt>
        <dd class="mt-0.5 flex min-w-0 items-center gap-1">
          <span class="min-w-0 font-mono text-sm tabular-nums [overflow-wrap:anywhere]">{{ user.userData.userId }}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="-my-1 size-7 shrink-0 text-muted-foreground pointer-coarse:size-10"
            :title="t('adminUsers.common.copyId')"
            :aria-label="t('adminUsers.common.copyId')"
            @click="copyUserId"
          >
            <LucideCopy class="size-3.5" aria-hidden="true" />
          </Button>
        </dd>
      </div>

      <div class="min-w-0 bg-card px-4 py-2.5">
        <dt class="text-xs text-muted-foreground">{{ t("adminUsers.detail.info.email") }}</dt>
        <dd class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <span :class="['min-w-0 text-sm [overflow-wrap:anywhere]', email ? '' : 'text-muted-foreground']">
            {{ email || t("adminUsers.common.unbound") }}
          </span>
          <UserChip v-if="email" :tone="user.userData.emailInfo?.verified ? 'success' : 'warning'">
            {{ user.userData.emailInfo?.verified ? t("adminUsers.common.verified") : t("adminUsers.common.unverified") }}
          </UserChip>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="-my-1 size-7 shrink-0 text-muted-foreground pointer-coarse:size-10"
            :title="t('adminUsers.detail.dialog.email.title')"
            :aria-label="t('adminUsers.detail.dialog.email.title')"
            @click="emit('open-email-edit')"
          >
            <LucidePencil class="size-3.5" aria-hidden="true" />
          </Button>
        </dd>
      </div>

      <div class="min-w-0 bg-card px-4 py-2.5 @min-[30rem]:@max-[52rem]:col-span-2">
        <dt class="text-xs text-muted-foreground">{{ t("adminUsers.detail.info.registeredAt") }}</dt>
        <dd class="mt-0.5 text-sm tabular-nums">{{ user.createdAt ? formatDateTime(user.createdAt) : "—" }}</dd>
      </div>

      <div v-if="banReason" class="col-span-full min-w-0 bg-card px-4 py-2.5" data-testid="admin-user-ban-reason">
        <dt class="text-xs text-muted-foreground">{{ t("adminUsers.detail.header.banReason") }}</dt>
        <dd class="mt-0.5 text-sm whitespace-pre-wrap [overflow-wrap:anywhere]">{{ banReason }}</dd>
      </div>
    </dl>

    <ConfirmDialog
      v-model:open="confirmOpen"
      :title="confirmDialog?.title ?? ''"
      :description="confirmDialog?.description ?? ''"
      :confirm-label="confirmDialog?.confirmLabel"
      :destructive="confirmDialog?.destructive ?? false"
      :on-confirm="confirmDialog?.run"
      :confirm-disabled="pending === 'delete' && deleteConfirmation.trim() !== user.userData.userId"
    >
      <div v-if="pending === 'delete'" class="flex flex-col gap-1.5">
        <Label for="admin-delete-user-confirmation">
          {{ t("adminUsers.detail.info.deleteConfirmationLabel", { userId: user.userData.userId }) }}
        </Label>
        <Input id="admin-delete-user-confirmation" v-model="deleteConfirmation" autocomplete="off" class="font-mono" />
      </div>
    </ConfirmDialog>
  </section>
</template>
