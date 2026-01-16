<script setup lang="ts">
import {toast} from "vue-sonner"
import {useRouter} from "vue-router"
import {useUserStore} from "@/store"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Turnstile from "@/components/Turnstile.vue"
import {isAxiosError} from "axios"
import type {ApiErrorResponse} from "@/types/response"
import { Loader2 } from 'lucide-vue-next'


import {
  ref,
  computed,
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
} from "@/api"

const router = useRouter()
const userStore = useUserStore()
const currentEmail = computed(() => userStore.emailInfo?.email ?? "未绑定")
const newEmail = ref("")
const emailCode = ref("")
const changing = ref(false)
const sendCooldown = ref(0)
const challengeToken = ref("")
const turnstileRef = ref<InstanceType<typeof Turnstile> | null>(null)
const sendingCode = ref(false)
let sendTimer: ReturnType<typeof setInterval> | null = null


function validateEmail(val: string) {
  return /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val)
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

async function handleSendCode() {
  if (!validateEmail(newEmail.value)) {
    toast.error("请输入有效的新邮箱", {description: "请检查邮箱格式后重试"})
    return
  }
  if (!challengeToken.value) {
    toast.error("请先完成人机验证", {description: "通过下方验证码后再发送邮件"})
    return
  }

  sendingCode.value = true
  try {
    await sendEmailVerificationCode(newEmail.value, challengeToken.value, { skipErrorToast: true })
    toast.success("验证码已发送", {description: `已发送到 ${newEmail.value}，请注意查收`})
    startCooldown()
  } catch (e: unknown) {
      let message = "发送验证码失败"
      if (isAxiosError(e)) {
          message = (e.response?.data as ApiErrorResponse)?.message || e.message
      } else if (e instanceof Error) {
          message = e.message
      }
    toast.error("发送验证码失败", {description: message})
    turnstileRef.value?.reset()
  } finally {
    sendingCode.value = false
  }
}

async function handleChangeEmail() {
  if (!validateEmail(newEmail.value)) {
    toast.error("请输入有效的新邮箱", {description: "请检查邮箱格式后重试"})
    return
  }
  if (!emailCode.value) {
    toast.error("请输入验证码", {description: "请填写邮箱收到的验证码"})
    return
  }

  changing.value = true
  try {
    const response = await verifyEmail(newEmail.value, emailCode.value, { skipErrorToast: true })

    const updatedEmailInfo = response.updatedData
    
    if (updatedEmailInfo) {
      userStore.updateUser({emailInfo: updatedEmailInfo})
    }

    toast.success("更换邮箱成功", {description: "请重新登录以生效"})
    userStore.clearUser()
    await router.push("/user/login")
  } catch (e: unknown) {
      let message = "更换邮箱失败"
      if (isAxiosError(e)) {
          message = (e.response?.data as ApiErrorResponse)?.message || e.message
      } else if (e instanceof Error) {
          message = e.message
      }
    toast.error("更换邮箱失败", {description: message})
    turnstileRef.value?.reset()
  } finally {
    changing.value = false
  }
}

onUnmounted(() => {
  if (sendTimer) {
    clearInterval(sendTimer)
    sendTimer = null
  }
})
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>邮箱设置</CardTitle>
      <CardDescription>管理您的邮箱绑定信息</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-muted-foreground">当前邮箱</div>
          <div class="text-base font-medium">{{ currentEmail }}</div>
        </div>
      </div>

      <Dialog>
        <DialogTrigger as-child>
          <Button class="w-full">更换邮箱</Button>
        </DialogTrigger>
        <DialogScrollContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>更换邮箱</DialogTitle>
            <DialogDescription>输入新的邮箱，完成人机验证并发送验证码。</DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <Input placeholder="新的邮箱地址" v-model="newEmail"/>
            <Turnstile @verify="val => (challengeToken = val)" class="mb-2" ref="turnstileRef"/>
            <div class="flex gap-2">
              <Input placeholder="邮箱验证码" v-model="emailCode" class="flex-1"/>
              <Button
                  :disabled="sendingCode || sendCooldown > 0 || !validateEmail(newEmail)"
                  @click="handleSendCode"
              >
                <Loader2 v-if="sendingCode" class="mr-2 h-4 w-4 animate-spin" />
                <span v-else-if="sendCooldown > 0">{{ sendCooldown }}s</span>
                <span v-else>发送验证码</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button :disabled="changing" @click="handleChangeEmail">
              <Loader2 v-if="changing" class="mr-2 h-4 w-4 animate-spin" />
              确认更换
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </CardContent>
  </Card>
</template>
            