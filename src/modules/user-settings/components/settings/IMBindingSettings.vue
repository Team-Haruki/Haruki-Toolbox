<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Turnstile from "@/shared/components/Turnstile.vue"
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
  AlertDialog,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {useIMBindingSettings} from "@/modules/user-settings/composables/useIMBindingSettings"

const {
  current,
  sending,
  clearing,
  qqInputCode,
  verifying,
  generatedCode,
  account,
  showCodeDialog,
  platform,
  dialogMode,
  turnstileRef,
  onTurnstileVerify,
  onTurnstileInvalid,
  handleVerify,
  handleDialogVerify,
  handleUnbind,
} = useIMBindingSettings()
const { t } = useI18n()
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Link2 class="h-6 w-6" />
        {{ t("userSettings.imBinding.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.imBinding.description") }}</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <template v-if="current">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">{{ t("userSettings.imBinding.fields.platform") }}</span>
            <span>{{ current.platform }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">{{ t("userSettings.imBinding.fields.account") }}</span>
            <span>{{ current.userId }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">{{ t("userSettings.imBinding.fields.verificationStatus") }}</span>
            <div>
          <span
              v-if="current.verified"
              class="px-2 py-1 rounded text-xs bg-green-100 text-green-700"
          >{{ t("userSettings.imBinding.status.verified") }}</span>
              <span
                  v-else
                  class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700"
              >{{ t("userSettings.imBinding.status.unverified") }}</span>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button :disabled="clearing" variant="destructive" class="w-full mt-4">
              <Loader2 v-if="clearing" class="mr-2 h-4 w-4 animate-spin" />
              <Unlink v-else class="mr-2 h-4 w-4" />
              {{ t("userSettings.imBinding.unbindButton") }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t("userSettings.imBinding.unbindDialog.title") }}</AlertDialogTitle>
              <AlertDialogDescription>
                {{ t("userSettings.imBinding.unbindDialog.description") }}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t("userSettings.common.cancel") }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive" @click="handleUnbind">
                {{ t("userSettings.imBinding.unbindDialog.confirm") }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>

      <template v-else>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">{{ t("userSettings.imBinding.selectPlatformLabel") }}</label>
            <Select v-model="platform">
              <SelectTrigger class="w-full">
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
            <label class="text-sm font-medium">{{ t("userSettings.imBinding.fields.account") }}</label>
            <div class="relative w-full items-center">
              <Input v-model="account" :placeholder="t('userSettings.imBinding.accountPlaceholder')" class="pl-10"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
        </div>

        <div v-if="platform === 'qq'" class="space-y-2">
          <p class="text-xs text-muted-foreground">{{ t("userSettings.imBinding.captchaHint") }}</p>
          <Turnstile
            ref="turnstileRef"
            @verify="onTurnstileVerify"
            @invalid="onTurnstileInvalid"
          />
        </div>

        <Button class="w-full" :disabled="sending" @click="handleVerify">
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

          <div class="py-4 text-center font-mono text-lg">
            <template v-if="dialogMode === 'qq'">
              <div class="relative w-full items-center">
                <Input v-model="qqInputCode" :placeholder="t('userSettings.imBinding.dialog.qqCodePlaceholder')" class="pl-10 text-base"/>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Key class="size-4 text-muted-foreground" />
                </span>
              </div>
            </template>
            <template v-else>
              {{ generatedCode }}
            </template>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">{{ t("userSettings.common.cancel") }}</Button>
            </DialogClose>
            <Button :disabled="verifying" @click="handleDialogVerify">
              <Loader2 v-if="verifying" class="mr-2 h-4 w-4 animate-spin" />
              <ShieldCheck v-else class="mr-2 h-4 w-4" />
              <span>{{ t("userSettings.imBinding.dialog.verifyButton") }}</span>
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
