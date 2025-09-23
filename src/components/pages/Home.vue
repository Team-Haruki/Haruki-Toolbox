<script setup lang="ts">
import {GitHubIcon} from "vue3-simple-icons"
import {Button} from "@/components/ui/button"

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent
} from "@/components/ui/card"
import {
  LucideBot,
  LucideInfo,
  LucideNavigation,
  LucideCalculator,
  LucideUploadCloud,
  LucideArrowDownToLine,
} from "lucide-vue-next"
</script>

<template>
  <div class="flex flex-col flex-grow gap-6 w-full p-6 max-w-5xl mx-auto justify-center">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold">欢迎使用 Haruki 工具箱</h1>
      <p class="text-lg text-muted-foreground mt-2">请选择您需要的功能</p>
    </div>
    <Card class="max-w-lg mx-auto w-full">
      <CardHeader>
        <CardTitle>推荐与关于</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4">
        <router-link to="/friend-groups">
          <Button variant="outline" class="w-full flex items-center gap-2">
            <LucideNavigation class="w-5 h-5"/>
            推荐群聊
          </Button>
        </router-link>
        <router-link to="/friend-links">
          <Button variant="outline" class="w-full flex items-center gap-2">
            <LucideNavigation class="w-5 h-5"/>
            友情链接
          </Button>
        </router-link>
        <router-link to="/about">
          <Button variant="outline" class="w-full flex items-center gap-2">
            <LucideInfo class="w-5 h-5"/>
            关于
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-lg mx-auto w-full">
      <CardHeader>
        <CardTitle>Haruki工具箱工具</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4">
        <router-link to="/pt-calculator">
          <Button variant="outline" class="w-full flex items-center gap-2 truncate text-sm">
            <LucideCalculator class="w-5 h-5"/>
            <span class="whitespace-normal">活动Pt控分计算器</span>
          </Button>
        </router-link>
        <router-link to="/upload-data">
          <Button variant="outline" class="w-full flex items-center gap-2 truncate text-sm">
            <LucideUploadCloud class="w-5 h-5"/>
            <span class="whitespace-normal">上传数据</span>
          </Button>
        </router-link>
        <router-link to="/ios-modules">
          <Button variant="outline" class="w-full flex items-center gap-2 truncate text-sm">
            <LucideArrowDownToLine class="w-5 h-5"/>
            <span class="whitespace-normal">iOS模块安装</span>
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-lg mx-auto w-full">
      <CardHeader>
        <CardTitle>站外链接</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4">
        <a href="https://docs.haruki.seiunx.com" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" class="w-full flex items-center gap-2 truncate text-sm">
            <LucideBot class="w-5 h-5"/>
            <span class="whitespace-normal">HarukiBot 帮助文档</span>
          </Button>
        </a>
        <a href="https://github.com/Team-Haruki" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" class="w-full flex items-center gap-2 truncate text-sm">
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