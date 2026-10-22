<script setup lang="ts">
/**
 * The pager every admin list shares (first/prev/numeric jump/next/last,
 * page-size select and a "N items" summary), generalised from the user list.
 * The page-size change is emitted; the list resets to page 1 and reloads.
 */
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
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
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideChevronsLeft,
  LucideChevronsRight,
} from "lucide-vue-next"
import { formatNumberCN } from "@/lib/number-format"
import { ADMIN_PAGE_SIZE_OPTIONS } from "@/modules/admin/lib/pagination"

const props = withDefaults(
  defineProps<{
    total: number
    page: number
    pageSize: number
    totalPages: number
    pageSizeOptions?: readonly number[]
    disabled?: boolean
    /** Replaces the default "N items" summary (e.g. "N users"). */
    totalLabel?: string
  }>(),
  {
    pageSizeOptions: () => ADMIN_PAGE_SIZE_OPTIONS,
    disabled: false,
    totalLabel: "",
  }
)

const emit = defineEmits<{
  (e: "update:pageSize", value: number): void
  (e: "prevPage"): void
  (e: "nextPage"): void
  (e: "goToPage", value: number): void
}>()

const { t, locale } = useI18n()
const uid = useId()
const pageSizeId = `${uid}-page-size`
const pageSizeLabelId = `${uid}-page-size-label`

const displayTotalPages = computed(() => Math.max(props.totalPages, 1))
const summary = computed(() => props.totalLabel || t("admin.pagination.total", { total: formatNumberCN(props.total, "0") }))

function handlePageSizeChange(value: unknown) {
  const pageSize = Number(value)
  if (!Number.isFinite(pageSize) || pageSize <= 0 || pageSize === props.pageSize) return
  emit("update:pageSize", pageSize)
}

// Local mirror of the page input so the user can type freely before committing.
const pageInput = ref(String(props.page))
watch(
  () => props.page,
  (value) => {
    pageInput.value = String(value)
  }
)

function commitPageInput() {
  const parsed = Number(pageInput.value)
  if (!Number.isFinite(parsed)) {
    pageInput.value = String(props.page)
    return
  }
  const target = Math.min(Math.max(Math.trunc(parsed), 1), displayTotalPages.value)
  pageInput.value = String(target)
  if (target !== props.page) {
    emit("goToPage", target)
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-3" data-slot="admin-pagination">
    <div class="flex flex-wrap items-center gap-4">
      <span class="text-sm text-muted-foreground tabular-nums">{{ summary }}</span>
      <div class="flex items-center gap-2">
        <Label :id="pageSizeLabelId" :for="pageSizeId" class="text-sm text-muted-foreground hidden sm:inline">
          {{ t("admin.pagination.pageSize") }}
        </Label>
        <Select
          :id="pageSizeId"
          :key="locale"
          :model-value="String(pageSize)"
          :disabled="disabled"
          @update:model-value="handlePageSizeChange"
        >
          <SelectTrigger class="w-20 h-8" :aria-labelledby="pageSizeLabelId">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in pageSizeOptions" :key="option" :value="String(option)">
              {{ option }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        :disabled="disabled || page <= 1"
        :title="t('admin.pagination.firstPage')"
        :aria-label="t('admin.pagination.firstPage')"
        @click="emit('goToPage', 1)"
      >
        <LucideChevronsLeft class="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="disabled || page <= 1"
        :title="t('admin.pagination.prevPage')"
        :aria-label="t('admin.pagination.prevPage')"
        @click="emit('prevPage')"
      >
        <LucideChevronLeft class="w-4 h-4" />
      </Button>
      <div class="flex items-center gap-1.5 text-sm">
        <Input
          :model-value="pageInput"
          inputmode="numeric"
          class="w-12 h-8 text-center tabular-nums px-1"
          :disabled="disabled"
          :aria-label="t('admin.pagination.jumpToPage')"
          @update:model-value="pageInput = String($event ?? '')"
          @keyup.enter="commitPageInput"
          @blur="commitPageInput"
        />
        <span class="text-muted-foreground tabular-nums whitespace-nowrap">/ {{ displayTotalPages }}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        :disabled="disabled || page >= displayTotalPages"
        :title="t('admin.pagination.nextPage')"
        :aria-label="t('admin.pagination.nextPage')"
        @click="emit('nextPage')"
      >
        <LucideChevronRight class="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        :disabled="disabled || page >= displayTotalPages"
        :title="t('admin.pagination.lastPage')"
        :aria-label="t('admin.pagination.lastPage')"
        @click="emit('goToPage', displayTotalPages)"
      >
        <LucideChevronsRight class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
