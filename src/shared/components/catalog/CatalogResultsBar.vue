<script setup lang="ts">
import { useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { LucideArrowDownWideNarrow, LucideArrowUpNarrowWide } from "lucide-vue-next"
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
  countLabel: string
  sortOptions?: readonly CatalogSortOption[]
  viewOptions?: readonly CatalogViewOption[]
}>(), {
  sortOptions: () => [],
  viewOptions: () => [],
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
  <div class="flex flex-wrap items-center gap-2 text-sm" data-slot="catalog-results-bar">
    <p class="min-w-0 flex-1 text-muted-foreground tabular-nums" aria-live="polite">{{ countLabel }}</p>
    <slot name="extra" />
    <template v-if="sortOptions.length > 0">
      <Label :id="`${id}-sort-label`" :for="`${id}-sort`" class="sr-only">{{ t("catalog.sort.label") }}</Label>
      <Select :id="`${id}-sort`" :key="locale" :model-value="sort" @update:model-value="handleSortUpdate">
        <SelectTrigger size="sm" class="w-36 text-xs sm:text-sm" :aria-labelledby="`${id}-sort-label`">
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
