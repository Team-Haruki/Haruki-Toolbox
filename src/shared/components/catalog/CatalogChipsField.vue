<script setup lang="ts">
import { Label } from "@/components/ui/label"
import type { CatalogFieldOption } from "./types"

defineProps<{
  label: string
  options: readonly CatalogFieldOption[]
}>()

const model = defineModel<string[]>({ required: true })

function toggle(value: string) {
  const index = model.value.indexOf(value)
  if (index >= 0) {
    model.value.splice(index, 1)
  } else {
    model.value.push(value)
  }
}
</script>

<template>
  <div class="grid gap-2 sm:col-span-2 lg:col-span-3">
    <Label>{{ label }}</Label>
    <div class="flex flex-wrap items-center gap-1.5">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        :class="[
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
          model.includes(option.value)
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border hover:bg-muted',
        ]"
        @click="toggle(option.value)"
      >
        <img
          v-if="option.iconUrl"
          :src="option.iconUrl"
          alt=""
          class="h-4 w-auto max-w-9 object-contain"
          loading="lazy"
        >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
