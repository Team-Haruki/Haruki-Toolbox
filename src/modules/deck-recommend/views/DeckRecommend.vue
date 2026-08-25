<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import {
  SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES,
} from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { GameAccountBinding, SekaiRegion } from "@/types"
import CustomBonusSimulationDialog from "../components/CustomBonusSimulationDialog.vue"
import DeckAdvancedSection from "../components/DeckAdvancedSection.vue"
import DeckAttributionFooter from "../components/DeckAttributionFooter.vue"
import DeckBasicSection from "../components/DeckBasicSection.vue"
import DeckClearConfigDialog from "../components/DeckClearConfigDialog.vue"
import DeckConfigActions from "../components/DeckConfigActions.vue"
import DeckConfigSummaryBar from "../components/DeckConfigSummaryBar.vue"
import DeckExpertSheet from "../components/DeckExpertSheet.vue"
import DeckResultPanel from "../components/DeckResultPanel.vue"
import { buildMasterCardOptions } from "../lib/card-options"
import { buildDeckResultViews } from "../lib/card-thumbnail"
import {
  type DeckRecommendAlgorithm,
  type DeckRecommendEventAttr,
  type DeckRecommendEventSimulationInput,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
  type DeckRecommendTarget,
  type DeckRecommendSkillOrderStrategy,
  type DeckRecommendSkillReferenceStrategy,
  type DeckRecommendSupportUnitType,
  type DeckRecommendUnitType,
  type DeckRecommendSingleCardOverride,
  parseDeckBonusTargetsInput,
  parseDeckSkillOrderInput,
} from "../lib/recommend-options"
import {
  allowedRecommendTargets,
  defaultRecommendTarget,
  hasRequiredFiles,
  isAllowedRecommendTarget,
  normalizeDeckRecommendLiveType,
  normalizeDeckRecommendUnit,
  numberArraySignature,
  parseOptionalNumberInput,
  parseWorldBloomTurn,
  singleCardOverridesSignature,
  sortedRecordSignature,
  stringArraySignature,
  toggleSelectedValue,
  trainingConfigSignature,
  type NumericInputValue,
} from "../lib/recommend-form-utils"
import { createDefaultCardTrainingConfig } from "../lib/training-config"
import {
  DECK_RECOMMEND_ALGORITHMS,
  DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT,
  DECK_RECOMMEND_EVENT_ATTRS,
  DECK_RECOMMEND_UNITS,
  isDeckRecommendEventAttr,
  isDeckRecommendEventSimulationMode,
  isDeckRecommendExecutionMode,
  isDeckRecommendMode,
  isDeckRecommendSimulatedEventUnit,
  isDeckRecommendSkillOrderStrategy,
  isDeckRecommendSkillReferenceStrategy,
  isDeckRecommendTarget,
  isDeckRecommendUnit,
  isSekaiRegionValue,
  readDeckRecommendPreferences,
  readDeckRecommendSavedConfig,
  removeDeckRecommendSavedConfig,
  resolveInitialAlgorithmSelectionIsManual,
  writeDeckRecommendPreferences,
  writeDeckRecommendSavedConfig,
  type DeckRecommendEventSimulationMode,
  type DeckRecommendSavedConfig,
  type DeckRecommendSimulatedEventUnitValue,
} from "../lib/saved-config"
import { provideDeckRecommendFormContext } from "../composables/deck-recommend-form-context"
import {
  useDeckRecommendRunner,
  type DeckRecommendExecutionMode,
} from "../composables/useDeckRecommendRunner"
import { useCharacterOptions } from "../composables/useCharacterOptions"
import { useDeckRecommendDataOverrides } from "../composables/useDeckRecommendDataOverrides"
import { useDeckRecommendDataPreload } from "../composables/useDeckRecommendDataPreload"
import { useDeckRecommendRouteQuery } from "../composables/useDeckRecommendRouteQuery"
import { useWorldBloomCharacterOptions } from "../composables/useWorldBloomCharacterOptions"
import {
  resolveEventCardBonusLimit,
  resolveEventSkillScoreUpLimit,
  resolveEventTotalPowerLimit,
} from "../lib/master-options"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
  verified?: boolean
  isDefault?: boolean
}

const DEFAULT_MUSIC_ID = "74"
const DEFAULT_MUSIC_DIFFICULTY = "expert"
const DEFAULT_EXECUTION_MODE: DeckRecommendExecutionMode = "parallel"
const DECK_RECOMMEND_WORLD_BLOOM_TURNS = ["1", "2", "3"] as const
const CHARACTER_FILTER_MIN_COUNT = 5

const { t, locale } = useI18n()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const sekaiDataStore = useSekaiDataStore()
const runner = useDeckRecommendRunner()
const initialPreferences = readDeckRecommendPreferences()
const initialSavedConfig = readDeckRecommendSavedConfig()
const cardOptionMasterData = ref<Record<string, unknown> | null>(null)

const selectedAccountKey = ref(initialSavedConfig.selectedAccountKey ?? "")
const dataRegion = ref<SekaiRegion>(initialSavedConfig.dataRegion ?? "jp")
const recommendMode = ref<DeckRecommendMode>(initialSavedConfig.recommendMode ?? "event")
const recommendTarget = ref<DeckRecommendTarget>(initialSavedConfig.recommendTarget ?? "score")
const liveType = ref<DeckRecommendLiveType>(initialSavedConfig.liveType ?? "multi")
const algorithmSelectionIsManual = ref(resolveInitialAlgorithmSelectionIsManual(initialSavedConfig, initialPreferences))
const selectedAlgorithms = ref<DeckRecommendAlgorithm[]>(initialSavedConfig.selectedAlgorithms ?? initialPreferences.algorithms ?? [])
const executionMode = ref<DeckRecommendExecutionMode>(initialSavedConfig.executionMode ?? initialPreferences.executionMode ?? DEFAULT_EXECUTION_MODE)
const selectedEventId = ref<string | null>(initialSavedConfig.selectedEventId ?? null)
const selectedEventType = ref<string | null>(null)
const selectedCharacterId = ref<string | null>(initialSavedConfig.selectedCharacterId ?? null)
const selectedMusicId = ref<string | null>(initialSavedConfig.selectedMusicId ?? DEFAULT_MUSIC_ID)
const selectedDifficulty = ref<string | null>(initialSavedConfig.selectedDifficulty ?? DEFAULT_MUSIC_DIFFICULTY)
const bonusTargetsInput = ref(initialSavedConfig.bonusTargetsInput ?? "")
const customBonusCharacterIds = ref<number[]>(initialSavedConfig.customBonusCharacterIds ?? [])
const customBonusSupportUnits = ref<Record<string, DeckRecommendSupportUnitType>>(initialSavedConfig.customBonusSupportUnits ?? {})
const filterOtherUnit = ref(initialSavedConfig.filterOtherUnit ?? false)
const eventSimulationEnabled = ref(initialSavedConfig.eventSimulationEnabled ?? false)
const simulatedEventMode = ref<DeckRecommendEventSimulationMode>(initialSavedConfig.simulatedEventMode ?? "marathon")
const simulatedEventAttr = ref<DeckRecommendEventAttr | null>(initialSavedConfig.simulatedEventAttr ?? "cool")
const simulatedEventUnit = ref<DeckRecommendSimulatedEventUnitValue | null>(initialSavedConfig.simulatedEventUnit ?? "idol")
const customBonusSimulationDialogOpen = ref(false)
const simulatedWorldBloomTurn = ref<string | null>(initialSavedConfig.simulatedWorldBloomTurn ?? "1")
const simulatedWorldBloomCharacterId = ref<string | null>(initialSavedConfig.simulatedWorldBloomCharacterId ?? null)

const multiLiveTeammatePowerInput = ref<NumericInputValue>(initialSavedConfig.multiLiveTeammatePowerInput ?? "")
const multiLiveTeammateScoreUpInput = ref<NumericInputValue>(initialSavedConfig.multiLiveTeammateScoreUpInput ?? "")
const multiLiveScoreUpLowerBoundInput = ref<NumericInputValue>(initialSavedConfig.multiLiveScoreUpLowerBoundInput ?? "")
const boostInput = ref<NumericInputValue>(initialSavedConfig.boostInput ?? "0")
const resultLimitInput = ref<NumericInputValue>(initialSavedConfig.resultLimitInput ?? "")
const engineTimeoutMsInput = ref<NumericInputValue>(initialSavedConfig.engineTimeoutMsInput ?? "")
const unitFilters = ref<DeckRecommendUnitType[]>(initialSavedConfig.unitFilters ?? [])
const attrFilters = ref<DeckRecommendEventAttr[]>(initialSavedConfig.attrFilters ?? [])
const characterFilters = ref<number[]>(initialSavedConfig.characterFilters ?? [])
const fixedCardIds = ref<number[]>(initialSavedConfig.fixedCardIds ?? [])
const useCurrentDeck = ref(initialSavedConfig.useCurrentDeck ?? false)
const fixedCharacterIds = ref<number[]>(initialSavedConfig.fixedCharacterIds ?? [])
const excludedCardIds = ref<number[]>(initialSavedConfig.excludedCardIds ?? [])
const singleCardOverrides = ref<DeckRecommendSingleCardOverride[]>(initialSavedConfig.singleCardOverrides ?? [])
const skillOrderStrategy = ref<DeckRecommendSkillOrderStrategy>(initialSavedConfig.skillOrderStrategy ?? "average")
const skillReferenceStrategy = ref<DeckRecommendSkillReferenceStrategy>(initialSavedConfig.skillReferenceStrategy ?? "average")
const specificSkillOrderInput = ref(initialSavedConfig.specificSkillOrderInput ?? "")
const keepAfterTrainingState = ref(initialSavedConfig.keepAfterTrainingState ?? false)
const supportMasterMax = ref(initialSavedConfig.supportMasterMax ?? false)
const supportSkillMax = ref(initialSavedConfig.supportSkillMax ?? false)
const advancedConfigOpen = ref(false)
const expertConfigOpen = ref(false)
const areaItemOverrideOpen = ref(false)
const characterRankOverrideOpen = ref(false)
const mysekaiGateOverrideOpen = ref(false)
const mysekaiFixtureBonusOverrideOpen = ref(false)
const clearConfigConfirmOpen = ref(false)
const configCollapsed = ref(false)
const trainingConfig = ref(initialSavedConfig.trainingConfig ?? createDefaultCardTrainingConfig())
const characterOptions = useCharacterOptions(dataRegion)
const worldBloomCharacters = useWorldBloomCharacterOptions(dataRegion, selectedEventId)
let routeRegionLocked = initialSavedConfig.dataRegion != null
let preserveInitialSavedSkillStrategy = Boolean(initialSavedConfig.skillOrderStrategy || initialSavedConfig.skillReferenceStrategy)
let pendingSavedAccountKey = initialSavedConfig.selectedAccountKey ?? ""
const routeHydrationInProgress = ref(false)

const {
  areaItemLevelInput,
  areaItemLevelOverrideInputs,
  characterRankInput,
  characterRankOverrideInputs,
  mysekaiGateLevelInput,
  mysekaiGateLevelOverrideInputs,
  mysekaiFixtureBonusRateInput,
  mysekaiFixtureBonusRateOverrideInputs,
  characterRankOptions,
  mysekaiFixtureBonusCharacterOptions,
  mysekaiGateOptions,
  characterRankMax,
  mysekaiGateMaxLevel,
  areaItemLevelOverrides,
  characterRankOverrides,
  mysekaiGateLevelOverrides,
  mysekaiFixtureBonusRateOverrides,
  areaItemOverrideSections,
  areaItemLevelOptions,
  characterRankLevelOptions,
  mysekaiGateLevelOptions,
  mysekaiFixtureBonusRateComboboxOptions,
  mysekaiFixtureBonusMaxRateLabel,
  areaItemLevel,
  characterRank,
  mysekaiGateLevel,
  mysekaiFixtureBonusRate,
  dataOverridesInvalid,
  updateAreaItemLevelInput,
  updateCharacterRankInput,
  updateMysekaiGateLevelInput,
  updateMysekaiFixtureBonusRateInput,
  clearAreaItemLevelOverrides,
  clearCharacterRankOverrides,
  clearMysekaiGateLevelOverrides,
  clearMysekaiFixtureBonusRateOverrides,
} = useDeckRecommendDataOverrides({
  initialSavedConfig,
  cardOptionMasterData,
  runnerMasterData: runner.masterData,
  characterOptions: characterOptions.options,
})

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => createAccountOption(account))
})

const selectedAccount = computed(() => {
  return accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null
})
const selectedAccountLabel = computed(() => selectedAccount.value?.label ?? "")
const selectedAccountServer = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)

const currentRegionState = computed(() => sekaiDataStore.regionStates[dataRegion.value])
const dataReady = computed(() => currentRegionState.value.status === "ready")
const recommendDataReady = computed(() =>
  dataReady.value
  && currentRegionState.value.musicMetasUpdatedAt != null
  && hasRequiredFiles(currentRegionState.value.files, SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES),
)
const resultDecks = computed(() =>
  buildDeckResultViews(runner.result.value, runner.masterData.value, dataRegion.value, settingsStore.currentAssetEndpoint),
)
const cardOptions = computed(() =>
  buildMasterCardOptions(cardOptionMasterData.value ?? runner.masterData.value, dataRegion.value, settingsStore.currentAssetEndpoint),
)
const isEventLikeMode = computed(() =>
  recommendMode.value === "event" || recommendMode.value === "bonus" || recommendMode.value === "mysekai",
)
const showRecommendTargetSelect = computed(() => recommendMode.value !== "bonus")
const recommendTargetOptions = computed<Array<{ value: DeckRecommendTarget; label: string }>>(() =>
  allowedRecommendTargets(recommendMode.value).map((value) => ({
    value,
    label: recommendTargetLabel(value, recommendMode.value),
  })),
)
const activeRecommendTarget = computed<DeckRecommendTarget>(() =>
  isAllowedRecommendTarget(recommendTarget.value, recommendMode.value) ? recommendTarget.value : defaultRecommendTarget(recommendMode.value),
)
const activeRecommendTargetLabel = computed(() =>
  recommendTargetLabel(activeRecommendTarget.value, recommendMode.value),
)
const isEventSimulationAvailable = computed(() => isEventLikeMode.value)
const isEventSimulationActive = computed(() => eventSimulationEnabled.value && isEventSimulationAvailable.value)
const activeOfficialEventId = computed(() =>
  isEventLikeMode.value && !isEventSimulationActive.value ? selectedEventId.value : null,
)
const activeEventTotalPowerLimit = computed(() =>
  resolveEventTotalPowerLimit(
    activeOfficialEventId.value,
    runner.masterData.value?.eventTotalPowerLimits,
  ),
)
const activeEventCardBonusLimit = computed(() =>
  resolveEventCardBonusLimit(
    activeOfficialEventId.value,
    runner.masterData.value?.eventCardBonusLimits,
  ),
)
const activeEventSkillScoreUpLimit = computed(() =>
  resolveEventSkillScoreUpLimit(
    activeOfficialEventId.value,
    runner.masterData.value?.eventSkillScoreUpLimits,
  ),
)
const eventRuleWarnings = computed(() => {
  const warnings: Array<{ key: string; message: string }> = []

  if (activeEventTotalPowerLimit.value != null) {
    warnings.push({
      key: "total-power",
      message: t("deckRecommend.result.totalPowerLimitWarning", {
        value: formatInteger(activeEventTotalPowerLimit.value),
      }),
    })
  }

  if (activeEventCardBonusLimit.value != null) {
    warnings.push({
      key: "card-bonus",
      message: t("deckRecommend.result.eventCardBonusLimitWarning", {
        count: activeEventCardBonusLimit.value,
      }),
    })
  }

  if (activeEventSkillScoreUpLimit.value != null) {
    warnings.push({
      key: "skill-score-up",
      message: t("deckRecommend.result.eventSkillScoreUpLimitWarning", {
        value: activeEventSkillScoreUpLimit.value,
      }),
    })
  }

  return warnings
})
const isWorldBloomSimulation = computed(() => simulatedEventMode.value === "world_bloom")
const isCustomBonusSimulation = computed(() =>
  isEventSimulationActive.value
  && !isWorldBloomSimulation.value
  && simulatedEventUnit.value === DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT,
)
const activeSimulatedEventUnit = computed<DeckRecommendUnitType | null>(() =>
  simulatedEventUnit.value && isDeckRecommendUnit(simulatedEventUnit.value) ? simulatedEventUnit.value : null,
)
const showWorldBloomCharacterSelect = computed(() =>
  isEventLikeMode.value
  && !isEventSimulationActive.value
  && selectedEventType.value === "world_bloom",
)
const showChallengeCharacterSelect = computed(() => recommendMode.value === "challenge")
const showEventConditionSection = computed(() => !showChallengeCharacterSelect.value)
const worldBloomCharacterSelectAllowNone = computed(() =>
  selectedEventType.value === "world_bloom" && !worldBloomCharacters.hasCharacters.value,
)
const worldBloomCharacterFallbackId = computed(() =>
  worldBloomCharacterSelectAllowNone.value
    ? null
    : selectedCharacterId.value != null
      ? Number(selectedCharacterId.value)
      : worldBloomCharacters.defaultCharacterId.value
        ?? worldBloomCharacters.characterIds.value[0]
        ?? characterOptions.options.value[0]?.id
        ?? null,
)
const isWorldBloomFinaleSelection = computed(() =>
  selectedEventType.value === "world_bloom" && !isEventSimulationActive.value && !worldBloomCharacters.hasCharacters.value,
)
const showCharacterSelect = computed(() =>
  showChallengeCharacterSelect.value || showWorldBloomCharacterSelect.value,
)
const characterSelectAllowedIds = computed<readonly number[] | null>(() =>
  recommendMode.value === "challenge"
    ? null
    : worldBloomCharacters.characterIds.value.length > 0
      ? worldBloomCharacters.characterIds.value
      : null,
)
const simulatedWorldBloomCharacterOption = computed(() =>
  characterOptions.options.value.find((option) => option.value === simulatedWorldBloomCharacterId.value) ?? null,
)
const simulatedWorldBloomCharacterUnit = computed<DeckRecommendUnitType | null>(() =>
  normalizeDeckRecommendUnit(simulatedWorldBloomCharacterOption.value?.unit),
)
const activeCharacterId = computed(() => {
  if (!showCharacterSelect.value || isEventSimulationActive.value) {
    return null
  }

  if (recommendMode.value === "challenge") {
    return selectedCharacterId.value
  }

  if (showWorldBloomCharacterSelect.value) {
    return worldBloomCharacterSelectAllowNone.value
      ? selectedCharacterId.value
      : worldBloomCharacterFallbackId.value == null
        ? null
        : String(worldBloomCharacterFallbackId.value)
  }

  return selectedCharacterId.value
})
const activeForcedLeaderCharacterId = computed(() =>
  isWorldBloomFinaleSelection.value ? activeCharacterId.value : null,
)
const activeAlgorithms = computed<DeckRecommendAlgorithm[]>(() =>
  recommendMode.value === "bonus" ? ["dfs"] : selectedAlgorithms.value,
)
// v0.3.0 引擎下按场景选默认算法：活动组卡默认全算法并行互补；
// 挑战/加成走 DFS 精确搜索；烤森走 RL；其余目标暂保持 DFS-GA
const scenarioDefaultAlgorithms = computed<DeckRecommendAlgorithm[]>(() => {
  if (recommendMode.value === "challenge" || recommendMode.value === "bonus") {
    return ["dfs"]
  }
  if (recommendMode.value === "mysekai") {
    return ["rl"]
  }
  if (recommendMode.value === "event") {
    return [...DECK_RECOMMEND_ALGORITHMS]
  }
  return activeRecommendTarget.value === "score" ? ["dfs"] : ["dfs_ga"]
})
const showLiveTypeSelect = computed(() => recommendMode.value !== "mysekai")
const isLiveTypeLocked = computed(() => recommendMode.value === "bonus" || recommendMode.value === "challenge")
const isMultiLiveOptionsEnabled = computed(() =>
  showLiveTypeSelect.value
  && recommendMode.value !== "bonus"
  && recommendMode.value !== "challenge"
  && liveType.value === "multi",
)
const bonusTargets = computed(() => parseDeckBonusTargetsInput(bonusTargetsInput.value))
const showBonusTargetsInput = computed(() => recommendMode.value === "bonus")
const hasBonusTargetsError = computed(() =>
  showBonusTargetsInput.value && bonusTargetsInput.value.trim() !== "" && bonusTargets.value.invalidTokens.length > 0,
)
const boostOptions = computed(() =>
  Array.from({ length: 11 }, (_, value) => ({
    value: String(value),
    label: t("deckRecommend.options.filters.boostOption", { value }),
  })),
)
const characterFilterMaxCount = computed(() => Math.max(characterOptions.options.value.length, 26))
const multiLiveTeammatePower = computed(() =>
  parseOptionalNumberInput(multiLiveTeammatePowerInput.value),
)
const multiLiveTeammateScoreUp = computed(() =>
  parseOptionalNumberInput(multiLiveTeammateScoreUpInput.value),
)
const multiLiveScoreUpLowerBound = computed(() =>
  parseOptionalNumberInput(multiLiveScoreUpLowerBoundInput.value),
)
const boost = computed(() => parseOptionalNumberInput(boostInput.value, { min: 0, max: 10, integer: true }))
const hasCharacterFilterError = computed(() =>
  characterFilters.value.length > 0 && characterFilters.value.length < CHARACTER_FILTER_MIN_COUNT,
)
const resultLimit = computed(() => parseOptionalNumberInput(resultLimitInput.value, { min: 1, max: 50, integer: true }))
const engineTimeoutMs = computed(() => parseOptionalNumberInput(engineTimeoutMsInput.value, { min: 1_000, max: 300_000, integer: true }))
const specificSkillOrder = computed(() => parseDeckSkillOrderInput(specificSkillOrderInput.value))
const isCurrentDeckEnabled = computed(() => useCurrentDeck.value && recommendMode.value !== "challenge")
const showSpecificSkillOrderInput = computed(() => skillOrderStrategy.value === "specific")
const hasSpecificSkillOrderError = computed(() =>
  showSpecificSkillOrderInput.value && specificSkillOrder.value.values.length !== 5,
)
const eventSimulation = computed<DeckRecommendEventSimulationInput>(() => ({
  enabled: isEventSimulationActive.value,
  eventType: simulatedEventMode.value === "cheerful_carnival" ? "cheerful_carnival" : "marathon",
  attr: isWorldBloomSimulation.value || isCustomBonusSimulation.value ? null : simulatedEventAttr.value,
  unit: isWorldBloomSimulation.value || isCustomBonusSimulation.value ? null : activeSimulatedEventUnit.value,
  worldBloomTurn: isWorldBloomSimulation.value ? parseWorldBloomTurn(simulatedWorldBloomTurn.value) : null,
  worldBloomCharacterId: isWorldBloomSimulation.value ? simulatedWorldBloomCharacterId.value : null,
  worldBloomCharacterUnit: isWorldBloomSimulation.value ? simulatedWorldBloomCharacterUnit.value : null,
}))
const hasEventSimulationError = computed(() => {
  if (!isEventSimulationActive.value) {
    return false
  }

  if (isWorldBloomSimulation.value) {
    const turn = parseWorldBloomTurn(simulatedWorldBloomTurn.value)
    if (!turn || !simulatedWorldBloomCharacterId.value) {
      return true
    }

    return turn <= 2 && !simulatedWorldBloomCharacterUnit.value
  }

  if (isCustomBonusSimulation.value) {
    return !simulatedEventAttr.value || customBonusCharacterIds.value.length === 0
  }

  return !simulatedEventAttr.value || !activeSimulatedEventUnit.value
})
const eventSimulationErrorMessage = computed(() =>
  isCustomBonusSimulation.value
    ? t("deckRecommend.options.eventSimulation.customBonusInvalid")
    : t("deckRecommend.options.eventSimulation.invalid"),
)
const invalidOptionalFields = computed(() => [
  isMultiLiveOptionsEnabled.value && multiLiveTeammatePower.value.invalid,
  isMultiLiveOptionsEnabled.value && multiLiveTeammateScoreUp.value.invalid,
  isMultiLiveOptionsEnabled.value && multiLiveScoreUpLowerBound.value.invalid,
  boost.value.invalid,
  areaItemLevel.value.invalid,
  characterRank.value.invalid,
  mysekaiGateLevel.value.invalid,
  mysekaiFixtureBonusRate.value.invalid,
  hasCharacterFilterError.value,
  resultLimit.value.invalid,
  engineTimeoutMs.value.invalid,
  hasSpecificSkillOrderError.value,
  hasEventSimulationError.value,
].some(Boolean))
const canRunRecommend = computed(() => {
  if (runner.running.value || !selectedAccount.value || !recommendDataReady.value || activeAlgorithms.value.length === 0) {
    return false
  }
  if (invalidOptionalFields.value) {
    return false
  }
  if (!selectedMusicId.value || !selectedDifficulty.value) {
    return false
  }
  if (recommendMode.value === "bonus" && (bonusTargets.value.targets.length === 0 || bonusTargets.value.invalidTokens.length > 0)) {
    return false
  }
  if (recommendMode.value === "challenge") {
    return Boolean(selectedCharacterId.value)
  }
  if (isEventLikeMode.value && !isEventSimulationActive.value && worldBloomCharacters.loading.value) {
    return false
  }
  if (!isEventSimulationActive.value && showWorldBloomCharacterSelect.value && !worldBloomCharacterSelectAllowNone.value) {
    return Boolean(worldBloomCharacterFallbackId.value)
  }
  if (recommendMode.value === "event" || recommendMode.value === "bonus" || recommendMode.value === "mysekai") {
    return isEventSimulationActive.value || Boolean(selectedEventId.value)
  }
  return true
})

const modeOptions = computed<Array<{ value: DeckRecommendMode; label: string }>>(() => [
  { value: "event", label: t("deckRecommend.modes.event") },
  { value: "challenge", label: t("deckRecommend.modes.challenge") },
  { value: "bonus", label: t("deckRecommend.modes.bonus") },
  { value: "mysekai", label: t("deckRecommend.modes.mysekai") },
  { value: "max", label: t("deckRecommend.modes.max") },
])

const liveTypeOptions = computed<Array<{ value: DeckRecommendLiveType; label: string }>>(() => [
  { value: "solo", label: t("deckRecommend.liveTypes.solo") },
  { value: "multi", label: t("deckRecommend.liveTypes.multi") },
  { value: "auto", label: t("deckRecommend.liveTypes.auto") },
])

const algorithmOptions = computed<Array<{ value: DeckRecommendAlgorithm; label: string }>>(() => [
  { value: "dfs_ga", label: t("deckRecommend.algorithms.dfsGa") },
  { value: "dfs", label: t("deckRecommend.algorithms.dfs") },
  { value: "ga", label: t("deckRecommend.algorithms.ga") },
  { value: "rl", label: t("deckRecommend.algorithms.rl") },
])

const executionModeOptions = computed<Array<{ value: DeckRecommendExecutionMode; label: string }>>(() => [
  { value: "sequential", label: t("deckRecommend.executionModes.sequential") },
  { value: "parallel", label: t("deckRecommend.executionModes.parallel") },
])

const configSummaryItems = computed<string[]>(() => {
  const items: string[] = []
  const mode = modeOptions.value.find((option) => option.value === recommendMode.value)
  if (mode) {
    items.push(mode.label)
  }
  if (selectedAccountLabel.value) {
    items.push(selectedAccountLabel.value)
  }
  items.push(resolveSekaiRegionLabel(dataRegion.value, t))
  if (showRecommendTargetSelect.value && activeRecommendTargetLabel.value) {
    items.push(activeRecommendTargetLabel.value)
  }
  if (showLiveTypeSelect.value) {
    const live = liveTypeOptions.value.find((option) => option.value === liveType.value)
    if (live) {
      items.push(live.label)
    }
  }
  const algorithmLabels = activeAlgorithms.value
    .map((value) => algorithmOptions.value.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label))
  if (algorithmLabels.length > 0) {
    items.push(algorithmLabels.join(" + "))
  }
  return items.filter((item) => item.length > 0)
})

const eventSimulationModeOptions = computed<Array<{ value: DeckRecommendEventSimulationMode; label: string }>>(() => [
  { value: "marathon", label: t("deckRecommend.eventTypes.marathon") },
  { value: "cheerful_carnival", label: t("deckRecommend.eventTypes.cheerfulCarnival") },
  { value: "world_bloom", label: t("deckRecommend.eventTypes.worldBloom") },
])

const eventAttrOptions = computed<Array<{ value: DeckRecommendEventAttr; label: string }>>(() =>
  DECK_RECOMMEND_EVENT_ATTRS.map((value) => ({
    value,
    label: t(`deckRecommend.eventAttrs.${value}`),
  })),
)

const eventUnitOptions = computed<Array<{ value: DeckRecommendSimulatedEventUnitValue; label: string }>>(() => [
  ...DECK_RECOMMEND_UNITS.map((value) => ({
    value,
    label: t(`deckRecommend.eventUnits.${value}`),
  })),
  {
    value: DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT,
    label: t("deckRecommend.options.eventSimulation.customBonusUnit"),
  },
])

const unitFilterOptions = computed<Array<{ value: DeckRecommendUnitType; label: string }>>(() =>
  DECK_RECOMMEND_UNITS.map((value) => ({
    value,
    label: t(`deckRecommend.eventUnits.${value}`),
  })),
)

const worldBloomTurnOptions = computed<Array<{ value: string; label: string }>>(() =>
  DECK_RECOMMEND_WORLD_BLOOM_TURNS.map((value) => ({
    value,
    label: t("deckRecommend.options.eventSimulation.worldBloomTurnOption", { turn: value }),
  })),
)

const skillReferenceStrategyOptions = computed<Array<{ value: DeckRecommendSkillReferenceStrategy; label: string }>>(() => [
  { value: "average", label: t("deckRecommend.skillStrategies.average") },
  { value: "max", label: t("deckRecommend.skillStrategies.max") },
  { value: "min", label: t("deckRecommend.skillStrategies.min") },
])

const skillOrderStrategyOptions = computed<Array<{ value: DeckRecommendSkillOrderStrategy; label: string }>>(() => [
  ...skillReferenceStrategyOptions.value,
  { value: "specific", label: t("deckRecommend.skillStrategies.specific") },
])

const deckRecommendResetSignature = computed(() => [
  selectedAccountKey.value,
  recommendMode.value,
  recommendTarget.value,
  liveType.value,
  selectedAlgorithms.value.join(","),
  executionMode.value,
  selectedEventId.value ?? "",
  selectedCharacterId.value ?? "",
  selectedMusicId.value ?? "",
  selectedDifficulty.value ?? "",
  bonusTargetsInput.value,
  numberArraySignature(customBonusCharacterIds.value),
  sortedRecordSignature(customBonusSupportUnits.value),
  String(filterOtherUnit.value),
  String(eventSimulationEnabled.value),
  simulatedEventMode.value,
  simulatedEventAttr.value ?? "",
  simulatedEventUnit.value ?? "",
  simulatedWorldBloomTurn.value ?? "",
  simulatedWorldBloomCharacterId.value ?? "",
  String(multiLiveTeammatePowerInput.value),
  String(multiLiveTeammateScoreUpInput.value),
  String(multiLiveScoreUpLowerBoundInput.value),
  String(boostInput.value),
  String(areaItemLevelInput.value),
  sortedRecordSignature(areaItemLevelOverrideInputs.value),
  String(characterRankInput.value),
  sortedRecordSignature(characterRankOverrideInputs.value),
  String(mysekaiGateLevelInput.value),
  sortedRecordSignature(mysekaiGateLevelOverrideInputs.value),
  String(mysekaiFixtureBonusRateInput.value),
  sortedRecordSignature(mysekaiFixtureBonusRateOverrideInputs.value),
  String(resultLimitInput.value),
  String(engineTimeoutMsInput.value),
  stringArraySignature(unitFilters.value),
  stringArraySignature(attrFilters.value),
  numberArraySignature(characterFilters.value),
  numberArraySignature(fixedCardIds.value),
  String(useCurrentDeck.value),
  numberArraySignature(fixedCharacterIds.value),
  numberArraySignature(excludedCardIds.value),
  singleCardOverridesSignature(singleCardOverrides.value),
  skillOrderStrategy.value,
  skillReferenceStrategy.value,
  specificSkillOrderInput.value,
  String(keepAfterTrainingState.value),
  String(supportMasterMax.value),
  String(supportSkillMax.value),
  trainingConfigSignature(trainingConfig.value),
].join("\u001F"))

const {
  checkDeckRecommendRegionData,
  preloadCurrentRegionData,
  invalidateDataPreload,
  resetCardOptionMasterData,
  syncParallelEngines,
} = useDeckRecommendDataPreload({
  runner,
  dataRegion,
  cardOptionMasterData,
  selectedAccountServer,
  recommendDataReady,
  executionMode,
  activeAlgorithms,
})

watch(
  accountOptions,
  (accounts) => {
    if (accounts.length === 0) {
      if (!pendingSavedAccountKey) {
        selectedAccountKey.value = ""
      }
      return
    }

    if (pendingSavedAccountKey && accounts.some((account) => account.key === pendingSavedAccountKey)) {
      selectedAccountKey.value = pendingSavedAccountKey
      pendingSavedAccountKey = ""
      return
    }
    pendingSavedAccountKey = ""

    if (!accounts.some((account) => account.key === selectedAccountKey.value)) {
      selectedAccountKey.value = (accounts.find((account) => account.isDefault) ?? accounts[0]).key
    }
  },
  { immediate: true },
)

watch(
  selectedAccount,
  (account) => {
    if (account && !routeRegionLocked) {
      dataRegion.value = account.server
    }
  },
  { immediate: true },
)

watch(dataRegion, () => {
  invalidateDataPreload()
  resetCardOptionMasterData()
  if (!routeHydrationInProgress.value) {
    selectedEventId.value = null
    selectedEventType.value = null
    selectedCharacterId.value = null
    selectedMusicId.value = DEFAULT_MUSIC_ID
    selectedDifficulty.value = DEFAULT_MUSIC_DIFFICULTY
  }
  runner.reset()
  checkDeckRecommendRegionData(dataRegion.value)
})

useDeckRecommendRouteQuery({
  dataRegion,
  recommendMode,
  recommendTarget,
  liveType,
  isLiveTypeLocked,
  selectedMusicId,
  selectedDifficulty,
  bonusTargetsInput,
  simulatedEventAttr,
  simulatedEventUnit,
  eventSimulationEnabled,
  customBonusCharacterIds,
  customBonusSupportUnits,
  filterOtherUnit,
  boostInput,
  routeHydrationInProgress,
  lockRegion: () => {
    routeRegionLocked = true
  },
})

watch(
  deckRecommendResetSignature,
  () => runner.reset(),
)

watch(
  fixedCardIds,
  (cardIds) => {
    if (isCurrentDeckEnabled.value) {
      return
    }

    const existingIds = new Set(singleCardOverrides.value.map((item) => item.cardId))
    const additions = cardIds
      .filter((cardId) => !existingIds.has(cardId))
      .map((cardId) => createSingleCardOverrideFromTrainingConfig(cardId))

    if (additions.length > 0) {
      singleCardOverrides.value = [...singleCardOverrides.value, ...additions]
    }
  },
  { deep: true },
)

watch(
  [scenarioDefaultAlgorithms, algorithmSelectionIsManual],
  () => {
    if (!algorithmSelectionIsManual.value) {
      selectedAlgorithms.value = [...scenarioDefaultAlgorithms.value]
    }
  },
  { immediate: true },
)

watch(
  () => [selectedAlgorithms.value.join(","), activeAlgorithms.value.join(","), executionMode.value, algorithmSelectionIsManual.value] as const,
  () => {
    writeDeckRecommendPreferences({
      algorithms: selectedAlgorithms.value,
      algorithmsAuto: !algorithmSelectionIsManual.value,
      executionMode: executionMode.value,
    })
    syncParallelEngines()
  },
  { immediate: true },
)

watch(
  recommendMode,
  () => {
    if (!isEventLikeMode.value) {
      eventSimulationEnabled.value = false
    }
    if (recommendMode.value === "challenge") {
      useCurrentDeck.value = false
      fixedCharacterIds.value = []
    }
    if (!isAllowedRecommendTarget(recommendTarget.value, recommendMode.value)) {
      recommendTarget.value = defaultRecommendTarget(recommendMode.value)
    }
  },
  { immediate: true },
)

watch(
  recommendTargetOptions,
  () => {
    if (!isAllowedRecommendTarget(recommendTarget.value, recommendMode.value)) {
      recommendTarget.value = defaultRecommendTarget(recommendMode.value)
    }
  },
)

watch(
  [recommendMode, recommendTarget, liveType],
  () => {
    if (preserveInitialSavedSkillStrategy) {
      preserveInitialSavedSkillStrategy = false
      return
    }

    const defaultStrategy = resolveDefaultSkillStrategyForForm(recommendMode.value, liveType.value)
    skillOrderStrategy.value = defaultStrategy
    skillReferenceStrategy.value = defaultStrategy
  },
  { immediate: true },
)

watch(
  () => runner.running.value,
  (running) => {
    if (!running) {
      syncParallelEngines()
    }
  },
)

watch(
  recommendMode,
  () => {
    if (isLiveTypeLocked.value) {
      liveType.value = "solo"
    }
  },
  { immediate: true },
)

watch(
  [isWorldBloomSimulation, eventSimulationEnabled],
  () => {
    if (isWorldBloomSimulation.value && !simulatedWorldBloomTurn.value) {
      simulatedWorldBloomTurn.value = "1"
    }
  },
)

watch(
  isCustomBonusSimulation,
  (enabled) => {
    if (!enabled) {
      customBonusSimulationDialogOpen.value = false
    }
  },
)

watch(
  () => [
    isEventSimulationActive.value,
    isWorldBloomSimulation.value,
    simulatedWorldBloomCharacterId.value,
    characterOptions.options.value.map((option) => option.id).join(","),
  ],
  () => {
    if (!isEventSimulationActive.value || !isWorldBloomSimulation.value) {
      return
    }

    if (!simulatedWorldBloomCharacterId.value && characterOptions.options.value.length > 0) {
      simulatedWorldBloomCharacterId.value = characterOptions.options.value[0].value
    }
  },
  { immediate: true },
)

watch(
  [showCharacterSelect, characterSelectAllowedIds],
  () => {
    if (!showCharacterSelect.value) {
      selectedCharacterId.value = null
      return
    }

    const allowedIds = characterSelectAllowedIds.value
    if (!allowedIds || selectedCharacterId.value == null) {
      return
    }

    if (!allowedIds.includes(Number(selectedCharacterId.value))) {
      selectedCharacterId.value = null
    }
  },
  { immediate: true },
)

watch(
  [
    showWorldBloomCharacterSelect,
    worldBloomCharacterSelectAllowNone,
    () => worldBloomCharacters.defaultCharacterId.value,
    () => worldBloomCharacters.characterIds.value.join(","),
  ],
  () => {
    if (!showWorldBloomCharacterSelect.value) {
      return
    }

    if (worldBloomCharacterSelectAllowNone.value) {
      selectedCharacterId.value = null
      return
    }

    const defaultCharacterId = worldBloomCharacters.defaultCharacterId.value
      ?? worldBloomCharacters.characterIds.value[0]
      ?? null
    if (!defaultCharacterId) {
      selectedCharacterId.value = null
      return
    }

    const currentId = selectedCharacterId.value == null ? null : Number(selectedCharacterId.value)
    if (!currentId || !worldBloomCharacters.characterIds.value.includes(currentId)) {
      selectedCharacterId.value = String(defaultCharacterId)
    }
  },
  { immediate: true },
)

watch(
  () => [
    dataRegion.value,
    recommendDataReady.value,
    currentRegionState.value.masterFetchVersion,
    currentRegionState.value.musicMetasUpdatedAt,
    currentRegionState.value.files.join(","),
  ],
  () => {
    if (!recommendDataReady.value) {
      return
    }

    preloadCurrentRegionData()
  },
)

onMounted(() => {
  checkDeckRecommendRegionData(dataRegion.value)
  void runner.preloadEngine().catch(() => undefined)
  if (recommendDataReady.value) {
    preloadCurrentRegionData()
  }
})

onBeforeUnmount(() => {
  invalidateDataPreload()
  void runner.disposeEngine().catch(() => undefined)
})

function createAccountOption(account: GameAccountBinding): BoundAccountOption {
  const uid = String(account.userId)
  return {
    key: `${account.server}:${uid}`,
    server: account.server,
    uid,
    verified: account.verified === true,
    isDefault: account.isDefault === true,
    label: formatGameAccountLabel({
      regionLabel: resolveSekaiRegionLabel(account.server, t),
      uid,
      hideUid: settingsStore.hideGameUserId,
    }),
  }
}

function updateAccount(value: AcceptableValue) {
  routeRegionLocked = false
  pendingSavedAccountKey = ""
  selectedAccountKey.value = typeof value === "string" ? value : ""
}

function updateDataRegion(value: AcceptableValue) {
  if (typeof value === "string" && isSekaiRegionValue(value)) {
    routeRegionLocked = false
    dataRegion.value = value
  }
}

function updateRecommendMode(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendMode(value)) {
    recommendMode.value = value
    if (value === "bonus" || value === "challenge") {
      liveType.value = "solo"
    }
  }
}

function updateRecommendTarget(value: AcceptableValue) {
  if (
    typeof value === "string"
    && isDeckRecommendTarget(value)
    && isAllowedRecommendTarget(value, recommendMode.value)
  ) {
    recommendTarget.value = value
  }
}

function updateLiveType(value: AcceptableValue) {
  if (isLiveTypeLocked.value || !showLiveTypeSelect.value) {
    return
  }

  const normalized = typeof value === "string" ? normalizeDeckRecommendLiveType(value) : null
  if (normalized) {
    liveType.value = normalized
  }
}

function toggleAlgorithm(value: DeckRecommendAlgorithm, checked: boolean) {
  algorithmSelectionIsManual.value = true
  const next = new Set(selectedAlgorithms.value)
  if (checked) {
    next.add(value)
  } else {
    next.delete(value)
  }

  selectedAlgorithms.value = algorithmOptions.value
    .map((option) => option.value)
    .filter((optionValue) => next.has(optionValue))
}

function updateExecutionMode(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendExecutionMode(value)) {
    executionMode.value = value
  }
}

function updateBoostInput(value: AcceptableValue) {
  if (typeof value !== "string") {
    return
  }

  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 10) {
    boostInput.value = value
  }
}

function updateEventSimulationMode(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendEventSimulationMode(value)) {
    simulatedEventMode.value = value
  }
}

function updateSimulatedEventAttr(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendEventAttr(value)) {
    simulatedEventAttr.value = value
  }
}

function updateSimulatedEventUnit(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendSimulatedEventUnit(value)) {
    simulatedEventUnit.value = value
    if (value === DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT) {
      customBonusSimulationDialogOpen.value = true
    }
  }
}

function updateSimulatedWorldBloomTurn(value: AcceptableValue) {
  simulatedWorldBloomTurn.value = typeof value === "string" ? value : null
}

function updateSkillOrderStrategy(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendSkillOrderStrategy(value)) {
    skillOrderStrategy.value = value
  }
}

function updateSkillReferenceStrategy(value: AcceptableValue) {
  if (typeof value === "string" && isDeckRecommendSkillReferenceStrategy(value)) {
    skillReferenceStrategy.value = value
  }
}

function toggleAttrFilter(value: DeckRecommendEventAttr, checked: boolean) {
  attrFilters.value = toggleSelectedValue(attrFilters.value, value, checked)
}

function toggleUnitFilter(value: DeckRecommendUnitType, checked: boolean) {
  unitFilters.value = toggleSelectedValue(unitFilters.value, value, checked)
}

function filterSelectionLabel(count: number) {
  return count === 0
    ? t("deckRecommend.options.filters.none")
    : t("deckRecommend.options.filters.selectedCount", { count })
}

async function runRecommend() {
  configCollapsed.value = true
  try {
    await runner.run({
      account: selectedAccount.value,
      dataRegion: dataRegion.value,
      mode: recommendMode.value,
      target: activeRecommendTarget.value,
      liveType: liveType.value,
      algorithms: activeAlgorithms.value,
      executionMode: executionMode.value,
      eventId: selectedEventId.value,
      characterId: activeForcedLeaderCharacterId.value ? null : activeCharacterId.value,
      forcedLeaderCharacterId: activeForcedLeaderCharacterId.value,
      eventSimulation: eventSimulation.value,
      targetBonuses: bonusTargets.value.targets,
      customBonusAttr: isCustomBonusSimulation.value ? simulatedEventAttr.value : null,
      customBonusCharacterIds: isCustomBonusSimulation.value ? customBonusCharacterIds.value : [],
      customBonusCharacterSupportUnits: isCustomBonusSimulation.value ? customBonusSupportUnits.value : {},
      filterOtherUnit: isCustomBonusSimulation.value && filterOtherUnit.value,
      multiLiveTeammatePower: isMultiLiveOptionsEnabled.value ? multiLiveTeammatePower.value.value : null,
      multiLiveTeammateScoreUp: isMultiLiveOptionsEnabled.value ? multiLiveTeammateScoreUp.value.value : null,
      multiLiveScoreUpLowerBound: isMultiLiveOptionsEnabled.value ? multiLiveScoreUpLowerBound.value.value : null,
      boost: boost.value.value,
      areaItemLevel: areaItemLevel.value.value,
      areaItemLevelOverrides: areaItemLevelOverrides.value,
      characterRank: characterRank.value.value,
      characterRankOverrides: characterRankOverrides.value,
      mysekaiGateLevel: mysekaiGateLevel.value.value,
      mysekaiGateLevelOverrides: mysekaiGateLevelOverrides.value,
      mysekaiFixtureBonusRate: mysekaiFixtureBonusRate.value.value,
      mysekaiFixtureBonusRateOverrides: mysekaiFixtureBonusRateOverrides.value,
      resultLimit: resultLimit.value.value,
      timeoutMs: engineTimeoutMs.value.value,
      unitFilters: unitFilters.value,
      attrFilters: attrFilters.value,
      characterFilters: characterFilters.value,
      fixedCards: isCurrentDeckEnabled.value ? [] : fixedCardIds.value,
      useCurrentDeck: isCurrentDeckEnabled.value,
      fixedCharacters: recommendMode.value === "challenge" || isCurrentDeckEnabled.value ? [] : fixedCharacterIds.value,
      excludedCards: isCurrentDeckEnabled.value ? [] : excludedCardIds.value,
      singleCardOverrides: singleCardOverrides.value,
      skillOrderStrategy: skillOrderStrategy.value,
      skillReferenceStrategy: skillReferenceStrategy.value,
      specificSkillOrder: showSpecificSkillOrderInput.value ? specificSkillOrder.value.values : [],
      keepAfterTrainingState: keepAfterTrainingState.value,
      supportMasterMax: supportMasterMax.value,
      supportSkillMax: supportSkillMax.value,
      musicId: selectedMusicId.value,
      difficulty: selectedDifficulty.value,
      trainingConfig: trainingConfig.value,
    })
    toast.success(t("deckRecommend.toast.runSuccessTitle"))
  } catch (error) {
    if (runner.userDataMissing.value) {
      toast.warning(t("deckRecommend.result.missingUserDataTitle"), {
        description: t("deckRecommend.result.missingUserDataDescription"),
      })
      return
    }

    configCollapsed.value = false
    toast.error(t("deckRecommend.toast.runFailedTitle"), {
      description: runner.error.value ?? (error instanceof Error ? error.message : String(error)),
    })
  }
}

function saveDeckRecommendConfig() {
  try {
    writeDeckRecommendSavedConfig(createCurrentDeckRecommendConfig())
    toast.success(t("deckRecommend.toast.configSavedTitle"))
  } catch (error) {
    toast.error(t("deckRecommend.toast.configSaveFailedTitle"), {
      description: error instanceof Error ? error.message : String(error),
    })
  }
}

function clearDeckRecommendConfig() {
  removeDeckRecommendSavedConfig()
  resetDeckRecommendConfig()
  clearConfigConfirmOpen.value = false
  toast.success(t("deckRecommend.toast.configClearedTitle"))
}

function createCurrentDeckRecommendConfig(): DeckRecommendSavedConfig {
  return {
    selectedAccountKey: selectedAccountKey.value,
    dataRegion: dataRegion.value,
    recommendMode: recommendMode.value,
    recommendTarget: recommendTarget.value,
    liveType: liveType.value,
    selectedAlgorithms: [...selectedAlgorithms.value],
    algorithmSelectionMode: algorithmSelectionIsManual.value ? "manual" : "auto",
    executionMode: executionMode.value,
    selectedEventId: selectedEventId.value,
    selectedCharacterId: selectedCharacterId.value,
    selectedMusicId: selectedMusicId.value,
    selectedDifficulty: selectedDifficulty.value,
    bonusTargetsInput: bonusTargetsInput.value,
    customBonusCharacterIds: [...customBonusCharacterIds.value],
    customBonusSupportUnits: { ...customBonusSupportUnits.value },
    filterOtherUnit: filterOtherUnit.value,
    eventSimulationEnabled: eventSimulationEnabled.value,
    simulatedEventMode: simulatedEventMode.value,
    simulatedEventAttr: simulatedEventAttr.value,
    simulatedEventUnit: simulatedEventUnit.value,
    simulatedWorldBloomTurn: simulatedWorldBloomTurn.value,
    simulatedWorldBloomCharacterId: simulatedWorldBloomCharacterId.value,
    multiLiveTeammatePowerInput: String(multiLiveTeammatePowerInput.value),
    multiLiveTeammateScoreUpInput: String(multiLiveTeammateScoreUpInput.value),
    multiLiveScoreUpLowerBoundInput: String(multiLiveScoreUpLowerBoundInput.value),
    boostInput: String(boostInput.value),
    areaItemLevelInput: String(areaItemLevelInput.value),
    areaItemLevelOverrideInputs: { ...areaItemLevelOverrideInputs.value },
    characterRankInput: String(characterRankInput.value),
    characterRankOverrideInputs: { ...characterRankOverrideInputs.value },
    mysekaiGateLevelInput: String(mysekaiGateLevelInput.value),
    mysekaiGateLevelOverrideInputs: { ...mysekaiGateLevelOverrideInputs.value },
    mysekaiFixtureBonusRateInput: String(mysekaiFixtureBonusRateInput.value),
    mysekaiFixtureBonusRateOverrideInputs: { ...mysekaiFixtureBonusRateOverrideInputs.value },
    resultLimitInput: String(resultLimitInput.value),
    engineTimeoutMsInput: String(engineTimeoutMsInput.value),
    unitFilters: [...unitFilters.value],
    attrFilters: [...attrFilters.value],
    characterFilters: [...characterFilters.value],
    fixedCardIds: [...fixedCardIds.value],
    useCurrentDeck: useCurrentDeck.value,
    fixedCharacterIds: [...fixedCharacterIds.value],
    excludedCardIds: [...excludedCardIds.value],
    singleCardOverrides: singleCardOverrides.value.map((item) => ({ ...item })),
    skillOrderStrategy: skillOrderStrategy.value,
    skillReferenceStrategy: skillReferenceStrategy.value,
    specificSkillOrderInput: specificSkillOrderInput.value,
    keepAfterTrainingState: keepAfterTrainingState.value,
    supportMasterMax: supportMasterMax.value,
    supportSkillMax: supportSkillMax.value,
    trainingConfig: trainingConfig.value.map((item) => ({ ...item })),
  }
}

function resetDeckRecommendConfig() {
  routeRegionLocked = false
  pendingSavedAccountKey = ""
  selectedAccountKey.value = accountOptions.value[0]?.key ?? ""
  dataRegion.value = selectedAccount.value?.server ?? "jp"
  recommendMode.value = "event"
  recommendTarget.value = "score"
  liveType.value = "multi"
  algorithmSelectionIsManual.value = false
  selectedAlgorithms.value = [...scenarioDefaultAlgorithms.value]
  executionMode.value = DEFAULT_EXECUTION_MODE
  selectedEventId.value = null
  selectedEventType.value = null
  selectedCharacterId.value = null
  selectedMusicId.value = DEFAULT_MUSIC_ID
  selectedDifficulty.value = DEFAULT_MUSIC_DIFFICULTY
  bonusTargetsInput.value = ""
  customBonusCharacterIds.value = []
  customBonusSupportUnits.value = {}
  filterOtherUnit.value = false
  eventSimulationEnabled.value = false
  simulatedEventMode.value = "marathon"
  simulatedEventAttr.value = "cool"
  simulatedEventUnit.value = "idol"
  customBonusSimulationDialogOpen.value = false
  simulatedWorldBloomTurn.value = "1"
  simulatedWorldBloomCharacterId.value = null
  multiLiveTeammatePowerInput.value = ""
  multiLiveTeammateScoreUpInput.value = ""
  multiLiveScoreUpLowerBoundInput.value = ""
  boostInput.value = "0"
  areaItemLevelInput.value = ""
  areaItemLevelOverrideInputs.value = {}
  characterRankInput.value = ""
  characterRankOverrideInputs.value = {}
  mysekaiGateLevelInput.value = ""
  mysekaiGateLevelOverrideInputs.value = {}
  mysekaiFixtureBonusRateInput.value = ""
  mysekaiFixtureBonusRateOverrideInputs.value = {}
  resultLimitInput.value = ""
  engineTimeoutMsInput.value = ""
  unitFilters.value = []
  attrFilters.value = []
  characterFilters.value = []
  fixedCardIds.value = []
  useCurrentDeck.value = false
  fixedCharacterIds.value = []
  excludedCardIds.value = []
  singleCardOverrides.value = []
  skillOrderStrategy.value = "average"
  skillReferenceStrategy.value = "average"
  specificSkillOrderInput.value = ""
  keepAfterTrainingState.value = false
  supportMasterMax.value = false
  supportSkillMax.value = false
  trainingConfig.value = createDefaultCardTrainingConfig()
}

function createSingleCardOverrideFromTrainingConfig(cardId: number): DeckRecommendSingleCardOverride {
  const option = cardOptions.value.find((item) => item.id === cardId) ?? null
  const rarityConfig = option?.rarity
    ? trainingConfig.value.find((item) => item.rarity === option.rarity) ?? null
    : null

  return {
    cardId,
    disabled: false,
    level: rarityConfig?.maxLevel ? option?.maxLevel ?? null : null,
    skillLevel: rarityConfig?.maxSkillLevel ? option?.maxSkillLevel ?? null : null,
    masterRank: rarityConfig?.maxMasterRank ? 5 : null,
    episodeState: rarityConfig?.episodesRead ? "both" : null,
    canvas: rarityConfig ? rarityConfig.mySekaiCanvas : null,
  }
}

const songRankingAvailable = computed(() =>
  recommendMode.value === "event" && selectedEventId.value != null && !isEventSimulationActive.value,
)
const songRankingLiveType = computed<"multi" | "solo">(() => liveType.value === "solo" ? "solo" : "multi")
const assumeWorldBloomResult = computed(() =>
  showWorldBloomCharacterSelect.value || (isEventSimulationActive.value && isWorldBloomSimulation.value),
)

function formatInteger(value: number | undefined) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function recommendTargetLabel(target: DeckRecommendTarget, mode: DeckRecommendMode) {
  if (target === "score" && mode !== "challenge" && mode !== "max") {
    return t("deckRecommend.targets.pt")
  }

  if (target === "score" && (mode === "challenge" || mode === "max")) {
    return t("deckRecommend.targets.score")
  }

  return t(`deckRecommend.targets.${target}`)
}

function isAlgorithmSelected(value: DeckRecommendAlgorithm) {
  if (recommendMode.value === "bonus") {
    return value === "dfs"
  }

  return selectedAlgorithms.value.includes(value)
}

function isAlgorithmDisabled() {
  return runner.running.value || recommendMode.value === "bonus"
}

function resolveDefaultSkillStrategyForForm(
  mode: DeckRecommendMode,
  selectedLiveType: DeckRecommendLiveType,
): DeckRecommendSkillReferenceStrategy {
  if (
    (mode === "challenge" && selectedLiveType !== "auto")
    || activeRecommendTarget.value === "skill"
  ) {
    return "max"
  }

  return "average"
}


provideDeckRecommendFormContext({
  running: computed(() => runner.running.value),
  dataReady,
  cardOptions,
  skillOrderStrategy,
  skillOrderStrategyOptions,
  updateSkillOrderStrategy,
  skillReferenceStrategy,
  skillReferenceStrategyOptions,
  updateSkillReferenceStrategy,
  showSpecificSkillOrderInput,
  specificSkillOrderInput,
  hasSpecificSkillOrderError,
  keepAfterTrainingState,
  supportMasterMax,
  supportSkillMax,
  areaItemOverrideOpen,
  areaItemOverrideSections,
  areaItemLevelOverrideInputs,
  areaItemLevelOverrides,
  clearAreaItemLevelOverrides,
  characterRankOverrideOpen,
  characterRankOptions,
  characterRankOverrideInputs,
  characterRankOverrides,
  clearCharacterRankOverrides,
  mysekaiGateOverrideOpen,
  mysekaiGateOptions,
  mysekaiGateLevelOverrideInputs,
  mysekaiGateLevelOverrides,
  clearMysekaiGateLevelOverrides,
  mysekaiFixtureBonusOverrideOpen,
  mysekaiFixtureBonusCharacterOptions,
  mysekaiFixtureBonusRateComboboxOptions,
  mysekaiFixtureBonusMaxRateLabel,
  mysekaiFixtureBonusRateOverrideInputs,
  mysekaiFixtureBonusRateOverrides,
  clearMysekaiFixtureBonusRateOverrides,
  resultLimitInput,
  engineTimeoutMsInput,
  resultLimitInvalid: computed(() => resultLimit.value.invalid),
  engineTimeoutInvalid: computed(() => engineTimeoutMs.value.invalid),
  singleCardOverrides,
  recommendMode,
  dataRegion,
  trainingConfig,
  unitFilters,
  unitFilterOptions,
  toggleUnitFilter,
  attrFilters,
  eventAttrOptions,
  toggleAttrFilter,
  filterSelectionLabel,
  characterFilters,
  characterFilterMaxCount,
  characterFilterMinCount: CHARACTER_FILTER_MIN_COUNT,
  hasCharacterFilterError,
  areaItemLevelInput,
  updateAreaItemLevelInput,
  areaItemLevelOptions,
  characterRankInput,
  updateCharacterRankInput,
  characterRankLevelOptions,
  characterRankMax,
  mysekaiGateLevelInput,
  updateMysekaiGateLevelInput,
  mysekaiGateLevelOptions,
  mysekaiGateMaxLevel,
  mysekaiFixtureBonusRateInput,
  updateMysekaiFixtureBonusRateInput,
  dataOverridesInvalid,
  boostInput,
  updateBoostInput,
  boostOptions,
  boostInvalid: computed(() => boost.value.invalid),
  isMultiLiveOptionsEnabled,
  multiLiveTeammatePowerInput,
  multiLiveTeammateScoreUpInput,
  multiLiveScoreUpLowerBoundInput,
  multiLiveTeammatePowerInvalid: computed(() => multiLiveTeammatePower.value.invalid),
  multiLiveTeammateScoreUpInvalid: computed(() => multiLiveTeammateScoreUp.value.invalid),
  multiLiveScoreUpLowerBoundInvalid: computed(() => multiLiveScoreUpLowerBound.value.invalid),
  useCurrentDeck,
  isCurrentDeckEnabled,
  fixedCardIds,
  fixedCharacterIds,
  excludedCardIds,
  selectedAccountKey,
  accountOptions,
  selectedAccountLabel,
  updateAccount,
  updateDataRegion,
  showRecommendTargetSelect,
  activeRecommendTarget,
  activeRecommendTargetLabel,
  updateRecommendTarget,
  recommendTargetOptions,
  showChallengeCharacterSelect,
  selectedCharacterId,
  characterOptionsLoading: computed(() => characterOptions.loading.value),
  showLiveTypeSelect,
  liveType,
  isLiveTypeLocked,
  updateLiveType,
  liveTypeOptions,
  algorithmOptions,
  isAlgorithmSelected,
  isAlgorithmDisabled,
  toggleAlgorithm,
  activeAlgorithms,
  executionMode,
  updateExecutionMode,
  executionModeOptions,
  selectedMusicId,
  selectedDifficulty,
  showEventConditionSection,
  eventSimulationEnabled,
  isEventSimulationAvailable,
  isEventSimulationActive,
  selectedEventId,
  selectedEventType,
  showWorldBloomCharacterSelect,
  characterSelectAllowedIds,
  worldBloomCharacterSelectAllowNone,
  worldBloomCharactersLoading: computed(() => worldBloomCharacters.loading.value),
  simulatedEventMode,
  updateEventSimulationMode,
  eventSimulationModeOptions,
  isWorldBloomSimulation,
  simulatedEventAttr,
  updateSimulatedEventAttr,
  simulatedEventUnit,
  updateSimulatedEventUnit,
  eventUnitOptions,
  isCustomBonusSimulation,
  customBonusCharacterIds,
  customBonusSimulationDialogOpen,
  simulatedWorldBloomTurn,
  updateSimulatedWorldBloomTurn,
  worldBloomTurnOptions,
  simulatedWorldBloomCharacterId,
  hasEventSimulationError,
  eventSimulationErrorMessage,
  showBonusTargetsInput,
  bonusTargetsInput,
  hasBonusTargetsError,
})

</script>

<template>
  <div class="flex min-w-0 w-full flex-1 flex-col items-center justify-center py-1 sm:px-2 sm:py-4">
    <div class="mx-auto w-full max-w-[100rem] space-y-3 sm:space-y-4">
      <Card v-show="!configCollapsed" class="gap-0 rounded-lg py-0">
        <CardHeader class="@container gap-2 border-b px-3 py-3 sm:px-4 [.border-b]:pb-3">
          <div class="flex flex-wrap items-center gap-2">
            <Tabs :model-value="recommendMode" class="w-full min-w-0 @3xl:w-auto" @update:model-value="updateRecommendMode">
              <TabsList class="grid h-auto w-full grid-cols-5 gap-1 @3xl:inline-flex @3xl:w-fit @3xl:max-w-full @3xl:flex-wrap @3xl:justify-start">
                <TabsTrigger
                  v-for="option in modeOptions"
                  :key="option.value"
                  :value="option.value"
                  class="h-auto min-h-7 min-w-0 px-1 text-xs leading-tight whitespace-normal @2xl:text-sm @3xl:h-7 @3xl:flex-none @3xl:px-3 @3xl:whitespace-nowrap"
                >
                  {{ option.label }}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <DeckConfigActions
              variant="desktop"
              :running="runner.running.value"
              :can-run="canRunRecommend"
              @expert="expertConfigOpen = true"
              @save="saveDeckRecommendConfig"
              @clear="clearConfigConfirmOpen = true"
              @run="runRecommend"
            />
          </div>
        </CardHeader>
        <CardContent class="@container grid gap-5 px-3 py-4 sm:px-5 sm:py-5">
          <DeckBasicSection />

          <DeckAdvancedSection v-model:open="advancedConfigOpen" />

          <DeckExpertSheet v-model:open="expertConfigOpen" />
        </CardContent>
        <DeckConfigActions
          variant="mobile"
          :running="runner.running.value"
          :can-run="canRunRecommend"
          @expert="expertConfigOpen = true"
          @save="saveDeckRecommendConfig"
          @clear="clearConfigConfirmOpen = true"
          @run="runRecommend"
        />
      </Card>

      <DeckConfigSummaryBar
        v-show="configCollapsed"
        :items="configSummaryItems"
        :running="runner.running.value"
        :can-run="canRunRecommend"
        @edit="configCollapsed = false"
        @run="runRecommend"
      />

      <DeckResultPanel
        :runner="runner"
        :result-decks="resultDecks"
        :warnings="eventRuleWarnings"
        :mode="recommendMode"
        :target="activeRecommendTarget"
        :assume-world-bloom="assumeWorldBloomResult"
        :data-region="dataRegion"
        :account-server="selectedAccount?.server ?? null"
        :event-id="selectedEventId"
        :live-type="songRankingLiveType"
        :song-ranking-available="songRankingAvailable"
      />

      <DeckAttributionFooter />

      <DeckClearConfigDialog
        v-model:open="clearConfigConfirmOpen"
        @confirm="clearDeckRecommendConfig"
      />

      <CustomBonusSimulationDialog
        v-model:open="customBonusSimulationDialogOpen"
        v-model:character-ids="customBonusCharacterIds"
        v-model:support-units="customBonusSupportUnits"
        v-model:filter-other-unit="filterOtherUnit"
        :region="dataRegion"
        :running="runner.running.value"
        :data-ready="dataReady"
      />
    </div>
  </div>
</template>
