<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Clapperboard, ExternalLink } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { resolveExternalLinkHost } from "@/modules/music-library/lib/music-extras"

/** `musicOriginals` video link (jp only); the parent hides the section when absent. */
const props = defineProps<{
  link: string
}>()

const { t } = useI18n()

const host = computed(() => resolveExternalLinkHost(props.link))
</script>

<template>
  <CatalogDetailSection
    :title="t('musicCatalog.detail.original.title')"
    :icon="Clapperboard"
    collapsible
    :default-open="false"
    content-class="flex flex-col gap-2"
  >
    <template #summary>{{ host }}</template>
    <div>
      <Button as-child variant="outline" size="sm">
        <a :href="link" target="_blank" rel="noopener noreferrer">
          <ExternalLink class="size-4" />
          {{ t("musicCatalog.detail.original.open", { host: host ?? link }) }}
        </a>
      </Button>
    </div>
    <p class="font-mono text-xs break-all text-muted-foreground">{{ link }}</p>
  </CatalogDetailSection>
</template>
