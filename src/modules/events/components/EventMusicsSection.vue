<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideMusic } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveSekaiDifficultyLabel } from "@/shared/sekai/labels"
import { MUSIC_DIFFICULTIES, MUSIC_DIFFICULTY_COLORS, resolveMusicJacketUrl } from "@/modules/music-library"
import type { EventDetailMusic } from "@/modules/events/composables/useEventDetail"

const props = withDefaults(defineProps<{
  musics: readonly EventDetailMusic[]
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
  loading?: boolean
}>(), {
  loading: false,
})

const { t, te } = useI18n()

const rows = computed(() => props.musics.map(({ seq, entry }) => ({
  seq,
  entry,
  jacket: resolveMusicJacketUrl(props.region, entry.assetbundleName, props.assetEndpoint),
  difficulties: MUSIC_DIFFICULTIES
    .map((difficulty) => ({ difficulty, level: entry.difficulties[difficulty]?.playLevel ?? null }))
    .filter((item) => item.level != null),
})))
</script>

<template>
  <CatalogDetailSection
    :title="t('eventCatalog.musics.title')"
    :icon="LucideMusic"
    :loading="loading && musics.length === 0"
    :empty="musics.length === 0"
    :empty-message="t('eventCatalog.musics.empty')"
    content-class="flex flex-col gap-2"
  >
    <template #skeleton>
      <div class="flex items-center gap-3">
        <Skeleton class="size-14 rounded-md" />
        <div class="flex flex-1 flex-col gap-2">
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>
    </template>
    <RouterLink
      v-for="row in rows"
      :key="row.entry.id"
      :to="`/music/${row.entry.id}`"
      class="group flex items-center gap-3 rounded-md border bg-muted/20 p-2 transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none dark:hover:bg-accent/30"
    >
      <div class="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted">
        <SekaiAssetImage :sources="[row.jacket]" :alt="row.entry.title" :placeholder-icon="LucideMusic" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col gap-1">
        <p class="truncate text-sm font-medium group-hover:text-primary">{{ row.entry.title }}</p>
        <div class="flex flex-wrap items-center gap-1">
          <span
            v-for="item in row.difficulties"
            :key="item.difficulty"
            class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums"
            :style="{ backgroundColor: MUSIC_DIFFICULTY_COLORS[item.difficulty] }"
            :title="resolveSekaiDifficultyLabel({ t, te }, item.difficulty)"
          >
            {{ item.level }}
          </span>
        </div>
      </div>
      <span class="font-mono text-xs text-muted-foreground">#{{ row.entry.id }}</span>
    </RouterLink>
  </CatalogDetailSection>
</template>
