<script setup lang="ts">
import { LucideChevronDown, LucideRotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const open = defineModel<boolean>("open", { required: true })

const props = withDefaults(defineProps<{
  title: string
  selectedCount: number
  selectedCountLabel: string
  priorityHint: string
  clearLabel: string
  clearDisabled?: boolean
  badgeClass?: string
}>(), {
  clearDisabled: false,
  badgeClass: "bg-primary/10 text-primary",
})

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <Collapsible v-slot="{ open: isOpen }" v-model:open="open" as-child>
    <section class="grid min-w-0 gap-3 py-4">
      <CollapsibleTrigger as-child>
        <button
          type="button"
          class="flex min-w-0 items-center justify-between gap-3 text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-10"
        >
          <span class="flex min-w-0 flex-wrap items-center gap-2 text-sm font-medium">
            <span>{{ props.title }}</span>
            <span
              v-if="props.selectedCount > 0"
              :class="[
                'rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                props.badgeClass,
              ]"
            >
              {{ props.selectedCountLabel }}
            </span>
          </span>
          <LucideChevronDown
            :class="[
              'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
              isOpen ? 'rotate-180' : '',
            ]"
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div v-if="isOpen" class="grid min-w-0 gap-3 pt-1">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-xs leading-5 text-muted-foreground">
              {{ props.priorityHint }}
            </p>
            <Button
              v-if="props.selectedCount > 0"
              type="button"
              size="sm"
              variant="outline"
              class="h-8 shrink-0"
              :disabled="props.clearDisabled"
              @click="emit('clear')"
            >
              <LucideRotateCcw class="size-3.5" />
              {{ props.clearLabel }}
            </Button>
          </div>

          <slot />
        </div>
      </CollapsibleContent>
    </section>
  </Collapsible>
</template>
