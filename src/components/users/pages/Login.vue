<script setup lang="ts">
import {toast} from "vue-sonner";
import {isAxiosError} from "axios"
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import Turnstile from "@/components/Turnstile.vue";

import {useUserStore} from "@/components/users/data/store"
import {onMounted} from "vue"

import {
  ref,
} from "vue"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog"

import {
  login,
  sendResetPasswordEmail
} from "@/components/users/data/api";

const router = useRouter()
const email = ref("")
const password = ref("")
const resetEmail = ref("")
const loginChallengeToken = ref<string | null>(null)
const resetChallengeToken = ref<string | null>(null)
const userStore = useUserStore()

onMounted(() => {
  if (userStore.sessionToken) {
    toast.warning("您已登录", {description: "已返回上一个路径"})
    router.back()
  }
})

function onLoginTurnstileVerified(token: string) {
  loginChallengeToken.value = token;
}

function onResetTurnstileVerified(token: string) {
  resetChallengeToken.value = token;
}

async function handleResetPassword() {
  if (!resetEmail.value) {
    toast.error("请输入邮箱地址")
    return
  }
  if (!resetChallengeToken.value) {
    toast.error("请先完成人机验证")
    return
  }
  try {
    await sendResetPasswordEmail(resetEmail.value, resetChallengeToken.value)
    toast.success("重置密码邮件已发送", {description: `邮件已发送到 ${resetEmail.value}`})
    resetChallengeToken.value = null
  } catch (err: unknown) {
    let message = "网络错误，请检查连接"
    if (isAxiosError(err)) {
      message = (err.response?.data as any)?.message || err.message
    } else if (err instanceof Error) {
      message = err.message
    }
    toast.error("重置密码失败", {description: message})
  }
}

async function handleLogin() {
  if (!loginChallengeToken.value) {
    toast.error("请先完成验证码验证")
    return
  }
  try {
    const response = await login(email.value, password.value, loginChallengeToken.value)
    if (response.status === 200) {
      toast.success("登录成功")
      loginChallengeToken.value = null
      await router.push("/")
    } else {
      toast.error("登录失败", {description: response.message || "请稍后再试"})
    }
  } catch (err: unknown) {
    let message = "网络错误，请检查连接"
    if (isAxiosError(err)) {
      message = (err.response?.data as any)?.message || err.message
    } else if (err instanceof Error) {
      message = err.message
    }
    toast.error("登录失败", {description: message})
  }
}

</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
          登录到 Haruki 工具箱
        </CardTitle>
        <CardDescription>
          使用您的邮箱和密码登录
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin">
          <div class="grid gap-6">
            <div class="grid gap-2">
              <Label html-for="email">邮箱</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱"
                  required
                  v-model="email"
              />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label html-for="password">密码</Label>
                <Dialog>
                  <DialogTrigger as-child>
                    <a href="javascript:void(0)" class="ml-auto text-sm underline-offset-4 hover:underline">
                      忘记密码？
                    </a>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>重置密码</DialogTitle>
                      <DialogDescription>请输入您的邮箱地址以重置密码</DialogDescription>
                    </DialogHeader>
                    <div class="py-4">
                      <Label for="reset-email">邮箱</Label>
                      <Input
                          id="reset-email"
                          type="email"
                          placeholder="you@example.com"
                          v-model="resetEmail"
                      />
                      <Turnstile :callback="onResetTurnstileVerified"/>
                    </div>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="outline">取消</Button>
                      </DialogClose>
                      <Button @click="handleResetPassword">确定</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Input id="password" type="password" placeholder="请输入您的密码" required v-model="password"/>
              <Turnstile :callback="onLoginTurnstileVerified"/>
            </div>
            <Button type="submit" class="w-full">
              登录
            </Button>
            <div class="text-center text-sm">
              还没有帐号？
              <router-link to="/user/register" class="underline underline-offset-4">
                注册
              </router-link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>