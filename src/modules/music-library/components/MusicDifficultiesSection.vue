<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ListMusic } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { resolveSekaiDifficultyLabel } from "@/shared/sekai/labels"
import type { MusicLibraryEntry } from "@/modules/music-library/lib/music-data"
import { listMusicDifficultyRows } from "@/modules/music-library/lib/music-view"

/** Difficulty → level → note count table in canonical chart order. */
const props = defineProps<{
  entry: MusicLibraryEntry
}>()

const { t, te } = useI18n()

const rows = computed(() => listMusicDifficultyRows(props.entry))
</script>

<template>
  <CatalogDetailSection
    :title="t('musicLibrary.detail.difficultiesTitle')"
    :icon="ListMusic"
    :empty="rows.length === 0"
    :empty-message="t('musicCatalog.detail.difficulties.empty')"
  >
    <!-- One block per difficulty, side by side. The three-column table put the
         badge at one edge and the numbers at the other with the card's width
         as dead space between; auto-fit blocks use whatever width is there,
         and a song with five difficulties simply gets five wider blocks. -->
    <dl class="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
      <div
        v-for="row in rows"
        :key="row.difficulty"
        class="flex flex-col items-center gap-1.5 rounded-lg border bg-muted/20 px-2 py-3 text-center"
      >
        <dt>
          <Badge
            variant="solid"
            class="w-20 justify-center rounded font-semibold text-white"
            :style="{ backgroundColor: row.color }"
          >
            {{ resolveSekaiDifficultyLabel({ t, te }, row.difficulty) }}
          </Badge>
        </dt>
        <dd class="flex flex-col items-center gap-0.5">
          <span class="sr-only">{{ t("musicLibrary.detail.table.level") }}</span>
          <span class="text-2xl leading-none font-semibold tabular-nums">{{ row.playLevel ?? "—" }}</span>
          <span class="text-xs text-muted-foreground">
            {{ t("musicLibrary.detail.table.noteCount") }}
            <span class="font-mono tabular-nums">{{ row.totalNoteCount ?? "—" }}</span>
          </span>
        </dd>
      </div>
    </dl>
  </CatalogDetailSection>
</template>
