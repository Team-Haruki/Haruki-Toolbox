<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import { resolveGachaTypeLabel } from "@/modules/gachas/lib/gacha-labels"

const props = withDefaults(defineProps<{
  gachaType: string
  size?: BadgeVariants["size"]
}>(), {
  size: "default",
})

const { t, te } = useI18n()

const label = computed(() => resolveGachaTypeLabel({ t, te }, props.gachaType))

const variant = computed<BadgeVariants["variant"]>(() => {
  switch (props.gachaType) {
    case "ceil":
      return "default"
    case "normal":
      return "sky"
    case "beginner":
      return "emerald"
    case "gift":
      return "rose"
    case "sunormal":
    case "subeginner":
      return "violet"
    case "return":
      return "cyan"
    default:
      return "muted"
  }
})
</script>

<template>
  <Badge :variant="variant" :size="size" data-slot="gacha-type-badge">{{ label }}</Badge>
</template>
