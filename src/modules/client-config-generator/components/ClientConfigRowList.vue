<script setup lang="ts">
/**
 * The frame of a row editor: what the list is, its rows (default slot) and
 * the button that adds a row.
 */
import { Plus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

defineProps<{
  label: string
  help?: string
  addLabel: string
}>()

const emit = defineEmits<{ add: [] }>()
</script>

<template>
  <div class="grid content-start gap-2" role="group" :aria-label="label">
    <div>
      <p class="text-sm font-medium">{{ label }}</p>
      <p v-if="help" class="mt-0.5 text-xs leading-relaxed text-muted-foreground">{{ help }}</p>
    </div>
    <div v-if="$slots.default" class="grid gap-2">
      <slot />
    </div>
    <div>
      <Button type="button" variant="ghost" size="sm" class="-ml-2.5 text-muted-foreground" @click="emit('add')">
        <Plus class="size-4" aria-hidden="true" />
        {{ addLabel }}
      </Button>
    </div>
  </div>
</template>
