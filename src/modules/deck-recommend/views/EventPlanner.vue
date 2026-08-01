<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import {
  LucideBrush,
  LucideEraser,
  LucideMoon,
  LucidePlus,
  LucideTrash2,
  LucideX,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useEventPlannerStore, type EventPlannerPlan } from "../stores/event-planner"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { GameAccountBinding, SekaiRegion } from "@/types"
import CharacterSelect from "../components/CharacterSelect.vue"
import EventSelect from "../components/EventSelect.vue"
import PlannerBrushDialog from "../components/PlannerBrushDialog.vue"
import PlannerCalendar from "../components/PlannerCalendar.vue"
import {
  parseEventPlannerPointInput,
  resolveEventPlannerDailyPoint,
} from "../lib/event-planner"
import {
  buildPlannerCalendar,
  buildPlannerPlanKey,
  buildPlannerRectangleHourKeys,
  PLANNER_REST_BRUSH_ID,
  resolvePlannerRemainingPoint,
  summarizePlannerCells,
  type PlannerBrush,
} from "../lib/planner-calendar"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"
import { useEventOptions } from "../composables/useEventOptions"
import { useWorldBloomCharacterOptions } from "../composables/useWorldBloomCharacterOptions"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
  isDefault?: boolean
}

const ERASER_TOOL_ID = "eraser"

const { t, locale } = useI18n()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const sekaiDataStore = useSekaiDataStore()
const plannerStore = useEventPlannerStore()
const runner = useDeckRecommendRunner()

const selectedAccountKey = ref("")
const dataRegion = ref<SekaiRegion>("jp")
const selectedEventId = ref<string | null>(null)
const selectedEventType = ref<string | null>(null)
const selectedCharacterId = ref<string | null>(null)

const targetPointInput = ref("")
const currentPointInput = ref("")
const brushes = ref<PlannerBrush[]>([])
const cells = ref<Record<string, string>>({})
const activeTool = ref<string>(PLANNER_REST_BRUSH_ID)
const brushDialogOpen = ref(false)

const eventOptions = useEventOptions(dataRegion)
const worldBloomCharacters = useWorldBloomCharacterOptions(dataRegion, selectedEventId)

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => createAccountOption(account))
})
const selectedAccount = computed(() =>
  accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
)

const selectedEventOption = computed(() =>
  eventOptions.options.value.find((option) => option.value === selectedEventId.value) ?? null,
)

const showWorldBloomCharacterSelect = computed(() => selectedEventType.value === "world_bloom")
const worldBloomCharacterSelectAllowNone = computed(() =>
  showWorldBloomCharacterSelect.value && !worldBloomCharacters.hasCharacters.value,
)
const worldBloomCharacterFallbackId = computed(() =>
  worldBloomCharacterSelectAllowNone.value
    ? null
    : selectedCharacterId.value != null
      ? Number(selectedCharacterId.value)
      : worldBloomCharacters.defaultCharacterId.value
        ?? worldBloomCharacters.characterIds.value[0]
        ?? null,
)
const activeCharacterId = computed(() => {
  if (!showWorldBloomCharacterSelect.value) {
    return null
  }
  if (worldBloomCharacterSelectAllowNone.value) {
    return selectedCharacterId.value
  }

  return worldBloomCharacterFallbackId.value == null ? null : String(worldBloomCharacterFallbackId.value)
})
const forcedLeaderCharacterId = computed(() =>
  showWorldBloomCharacterSelect.value && !worldBloomCharacters.hasCharacters.value ? activeCharacterId.value : null,
)
const characterSelectAllowedIds = computed<readonly number[] | null>(() =>
  worldBloomCharacters.characterIds.value.length > 0 ? worldBloomCharacters.characterIds.value : null,
)

const plannerAlgorithms = computed<DeckRecommendAlgorithm[]>(() =>
  selectedEventType.value === "world_bloom" ? ["dfs_ga"] : ["dfs"],
)

// --- Points and summary -----------------------------------------------------

const targetPoint = computed(() => parseEventPlannerPointInput(targetPointInput.value))
const currentPoint = computed(() => parseEventPlannerPointInput(currentPointInput.value))

const allBrushes = computed<PlannerBrush[]>(() => [restBrush.value, ...brushes.value])

const restBrush = computed<PlannerBrush>(() => ({
  id: PLANNER_REST_BRUSH_ID,
  name: t("eventPlanner.brushes.rest"),
  color: "#94a3b8",
  pointsPerHour: 0,
  musicId: null,
  difficulty: null,
  eventPointPerPlay: null,
  playsPerHour: null,
  deckCardIds: [],
}))

const summary = computed(() => summarizePlannerCells(cells.value, allBrushes.value))

const remainingPoint = computed(() => resolvePlannerRemainingPoint({
  targetPoint: targetPoint.value.value,
  currentPoint: currentPoint.value.value ?? 0,
  plannedPoints: summary.value.plannedPoints,
}))

const dailyPoint = computed(() => {
  const option = selectedEventOption.value
  if (targetPoint.value.value == null || option?.startAt == null || option?.aggregateAt == null) {
    return null
  }

  return resolveEventPlannerDailyPoint({
    targetPoint: targetPoint.value.value,
    currentPoint: currentPoint.value.value ?? 0,
    currentPointKnown: currentPoint.value.value != null,
    startAt: option.startAt,
    aggregateAt: option.aggregateAt,
  })
})

const summaryItems = computed(() => [
  {
    key: "target",
    label: t("eventPlanner.summary.targetPoint"),
    value: targetPoint.value.value != null ? formatInteger(targetPoint.value.value) : "-",
  },
  {
    key: "current",
    label: t("eventPlanner.summary.currentPoint"),
    value: formatInteger(currentPoint.value.value ?? 0),
  },
  {
    key: "planned",
    label: t("eventPlanner.summary.plannedPoint"),
    value: formatInteger(summary.value.plannedPoints),
  },
  {
    key: "remaining",
    label: t("eventPlanner.summary.remainingPoint"),
    value: remainingPoint.value != null ? formatInteger(remainingPoint.value) : "-",
    highlight: remainingPoint.value != null && remainingPoint.value > 0,
    reached: remainingPoint.value === 0,
  },
  {
    key: "daily",
    label: t("eventPlanner.summary.dailyPoint"),
    value: dailyPoint.value != null ? formatInteger(dailyPoint.value) : "-",
  },
])

// --- Calendar ---------------------------------------------------------------

const calendarDays = computed(() => {
  const option = selectedEventOption.value
  if (option?.startAt == null || option?.aggregateAt == null) {
    return []
  }

  return buildPlannerCalendar(option.startAt, option.aggregateAt)
})

// --- Batch fill -------------------------------------------------------------

const batchFromDay = ref("0")
const batchToDay = ref("0")
const batchFromHour = ref("0")
const batchToHour = ref("23")
const batchBrushId = ref<string>(PLANNER_REST_BRUSH_ID)

const BATCH_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => String(hour))

const batchDayFormatter = computed(() => new Intl.DateTimeFormat(locale.value, {
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
}))

const batchDayOptions = computed(() => calendarDays.value.map((day, index) => ({
  value: String(index),
  label: batchDayFormatter.value.format(day.dayStartMs),
})))

watch(calendarDays, (days) => {
  batchFromDay.value = "0"
  batchToDay.value = String(Math.max(days.length - 1, 0))
}, { immediate: true })

watch(allBrushes, (available) => {
  if (batchBrushId.value !== ERASER_TOOL_ID && !available.some((brush) => brush.id === batchBrushId.value)) {
    batchBrushId.value = PLANNER_REST_BRUSH_ID
  }
})

function applyBatchFill() {
  const hourKeys = buildPlannerRectangleHourKeys(
    calendarDays.value,
    { dayIndex: Number(batchFromDay.value), hourOfDay: Number(batchFromHour.value) },
    { dayIndex: Number(batchToDay.value), hourOfDay: Number(batchToHour.value) },
  )
  if (hourKeys.length === 0) {
    return
  }

  handleStroke({
    hourKeys,
    brushId: batchBrushId.value === ERASER_TOOL_ID ? null : batchBrushId.value,
  })
}

function handleStroke(changes: { hourKeys: string[]; brushId: string | null }) {
  const next = { ...cells.value }
  for (const hourKey of changes.hourKeys) {
    if (changes.brushId == null) {
      delete next[hourKey]
    } else {
      next[hourKey] = changes.brushId
    }
  }
  cells.value = next
  announceRemaining()
}

function announceRemaining() {
  if (remainingPoint.value == null) {
    return
  }

  if (remainingPoint.value <= 0) {
    toast.success(t("eventPlanner.toasts.reached", {
      planned: formatInteger(summary.value.plannedPoints),
    }))
    return
  }

  toast.info(t("eventPlanner.toasts.remaining", {
    planned: formatInteger(summary.value.plannedPoints),
    remaining: formatInteger(remainingPoint.value),
  }))
}

function clearPlanCells() {
  cells.value = {}
}

// --- Brushes ----------------------------------------------------------------

function addBrush(brush: PlannerBrush) {
  brushes.value = [...brushes.value, brush]
  activeTool.value = brush.id
}

function removeBrush(brushId: string) {
  brushes.value = brushes.value.filter((brush) => brush.id !== brushId)
  const next = Object.fromEntries(
    Object.entries(cells.value).filter(([, value]) => value !== brushId),
  )
  cells.value = next
  if (activeTool.value === brushId) {
    activeTool.value = PLANNER_REST_BRUSH_ID
  }
}

// --- Persistence ------------------------------------------------------------

const planKey = computed(() => {
  if (!selectedAccountKey.value || !selectedEventId.value) {
    return null
  }

  return buildPlannerPlanKey(selectedAccountKey.value, dataRegion.value, selectedEventId.value)
})

let hydrating = false

watch(planKey, (key) => {
  hydrating = true
  try {
    const plan = key != null ? plannerStore.getPlan(key) : null
    targetPointInput.value = plan?.targetPointInput ?? ""
    currentPointInput.value = plan?.currentPointInput ?? ""
    brushes.value = plan?.brushes ?? []
    cells.value = plan?.cells ?? {}
    activeTool.value = PLANNER_REST_BRUSH_ID
  } finally {
    hydrating = false
  }
}, { immediate: true })

watch([targetPointInput, currentPointInput, brushes, cells], () => {
  if (hydrating || planKey.value == null) {
    return
  }

  const plan: Omit<EventPlannerPlan, "updatedAt"> = {
    targetPointInput: targetPointInput.value,
    currentPointInput: currentPointInput.value,
    brushes: brushes.value,
    cells: cells.value,
  }
  plannerStore.savePlan(planKey.value, plan)
})

// --- Account / region wiring (mirrors the previous planner) -----------------

watch(
  accountOptions,
  (accounts) => {
    if (accounts.length === 0) {
      selectedAccountKey.value = ""
      return
    }
    if (!accounts.some((account) => account.key === selectedAccountKey.value)) {
      selectedAccountKey.value = (accounts.find((account) => account.isDefault) ?? accounts[0]).key
    }
  },
  { immediate: true },
)

watch(
  selectedAccount,
  (account) => {
    if (account && account.server !== dataRegion.value) {
      dataRegion.value = account.server
    }
    ensureRegionMasterData()
  },
  { immediate: true },
)

watch(dataRegion, () => {
  selectedEventId.value = null
  selectedEventType.value = null
  selectedCharacterId.value = null
  ensureRegionMasterData()
})

const currentRegionState = computed(() => sekaiDataStore.regionStates[dataRegion.value])
const recommendDataReady = computed(() =>
  currentRegionState.value.status === "ready"
  && currentRegionState.value.musicMetasUpdatedAt != null
  && SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES.every((fileName) => currentRegionState.value.files.includes(fileName)),
)

watch(
  () => [dataRegion.value, recommendDataReady.value, selectedAccount.value?.server ?? ""].join(":"),
  () => {
    if (recommendDataReady.value) {
      void runner.preloadRegionData(dataRegion.value, selectedAccount.value?.server ?? dataRegion.value).catch(() => undefined)
    }
  },
  { immediate: true },
)

onMounted(() => {
  ensureRegionMasterData()
  void runner.preloadEngine().catch(() => undefined)
})

onBeforeUnmount(() => {
  void runner.disposeEngine().catch(() => undefined)
})

function ensureRegionMasterData() {
  void sekaiDataStore.ensureRegionData(dataRegion.value, {
    files: [...SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES],
  })
  const accountRegion = selectedAccount.value?.server
  if (accountRegion && accountRegion !== dataRegion.value) {
    void sekaiDataStore.ensureRegionData(accountRegion, { files: ["honors"] })
  }
}

function createAccountOption(account: GameAccountBinding): BoundAccountOption {
  const uid = String(account.userId)
  return {
    key: `${account.server}:${uid}`,
    server: account.server,
    uid,
    isDefault: account.isDefault === true,
    label: formatGameAccountLabel({
      regionLabel: resolveSekaiRegionLabel(account.server, t),
      uid,
      hideUid: settingsStore.hideGameUserId,
    }),
  }
}

function updateAccount(value: AcceptableValue) {
  selectedAccountKey.value = typeof value === "string" ? value : ""
}

function updateDataRegion(value: AcceptableValue) {
  if (typeof value === "string" && SEKAI_REGION_OPTIONS.some((option) => option.value === value)) {
    dataRegion.value = value as SekaiRegion
  }
}

function formatInteger(value: number) {
  return new Intl.NumberFormat(locale.value, { maximumFractionDigits: 0 }).format(Number(value) || 0)
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-7xl space-y-3 sm:space-y-4">
      <div>
        <h1 class="text-2xl font-bold">{{ t("eventPlanner.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("eventPlanner.description") }}</p>
      </div>

      <!-- Setup -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base">{{ t("eventPlanner.sections.setup.title") }}</CardTitle>
          <CardDescription>{{ t("eventPlanner.sections.setup.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">{{ t("deckRecommend.form.account") }}</Label>
            <Select :key="locale" :model-value="selectedAccountKey" @update:model-value="updateAccount">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in accountOptions" :key="option.key" :value="option.key">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">{{ t("deckRecommend.form.dataRegion") }}</Label>
            <Select :key="locale" :model-value="dataRegion" @update:model-value="updateDataRegion">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                  {{ t(option.labelKey) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-1.5">
            <EventSelect
              v-model="selectedEventId"
              :region="dataRegion"
              @update:event-type="selectedEventType = $event"
            />
          </div>
          <div v-if="showWorldBloomCharacterSelect" class="grid gap-1.5">
            <CharacterSelect
              :model-value="activeCharacterId"
              :region="dataRegion"
              :allowed-character-ids="characterSelectAllowedIds"
              :allow-none-option="worldBloomCharacterSelectAllowNone"
              @update:model-value="selectedCharacterId = $event"
            />
          </div>
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.form.targetPoint") }}</Label>
            <Input
              v-model="targetPointInput"
              :placeholder="t('eventPlanner.form.targetPointPlaceholder')"
            />
            <p v-if="targetPoint.invalid" class="text-[11px] text-destructive">
              {{ t("eventPlanner.form.invalidPoint") }}
            </p>
            <p v-else-if="targetPoint.value != null" class="text-[11px] text-muted-foreground">
              {{ t("eventPlanner.form.parsedValue", { value: formatInteger(targetPoint.value) }) }}
            </p>
          </div>
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.form.currentPoint") }}</Label>
            <Input
              v-model="currentPointInput"
              :placeholder="t('eventPlanner.form.currentPointPlaceholder')"
            />
            <p v-if="currentPoint.invalid" class="text-[11px] text-destructive">
              {{ t("eventPlanner.form.invalidPoint") }}
            </p>
            <p v-else-if="currentPoint.value != null" class="text-[11px] text-muted-foreground">
              {{ t("eventPlanner.form.parsedValue", { value: formatInteger(currentPoint.value) }) }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- Summary -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Card v-for="item in summaryItems" :key="item.key">
          <CardContent class="p-3">
            <div class="text-xs text-muted-foreground">{{ item.label }}</div>
            <div
              :class="[
                'mt-0.5 text-lg font-bold tabular-nums',
                item.reached ? 'text-emerald-500' : item.highlight ? 'text-amber-500' : '',
              ]"
            >
              {{ item.value }}
            </div>
          </CardContent>
        </Card>
      </div>
      <p v-if="remainingPoint === 0 && targetPoint.value != null" class="text-sm font-medium text-emerald-500">
        {{ t("eventPlanner.summary.reached") }}
      </p>

      <!-- Brushes -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("eventPlanner.brushes.title") }}</span>
            <Button size="sm" class="h-8" :disabled="!selectedEventId || !selectedAccount" @click="brushDialogOpen = true">
              <LucidePlus class="mr-1 size-4" /> {{ t("eventPlanner.brushes.add") }}
            </Button>
          </CardTitle>
          <CardDescription>{{ t("eventPlanner.brushes.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
              activeTool === PLANNER_REST_BRUSH_ID
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:bg-muted/40',
            ]"
            :aria-pressed="activeTool === PLANNER_REST_BRUSH_ID"
            @click="activeTool = PLANNER_REST_BRUSH_ID"
          >
            <LucideMoon class="size-3.5" :style="{ color: restBrush.color }" />
            {{ t("eventPlanner.brushes.rest") }}
          </button>
          <button
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors',
              activeTool === ERASER_TOOL_ID
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:bg-muted/40',
            ]"
            :aria-pressed="activeTool === ERASER_TOOL_ID"
            @click="activeTool = ERASER_TOOL_ID"
          >
            <LucideEraser class="size-3.5" />
            {{ t("eventPlanner.brushes.eraser") }}
          </button>
          <span
            v-for="brush in brushes"
            :key="brush.id"
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs transition-colors',
              activeTool === brush.id
                ? 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:bg-muted/40',
            ]"
          >
            <button
              type="button"
              class="inline-flex items-center gap-1.5"
              :aria-pressed="activeTool === brush.id"
              @click="activeTool = brush.id"
            >
              <LucideBrush class="size-3.5" :style="{ color: brush.color }" />
              <span class="max-w-40 truncate">{{ brush.name }}</span>
              <span class="tabular-nums text-muted-foreground">
                {{ t("eventPlanner.brushes.perHour", { points: formatInteger(brush.pointsPerHour) }) }}
              </span>
            </button>
            <button
              type="button"
              class="inline-flex items-center rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              :aria-label="t('eventPlanner.brushes.delete')"
              @click="removeBrush(brush.id)"
            >
              <LucideX class="size-3" />
            </button>
          </span>
          <p v-if="brushes.length === 0" class="text-xs text-muted-foreground">
            {{ t("eventPlanner.brushes.empty") }}
          </p>
        </CardContent>
      </Card>

      <!-- Calendar -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("eventPlanner.calendar.title") }}</span>
            <span class="flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground">
              <span class="tabular-nums">
                {{ t("eventPlanner.summary.plannedHours", {
                  hours: summary.plannedHours,
                  rest: summary.restHours,
                }) }}
              </span>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 gap-1 text-xs text-muted-foreground"
                :disabled="Object.keys(cells).length === 0"
                @click="clearPlanCells"
              >
                <LucideTrash2 class="size-3.5" /> {{ t("eventPlanner.calendar.clear") }}
              </Button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="calendarDays.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            {{ t("eventPlanner.calendar.noEvent") }}
          </p>
          <template v-else>
            <div class="mb-3 flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
              <span class="text-xs font-medium">{{ t("eventPlanner.batch.title") }}</span>
              <div class="flex flex-wrap items-end gap-2">
                <div class="grid gap-1">
                  <Label class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.fromDay") }}</Label>
                  <Select :model-value="batchFromDay" @update:model-value="batchFromDay = typeof $event === 'string' ? $event : batchFromDay">
                    <SelectTrigger class="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in batchDayOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-1">
                  <Label class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.toDay") }}</Label>
                  <Select :model-value="batchToDay" @update:model-value="batchToDay = typeof $event === 'string' ? $event : batchToDay">
                    <SelectTrigger class="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in batchDayOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-1">
                  <Label class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.fromHour") }}</Label>
                  <Select :model-value="batchFromHour" @update:model-value="batchFromHour = typeof $event === 'string' ? $event : batchFromHour">
                    <SelectTrigger class="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="hour in BATCH_HOUR_OPTIONS" :key="hour" :value="hour">
                        {{ t("eventPlanner.calendar.hourLabel", { hour }) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-1">
                  <Label class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.toHour") }}</Label>
                  <Select :model-value="batchToHour" @update:model-value="batchToHour = typeof $event === 'string' ? $event : batchToHour">
                    <SelectTrigger class="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="hour in BATCH_HOUR_OPTIONS" :key="hour" :value="hour">
                        {{ t("eventPlanner.calendar.hourLabel", { hour }) }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-1">
                  <Label class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.brush") }}</Label>
                  <Select :model-value="batchBrushId" @update:model-value="batchBrushId = typeof $event === 'string' ? $event : batchBrushId">
                    <SelectTrigger class="h-8 w-44 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="brush in allBrushes" :key="brush.id" :value="brush.id">
                        <span class="inline-flex items-center gap-1.5">
                          <span class="inline-block size-2.5 rounded-full" :style="{ backgroundColor: brush.color }" />
                          <span class="max-w-32 truncate">{{ brush.name }}</span>
                        </span>
                      </SelectItem>
                      <SelectItem :value="ERASER_TOOL_ID">{{ t("eventPlanner.brushes.eraser") }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button size="sm" class="h-8" @click="applyBatchFill">
                  {{ t("eventPlanner.batch.apply") }}
                </Button>
              </div>
              <p class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.hint") }}</p>
            </div>
            <PlannerCalendar
              :days="calendarDays"
              :cells="cells"
              :brushes="allBrushes"
              :active-tool="activeTool"
              @stroke="handleStroke"
            />
          </template>
        </CardContent>
      </Card>
    </div>

    <PlannerBrushDialog
      v-model:open="brushDialogOpen"
      :data-region="dataRegion"
      :account="selectedAccount"
      :event-id="selectedEventId"
      :character-id="activeCharacterId"
      :forced-leader-character-id="forcedLeaderCharacterId"
      :algorithms="plannerAlgorithms"
      :existing-brushes="brushes"
      @save="addBrush"
    />
  </div>
</template>
