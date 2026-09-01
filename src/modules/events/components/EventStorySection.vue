<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideScrollText } from "lucide-vue-next"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import type { EventStory } from "@/modules/events/lib/event-extras"

/**
 * Story outline and episode list. Collapsible and closed by default; parents
 * hide the section entirely when the region ships no `eventStories`.
 */
defineProps<{
  story: EventStory
}>()

const { t } = useI18n()
</script>

<template>
  <CatalogDetailSection
    :title="t('eventCatalog.story.title')"
    :icon="LucideScrollText"
    collapsible
    :default-open="false"
    content-class="flex flex-col gap-4"
  >
    <template #summary>
      {{ t("eventCatalog.story.episodeCount", { count: story.episodes.length }) }}
    </template>
    <p v-if="story.outline" class="text-sm leading-relaxed whitespace-pre-line">{{ story.outline }}</p>
    <ol v-if="story.episodes.length > 0" class="flex flex-col gap-1.5 text-sm">
      <li v-for="episode in story.episodes" :key="episode.id" class="flex items-baseline gap-2">
        <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
          {{ t("eventCatalog.story.episode", { no: episode.episodeNo }) }}
        </span>
        <span class="min-w-0">{{ episode.title }}</span>
      </li>
    </ol>
  </CatalogDetailSection>
</template>
