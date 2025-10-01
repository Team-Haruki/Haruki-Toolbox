<script setup lang="ts">
import {
  ChevronsUpDown,
  LogOut,
  LogIn,
  Settings,
} from "lucide-vue-next"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import harukiIcon from "@/assets/haruki.ico";
import { ref } from "vue"

const isLoggedIn = ref(true)
const user = ref({
  name: "KGB",
  email: "no-reply@seiunx.com",
  avatar: harukiIcon,
})

const { isMobile } = useSidebar()

function handleLogin() {
  isLoggedIn.value = true
  user.value = {
    name: "Haruki",
    email: "user@example.com",
    avatar: "https://github.com/unovue.png",
  }
}

function handleLogout() {
  isLoggedIn.value = false
  user.value = {
    name: "未登录",
    email: "",
    avatar: "",
  }
}

function goAccountSettings() {
  alert("跳转到帐号设置页面")
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage v-if="user.avatar" :src="user.avatar" :alt="user.name" />
              <AvatarFallback class="rounded-lg">
                {{ user.name.charAt(0) }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ user.name }}</span>
              <span v-if="user.email" class="truncate text-xs">{{ user.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            :side="isMobile ? 'bottom' : 'right'"
            :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage v-if="isLoggedIn && user.avatar" :src="user.avatar" :alt="user.name" />
                <AvatarFallback class="rounded-lg">
                  {{ isLoggedIn ? user.name.charAt(0) : "未" }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
        <span class="truncate font-semibold">
          {{ isLoggedIn ? user.name : "未登录" }}
        </span>
                <span v-if="isLoggedIn && user.email" class="truncate text-xs">
          {{ user.email }}
        </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />
          <RouterLink v-if="isLoggedIn" to="/user/settings" custom v-slot="{ navigate, href }">
            <DropdownMenuItem :as="'a'" :href="href" @click="navigate">
              <Settings class="mr-2 h-4 w-4" /> 帐号设置
            </DropdownMenuItem>
          </RouterLink>
          <RouterLink v-if="isLoggedIn" to="/user/game-account-bindings" custom v-slot="{ navigate, href }">
            <DropdownMenuItem :as="'a'" :href="href" @click="navigate">
              <Settings class="mr-2 h-4 w-4" /> 游戏账号管理
            </DropdownMenuItem>
          </RouterLink>
          <DropdownMenuSeparator v-if="isLoggedIn" />

          <DropdownMenuItem v-if="isLoggedIn" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4" /> 注销
          </DropdownMenuItem>
          <DropdownMenuItem v-else @click="handleLogin">
            <LogIn class="mr-2 h-4 w-4" /> 登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>