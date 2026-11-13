<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { useIntervalFn } from "@vueuse/core"
import {
  LucideCalendarRange,
  LucideEraser,
  LucideMoon,
  LucidePencil,
  LucidePlus,
  LucideRows3,
  LucideTrash2,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import CatalogTimeZoneHint from "@/shared/components/catalog/CatalogTimeZoneHint.vue"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import EmptyState from "@/shared/components/EmptyState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useEventPlannerStore, type EventPlannerPlan } from "../stores/event-planner"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import {
  ensureAccessibleGameAccountsLoaded,
  getAccessibleGameAccountsRef,
} from "@/shared/sekai/user-snapshot/accessible-accounts"
import { buildSelectableGameAccounts, type SelectableGameAccount } from "@/shared/sekai/user-snapshot/selectable-accounts"
import type { SekaiRegion } from "@/types"
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
  resolvePlannerBrushPointsPerHour,
  resolvePlannerCountFromMs,
  resolvePlannerProgress,
  selectPlannerCellsFrom,
  summarizePlannerCells,
  summarizePlannerDays,
  type PlannerBrush,
} from "../lib/planner-calendar"
import { resolveSekaiLiveBoostMultiplier } from "@/shared/sekai/live-boost"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"
import { useEventOptions } from "../composables/useEventOptions"
import { useWorldBloomCharacterOptions } from "../composables/useWorldBloomCharacterOptions"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
  verified?: boolean
  isDefault?: boolean
  ownership?: "own" | "granted"
  ownerName?: string | null
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

const accessibleAccounts = getAccessibleGameAccountsRef()
watch(
  () => userStore.userId,
  (value) => {
    ensureAccessibleGameAccountsLoaded(value || null)
  },
  { immediate: true },
)

const accountOptions = computed<BoundAccountOption[]>(() => {
  // Hold until the post-login sync hydrates bindings: a grants-only list in
  // that window would default-select a granted account over the own default.
  if (!Array.isArray(userStore.gameAccountBindings)) {
    return []
  }
  return buildSelectableGameAccounts(userStore.gameAccountBindings, accessibleAccounts.value, "recommend")
    .map((account) => createAccountOption(account))
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

// The hour the player is in, refreshed each minute so the marker and the
// "hours already gone" boundary move with the clock.
const nowMs = ref(Date.now())
useIntervalFn(() => {
  nowMs.value = Date.now()
}, 60_000)

/** Hours before this are already part of the current pt and no longer count toward the target. */
const countFromMs = computed(() => resolvePlannerCountFromMs({
  now: nowMs.value,
  startAt: selectedEventOption.value?.startAt ?? null,
  aggregateAt: selectedEventOption.value?.aggregateAt ?? null,
  currentPointKnown: currentPoint.value.value != null,
}))

/** Everything painted: what each brush covers on the calendar. */
const paintedSummary = computed(() => summarizePlannerCells(cells.value, allBrushes.value))
/** What still counts: the plan from the current hour on. */
const summary = computed(() =>
  summarizePlannerCells(selectPlannerCellsFrom(cells.value, countFromMs.value), allBrushes.value),
)

const progress = computed(() => resolvePlannerProgress({
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
    now: nowMs.value,
  })
})

const progressVerdict = computed(() => {
  const value = progress.value
  if (!value) {
    return null
  }
  if (value.remaining > 0) {
    return { tone: "short" as const, text: t("eventPlanner.progress.short", { remaining: formatInteger(value.remaining) }) }
  }
  return {
    tone: "reached" as const,
    text: value.surplus > 0
      ? t("eventPlanner.progress.over", { projected: formatInteger(value.projected), surplus: formatInteger(value.surplus) })
      : t("eventPlanner.progress.exact"),
  }
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
    value: `+${formatInteger(summary.value.plannedPoints)}`,
  },
  {
    key: "projected",
    label: t("eventPlanner.summary.projectedPoint"),
    value: formatInteger((currentPoint.value.value ?? 0) + summary.value.plannedPoints),
  },
  {
    key: "remaining",
    label: t("eventPlanner.summary.remainingPoint"),
    value: progress.value ? formatInteger(progress.value.remaining) : "-",
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

const dayStats = computed(() => summarizePlannerDays(calendarDays.value, cells.value, allBrushes.value, {
  basePoint: currentPoint.value.value ?? 0,
  targetPoint: targetPoint.value.value,
  countFromMs: countFromMs.value,
}))

// --- Batch fill -------------------------------------------------------------

const batchOpen = ref(false)

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
  batchOpen.value = false
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
}

const clearDialogOpen = ref(false)

function clearPlanCells() {
  cells.value = {}
}

// --- Brushes ----------------------------------------------------------------

const editingBrush = ref<PlannerBrush | null>(null)

function openBrushDialog(brush: PlannerBrush | null = null) {
  editingBrush.value = brush
  brushDialogOpen.value = true
}

function handleBrushDialogOpenChange(open: boolean) {
  brushDialogOpen.value = open
  if (!open) {
    editingBrush.value = null
  }
}

function handleBrushSave(brush: PlannerBrush) {
  brushes.value = brushes.value.some((existing) => existing.id === brush.id)
    ? brushes.value.map((existing) => (existing.id === brush.id ? brush : existing))
    : [...brushes.value, brush]
  activeTool.value = brush.id
}

const BOOST_COUNT_OPTIONS = Array.from({ length: 11 }, (_, count) => count)

/** Loops per hour and boost are brush-list settings; the rate follows. */
function updateBrushSettings(brushId: string, patch: Partial<Pick<PlannerBrush, "playsPerHour" | "boostCount">>) {
  brushes.value = brushes.value.map((brush) => {
    if (brush.id !== brushId) {
      return brush
    }

    const next = { ...brush, ...patch }
    next.pointsPerHour = resolvePlannerBrushPointsPerHour(next.eventPointPerPlay, next.playsPerHour, next.boostCount)
      ?? next.pointsPerHour
    return next
  })
}

function handleBrushPlaysInput(brushId: string, event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) {
    updateBrushSettings(brushId, { playsPerHour: Math.max(1, Math.min(120, Math.round(value))) })
  }
}

function updateBrushBoost(brushId: string, value: AcceptableValue) {
  const boostCount = Number(value)
  if (Number.isInteger(boostCount) && boostCount >= 0 && boostCount <= 10) {
    updateBrushSettings(brushId, { boostCount })
  }
}

/** What each brush covers on the calendar, for its card. */
const brushUsage = computed(() => new Map(brushes.value.map((brush) => {
  const hours = paintedSummary.value.hoursByBrush.get(brush.id) ?? 0
  return [brush.id, { hours, points: Math.round(hours * brush.pointsPerHour) }]
})))

const brushToRemove = ref<PlannerBrush | null>(null)

/** A brush that is on the calendar takes its hours with it, so that one asks first. */
function requestRemoveBrush(brush: PlannerBrush) {
  if ((brushUsage.value.get(brush.id)?.hours ?? 0) > 0) {
    brushToRemove.value = brush
  } else {
    removeBrush(brush.id)
  }
}

const activeToolLabel = computed(() => {
  if (activeTool.value === ERASER_TOOL_ID) {
    return t("eventPlanner.brushes.eraser")
  }
  return allBrushes.value.find((brush) => brush.id === activeTool.value)?.name ?? t("eventPlanner.brushes.rest")
})

function updateActiveTool(value: AcceptableValue) {
  if (typeof value === "string") {
    activeTool.value = value
  }
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

function createAccountOption(account: SelectableGameAccount): BoundAccountOption {
  const uid = String(account.userId)
  return {
    key: account.key,
    server: account.server,
    uid,
    verified: account.verified === true,
    isDefault: account.isDefault === true,
    ownership: account.ownership,
    ownerName: account.owner?.name ?? null,
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
  <div class="flex w-full min-w-0 flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-7xl min-w-0 gap-4">
      <PageHeader :title="t('eventPlanner.title')" :description="t('eventPlanner.description')" />

      <!-- Whose plan, for which event, toward what -->
      <section class="@container min-w-0 rounded-xl border bg-card p-4" data-testid="planner-setup">
        <div class="grid min-w-0 grid-cols-1 items-start gap-3 @min-[40rem]:grid-cols-2 @min-[64rem]:grid-cols-3">
          <div class="grid min-w-0 grid-cols-1 content-start gap-1.5">
            <Label for="planner-account" class="text-xs text-muted-foreground">{{ t("deckRecommend.form.account") }}</Label>
            <Select id="planner-account" :key="locale" :model-value="selectedAccountKey" :aria-label="t('deckRecommend.form.account')" @update:model-value="updateAccount">
              <SelectTrigger class="w-full" :aria-label="t('deckRecommend.form.account')">
                <GameAccountOption
                  v-if="selectedAccount"
                  :server="selectedAccount.server"
                  :user-id="selectedAccount.uid"
                  :verified="selectedAccount.verified"
                  :is-default="selectedAccount.isDefault"
                  :ownership="selectedAccount.ownership"
                />
                <span v-else class="text-sm text-muted-foreground">
                  {{ t("deckRecommend.form.accountPlaceholder") }}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in accountOptions" :key="option.key" :value="option.key">
                  <GameAccountOption
                    :server="option.server"
                    :user-id="option.uid"
                    :verified="option.verified"
                    :is-default="option.isDefault"
                    :ownership="option.ownership"
                    :owner-name="option.ownerName"
                  />
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="accountOptions.length === 0" class="text-xs text-muted-foreground">
              {{ t("deckRecommend.form.noAccount") }}
              <RouterLink :to="{ name: 'user.gameAccountBindings' }" class="text-primary underline-offset-4 hover:underline">
                {{ t("deckRecommend.form.bindAccount") }}
              </RouterLink>
            </p>
          </div>
          <div class="grid min-w-0 grid-cols-1 content-start gap-1.5">
            <Label for="planner-region" class="text-xs text-muted-foreground">{{ t("deckRecommend.form.dataRegion") }}</Label>
            <Select id="planner-region" :key="locale" :model-value="dataRegion" :aria-label="t('deckRecommend.form.dataRegion')" @update:model-value="updateDataRegion">
              <SelectTrigger class="w-full" :aria-label="t('deckRecommend.form.dataRegion')">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                  {{ t(option.labelKey) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid min-w-0 grid-cols-1 content-start gap-1.5">
            <p class="text-xs font-medium text-muted-foreground">{{ t("deckRecommend.form.event") }}</p>
            <EventSelect
              v-model="selectedEventId"
              :region="dataRegion"
              @update:event-type="selectedEventType = $event"
            />
          </div>
          <div v-if="showWorldBloomCharacterSelect" class="grid min-w-0 grid-cols-1 content-start gap-1.5">
            <p class="text-xs font-medium text-muted-foreground">{{ t("deckRecommend.form.character") }}</p>
            <CharacterSelect
              :model-value="activeCharacterId"
              :region="dataRegion"
              :allowed-character-ids="characterSelectAllowedIds"
              :allow-none-option="worldBloomCharacterSelectAllowNone"
              @update:model-value="selectedCharacterId = $event"
            />
          </div>
          <!-- The two totals stay side by side, on a phone too. -->
          <div class="grid min-w-0 grid-cols-2 items-start gap-3 @min-[40rem]:col-span-2">
          <div class="grid min-w-0 grid-cols-1 content-start gap-1.5">
            <Label for="planner-target-point" class="text-xs text-muted-foreground">{{ t("eventPlanner.form.targetPoint") }}</Label>
            <Input
              id="planner-target-point"
              v-model="targetPointInput"
              class="tabular-nums"
              autocomplete="off"
              :aria-invalid="targetPoint.invalid || undefined"
              :placeholder="t('eventPlanner.form.targetPointPlaceholder')"
            />
            <p v-if="targetPoint.invalid" class="text-[11px] text-destructive" role="alert">
              {{ t("eventPlanner.form.invalidPoint") }}
            </p>
            <p v-else-if="targetPoint.value != null" class="text-[11px] tabular-nums text-muted-foreground">
              {{ t("eventPlanner.form.parsedValue", { value: formatInteger(targetPoint.value) }) }}
            </p>
          </div>
          <div class="grid min-w-0 grid-cols-1 content-start gap-1.5">
            <Label for="planner-current-point" class="text-xs text-muted-foreground">{{ t("eventPlanner.form.currentPoint") }}</Label>
            <Input
              id="planner-current-point"
              v-model="currentPointInput"
              class="tabular-nums"
              autocomplete="off"
              :aria-invalid="currentPoint.invalid || undefined"
              :placeholder="t('eventPlanner.form.currentPointPlaceholder')"
            />
            <p v-if="currentPoint.invalid" class="text-[11px] text-destructive" role="alert">
              {{ t("eventPlanner.form.invalidPoint") }}
            </p>
            <p v-else-if="currentPoint.value != null" class="text-[11px] tabular-nums text-muted-foreground">
              {{ t("eventPlanner.form.parsedValue", { value: formatInteger(currentPoint.value) }) }}
            </p>
          </div>
          </div>
        </div>
      </section>

      <!-- Where the plan lands against the target -->
      <section class="@container min-w-0 rounded-xl border bg-card" data-testid="planner-progress" :data-state="progressVerdict?.tone ?? 'none'">
        <div class="grid gap-3 px-4 py-3">
          <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <h2 class="text-sm font-semibold">{{ t("eventPlanner.progress.title") }}</h2>
            <p class="text-xs tabular-nums text-muted-foreground">
              {{ t("eventPlanner.summary.plannedHours", { hours: summary.plannedHours, rest: summary.restHours }) }}
            </p>
          </div>

          <template v-if="progress && progressVerdict">
            <div class="pt-4" role="img" :aria-label="progressVerdict.text">
              <div class="relative">
                <div class="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <span class="h-full bg-primary" :style="{ width: `${progress.currentRatio * 100}%` }" />
                  <span class="h-full bg-primary/35" :style="{ width: `${progress.plannedRatio * 100}%` }" />
                </div>
                <!-- The target, as a tick on the same scale. -->
                <span
                  class="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-foreground"
                  :style="{ left: `min(${progress.targetRatio * 100}%, calc(100% - 2px))` }"
                >
                  <span
                    :class="[
                      'absolute -top-4 text-[11px] leading-none whitespace-nowrap text-muted-foreground',
                      progress.targetRatio > 0.85 ? 'right-0' : 'left-0',
                    ]"
                  >
                    {{ t("eventPlanner.progress.targetMark") }}
                  </span>
                </span>
              </div>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <p
                :class="['text-sm font-medium', progressVerdict.tone === 'short' ? 'text-amber-700 dark:text-amber-300' : 'text-primary']"
                data-testid="planner-verdict"
              >
                {{ progressVerdict.text }}
              </p>
              <p class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-3 rounded-full bg-primary" aria-hidden="true" />{{ t("eventPlanner.progress.legendCurrent") }}</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-3 rounded-full bg-primary/35" aria-hidden="true" />{{ t("eventPlanner.progress.legendPlanned") }}</span>
              </p>
            </div>
          </template>
          <p v-else class="text-sm text-muted-foreground">{{ t("eventPlanner.progress.noTarget") }}</p>

          <dl class="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border/60 pt-3 @min-[36rem]:grid-cols-3 @min-[64rem]:grid-cols-6">
            <div v-for="item in summaryItems" :key="item.key" class="flex min-w-0 flex-col" :data-stat="item.key">
              <dt class="truncate text-[11px] text-muted-foreground">{{ item.label }}</dt>
              <dd class="truncate text-sm font-semibold tabular-nums">{{ item.value }}</dd>
            </div>
          </dl>
          <p v-if="countFromMs != null" class="text-[11px] text-muted-foreground">{{ t("eventPlanner.progress.pastNote") }}</p>
        </div>
      </section>

      <!-- Brushes: what an hour of play is worth -->
      <section class="grid min-w-0 gap-2" data-testid="planner-brushes">
        <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
          <h2 class="min-w-0 text-sm font-semibold">{{ t("eventPlanner.brushes.title") }}</h2>
          <Button size="sm" :disabled="!selectedEventId || !selectedAccount" @click="openBrushDialog()">
            <LucidePlus class="size-4" /> {{ t("eventPlanner.brushes.add") }}
          </Button>
        </div>

        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <!-- The two built-in tools share one card. -->
          <div class="grid grid-cols-2 divide-x divide-border/60 overflow-hidden rounded-xl border bg-card">
            <button
              type="button"
              :class="[
                'flex min-w-0 items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none pointer-coarse:min-h-11',
                activeTool === PLANNER_REST_BRUSH_ID ? 'bg-primary/10 font-semibold text-primary' : '',
              ]"
              :aria-pressed="activeTool === PLANNER_REST_BRUSH_ID"
              @click="activeTool = PLANNER_REST_BRUSH_ID"
            >
              <LucideMoon class="size-4 shrink-0" />
              <span class="min-w-0">
                <span class="block truncate">{{ t("eventPlanner.brushes.rest") }}</span>
                <span class="block truncate text-[11px] font-normal tabular-nums text-muted-foreground">
                  {{ t("eventPlanner.brushes.usedHours", { hours: paintedSummary.restHours }) }}
                </span>
              </span>
            </button>
            <button
              type="button"
              :class="[
                'flex min-w-0 items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none pointer-coarse:min-h-11',
                activeTool === ERASER_TOOL_ID ? 'bg-primary/10 font-semibold text-primary' : '',
              ]"
              :aria-pressed="activeTool === ERASER_TOOL_ID"
              @click="activeTool = ERASER_TOOL_ID"
            >
              <LucideEraser class="size-4 shrink-0" />
              <span class="min-w-0 truncate">{{ t("eventPlanner.brushes.eraser") }}</span>
            </button>
          </div>

          <div
            v-for="brush in brushes"
            :key="brush.id"
            :class="['flex min-w-0 flex-col rounded-xl border bg-card', activeTool === brush.id ? 'border-primary ring-1 ring-primary' : '']"
            data-testid="planner-brush"
          >
            <div class="flex min-w-0 items-center pr-1.5">
              <button
                type="button"
                class="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left focus-visible:bg-muted/40 focus-visible:outline-none"
                :aria-pressed="activeTool === brush.id"
                @click="activeTool = brush.id"
              >
                <span class="size-3 shrink-0 rounded-full" :style="{ backgroundColor: brush.color }" aria-hidden="true" />
                <span class="min-w-0 flex-1">
                  <span class="block truncate text-sm font-medium">{{ brush.name }}</span>
                  <span class="block truncate text-xs tabular-nums text-muted-foreground">
                    {{ t("eventPlanner.brushes.perHour", { points: formatInteger(brush.pointsPerHour) }) }}
                    <template v-if="(brushUsage.get(brush.id)?.hours ?? 0) > 0">
                      · {{ t("eventPlanner.brushes.usage", { hours: brushUsage.get(brush.id)!.hours, points: formatInteger(brushUsage.get(brush.id)!.points) }) }}
                    </template>
                  </span>
                </span>
              </button>
              <Button variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground" :aria-label="t('eventPlanner.brushes.edit')" @click="openBrushDialog(brush)">
                <LucidePencil class="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" class="size-8 shrink-0 text-muted-foreground" :aria-label="t('eventPlanner.brushes.delete')" @click="requestRemoveBrush(brush)">
                <LucideTrash2 class="size-3.5" />
              </Button>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              <span class="inline-flex items-center gap-1.5">
                <Label :for="`planner-brush-plays-${brush.id}`" class="text-xs font-normal text-muted-foreground">{{ t("eventPlanner.brushes.playsTitle") }}</Label>
                <Input
                  :id="`planner-brush-plays-${brush.id}`"
                  type="number"
                  min="1"
                  max="120"
                  inputmode="numeric"
                  :model-value="brush.playsPerHour ?? undefined"
                  class="h-7 w-16 px-1.5 text-center text-xs tabular-nums"
                  @input="handleBrushPlaysInput(brush.id, $event)"
                />
              </span>
              <span class="inline-flex items-center gap-1.5">
                {{ t("eventPlanner.brushes.boostShort") }}
                <Select
                  :model-value="String(brush.boostCount ?? 0)"
                  :aria-label="t('eventPlanner.brushes.boostTitle')"
                  @update:model-value="updateBrushBoost(brush.id, $event)"
                >
                  <SelectTrigger class="h-7 w-24 px-1.5 text-xs" :aria-label="t('eventPlanner.brushes.boostTitle')">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="count in BOOST_COUNT_OPTIONS" :key="count" :value="String(count)">
                      {{ t("eventPlanner.brushes.boostOption", { count, multiplier: resolveSekaiLiveBoostMultiplier(count) }) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </span>
            </div>
          </div>

          <p v-if="brushes.length === 0" class="flex items-center rounded-xl border bg-card px-4 py-3 text-xs text-muted-foreground">
            {{ t("eventPlanner.brushes.empty") }}
          </p>
        </div>
      </section>

      <!-- Calendar -->
      <section class="min-w-0 rounded-xl border bg-card" data-testid="planner-calendar-panel">
        <header class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border/60 px-4 py-2.5">
          <h2 class="text-sm font-semibold">{{ t("eventPlanner.calendar.title") }}</h2>
          <!-- Hours are the viewer's wall clock; the tag names both zones so JST 15:00 is not read as local. -->
          <CatalogTimeZoneHint :region="dataRegion" />
          <template v-if="calendarDays.length > 0">
            <div class="ml-auto flex flex-wrap items-center gap-2">
              <!-- The brush list can be a screen away on a phone: pick the tool here too. -->
              <Select :model-value="activeTool" :aria-label="t('eventPlanner.calendar.tool')" @update:model-value="updateActiveTool">
                <SelectTrigger class="h-8 w-44 text-xs" :aria-label="t('eventPlanner.calendar.tool')">
                  <span class="truncate">{{ t("eventPlanner.calendar.toolValue", { name: activeToolLabel }) }}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="brush in allBrushes" :key="brush.id" :value="brush.id">
                    <span class="inline-flex items-center gap-1.5">
                      <span class="inline-block size-2.5 rounded-full" :style="{ backgroundColor: brush.color }" />
                      <span class="max-w-40 truncate">{{ brush.name }}</span>
                    </span>
                  </SelectItem>
                  <SelectItem :value="ERASER_TOOL_ID">{{ t("eventPlanner.brushes.eraser") }}</SelectItem>
                </SelectContent>
              </Select>

              <Popover v-model:open="batchOpen">
                <PopoverTrigger as-child>
                  <Button variant="outline" size="sm" class="h-8 text-xs">
                    <LucideRows3 class="size-3.5" /> {{ t("eventPlanner.batch.title") }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" class="grid w-[min(22rem,calc(100vw-2rem))] gap-3">
                  <p class="text-xs text-muted-foreground">{{ t("eventPlanner.batch.hint") }}</p>
                  <div class="grid grid-cols-2 gap-2">
                    <div class="grid gap-1">
                      <Label for="planner-batch-from-day" class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.fromDay") }}</Label>
                      <Select id="planner-batch-from-day" :model-value="batchFromDay" :aria-label="t('eventPlanner.batch.fromDay')" @update:model-value="batchFromDay = typeof $event === 'string' ? $event : batchFromDay">
                        <SelectTrigger class="h-8 w-full text-xs" :aria-label="t('eventPlanner.batch.fromDay')">
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
                      <Label for="planner-batch-to-day" class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.toDay") }}</Label>
                      <Select id="planner-batch-to-day" :model-value="batchToDay" :aria-label="t('eventPlanner.batch.toDay')" @update:model-value="batchToDay = typeof $event === 'string' ? $event : batchToDay">
                        <SelectTrigger class="h-8 w-full text-xs" :aria-label="t('eventPlanner.batch.toDay')">
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
                      <Label for="planner-batch-from-hour" class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.fromHour") }}</Label>
                      <Select id="planner-batch-from-hour" :model-value="batchFromHour" :aria-label="t('eventPlanner.batch.fromHour')" @update:model-value="batchFromHour = typeof $event === 'string' ? $event : batchFromHour">
                        <SelectTrigger class="h-8 w-full text-xs" :aria-label="t('eventPlanner.batch.fromHour')">
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
                      <Label for="planner-batch-to-hour" class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.toHour") }}</Label>
                      <Select id="planner-batch-to-hour" :model-value="batchToHour" :aria-label="t('eventPlanner.batch.toHour')" @update:model-value="batchToHour = typeof $event === 'string' ? $event : batchToHour">
                        <SelectTrigger class="h-8 w-full text-xs" :aria-label="t('eventPlanner.batch.toHour')">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="hour in BATCH_HOUR_OPTIONS" :key="hour" :value="hour">
                            {{ t("eventPlanner.calendar.hourLabel", { hour }) }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="col-span-2 grid gap-1">
                      <Label for="planner-batch-brush" class="text-[11px] text-muted-foreground">{{ t("eventPlanner.batch.brush") }}</Label>
                      <Select id="planner-batch-brush" :model-value="batchBrushId" :aria-label="t('eventPlanner.batch.brush')" @update:model-value="batchBrushId = typeof $event === 'string' ? $event : batchBrushId">
                        <SelectTrigger class="h-8 w-full text-xs" :aria-label="t('eventPlanner.batch.brush')">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="brush in allBrushes" :key="brush.id" :value="brush.id">
                            <span class="inline-flex items-center gap-1.5">
                              <span class="inline-block size-2.5 rounded-full" :style="{ backgroundColor: brush.color }" />
                              <span class="max-w-40 truncate">{{ brush.name }}</span>
                            </span>
                          </SelectItem>
                          <SelectItem :value="ERASER_TOOL_ID">{{ t("eventPlanner.brushes.eraser") }}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button size="sm" data-testid="planner-batch-apply" @click="applyBatchFill">{{ t("eventPlanner.batch.apply") }}</Button>
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                class="h-8 gap-1 text-xs text-muted-foreground"
                :disabled="Object.keys(cells).length === 0"
                @click="clearDialogOpen = true"
              >
                <LucideTrash2 class="size-3.5" /> {{ t("eventPlanner.calendar.clear") }}
              </Button>
            </div>
          </template>
        </header>

        <EmptyState v-if="calendarDays.length === 0" :icon="LucideCalendarRange" :title="t('eventPlanner.calendar.noEvent')" class="px-4" />
        <div v-else class="min-w-0 p-4">
          <PlannerCalendar
            :days="calendarDays"
            :cells="cells"
            :brushes="allBrushes"
            :active-tool="activeTool"
            :day-stats="dayStats"
            :count-from-ms="countFromMs"
            :now-ms="nowMs"
            @stroke="handleStroke"
          />
        </div>
      </section>
    </div>

    <PlannerBrushDialog
      :open="brushDialogOpen"
      :data-region="dataRegion"
      :account="selectedAccount"
      :event-id="selectedEventId"
      :character-id="activeCharacterId"
      :forced-leader-character-id="forcedLeaderCharacterId"
      :algorithms="plannerAlgorithms"
      :existing-brushes="brushes"
      :editing-brush="editingBrush"
      @update:open="handleBrushDialogOpenChange"
      @save="handleBrushSave"
    />

    <ConfirmDialog
      v-model:open="clearDialogOpen"
      :title="t('eventPlanner.calendar.clearConfirmTitle')"
      :description="t('eventPlanner.calendar.clearConfirmDescription')"
      :confirm-label="t('eventPlanner.calendar.clear')"
      destructive
      @confirm="clearPlanCells"
    />
    <ConfirmDialog
      :open="brushToRemove != null"
      :title="t('eventPlanner.brushes.deleteConfirmTitle', { name: brushToRemove?.name ?? '' })"
      :description="t('eventPlanner.brushes.deleteConfirmDescription', { hours: brushToRemove ? brushUsage.get(brushToRemove.id)?.hours ?? 0 : 0 })"
      :confirm-label="t('eventPlanner.brushes.delete')"
      destructive
      @update:open="(open: boolean) => { if (!open) brushToRemove = null }"
      @confirm="brushToRemove && removeBrush(brushToRemove.id)"
    />
  </div>
</template>
