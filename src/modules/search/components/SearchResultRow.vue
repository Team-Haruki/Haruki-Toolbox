<script setup lang="ts">
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { LucideFileText } from "lucide-vue-next"
import { formatLocalizedDateRange } from "@/lib/date-time"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import { resolveCardAttrRoundIconUrl } from "@/shared/sekai/data-sources"
import {
  resolveSekaiAttrLabel,
  resolveSekaiEventTypeLabel,
  resolveSekaiRarityLabel,
  resolveSekaiUnitLabel,
} from "@/shared/sekai/labels"
import {
  MUSIC_DIFFICULTIES,
  resolveMusicDifficultyChipClass,
} from "@/modules/music-library/lib/music-difficulties"
import type { SearchResultEntry } from "@/modules/search/lib/search-index"
import type { SearchThumb } from "@/modules/search/lib/search-thumbs"

/**
 * One hit: its picture (or a page's icon), the title, a line saying what it
 * is, and at the far end the detail that tells two similar hits apart.
 */
const props = defineProps<{
  id: string
  entry: SearchResultEntry
  active: boolean
  thumb: SearchThumb | null
  /** A page's sidebar icon. */
  icon?: Component
  /** Not out yet in this region. */
  unreleased: boolean
  /** Blur the artwork of unreleased content. */
  blur: boolean
}>()

const emit = defineEmits<{
  select: []
  activate: []
}>()

const { t, te } = useI18n()
const labels = { t: (key: string) => t(key), te: (key: string) => te(key) }

const THUMB_CLASS: Record<SearchThumb["shape"], string> = {
  square: "size-10 rounded-md",
  wide: "h-10 w-20 rounded-md",
  round: "size-10 rounded-full",
}

const subtitle = computed(() => {
  const entry = props.entry
  switch (entry.type) {
    case "music":
      return entry.music.composer
    case "card":
      return [entry.card.characterName, resolveSekaiRarityLabel(labels, entry.card.rarity)].filter(Boolean).join(" · ")
    case "event":
      return formatLocalizedDateRange(entry.event.startAt, entry.event.aggregateAt, "date")
    case "gacha":
      return formatLocalizedDateRange(entry.gacha.startAt, entry.gacha.endAt, "date")
    case "character":
      return [
        resolveSekaiUnitLabel(labels, entry.character.unit),
        entry.character.cardCount > 0 ? t("globalSearch.meta.cardCount", { count: entry.character.cardCount }) : "",
      ].filter(Boolean).join(" · ")
    case "story":
      return [
        te(`globalSearch.meta.storyKind.${entry.story.kind}`) ? t(`globalSearch.meta.storyKind.${entry.story.kind}`) : "",
        t("globalSearch.meta.episodes", { count: entry.story.episodeCount }),
      ].filter(Boolean).join(" · ")
    default:
      return entry.page.section
  }
})

/** A song's play levels, easy to append, as the music list draws them. */
const levels = computed(() => {
  const entry = props.entry
  if (entry.type !== "music") return []
  return MUSIC_DIFFICULTIES
    .filter((difficulty) => entry.music.levels[difficulty] != null)
    .map((difficulty) => ({ difficulty, level: entry.music.levels[difficulty] }))
})

const eventType = computed(() =>
  props.entry.type === "event" ? resolveSekaiEventTypeLabel(labels, props.entry.event.eventType) : "",
)

const attr = computed(() => {
  const entry = props.entry
  if (entry.type !== "card" || !entry.card.attr) return null
  return { url: resolveCardAttrRoundIconUrl(entry.card.attr), label: resolveSekaiAttrLabel(labels, entry.card.attr) }
})

const showId = computed(() => typeof props.entry.id === "number" && props.entry.type !== "character")
const viaAlias = computed(() => "viaAlias" in props.entry && props.entry.viaAlias === true)
</script>

<template>
  <li
    :id="id"
    role="option"
    :aria-selected="active"
    :data-type="entry.type"
    :class="[
      'flex min-w-0 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2',
      active ? 'bg-accent text-accent-foreground' : '',
    ]"
    @click="emit('select')"
    @pointermove="emit('activate')"
  >
    <div v-if="thumb" :class="['relative shrink-0 overflow-hidden bg-muted', THUMB_CLASS[thumb.shape]]">
      <SekaiAssetImage :sources="thumb.sources" alt="" :fit="thumb.fit" :blur="blur && unreleased" />
    </div>
    <div v-else class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
      <component :is="icon ?? LucideFileText" class="size-4" aria-hidden="true" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <p class="truncate text-sm font-medium">{{ entry.title }}</p>
      <p v-if="subtitle" class="truncate text-xs tabular-nums text-muted-foreground">{{ subtitle }}</p>
    </div>

    <div class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
      <span v-if="levels.length > 0" class="hidden items-center gap-1 @min-[30rem]:flex">
        <span
          v-for="item in levels"
          :key="item.difficulty"
          :class="[resolveMusicDifficultyChipClass(item.difficulty), 'min-w-6 px-1 py-0.5']"
        >
          {{ item.level }}
        </span>
      </span>
      <img v-if="attr" :src="attr.url" :alt="attr.label" :title="attr.label" class="size-4" loading="lazy">
      <span v-if="eventType" class="hidden @min-[30rem]:inline">{{ eventType }}</span>
      <span v-if="unreleased" class="rounded-full bg-muted px-1.5 py-0.5 text-[11px]">
        {{ t("sekaiUnreleased.badge") }}
      </span>
      <span v-if="viaAlias" class="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
        {{ t("searchAlias.badge") }}
      </span>
      <span v-if="showId" class="tabular-nums">#{{ entry.id }}</span>
    </div>
  </li>
</template>
