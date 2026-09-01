<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LockOpen } from "lucide-vue-next"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import type { MusicReleaseCondition } from "@/modules/music-library/lib/music-extras"

/** `releaseConditions` sentence; the parent hides the section when the file is empty. */
defineProps<{
  condition: MusicReleaseCondition
}>()

const { t } = useI18n()
</script>

<template>
  <CatalogDetailSection
    :title="t('musicCatalog.detail.unlock.title')"
    :icon="LockOpen"
    collapsible
    :default-open="false"
  >
    <p class="text-sm leading-relaxed">{{ condition.sentence }}</p>
  </CatalogDetailSection>
</template>
