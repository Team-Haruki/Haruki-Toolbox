<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideArrowUpRight, LucideUsers } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiCardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import type { CardSameCharacterEntry } from "@/modules/cards/composables/useCardDetail"

/**
 * Newest cards of the same character as a horizontal strip, with a link to
 * the list pre-filtered on the character. Collapsed by default on phones.
 */
const props = defineProps<{
  entries: readonly CardSameCharacterEntry[]
  characterId: number | null
  /** Every card of the character (the strip only shows the newest few). */
  total: number
  blurUnreleased: boolean
  defaultOpen: boolean
}>()

const { t } = useI18n()

const listRoute = computed(() => (props.characterId != null
  ? { name: "cards.list", query: { chars: String(props.characterId) } }
  : null))
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.sameCharacter.title')"
    :icon="LucideUsers"
    collapsible
    :default-open="defaultOpen"
    :empty="entries.length === 0"
    :empty-message="t('cardCatalog.detail.sameCharacter.empty')"
  >
    <template #summary>
      {{ t("cardCatalog.detail.sameCharacter.count", { count: total }) }}
    </template>

    <template #action>
      <Button v-if="listRoute" as-child variant="ghost" size="sm" class="h-7 gap-1 text-xs font-normal text-muted-foreground">
        <RouterLink :to="listRoute">
          {{ t("catalog.detail.viewAllCount", { count: total }) }}
          <LucideArrowUpRight class="size-3.5" />
        </RouterLink>
      </Button>
    </template>

    <div class="flex gap-3 overflow-x-auto pb-2">
      <RouterLink
        v-for="entry in entries"
        :key="entry.card.id"
        :to="{ name: 'cards.detail', params: { cardId: entry.card.id } }"
        class="flex w-24 shrink-0 flex-col gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :title="entry.card.prefix ?? `#${entry.card.id}`"
      >
        <div :class="['relative', entry.unreleased && blurUnreleased ? 'overflow-hidden rounded-md' : '']">
          <SekaiCardThumbnail
            :thumbnail="entry.thumbnail"
            size="fluid"
            :trained="entry.card.trainedByDefault"
            :unreleased="entry.unreleased && !blurUnreleased"
            :title="entry.card.prefix"
            :class="entry.unreleased && blurUnreleased ? 'scale-105 blur-md' : ''"
          />
          <span
            v-if="entry.unreleased && blurUnreleased"
            class="absolute right-1 top-1 rounded bg-red-600 px-1 py-0.5 text-[10px] font-semibold leading-none text-white shadow-sm"
          >
            {{ t("sekaiUnreleased.badge") }}
          </span>
        </div>
        <span class="line-clamp-2 text-[11px] leading-tight">{{ entry.card.prefix ?? `#${entry.card.id}` }}</span>
      </RouterLink>
    </div>
  </CatalogDetailSection>
</template>
