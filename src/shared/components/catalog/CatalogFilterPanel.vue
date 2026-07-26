<script setup lang="ts">
import { Filter, RotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

defineProps<{
  title: string
  /** Result-count line shown in the footer (already translated). */
  countLabel?: string | null
  resetLabel: string
}>()

const emit = defineEmits<{ reset: [] }>()
</script>

<template>
  <section class="grid gap-3 rounded-md border bg-muted/20 p-3">
    <div class="flex items-center gap-2 text-sm font-medium">
      <Filter class="size-4 text-muted-foreground" />
      {{ title }}
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <slot />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-xs text-muted-foreground">{{ countLabel }}</p>
      <Button type="button" variant="ghost" size="sm" @click="emit('reset')">
        <RotateCcw class="size-4" />
        {{ resetLabel }}
      </Button>
    </div>
  </section>
</template>
