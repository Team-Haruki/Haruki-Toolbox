<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"

type FilterOption = {
  value: string
  label: string
}

defineProps<{
  filterQ: string
  filterServer: string
  filterUserId: string
  filterGameUserId: string
  filterSort: string
  servers: ReadonlyArray<FilterOption>
  sortOptions: ReadonlyArray<FilterOption>
}>()
const { t, locale } = useI18n()

const emit = defineEmits<{
  (e: "update:filterQ", value: string): void
  (e: "update:filterServer", value: string): void
  (e: "update:filterUserId", value: string): void
  (e: "update:filterGameUserId", value: string): void
  (e: "update:filterSort", value: string): void
  (e: "apply"): void
  (e: "reset"): void
  (e: "add"): void
}>()
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex items-center gap-2">
        <LucideSearch class="w-5 h-5 text-muted-foreground" />
        <CardTitle class="text-base">{{ t("adminGameBindings.filters.title") }}</CardTitle>
        <div class="ml-auto">
          <Button size="sm" @click="emit('add')">
            <LucidePlus class="w-4 h-4 mr-1" />
            {{ t("adminGameBindings.filters.addButton") }}
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminGameBindings.filters.fuzzySearch") }}</Label>
          <Input
            :model-value="filterQ"
            :placeholder="t('adminGameBindings.filters.fuzzySearchPlaceholder')"
            @update:model-value="emit('update:filterQ', String($event ?? ''))"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminGameBindings.filters.exactGameId") }}</Label>
          <Input
            :model-value="filterGameUserId"
            :placeholder="t('adminGameBindings.filters.exactGameIdPlaceholder')"
            @update:model-value="emit('update:filterGameUserId', String($event ?? ''))"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminGameBindings.filters.toolboxUserId") }}</Label>
          <Input
            :model-value="filterUserId"
            :placeholder="t('adminGameBindings.filters.toolboxUserIdPlaceholder')"
            @update:model-value="emit('update:filterUserId', String($event ?? ''))"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminGameBindings.filters.server") }}</Label>
          <Select :key="locale" :model-value="filterServer" @update:model-value="emit('update:filterServer', String($event ?? ''))">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('adminGameBindings.filters.allServers')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in servers" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label class="text-sm">{{ t("adminGameBindings.filters.sort") }}</Label>
          <Select :key="locale" :model-value="filterSort" @update:model-value="emit('update:filterSort', String($event ?? ''))">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('adminGameBindings.filters.sortPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex items-center gap-2 mt-4">
        <Button size="sm" @click="emit('apply')">
          <LucideSearch class="w-4 h-4 mr-1" />
          {{ t("adminGameBindings.filters.searchButton") }}
        </Button>
        <Button variant="outline" size="sm" @click="emit('reset')">
          <LucideRefreshCw class="w-4 h-4 mr-1" />
          {{ t("common.reset") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
