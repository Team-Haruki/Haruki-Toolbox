<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { useI18n } from "vue-i18n"

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent
} from "@/components/ui/card"
import {
  Settings,
  LucideNavigation,
  LucideZap,
  Heart,
} from "lucide-vue-next"

import { computed } from "vue"
import { useUserStore } from "@/shared/stores/user"
import { WEB_NAV_SECTIONS, type NavItem, type NavSubItem } from "@/config/navigation"
import PageHeader from "@/shared/components/PageHeader.vue"
import CurrentEventCard from "@/modules/home/components/CurrentEventCard.vue"
import HomeAccountCard from "@/modules/home/components/HomeAccountCard.vue"
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const { t } = useI18n()

// Chip rows are derived from the sidebar config so home never drifts from it.
const navGroups: NavItem[] = WEB_NAV_SECTIONS.flatMap((section) => section.items)
function groupItems(titleKey: string): NavSubItem[] {
  return navGroups.find((item) => item.titleKey === titleKey)?.items ?? []
}

const quickTools = groupItems("navigation.groups.eventRankingTools")
const catalogItems = groupItems("navigation.groups.sekaiCatalog")
const playerItems = groupItems("navigation.groups.sekaiPlayer")
</script>

<template>
  <div class="flex w-full max-w-6xl flex-col gap-5 px-0 py-4 mx-auto">
    <!-- Section order: guests see the account/onboarding card before the event
    dashboard; the sponsorship banner always sits below the tools. -->
    <PageHeader :title="t('home.title')" :description="t('home.description')" class="text-center sm:flex-col sm:items-center" />

    <!-- Hero: current event dashboard -->
    <CurrentEventCard :class="isLoggedIn ? 'order-1' : 'order-2'" />

    <!-- Account + event ranking tools -->
    <div :class="['grid gap-4 sm:grid-cols-2 items-stretch', isLoggedIn ? 'order-2' : 'order-1']">
      <HomeAccountCard class="h-full" />

      <Card class="w-full h-full">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <LucideZap class="h-4.5 w-4.5" />
            {{ t("navigation.groups.eventRankingTools") }}
          </CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-2 gap-2">
          <router-link v-for="tool in quickTools" :key="tool.url" :to="tool.url" class="flex">
            <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
              <component :is="tool.icon || LucideNavigation" class="w-4.5 h-4.5" />
              <span class="whitespace-normal">{{ t(tool.titleKey) }}</span>
            </Button>
          </router-link>
        </CardContent>
      </Card>
    </div>

    <!-- My game data shortcuts (logged in) -->
    <section v-if="isLoggedIn && playerItems.length" class="order-3 w-full">
      <h2 class="mb-2.5 text-sm font-semibold text-muted-foreground">{{ t("navigation.groups.sekaiPlayer") }}</h2>
      <div class="flex flex-wrap gap-2">
        <router-link v-for="item in playerItems" :key="item.url" :to="item.url" class="flex">
          <Button variant="secondary" size="sm" class="rounded-full">
            <component :is="item.icon || LucideNavigation" class="w-4 h-4" />
            {{ t(item.titleKey) }}
          </Button>
        </router-link>
        <router-link to="/user/settings" class="flex">
          <Button variant="ghost" size="sm" class="rounded-full text-muted-foreground">
            <Settings class="w-4 h-4" />
            {{ t("home.accountSettings") }}
          </Button>
        </router-link>
      </div>
    </section>

    <!-- Sekai catalog shortcuts -->
    <section v-if="catalogItems.length" class="order-4 w-full">
      <h2 class="mb-2.5 text-sm font-semibold text-muted-foreground">{{ t("navigation.groups.sekaiCatalog") }}</h2>
      <div class="flex flex-wrap gap-2">
        <router-link v-for="item in catalogItems" :key="item.url" :to="item.url" class="flex">
          <Button variant="secondary" size="sm" class="rounded-full">
            <component :is="item.icon || LucideNavigation" class="w-4 h-4" />
            {{ t(item.titleKey) }}
          </Button>
        </router-link>
      </div>
    </section>

    <!-- Guide banner for About/Sponsorship -->
    <router-link to="/sponsors" class="order-5 w-full group block outline-none rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
      <div class="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/5 p-4 transition-colors duration-300 hover:border-primary/50 hover:bg-primary/10">
        <div class="flex items-center gap-4">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-300">
            <Heart class="h-5 w-5 fill-primary/15 group-hover:fill-primary/30 transition-colors" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                {{ t("home.aboutBanner.badge") }}
              </span>
            </div>
            <p class="text-sm font-semibold text-foreground mt-1.5 leading-snug">
              {{ t("home.aboutBanner.title") }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <span>{{ t("home.aboutBanner.desc") }}</span>
              <span class="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </p>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>
