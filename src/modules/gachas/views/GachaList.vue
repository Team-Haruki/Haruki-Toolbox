<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideChevronLeft,
  LucideChevronRight,
  LucideRefreshCcw,
  LucideSearch,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { formatLocalizedDate } from "@/lib/date-time"
import { SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE } from "@/shared/sekai/catalog-region"
import type { GachaSortKey, GachaStatus } from "@/modules/gachas/lib/gacha-catalog"
import {
  buildGachaBannerCandidates,
  buildGachaLogoCandidates,
  collectGachaYears,
  countGachaPages,
  filterGachas,
  GACHA_SORT_KEYS,
  GACHA_STATUSES,
  GACHA_TYPES,
  isGachaType,
  paginateGachas,
  resolveGachaStatus,
  sortGachas,
} from "@/modules/gachas/lib/gacha-catalog"
import { useGachaCatalog } from "@/modules/gachas/composables/useGachaCatalog"
import GachaAssetImage from "@/modules/gachas/components/GachaAssetImage.vue"
import GachaStatusBadge from "@/modules/gachas/components/GachaStatusBadge.vue"

const PAGE_SIZE = 24
const ALL = "all"

const { t, locale } = useI18n()

const {
  loading,
  error,
  region,
  regionSelectorValue,
  updateRegionSelector,
  assetEndpoint,
  gachas,
  reload,
} = useGachaCatalog()

const search = ref("")
const typeFilter = ref(ALL)
const statusFilter = ref(ALL)
const yearFilter = ref(ALL)
const sortKey = ref<GachaSortKey>("startDesc")
const page = ref(1)

const nowMs = ref(Date.now())
const nowTimer = setInterval(() => {
  nowMs.value = Date.now()
}, 30_000)

onBeforeUnmount(() => {
  clearInterval(nowTimer)
})

const selectedRegion = computed<string>({
  get: () => regionSelectorValue.value,
  set: (value) => updateRegionSelector(value),
})

const years = computed(() => collectGachaYears(gachas.value))

const filteredGachas = computed(() => {
  const year = yearFilter.value === ALL ? null : Number(yearFilter.value)
  return sortGachas(
    filterGachas(
      gachas.value,
      {
        search: search.value,
        gachaType: typeFilter.value === ALL ? null : typeFilter.value,
        status: statusFilter.value === ALL ? null : (statusFilter.value as GachaStatus),
        year: Number.isFinite(year) ? year : null,
      },
      nowMs.value,
    ),
    sortKey.value,
  )
})

const totalPages = computed(() => countGachaPages(filteredGachas.value.length, PAGE_SIZE))

const pagedGachaViews = computed(() => paginateGachas(filteredGachas.value, page.value, PAGE_SIZE)
  .map((gacha) => ({
    gacha,
    status: resolveGachaStatus(gacha, nowMs.value),
    imageSources: [
      ...buildGachaLogoCandidates(gacha, region.value, assetEndpoint.value),
      ...buildGachaBannerCandidates(gacha, region.value, assetEndpoint.value),
    ],
  })))

watch([search, typeFilter, statusFilter, yearFilter, sortKey, region], () => {
  page.value = 1
})

function gachaTypeLabel(gachaType: string): string {
  return isGachaType(gachaType) ? t(`gachas.type.${gachaType}`) : gachaType || t("gachas.type.unknown")
}

function formatGachaDate(value: number | null) {
  return formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("gachas.common.dateFallback"))
}

function prevPage() {
  page.value = Math.max(1, page.value - 1)
}

function nextPage() {
  page.value = Math.min(totalPages.value, page.value + 1)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-4">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("gachas.list.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("gachas.list.description") }}</p>
      </div>
      <div class="flex items-center gap-2">
        <Select :key="locale" v-model="selectedRegion">
          <SelectTrigger class="w-32" :aria-label="t('gachas.common.region')">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
              {{ t("sekaiRegion.followAccount") }}
            </SelectItem>
            <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
              {{ t(option.labelKey) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <div class="relative w-full sm:w-64">
          <LucideSearch class="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="search"
            class="pl-8"
            :placeholder="t('gachas.list.searchPlaceholder')"
          />
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div class="grid gap-1.5">
        <Label class="text-xs text-muted-foreground">{{ t("gachas.list.typeLabel") }}</Label>
        <Select :key="locale" v-model="typeFilter">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL">{{ t("gachas.list.allTypes") }}</SelectItem>
            <SelectItem v-for="gachaType in GACHA_TYPES" :key="gachaType" :value="gachaType">
              {{ t(`gachas.type.${gachaType}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label class="text-xs text-muted-foreground">{{ t("gachas.list.statusLabel") }}</Label>
        <Select :key="locale" v-model="statusFilter">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL">{{ t("gachas.list.allStatuses") }}</SelectItem>
            <SelectItem v-for="status in GACHA_STATUSES" :key="status" :value="status">
              {{ t(`gachas.status.${status}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label class="text-xs text-muted-foreground">{{ t("gachas.list.yearLabel") }}</Label>
        <Select :key="locale" v-model="yearFilter">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="ALL">{{ t("gachas.list.allYears") }}</SelectItem>
            <SelectItem v-for="year in years" :key="year" :value="String(year)">
              {{ year }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-1.5">
        <Label class="text-xs text-muted-foreground">{{ t("gachas.list.sortLabel") }}</Label>
        <Select :key="locale" v-model="sortKey">
          <SelectTrigger class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="key in GACHA_SORT_KEYS" :key="key" :value="key">
              {{ t(`gachas.sort.${key}`) }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <div v-for="index in 9" :key="index" class="flex flex-col gap-1.5">
        <Skeleton class="aspect-[2/1] w-full rounded-md" />
        <Skeleton class="h-4 w-4/5" />
        <Skeleton class="h-3 w-1/2" />
      </div>
    </div>

    <!-- Error -->
    <Card v-else-if="error">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("gachas.common.loadError") }}</p>
        <p class="max-w-full truncate font-mono text-xs text-muted-foreground">{{ error }}</p>
        <Button variant="outline" size="sm" @click="reload">
          <LucideRefreshCcw class="mr-1 size-4" /> {{ t("gachas.common.retry") }}
        </Button>
      </CardContent>
    </Card>

    <template v-else>
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>{{ t("gachas.list.total", { total: filteredGachas.length }) }}</span>
      </div>

      <!-- Grid -->
      <div
        v-if="pagedGachaViews.length > 0"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        <RouterLink
          v-for="view in pagedGachaViews"
          :key="view.gacha.id"
          :to="{ name: 'gachas.detail', params: { gachaId: view.gacha.id } }"
          class="group rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Card class="h-full overflow-hidden py-0 transition-shadow group-hover:shadow-md">
            <CardContent class="flex h-full flex-col gap-2 p-3">
              <div class="aspect-[2/1] w-full overflow-hidden rounded-md bg-muted">
                <GachaAssetImage :sources="view.imageSources" :alt="view.gacha.name" />
              </div>
              <h3 class="line-clamp-2 text-sm font-semibold leading-tight group-hover:underline">
                {{ view.gacha.name }}
              </h3>
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {{ gachaTypeLabel(view.gacha.gachaType) }}
                </span>
                <GachaStatusBadge :status="view.status" />
              </div>
              <div class="mt-auto text-xs text-muted-foreground">
                {{ formatGachaDate(view.gacha.startAt) }} – {{ formatGachaDate(view.gacha.endAt) }}
              </div>
            </CardContent>
          </Card>
        </RouterLink>
      </div>

      <Card v-else>
        <CardContent class="py-12 text-center text-muted-foreground">
          {{ t("gachas.list.empty") }}
        </CardContent>
      </Card>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pb-4">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="size-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">
          <LucideChevronRight class="size-4" />
        </Button>
      </div>
    </template>
  </div>
</template>
