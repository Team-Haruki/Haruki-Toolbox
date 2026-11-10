<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import {
  CircleAlert,
  CircleCheck,
  Clock3,
  Eraser,
  Files,
  Globe,
  HardDrive,
  History,
  ListChecks,
  ListTodo,
  LoaderCircle,
  RefreshCw,
} from "lucide-vue-next"
import { Badge, type BadgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SettingsFacts, { type SettingsFact } from "@/shared/components/settings/SettingsFacts.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow, { type SettingsRowTone } from "@/shared/components/settings/SettingsRow.vue"
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
import { describeSekaiDataError } from "@/modules/home/lib/sekai-data-error"
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

const summaryFacts = computed<SettingsFact[]>(() => [
  {
    key: "regions",
    label: t("userSettings.sekaiData.summary.readyRegions"),
    value: `${readyRegionCount.value}/${regionRows.value.length}`,
    icon: Globe,
    mono: true,
  },
  { key: "files", label: t("userSettings.sekaiData.summary.cachedFiles"), value: cachedFileCount.value, icon: Files, mono: true },
  { key: "tasks", label: t("userSettings.sekaiData.summary.activeTasks"), value: activeQueueCount.value, icon: ListTodo, mono: true },
])

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
    return describeSekaiDataError(item.error) ?? t("userSettings.sekaiData.queueDetails.failed")
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

type StatusTone = { badge: BadgeVariants["variant"]; row: SettingsRowTone }

const STATUS_TONES = {
  busy: { badge: "sky", row: "info" },
  ready: { badge: "emerald", row: "success" },
  error: { badge: "destructive", row: "danger" },
  idle: { badge: "muted", row: "default" },
} as const satisfies Record<string, StatusTone>

function queueStatusTone(status: SekaiDataQueueItem["status"]): StatusTone {
  switch (status) {
    case "done":
      return STATUS_TONES.ready
    case "error":
      return STATUS_TONES.error
    case "running":
      return STATUS_TONES.busy
    case "queued":
      return STATUS_TONES.idle
  }
}

function queueStatusIcon(status: SekaiDataQueueItem["status"]) {
  switch (status) {
    case "done":
      return CircleCheck
    case "error":
      return CircleAlert
    case "running":
      return LoaderCircle
    case "queued":
      return Clock3
  }
}

function regionStatusTone(status: string, refreshing: boolean): StatusTone {
  if (refreshing || status === "loading" || status === "clearing") {
    return STATUS_TONES.busy
  }
  if (status === "ready") {
    return STATUS_TONES.ready
  }
  if (status === "error") {
    return STATUS_TONES.error
  }

  return STATUS_TONES.idle
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
    <SettingsGroup :title="t('userSettings.sekaiData.summaryTitle')">
      <SettingsFacts :items="summaryFacts" />
    </SettingsGroup>

    <SettingsGroup :title="t('userSettings.sekaiData.regionCacheTitle')">
      <SettingsRow
        v-for="row in regionRows"
        :key="row.region"
        :label="resolveSekaiRegionLabel(row.region, t)"
        :tone="regionStatusTone(row.status, row.refreshing).row"
        :data-testid="`settings-region-${row.region}`"
      >
        <template #icon>
          <span class="font-mono uppercase">{{ row.region }}</span>
        </template>
        <template #label>
          <Badge :variant="regionStatusTone(row.status, row.refreshing).badge" size="sm">
            {{ row.refreshing ? phaseLabel(row.phase) : statusLabel(row.status) }}
          </Badge>
        </template>
        <template #help>
          <span class="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span>
              {{ t("userSettings.sekaiData.localVersion") }}
              <span class="font-mono text-foreground">{{ row.masterLocalVersion ?? row.masterDisplayVersion ?? "–" }}</span>
            </span>
            <span>
              {{ t("userSettings.sekaiData.remoteVersion") }}
              <span class="font-mono text-foreground">{{ row.masterRemoteVersion ?? "–" }}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <HardDrive class="size-3" aria-hidden="true" />
              {{ t("userSettings.sekaiData.fileCount", { count: row.files.length }) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <History class="size-3" aria-hidden="true" />
              {{ formatTime(row.updatedAt) }}
            </span>
          </span>
        </template>

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

        <template v-if="row.refreshing || row.status === 'loading' || row.status === 'clearing' || row.error" #below>
          <div v-if="row.refreshing || row.status === 'loading' || row.status === 'clearing'" class="space-y-1">
            <div class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{{ t("userSettings.sekaiData.progress") }}</span>
              <span class="tabular-nums">{{ row.progress }}%</span>
            </div>
            <Progress :model-value="row.progress" />
          </div>
          <p v-if="row.error" class="text-xs text-destructive" role="alert">
            {{ describeSekaiDataError(row.error) }}
          </p>
        </template>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup :title="t('userSettings.sekaiData.queueTitle')">
      <SettingsRow
        v-if="queueItems.length === 0"
        :icon="ListChecks"
        :label="t('userSettings.sekaiData.queueEmpty')"
      />
      <SettingsRow
        v-for="item in queueItems"
        v-else
        :key="item.id"
        :icon="queueStatusIcon(item.status)"
        :spin="item.status === 'running'"
        :tone="queueStatusTone(item.status).row"
        :label="resolveSekaiRegionLabel(item.region, t)"
        :help="queueItemDetail(item)"
      >
        <template #label>
          <Badge :variant="queueStatusTone(item.status).badge" size="sm">{{ queueStatusLabel(item) }}</Badge>
          <span v-if="shouldShowQueuePhase(item)" class="text-xs text-muted-foreground">{{ phaseLabel(item.phase) }}</span>
        </template>
        <span class="text-xs tabular-nums text-muted-foreground">{{ formatTime(item.updatedAt) }}</span>
        <template v-if="item.status === 'running' || item.status === 'queued'" #below>
          <Progress :model-value="item.progress" />
        </template>
      </SettingsRow>
    </SettingsGroup>
  </div>
</template>
