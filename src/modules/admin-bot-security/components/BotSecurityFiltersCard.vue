<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  LucideFilter,
  LucideRefreshCw,
  LucideSearch,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { BotSecurityAlertFilters } from "@/modules/admin-bot-security/lib/alert-meta"

type FilterOption = { value: string; label: string }

const props = defineProps<{
  statusOptions: ReadonlyArray<FilterOption>
  kindOptions: ReadonlyArray<FilterOption>
  loading: boolean
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

function toggleExpanded() {
  expanded.value = !expanded.value
}
</script>

<template>
  <Card>
    <CardHeader
      class="pb-3 cursor-pointer select-none"
      role="button"
      tabindex="0"
      :aria-expanded="expanded"
      @click="toggleExpanded"
      @keydown.enter.prevent="toggleExpanded"
      @keydown.space.prevent="toggleExpanded"
    >
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <LucideFilter class="w-4 h-4 shrink-0 text-muted-foreground" />
          <CardTitle class="text-base truncate">{{ t("adminBotSecurity.filters.title") }}</CardTitle>
        </div>
        <span class="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {{ expanded ? t("adminBotSecurity.filters.collapse") : t("adminBotSecurity.filters.expand") }}
          <LucideChevronDown
            class="w-4 h-4 transition-transform duration-200"
            :class="expanded ? 'rotate-180' : ''"
          />
        </span>
      </div>
    </CardHeader>
    <CardContent v-if="expanded" class="pt-0">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div class="flex flex-col gap-1.5">
          <Label id="bot-security-filter-status-label" for="bot-security-filter-status" class="text-sm">
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
        <div class="flex flex-col gap-1.5">
          <Label id="bot-security-filter-kind-label" for="bot-security-filter-kind" class="text-sm">
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
        <div class="flex flex-col gap-1.5">
          <Label for="bot-security-filter-bot-id" class="text-sm">{{ t("adminBotSecurity.filters.botId") }}</Label>
          <Input
            id="bot-security-filter-bot-id"
            :model-value="filters.botId"
            :placeholder="t('adminBotSecurity.filters.botIdPlaceholder')"
            maxlength="64"
            @update:model-value="update('botId', String($event))"
            @keydown.enter.prevent="emit('apply')"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="bot-security-filter-from" class="text-sm">{{ t("adminBotSecurity.filters.from") }}</Label>
          <DateTimePicker24h
            id="bot-security-filter-from"
            :model-value="filters.from"
            :placeholder="t('adminBotSecurity.filters.fromPlaceholder')"
            @update:model-value="update('from', $event)"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label for="bot-security-filter-to" class="text-sm">{{ t("adminBotSecurity.filters.to") }}</Label>
          <DateTimePicker24h
            id="bot-security-filter-to"
            :model-value="filters.to"
            :placeholder="t('adminBotSecurity.filters.toPlaceholder')"
            @update:model-value="update('to', $event)"
          />
        </div>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <Button size="sm" :disabled="props.loading" @click="emit('apply')">
          <LucideSearch class="w-4 h-4 mr-1" />
          {{ t("adminBotSecurity.actions.search") }}
        </Button>
        <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('reset')">
          <LucideRefreshCw class="w-4 h-4 mr-1" />
          {{ t("common.reset") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
