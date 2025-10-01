<script setup lang="ts">
import { ref } from "vue"
import { Button } from "@/components/ui/button"
import { login } from "@/components/users/data/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const username = ref("")
const email = ref("")
const password = ref("")

function handleRegister() {
  console.log("注册信息:", {
    username: username.value,
    email: email.value,
    password: password.value,
  })
  alert("注册成功！")
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
            <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="you@example.com"
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
          <Button type="submit" class="w-full"> 注册 </Button>
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

<style scoped>
</style>