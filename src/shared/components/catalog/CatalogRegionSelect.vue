<script setup lang="ts">
import { computed, useId } from "vue"
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
 *
 * The trigger always names the server actually in use ("JP") — in follow
 * mode with a small "following" tag — so a logged-out visitor, whose
 * "follow" silently resolves to the manual default, can see which data
 * they are looking at.
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
const { region, mode, selectorValue, updateSelectorValue } = useEffectiveCatalogRegion()

const regionLabel = computed(() => resolveSekaiRegionLabel(region.value, t))
const following = computed(() => mode.value === "follow")
const followLabel = computed(() => t("sekaiRegion.followAccountResolved", { region: regionLabel.value }))

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
      <!-- No fixed width: the trigger grows with the label and never wraps
           or clips ("跟随当前账 号" on phones). -->
      <SelectTrigger
        :size="size"
        :class="cn('w-auto max-w-full shrink-0 whitespace-nowrap', showLabel ? 'w-full' : props.class)"
        :aria-labelledby="`${id}-label`"
        :title="following ? followLabel : undefined"
      >
        <SelectValue>
          <span class="flex min-w-0 items-center gap-1.5">
            <span class="truncate">{{ regionLabel }}</span>
            <span
              v-if="following"
              class="shrink-0 rounded-sm bg-muted px-1 py-px text-[10px] leading-tight font-medium text-muted-foreground"
            >
              {{ t("sekaiRegion.followBadge") }}
            </span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
          {{ followLabel }}
        </SelectItem>
        <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
          {{ resolveSekaiRegionLabel(option.value, t) }}
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
