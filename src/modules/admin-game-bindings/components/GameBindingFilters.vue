<script setup lang="ts">
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
  LucidePlus,
  LucideRotateCcw,
  LucideSearch,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"

type FilterOption = {
  value: string
  label: string
}

/**
 * Search and filters as one compact panel: two cells across on a phone and
 * four on a wide panel; the fuzzy search takes two cells, the selects and
 * exact-match inputs one each, and the buttons the last cell.
 * Nothing applies until the form is submitted (the button, or Enter).
 */
const props = defineProps<{
  servers: ReadonlyArray<FilterOption>
  verifiedOptions: ReadonlyArray<FilterOption>
  sortOptions: ReadonlyArray<FilterOption>
  loading?: boolean
}>()

const filterQ = defineModel<string>("filterQ", { required: true })
const filterServer = defineModel<string>("filterServer", { required: true })
const filterUserId = defineModel<string>("filterUserId", { required: true })
const filterGameUserId = defineModel<string>("filterGameUserId", { required: true })
const filterVerified = defineModel<string>("filterVerified", { required: true })
const filterSort = defineModel<string>("filterSort", { required: true })

const emit = defineEmits<{
  (e: "apply"): void
  (e: "reset"): void
  (e: "add"): void
}>()

const { t, locale } = useI18n()
const FILTER_IDS = {
  query: "game-binding-filter-query",
  gameUser: "game-binding-filter-game-user",
  toolboxUser: "game-binding-filter-toolbox-user",
} as const

const LABEL = "text-xs text-muted-foreground"
</script>

<template>
  <section class="@container overflow-hidden rounded-xl border bg-card" data-slot="game-binding-filters">
    <header class="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
      <h2 class="min-w-0 truncate text-sm font-semibold">{{ t("adminGameBindings.filters.title") }}</h2>
      <Button size="sm" class="h-8 shrink-0 pointer-coarse:h-10" @click="emit('add')">
        <LucidePlus class="size-4" aria-hidden="true" />
        {{ t("adminGameBindings.filters.addButton") }}
      </Button>
    </header>
    <!-- A form so Enter in any input runs the query, like the 查询 button. -->
    <form
      class="grid grid-cols-2 gap-3 px-4 py-3 @min-[52rem]:grid-cols-4"
      novalidate
      @submit.prevent="emit('apply')"
    >
      <div class="col-span-2 flex min-w-0 flex-col gap-1">
        <Label :for="FILTER_IDS.query" :class="LABEL">{{ t("adminGameBindings.filters.fuzzySearch") }}</Label>
        <div class="relative">
          <LucideSearch class="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            :id="FILTER_IDS.query"
            v-model="filterQ"
            class="pl-8"
            :placeholder="t('adminGameBindings.filters.fuzzySearchPlaceholder')"
          />
        </div>
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label id="game-binding-filter-server-label" for="game-binding-filter-server" :class="LABEL">{{ t("adminGameBindings.filters.server") }}</Label>
        <Select id="game-binding-filter-server" :key="locale" :model-value="filterServer" @update:model-value="filterServer = String($event ?? '')">
          <SelectTrigger aria-labelledby="game-binding-filter-server-label" class="w-full">
            <SelectValue :placeholder="t('adminGameBindings.filters.allServers')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in props.servers" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label id="game-binding-filter-verified-label" for="game-binding-filter-verified" :class="LABEL">{{ t("adminGameBindings.filters.verification") }}</Label>
        <Select id="game-binding-filter-verified" :key="locale" :model-value="filterVerified" @update:model-value="filterVerified = String($event ?? '')">
          <SelectTrigger aria-labelledby="game-binding-filter-verified-label" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in props.verifiedOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label :for="FILTER_IDS.gameUser" :class="LABEL">{{ t("adminGameBindings.filters.exactGameId") }}</Label>
        <Input
          :id="FILTER_IDS.gameUser"
          v-model="filterGameUserId"
          inputmode="numeric"
          :placeholder="t('adminGameBindings.filters.exactGameIdPlaceholder')"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label :for="FILTER_IDS.toolboxUser" :class="LABEL">{{ t("adminGameBindings.filters.toolboxUserId") }}</Label>
        <Input
          :id="FILTER_IDS.toolboxUser"
          v-model="filterUserId"
          :placeholder="t('adminGameBindings.filters.toolboxUserIdPlaceholder')"
        />
      </div>
      <div class="flex min-w-0 flex-col gap-1">
        <Label id="game-binding-filter-sort-label" for="game-binding-filter-sort" :class="LABEL">{{ t("adminGameBindings.filters.sort") }}</Label>
        <Select id="game-binding-filter-sort" :key="locale" :model-value="filterSort" @update:model-value="filterSort = String($event ?? '')">
          <SelectTrigger aria-labelledby="game-binding-filter-sort-label" class="w-full">
            <SelectValue :placeholder="t('adminGameBindings.filters.sortPlaceholder')" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="opt in props.sortOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <!-- The buttons take the last cell and sit on the inputs' line. -->
      <div class="col-span-2 flex flex-wrap items-end justify-end gap-2 @min-[30rem]:col-span-1">
        <Button type="button" variant="outline" size="sm" class="h-9" @click="emit('reset')">
          <LucideRotateCcw class="size-4" aria-hidden="true" />
          {{ t("admin.filters.reset") }}
        </Button>
        <Button type="submit" size="sm" class="h-9" :disabled="props.loading">
          <LucideSearch class="size-4" aria-hidden="true" />
          {{ t("adminGameBindings.filters.searchButton") }}
        </Button>
      </div>
    </form>
  </section>
</template>
