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
        <a href="https://docs.haruki.seiunx.com" target="_blank" rel="noopener noreferrer" class="flex">
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
