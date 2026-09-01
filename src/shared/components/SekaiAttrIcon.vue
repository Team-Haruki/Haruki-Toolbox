<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"
import { resolveCardAttrRoundIconUrl } from "@/shared/sekai/data-sources"
import { handleSekaiImageError } from "@/shared/sekai/image-recovery"
import { resolveSekaiAttrLabel } from "@/shared/sekai/labels"

const props = withDefaults(defineProps<{
  attr: string
  size?: "xs" | "sm" | "md" | "lg"
  showLabel?: boolean
  class?: string
}>(), {
  size: "sm",
  showLabel: false,
  class: undefined,
})

const { t, te } = useI18n()

const url = computed(() => resolveCardAttrRoundIconUrl(props.attr))
const label = computed(() => resolveSekaiAttrLabel({ t, te }, props.attr))

const iconClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "size-3.5"
    case "md":
      return "size-5"
    case "lg":
      return "size-6"
    default:
      return "size-4"
  }
})
</script>

<template>
  <span :class="cn('inline-flex shrink-0 items-center gap-1', props.class)" :title="label">
    <img
      :src="url"
      :alt="showLabel ? '' : label"
      :class="cn('shrink-0', iconClass)"
      loading="lazy"
      decoding="async"
      @error="handleSekaiImageError($event, url)"
    >
    <span v-if="showLabel" class="truncate">{{ label }}</span>
  </span>
</template>
