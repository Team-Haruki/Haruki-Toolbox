<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"

/** Overlapping strip of pickup character avatars with a `+N` overflow pill. */
withDefaults(defineProps<{
  characters: readonly CatalogCharacter[]
  extraCount?: number
  size?: "xs" | "sm"
}>(), {
  extraCount: 0,
  size: "sm",
})

const { t } = useI18n()
</script>

<template>
  <div
    v-if="characters.length > 0"
    class="flex items-center -space-x-1.5"
    role="list"
    :aria-label="t('gachaCatalog.list.pickupCharacters')"
    data-slot="gacha-pickup-avatars"
  >
    <SekaiCharacterAvatar
      v-for="character in characters"
      :key="character.id"
      :character-id="character.id"
      :name="character.name"
      :size="size"
      class="ring-2 ring-background"
      role="listitem"
    />
    <span
      v-if="extraCount > 0"
      :class="[
        'inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground ring-2 ring-background tabular-nums',
        size === 'xs' ? 'size-5 text-[10px]' : 'size-6 text-[11px]',
      ]"
      role="listitem"
    >
      +{{ extraCount }}
    </span>
  </div>
</template>
