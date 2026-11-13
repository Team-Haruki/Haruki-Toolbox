<script setup lang="ts">
import {Input} from "@/components/ui/input"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {
  Bot,
  Inbox,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Plus,
  Send,
  Trash2,
  User,
  Zap,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger
} from "@/components/ui/select";
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {
  IM_AUTH_ACCOUNT_INPUT_ID,
  useIMAuthorizationSettings,
} from "@/modules/user-settings/composables/useIMAuthorizationSettings"
import type {SocialPlatform} from "@/modules/user-settings/composables/useIMAuthorizationSettings"

const { t, locale } = useI18n()

const {
  showEditDialog,
  editTarget,
  isCreateMode,
  showDeleteDialog,
  deleteTarget,
  isSaving,
  accountError,
  tableData,
  hasVerifiedOwnBinding,
  getPlatformLabel,
  startEdit,
  startAdd,
  clearAccountError,
  handleEditSave,
  confirmDelete,
  handleDelete,
} = useIMAuthorizationSettings()

const ACCOUNT_ERROR_ID = "im-auth-account-error"

const platformIcons: Record<SocialPlatform, typeof MessageCircle> = {
  qq: MessageCircle,
  qqbot: Bot,
  discord: MessagesSquare,
  telegram: Send,
}

function getPlatformIcon(platform: SocialPlatform) {
  return platformIcons[platform] ?? MessageCircle
}
</script>

<template>
  <div>
    <SettingsGroup
      :title="tableData.length > 0 ? `${t('userSettings.imAuthorization.title')} · ${tableData.length}` : t('userSettings.imAuthorization.title')"
      surface="card"
      data-testid="im-authorizations"
    >
      <template #action>
        <Button variant="outline" size="sm" class="h-7 gap-1 px-2 text-xs" @click="startAdd">
          <Plus class="size-3.5" />
          {{ t("userSettings.imAuthorization.addButton") }}
        </Button>
      </template>

      <ul v-if="tableData.length" class="divide-y divide-border/60">
        <li
          v-for="row in tableData"
          :key="`${row.platform}:${row.userId}:${row.id}`"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
        >
          <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
            <component :is="getPlatformIcon(row.platform)" class="size-4" />
          </span>
          <div class="min-w-0 flex-1 basis-40">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p class="text-sm font-medium">{{ getPlatformLabel(row.platform) }}</p>
              <p class="min-w-0 truncate text-sm tabular-nums text-muted-foreground" :title="row.userId">{{ row.userId }}</p>
              <span
                v-if="row.allowFastVerification"
                class="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                <Zap class="size-3" />
                {{ t("userSettings.imAuthorization.fastVerificationBadge") }}
              </span>
            </div>
            <p v-if="row.comment" class="mt-0.5 truncate text-xs text-muted-foreground" :title="row.comment">
              {{ row.comment }}
            </p>
          </div>
          <div class="ml-auto flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-muted-foreground pointer-coarse:size-10"
              :title="t('userSettings.imAuthorization.actions.edit')"
              :aria-label="t('userSettings.imAuthorization.actions.edit')"
              @click="startEdit(row)"
            >
              <Pencil class="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
              :title="t('userSettings.imAuthorization.actions.delete')"
              :aria-label="t('userSettings.imAuthorization.actions.delete')"
              @click="confirmDelete(row)"
            >
              <Trash2 class="size-4" />
            </Button>
          </div>
        </li>
      </ul>

      <div v-else class="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
        <Inbox class="size-8 text-muted-foreground/60" />
        <p class="text-sm font-medium">{{ t("userSettings.imAuthorization.emptyTitle") }}</p>
      </div>
    </SettingsGroup>
  </div>

  <Dialog v-model:open="showEditDialog">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ isCreateMode ? t("userSettings.imAuthorization.dialog.createTitle") : t("userSettings.imAuthorization.dialog.editTitle") }}
        </DialogTitle>
        <!-- Visible only when the person's own QQ is not yet bound and
             verified; otherwise a screen-reader-only summary. -->
        <DialogDescription :class="hasVerifiedOwnBinding ? 'sr-only' : undefined">
          <template v-if="hasVerifiedOwnBinding">
            {{ isCreateMode ? t("userSettings.imAuthorization.dialog.createDescription") : t("userSettings.imAuthorization.dialog.editDescription") }}
          </template>
          <template v-else>
            {{ t("userSettings.imAuthorization.dialog.bindFirstHint") }}
          </template>
        </DialogDescription>
      </DialogHeader>
      <DialogBody v-if="editTarget">
        <div class="grid gap-1.5">
          <Label id="im-auth-platform-label" for="im-auth-platform">{{ t("userSettings.imAuthorization.fields.platform") }}</Label>
          <Select id="im-auth-platform" :key="locale" v-model="editTarget.platform" @update:model-value="clearAccountError">
            <SelectTrigger class="w-full" aria-labelledby="im-auth-platform-label">
              <SelectValue :placeholder="t('userSettings.imAuthorization.platformPlaceholder')"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qq">{{ t("userSettings.imAuthorization.platforms.qq") }}</SelectItem>
              <SelectItem value="qqbot">{{ t("userSettings.imAuthorization.platforms.qqbot") }}</SelectItem>
              <!--
              <SelectItem value="discord">{{ t("userSettings.imAuthorization.platforms.discord") }}</SelectItem>
              <SelectItem value="telegram">{{ t("userSettings.imAuthorization.platforms.telegram") }}</SelectItem>
              -->
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1.5">
          <Label :for="IM_AUTH_ACCOUNT_INPUT_ID">{{ t("userSettings.imAuthorization.fields.account") }}</Label>
          <div class="relative w-full items-center">
            <Input
              :id="IM_AUTH_ACCOUNT_INPUT_ID"
              v-model="editTarget.userId"
              class="pl-10"
              inputmode="numeric"
              :aria-invalid="accountError ? 'true' : undefined"
              :aria-describedby="accountError ? ACCOUNT_ERROR_ID : undefined"
              @input="clearAccountError"
            />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
              <User class="size-4 text-muted-foreground" />
            </span>
          </div>
          <p v-if="accountError" :id="ACCOUNT_ERROR_ID" role="alert" class="text-xs text-destructive">{{ accountError }}</p>
          <p v-else-if="editTarget.platform === 'qqbot'" class="text-xs text-muted-foreground">
            {{ t("userSettings.imAuthorization.fields.qqbotAccountHint") }}
          </p>
        </div>
        <div class="grid gap-1.5">
          <Label for="im-auth-remark">{{ t("userSettings.imAuthorization.fields.remark") }}</Label>
          <Input id="im-auth-remark" v-model="editTarget.comment"/>
        </div>
        <div class="flex items-start justify-between gap-4 border-t border-border/60 pt-4">
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <Label for="im-auth-fast-verification">{{ t("userSettings.imAuthorization.fields.allowFastVerification") }}</Label>
            <p class="text-xs leading-snug text-muted-foreground">
              {{ t("userSettings.imAuthorization.fields.allowFastVerificationHint") }}
            </p>
          </div>
          <Switch id="im-auth-fast-verification" v-model="editTarget.allowFastVerification" class="shrink-0" />
        </div>
      </DialogBody>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">{{ t("userSettings.common.cancel") }}</Button>
        </DialogClose>
        <Button :disabled="isSaving" :aria-busy="isSaving || undefined" @click="handleEditSave">
          <Loader2 v-if="isSaving" class="size-4 animate-spin" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ConfirmDialog
    v-model:open="showDeleteDialog"
    :title="t('userSettings.imAuthorization.deleteDialog.title')"
    :description="t('userSettings.imAuthorization.deleteDialog.description', {
      platform: deleteTarget ? getPlatformLabel(deleteTarget.platform) : '',
      userId: deleteTarget?.userId ?? '',
    })"
    :confirm-label="t('userSettings.imAuthorization.actions.delete')"
    :cancel-label="t('userSettings.common.cancel')"
    destructive
    :on-confirm="handleDelete"
  />
</template>
