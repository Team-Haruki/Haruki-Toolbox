<script setup lang="ts">
import {ref} from "vue"
import {toast} from "vue-sonner"
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import Turnstile from "@/components/Turnstile.vue"
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
const challengeToken = ref<string | null>(null)
let countdownInterval: ReturnType<typeof setInterval> | null = null


async function handleSendCode() {
  if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    toast.error("请输入有效的邮箱地址")
    return
  }
  if (!challengeToken.value) {
    toast.error("请先完成人机验证")
    return
  }
  try {
    isSending.value = true
    await sendEmailVerificationCode(email.value, challengeToken.value)
    toast.success("邮件已发送", {description: `邮件已发送到 ${email.value}`})
    countdown.value = 60
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
  } catch (err) {
    toast.error("发送验证码失败", {description: String(err)})
  } finally {
    isSending.value = false
  }
}

async function handleRegister() {
  if (!challengeToken.value) {
    toast.error("请先完成验证码验证")
    return
  }
  try {
    const response = await registerUser(
        username.value,
        email.value,
        password.value,
        emailCode.value,
        challengeToken.value
    )
    toast.success("注册成功", {description: "欢迎使用Haruki工具箱"})
    userStore.setUser(response.userData)
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
            <div class="flex gap-2">
              <Input
                  id="email"
                  v-model="email"
                  type="email"
                  placeholder="you@example.com"
                  required
              />
              <Button
                  type="button"
                  :disabled="isSending || countdown > 0"
                  @click="handleSendCode"
              >
                <template v-if="isSending">发送中...</template>
                <template v-else-if="countdown > 0">{{ countdown }} 秒后重试</template>
                <template v-else>发送验证码</template>
              </Button>
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
          <Turnstile @verify="(t) => (challengeToken = t)" class="md-2"/>
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