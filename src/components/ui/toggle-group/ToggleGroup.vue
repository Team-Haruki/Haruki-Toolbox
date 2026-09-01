<script setup lang="ts">
import type { ToggleGroupRootEmits, ToggleGroupRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { computed, provide } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { ToggleGroupRoot, useForwardPropsEmits } from "reka-ui"
import { cn } from "@/lib/utils"
import type { ToggleGroupItemVariants, ToggleGroupVariants } from "."
import { TOGGLE_GROUP_CONTEXT, toggleGroupVariants } from "."

const props = withDefaults(defineProps<ToggleGroupRootProps & {
  class?: HTMLAttributes["class"]
  variant?: ToggleGroupVariants["variant"]
  size?: ToggleGroupItemVariants["size"]
}>(), {
  variant: "chip",
  size: "sm",
})

const emits = defineEmits<ToggleGroupRootEmits>()

const delegatedProps = reactiveOmit(props, "class", "variant", "size")

const forwarded = useForwardPropsEmits(delegatedProps, emits)

provide(TOGGLE_GROUP_CONTEXT, {
  variant: computed(() => props.variant ?? "chip"),
  size: computed(() => props.size ?? "sm"),
})
</script>

<template>
  <ToggleGroupRoot
    data-slot="toggle-group"
    :data-variant="variant"
    v-bind="forwarded"
    :class="cn(toggleGroupVariants({ variant }), props.class)"
  >
    <slot />
  </ToggleGroupRoot>
</template>
