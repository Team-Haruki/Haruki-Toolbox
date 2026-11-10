<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import type { Component } from "vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsLinkRow from "@/shared/components/settings/SettingsLinkRow.vue"
import { KeyRound, Laptop2, Link2, ShieldCheck } from "lucide-vue-next"

const router = useRouter()
const { t } = useI18n()

type SecurityRow = {
  key: string
  icon: Component
  titleKey: string
  descriptionKey: string
  onClick: () => void
}

// The identity-settings pages show an interstitial ("taking you to the
// identity service…") and probe the host before leaving the toolbox, so the
// rows navigate there instead of assigning location themselves.
function openIdentitySection(routeName: string) {
  void router.push({ name: routeName })
}

const rows: SecurityRow[] = [
  {
    key: "password",
    icon: KeyRound,
    titleKey: "userSettings.password.title",
    descriptionKey: "userSettings.password.kratosManagedDescription",
    onClick: () => openIdentitySection("user.identityPasswordSettings"),
  },
  {
    key: "mfa",
    icon: ShieldCheck,
    titleKey: "userSettings.mfa.title",
    descriptionKey: "userSettings.mfa.description",
    onClick: () => openIdentitySection("user.identityMfaSettings"),
  },
  {
    key: "social",
    icon: Link2,
    titleKey: "userSettings.social.title",
    descriptionKey: "userSettings.social.description",
    onClick: () => openIdentitySection("user.identitySocialSettings"),
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
  <SettingsGroup :title="t('userSettings.securityCard.title')" surface="card" data-testid="account-security">
    <SettingsLinkRow
      v-for="row in rows"
      :key="row.key"
      :icon="row.icon"
      :label="t(row.titleKey)"
      :help="t(row.descriptionKey)"
      :data-row="row.key"
      @click="row.onClick"
    />
  </SettingsGroup>
</template>
