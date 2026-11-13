<script setup lang="ts">
import { LucideBookOpen } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import {
  IMAuthorization,
  IMBindingSettings,
} from "@/modules/user-settings/components/settings"
import PageHeader from "@/shared/components/PageHeader.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsLinkRow from "@/shared/components/settings/SettingsLinkRow.vue"

const { t } = useI18n()
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-0 py-4">
    <PageHeader
      size="compact"
      :title="t('userSettings.sections.harukiBotTitle')" :description="t('userSettings.sections.harukiBotDescription')"
    />

    <!-- Your own QQ first. The official-bot guide sits right above the list
         its text points at ("add it below"), then who else may query. -->
    <IMBindingSettings />

    <SettingsGroup surface="card" data-testid="official-bot-guide">
      <SettingsLinkRow
        :icon="LucideBookOpen"
        :label="t('userSettings.officialBotGuide.action')"
        :help="t('userSettings.officialBotGuide.description')"
        href="https://neo.haruki.seiunx.com/toolbox-tutorial/qqofficial-guide.html"
      />
    </SettingsGroup>

    <IMAuthorization />
  </div>
</template>
