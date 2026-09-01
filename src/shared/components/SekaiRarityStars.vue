<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"
import { resolveCardRareCount } from "@/shared/sekai/catalog"
import { resolveRareBirthdayImageUrl, resolveRareStarImageUrl } from "@/shared/sekai/data-sources"
import { handleSekaiImageError } from "@/shared/sekai/image-recovery"
import { resolveSekaiRarityLabel } from "@/shared/sekai/labels"

const props = withDefaults(defineProps<{
  cardRarityType: string
  /** Use the trained (after-training) star artwork. */
  trained?: boolean
  size?: "xs" | "sm" | "md"
  class?: string
}>(), {
  trained: false,
  size: "sm",
  class: undefined,
})

const { t, te } = useI18n()

const count = computed(() => resolveCardRareCount(props.cardRarityType))
const isBirthday = computed(() => props.cardRarityType === "rarity_birthday")
const iconUrl = computed(() => (isBirthday.value
  ? resolveRareBirthdayImageUrl()
  : resolveRareStarImageUrl(props.trained)))
const label = computed(() => resolveSekaiRarityLabel({ t, te }, props.cardRarityType))

const iconClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "size-3"
    case "md":
      return "size-5"
    default:
      return "size-4"
  }
})
</script>

<template>
  <span
    v-if="count > 0"
    :class="cn('inline-flex shrink-0 items-center gap-px', props.class)"
    role="img"
    :aria-label="label"
    :title="label"
  >
    <img
      v-for="index in count"
      :key="index"
      :src="iconUrl"
      alt=""
      :class="iconClass"
      loading="lazy"
      decoding="async"
      @error="handleSekaiImageError($event, iconUrl)"
    >
  </span>
</template>
