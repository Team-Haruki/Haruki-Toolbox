<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideCalendarDays, LucideChevronRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"

type HomeCurrentEvent = {
  id: number
  name: string
  startAt: number
  aggregateAt: number
}

const { t } = useI18n()
const sekaiDataStore = useSekaiDataStore()

const state = ref<"checking" | "needs-opt-in" | "loading" | "ready" | "empty" | "error">("checking")
const currentEvent = ref<HomeCurrentEvent | null>(null)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

const { region } = useEffectiveCatalogRegion()

const remainingLabel = computed(() => {
  if (!currentEvent.value) {
    return ""
  }

  const remainingMs = currentEvent.value.aggregateAt - now.value
  if (remainingMs <= 0) {
    return t("home.currentEvent.ended")
  }

  const totalMinutes = Math.floor(remainingMs / 60_000)
  const days = Math.floor(totalMinutes / 1_440)
  const hours = Math.floor((totalMinutes % 1_440) / 60)
  const minutes = totalMinutes % 60
  if (days > 0) {
    return t("home.currentEvent.remainingDays", { days, hours })
  }

  if (hours > 0) {
    return t("home.currentEvent.remainingHours", { hours, minutes })
  }

  return t("home.currentEvent.remainingMinutes", { minutes })
})

onMounted(async () => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
  await sekaiDataStore.loadRegionCacheState(region.value)
  if (!sekaiDataStore.regionStates[region.value].masterFetchVersion) {
    state.value = "needs-opt-in"
    return
  }

  await loadCurrentEvent()
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

async function loadCurrentEvent() {
  state.value = "loading"
  try {
    await sekaiDataStore.ensureRegionData(region.value)
    const files = await readSekaiMasterFiles(region.value, ["events"])
    const timestamp = Date.now()
    const events = normalizeCatalogRecords(files.events)
      .map((record) => ({
        id: normalizeCatalogNumber(record.id) ?? 0,
        name: normalizeCatalogString(record.name),
        startAt: normalizeCatalogNumber(record.startAt) ?? 0,
        aggregateAt: normalizeCatalogNumber(record.aggregateAt) ?? 0,
      }))
      .filter((event) => event.id > 0 && event.startAt <= timestamp && timestamp < event.aggregateAt)
      .sort((left, right) => right.startAt - left.startAt)

    currentEvent.value = events[0] ?? null
    state.value = currentEvent.value ? "ready" : "empty"
  } catch {
    state.value = "error"
  }
}
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <LucideCalendarDays class="w-5 h-5" />
        <span>{{ t("home.currentEvent.title", { region: region.toUpperCase() }) }}</span>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="state === 'checking' || state === 'loading'" class="space-y-2">
        <Skeleton class="h-5 w-3/4" />
        <Skeleton class="h-4 w-1/2" />
      </div>

      <div v-else-if="state === 'needs-opt-in'" class="flex flex-col gap-2">
        <p class="text-sm text-muted-foreground">{{ t("home.currentEvent.optInHint") }}</p>
        <Button variant="outline" size="sm" class="self-start" @click="loadCurrentEvent">
          {{ t("home.currentEvent.load") }}
        </Button>
      </div>

      <p v-else-if="state === 'empty'" class="text-sm text-muted-foreground">
        {{ t("home.currentEvent.none") }}
      </p>

      <p v-else-if="state === 'error'" class="text-sm text-muted-foreground">
        {{ t("home.currentEvent.error") }}
      </p>

      <router-link
        v-else-if="currentEvent"
        :to="`/events/${currentEvent.id}`"
        class="group flex items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-semibold">{{ currentEvent.name }}</p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ remainingLabel }}</p>
        </div>
        <LucideChevronRight class="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </router-link>
    </CardContent>
  </Card>
</template>
