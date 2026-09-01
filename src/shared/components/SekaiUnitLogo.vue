<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"
import { SEKAI_UNIT_FALLBACK_COLORS, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveUnitLogoUrl } from "@/shared/sekai/data-sources"
import { handleSekaiImageError } from "@/shared/sekai/image-recovery"
import { resolveSekaiUnitLabel } from "@/shared/sekai/labels"

/**
 * Unit emblem with the colored-dot fallback the catalogs used inline. The
 * shared image-recovery retries run first; only after they are exhausted
 * does the dot take over.
 */
const props = withDefaults(defineProps<{
  unit: string
  size?: "xs" | "sm" | "md" | "lg"
  /** Dot color; defaults to the unit's representative color. */
  color?: string | null
  showLabel?: boolean
  class?: string
}>(), {
  size: "sm",
  color: null,
  showLabel: false,
  class: undefined,
})

const { t, te } = useI18n()

const url = computed(() => resolveUnitLogoUrl(props.unit))
const label = computed(() => resolveSekaiUnitLabel({ t, te }, props.unit))
const dotColor = computed(() => props.color ?? SEKAI_UNIT_FALLBACK_COLORS[props.unit as SekaiUnit] ?? null)

const failed = ref(false)

watch(url, () => {
  failed.value = false
})

const logoClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "h-3.5 max-w-8"
    case "md":
      return "h-5 max-w-10"
    case "lg":
      return "h-7 max-w-16"
    default:
      return "h-4 max-w-9"
  }
})

const dotClass = computed(() => {
  switch (props.size) {
    case "xs":
      return "size-2"
    case "md":
      return "size-3"
    case "lg":
      return "size-3.5"
    default:
      return "size-2.5"
  }
})

function handleError(event: Event) {
  failed.value = !handleSekaiImageError(event, url.value)
}
</script>

<template>
  <span
    :class="cn('inline-flex shrink-0 items-center gap-1.5', props.class)"
    :title="label"
  >
    <img
      v-if="!failed"
      :src="url"
      :alt="showLabel ? '' : label"
      :class="cn('w-auto object-contain', logoClass)"
      loading="lazy"
      decoding="async"
      @error="handleError"
    >
    <span
      v-else
      :class="cn('rounded-full bg-muted-foreground/40', dotClass)"
      :style="dotColor ? { backgroundColor: dotColor } : undefined"
      :aria-label="showLabel ? undefined : label"
      role="img"
    />
    <span v-if="showLabel" class="truncate">{{ label }}</span>
  </span>
</template>
