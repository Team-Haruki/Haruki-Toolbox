<script setup lang="ts">
import type { ProgressRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import {
  ProgressIndicator,
  ProgressRoot,

} from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<ProgressRootProps & {
    class?: HTMLAttributes["class"]
    /** Optional custom bar color (any CSS color); defaults to the primary theme color. */
    color?: string
  }>(),
  {
    modelValue: 0,
  },
)

const delegatedProps = reactiveOmit(props, "class", "color")
</script>

<template>
  <ProgressRoot
    data-slot="progress"
    v-bind="delegatedProps"
    :class="
      cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full',
        props.class,
      )
    "
    :style="props.color ? { backgroundColor: `color-mix(in srgb, ${props.color} 20%, transparent)` } : undefined"
  >
    <ProgressIndicator
      data-slot="progress-indicator"
      class="bg-primary h-full w-full flex-1 transition-all"
      :style="[
        { transform: `translateX(-${100 - (props.modelValue ?? 0)}%)` },
        props.color ? { backgroundColor: props.color } : {},
      ]"
    />
  </ProgressRoot>
</template>
