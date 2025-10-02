<script setup lang="ts">
import {computed} from "vue"
import {logout} from "@/components/users/data/api";
import {useUserStore} from "@/components/users/data/store";

import {
  ChevronsUpDown,
  LogOut,
  LogIn,
  Settings,
  Gamepad2
} from "lucide-vue-next"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
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

const userStore = useUserStore();
const {isMobile} = useSidebar()

function handleLogout() {
  logout();
}

const maskedEmail = computed(() => {
  const email = userStore.emailInfo?.email
  if (!email) return ""
  const [local, domain] = email.split("@")
  if (!domain) return email
  const maskedLocal = local.length > 1 ? local[0] + "*".repeat(local.length - 1) : local
  return `${maskedLocal}@${domain}`
})

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
              <AvatarImage
                  v-if="userStore.isLoggedIn && userStore.avatarPath"
                  :src="userStore.avatarPath || ''"
                  :alt="userStore.name ?? ''"
              />
              <AvatarFallback class="rounded-lg">
                {{ userStore.isLoggedIn ? userStore.name?.charAt(0) : "未" }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-semibold">{{ userStore.name }}</span>
              <span v-if="userStore.emailInfo" class="truncate text-xs">{{ maskedEmail }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4"/>
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
                <AvatarImage v-if="userStore.isLoggedIn && userStore.avatarPath"
                             :src="userStore.avatarPath || ''"
                             :alt="userStore.name ?? ''"/>
                <AvatarFallback class="rounded-lg">
                  {{ userStore.isLoggedIn ? userStore.name?.charAt(0) : "未" }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
        <span class="truncate font-semibold">
          {{ userStore.isLoggedIn ? userStore.name : "未登录" }}
        </span>
                <span v-if="userStore.isLoggedIn && userStore.emailInfo?.email" class="truncate text-xs">
          {{ userStore.emailInfo.email }}
        </span>
              </div>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator/>
          <RouterLink v-if="userStore.isLoggedIn" to="/user/settings" custom v-slot="{ navigate, href }">
            <DropdownMenuItem :as="'a'" :href="href" @click="navigate">
              <Settings class="mr-2 h-4 w-4"/>
              帐号设置
            </DropdownMenuItem>
          </RouterLink>
          <RouterLink v-if="userStore.isLoggedIn" to="/user/game-account-bindings" custom v-slot="{ navigate, href }">
            <DropdownMenuItem :as="'a'" :href="href" @click="navigate">
              <Gamepad2 class="mr-2 h-4 w-4"/>
              游戏账号管理
            </DropdownMenuItem>
          </RouterLink>
          <DropdownMenuSeparator v-if="userStore.isLoggedIn"/>

          <DropdownMenuItem v-if="userStore.isLoggedIn" @click="handleLogout">
            <LogOut class="mr-2 h-4 w-4"/>
            注销
          </DropdownMenuItem>
          <RouterLink v-else to="/user/login" custom v-slot="{ navigate, href }">
            <DropdownMenuItem :as="'a'" :href="href" @click="navigate">
              <LogIn class="mr-2 h-4 w-4"/>
              登录
            </DropdownMenuItem>
          </RouterLink>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>