<script setup lang="ts">
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronsLeft,
  LucideChevronsRight,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buildPaginationWindow, clampPage } from "@/lib/pagination-window"
import { CATALOG_PAGE_SIZES } from "./types"

const props = withDefaults(defineProps<{
  totalPages: number
  /** Total item count, for the summary line. */
  total?: number | null
  pageSizeOptions?: readonly number[]
  /** Scrolled to the top of the viewport (below the sticky topbar) after a page change. */
  anchor?: HTMLElement | null
  /** Hide the whole control when there is a single page and no page-size choice to make. */
  hideWhenSinglePage?: boolean
}>(), {
  total: null,
  pageSizeOptions: () => CATALOG_PAGE_SIZES,
  anchor: null,
  hideWhenSinglePage: false,
})

const page = defineModel<number>("page", { required: true })
const pageSize = defineModel<number>("pageSize", { required: true })

const { t } = useI18n()
const id = useId()

const currentPage = computed(() => clampPage(page.value, props.totalPages))
const windowItems = computed(() => buildPaginationWindow(currentPage.value, props.totalPages, 1))
const visible = computed(() => !(props.hideWhenSinglePage && props.totalPages <= 1 && (props.total ?? 0) <= Math.min(...props.pageSizeOptions)))

const jumpValue = ref(String(currentPage.value))
watch(currentPage, (value) => {
  jumpValue.value = String(value)
})

function scrollToAnchor() {
  const anchor = props.anchor
  if (!anchor || typeof window === "undefined") {
    return
  }
  const top = anchor.getBoundingClientRect().top + window.scrollY - 72
  if (window.scrollY > top) {
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
  }
}

function goTo(target: number) {
  const next = clampPage(target, props.totalPages)
  if (next === currentPage.value) {
    return
  }
  page.value = next
  scrollToAnchor()
}

function submitJump() {
  const parsed = Number(jumpValue.value)
  if (Number.isFinite(parsed)) {
    goTo(parsed)
  }
  jumpValue.value = String(clampPage(Number.isFinite(parsed) ? parsed : currentPage.value, props.totalPages))
}

function handlePageSizeUpdate(value: AcceptableValue) {
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed > 0) {
    pageSize.value = parsed
    page.value = 1
  }
}
</script>

<template>
  <nav
    v-if="visible"
    class="flex flex-wrap items-center justify-between gap-3"
    :aria-label="t('catalog.pagination.label')"
    data-slot="catalog-pagination"
  >
    <div class="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        class="hidden size-8 p-0 sm:inline-flex"
        :disabled="currentPage <= 1"
        :aria-label="t('catalog.pagination.first')"
        @click="goTo(1)"
      >
        <LucideChevronsLeft class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="size-8 p-0"
        :disabled="currentPage <= 1"
        :aria-label="t('catalog.pagination.prev')"
        @click="goTo(currentPage - 1)"
      >
        <LucideChevronLeft class="size-4" />
      </Button>

      <span class="px-2 text-sm tabular-nums sm:hidden">
        {{ t("catalog.pagination.pageOf", { page: currentPage, total: totalPages }) }}
      </span>

      <div class="hidden items-center gap-1 sm:flex">
        <template v-for="(item, index) in windowItems" :key="`${item}-${index}`">
          <span v-if="item === 'ellipsis'" class="px-1 text-sm text-muted-foreground" aria-hidden="true">…</span>
          <Button
            v-else
            :variant="item === currentPage ? 'default' : 'outline'"
            size="sm"
            class="min-w-8 px-2 tabular-nums"
            :aria-current="item === currentPage ? 'page' : undefined"
            :aria-label="t('catalog.pagination.page', { page: item })"
            @click="goTo(item)"
          >
            {{ item }}
          </Button>
        </template>
      </div>

      <Button
        variant="outline"
        size="sm"
        class="size-8 p-0"
        :disabled="currentPage >= totalPages"
        :aria-label="t('catalog.pagination.next')"
        @click="goTo(currentPage + 1)"
      >
        <LucideChevronRight class="size-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="hidden size-8 p-0 sm:inline-flex"
        :disabled="currentPage >= totalPages"
        :aria-label="t('catalog.pagination.last')"
        @click="goTo(totalPages)"
      >
        <LucideChevronsRight class="size-4" />
      </Button>
    </div>

    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <span v-if="total != null" class="hidden tabular-nums md:inline">
        {{ t("catalog.pagination.summary", { total, page: currentPage, pages: totalPages }) }}
      </span>
      <Label :id="`${id}-size-label`" :for="`${id}-size`" class="sr-only">{{ t("catalog.pagination.pageSize") }}</Label>
      <Select :id="`${id}-size`" :model-value="String(pageSize)" @update:model-value="handlePageSizeUpdate">
        <SelectTrigger size="sm" class="h-8 w-24 text-xs" :aria-labelledby="`${id}-size-label`">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="size in pageSizeOptions" :key="size" :value="String(size)">
            {{ t("catalog.pagination.perPage", { size }) }}
          </SelectItem>
        </SelectContent>
      </Select>
      <form
        v-if="totalPages > 1"
        class="hidden items-center gap-1 md:flex"
        @submit.prevent="submitJump"
      >
        <Label :for="`${id}-jump`" class="sr-only">{{ t("catalog.pagination.jump") }}</Label>
        <Input
          :id="`${id}-jump`"
          v-model="jumpValue"
          type="number"
          inputmode="numeric"
          :min="1"
          :max="totalPages"
          class="h-8 w-16 px-2 text-center text-xs tabular-nums"
          @blur="submitJump"
        />
        <span>/ {{ totalPages }}</span>
      </form>
    </div>
  </nav>
</template>
