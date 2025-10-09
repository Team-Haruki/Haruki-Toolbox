<script setup lang="ts">
import { GitHubIcon } from "vue3-simple-icons"
import { Button } from "@/components/ui/button"

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent
} from "@/components/ui/card"
import {
  LogIn,
  Settings,
  Gamepad2,
  UserPlus,
  LucideBot,
  LucideInfo,
  LucideNavigation,
  LucideCalculator,
  LucideUploadCloud,
  LucideArrowDownToLine
} from "lucide-vue-next"

import { computed } from "vue"
import { useUserStore } from "@/store"
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
</script>

<template>
  <div class="flex flex-col flex-grow gap-6 w-full p-6 max-w-5xl mx-auto justify-center">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold">欢迎使用 Haruki 工具箱</h1>
      <p class="text-lg text-muted-foreground mt-2">请选择您需要的功能</p>
    </div>
    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>推荐与关于</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <router-link to="/friend-groups" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 whitespace-normal">
            <LucideNavigation class="w-5 h-5"/>
            推荐群聊
          </Button>
        </router-link>
        <router-link to="/friend-links" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 whitespace-normal">
            <LucideNavigation class="w-5 h-5"/>
            友情链接
          </Button>
        </router-link>
        <router-link to="/about" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 whitespace-normal">
            <LucideInfo class="w-5 h-5"/>
            关于
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>账号与设置</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <router-link v-if="!isLoggedIn" to="/user/register" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <UserPlus class="w-5 h-5"/>
            <span class="whitespace-normal">注册</span>
          </Button>
        </router-link>
        <router-link v-if="!isLoggedIn" to="/user/login" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LogIn class="w-5 h-5"/>
            <span class="whitespace-normal">登录</span>
          </Button>
        </router-link>
        <router-link to="/user/settings" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <Settings class="w-5 h-5"/>
            <span class="whitespace-normal">账号设置</span>
          </Button>
        </router-link>
        <router-link to="/user/game-account-bindings" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <Gamepad2 class="w-5 h-5"/>
            <span class="whitespace-normal">游戏账号管理</span>
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>工具</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <router-link to="/pt-calculator" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LucideCalculator class="w-5 h-5"/>
            <span class="whitespace-normal">活动Pt控分计算器</span>
          </Button>
        </router-link>
        <router-link to="/upload-data" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LucideUploadCloud class="w-5 h-5"/>
            <span class="whitespace-normal">上传数据</span>
          </Button>
        </router-link>
        <router-link to="/ios-modules" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LucideArrowDownToLine class="w-5 h-5"/>
            <span class="whitespace-normal">iOS模块安装</span>
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>站外链接</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <a href="https://docs.haruki.seiunx.com" target="_blank" rel="noopener noreferrer" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LucideBot class="w-5 h-5"/>
            <span class="whitespace-normal">HarukiBot 帮助文档</span>
          </Button>
        </a>
        <a href="https://github.com/Team-Haruki" target="_blank" rel="noopener noreferrer" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <GitHubIcon class="w-5 h-5"/>
            <span class="whitespace-normal">Haruki GitHub</span>
          </Button>
        </a>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>

</style>