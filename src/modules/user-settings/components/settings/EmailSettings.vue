<script setup lang="ts">
import {toast} from "vue-sonner"
import { useI18n } from "vue-i18n"
import {useRouter} from "vue-router"
import {useUserStore} from "@/shared/stores/user"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Turnstile from "@/shared/components/Turnstile.vue"
import { Loader2, Mail, ArrowRightLeft, Key, Send, Save } from 'lucide-vue-next'
import { extractErrorMessage } from "@/lib/error-utils"
import { redirectToLogin } from "@/core/router/navigation"


import {
  ref,
  computed,
  watch,
  onUnmounted
} from "vue"
import {
  Card,
  CardTitle,
  CardContent,
  CardHeader,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogDescription,
  DialogScrollContent
} from "@/components/ui/dialog"
import {
  verifyEmail,
  sendEmailVerificationCode
} from "@/modules/user-settings/api/email"

const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()
const currentEmail = computed(() => userStore.emailInfo?.email ?? t("userSettings.email.unbound"))
const newEmail = ref("")
const emailCode = ref("")
const changing = ref(false)
const sendCooldown = ref(0)
const challengeToken = ref("")
const turnstileRef = ref<InstanceType<typeof Turnstile> | null>(null)
const sendingCode = ref(false)
const emailDialogOpen = ref(false)
let sendTimer: ReturnType<typeof setInterval> | null = null

function onTurnstileVerify(token: string) {
  challengeToken.value = token
}

function onTurnstileInvalid() {
  challengeToken.value = ""
}


function validateEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
}

function startCooldown() {
  sendCooldown.value = 60
  if (sendTimer) clearInterval(sendTimer)
  sendTimer = setInterval(() => {
    sendCooldown.value--
    if (sendCooldown.value <= 0 && sendTimer) {
      clearInterval(sendTimer)
      sendTimer = null
    }
  }, 1000)
}

function stopCooldown() {
  if (sendTimer) {
    clearInterval(sendTimer)
    sendTimer = null
  }
  sendCooldown.value = 0
}

function resetDialogState() {
  newEmail.value = ""
  emailCode.value = ""
  challengeToken.value = ""
  sendingCode.value = false
  changing.value = false
  stopCooldown()
  turnstileRef.value?.reset()
}

watch(emailDialogOpen, (open) => {
  if (!open) {
    resetDialogState()
  }
})

async function handleSendCode() {
  if (sendingCode.value) return
  if (!validateEmail(newEmail.value)) {
    toast.error(t("userSettings.email.toast.invalidNewEmailTitle"), {
      description: t("userSettings.email.toast.invalidNewEmailDescription"),
    })
    return
  }
  if (!challengeToken.value) {
    toast.error(t("userSettings.email.toast.completeCaptchaTitle"), {
      description: t("userSettings.email.toast.completeCaptchaDescription"),
    })
    return
  }

  sendingCode.value = true
  try {
    await sendEmailVerificationCode(newEmail.value, challengeToken.value, { skipErrorToast: true })
    toast.success(t("userSettings.email.toast.codeSentTitle"), {
      description: t("userSettings.email.toast.codeSentDescription", { email: newEmail.value }),
    })
    challengeToken.value = ""
    startCooldown()
  } catch (e: unknown) {
    toast.error(t("userSettings.email.toast.sendCodeFailedTitle"), {
      description: extractErrorMessage(e, t("userSettings.email.toast.sendCodeFailedDescription")),
    })
  } finally {
    challengeToken.value = ""
    turnstileRef.value?.reset()
    sendingCode.value = false
  }
}

async function handleChangeEmail() {
  if (changing.value) return
  if (!validateEmail(newEmail.value)) {
    toast.error(t("userSettings.email.toast.invalidNewEmailTitle"), {
      description: t("userSettings.email.toast.invalidNewEmailDescription"),
    })
    return
  }
  if (!emailCode.value) {
    toast.error(t("userSettings.email.toast.inputCodeTitle"), {
      description: t("userSettings.email.toast.inputCodeDescription"),
    })
    return
  }

  changing.value = true
  try {
    const response = await verifyEmail(newEmail.value, emailCode.value, { skipErrorToast: true })

    const updatedEmailInfo = response.updatedData
    
    if (updatedEmailInfo) {
      userStore.setUser({emailInfo: updatedEmailInfo})
    }

    toast.success(t("userSettings.email.toast.changeSuccessTitle"), {
      description: t("userSettings.email.toast.changeSuccessDescription"),
    })
    emailDialogOpen.value = false
    resetDialogState()
    userStore.clearUser()
    await redirectToLogin(router)
  } catch (e: unknown) {
    toast.error(t("userSettings.email.toast.changeFailedTitle"), {
      description: extractErrorMessage(e, t("userSettings.email.toast.changeFailedDescription")),
    })
    turnstileRef.value?.reset()
  } finally {
    changing.value = false
  }
}

onUnmounted(() => {
  stopCooldown()
})
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Mail class="h-6 w-6" />
        {{ t("userSettings.email.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.email.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-muted-foreground">{{ t("userSettings.email.currentEmailLabel") }}</div>
          <div class="text-base font-medium">{{ currentEmail }}</div>
        </div>
      </div>

      <Dialog v-model:open="emailDialogOpen">
        <DialogTrigger as-child>
          <Button class="w-full">
            <ArrowRightLeft class="h-4 w-4 mr-2" />
            {{ t("userSettings.email.changeButton") }}
          </Button>
        </DialogTrigger>
        <DialogScrollContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-2">
              <Mail class="h-5 w-5" />
              {{ t("userSettings.email.dialog.title") }}
            </DialogTitle>
            <DialogDescription>{{ t("userSettings.email.dialog.description") }}</DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <div class="relative w-full items-center">
              <Input :placeholder="t('userSettings.email.dialog.newEmailPlaceholder')" v-model="newEmail" class="pl-10"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Mail class="size-4 text-muted-foreground" />
              </span>
            </div>
            <Turnstile
              ref="turnstileRef"
              class="mb-2"
              @verify="onTurnstileVerify"
              @invalid="onTurnstileInvalid"
            />
            <div class="flex gap-2">
              <div class="relative flex-1 items-center">
                <Input :placeholder="t('userSettings.email.dialog.codePlaceholder')" v-model="emailCode" class="w-full pl-10"/>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Key class="size-4 text-muted-foreground" />
                </span>
              </div>
              <Button
                  :disabled="sendingCode || sendCooldown > 0 || !validateEmail(newEmail)"
                  @click="handleSendCode"
              >
                <Loader2 v-if="sendingCode" class="mr-2 h-4 w-4 animate-spin" />
                <span v-else-if="sendCooldown > 0">{{ t("userSettings.email.dialog.countdown", { seconds: sendCooldown }) }}</span>
                <span v-else class="flex items-center">
                  <Send class="h-4 w-4 mr-2" />
                  {{ t("userSettings.email.dialog.sendCodeButton") }}
                </span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">{{ t("userSettings.common.cancel") }}</Button>
            </DialogClose>
            <Button :disabled="changing" @click="handleChangeEmail">
              <Loader2 v-if="changing" class="mr-2 h-4 w-4 animate-spin" />
              <Save v-else class="mr-2 h-4 w-4" />
              {{ t("userSettings.email.dialog.confirmButton") }}
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
            
