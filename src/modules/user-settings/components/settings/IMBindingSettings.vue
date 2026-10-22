<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Turnstile from "@/shared/components/Turnstile.vue"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import {Loader2, Link2, User, Send, Key, Unlink, ShieldCheck} from "lucide-vue-next"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
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
const { t, locale } = useI18n()

const ACCOUNT_ERROR_ID = "im-binding-account-error"
const SEND_ERROR_ID = "im-binding-send-error"
const CODE_ERROR_ID = "im-binding-code-error"
const unbindDialogOpen = ref(false)
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Link2 class="h-6 w-6" />
        {{ t("userSettings.imBinding.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.imBinding.description") }}</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <div
        v-if="!isEmailVerified"
        class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300"
      >
        {{ t("userSettings.imBinding.emailVerifyRequiredHint") }}
      </div>

      <template v-if="current">
        <!-- Bound account summary tile -->
        <div class="flex items-center gap-3 rounded-md border bg-muted/20 p-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Link2 class="size-5" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold uppercase leading-tight">{{ current.platform }}</p>
            <p class="truncate text-sm text-muted-foreground">{{ current.userId }}</p>
          </div>
          <VerificationStatusBadge
            class="shrink-0"
            :verified="current.verified"
            :verified-label="t('userSettings.imBinding.status.verified')"
            :unverified-label="t('userSettings.imBinding.status.unverified')"
          />
        </div>

        <div v-if="canRetryCurrentVerification" class="space-y-2">
          <p v-if="isCurrentQQBinding && isTurnstileEnabled" class="text-xs text-muted-foreground">
            {{ t("userSettings.imBinding.captchaHint") }}
          </p>
          <Turnstile
            v-if="isCurrentQQBinding && isTurnstileEnabled"
            ref="turnstileRef"
            @verify="onTurnstileVerify"
            @invalid="onTurnstileInvalid"
          />
        </div>

        <div class="grid gap-2" :class="canRetryCurrentVerification ? 'sm:grid-cols-2' : ''">
          <Button
            v-if="canRetryCurrentVerification"
            :disabled="sending || !isEmailVerified"
            :aria-describedby="sendError ? SEND_ERROR_ID : undefined"
            @click="handleRetryCurrentVerification"
          >
            <Loader2 v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
            <template v-else>
              <ShieldCheck class="mr-2 h-4 w-4" />
              {{ isCurrentQQBinding ? t("userSettings.imBinding.actions.sendEmailCode") : t("userSettings.imBinding.actions.generateCode") }}
            </template>
          </Button>

          <Button :disabled="clearing || !isEmailVerified" variant="destructive" class="w-full" @click="unbindDialogOpen = true">
            <Loader2 v-if="clearing" class="mr-2 h-4 w-4 animate-spin" />
            <Unlink v-else class="mr-2 h-4 w-4" />
            {{ t("userSettings.imBinding.unbindButton") }}
          </Button>
        </div>
        <p v-if="sendError" :id="SEND_ERROR_ID" role="alert" class="text-xs text-destructive">{{ sendError }}</p>
      </template>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label id="im-binding-platform-label" for="im-binding-platform" class="text-sm font-medium">{{ t("userSettings.imBinding.selectPlatformLabel") }}</label>
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
          <div class="flex flex-col gap-2">
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
            <p v-if="accountError" :id="ACCOUNT_ERROR_ID" role="alert" class="text-xs text-destructive">{{ accountError }}</p>
          </div>
        </div>

        <div v-if="platform === 'qq' && isTurnstileEnabled" class="space-y-2">
          <p class="text-xs text-muted-foreground">{{ t("userSettings.imBinding.captchaHint") }}</p>
          <Turnstile
            ref="turnstileRef"
            @verify="onTurnstileVerify"
            @invalid="onTurnstileInvalid"
          />
        </div>

        <Button
          class="w-full"
          :disabled="sending || !isEmailVerified"
          :aria-describedby="sendError ? SEND_ERROR_ID : undefined"
          @click="handleVerify"
        >
          <Loader2 v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
          <template v-else>
            <span v-if="platform === 'qq'" class="flex items-center justify-center">
              <Send class="h-4 w-4 mr-2" />
              {{ t("userSettings.imBinding.actions.sendEmailCode") }}
            </span>
            <span v-else class="flex items-center justify-center">
              <ShieldCheck class="h-4 w-4 mr-2" />
              {{ t("userSettings.imBinding.actions.generateCode") }}
            </span>
          </template>
        </Button>
        <p v-if="sendError" :id="SEND_ERROR_ID" role="alert" class="text-xs text-destructive">{{ sendError }}</p>
      </template>

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
    </CardContent>
  </Card>
</template>
