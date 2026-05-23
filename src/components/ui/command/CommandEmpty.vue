<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, inject } from "vue"
import { cn } from "@/lib/utils"
import { COMMAND_CONTEXT_KEY } from "./context"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const context = inject(COMMAND_CONTEXT_KEY)
const visibleCount = computed(() => context?.visibleCount?.value ?? 0)
</script>

<template>
  <div
    v-if="visibleCount === 0"
    data-slot="command-empty"
    :class="cn('py-6 text-center text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </div>
</template>
