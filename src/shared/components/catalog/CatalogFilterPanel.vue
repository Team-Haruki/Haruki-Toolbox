<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDown, Filter, RotateCcw, X } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isNarrowViewport, useCatalogViewPreference } from "@/composables/useCatalogViewPreference"

export type CatalogActiveChip = {
  key: string
  label: string
}

const props = withDefaults(defineProps<{
  title: string
  /** Result-count line shown in the header / footer (already translated). */
  countLabel?: string | null
  resetLabel: string
  /** Start collapsed regardless of viewport (legacy prop; `pageKey` memory wins when set). */
  defaultCollapsed?: boolean
  /**
   * Remembers the open/closed state per page in localStorage. Without it the
   * panel opens on wide viewports and starts collapsed on phones.
   */
  pageKey?: string | null
  /** Number of active filters, shown as a badge next to the title. */
  activeCount?: number | null
  /** Active filters rendered as removable chips while the panel is collapsed. */
  activeChips?: readonly CatalogActiveChip[]
  /** Wrapper class for the fields. Defaults to a responsive select grid;
   *  pass a flex column for catalogs whose filters are full-width chip rows. */
  contentClass?: string
}>(), {
  countLabel: null,
  defaultCollapsed: false,
  pageKey: null,
  activeCount: null,
  activeChips: () => [],
  contentClass: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
})

const emit = defineEmits<{
  reset: []
  removeChip: [key: string]
}>()

const { t } = useI18n()

const initialOpen = () => (props.defaultCollapsed ? false : !isNarrowViewport())
const remembered = props.pageKey ? useCatalogViewPreference<boolean>(props.pageKey, "filtersOpen", initialOpen) : null
const local = ref(initialOpen())

const expanded = computed({
  get: () => (remembered ? remembered.value : local.value),
  set: (value: boolean) => {
    if (remembered) {
      remembered.value = value
    } else {
      local.value = value
    }
  },
})

const showActiveBadge = computed(() => props.activeCount != null && props.activeCount > 0)
const showChips = computed(() => !expanded.value && props.activeChips.length > 0)

/** Opens the panel; used by results bars on narrow screens. */
function open() {
  expanded.value = true
}

watch(() => props.defaultCollapsed, (collapsed) => {
  if (collapsed && !remembered) {
    local.value = false
  }
})

defineExpose({ open, expanded })
</script>

<template>
  <section class="grid gap-3 rounded-md border bg-muted/20 p-3" data-slot="catalog-filter-panel">
    <button
      type="button"
      class="flex min-h-9 items-center gap-2 text-left text-sm font-medium"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <Filter class="size-4 shrink-0 text-muted-foreground" />
      <span>{{ title }}</span>
      <Badge v-if="showActiveBadge" size="sm" class="tabular-nums">{{ activeCount }}</Badge>
      <span v-if="countLabel && !expanded" class="min-w-0 truncate text-xs font-normal text-muted-foreground">
        · {{ countLabel }}
      </span>
      <ChevronDown
        class="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="expanded ? '' : '-rotate-90'"
      />
    </button>

    <div v-if="showChips" class="flex flex-wrap items-center gap-1.5" role="list" :aria-label="t('catalog.filters.title')">
      <span
        v-for="chip in activeChips"
        :key="chip.key"
        role="listitem"
        class="inline-flex max-w-full items-center gap-1 rounded-full border bg-background py-0.5 pr-1 pl-2.5 text-xs dark:bg-input/30"
      >
        <span class="truncate">{{ chip.label }}</span>
        <button
          type="button"
          class="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          :aria-label="`${t('catalog.filters.reset')}: ${chip.label}`"
          @click="emit('removeChip', chip.key)"
        >
          <X class="size-3" />
        </button>
      </span>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        @click="emit('reset')"
      >
        <RotateCcw class="size-3" />
        {{ t("catalog.filters.clearAll") }}
      </button>
    </div>

    <template v-if="expanded">
      <div :class="contentClass">
        <slot />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted-foreground">{{ countLabel }}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          :disabled="activeCount != null && activeCount === 0"
          @click="emit('reset')"
        >
          <RotateCcw class="size-4" />
          {{ resetLabel }}
        </Button>
      </div>
    </template>
  </section>
</template>
