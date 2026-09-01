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
  <div :class="cn(compact ? 'flex flex-wrap items-center gap-1.5' : 'grid gap-2 sm:col-span-2 lg:col-span-3', props.class)">
    <p :class="compact ? 'mr-1 text-xs font-medium text-muted-foreground' : 'text-sm font-medium'">{{ label }}</p>
    <ToggleGroup
      type="multiple"
      variant="chip"
      size="sm"
      :model-value="model"
      :aria-label="label"
      @update:model-value="handleUpdate"
    >
      <ToggleGroupItem v-for="option in options" :key="option.value" :value="option.value">
        <img
          v-if="option.iconUrl"
          :src="option.iconUrl"
          alt=""
          class="h-4 w-auto max-w-9 object-contain"
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
        {{ option.label }}
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
</template>
