<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  Activity,
  CalendarDays,
  Clock3,
  Disc3,
  LucideInfo,
  Package,
} from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogInfoList from "@/shared/components/catalog/CatalogInfoList.vue"
import CatalogInfoRow from "@/shared/components/catalog/CatalogInfoRow.vue"
import { formatMusicDurationLabel, type MusicLibraryEntry } from "@/modules/music-library/lib/music-data"

const ALIAS_COLLAPSED_LIMIT = 16

/** Credits, release date, duration, BPM, ids and the community alias block. */
const props = defineProps<{
  entry: MusicLibraryEntry
  dateLabel: string | null
  durationSeconds: number | null
  bpmLabel: string | null
  aliases: readonly string[]
}>()

const { t } = useI18n()

const durationLabel = computed(() => formatMusicDurationLabel(props.durationSeconds))

const aliasesExpanded = ref(false)
watch(() => props.entry.id, () => {
  aliasesExpanded.value = false
})

const visibleAliases = computed(() => (
  aliasesExpanded.value ? props.aliases : props.aliases.slice(0, ALIAS_COLLAPSED_LIMIT)
))
const hiddenAliasCount = computed(() => Math.max(props.aliases.length - visibleAliases.value.length, 0))
</script>

<template>
  <CatalogDetailSection :title="t('musicCatalog.detail.sections.info')" :icon="LucideInfo" content-class="flex flex-col gap-4">
    <CatalogInfoList>
      <CatalogInfoRow :label="t('musicLibrary.detail.info.composer')">
        <span v-if="entry.composer" class="font-medium break-words">{{ entry.composer }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow :label="t('musicLibrary.detail.info.lyricist')">
        <span v-if="entry.lyricist" class="font-medium break-words">{{ entry.lyricist }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow :label="t('musicLibrary.detail.info.arranger')">
        <span v-if="entry.arranger" class="font-medium break-words">{{ entry.arranger }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow :label="t('musicLibrary.detail.info.publishedAt')" :icon="CalendarDays">
        <span v-if="dateLabel" class="font-medium">{{ dateLabel }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow v-if="durationLabel" :label="t('musicLibrary.detail.info.duration')" :icon="Clock3">
        <span class="font-medium tabular-nums">{{ durationLabel }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow v-if="bpmLabel" :label="t('musicLibrary.detail.info.bpm')" :icon="Activity">
        <span class="font-medium break-words tabular-nums">{{ bpmLabel }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow :label="t('musicLibrary.detail.info.id')" :icon="Disc3">
        <span class="font-mono">#{{ entry.id }}</span>
      </CatalogInfoRow>
      <CatalogInfoRow :label="t('catalog.detail.assetName')" :icon="Package">
        <span v-if="entry.assetbundleName" class="font-mono text-xs break-all">{{ entry.assetbundleName }}</span>
      </CatalogInfoRow>
    </CatalogInfoList>

    <div v-if="aliases.length > 0" class="space-y-1.5">
      <p class="text-sm text-muted-foreground">{{ t("musicLibrary.detail.aliases.title") }}</p>
      <div class="flex flex-wrap gap-1.5">
        <Badge v-for="alias in visibleAliases" :key="alias" variant="outline" class="max-w-full">
          <span class="truncate">{{ alias }}</span>
        </Badge>
        <button
          v-if="hiddenAliasCount > 0"
          type="button"
          class="inline-flex min-h-6 items-center rounded-full border border-dashed px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="aliasesExpanded = true"
        >
          {{ t("musicLibrary.detail.aliases.showMore", { count: hiddenAliasCount }) }}
        </button>
        <button
          v-else-if="aliasesExpanded && aliases.length > ALIAS_COLLAPSED_LIMIT"
          type="button"
          class="inline-flex min-h-6 items-center rounded-full border border-dashed px-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="aliasesExpanded = false"
        >
          {{ t("musicLibrary.detail.aliases.showLess") }}
        </button>
      </div>
    </div>
  </CatalogDetailSection>
</template>
