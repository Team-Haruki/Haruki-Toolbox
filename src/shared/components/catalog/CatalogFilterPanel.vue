<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useMediaQuery } from "@vueuse/core"
import { ChevronDown, Filter, RotateCcw, X } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"

export type CatalogActiveChip = {
  key: string
  label: string
  /**
   * The label is a placeholder (an id) until master data resolves it; the
   * panel draws a skeleton chip (no remove button) instead of flashing "#21".
   * Set it only while the index that names the value is still loading: an
   * id the loaded index does not know must be a normal removable chip
   * (labelled `#id`), or the user can never dismiss it short of resetting
   * every filter.
   */
  pending?: boolean
}

const props = withDefaults(defineProps<{
  title: string
  /** Result-count line shown in the header / footer (already translated). */
  countLabel?: string | null
  resetLabel: string
  /** Start collapsed regardless of viewport (legacy prop; `pageKey` memory wins when set). */
  defaultCollapsed?: boolean
  /**
   * Remembers the open/closed state per page in localStorage. Catalog pages
   * (which set it) start collapsed on every viewport: the chip row carries
   * the active state, and an open panel pushed the first result rows below
   * the fold on a 1280×800 screen.
   */
  pageKey?: string | null
  /** Number of active filters, shown as a badge next to the title. */
  activeCount?: number | null
  /** Active filters rendered as removable chips while the panel is collapsed. */
  activeChips?: readonly CatalogActiveChip[]
  /** Wrapper class for the fields. Defaults to a responsive select grid;
   *  pass a flex column for catalogs whose filters are full-width chip rows. */
  contentClass?: string
  /**
   * Below `sm`, open the fields in a bottom sheet instead of an inline
   * accordion (which inserted ~1000 px between the toolbar and the results).
   * Defaults to on for pages with a `pageKey`; pickers embedded in dialogs
   * keep the inline accordion.
   */
  mobileSheet?: boolean | null
}>(), {
  countLabel: null,
  defaultCollapsed: false,
  pageKey: null,
  activeCount: null,
  activeChips: () => [],
  contentClass: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  mobileSheet: null,
})

const emit = defineEmits<{
  reset: []
  removeChip: [key: string]
}>()

const { t } = useI18n()

// Only pages that opt into memory (`pageKey`) start collapsed; other
// consumers (the deck-recommend pickers) keep the historical open default.
const initialOpen = () => (props.defaultCollapsed ? false : props.pageKey == null)
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

// `sm` breakpoint; reactive so a rotation moves the fields between the
// sheet and the inline panel without a reload.
const narrow = useMediaQuery("(max-width: 639px)")
const useSheet = computed(() => (props.mobileSheet ?? props.pageKey != null) && narrow.value)
const sheetOpen = ref(false)

watch(useSheet, (sheet) => {
  if (!sheet) {
    sheetOpen.value = false
  }
})

const inlineExpanded = computed(() => expanded.value && !useSheet.value)
const isOpen = computed(() => (useSheet.value ? sheetOpen.value : expanded.value))
const showActiveBadge = computed(() => props.activeCount != null && props.activeCount > 0)
const showChips = computed(() => !inlineExpanded.value && props.activeChips.length > 0)

function toggle() {
  if (useSheet.value) {
    sheetOpen.value = true
    return
  }
  expanded.value = !expanded.value
}

/** Opens the panel (or the sheet on phones); used by results bars on narrow screens. */
function open() {
  if (useSheet.value) {
    sheetOpen.value = true
  } else {
    expanded.value = true
  }
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
      :aria-expanded="isOpen"
      :aria-haspopup="useSheet ? 'dialog' : undefined"
      @click="toggle"
    >
      <Filter class="size-4 shrink-0 text-muted-foreground" />
      <span>{{ title }}</span>
      <Badge v-if="showActiveBadge" size="sm" class="tabular-nums">{{ activeCount }}</Badge>
      <span v-if="countLabel && !inlineExpanded" class="min-w-0 truncate text-xs font-normal text-muted-foreground">
        · {{ countLabel }}
      </span>
      <ChevronDown
        class="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="inlineExpanded ? '' : '-rotate-90'"
      />
    </button>

    <ul v-if="showChips" class="m-0 flex list-none flex-wrap items-center gap-1.5 p-0" :aria-label="t('catalog.filters.title')">
      <!-- The whole chip removes the filter: a comfortable touch target on phones. -->
      <li v-for="chip in activeChips" :key="chip.key" class="flex max-w-full">
        <Skeleton v-if="chip.pending" class="h-8 w-20 rounded-full" aria-hidden="true" />
        <button
          v-else
          type="button"
          class="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border bg-background py-1 pr-2 pl-2.5 text-xs transition-colors hover:bg-muted dark:bg-input/30"
          :aria-label="`${t('catalog.filters.reset')}: ${chip.label}`"
          @click="emit('removeChip', chip.key)"
        >
          <span class="truncate">{{ chip.label }}</span>
          <X class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
      </li>
      <li class="flex">
        <button
          type="button"
          class="inline-flex min-h-8 items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          @click="emit('reset')"
        >
          <RotateCcw class="size-3" />
          {{ t("catalog.filters.clearAll") }}
        </button>
      </li>
    </ul>

    <template v-if="inlineExpanded">
      <!-- Capped on wide screens so at least two result rows stay visible
           under an open panel; the fields scroll inside. -->
      <div class="sm:max-h-[min(50vh,28rem)] sm:overflow-y-auto sm:overscroll-contain">
        <div :class="contentClass">
          <slot />
        </div>
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

    <!-- Phones: the fields live in a bottom sheet. `route.query` stays the
         single source of truth — every change applies immediately and the
         footer's live count shows the effect; "Done" only closes. -->
    <Sheet v-if="useSheet" v-model:open="sheetOpen">
      <SheetContent
        side="bottom"
        class="flex max-h-[85dvh] flex-col gap-0 rounded-t-xl p-0"
        data-slot="catalog-filter-sheet"
      >
        <SheetHeader class="border-b py-3 pr-12">
          <SheetTitle class="flex items-center gap-2 text-base">
            <Filter class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            {{ title }}
            <Badge v-if="showActiveBadge" size="sm" class="tabular-nums">{{ activeCount }}</Badge>
          </SheetTitle>
          <SheetDescription class="sr-only">{{ t("catalog.filters.sheetDescription") }}</SheetDescription>
        </SheetHeader>
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          <div :class="contentClass">
            <slot />
          </div>
        </div>
        <SheetFooter class="mt-0 flex-row items-center gap-2 border-t bg-background py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p class="min-w-0 flex-1 truncate text-sm text-muted-foreground tabular-nums" aria-live="polite">
            {{ countLabel ?? "" }}
          </p>
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
          <Button type="button" size="sm" @click="sheetOpen = false">
            {{ t("catalog.filters.done") }}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  </section>
</template>
