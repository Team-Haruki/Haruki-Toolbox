<script setup lang="ts">
import { useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { LucideArrowDownWideNarrow, LucideArrowUpNarrowWide, LucideCloudOff } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CatalogSortDirection, CatalogSortOption, CatalogViewOption } from "./types"

/**
 * The row between the filters and the results: result count on the left,
 * sort + direction + optional view switch on the right.
 */
withDefaults(defineProps<{
  /** Result count line; pass null while the list is still loading. */
  countLabel: string | null
  sortOptions?: readonly CatalogSortOption[]
  viewOptions?: readonly CatalogViewOption[]
  /** Stick below the topbar while the results scroll (long grids). */
  sticky?: boolean
  /**
   * The list shows locally cached game data because the last remote refresh
   * failed; renders a small non-blocking "offline data" badge.
   */
  offline?: boolean
}>(), {
  sortOptions: () => [],
  viewOptions: () => [],
  sticky: false,
  offline: false,
})

const sort = defineModel<string>("sort", { default: "" })
const direction = defineModel<CatalogSortDirection>("direction", { default: "desc" })
const view = defineModel<string>("view", { default: "" })

const { t, locale } = useI18n()
const id = useId()

function handleSortUpdate(value: AcceptableValue) {
  if (typeof value === "string") {
    sort.value = value
  }
}

function handleViewUpdate(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && value) {
    view.value = value
  }
}

function toggleDirection() {
  direction.value = direction.value === "asc" ? "desc" : "asc"
}
</script>

<template>
  <div
    :class="[
      'flex flex-wrap items-center gap-2 text-sm',
      // Sticky only from `sm`: on phones a pinned two-row bar would eat a
      // large share of the viewport.
      sticky ? 'sm:sticky sm:top-13 sm:z-30 sm:-mx-1 sm:rounded-md sm:border sm:bg-background/90 sm:px-2 sm:py-1.5 sm:shadow-sm sm:backdrop-blur sm:supports-[backdrop-filter]:bg-background/75' : '',
    ]"
    data-slot="catalog-results-bar"
  >
    <!-- The count takes its own row on phones instead of being crushed by the
         controls. `min-h-5` reserves that line while it is still empty so the
         bar does not grow (and shift the grid) when the count arrives. -->
    <p class="flex min-h-5 min-w-0 basis-full items-center gap-2 text-muted-foreground tabular-nums sm:flex-1 sm:basis-auto" aria-live="polite">
      <span class="min-w-0 truncate">{{ countLabel ?? "" }}</span>
      <Badge
        v-if="offline"
        variant="outline"
        size="sm"
        class="text-muted-foreground"
        :title="t('catalog.results.offlineHint')"
      >
        <LucideCloudOff aria-hidden="true" />
        {{ t("catalog.results.offline") }}
        <span class="sr-only">: {{ t("catalog.results.offlineHint") }}</span>
      </Badge>
    </p>
    <slot name="extra" />
    <template v-if="sortOptions.length > 0">
      <Label :id="`${id}-sort-label`" :for="`${id}-sort`" class="sr-only">{{ t("catalog.sort.label") }}</Label>
      <Select :id="`${id}-sort`" :key="locale" :model-value="sort" @update:model-value="handleSortUpdate">
        <SelectTrigger size="sm" class="w-32 text-xs sm:w-36 sm:text-sm" :aria-labelledby="`${id}-sort-label`">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="option in sortOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="size-8 p-0"
        :aria-label="t(`catalog.sort.${direction}`)"
        :title="t(`catalog.sort.${direction}`)"
        @click="toggleDirection"
      >
        <LucideArrowUpNarrowWide v-if="direction === 'asc'" class="size-4" />
        <LucideArrowDownWideNarrow v-else class="size-4" />
      </Button>
    </template>
    <ToggleGroup
      v-if="viewOptions.length > 0"
      type="single"
      variant="segment"
      size="sm"
      :model-value="view"
      :aria-label="t('catalog.view.label')"
      @update:model-value="handleViewUpdate"
    >
      <ToggleGroupItem
        v-for="option in viewOptions"
        :key="option.value"
        :value="option.value"
        :aria-label="option.label"
        :title="option.label"
        class="px-2"
      >
        <component :is="option.icon" v-if="option.icon" class="size-4" />
        <span :class="option.icon ? 'sr-only' : ''">{{ option.label }}</span>
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
</template>
