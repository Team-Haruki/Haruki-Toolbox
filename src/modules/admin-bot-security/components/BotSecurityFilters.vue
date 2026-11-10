<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
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
  LucideChevronDown,
  LucideRotateCcw,
  LucideSearch,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import { BOT_SECURITY_FILTER_IDS } from "@/modules/admin-bot-security/composables/useBotSecurityAlerts"
import {
  BOT_SECURITY_DEFAULT_STATUS_FILTER,
  BOT_SECURITY_FILTER_ALL,
  type BotSecurityAlertFilters,
} from "@/modules/admin-bot-security/lib/alert-meta"

type FilterOption = { value: string; label: string }

/**
 * The alert filters as one compact panel: three selects and inputs across, the
 * time range and the buttons on the second line. It folds to its heading on
 * phones (`expanded`), where it says how many filters differ from the default.
 */
const props = defineProps<{
  statusOptions: ReadonlyArray<FilterOption>
  kindOptions: ReadonlyArray<FilterOption>
  loading: boolean
  /** Inline message under the pickers once a query was attempted with an inverted range. */
  timeRangeError?: string | null
}>()

const filters = defineModel<BotSecurityAlertFilters>("filters", { required: true })
const expanded = defineModel<boolean>("expanded", { default: true })

const emit = defineEmits<{
  (event: "apply"): void
  (event: "reset"): void
}>()

const { t, locale } = useI18n()

function update<K extends keyof BotSecurityAlertFilters>(key: K, value: BotSecurityAlertFilters[K]) {
  filters.value = { ...filters.value, [key]: value }
}

function updateSelect(key: "status" | "kind", value: unknown) {
  if (typeof value === "string") update(key, value)
}

const changedCount = computed(() => {
  const value = filters.value
  return [
    value.status !== BOT_SECURITY_DEFAULT_STATUS_FILTER,
    value.kind !== BOT_SECURITY_FILTER_ALL,
    value.botId.trim() !== "",
    !!value.from,
    !!value.to,
  ].filter(Boolean).length
})
</script>

<template>
  <section class="@container overflow-hidden rounded-xl border bg-card" data-slot="bot-security-filters">
    <header class="flex items-center justify-between gap-3 px-4 py-2.5">
      <h2 class="flex min-w-0 items-center gap-2 text-sm font-semibold">
        <span class="truncate">{{ t("adminBotSecurity.filters.title") }}</span>
        <span
          v-if="changedCount > 0"
          class="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-primary"
        >
          {{ t("adminBotSecurity.filters.changed", { count: changedCount }) }}
        </span>
      </h2>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-7 gap-1 px-2 text-xs text-muted-foreground pointer-coarse:h-10"
        :aria-expanded="expanded"
        aria-controls="bot-security-filter-form"
        @click="expanded = !expanded"
      >
        {{ expanded ? t("adminBotSecurity.filters.collapse") : t("adminBotSecurity.filters.expand") }}
        <LucideChevronDown class="size-4 transition-transform duration-200" :class="expanded ? 'rotate-180' : ''" aria-hidden="true" />
      </Button>
    </header>
    <form
      v-if="expanded"
      id="bot-security-filter-form"
      class="grid grid-cols-1 gap-x-3 gap-y-3 border-t border-border/60 px-4 py-3 @min-[30rem]:grid-cols-2 @min-[50rem]:grid-cols-3"
      novalidate
      @submit.prevent="emit('apply')"
    >
      <div class="flex min-w-0 flex-col gap-1">
        <Label id="bot-security-filter-status-label" for="bot-security-filter-status" class="text-xs text-muted-foreground">
          {{ t("adminBotSecurity.filters.status") }}
        </Label>
        <Select
          id="bot-security-filter-status"
          :key="locale"
          :model-value="filters.status"
          @update:model-value="updateSelect('status', $event)"
        >
          <SelectTrigger aria-labelledby="bot-security-filter-status-label" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in props.statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label id="bot-security-filter-kind-label" for="bot-security-filter-kind" class="text-xs text-muted-foreground">
          {{ t("adminBotSecurity.filters.kind") }}
        </Label>
        <Select
          id="bot-security-filter-kind"
          :key="locale"
          :model-value="filters.kind"
          @update:model-value="updateSelect('kind', $event)"
        >
          <SelectTrigger aria-labelledby="bot-security-filter-kind-label" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in props.kindOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label for="bot-security-filter-bot-id" class="text-xs text-muted-foreground">{{ t("adminBotSecurity.filters.botId") }}</Label>
        <Input
          id="bot-security-filter-bot-id"
          :model-value="filters.botId"
          :placeholder="t('adminBotSecurity.filters.botIdPlaceholder')"
          maxlength="64"
          @update:model-value="update('botId', String($event))"
          @keydown.enter.prevent="emit('apply')"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label :for="BOT_SECURITY_FILTER_IDS.from" class="text-xs text-muted-foreground">{{ t("adminBotSecurity.filters.from") }}</Label>
        <DateTimePicker24h
          :id="BOT_SECURITY_FILTER_IDS.from"
          :model-value="filters.from"
          :invalid="!!props.timeRangeError"
          :placeholder="t('adminBotSecurity.filters.fromPlaceholder')"
          @update:model-value="update('from', $event)"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label :for="BOT_SECURITY_FILTER_IDS.to" class="text-xs text-muted-foreground">{{ t("adminBotSecurity.filters.to") }}</Label>
        <DateTimePicker24h
          :id="BOT_SECURITY_FILTER_IDS.to"
          :model-value="filters.to"
          :invalid="!!props.timeRangeError"
          :placeholder="t('adminBotSecurity.filters.toPlaceholder')"
          @update:model-value="update('to', $event)"
        />
        <FieldError id="bot-security-filter-time-range-error" :message="props.timeRangeError" />
      </div>
      <!-- The buttons take the last cell and sit on the inputs' line. -->
      <div class="flex flex-wrap items-end gap-2 @min-[30rem]:justify-end">
        <Button type="button" variant="outline" size="sm" class="h-9" :disabled="props.loading" @click="emit('reset')">
          <LucideRotateCcw class="size-4" aria-hidden="true" />
          {{ t("admin.filters.reset") }}
        </Button>
        <Button type="submit" size="sm" class="h-9" :disabled="props.loading">
          <LucideSearch class="size-4" aria-hidden="true" />
          {{ t("adminBotSecurity.actions.search") }}
        </Button>
      </div>
    </form>
  </section>
</template>
