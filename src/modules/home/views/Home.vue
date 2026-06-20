<script setup lang="ts">
import { GitHubIcon } from "vue3-simple-icons"
import { Button } from "@/components/ui/button"
import { useI18n } from "vue-i18n"

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent
} from "@/components/ui/card"
import {
  LogIn,
  Settings,
  Gamepad2,
  UserPlus,
  LucideBot,
  ShieldCheck,
  FileText,
  LucideNavigation,
  Heart,
} from "lucide-vue-next"

import { computed } from "vue"
import { useUserStore } from "@/shared/stores/user"
import { WEB_NAV_ITEMS } from "@/config/navigation"
const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col flex-grow gap-6 w-full px-0 py-4 max-w-5xl mx-auto justify-center">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold">{{ t("home.title") }}</h1>
      <p class="text-lg text-muted-foreground mt-2">{{ t("home.description") }}</p>
    </div>

    <!-- Elegant Guide Banner for About/Sponsorship -->
    <router-link to="/sponsors" class="max-w-md mx-auto w-full group block outline-none -mt-2">
      <div class="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 transition-all duration-300 hover:border-primary/45 hover:bg-primary/8 hover:shadow-[0_0_15px_rgba(var(--primary),0.08)]">
        <div class="absolute -right-4 -bottom-4 opacity-5 transition-transform duration-500 group-hover:scale-110">
          <Heart class="w-24 h-24 text-primary fill-current" />
        </div>
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform duration-300">
            <Heart class="h-5 w-5 fill-primary/10 group-hover:fill-primary/20 transition-colors" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                {{ t("home.aboutBanner.badge") }}
              </span>
            </div>
            <p class="text-xs font-bold text-foreground/95 mt-1.5 leading-snug">
              {{ t("home.aboutBanner.title") }}
            </p>
            <p class="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <span>{{ t("home.aboutBanner.desc") }}</span>
              <span class="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </p>
          </div>
        </div>
      </div>
    </router-link>

    <Card v-for="group in WEB_NAV_ITEMS" :key="group.titleKey" class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>{{ t(group.titleKey) }}</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <router-link v-for="item in group.items" :key="item.url" :to="item.url" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <component :is="item.icon || LucideNavigation" class="w-5 h-5" />
            <span class="whitespace-normal">{{ t(item.titleKey) }}</span>
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>{{ t("home.accountAndSettings") }}</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <router-link v-if="!isLoggedIn" to="/user/register" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <UserPlus class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.register") }}</span>
          </Button>
        </router-link>
        <router-link v-if="!isLoggedIn" to="/user/login" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LogIn class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.login") }}</span>
          </Button>
        </router-link>
        <router-link to="/user/settings" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <Settings class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.accountSettings") }}</span>
          </Button>
        </router-link>
        <router-link to="/user/game-account-bindings" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <Gamepad2 class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.gameAccountManagement") }}</span>
          </Button>
        </router-link>
      </CardContent>
    </Card>

    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>{{ t("home.externalLinks") }}</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <a href="https://neo.haruki.seiunx.com" target="_blank" rel="noopener noreferrer" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <LucideBot class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.harukiBotDocs") }}</span>
          </Button>
        </a>
        <a href="https://github.com/Team-Haruki" target="_blank" rel="noopener noreferrer" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <GitHubIcon class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.harukiGithub") }}</span>
          </Button>
        </a>
      </CardContent>
    </Card>

    <Card class="max-w-md mx-auto w-full">
      <CardHeader>
        <CardTitle>{{ t("home.legalLinks") }}</CardTitle>
      </CardHeader>
      <CardContent class="grid grid-cols-2 gap-4 items-stretch">
        <router-link to="/privacy" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <ShieldCheck class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.privacyPolicy") }}</span>
          </Button>
        </router-link>
        <router-link to="/tos" class="flex">
          <Button variant="outline" class="flex-1 h-auto w-full flex items-center gap-2 truncate text-sm whitespace-normal">
            <FileText class="w-5 h-5"/>
            <span class="whitespace-normal">{{ t("home.termsOfService") }}</span>
          </Button>
        </router-link>
      </CardContent>
    </Card>
  </div>
</template>
