<script setup lang="ts">
import {onMounted, ref} from "vue"
import {toast} from "vue-sonner"
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import Turnstile from "@/components/Turnstile.vue"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogClose, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import {useUserStore} from "@/components/users/data/store"

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  registerUser,
  sendEmailVerificationCode,
} from "@/components/users/data/api"

const router = useRouter()
const email = ref("")
const username = ref("")
const countdown = ref(0)
const password = ref("")
const emailCode = ref("")
const userStore = useUserStore()
const isSending = ref(false)
const sendCodeChallengeToken = ref<string>("")
const registerChallengeToken = ref<string>("")
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
    await sendEmailVerificationCode(email.value, sendCodeChallengeToken.value)
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
  } catch (err) {
    toast.error("发送验证码失败", {description: String(err)})
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
  try {
    const response = await registerUser(
        username.value,
        email.value,
        password.value,
        emailCode.value,
        registerChallengeToken.value
    )
    toast.success("注册成功", {description: "欢迎使用Haruki工具箱"})
    userStore.setUser(response.userData)
    registerChallengeToken.value = ""
    await router.push("/")
  } catch (err) {
    toast.error("注册失败", {description: String(err)})
  }
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">注册账号</CardTitle>
        <CardDescription>创建一个新的 Haruki 工具箱账号</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-6" @submit.prevent="handleRegister">
          <div class="grid gap-2">
            <Label for="username">用户名</Label>
            <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="请输入用户名"
                required
            />
          </div>
          <div class="grid gap-2">
            <Label for="email">邮箱</Label>
            <div class="flex gap-2 items-center">
              <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="you@example.com"
                  required
              />
              <Dialog v-model:open="isDialogOpen">

                <DialogTrigger as-child>
                  <Button
                      type="button"
                      :disabled="isSending || countdown > 0"
                  >
                    <template v-if="isSending">发送中...</template>
                    <template v-else-if="countdown > 0">{{ countdown }} 秒后重试</template>
                    <template v-else>发送验证码</template>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogTitle>发送邮件前人机验证</DialogTitle>
                  <DialogDescription>请完成人机验证以发送您的注册邮件</DialogDescription>
                  <div class="mb-4">
                    <Turnstile @verify="(t: string) => { sendCodeChallengeToken = t }" />
                  </div>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="secondary" type="button">取消</Button>
                      </DialogClose>
                      <Button
                        type="button"
                        :disabled="!sendCodeChallengeToken || isSending"
                        @click="async () => { if(await handleSendCode()) { isDialogOpen = false } }"
                      >
                        <template v-if="isSending">发送中...</template>
                        <template v-else>确认发送</template>
                      </Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="emailCode">邮箱验证码</Label>
            <Input
                id="emailCode"
                v-model="emailCode"
                type="text"
                placeholder="请输入收到的验证码"
                required
            />
          </div>
          <div class="grid gap-2">
            <Label for="password">密码</Label>
            <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="请输入密码"
                required
            />
          </div>
          <Turnstile @verify="(t: string) => { registerChallengeToken = t }" class="md-2"/>
          <Button type="submit" class="w-full"> 注册</Button>
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