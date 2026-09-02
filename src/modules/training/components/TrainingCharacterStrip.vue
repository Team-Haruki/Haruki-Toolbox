<script setup lang="ts">
export type TrainingCharacterStripRow = {
  characterId: number
  name: string
  iconUrl: string | null
  color: string | null
  /** Short text under the avatar (e.g. a rank); optional. */
  badge?: string | null
}

/** The roster as a row of avatars; one is selected. Scrolls sideways on phones. */
defineProps<{
  rows: readonly TrainingCharacterStripRow[]
  activeId: number | null
  label: string
}>()

const emit = defineEmits<{
  select: [characterId: number]
}>()
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="-mx-1 flex items-start gap-0.5 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  >
    <button
      v-for="row in rows"
      :key="row.characterId"
      type="button"
      role="radio"
      :aria-checked="row.characterId === activeId"
      :aria-label="row.name"
      :title="row.name"
      class="flex shrink-0 flex-col items-center gap-0.5 rounded-md px-0.5 py-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      @click="emit('select', row.characterId)"
    >
      <span
        class="flex size-9 items-center justify-center rounded-full ring-2 transition-[transform,opacity] duration-150"
        :class="row.characterId === activeId ? 'scale-110 ring-offset-2 ring-offset-background' : 'opacity-70 ring-transparent hover:scale-105 hover:opacity-100'"
        :style="row.characterId === activeId ? { '--tw-ring-color': row.color ?? 'var(--foreground)' } : undefined"
      >
        <img v-if="row.iconUrl" :src="row.iconUrl" alt="" class="size-8 rounded-full bg-background object-cover" loading="lazy" decoding="async">
        <span v-else class="size-8 rounded-full bg-muted" />
      </span>
      <span v-if="row.badge" class="text-[10px] leading-none tabular-nums" :class="row.characterId === activeId ? 'font-semibold' : 'text-muted-foreground'">
        {{ row.badge }}
      </span>
    </button>
  </div>
</template>
