<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  Eraser,
  LoaderCircle,
  RefreshCw,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { resolveSekaiRegionLabel, SEKAI_REGIONS } from "@/lib/sekai-region"
import {
  SEKAI_DATA_TOOLBOX_MASTER_FILES,
  type SekaiDataUpdatePhase,
} from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore, type SekaiDataQueueItem } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"

const { t, locale } = useI18n()
const sekaiDataStore = useSekaiDataStore()

const regionRows = computed(() => SEKAI_REGIONS.map((region) => sekaiDataStore.regionStates[region]))
const queueItems = computed(() => sekaiDataStore.latestQueueItems)
const readyRegionCount = computed(() => regionRows.value.filter((row) => row.status === "ready").length)
const cachedFileCount = computed(() => regionRows.value.reduce((total, row) => total + row.files.length, 0))
const activeQueueCount = computed(() =>
  queueItems.value.filter((item) => item.status === "queued" || item.status === "running").length
)

onMounted(() => {
  for (const region of SEKAI_REGIONS) {
    void sekaiDataStore.loadRegionCacheState(region)
    void sekaiDataStore.checkRegionRemoteVersion(region)
  }
})

function refreshMasterData(region: SekaiRegion) {
  sekaiDataStore.refreshRegionData(region, SEKAI_DATA_TOOLBOX_MASTER_FILES)
}

function clearRegion(region: SekaiRegion) {
  sekaiDataStore.clearRegionData(region)
}

function statusLabel(status: string) {
  return t(`userSettings.sekaiData.status.${status}`)
}

function phaseLabel(phase: SekaiDataUpdatePhase | null) {
  return phase ? t(`userSettings.sekaiData.phases.${phase}`) : t("userSettings.sekaiData.status.idle")
}

function queueStatusLabel(item: Pick<SekaiDataQueueItem, "status">) {
  return t(`userSettings.sekaiData.queueStatus.${item.status}`)
}

function queueItemDetail(item: SekaiDataQueueItem) {
  if (item.status === "error") {
    return item.error ?? t("userSettings.sekaiData.queueDetails.failed")
  }
  if (item.status === "done") {
    if (item.cacheHit === true) {
      return t("userSettings.sekaiData.queueDetails.cacheHit")
    }
    if (item.cacheHit === false) {
      return t("userSettings.sekaiData.queueDetails.updated")
    }

    return t("userSettings.sekaiData.queueDetails.completed")
  }
  if (item.fileName && item.current != null && item.total != null) {
    return t("userSettings.sekaiData.queueDetails.fileProgress", {
      file: item.fileName,
      current: item.current,
      total: item.total,
    })
  }
  if (item.fileName) {
    return t("userSettings.sekaiData.queueDetails.file", { file: item.fileName })
  }

  return t("userSettings.sekaiData.queueDetails.phase", { phase: phaseLabel(item.phase) })
}

function shouldShowQueuePhase(item: Pick<SekaiDataQueueItem, "status" | "phase">) {
  return item.status !== "done" || item.phase !== "ready"
}

function queueStatusClass(status: SekaiDataQueueItem["status"]) {
  switch (status) {
    case "done":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    case "error":
      return "border-destructive/40 bg-destructive/5 text-destructive"
    case "running":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
    case "queued":
      return "border-muted bg-muted/40 text-muted-foreground"
  }
}

function regionStatusClass(status: string, refreshing: boolean) {
  if (refreshing || status === "loading" || status === "clearing") {
    return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
  }
  if (status === "ready") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
  }
  if (status === "error") {
    return "border-destructive/40 bg-destructive/5 text-destructive"
  }

  return "border-muted bg-muted/40 text-muted-foreground"
}

function formatTime(value: number | null) {
  if (!value) {
    return t("userSettings.sekaiData.never")
  }

  return new Intl.DateTimeFormat(locale.value, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value)
}
</script>

<template>
  <div class="space-y-5">
    <div class="grid grid-cols-3 gap-2">
      <div class="rounded-lg border bg-muted/20 p-3">
        <p class="text-xs text-muted-foreground">{{ t("userSettings.sekaiData.summary.readyRegions") }}</p>
        <p class="mt-1 font-mono text-lg font-semibold">{{ readyRegionCount }}/{{ regionRows.length }}</p>
      </div>
      <div class="rounded-lg border bg-muted/20 p-3">
        <p class="text-xs text-muted-foreground">{{ t("userSettings.sekaiData.summary.cachedFiles") }}</p>
        <p class="mt-1 font-mono text-lg font-semibold">{{ cachedFileCount }}</p>
      </div>
      <div class="rounded-lg border bg-muted/20 p-3">
        <p class="text-xs text-muted-foreground">{{ t("userSettings.sekaiData.summary.activeTasks") }}</p>
        <p class="mt-1 font-mono text-lg font-semibold">{{ activeQueueCount }}</p>
      </div>
    </div>

    <section>
      <h3 class="px-1 pb-2 text-[13px] font-medium text-muted-foreground">
        {{ t("userSettings.sekaiData.regionCacheTitle") }}
      </h3>
      <div class="divide-y divide-border/60 rounded-lg border bg-muted/20">
        <div v-for="row in regionRows" :key="row.region" class="space-y-2 px-4 py-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm font-medium">{{ resolveSekaiRegionLabel(row.region, t) }}</span>
            <span
              :class="[
                'rounded-md border px-2 py-0.5 text-xs font-medium',
                regionStatusClass(row.status, row.refreshing),
              ]"
            >
              {{ row.refreshing ? phaseLabel(row.phase) : statusLabel(row.status) }}
            </span>
            <div class="ml-auto flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                :disabled="row.refreshing"
                @click="refreshMasterData(row.region)"
              >
                <RefreshCw class="size-3.5" :class="{ 'animate-spin': row.refreshing }" />
                {{ t("userSettings.sekaiData.refreshMasterData") }}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger as-child>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    class="text-destructive hover:text-destructive"
                    :disabled="row.refreshing"
                  >
                    <Eraser class="size-3.5" />
                    {{ t("userSettings.sekaiData.clear") }}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{{ t("userSettings.sekaiData.clearDialog.title") }}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {{ t("userSettings.sekaiData.clearDialog.description", { region: resolveSekaiRegionLabel(row.region, t) }) }}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{{ t("common.cancel") }}</AlertDialogCancel>
                    <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="clearRegion(row.region)">
                      {{ t("userSettings.sekaiData.clearDialog.confirm") }}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>
              {{ t("userSettings.sekaiData.localVersion") }}
              <span class="font-mono text-foreground">{{ row.masterLocalVersion ?? row.masterDisplayVersion ?? "–" }}</span>
            </span>
            <span>
              {{ t("userSettings.sekaiData.remoteVersion") }}
              <span class="font-mono text-foreground">{{ row.masterRemoteVersion ?? "–" }}</span>
            </span>
            <span>{{ t("userSettings.sekaiData.fileCount", { count: row.files.length }) }}</span>
            <span class="ml-auto">{{ formatTime(row.updatedAt) }}</span>
          </div>

          <div v-if="row.refreshing || row.status === 'loading' || row.status === 'clearing'" class="space-y-1">
            <div class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{{ t("userSettings.sekaiData.progress") }}</span>
              <span>{{ row.progress }}%</span>
            </div>
            <Progress :model-value="row.progress" />
          </div>
          <p v-if="row.error" class="text-xs text-destructive">
            {{ row.error }}
          </p>
        </div>
      </div>
    </section>

    <section>
      <h3 class="px-1 pb-2 text-[13px] font-medium text-muted-foreground">
        {{ t("userSettings.sekaiData.queueTitle") }}
      </h3>
      <div v-if="queueItems.length === 0" class="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
        {{ t("userSettings.sekaiData.queueEmpty") }}
      </div>
      <div v-else class="divide-y divide-border/60 rounded-lg border bg-muted/20">
        <div v-for="item in queueItems" :key="item.id" class="flex gap-3 px-4 py-3">
          <span
            :class="[
              'mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border',
              queueStatusClass(item.status),
            ]"
          >
            <CircleCheck v-if="item.status === 'done'" class="size-4" />
            <CircleAlert v-else-if="item.status === 'error'" class="size-4" />
            <LoaderCircle v-else-if="item.status === 'running'" class="size-4 animate-spin" />
            <Clock3 v-else class="size-4" />
          </span>
          <div class="min-w-0 flex-1 space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium">{{ resolveSekaiRegionLabel(item.region, t) }}</span>
                <span
                  :class="[
                    'rounded-md border px-2 py-0.5 text-xs font-medium',
                    queueStatusClass(item.status),
                  ]"
                >
                  {{ queueStatusLabel(item) }}
                </span>
                <span v-if="shouldShowQueuePhase(item)" class="text-xs text-muted-foreground">{{ phaseLabel(item.phase) }}</span>
              </div>
              <span class="text-xs text-muted-foreground">{{ formatTime(item.updatedAt) }}</span>
            </div>
            <p class="text-xs text-muted-foreground">
              {{ queueItemDetail(item) }}
            </p>
            <Progress v-if="item.status === 'running' || item.status === 'queued'" :model-value="item.progress" />
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
