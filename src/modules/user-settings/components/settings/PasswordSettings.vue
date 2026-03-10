<script setup lang="ts">
import { ref, watch } from "vue"
import {toast} from "vue-sonner"
import { useI18n } from "vue-i18n"
import {useRouter} from "vue-router"
import {useUserStore} from "@/shared/stores/user"
import {changePassword} from "@/modules/user-settings/api/account"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Loader2, KeyRound, Lock, Save} from "lucide-vue-next"
import { extractErrorMessage } from "@/lib/error-utils"
import { redirectToLogin } from "@/core/router/navigation"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"


import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogScrollContent
} from "@/components/ui/dialog"

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const oldPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")
const isSubmitting = ref(false)
const dialogOpen = ref(false)

function resetForm() {
  oldPassword.value = ""
  newPassword.value = ""
  confirmPassword.value = ""
}

watch(dialogOpen, (open) => {
  if (!open) {
    resetForm()
  }
})

const handleChangePassword = async () => {
  if (isSubmitting.value) return
  const userId = resolveRequiredUserId(userStore.userId)
  if (!userId) return
  
  if (!oldPassword.value) {
    toast.error(t("userSettings.password.toast.validateFailedTitle"), {
      description: t("userSettings.password.toast.oldPasswordRequired"),
    })
    return
  }
  
  if (!newPassword.value) {
    toast.error(t("userSettings.password.toast.validateFailedTitle"), {
      description: t("userSettings.password.toast.newPasswordRequired"),
    })
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    toast.error(t("userSettings.password.toast.validateFailedTitle"), {
      description: t("userSettings.password.toast.passwordMismatch"),
    })
    return
  }
  
  if (newPassword.value.length < 8) {
    toast.error(t("userSettings.password.toast.validateFailedTitle"), {
      description: t("userSettings.password.toast.passwordMinLength"),
    })
    return
  }
  
  isSubmitting.value = true
  
  try {
    await changePassword(userId, oldPassword.value, newPassword.value, { skipErrorToast: true })
    toast.success(t("userSettings.password.toast.changeSuccessTitle"), {
      description: t("userSettings.password.toast.changeSuccessDescription"),
    })
    resetForm()
    dialogOpen.value = false
    userStore.clearUser()
    await redirectToLogin(router)
  } catch (error: unknown) {
    toast.error(t("userSettings.password.toast.changeFailedTitle"), {
      description: extractErrorMessage(error, t("userSettings.password.toast.changeFailedDescription")),
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <KeyRound class="h-6 w-6" />
        {{ t("userSettings.password.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.password.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <Dialog v-model:open="dialogOpen">
        <DialogTrigger as-child>
          <Button class="w-full">
            <KeyRound class="h-4 w-4 mr-2" />
            {{ t("userSettings.password.changeButton") }}
          </Button>
        </DialogTrigger>
        <DialogScrollContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
              <KeyRound class="h-5 w-5" />
              {{ t("userSettings.password.dialog.title") }}
            </DialogTitle>
            <DialogDescription>{{ t("userSettings.password.dialog.description") }}</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="old-password" class="text-right">{{ t("userSettings.password.dialog.oldPasswordLabel") }}</Label>
              <div class="col-span-3 relative w-full items-center">
                <Input id="old-password" type="password" v-model="oldPassword" class="pl-10" :placeholder="t('userSettings.password.dialog.oldPasswordPlaceholder')"/>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Lock class="size-4 text-muted-foreground" />
                </span>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="new-password" class="text-right">{{ t("userSettings.password.dialog.newPasswordLabel") }}</Label>
              <div class="col-span-3 relative w-full items-center">
                <Input id="new-password" type="password" v-model="newPassword" class="pl-10" :placeholder="t('userSettings.password.dialog.newPasswordPlaceholder')"/>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Lock class="size-4 text-muted-foreground" />
                </span>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="confirm-password" class="text-right">{{ t("userSettings.password.dialog.confirmPasswordLabel") }}</Label>
              <div class="col-span-3 relative w-full items-center">
                <Input id="confirm-password" type="password" v-model="confirmPassword" class="pl-10" :placeholder="t('userSettings.password.dialog.confirmPasswordPlaceholder')"/>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Lock class="size-4 text-muted-foreground" />
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" :disabled="isSubmitting" @click="handleChangePassword">
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              <Save v-else class="mr-2 h-4 w-4" />
              {{ t("userSettings.password.dialog.submit") }}
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
