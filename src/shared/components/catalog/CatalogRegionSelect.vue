<script setup lang="ts">
import { useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"

/**
 * The catalog region selector (follow the selected game account, or a fixed
 * server). Bound directly to the settings store so every catalog page shows
 * the same choice.
 */
const props = withDefaults(defineProps<{
  size?: "sm" | "default"
  /** Render the label visibly above the select instead of screen-reader only. */
  showLabel?: boolean
  class?: string
}>(), {
  size: "default",
  showLabel: false,
  class: undefined,
})

const { t, locale } = useI18n()
const id = useId()
const { selectorValue, updateSelectorValue } = useEffectiveCatalogRegion()

function handleUpdate(value: AcceptableValue) {
  updateSelectorValue(value)
}
</script>

<template>
  <div :class="cn(showLabel ? 'grid gap-1.5' : 'contents', props.class)">
    <Label :id="`${id}-label`" :for="id" :class="showLabel ? 'text-xs text-muted-foreground' : 'sr-only'">
      {{ t("catalog.region.label") }}
    </Label>
    <Select :id="id" :key="locale" :model-value="selectorValue" @update:model-value="handleUpdate">
      <SelectTrigger
        :size="size"
        :class="cn('w-auto min-w-28 shrink-0 sm:w-36', showLabel ? 'w-full' : props.class)"
        :aria-labelledby="`${id}-label`"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
          {{ t("sekaiRegion.followAccount") }}
        </SelectItem>
        <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
          {{ resolveSekaiRegionLabel(option.value, t) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
