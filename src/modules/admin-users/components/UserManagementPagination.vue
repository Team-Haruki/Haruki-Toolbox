<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
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
} from "lucide-vue-next"

defineProps<{
  total: number
  page: number
  pageSize: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: "update:pageSize", value: number): void
  (e: "prevPage"): void
  (e: "nextPage"): void
}>()

const { t } = useI18n()

function handlePageSizeChange(value: unknown) {
  const pageSize = Number(value)
  if (!Number.isFinite(pageSize) || pageSize <= 0) return
  emit("update:pageSize", pageSize)
}
</script>

<template>
  <div class="flex items-center justify-between px-2">
    <div class="flex items-center gap-4">
      <span class="text-sm text-muted-foreground mr-2">
        {{ t("adminUsers.management.pagination.totalUsers", { total }) }}
      </span>
      <div class="flex items-center gap-2">
        <span class="text-sm text-muted-foreground hidden sm:inline">
          {{ t("adminUsers.management.pagination.pageSize") }}
        </span>
        <Select :model-value="String(pageSize)" @update:model-value="handlePageSizeChange">
          <SelectTrigger class="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" :disabled="page <= 1" @click="emit('prevPage')">
        <LucideChevronLeft class="w-4 h-4" />
      </Button>
      <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
      <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="emit('nextPage')">
        <LucideChevronRight class="w-4 h-4" />
      </Button>
    </div>
  </div>
</template>
