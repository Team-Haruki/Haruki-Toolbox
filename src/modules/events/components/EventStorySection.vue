<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucidePlay, LucideScrollText } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { buildStoryPlayerLink } from "@/modules/story"
import type { EventStory } from "@/modules/events/lib/event-extras"

/**
 * Story outline and episode list. Collapsible and closed by default; parents
 * hide the section entirely when the region ships no `eventStories`.
 */
defineProps<{
  story: EventStory
  /** The event has started, so its episodes can open in the story player. */
  playable: boolean
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
      <li v-for="episode in story.episodes" :key="episode.id" class="flex items-center gap-2">
        <span class="shrink-0 text-xs text-muted-foreground tabular-nums">
          {{ t("eventCatalog.story.episode", { no: episode.episodeNo }) }}
        </span>
        <span class="min-w-0 flex-1">{{ episode.title }}</span>
        <Button v-if="playable && episode.scenarioId" as-child variant="ghost" size="sm" class="h-7 shrink-0 px-2">
          <RouterLink :to="buildStoryPlayerLink(episode.scenarioId)">
            <LucidePlay class="size-3.5" />
            {{ t("eventCatalog.story.play") }}
          </RouterLink>
        </Button>
      </li>
    </ol>
  </CatalogDetailSection>
</template>
