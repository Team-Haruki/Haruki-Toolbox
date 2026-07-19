<script setup lang="ts">
import { useI18n } from "vue-i18n"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"

const { t } = useI18n()

const tabs = [
  { name: "training.challenge", labelKey: "training.tabs.challenge" },
  { name: "training.power", labelKey: "training.tabs.power" },
  { name: "training.area", labelKey: "training.tabs.area" },
  { name: "training.bonds", labelKey: "training.tabs.bonds" },
  { name: "training.leader", labelKey: "training.tabs.leader" },
  { name: "training.missions", labelKey: "training.tabs.missions" },
] as const
</script>

<template>
  <div class="w-full max-w-6xl mx-auto flex flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("training.layout.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("training.layout.description") }}</p>
      </div>
      <GameAccountSelect />
    </div>

    <nav class="flex flex-wrap gap-1 border-b border-border" :aria-label="t('training.layout.title')">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.name"
        :to="{ name: tab.name }"
        class="rounded-t-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        active-class="border-b-2 border-primary font-medium text-foreground"
      >
        {{ t(tab.labelKey) }}
      </RouterLink>
    </nav>

    <RouterView />
  </div>
</template>
