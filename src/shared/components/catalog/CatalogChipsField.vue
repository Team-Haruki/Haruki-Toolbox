<script setup lang="ts">
import type { AcceptableValue } from "reka-ui"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { handleSekaiImageError } from "@/shared/sekai/image-recovery"
import type { CatalogFieldOption } from "./types"

const props = withDefaults(defineProps<{
  label: string
  options: readonly CatalogFieldOption[]
  /** Hide the label visually (inline rows); it stays available to screen readers. */
  compact?: boolean
  class?: string
}>(), {
  compact: false,
  class: undefined,
})

const model = defineModel<string[]>({ required: true })

function handleUpdate(value: AcceptableValue | AcceptableValue[] | undefined) {
  const next = Array.isArray(value) ? value : (value == null ? [] : [value])
  model.value = next.filter((item): item is string => typeof item === "string")
}
</script>

<template>
  <div :class="cn(compact ? 'flex min-w-0 flex-wrap items-center gap-1.5' : 'grid min-w-0 grid-cols-1 gap-2 sm:col-span-2 lg:col-span-3', props.class)">
    <!-- `min-w-14` lines the controls of stacked compact rows up into a column. -->
    <p :class="compact ? 'mr-1 min-w-14 text-xs font-medium text-muted-foreground' : 'text-sm font-medium'">
      {{ label }}
    </p>
    <ToggleGroup
      type="multiple"
      variant="chip"
      size="sm"
      class="min-w-0 max-w-full"
      :model-value="model"
      :aria-label="label"
      @update:model-value="handleUpdate"
    >
      <ToggleGroupItem
        v-for="option in options"
        :key="option.value"
        :value="option.value"
        class="h-auto min-h-7 min-w-0 max-w-full whitespace-normal py-1"
      >
        <img
          v-if="option.iconUrl"
          :src="option.iconUrl"
          alt=""
          class="h-4 w-auto max-w-9 shrink-0 object-contain"
          loading="lazy"
          decoding="async"
          @error="handleSekaiImageError($event, option.iconUrl)"
        >
        <span
          v-else-if="option.color"
          class="size-2.5 shrink-0 rounded-full"
          :style="{ backgroundColor: option.color }"
          aria-hidden="true"
        />
        <span class="min-w-0 break-words">{{ option.label }}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
</template>
