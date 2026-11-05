<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton"
import CatalogEntityGrid from "@/shared/components/catalog/CatalogEntityGrid.vue"
import type { MusicListRow } from "@/modules/music-library/lib/music-view"
import MusicRow from "./MusicRow.vue"
import MusicTile from "./MusicTile.vue"

/**
 * The paged results in the chosen layout. `skeleton` renders placeholders in
 * the same grid as the real tiles / rows so the page does not jump.
 */
defineProps<{
  rows: readonly MusicListRow[]
  view: "grid" | "list"
  skeleton: boolean
  /** Blur unreleased artwork (settings). */
  blur: boolean
}>()
</script>

<template>
  <template v-if="skeleton">
    <!-- Shaped like MusicTile: jacket, a two-line title, the date line and
         five level pills (the usual chart count), so the real tile lands on
         the same outline instead of three equal bars. -->
    <CatalogEntityGrid v-if="view === 'grid'" columns="wide">
      <div v-for="index in 8" :key="index" class="flex flex-col gap-2 rounded-lg border p-2.5 sm:p-3">
        <Skeleton class="aspect-square w-full rounded-md" />
        <div class="space-y-1">
          <Skeleton class="h-4 w-11/12" />
          <Skeleton class="h-4 w-2/3" />
          <Skeleton class="mt-1.5 h-3.5 w-1/2" />
        </div>
        <div class="mt-auto flex gap-1 max-sm:gap-0.5" aria-hidden="true">
          <Skeleton v-for="pill in 5" :key="pill" class="h-6 w-7 rounded max-sm:w-5" />
        </div>
      </div>
    </CatalogEntityGrid>
    <div v-else class="divide-y overflow-hidden rounded-lg border">
      <div v-for="index in 6" :key="index" class="flex items-center gap-3 px-3 py-2">
        <Skeleton class="size-14 shrink-0 rounded-md" />
        <div class="flex-1 space-y-2">
          <Skeleton class="h-4 w-1/2" />
          <Skeleton class="h-3 w-1/3" />
        </div>
      </div>
    </div>
  </template>

  <CatalogEntityGrid v-else-if="view === 'grid'" columns="wide">
    <MusicTile
      v-for="row in rows"
      :key="row.entry.id"
      :entry="row.entry"
      :jacket-url="row.jacketUrl"
      :date-label="row.dateLabel"
      :unreleased="row.unreleased"
      :blur="blur"
      :event-box="row.eventBox"
      :pills="row.pills"
    />
  </CatalogEntityGrid>
  <div v-else class="divide-y overflow-hidden rounded-lg border">
    <MusicRow
      v-for="row in rows"
      :key="row.entry.id"
      :entry="row.entry"
      :jacket-url="row.jacketUrl"
      :date-label="row.dateLabel"
      :unreleased="row.unreleased"
      :blur="blur"
      :event-box="row.eventBox"
      :pills="row.pills"
    />
  </div>
</template>
