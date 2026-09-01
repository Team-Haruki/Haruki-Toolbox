<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideScrollText } from "lucide-vue-next"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"

/** Summary + description text from `gachaInformation` (markup already stripped). */
defineProps<{
  summary: string
  description: string
  loading: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <CatalogDetailSection
    :title="t('gachaCatalog.information.title')"
    :icon="LucideScrollText"
    collapsible
    :default-open="false"
    :loading="loading"
    :empty="!summary && !description"
    :empty-message="t('gachaCatalog.information.empty')"
    content-class="flex flex-col gap-4"
  >
    <section v-if="summary" class="flex flex-col gap-1.5">
      <h3 class="text-sm font-medium">{{ t("gachas.detail.summary") }}</h3>
      <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{{ summary }}</p>
    </section>
    <section v-if="description" class="flex flex-col gap-1.5">
      <h3 class="text-sm font-medium">{{ t("gachas.detail.description") }}</h3>
      <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{{ description }}</p>
    </section>
  </CatalogDetailSection>
</template>
