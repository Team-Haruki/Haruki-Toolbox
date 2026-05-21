<script setup lang="ts">
import { computed, onMounted } from "vue"
import { useI18n } from "vue-i18n"
import {
  Database,
  Eraser,
  RefreshCw,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { resolveSekaiRegionLabel, SEKAI_REGIONS } from "@/lib/sekai-region"
import {
  SEKAI_DATA_DEFAULT_MASTER_FILES,
  SEKAI_DATA_RECOMMEND_MASTER_FILES,
  type SekaiDataUpdatePhase,
} from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore, type SekaiDataQueueItem } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"

const { t, locale } = useI18n()
const sekaiDataStore = useSekaiDataStore()

const regionRows = computed(() => SEKAI_REGIONS.map((region) => sekaiDataStore.regionStates[region]))
const queueItems = computed(() => sekaiDataStore.latestQueueItems)

onMounted(() => {
  for (const region of SEKAI_REGIONS) {
    void sekaiDataStore.loadRegionCacheState(region)
  }
})

function refreshBasic(region: SekaiRegion) {
  sekaiDataStore.refreshRegionData(region, SEKAI_DATA_DEFAULT_MASTER_FILES)
}

function refreshRecommend(region: SekaiRegion) {
  sekaiDataStore.refreshRegionData(region, SEKAI_DATA_RECOMMEND_MASTER_FILES)
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
  <Card class="w-full max-w-3xl">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Database class="h-6 w-6" />
        {{ t("userSettings.sekaiData.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.sekaiData.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-5">
      <div class="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("userSettings.sekaiData.region") }}</TableHead>
              <TableHead>{{ t("userSettings.sekaiData.masterVersion") }}</TableHead>
              <TableHead>{{ t("userSettings.sekaiData.updatedAt") }}</TableHead>
              <TableHead>{{ t("userSettings.sekaiData.files") }}</TableHead>
              <TableHead class="min-w-48">{{ t("userSettings.sekaiData.progress") }}</TableHead>
              <TableHead class="text-right">{{ t("userSettings.sekaiData.actions") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="row in regionRows" :key="row.region">
              <TableCell class="font-medium">
                {{ resolveSekaiRegionLabel(row.region, t) }}
              </TableCell>
              <TableCell>
                <div class="space-y-1">
                  <div class="font-mono text-xs">{{ row.masterDisplayVersion ?? "-" }}</div>
                  <div class="font-mono text-xs text-muted-foreground">{{ row.masterFetchVersion ?? "-" }}</div>
                </div>
              </TableCell>
              <TableCell class="whitespace-nowrap text-sm">
                {{ formatTime(row.updatedAt) }}
              </TableCell>
              <TableCell class="whitespace-nowrap text-sm">
                {{ t("userSettings.sekaiData.fileCount", { count: row.files.length }) }}
              </TableCell>
              <TableCell>
                <div class="space-y-1">
                  <div class="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{{ row.refreshing ? phaseLabel(row.phase) : statusLabel(row.status) }}</span>
                    <span>{{ row.progress }}%</span>
                  </div>
                  <Progress :model-value="row.progress" />
                  <p v-if="row.error" class="text-xs text-destructive">
                    {{ row.error }}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex min-w-56 flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="row.refreshing"
                    @click="refreshBasic(row.region)"
                  >
                    <RefreshCw class="size-4" />
                    {{ t("userSettings.sekaiData.refreshBasic") }}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="row.refreshing"
                    @click="refreshRecommend(row.region)"
                  >
                    <RefreshCw class="size-4" />
                    {{ t("userSettings.sekaiData.refreshRecommend") }}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    :disabled="row.refreshing"
                    @click="clearRegion(row.region)"
                  >
                    <Eraser class="size-4" />
                    {{ t("userSettings.sekaiData.clear") }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="space-y-3 border-t pt-4">
        <div class="space-y-1">
          <h3 class="text-sm font-medium">{{ t("userSettings.sekaiData.queueTitle") }}</h3>
          <p class="text-xs text-muted-foreground">{{ t("userSettings.sekaiData.queueDescription") }}</p>
        </div>
        <div v-if="queueItems.length === 0" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {{ t("userSettings.sekaiData.queueEmpty") }}
        </div>
        <div v-else class="grid gap-2">
          <div v-for="item in queueItems" :key="item.id" class="space-y-2 rounded-md border p-3">
            <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span class="font-medium">{{ resolveSekaiRegionLabel(item.region, t) }}</span>
              <span class="text-xs text-muted-foreground">{{ queueStatusLabel(item) }}</span>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{{ phaseLabel(item.phase) }}</span>
              <span v-if="item.fileName">{{ item.fileName }}</span>
            </div>
            <Progress :model-value="item.progress" />
            <p v-if="item.error" class="text-xs text-destructive">{{ item.error }}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
