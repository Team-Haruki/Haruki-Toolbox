<script setup lang="ts">
import { computed, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useUserStore } from "@/store"
import { toast } from "vue-sonner"
import {
  LucideLayoutDashboard,
  LucideUsers,
  LucideKeyRound,
  LucideScrollText,
  LucideCloudUpload,
  LucideFileEdit,
  LucideCog,
  LucideMonitor,
  LucideShieldAlert,
  LucideTicket,
  LucideGamepad2,
} from "lucide-vue-next"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

watch(
  () => userStore.isAdmin,
  (isAdmin) => {
    if (!isAdmin) {
      toast.error("权限不足", { description: "您没有管理员权限" })
      router.push("/")
    }
  },
  { immediate: true }
)

interface AdminNavItem {
  value: string
  label: string
  icon: typeof LucideLayoutDashboard
  path: string
  superOnly?: boolean
}

const navItems: AdminNavItem[] = [
  { value: "dashboard", label: "仪表盘", icon: LucideLayoutDashboard, path: "/admin/dashboard" },
  { value: "users", label: "用户管理", icon: LucideUsers, path: "/admin/users" },
  { value: "oauth", label: "OAuth客户端", icon: LucideKeyRound, path: "/admin/oauth-clients" },
  { value: "logs", label: "系统日志", icon: LucideScrollText, path: "/admin/logs" },
  { value: "upload-logs", label: "上传日志", icon: LucideCloudUpload, path: "/admin/upload-logs" },
  { value: "content", label: "内容运营", icon: LucideFileEdit, path: "/admin/content" },
  { value: "config", label: "系统配置", icon: LucideCog, path: "/admin/config", superOnly: true },
  { value: "game-bindings", label: "游戏绑定", icon: LucideGamepad2, path: "/admin/game-bindings" },
  { value: "sessions", label: "会话管理", icon: LucideMonitor, path: "/admin/sessions" },
  { value: "risk", label: "风控管理", icon: LucideShieldAlert, path: "/admin/risk" },
  { value: "tickets", label: "工单管理", icon: LucideTicket, path: "/admin/tickets" },
]

const visibleNavItems = computed(() =>
  navItems.filter(item => !item.superOnly || userStore.isSuperAdmin)
)

const activeTab = computed(() => {
  const path = route.path
  const matched = navItems.find(item => path.startsWith(item.path))
  return matched?.value || "dashboard"
})

function onTabChange(value: string | number) {
  const item = navItems.find(i => i.value === String(value))
  if (item) {
    router.push(item.path)
  }
}
</script>

<template>
  <div class="w-full max-w-7xl mx-auto flex flex-col gap-4" v-if="userStore.isAdmin">
    <div class="flex items-center gap-3">
      <h1 class="text-2xl font-bold tracking-tight">管理后台</h1>
    </div>

    <Tabs :model-value="activeTab" @update:model-value="onTabChange" class="w-full">
      <TabsList class="w-full flex overflow-x-auto overflow-y-hidden justify-start h-auto gap-1 bg-muted/50 p-1 rounded-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <TabsTrigger
          v-for="item in visibleNavItems"
          :key="item.value"
          :value="item.value"
          class="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm whitespace-nowrap shrink-0"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" />
          <span class="inline">{{ item.label }}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>

    <div class="flex-1">
      <router-view v-slot="{ Component }">
        <Transition name="page-blur-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
  </div>
</template>
