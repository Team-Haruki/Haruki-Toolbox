<script setup lang="ts">
import {toast} from "vue-sonner"
import {useUserStore} from "@/store"
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import Turnstile from "@/components/Turnstile.vue"
import { extractErrorMessage } from "@/lib/error-utils"
import { Loader2, UserPlus, Mail, X, User, Lock, Key, Send, ShieldCheck } from 'lucide-vue-next'
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogScrollContent
} from "@/components/ui/dialog"


import {
  ref,
  onMounted
} from "vue"
import {
  registerUser,
  sendEmailVerificationCode,
} from "@/api"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"

const router = useRouter()
const email = ref("")
const username = ref("")
const countdown = ref(0)
const password = ref("")
const emailCode = ref("")
const userStore = useUserStore()
const isSending = ref(false)
const isRegistering = ref(false)
const sendCodeChallengeToken = ref<string>("")
const sendCodeRef = ref<InstanceType<typeof Turnstile> | null>(null)
const registerChallengeToken = ref<string>("")
const registerTurnstileRef = ref<InstanceType<typeof Turnstile> | null>(null)
const isDialogOpen = ref(false)
let countdownInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (userStore.sessionToken) {
    toast.warning("您已登录", {description: "已返回上一个路径"})
    router.back()
  }
})

async function handleSendCode() {
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    toast.error("请输入有效的邮箱地址")
    return false
  }
  if (!sendCodeChallengeToken.value) {
    toast.error("请先完成人机验证")
    return false
  }
  try {
    isSending.value = true
    await sendEmailVerificationCode(email.value, sendCodeChallengeToken.value, { skipErrorToast: true })
    toast.success("邮件已发送", {description: `邮件已发送到 ${email.value}`})
    countdown.value = 60
    sendCodeChallengeToken.value = ""
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    countdownInterval = setInterval(() => {
      if (countdown.value > 0) {
        countdown.value -= 1
      }
      if (countdown.value === 0 && countdownInterval) {
        clearInterval(countdownInterval)
        countdownInterval = null
      }
    }, 1000)
    return true
  } catch (err: unknown) {
    toast.error("发送验证码失败", {description: extractErrorMessage(err, "发送失败")})
    sendCodeRef.value?.reset()
    return false
  } finally {
    isSending.value = false
  }
}

async function handleRegister() {
  if (!registerChallengeToken.value) {
    toast.error("请先完成验证码验证")
    return
  }
  isRegistering.value = true
  try {
    const response = await registerUser(
        username.value,
        email.value,
        password.value,
        emailCode.value,
        registerChallengeToken.value,
        { skipErrorToast: true }
    )
    toast.success("注册成功", {description: "欢迎来到Haruki工具箱"})
    userStore.setUser(response.userData)
    registerChallengeToken.value = ""
    await router.push("/")
  } catch (err: unknown) {
    toast.error("注册失败", {description: extractErrorMessage(err, "注册失败")})
    registerTurnstileRef.value?.reset()
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl flex items-center justify-center gap-2">
          <UserPlus class="h-6 w-6" />
          注册账号
        </CardTitle>
        <CardDescription>创建一个新的 Haruki 工具箱账号</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-6" @submit.prevent="handleRegister">

          <div class="grid gap-2">
            <Label for="username">用户名</Label>
            <div class="relative w-full items-center">
              <Input
                  id="username"
                  class="pl-10"
                  v-model="username"
                  type="text"
                  placeholder="请输入用户名"
                  required
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="email">邮箱</Label>
            <div class="flex gap-2 items-center">
              <div class="relative w-full items-center">
                <Input
                    id="email"
                    v-model="email"
                    class="pl-10"
                    type="email"
                    placeholder="you@example.com"
                    required
                />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Mail class="size-4 text-muted-foreground" />
                </span>
              </div>
              <Dialog v-model:open="isDialogOpen">

                <DialogTrigger as-child>
                  <Button
                      :disabled="isSending || countdown > 0"
                  >
                    <Loader2 v-if="isSending" class="mr-2 h-4 w-4 animate-spin" />
                    <template v-if="isSending">发送中...</template>
                    <template v-else-if="countdown > 0">{{ countdown }} 秒后重试</template>
                    <template v-else>
                      <Send class="h-4 w-4 mr-2" />
                      发送验证码
                    </template>
                  </Button>
                </DialogTrigger>
                <DialogScrollContent>
                  <DialogTitle class="flex items-center gap-2">
                    <ShieldCheck class="h-5 w-5" />
                    发送邮件前人机验证
                  </DialogTitle>
                  <DialogDescription>请完成人机验证以发送您的注册邮件</DialogDescription>
                  <div class="mb-4">
                    <Turnstile @verify="(t: string) => { sendCodeChallengeToken = t }" ref="sendCodeRef" />
                  </div>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="secondary" type="button">
                          <X class="h-4 w-4 mr-2" />
                          取消
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        :disabled="isSending"
                        @click="async () => { if(await handleSendCode()) { isDialogOpen = false } }"
                      >
                        <Loader2 v-if="isSending" class="mr-2 h-4 w-4 animate-spin" />
                        <Mail v-else class="h-4 w-4 mr-2" />
                        <span v-if="isSending">发送中...</span>
                        <span v-else>确认发送</span>
                      </Button>
                    </DialogFooter>
                </DialogScrollContent>
              </Dialog>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="emailCode">邮箱验证码</Label>
            <div class="relative w-full items-center">
              <Input
                  id="emailCode"
                  class="pl-10"
                  v-model="emailCode"
                  type="text"
                  placeholder="请输入收到的验证码"
                  required
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Key class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="password">密码</Label>
            <div class="relative w-full items-center">
              <Input
                  id="password"
                  class="pl-10"
                  v-model="password"
                  type="password"
                  placeholder="请输入密码"
                  required
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Lock class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <Turnstile @verify="(t: string) => { registerChallengeToken = t }" class="md-2" ref="registerTurnstileRef"/>
          <Button type="submit" class="w-full" :disabled="isRegistering">
            <Loader2 v-if="isRegistering" class="mr-2 h-4 w-4 animate-spin" />
            <UserPlus v-else class="h-4 w-4 mr-2" />
            注册
          </Button>
          <div class="text-center text-sm">
            已有账号？
            <router-link to="/user/login" class="underline underline-offset-4">
              去登录
            </router-link>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>