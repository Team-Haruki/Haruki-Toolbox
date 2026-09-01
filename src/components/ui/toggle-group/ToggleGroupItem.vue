<script setup lang="ts">
import type { ToggleGroupItemProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { computed, inject } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ToggleGroupItem, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"
import { TOGGLE_GROUP_CONTEXT, toggleGroupItemVariants } from "."

const props = defineProps<ToggleGroupItemProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")

const forwardedProps = useForwardProps(delegatedProps)

const context = inject(TOGGLE_GROUP_CONTEXT, null)

const variant = computed(() => context?.variant.value ?? "chip")
const size = computed(() => context?.size.value ?? "sm")
</script>

<template>
  <ToggleGroupItem
    data-slot="toggle-group-item"
    v-bind="forwardedProps"
    :class="cn(toggleGroupItemVariants({ variant, size }), props.class)"
  >
    <slot />
  </ToggleGroupItem>
</template>
