<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Turnstile from "@/shared/components/Turnstile.vue"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import {Loader2, MailWarning, MessageCircle, User, Send, Key, Unlink, ShieldCheck} from "lucide-vue-next"
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogScrollContent
} from "@/components/ui/dialog"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import {
  IM_BINDING_ACCOUNT_INPUT_ID,
  IM_BINDING_CODE_INPUT_ID,
  useIMBindingSettings,
} from "@/modules/user-settings/composables/useIMBindingSettings"

const {
  current,
  isTurnstileEnabled,
  isEmailVerified,
  canRetryCurrentVerification,
  isCurrentQQBinding,
  sending,
  clearing,
  qqInputCode,
  verifying,
  generatedCode,
  account,
  accountError,
  sendError,
  dialogError,
  showCodeDialog,
  platform,
  dialogMode,
  onTurnstileVerify,
  onTurnstileInvalid,
  clearAccountError,
  clearDialogError,
  handleVerify,
  handleRetryCurrentVerification,
  handleDialogVerify,
  handleUnbind,
} = useIMBindingSettings()
const { t, te, locale } = useI18n()
const router = useRouter()

/** "QQ" rather than the raw platform id, when the platform has a name. */
const currentPlatformLabel = computed(() => {
  const platformId = current.value?.platform ?? ""
  const key = `userSettings.imAuthorization.platforms.${platformId}`
  return te(key) ? t(key) : platformId.toUpperCase()
})

const ACCOUNT_ERROR_ID = "im-binding-account-error"
const SEND_ERROR_ID = "im-binding-send-error"
const CODE_ERROR_ID = "im-binding-code-error"
const unbindDialogOpen = ref(false)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <SettingsGroup :title="t('userSettings.imBinding.title')" surface="card" data-testid="im-binding">
      <SettingsRow
        v-if="!isEmailVerified"
        :icon="MailWarning"
        tone="warning"
        :label="t('userSettings.email.unverifiedTitle')"
        :help="t('userSettings.imBinding.emailVerifyRequiredHint')"
      >
        <Button variant="outline" size="sm" @click="router.push({ name: 'user.settings' })">
          {{ t("userSettings.sections.accountTitle") }}
        </Button>
      </SettingsRow>

      <template v-if="current">
        <!-- The bound account, its state, and the way out. -->
        <SettingsRow
          :icon="MessageCircle"
          :tone="current.verified ? 'success' : 'warning'"
          :label="currentPlatformLabel"
          :help="current.userId"
        >
          <template #label>
            <VerificationStatusBadge
              class="shrink-0"
              :verified="current.verified"
              :verified-label="t('userSettings.imBinding.status.verified')"
              :unverified-label="t('userSettings.imBinding.status.unverified')"
            />
          </template>
          <Button
            variant="outline"
            size="sm"
            class="text-destructive hover:text-destructive"
            :disabled="clearing || !isEmailVerified"
            @click="unbindDialogOpen = true"
          >
            <Loader2 v-if="clearing" class="size-4 animate-spin" />
            <Unlink v-else class="size-4" />
            {{ t("userSettings.imBinding.unbindButton") }}
          </Button>
        </SettingsRow>

        <SettingsRow
          v-if="canRetryCurrentVerification"
          :icon="ShieldCheck"
          tone="warning"
          :label="t('userSettings.imBinding.toast.notVerifiedTitle')"
          :help="isCurrentQQBinding && isTurnstileEnabled ? t('userSettings.imBinding.captchaHint') : undefined"
        >
          <Button
            size="sm"
            :disabled="sending || !isEmailVerified"
            :aria-describedby="sendError ? SEND_ERROR_ID : undefined"
            @click="handleRetryCurrentVerification"
          >
            <Loader2 v-if="sending" class="size-4 animate-spin" />
            {{ isCurrentQQBinding ? t("userSettings.imBinding.actions.sendEmailCode") : t("userSettings.imBinding.actions.generateCode") }}
          </Button>
          <template v-if="(isCurrentQQBinding && isTurnstileEnabled) || sendError" #below>
            <Turnstile
              v-if="isCurrentQQBinding && isTurnstileEnabled"
              ref="turnstileRef"
              @verify="onTurnstileVerify"
              @invalid="onTurnstileInvalid"
            />
            <p v-if="sendError" :id="SEND_ERROR_ID" role="alert" class="text-xs text-destructive">{{ sendError }}</p>
          </template>
        </SettingsRow>
      </template>

      <!-- Nothing bound: platform, account and the send button on one line. -->
      <div v-else class="flex flex-col gap-2 px-4 py-3">
        <div class="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-end">
          <div class="flex flex-col gap-1.5">
            <label id="im-binding-platform-label" for="im-binding-platform" class="text-sm font-medium">{{ t("userSettings.imBinding.fields.platform") }}</label>
            <Select id="im-binding-platform" :key="locale" v-model="platform" @update:model-value="clearAccountError">
              <SelectTrigger class="w-full" aria-labelledby="im-binding-platform-label">
                <SelectValue :placeholder="t('userSettings.imBinding.selectPlatformPlaceholder')"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qq">QQ</SelectItem>
                <!--
                <SelectItem value="qqbot">QQBot</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                -->
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label :for="IM_BINDING_ACCOUNT_INPUT_ID" class="text-sm font-medium">{{ t("userSettings.imBinding.fields.account") }}</label>
            <div class="relative w-full items-center">
              <Input
                :id="IM_BINDING_ACCOUNT_INPUT_ID"
                v-model="account"
                :placeholder="t('userSettings.imBinding.accountPlaceholder')"
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
          </div>
          <Button
            class="w-full sm:w-auto"
            :disabled="sending || !isEmailVerified"
            :aria-describedby="sendError ? SEND_ERROR_ID : undefined"
            @click="handleVerify"
          >
            <Loader2 v-if="sending" class="size-4 animate-spin" />
            <template v-else-if="platform === 'qq'">
              <Send class="size-4" />
              {{ t("userSettings.imBinding.actions.sendEmailCode") }}
            </template>
            <template v-else>
              <ShieldCheck class="size-4" />
              {{ t("userSettings.imBinding.actions.generateCode") }}
            </template>
          </Button>
        </div>
        <p v-if="accountError" :id="ACCOUNT_ERROR_ID" role="alert" class="text-xs text-destructive">{{ accountError }}</p>
        <p v-if="sendError" :id="SEND_ERROR_ID" role="alert" class="text-xs text-destructive">{{ sendError }}</p>

        <div v-if="platform === 'qq' && isTurnstileEnabled" class="space-y-2">
          <p class="text-xs text-muted-foreground">{{ t("userSettings.imBinding.captchaHint") }}</p>
          <Turnstile
            ref="turnstileRef"
            @verify="onTurnstileVerify"
            @invalid="onTurnstileInvalid"
          />
        </div>
      </div>
    </SettingsGroup>
    <!-- What this binding is for, as the group's footnote. -->
    <p class="px-1 text-xs text-muted-foreground">{{ t("userSettings.imBinding.description") }}</p>

  <Dialog v-model:open="showCodeDialog">
    <DialogScrollContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <ShieldCheck class="h-5 w-5" />
          {{ t("userSettings.imBinding.dialog.title") }}
        </DialogTitle>
        <DialogDescription>
          <span v-if="dialogMode === 'qq'">{{ t("userSettings.imBinding.dialog.qqDescription") }}</span>
          <span v-else>{{ t("userSettings.imBinding.dialog.otherDescription") }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2 py-2">
        <template v-if="dialogMode === 'qq'">
          <div class="relative w-full items-center">
            <Input
              :id="IM_BINDING_CODE_INPUT_ID"
              v-model="qqInputCode"
              :placeholder="t('userSettings.imBinding.dialog.qqCodePlaceholder')"
              :aria-label="t('userSettings.imBinding.dialog.qqCodePlaceholder')"
              :aria-invalid="dialogError ? 'true' : undefined"
              :aria-describedby="dialogError ? CODE_ERROR_ID : undefined"
              class="pl-10 text-base font-mono"
              inputmode="numeric"
              autocomplete="one-time-code"
              @input="clearDialogError"
              @keydown.enter.prevent="handleDialogVerify"
            />
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
              <Key class="size-4 text-muted-foreground" />
            </span>
          </div>
        </template>
        <p v-else class="select-all text-center font-mono text-lg" data-testid="im-binding-generated-code">
          {{ generatedCode }}
        </p>
        <p v-if="dialogError" :id="CODE_ERROR_ID" role="alert" class="text-sm text-destructive">{{ dialogError }}</p>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">{{ t("userSettings.common.cancel") }}</Button>
        </DialogClose>
        <Button :disabled="verifying || !isEmailVerified" @click="handleDialogVerify">
          <Loader2 v-if="verifying" class="mr-2 h-4 w-4 animate-spin" />
          <ShieldCheck v-else class="mr-2 h-4 w-4" />
          <span>{{ t("userSettings.imBinding.dialog.verifyButton") }}</span>
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>

  <ConfirmDialog
    v-model:open="unbindDialogOpen"
    :title="t('userSettings.imBinding.unbindDialog.title')"
    :description="t('userSettings.imBinding.unbindDialog.description')"
    :confirm-label="t('userSettings.imBinding.unbindDialog.confirm')"
    :cancel-label="t('userSettings.common.cancel')"
    destructive
    :on-confirm="handleUnbind"
  />
  </div>
</template>
