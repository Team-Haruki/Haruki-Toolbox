<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { inject } from "vue"
import { SearchIcon } from "lucide-vue-next"
import { cn } from "@/lib/utils"
import { COMMAND_CONTEXT_KEY } from "./context"

const props = defineProps<{
  placeholder?: string
  class?: HTMLAttributes["class"]
}>()

const context = inject(COMMAND_CONTEXT_KEY)
</script>

<template>
  <div class="flex h-10 items-center gap-2 border-b px-3">
    <SearchIcon class="size-4 shrink-0 text-muted-foreground" />
    <input
      v-model="context!.search.value"
      data-slot="command-input"
      :placeholder="props.placeholder"
      :class="cn('placeholder:text-muted-foreground flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50', props.class)"
    >
  </div>
</template>
