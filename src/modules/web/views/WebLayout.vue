<script setup lang="ts">
import {Separator} from '@/components/ui/separator'
import type {SidebarProps} from '@/components/ui/sidebar'
import { useI18n } from "vue-i18n"
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from "vue"
import SidebarUser from "@/modules/user/components/SidebarUser.vue";
import { useWebLayout } from "@/modules/web/composables/useWebLayout"
import { WEB_NAV_SECTIONS } from "@/config/navigation"

import HomeSettingsDialog from "@/modules/home/components/HomeSettingsDialog.vue"

// The command palette (and its pinyin/search machinery) stays off the layout's
// critical path: the chunk loads on first open intent (button or hotkey).
const GlobalSearchDialog = defineAsyncComponent(() =>
  import("@/modules/search").then((mod) => mod.GlobalSearchDialog),
)

import {
  LucideHome,
  LucideChevronRight,
  LucideInfo,
  LucideSearch,
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
  SidebarGroupLabel,
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
const searchRequested = ref(false)
const globalSearchDialog = ref<{ open: () => void } | null>(null)

function openGlobalSearch() {
  if (globalSearchDialog.value) {
    globalSearchDialog.value.open()
    return
  }

  searchRequested.value = true
  const stopWaiting = watch(globalSearchDialog, (dialog) => {
    if (dialog) {
      stopWaiting()
      dialog.open()
    }
  })
}

// Keep Cmd/Ctrl+K working before the dialog chunk has ever been loaded; once
// mounted, the dialog registers its own hotkey handler.
function onSearchHotkey(event: KeyboardEvent) {
  if (searchRequested.value) {
    return
  }
  if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k") {
    event.preventDefault()
    openGlobalSearch()
  }
}

onMounted(() => window.addEventListener("keydown", onSearchHotkey))
onBeforeUnmount(() => window.removeEventListener("keydown", onSearchHotkey))

function openAppSettings() {
  homeSettingsDialogTab.value = "app"
  homeSettingsDialogOpen.value = true
}
</script>

<template>
  <SidebarProvider>
    <!-- Visuals come from the data-glass-surface system in style.css. -->
    <Sidebar v-bind="props" data-glass-surface="sidebar" class="border-r">
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

          <template v-for="section in WEB_NAV_SECTIONS" :key="section.titleKey ?? section.items[0]?.titleKey">
            <SidebarGroupLabel v-if="section.titleKey">{{ t(section.titleKey) }}</SidebarGroupLabel>
            <SidebarMenu>
              <template v-for="item in section.items" :key="item.titleKey">
                <Collapsible
                    v-if="item.items"
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
                        <SidebarMenuSubItem v-for="subItem in item.items" :key="subItem.titleKey">
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
                <SidebarMenuItem v-else-if="item.url">
                  <SidebarMenuButton as-child :tooltip="t(item.titleKey)">
                    <router-link :to="item.url" class="flex items-center gap-2">
                      <component :is="item.icon" v-if="item.icon"/>
                      <span>{{ t(item.titleKey) }}</span>
                    </router-link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </template>
            </SidebarMenu>
          </template>

          <template v-if="userStore.isLoggedIn">
            <SidebarGroupLabel>{{ t("navigation.groups.accountManagement") }}</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem v-if="userStore.isAdmin">
                <SidebarMenuButton as-child>
                  <router-link to="/admin" class="flex items-center gap-2">
                    <LucideShieldCheck></LucideShieldCheck>
                    <span>{{ t("webLayout.nav.admin") }}</span>
                  </router-link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
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
          </template>
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
          class="sticky top-0 z-40 flex h-13 items-center px-4 gap-2 text-base-content overflow-hidden flex-nowrap border-b"
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
          <button
            type="button"
            class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            :aria-label="t('globalSearch.title')"
            :title="t('globalSearch.title')"
            @click="openGlobalSearch"
          >
            <LucideSearch class="size-4.5" />
          </button>
          <GlobalSearchDialog v-if="searchRequested" ref="globalSearchDialog" />
          <HomeSettingsDialog v-model:open="homeSettingsDialogOpen" v-model:tab="homeSettingsDialogTab" />
        </div>
      </header>

      <main class="flex flex-1 flex-col">
        <div class="flex flex-1 flex-col items-center px-4 py-3 sm:p-4 xl:p-6">
          <router-view v-slot="{ Component, route }">
            <Transition name="page-fade" mode="out-in">
              <!-- Keyed by path: query-only changes (filters, tabs, pagination)
                   update in place instead of remounting the whole page. -->
              <component :is="Component" :key="route.path" />
            </Transition>
          </router-view>
        </div>

      </main>

      <SidebarFooter
        data-glass-surface="footer"
        class="px-6 py-2.5 text-sm text-muted-foreground md:px-12 border-t"
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
