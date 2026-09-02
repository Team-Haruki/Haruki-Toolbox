<script setup lang="ts">
import { useI18n } from "vue-i18n"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import type { CardBoxCardView } from "@/modules/cards/lib/card-box"

/** The thumbnail grid shared by every grouping mode; unowned cards are dimmed. */
defineProps<{
  views: readonly CardBoxCardView[]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
    <RouterLink
      v-for="view in views"
      :key="view.card.id"
      :to="{ name: 'cards.detail', params: { cardId: view.card.id } }"
      class="group relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      :title="view.card.prefix ?? `#${view.card.id}`"
    >
      <CardThumbnail
        :thumbnail="view.thumbnail"
        :trained="view.trained"
        :title="view.card.prefix"
        :level-label="view.record ? t('cardBox.badge.level', { level: view.record.level }) : null"
        :class="[
          'transition-transform group-hover:scale-[1.02]',
          view.record == null ? 'opacity-40 grayscale' : '',
        ]"
      />
    </RouterLink>
  </div>
</template>
