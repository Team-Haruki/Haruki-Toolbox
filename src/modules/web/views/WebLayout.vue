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
  pendingUserTicketCount,
  isNavGroupOpen,
  setNavGroupOpen,
} = useWebLayout()
</script>

<template>
  <SidebarProvider>
    <Sidebar
      v-bind="props"
      class="border-r border-white/45 bg-white/55 bg-gradient-to-b from-white/72 via-white/52 to-white/36 shadow-none backdrop-blur-2xl supports-[backdrop-filter]:bg-white/42 dark:border-white/10 dark:bg-slate-950/34 dark:from-slate-950/62 dark:via-slate-900/38 dark:to-slate-950/46 dark:supports-[backdrop-filter]:bg-slate-950/26 [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-white/45 [&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-white/72 [&_[data-sidebar=sidebar]]:via-white/52 [&_[data-sidebar=sidebar]]:to-white/36 [&_[data-sidebar=sidebar]]:shadow-[inset_-1px_0_0_rgba(255,255,255,0.48)] [&_[data-sidebar=sidebar]]:backdrop-blur-2xl dark:[&_[data-sidebar=sidebar]]:border-white/10 dark:[&_[data-sidebar=sidebar]]:from-slate-950/62 dark:[&_[data-sidebar=sidebar]]:via-slate-900/38 dark:[&_[data-sidebar=sidebar]]:to-slate-950/46 dark:[&_[data-sidebar=sidebar]]:shadow-[inset_-1px_0_0_rgba(255,255,255,0.08)]"
    >
      <SidebarHeader class="border-b border-white/45 px-3 py-2 h-13 justify-center items-center bg-white/25 dark:border-white/10 dark:bg-white/[0.03]">
        <router-link to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar class="w-9 h-9 ring-2 ring-muted">
            <AvatarImage :src="harukiLogo" alt="@haruki"/>
            <AvatarFallback>HT</AvatarFallback>
          </Avatar>
          <span class="text-xl font-semibold tracking-tight">{{ t("app.name") }}</span>
        </router-link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup class="flex-none">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <router-link to="/" class="flex items-center gap-2">
                  <LucideHome></LucideHome>
                  <span>{{ t("webLayout.nav.home") }}</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

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

          <SidebarMenu>
            <SidebarMenuItem v-if="userStore.isAdmin">
              <SidebarMenuButton as-child>
                <router-link to="/admin" class="flex items-center gap-2">
                  <LucideShieldCheck></LucideShieldCheck>
                  <span>{{ t("webLayout.nav.admin") }}</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem v-if="userStore.isLoggedIn">
              <SidebarMenuButton as-child>
                <router-link to="/tickets" class="flex items-center gap-2">
                  <LucideTicket></LucideTicket>
                  <span>{{ t("webLayout.nav.myTickets") }}</span>
                  <span
                    v-if="pendingUserTicketCount !== null && pendingUserTicketCount > 0"
                    class="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground"
                    :title="t('webLayout.nav.pendingTicketReplies', { total: pendingUserTicketCount })"
                  >
                    {{ pendingUserTicketCount > 99 ? "99+" : pendingUserTicketCount }}
                  </span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <router-link to="/settings" class="flex items-center gap-2">
                  <LucideSettings></LucideSettings>
                  <span>{{ t("webLayout.nav.settings") }}</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
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
          data-glass-surface="topbar"
          class="sticky top-0 z-40 flex h-13 items-center border-b border-white/55 px-4 gap-2 text-base-content bg-white/58 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.9)] backdrop-blur-md supports-[backdrop-filter]:bg-white/44 dark:border-white/10 dark:bg-slate-950/52 dark:shadow-[0_12px_32px_-26px_rgba(34,211,238,0.35)] dark:supports-[backdrop-filter]:bg-slate-950/38 overflow-hidden flex-nowrap"
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
            class="mx-1 !h-6 bg-slate-300/70 dark:bg-cyan-400/25 hidden sm:inline-flex"
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

      <SidebarFooter
        data-glass-surface="footer"
        class="border-t border-white/55 bg-white/50 p-2 text-center text-sm text-muted-foreground backdrop-blur-sm supports-[backdrop-filter]:bg-white/34 dark:border-white/10 dark:bg-slate-950/42 dark:supports-[backdrop-filter]:bg-slate-950/28"
      >
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
