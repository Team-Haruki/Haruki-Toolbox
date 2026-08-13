<script setup lang="ts">
import { ref } from "vue"
import { useI18n } from "vue-i18n"
import { ChevronDown } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRankBorderContext } from "../composables/rank-border-context"

const { t } = useI18n()

const { detail } = useRankBorderContext()

const {
  comparisonRankInput,
  comparisonRank,
  comparisonLineRanks,
  comparisonSelectValue,
  comparisonSummary,
  updateComparisonSelect,
  applyComparisonInput,
} = detail

const comparisonOpen = ref(false)
</script>

<template>
  <div class="rank-border-comparison rounded-md border">
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 px-3 py-2 text-sm font-medium"
      :aria-expanded="comparisonOpen"
      @click="comparisonOpen = !comparisonOpen"
    >
      <span class="flex min-w-0 items-center gap-2">
        <span>{{ t("rankBorder.comparison.label") }}</span>
        <span v-if="comparisonRank != null" class="text-xs font-normal text-muted-foreground">T{{ comparisonRank }}</span>
      </span>
      <ChevronDown
        class="size-4 shrink-0 text-muted-foreground transition-transform"
        :class="comparisonOpen ? 'rotate-180' : ''"
      />
    </button>
    <div v-show="comparisonOpen" class="grid gap-2 border-t px-3 py-2.5">
      <div class="flex min-w-0 flex-wrap items-center gap-1.5">
        <Select :model-value="comparisonSelectValue" @update:model-value="updateComparisonSelect">
          <SelectTrigger class="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{{ t("rankBorder.comparison.none") }}</SelectItem>
            <SelectItem v-for="rank in comparisonLineRanks" :key="`comparison-${rank}`" :value="String(rank)">
              T{{ rank }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          v-model="comparisonRankInput"
          class="h-8 w-24 text-xs"
          :placeholder="t('rankBorder.comparison.customPlaceholder')"
          @keyup.enter="applyComparisonInput"
        />
        <Button variant="outline" size="sm" class="h-8 px-2 text-xs" @click="applyComparisonInput">
          {{ t("rankBorder.comparison.apply") }}
        </Button>
      </div>
      <div v-if="comparisonSummary" class="rounded-md border bg-muted/15 px-2.5 py-1.5 text-xs text-muted-foreground">
        {{ comparisonSummary }}
      </div>
    </div>
  </div>
</template>
