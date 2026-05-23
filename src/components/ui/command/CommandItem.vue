<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed, inject, onBeforeUnmount, watch } from "vue"
import { cn } from "@/lib/utils"
import { COMMAND_CONTEXT_KEY, COMMAND_GROUP_CONTEXT_KEY } from "./context"
import { matchesCommandSearch } from "./search"

const props = defineProps<{
  value: string
  keywords?: readonly string[]
  disabled?: boolean
  class?: HTMLAttributes["class"]
}>()

const emit = defineEmits<{
  select: [value: string]
}>()

const commandContext = inject(COMMAND_CONTEXT_KEY)
const groupContext = inject(COMMAND_GROUP_CONTEXT_KEY)
const searchableParts = computed(() => [props.value, ...(props.keywords ?? [])])
const visible = computed(() => {
  return matchesCommandSearch(searchableParts.value, commandContext?.search.value ?? "")
})

groupContext?.registerItem(visible.value)

watch(visible, (next, previous) => {
  groupContext?.updateItemVisibility(previous, next)
})

onBeforeUnmount(() => {
  groupContext?.unregisterItem(visible.value)
})

function handleSelect() {
  if (props.disabled) {
    return
  }

  emit("select", props.value)
}

</script>

<template>
  <div
    v-show="visible"
    data-slot="command-item"
    role="option"
    :aria-disabled="props.disabled || undefined"
    :data-disabled="props.disabled ? '' : undefined"
    :class="
      cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
    @click="handleSelect"
  >
    <slot />
  </div>
</template>
