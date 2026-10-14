<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { LucideInfo, LucideExternalLink } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import {
  IMAuthorization,
  IMBindingSettings,
} from "@/modules/user-settings/components/settings"

const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <div class="w-full max-w-2xl space-y-1">
      <h2 class="text-lg font-semibold">{{ t("userSettings.sections.harukiBotTitle") }}</h2>
      <p class="text-sm text-muted-foreground">{{ t("userSettings.sections.harukiBotDescription") }}</p>
    </div>

    <div class="w-full max-w-2xl flex flex-col gap-4">
      <Alert variant="default" class="flex items-start gap-2 bg-muted/20">
        <LucideInfo class="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
        <div class="space-y-2 w-full">
          <AlertTitle>{{ t("userSettings.officialBotGuide.title") }}</AlertTitle>
          <AlertDescription class="leading-relaxed text-muted-foreground">
            {{ t("userSettings.officialBotGuide.description") }}
          </AlertDescription>
          <Button as-child variant="outline" size="sm" class="max-w-full whitespace-normal h-auto min-h-8">
            <a
              href="https://neo.haruki.seiunx.com/toolbox-tutorial/qqofficial-guide.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t("userSettings.officialBotGuide.action") }}
              <LucideExternalLink class="h-4 w-4 shrink-0" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </Alert>
      <IMBindingSettings />
      <IMAuthorization />
    </div>
  </div>
</template>
