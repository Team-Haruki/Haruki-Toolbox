<script setup lang="ts">
import 'vue-sonner/style.css'
import {useRoute} from 'vue-router'
import {useColorMode} from '@vueuse/core'
import harukiLogo from "@/assets/haruki.ico"
import {computed, watch, onMounted} from 'vue'
import {Toaster} from '@/components/ui/sonner'
import {Separator} from '@/components/ui/separator'
import SidebarUser from "@/components/SidebarUser.vue";
import type {SidebarProps} from '@/components/ui/sidebar'

import {
  LucideMap,
  LucideInfo,
  LucideHome,
  LucideWrench,
  LucideCalculator,
  LucideNavigation,
  LucideUploadCloud,
  LucideChevronRight,
  LucideArrowDownToLine
} from 'lucide-vue-next'
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from '@/components/ui/select'
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar"

import {
  Sidebar,
  SidebarMenu,
  SidebarRail,
  SidebarInset,
  SidebarGroup,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarContent,
  SidebarProvider,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarMenuButton,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'


const route = useRoute()
const mode = useColorMode()
const pageTitle = computed(() => route.meta.title || '主页')
watch(() => route.meta.title, (newTitle) => {
  document.title = newTitle ? `${newTitle} | Haruki工具箱` : 'Haruki工具箱'
}, {immediate: true})

onMounted(() => {
  document.title = route.meta.title ? `${route.meta.title} | Haruki工具箱` : 'Haruki工具箱'
})

const showPageTitle = computed(() => {
  const title = String(pageTitle.value || "")
  return title.length <= 10
})

const props = defineProps<SidebarProps>()

interface NavSubItem {
  title: string
  icon?: any
  url: string
}

interface NavItem {
  title: string
  icon?: any
  url?: string
  isActive?: boolean
  items?: NavSubItem[]
}

const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: "推荐与关于",
      icon: LucideNavigation,
      url: "#",
      isActive: false,
      items: [
        {
          title: "推荐群聊",
          icon: LucideMap,
          url: "/friend-groups",
        },
        {
          title: "友情链接",
          icon: LucideMap,
          url: "/friend-links",
        },
        {
          title: "关于",
          icon: LucideInfo,
          url: "/about",
        },
      ],
    },
    {
      title: "工具",
      icon: LucideWrench,
      url: "#",
      isActive: false,
      items: [
        {
          title: "活动Pt控分计算器",
          icon: LucideCalculator,
          url: "/pt-calculator",
        },
        {
          title: "上传数据",
          icon: LucideUploadCloud,
          url: "/upload-data",
        },
        {
          title: "iOS模块安装",
          icon: LucideArrowDownToLine,
          url: "/ios-modules",
        },
      ],
    },
  ]
}

</script>

<template>
  <SidebarProvider>
    <Sidebar v-bind="props">
      <SidebarHeader class="border-b px-3 py-2 h-13 justify-center items-center">
        <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar class="w-9 h-9 ring-2 ring-muted">
            <AvatarImage :src="harukiLogo" alt="@haruki"/>
            <AvatarFallback>HT</AvatarFallback>
          </Avatar>
          <span class="text-xl font-semibold tracking-tight">Haruki工具箱</span>
        </router-link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuItem>
            <SidebarMenuButton as-child>
              <router-link to="/" class="flex items-center gap-2">
                <LucideHome/>
                <span>首页</span>
              </router-link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarGroupLabel>HarukiBot相关</SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible
                v-for="item in data.navMain"
                :key="item.title"
                as-child
                :default-open="item.isActive"
                class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="item.title">
                    <component :is="item.icon" v-if="item.icon"/>
                    <span>{{ item.title }}</span>
                    <LucideChevronRight
                        class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"/>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="subItem in item.items || []" :key="subItem.title">
                      <SidebarMenuSubButton as-child>
                        <router-link
                            v-if="subItem.url"
                            :to="subItem.url"
                            class="flex items-center gap-2"
                        >
                          <component :is="subItem.icon" v-if="subItem.icon"/>
                          <span>{{ subItem.title }}</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarUser/>
      </SidebarFooter>
      <SidebarRail/>
    </Sidebar>

    <SidebarInset>
      <header
          class="sticky top-0 z-40 flex h-13 items-center border-b px-4 gap-2 text-base-content
         bg-gray-200 dark:bg-cyan-900 overflow-hidden flex-nowrap"
      >
        <SidebarTrigger class="flex-shrink-0"/>
        <div class="flex items-center flex-shrink-0 whitespace-nowrap">
          <router-link to="/" class="flex items-center flex-shrink-0 whitespace-nowrap">
            <div class="text-lg font-bold leading-none flex-shrink-0 whitespace-nowrap">
              Haruki工具箱
            </div>
          </router-link>
        </div>
        <Separator
            orientation="vertical"
            class="mx-1 !h-6 bg-blue-300 dark:bg-cyan-700 hidden sm:inline-flex"
        />
        <div
            v-if="showPageTitle"
            class="hidden sm:block text-lg font-semibold truncate whitespace-nowrap overflow-hidden min-w-0 pl-1"
        >
          {{ pageTitle }}
        </div>
        <div class="flex-1 min-w-0"></div>
        <Select v-model="mode" class="flex-shrink-0">
          <SelectTrigger class="w-[105px] ml-auto">
            <SelectValue placeholder="主题模式"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">浅色主题</SelectItem>
            <SelectItem value="dark">深色主题</SelectItem>
            <SelectItem value="auto">自动主题</SelectItem>
          </SelectContent>
        </Select>
      </header>

      <main class="flex-1 auto">
        <div class="flex flex-col items-center p-6 min-h-full">
          <router-view v-slot="{ Component }">
            <Transition name="page-blur-fade" mode="out-in">
              <component :is="Component"/>
            </Transition>
          </router-view>
          <Toaster
              position="bottom-right"
              richColors
          />
        </div>

      </main>

      <SidebarFooter class="border-t p-2 text-center text-sm text-muted-foreground bg-fuchsia-50 dark:bg-gray-800">
        &copy; 2025 Haruki Dev Team. All rights reserved.
      </SidebarFooter>
    </SidebarInset>
  </SidebarProvider>
</template>