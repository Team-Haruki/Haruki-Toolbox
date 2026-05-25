<script setup lang="ts">
import {Separator} from '@/components/ui/separator'
import type {SidebarProps} from '@/components/ui/sidebar'
import { useI18n } from "vue-i18n"
import { ref } from "vue"
import SidebarUser from "@/modules/user/components/SidebarUser.vue";
import { useWebLayout } from "@/modules/web/composables/useWebLayout"
import { WEB_NAV_ITEMS } from "@/config/navigation"
import { useSettingsStore } from "@/shared/stores/settings"
import HomeSettingsDialog from "@/modules/home/components/HomeSettingsDialog.vue"
import { cn } from "@/lib/utils"

import {
  LucideHome,
  LucideChevronRight,
  LucideInfo,
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
const settingsStore = useSettingsStore()
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
const homeSettingsDialogOpen = ref(false)
const homeSettingsDialogTab = ref("preferences")

function openAppSettings() {
  homeSettingsDialogTab.value = "app"
  homeSettingsDialogOpen.value = true
}
</script>

<template>
  <SidebarProvider>
    <Sidebar
      v-bind="props"
      data-glass-surface="sidebar"
      :class="cn(
        settingsStore.reducedVisualEffects
          ? 'border-r border-slate-200 dark:border-slate-800 bg-sidebar [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-slate-200 dark:[&_[data-sidebar=sidebar]]:border-slate-800 [&_[data-sidebar=sidebar]]:bg-sidebar [&_[data-sidebar=sidebar]]:!bg-sidebar'
          : 'border-r border-white/60 bg-white/6 bg-gradient-to-b from-white/10 via-white/4 to-white/1 shadow-[inset_-1px_0_0_rgba(255,255,255,0.62),0_24px_70px_-54px_rgba(15,23,42,0.62)] backdrop-blur-3xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/5 dark:border-white/10 dark:bg-slate-950/8 dark:from-slate-950/15 dark:via-slate-900/4 dark:to-slate-950/2 dark:supports-[backdrop-filter]:bg-slate-950/6 [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-white/60 [&_[data-sidebar=sidebar]]:!bg-white/4 [&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-white/10 [&_[data-sidebar=sidebar]]:via-white/4 [&_[data-sidebar=sidebar]]:to-white/1 [&_[data-sidebar=sidebar]]:shadow-[inset_-1px_0_0_rgba(255,255,255,0.62)] [&_[data-sidebar=sidebar]]:backdrop-blur-3xl [&_[data-sidebar=sidebar]]:backdrop-saturate-150 dark:[&_[data-sidebar=sidebar]]:border-white/10 dark:[&_[data-sidebar=sidebar]]:!bg-slate-950/8 dark:[&_[data-sidebar=sidebar]]:from-slate-950/15 dark:[&_[data-sidebar=sidebar]]:via-slate-900/4 dark:[&_[data-sidebar=sidebar]]:to-slate-950/2 dark:[&_[data-sidebar=sidebar]]:shadow-[inset_-1px_0_0_rgba(255,255,255,0.08)]'
      )"
    >
      <SidebarHeader
        class="border-b border-slate-950/[0.06] px-3 py-2 h-13 justify-center items-center bg-transparent shadow-[inset_0_-1px_0_rgba(15,23,42,0.035)] dark:border-white/10 dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]"
      >
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
            <SidebarMenuItem>
              <SidebarMenuButton as-child>
                <router-link to="/about" class="flex items-center gap-2">
                  <LucideInfo></LucideInfo>
                  <span>{{ t("navigation.items.about") }}</span>
                </router-link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

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
          :class="cn(
            'sticky top-0 z-40 flex h-13 items-center px-4 gap-2 text-base-content overflow-hidden flex-nowrap',
            settingsStore.reducedVisualEffects
              ? 'border-b border-slate-200 dark:border-slate-800 bg-background'
              : 'border-b border-white/60 bg-white/18 shadow-[0_16px_42px_-32px_rgba(15,23,42,0.72)] backdrop-blur-2xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/12 dark:border-white/10 dark:bg-slate-950/22 dark:shadow-[0_12px_32px_-26px_rgba(34,211,238,0.30)] dark:supports-[backdrop-filter]:bg-slate-950/20'
          )"
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
        <div class="ml-auto flex shrink-0 items-center">
          <HomeSettingsDialog v-model:open="homeSettingsDialogOpen" v-model:tab="homeSettingsDialogTab" />
        </div>
      </header>

      <main class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col items-center px-4 py-3 sm:p-4 xl:p-6">
          <router-view v-slot="{ Component, route }">
            <Transition name="page-blur-fade" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </router-view>
        </div>

      </main>

      <SidebarFooter
        data-glass-surface="footer"
        :class="cn(
          'px-6 py-2.5 text-sm text-muted-foreground md:px-12',
          settingsStore.reducedVisualEffects
            ? 'border-t border-slate-200 dark:border-slate-800 bg-background'
            : 'border-t border-white/60 bg-white/16 backdrop-blur-md supports-[backdrop-filter]:bg-white/12 dark:border-white/10 dark:bg-slate-950/22 dark:supports-[backdrop-filter]:bg-slate-950/20'
        )"
      >
        <div
          class="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between"
        >
          <div class="flex flex-col items-center gap-1.5 text-center md:items-start md:text-left">
            <span class="text-sm text-foreground/75">
              &copy; {{ copyrightYear }} {{ t("webLayout.footer.copyright") }}
            </span>
            <nav
              :aria-label="t('webLayout.footer.legalLinks')"
              class="flex items-center gap-2 text-xs"
            >
              <router-link to="/privacy" class="transition-colors underline-offset-4 hover:text-foreground hover:underline">
                {{ t("webLayout.footer.privacyPolicy") }}
              </router-link>
              <span class="h-3 w-px bg-border" aria-hidden="true"></span>
              <router-link to="/tos" class="transition-colors underline-offset-4 hover:text-foreground hover:underline">
                {{ t("webLayout.footer.termsOfService") }}
              </router-link>
              <span class="h-3 w-px bg-border" aria-hidden="true"></span>
              <button
                type="button"
                class="transition-colors underline-offset-4 hover:text-foreground hover:underline"
                @click="openAppSettings"
              >
                {{ t("webLayout.footer.appVersion") }}
              </button>
            </nav>
          </div>

          <div
            class="flex w-[calc(100%+3rem)] -mx-6 flex-col gap-1 border-t border-slate-950/[0.08] px-4 pt-2 text-center text-xs md:mx-0 md:w-auto md:max-w-[34rem] md:items-end md:border-t-0 md:px-0 md:pt-0 md:text-right dark:border-white/10"
          >
            <p>{{ t("webLayout.footer.unofficialNotice") }}</p>
            <p>{{ t("webLayout.footer.assetCopyright") }}</p>
          </div>
        </div>
      </SidebarFooter>
    </SidebarInset>
  </SidebarProvider>
</template>
