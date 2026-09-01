<script setup lang="ts">
import { useId } from "vue"
import { useI18n } from "vue-i18n"
import { LucideSearch, LucideX } from "lucide-vue-next"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const props = withDefaults(defineProps<{
  label: string
  placeholder?: string
  /** Hide the label visually (toolbar usage); it stays available to screen readers. */
  compact?: boolean
  class?: string
}>(), {
  placeholder: undefined,
  compact: false,
  class: undefined,
})

const model = defineModel<string>({ required: true })
const inputId = useId()
const { t } = useI18n()
</script>

<template>
  <div :class="cn(compact ? 'min-w-0 flex-1' : 'grid gap-2', props.class)">
    <Label :for="inputId" :class="compact ? 'sr-only' : undefined">{{ label }}</Label>
    <div class="relative w-full items-center">
      <Input
        :id="inputId"
        v-model="model"
        class="pr-9 pl-10"
        type="search"
        autocomplete="off"
        :placeholder="placeholder"
      >
      </Input>
      <span class="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center px-2">
        <LucideSearch class="size-4 text-muted-foreground" />
      </span>
      <button
        v-if="model"
        type="button"
        class="absolute inset-y-0 end-0 flex items-center px-2.5 text-muted-foreground transition-colors hover:text-foreground"
        :aria-label="t('catalog.search.clear')"
        @click="model = ''"
      >
        <LucideX class="size-4" />
      </button>
    </div>
  </div>
</template>
