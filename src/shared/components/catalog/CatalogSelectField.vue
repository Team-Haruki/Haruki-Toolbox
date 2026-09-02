<script setup lang="ts">
import { useId } from "vue"
import type { AcceptableValue } from "reka-ui"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CatalogFieldOption } from "./types"

const ALL_OPTION = "__all__"

const props = withDefaults(defineProps<{
  label: string
  /** Label of the synthetic "all" option; omit for a required choice. */
  allLabel?: string
  options: readonly CatalogFieldOption[]
  modelValue: string | null
  /**
   * Inline row (muted label beside a content-width trigger) instead of the
   * stacked full-width field, so a select can sit in a chip-row filter list
   * without towering over its neighbours.
   */
  compact?: boolean
}>(), {
  compact: false,
})

const emit = defineEmits<{ "update:modelValue": [value: string | null] }>()
const selectId = useId()

function handleUpdate(value: AcceptableValue) {
  if (typeof value !== "string" || value === ALL_OPTION) {
    emit("update:modelValue", null)
    return
  }

  emit("update:modelValue", props.options.some((option) => option.value === value) ? value : null)
}
</script>

<template>
  <div :class="compact ? 'flex flex-wrap items-center gap-x-3 gap-y-2' : 'grid gap-2'">
    <Label
      :id="`${selectId}-label`"
      :for="selectId"
      :class="compact ? 'mr-1 min-w-14 text-xs font-medium text-muted-foreground' : undefined"
    >{{ label }}</Label>
    <Select :id="selectId" :model-value="modelValue ?? ALL_OPTION" @update:model-value="handleUpdate">
      <SelectTrigger
        :size="compact ? 'sm' : 'default'"
        :class="compact ? 'min-w-36' : 'w-full'"
        :aria-labelledby="`${selectId}-label`"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-if="allLabel != null" :value="ALL_OPTION">
          {{ allLabel }}
        </SelectItem>
        <SelectItem v-for="option in options" :key="option.value" :value="option.value">
          <span class="flex items-center gap-2">
            <img
              v-if="option.iconUrl"
              :src="option.iconUrl"
              alt=""
              class="size-4 shrink-0 rounded-full"
              loading="lazy"
            >
            <span
              v-else-if="option.color"
              class="size-2.5 shrink-0 rounded-full"
              :style="{ backgroundColor: option.color }"
            />
            {{ option.label }}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
