<script setup lang="ts">
import {Separator} from '@/components/ui/separator'
import type {SidebarProps} from '@/components/ui/sidebar'
import { useI18n } from "vue-i18n"
import SidebarUser from "@/modules/user/components/SidebarUser.vue";
import { useWebLayout } from "@/modules/web/composables/useWebLayout"
import { WEB_NAV_ITEMS } from "@/config/navigation"

import {
  LucideHome,
  LucideSettings,
  LucideChevronRight,
  LucideShieldCheck,
  LucideTicket,
} from 'lucide-vue-next'
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

const props = defineProps<SidebarProps>()
const { t } = useI18n()
const {
  harukiLogo,
  userStore,
  pageTitle,
  showPageTitle,
  copyrightYear,
  isNavGroupOpen,
  setNavGroupOpen,
} = useWebLayout()
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
          <span class="text-xl font-semibold tracking-tight">{{ t("app.name") }}</span>
        </router-link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenuItem>
            <SidebarMenuButton as-child>
              <router-link to="/" class="flex items-center gap-2">
                <LucideHome/>
                <span>{{ t("webLayout.nav.home") }}</span>
              </router-link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarGroupLabel>{{ t("webLayout.nav.harukiBotGroup") }}</SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible
                v-for="item in WEB_NAV_ITEMS"
                :key="item.titleKey"
                as-child
                :open="isNavGroupOpen(item)"
                @update:open="setNavGroupOpen(item, $event)"
                class="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton :tooltip="t(item.titleKey)">
                    <component :is="item.icon" v-if="item.icon"/>
                    <span>{{ t(item.titleKey) }}</span>
                    <LucideChevronRight
                        class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"/>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem v-for="subItem in item.items || []" :key="subItem.titleKey">
                      <SidebarMenuSubButton as-child>
                        <router-link
                            v-if="subItem.url"
                            :to="subItem.url"
                            class="flex items-center gap-2"
                        >
                          <component :is="subItem.icon" v-if="subItem.icon"/>
                          <span>{{ t(subItem.titleKey) }}</span>
                        </router-link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
          <SidebarMenuItem v-if="userStore.isAdmin">
            <SidebarMenuButton as-child>
              <router-link to="/admin" class="flex items-center gap-2">
                <LucideShieldCheck/>
                <span>{{ t("webLayout.nav.admin") }}</span>
              </router-link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem v-if="userStore.isLoggedIn">
            <SidebarMenuButton as-child>
              <router-link to="/tickets" class="flex items-center gap-2">
                <LucideTicket/>
                <span>{{ t("webLayout.nav.myTickets") }}</span>
              </router-link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton as-child>
              <router-link to="/settings" class="flex items-center gap-2">
                <LucideSettings/>
                <span>{{ t("webLayout.nav.settings") }}</span>
              </router-link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
              {{ t("app.name") }}
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
      </header>

      <main class="flex-1 auto">
        <div class="flex flex-col items-center p-6 min-h-full">
          <router-view v-slot="{ Component, route }">
            <Transition name="page-blur-fade" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </router-view>
        </div>

      </main>

      <SidebarFooter class="border-t p-2 text-center text-sm text-muted-foreground bg-fuchsia-50 dark:bg-gray-800">
        <div class="flex flex-wrap items-center justify-center gap-2">
          <span>&copy; {{ copyrightYear }} {{ t("webLayout.footer.copyright") }}</span>
          <span aria-hidden="true">|</span>
          <router-link to="/privacy" class="underline-offset-4 hover:underline">
            {{ t("webLayout.footer.privacyPolicy") }}
          </router-link>
          <span aria-hidden="true">|</span>
          <router-link to="/tos" class="underline-offset-4 hover:underline">
            {{ t("webLayout.footer.termsOfService") }}
          </router-link>
        </div>
      </SidebarFooter>
    </SidebarInset>
  </SidebarProvider>
</template>
