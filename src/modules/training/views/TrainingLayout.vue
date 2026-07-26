<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useAccountUploadTime, useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"

const { t, locale } = useI18n()

const { selectedAccount } = useGameAccountSelection()
const uploadTime = useAccountUploadTime(selectedAccount)

const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(suiteUploadTimeToMillis(uploadTime.value))
})

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
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("training.layout.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("training.layout.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <GameAccountSelect />
        <p v-if="uploadTimeText" class="text-xs text-muted-foreground">
          {{ t("training.layout.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
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
