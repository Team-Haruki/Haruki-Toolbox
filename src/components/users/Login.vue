<script setup lang="ts">
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
        <form>
          <div class="grid gap-6">
            <div class="grid gap-2">
              <Label html-for="email">邮箱</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
              />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label html-for="password">密码</Label>
                <a
                    href="#"
                    class="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  忘记密码？
                </a>
              </div>
              <Input id="password" type="password" required />
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