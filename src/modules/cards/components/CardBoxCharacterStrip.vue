<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { useScrollEdges } from "@/composables/useScrollEdges"

export type CardBoxCharacterNavRow = {
  characterId: number
  name: string
  iconUrl: string | null
  color: string
  owned: number
  total: number
  percent: number
}

/**
 * The roster as a row of avatars with a progress ring, sticky under the app
 * header. Clicking jumps to (or, outside character grouping, filters to) that
 * character; the ring reads the same share-owned value as the section bars.
 * On phones the row scrolls; an edge fade marks the hidden side.
 */
defineProps<{
  rows: readonly CardBoxCharacterNavRow[]
  activeId: number | null
}>()

const emit = defineEmits<{
  select: [characterId: number]
}>()

const { t } = useI18n()

const RING_TRACK = "rgba(148, 163, 184, 0.3)"

const strip = ref<HTMLElement | null>(null)
const { edgeClass } = useScrollEdges(strip)
</script>

<template>
  <div :class="['sticky top-13 z-20 -mx-1 bg-background/95 backdrop-blur', edgeClass]">
    <nav
      ref="strip"
      :aria-label="t('cardBox.nav.label')"
      class="flex h-14 items-center gap-0.5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <button
        v-for="row in rows"
        :key="row.characterId"
        type="button"
        class="flex shrink-0 items-center justify-center rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :title="`${row.name} ${row.owned}/${row.total} · ${row.percent}%`"
        :aria-label="row.name"
        :aria-current="row.characterId === activeId ? 'true' : undefined"
        @click="emit('select', row.characterId)"
      >
        <span
          class="flex size-9 items-center justify-center rounded-full transition-[transform,opacity] duration-150"
          :class="row.characterId === activeId ? 'scale-110 ring-2 ring-foreground/50 ring-offset-2 ring-offset-background' : 'opacity-75 hover:scale-105 hover:opacity-100'"
          :style="{ background: `conic-gradient(${row.color} ${row.percent * 3.6}deg, ${RING_TRACK} 0deg)` }"
        >
          <img
            v-if="row.iconUrl"
            :src="row.iconUrl"
            alt=""
            class="size-[30px] rounded-full border border-background bg-background object-cover"
            loading="lazy"
            decoding="async"
          >
          <span v-else class="size-[30px] rounded-full bg-background" />
        </span>
      </button>
    </nav>
  </div>
</template>
