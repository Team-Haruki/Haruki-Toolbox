<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import type { Component } from "vue"
import { redirectToKratosBrowserFlow } from "@/modules/auth/lib/kratos"
import { resolveSettingsReturnTo } from "@/modules/user-settings/lib/settings-return"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { ChevronRight, KeyRound, Laptop2, Link2, ShieldCheck } from "lucide-vue-next"

const router = useRouter()
const { t } = useI18n()

type SecurityRow = {
  key: string
  icon: Component
  titleKey: string
  descriptionKey: string
  onClick: () => void
}

function openKratosSection(section: string) {
  redirectToKratosBrowserFlow("settings", {
    returnTo: resolveSettingsReturnTo(section),
  })
}

const rows: SecurityRow[] = [
  {
    key: "password",
    icon: KeyRound,
    titleKey: "userSettings.password.title",
    descriptionKey: "userSettings.password.kratosManagedDescription",
    onClick: () => openKratosSection("password"),
  },
  {
    key: "mfa",
    icon: ShieldCheck,
    titleKey: "userSettings.mfa.title",
    descriptionKey: "userSettings.mfa.description",
    onClick: () => openKratosSection("mfa"),
  },
  {
    key: "social",
    icon: Link2,
    titleKey: "userSettings.social.title",
    descriptionKey: "userSettings.social.description",
    onClick: () => openKratosSection("oidc"),
  },
  {
    key: "sessions",
    icon: Laptop2,
    titleKey: "userSettings.sessions.title",
    descriptionKey: "userSettings.sessions.description",
    onClick: () => {
      void router.push({ name: "user.identitySessionSettings" })
    },
  },
]
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <ShieldCheck class="h-5 w-5" />
        {{ t("userSettings.securityCard.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.securityCard.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <ul class="flex flex-col gap-2">
        <li v-for="row in rows" :key="row.key">
          <button
            type="button"
            class="group flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-2 focus-visible:outline-ring"
            @click="row.onClick"
          >
            <span class="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <component :is="row.icon" class="size-4.5" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium">{{ t(row.titleKey) }}</span>
              <span class="block text-xs text-muted-foreground">{{ t(row.descriptionKey) }}</span>
            </span>
            <ChevronRight class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>
