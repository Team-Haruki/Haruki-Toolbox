<script setup lang="ts">
import { ref } from "vue"
import { ChevronDown, Filter, RotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"

const props = withDefaults(defineProps<{
  title: string
  /** Result-count line shown in the header / footer (already translated). */
  countLabel?: string | null
  resetLabel: string
  /** Start collapsed (e.g. to save vertical space on smaller catalogs). */
  defaultCollapsed?: boolean
  /** Wrapper class for the fields. Defaults to a responsive select grid;
   *  pass a flex column for catalogs whose filters are full-width chip rows. */
  contentClass?: string
}>(), {
  countLabel: null,
  defaultCollapsed: false,
  contentClass: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
})

const emit = defineEmits<{ reset: [] }>()

const expanded = ref(!props.defaultCollapsed)
</script>

<template>
  <section class="grid gap-3 rounded-md border bg-muted/20 p-3">
    <button
      type="button"
      class="flex items-center gap-2 text-left text-sm font-medium"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <Filter class="size-4 shrink-0 text-muted-foreground" />
      <span>{{ title }}</span>
      <span v-if="countLabel && !expanded" class="min-w-0 truncate text-xs font-normal text-muted-foreground">
        · {{ countLabel }}
      </span>
      <ChevronDown
        class="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="expanded ? '' : '-rotate-90'"
      />
    </button>

    <template v-if="expanded">
      <div :class="contentClass">
        <slot />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted-foreground">{{ countLabel }}</p>
        <Button type="button" variant="ghost" size="sm" @click="emit('reset')">
          <RotateCcw class="size-4" />
          {{ resetLabel }}
        </Button>
      </div>
    </template>
  </section>
</template>
