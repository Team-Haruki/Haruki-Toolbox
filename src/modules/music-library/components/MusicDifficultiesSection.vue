<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { ListMusic } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
    <div class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("musicLibrary.detail.table.difficulty") }}</TableHead>
            <TableHead class="text-right">{{ t("musicLibrary.detail.table.level") }}</TableHead>
            <TableHead class="text-right">{{ t("musicLibrary.detail.table.noteCount") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in rows" :key="row.difficulty">
            <TableCell>
              <Badge
                variant="solid"
                class="w-20 justify-center rounded font-semibold text-white"
                :style="{ backgroundColor: row.color }"
              >
                {{ resolveSekaiDifficultyLabel({ t, te }, row.difficulty) }}
              </Badge>
            </TableCell>
            <TableCell class="text-right font-medium tabular-nums">{{ row.playLevel ?? "—" }}</TableCell>
            <TableCell class="text-right font-mono tabular-nums">{{ row.totalNoteCount ?? "—" }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </CatalogDetailSection>
</template>
