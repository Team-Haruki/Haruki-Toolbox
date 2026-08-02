<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  LucideGamepad2,
  LucideInfo,
  LucidePlay,
  LucideSave,
  LucideSettings2,
  LucideTrash2,
  LucideTriangleAlert,
} from "lucide-vue-next"
import { toast } from "vue-sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import {
  SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES,
} from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { GameAccountBinding, SekaiRegion } from "@/types"
import CharacterSelect from "../components/CharacterSelect.vue"
import CustomBonusCharacterPicker from "../components/CustomBonusCharacterPicker.vue"
import DeckAdvancedSection from "../components/DeckAdvancedSection.vue"
import DeckExpertSheet from "../components/DeckExpertSheet.vue"
import DeckResultPanel from "../components/DeckResultPanel.vue"
import EventSelect from "../components/EventSelect.vue"
import MusicSelect from "../components/MusicSelect.vue"
import {
  buildDeckRecommendAreaItemOptions,
  type DeckRecommendAreaItemKind,
  type DeckRecommendAreaItemOption,
} from "../lib/area-item-options"
import type { LazyOverrideComboboxOption } from "../components/LazyOverrideCombobox.vue"
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
  parseDeckCustomBonusCharacterIdsInput,
  parseDeckCustomBonusSupportUnitsInput,
  parseDeckSkillOrderInput,
} from "../lib/recommend-options"
import { createDefaultCardTrainingConfig, type CardTrainingConfig } from "../lib/training-config"
import {
  DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT,
  DECK_RECOMMEND_EVENT_ATTRS,
  DECK_RECOMMEND_UNITS,
  isDeckRecommendEventAttr,
  isDeckRecommendEventSimulationMode,
  isDeckRecommendExecutionMode,
  isDeckRecommendLiveType,
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
import {
  resolveMaxAreaItemLevel,
  type DeckRecommendCharacterRankOverride,
  type DeckRecommendMysekaiFixtureBonusRateOverride,
  type DeckRecommendMysekaiGateLevelOverride,
} from "../lib/user-data-preparation"
import { provideDeckRecommendFormContext } from "../composables/deck-recommend-form-context"
import {
  useDeckRecommendRunner,
  type DeckRecommendExecutionMode,
} from "../composables/useDeckRecommendRunner"
import { useCharacterOptions } from "../composables/useCharacterOptions"
import { useWorldBloomCharacterOptions } from "../composables/useWorldBloomCharacterOptions"
import {
  resolveEventCardBonusLimit,
  resolveEventSkillScoreUpLimit,
  resolveEventTotalPowerLimit,
  buildCharacterRankOptions,
  buildMysekaiGateOptions,
} from "../lib/master-options"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
  isDefault?: boolean
}

const DEFAULT_MUSIC_ID = "74"
const DEFAULT_MUSIC_DIFFICULTY = "expert"
const DECK_RECOMMEND_CARD_OPTION_MASTER_FILES = ["cards", "cardRarities", "gameCharacters", "gameCharacterUnits", "unitProfiles", "areaItems", "areaItemLevels", "areas", "characterRanks", "mysekaiGates", "mysekaiGateLevels"] as const
const DEFAULT_EXECUTION_MODE: DeckRecommendExecutionMode = "sequential"
const DECK_RECOMMEND_WORLD_BLOOM_TURNS = ["1", "2", "3"] as const
const CHARACTER_FILTER_MIN_COUNT = 5
const MYSEKAI_FIXTURE_BONUS_RATE_MAX = 100

type AreaItemOverrideAreaGroup = {
  key: string
  label: string
  items: DeckRecommendAreaItemOption[]
}
type AreaItemOverrideSection = {
  kind: DeckRecommendAreaItemKind
  label: string
  areas: AreaItemOverrideAreaGroup[]
}

const { t, locale } = useI18n()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const sekaiDataStore = useSekaiDataStore()
const runner = useDeckRecommendRunner()
const route = useRoute()
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
type NumericInputValue = string | number

const multiLiveTeammatePowerInput = ref<NumericInputValue>(initialSavedConfig.multiLiveTeammatePowerInput ?? "")
const multiLiveTeammateScoreUpInput = ref<NumericInputValue>(initialSavedConfig.multiLiveTeammateScoreUpInput ?? "")
const multiLiveScoreUpLowerBoundInput = ref<NumericInputValue>(initialSavedConfig.multiLiveScoreUpLowerBoundInput ?? "")
const boostInput = ref<NumericInputValue>(initialSavedConfig.boostInput ?? "0")
const areaItemLevelInput = ref<NumericInputValue>(initialSavedConfig.areaItemLevelInput ?? "")
const areaItemLevelOverrideInputs = ref<Record<string, string>>(initialSavedConfig.areaItemLevelOverrideInputs ?? {})
const characterRankInput = ref<NumericInputValue>(initialSavedConfig.characterRankInput ?? "")
const characterRankOverrideInputs = ref<Record<string, string>>(initialSavedConfig.characterRankOverrideInputs ?? {})
const mysekaiGateLevelInput = ref<NumericInputValue>(initialSavedConfig.mysekaiGateLevelInput ?? "")
const mysekaiGateLevelOverrideInputs = ref<Record<string, string>>(initialSavedConfig.mysekaiGateLevelOverrideInputs ?? {})
const mysekaiFixtureBonusRateInput = ref<NumericInputValue>(initialSavedConfig.mysekaiFixtureBonusRateInput ?? "")
const mysekaiFixtureBonusRateOverrideInputs = ref<Record<string, string>>(initialSavedConfig.mysekaiFixtureBonusRateOverrideInputs ?? {})
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
const trainingConfig = ref(initialSavedConfig.trainingConfig ?? createDefaultCardTrainingConfig())
const characterOptions = useCharacterOptions(dataRegion)
const worldBloomCharacters = useWorldBloomCharacterOptions(dataRegion, selectedEventId)
let dataPreloadGeneration = 0
let dataPreloadSignature = ""
let cardOptionMasterDataSignature = ""
let routeQueryHydrationSignature = ""
let routeRegionLocked = initialSavedConfig.dataRegion != null
let preserveInitialSavedSkillStrategy = Boolean(initialSavedConfig.skillOrderStrategy || initialSavedConfig.skillReferenceStrategy)
let pendingSavedAccountKey = initialSavedConfig.selectedAccountKey ?? ""
const routeHydrationInProgress = ref(false)

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => createAccountOption(account))
})

const selectedAccount = computed(() => {
  return accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null
})
const selectedAccountLabel = computed(() => selectedAccount.value?.label ?? "")

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
const areaItemOptions = computed(() =>
  buildDeckRecommendAreaItemOptions(cardOptionMasterData.value ?? runner.masterData.value),
)
const areaItemOptionMap = computed(() =>
  new Map(areaItemOptions.value.map((option) => [option.id, option])),
)
const characterRankOptions = computed(() =>
  buildCharacterRankOptions(cardOptionMasterData.value ?? runner.masterData.value),
)
const characterRankOptionMap = computed(() =>
  new Map(characterRankOptions.value.map((option) => [option.id, option])),
)
const mysekaiFixtureBonusCharacterOptions = computed(() =>
  characterOptions.options.value,
)
const mysekaiFixtureBonusCharacterIdSet = computed(() =>
  new Set(mysekaiFixtureBonusCharacterOptions.value.map((option) => option.id)),
)
const mysekaiGateOptions = computed(() =>
  buildMysekaiGateOptions(cardOptionMasterData.value ?? runner.masterData.value),
)
const mysekaiGateOptionMap = computed(() =>
  new Map(mysekaiGateOptions.value.map((option) => [option.id, option])),
)
const areaItemMaxLevel = computed(() =>
  resolveMaxAreaItemLevel((runner.masterData.value ?? cardOptionMasterData.value)?.areaItemLevels) ?? 20,
)
const characterRankMax = computed(() =>
  Math.max(0, ...characterRankOptions.value.map((option) => option.maxRank)),
)
const mysekaiGateMaxLevel = computed(() =>
  Math.max(0, ...mysekaiGateOptions.value.map((option) => option.maxLevel)),
)
const areaItemLevelOverrides = computed(() =>
  Object.entries(areaItemLevelOverrideInputs.value)
    .map(([areaItemId, level]) => ({
      areaItemId: Number(areaItemId),
      level: Number(level),
    }))
    .filter((item) => {
      const option = areaItemOptionMap.value.get(item.areaItemId)
      return option
        && Number.isInteger(item.areaItemId)
        && Number.isInteger(item.level)
        && item.level >= 1
        && item.level <= option.maxLevel
    }),
)
const characterRankOverrides = computed<DeckRecommendCharacterRankOverride[]>(() =>
  Object.entries(characterRankOverrideInputs.value)
    .map(([characterId, rank]) => ({
      characterId: Number(characterId),
      rank: Number(rank),
    }))
    .filter((item) => {
      const option = characterRankOptionMap.value.get(item.characterId)
      return option
        && Number.isInteger(item.characterId)
        && Number.isInteger(item.rank)
        && item.rank >= 1
        && item.rank <= option.maxRank
    }),
)
const mysekaiGateLevelOverrides = computed<DeckRecommendMysekaiGateLevelOverride[]>(() =>
  Object.entries(mysekaiGateLevelOverrideInputs.value)
    .map(([mysekaiGateId, level]) => ({
      mysekaiGateId: Number(mysekaiGateId),
      level: Number(level),
    }))
    .filter((item) => {
      const option = mysekaiGateOptionMap.value.get(item.mysekaiGateId)
      return option
        && Number.isInteger(item.mysekaiGateId)
        && Number.isInteger(item.level)
        && item.level >= 1
        && item.level <= option.maxLevel
    }),
)
const mysekaiFixtureBonusRateOverrides = computed<DeckRecommendMysekaiFixtureBonusRateOverride[]>(() =>
  Object.entries(mysekaiFixtureBonusRateOverrideInputs.value)
    .map(([characterId, totalBonusRate]) => ({
      characterId: Number(characterId),
      totalBonusRate: Number(totalBonusRate),
    }))
    .filter((item) =>
      mysekaiFixtureBonusCharacterIdSet.value.has(item.characterId)
      && isValidFixtureBonusRate(item.totalBonusRate),
    ),
)
const areaItemOverrideSections = computed<AreaItemOverrideSection[]>(() =>
  (["character", "unit", "attr"] as const)
    .map((kind) => ({
      kind,
      label: t(`deckRecommend.options.areaItemOverride.kinds.${kind}`),
      areas: buildAreaItemOverrideAreaGroups(areaItemOptions.value.filter((item) => item.kind === kind)),
    }))
    .filter((section) => section.areas.length > 0),
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
const isWorldBloomScenario = computed(() =>
  isEventSimulationActive.value
    ? simulatedEventMode.value === "world_bloom"
    : selectedEventType.value === "world_bloom",
)
// v0.3.0 引擎下按场景选默认算法：分数目标走 DFS 精确搜索；WL 上界松、
// 可能超时的场景走 DFS-GA；烤森走 RL；power/skill 等目标暂保持 DFS-GA
const scenarioDefaultAlgorithms = computed<DeckRecommendAlgorithm[]>(() => {
  if (recommendMode.value === "challenge" || recommendMode.value === "bonus") {
    return ["dfs"]
  }
  if (recommendMode.value === "mysekai") {
    return ["rl"]
  }
  if (recommendMode.value === "event" && isWorldBloomScenario.value) {
    return ["dfs_ga"]
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
const areaItemLevelOptions = computed(() => [
  {
    value: "default",
    label: t("deckRecommend.options.filters.areaItemLevelDefault"),
  },
  ...Array.from({ length: areaItemMaxLevel.value }, (_, index) => {
    const value = index + 1
    return {
      value: String(value),
      label: t("deckRecommend.options.filters.areaItemLevelOption", { value }),
    }
  }),
])
const characterRankLevelOptions = computed(() => [
  {
    value: "default",
    label: t("deckRecommend.options.filters.characterRankDefault"),
  },
  ...Array.from({ length: characterRankMax.value }, (_, index) => {
    const value = index + 1
    return {
      value: String(value),
      label: t("deckRecommend.options.filters.characterRankOption", { value }),
    }
  }),
])
const mysekaiGateLevelOptions = computed(() => [
  {
    value: "default",
    label: t("deckRecommend.options.filters.mysekaiGateLevelDefault"),
  },
  ...Array.from({ length: mysekaiGateMaxLevel.value }, (_, index) => {
    const value = index + 1
    return {
      value: String(value),
      label: t("deckRecommend.options.filters.mysekaiGateLevelOption", { value }),
    }
  }),
])
const mysekaiFixtureBonusRateOptions = computed(() => [
  {
    value: "default",
    label: t("deckRecommend.options.filters.mysekaiFixtureBonusRateDefault"),
  },
  ...buildFixtureBonusRateValues().map((value) => ({
    value: String(value),
    label: formatFixtureBonusRate(value),
  })),
])
const mysekaiFixtureBonusRateComboboxOptions = computed<LazyOverrideComboboxOption[]>(() =>
  mysekaiFixtureBonusRateOptions.value.map((option) => ({
    ...option,
    keywords: [option.value, option.label, option.value === "default" ? t("deckRecommend.options.mysekaiFixtureBonusOverride.default") : ""].filter(Boolean),
  })),
)
const mysekaiFixtureBonusMaxRateLabel = computed(() =>
  formatFixtureBonusRate(MYSEKAI_FIXTURE_BONUS_RATE_MAX),
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
const areaItemLevel = computed(() =>
  parseOptionalNumberInput(areaItemLevelInput.value, { min: 1, max: areaItemMaxLevel.value, integer: true }),
)
const characterRank = computed(() =>
  parseOptionalNumberInput(characterRankInput.value, { min: 1, max: characterRankMax.value || undefined, integer: true }),
)
const mysekaiGateLevel = computed(() =>
  parseOptionalNumberInput(mysekaiGateLevelInput.value, { min: 1, max: mysekaiGateMaxLevel.value || undefined, integer: true }),
)
const mysekaiFixtureBonusRate = computed(() =>
  parseFixtureBonusRateInput(mysekaiFixtureBonusRateInput.value),
)
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
  cardOptionMasterData.value = null
  cardOptionMasterDataSignature = ""
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

watch(
  areaItemMaxLevel,
  (maxLevel) => {
    const parsed = Number(areaItemLevelInput.value)
    if (Number.isInteger(parsed) && parsed > maxLevel) {
      areaItemLevelInput.value = String(maxLevel)
    }
  },
  { immediate: true },
)

watch(
  areaItemOptions,
  () => {
    const nextInputs: Record<string, string> = {}
    for (const [areaItemId, value] of Object.entries(areaItemLevelOverrideInputs.value)) {
      const option = areaItemOptionMap.value.get(Number(areaItemId))
      const level = Number(value)
      if (!option || !Number.isInteger(level) || level < 1) {
        continue
      }

      nextInputs[areaItemId] = String(Math.min(level, option.maxLevel))
    }

    if (JSON.stringify(nextInputs) !== JSON.stringify(areaItemLevelOverrideInputs.value)) {
      areaItemLevelOverrideInputs.value = nextInputs
    }
  },
  { immediate: true },
)

watch(
  characterRankMax,
  (maxRank) => {
    const parsed = Number(characterRankInput.value)
    if (Number.isInteger(parsed) && maxRank > 0 && parsed > maxRank) {
      characterRankInput.value = String(maxRank)
    }
  },
  { immediate: true },
)

watch(
  characterRankOptions,
  () => {
    const nextInputs: Record<string, string> = {}
    for (const [characterId, value] of Object.entries(characterRankOverrideInputs.value)) {
      const option = characterRankOptionMap.value.get(Number(characterId))
      const rank = Number(value)
      if (!option || !Number.isInteger(rank) || rank < 1) {
        continue
      }

      nextInputs[characterId] = String(Math.min(rank, option.maxRank))
    }

    if (JSON.stringify(nextInputs) !== JSON.stringify(characterRankOverrideInputs.value)) {
      characterRankOverrideInputs.value = nextInputs
    }
  },
  { immediate: true },
)

watch(
  mysekaiGateMaxLevel,
  (maxLevel) => {
    const parsed = Number(mysekaiGateLevelInput.value)
    if (Number.isInteger(parsed) && maxLevel > 0 && parsed > maxLevel) {
      mysekaiGateLevelInput.value = String(maxLevel)
    }
  },
  { immediate: true },
)

watch(
  mysekaiFixtureBonusCharacterOptions,
  () => {
    const nextInputs: Record<string, string> = {}
    for (const [characterId, value] of Object.entries(mysekaiFixtureBonusRateOverrideInputs.value)) {
      const rate = Number(value)
      if (!mysekaiFixtureBonusCharacterIdSet.value.has(Number(characterId)) || !isValidFixtureBonusRate(rate)) {
        continue
      }

      nextInputs[characterId] = String(rate)
    }

    if (JSON.stringify(nextInputs) !== JSON.stringify(mysekaiFixtureBonusRateOverrideInputs.value)) {
      mysekaiFixtureBonusRateOverrideInputs.value = nextInputs
    }
  },
  { immediate: true },
)

watch(
  mysekaiGateOptions,
  () => {
    const nextInputs: Record<string, string> = {}
    for (const [gateId, value] of Object.entries(mysekaiGateLevelOverrideInputs.value)) {
      const option = mysekaiGateOptionMap.value.get(Number(gateId))
      const level = Number(value)
      if (!option || !Number.isInteger(level) || level < 1) {
        continue
      }

      nextInputs[gateId] = String(Math.min(level, option.maxLevel))
    }

    if (JSON.stringify(nextInputs) !== JSON.stringify(mysekaiGateLevelOverrideInputs.value)) {
      mysekaiGateLevelOverrideInputs.value = nextInputs
    }
  },
  { immediate: true },
)

watch(
  () => route.query,
  () => {
    applyDeckRecommendRouteQuery()
  },
  { immediate: true },
)

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

function updateAreaItemLevelInput(value: AcceptableValue) {
  if (value === "default") {
    areaItemLevelInput.value = ""
    return
  }

  if (typeof value !== "string") {
    return
  }

  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= areaItemMaxLevel.value) {
    areaItemLevelInput.value = value
  }
}

function updateCharacterRankInput(value: AcceptableValue) {
  if (value === "default") {
    characterRankInput.value = ""
    return
  }

  if (typeof value !== "string") {
    return
  }

  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= 1 && (!characterRankMax.value || parsed <= characterRankMax.value)) {
    characterRankInput.value = value
  }
}

function updateMysekaiGateLevelInput(value: AcceptableValue) {
  if (value === "default") {
    mysekaiGateLevelInput.value = ""
    return
  }

  if (typeof value !== "string") {
    return
  }

  const parsed = Number(value)
  if (Number.isInteger(parsed) && parsed >= 1 && (!mysekaiGateMaxLevel.value || parsed <= mysekaiGateMaxLevel.value)) {
    mysekaiGateLevelInput.value = value
  }
}

function updateMysekaiFixtureBonusRateInput(value: AcceptableValue) {
  if (value === "default") {
    mysekaiFixtureBonusRateInput.value = ""
    return
  }

  if (typeof value !== "string") {
    return
  }

  const parsed = Number(value)
  if (isValidFixtureBonusRate(parsed)) {
    mysekaiFixtureBonusRateInput.value = value
  }
}

function clearAreaItemLevelOverrides() {
  areaItemLevelOverrideInputs.value = {}
}

function clearCharacterRankOverrides() {
  characterRankOverrideInputs.value = {}
}

function clearMysekaiGateLevelOverrides() {
  mysekaiGateLevelOverrideInputs.value = {}
}

function clearMysekaiFixtureBonusRateOverrides() {
  mysekaiFixtureBonusRateOverrideInputs.value = {}
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

function toggleSelectedValue<T extends string>(values: readonly T[], value: T, checked: boolean): T[] {
  if (checked) {
    return values.includes(value) ? [...values] : [...values, value]
  }
  return values.filter((item) => item !== value)
}

function filterSelectionLabel(count: number) {
  return count === 0
    ? t("deckRecommend.options.filters.none")
    : t("deckRecommend.options.filters.selectedCount", { count })
}

function buildAreaItemOverrideAreaGroups(items: DeckRecommendAreaItemOption[]): AreaItemOverrideAreaGroup[] {
  const groups = new Map<number, DeckRecommendAreaItemOption[]>()
  for (const item of items) {
    groups.set(item.areaId, [...groups.get(item.areaId) ?? [], item])
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([areaId, areaItems]) => ({
      key: String(areaId),
      label: areaItemAreaLabel(areaItems[0]),
      items: areaItems,
    }))
}

function areaItemAreaLabel(item: DeckRecommendAreaItemOption | undefined) {
  if (!item) {
    return t("deckRecommend.options.areaItemOverride.areaFallback", { id: "-" })
  }

  const areaName = [item.areaName, item.areaSubName].filter(Boolean).join(" · ")
  return areaName || t("deckRecommend.options.areaItemOverride.areaFallback", { id: item.areaId })
}

function checkDeckRecommendRegionData(region: SekaiRegion) {
  void sekaiDataStore.ensureRegionData(region, {
    files: mergeMasterFileNames(SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES, DECK_RECOMMEND_CARD_OPTION_MASTER_FILES),
  })
  const accountRegion = selectedAccount.value?.server
  if (accountRegion && accountRegion !== region) {
    void sekaiDataStore.ensureRegionData(accountRegion, {
      files: ["honors"],
    })
  }
}

function preloadCurrentRegionData() {
  if (!recommendDataReady.value) {
    return
  }

  const region = dataRegion.value
  const signature = createDataPreloadSignature()
  if (signature !== dataPreloadSignature) {
    dataPreloadSignature = signature
    dataPreloadGeneration += 1
  }
  const generation = dataPreloadGeneration
  const accountHonorRegion = selectedAccount.value?.server ?? region
  void loadCardOptionMasterData(region, generation).catch(() => undefined)
  void runner.preloadRegionData(region, accountHonorRegion, () => generation === dataPreloadGeneration).catch(() => undefined)
  const parallelCount = executionMode.value === "parallel" ? activeAlgorithms.value.length : 0
  if (parallelCount > 0) {
    void runner.preloadParallelRegionData(region, parallelCount, accountHonorRegion, () => generation === dataPreloadGeneration).catch(() => undefined)
  }
}

function invalidateDataPreload() {
  dataPreloadSignature = ""
  dataPreloadGeneration += 1
}

function createDataPreloadSignature() {
  return [
    dataRegion.value,
    selectedAccount.value?.server ?? "",
    currentRegionState.value.masterFetchVersion ?? "",
    currentRegionState.value.musicMetasUpdatedAt ?? "",
    currentRegionState.value.files.slice().sort().join(","),
    executionMode.value,
    activeAlgorithms.value.join(","),
  ].join(":")
}

function stringArraySignature(values: readonly string[]) {
  return values.join(",")
}

function numberArraySignature(values: readonly number[]) {
  return values.join(",")
}

function sortedRecordSignature(record: Record<string, string>) {
  return Object.entries(record)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",")
}

function singleCardOverridesSignature(values: readonly DeckRecommendSingleCardOverride[]) {
  return values
    .map((item) => [
      item.cardId,
      item.disabled ? 1 : 0,
      item.level ?? "",
      item.skillLevel ?? "",
      item.masterRank ?? "",
      item.episodeState ?? "",
      item.canvas == null ? "" : item.canvas ? 1 : 0,
    ].join(":"))
    .join(",")
}

function trainingConfigSignature(values: readonly CardTrainingConfig[]) {
  return values
    .map((item) => [
      item.rarity,
      item.disabled ? 1 : 0,
      item.maxLevel ? 1 : 0,
      item.episodesRead ? 1 : 0,
      item.maxMasterRank ? 1 : 0,
      item.maxSkillLevel ? 1 : 0,
      item.mySekaiCanvas ? 1 : 0,
    ].join(":"))
    .join(",")
}

async function loadCardOptionMasterData(region: SekaiRegion, generation: number) {
  const masterVersion = sekaiDataStore.regionStates[region].masterFetchVersion
  if (!masterVersion) {
    return
  }

  const signature = [
    region,
    masterVersion,
    DECK_RECOMMEND_CARD_OPTION_MASTER_FILES
      .map((fileName) => `${fileName}:${sekaiDataStore.regionStates[region].files.includes(fileName) ? "1" : "0"}`)
      .join(","),
  ].join(":")
  if (cardOptionMasterData.value && cardOptionMasterDataSignature === signature) {
    return
  }

  const masterData = await readSekaiMasterFiles(region, DECK_RECOMMEND_CARD_OPTION_MASTER_FILES, masterVersion)
  if (generation !== dataPreloadGeneration || dataRegion.value !== region) {
    return
  }
  if (!Array.isArray(masterData.cards)) {
    return
  }

  cardOptionMasterData.value = masterData
  cardOptionMasterDataSignature = signature
}

function mergeMasterFileNames(...groups: readonly (readonly string[])[]): string[] {
  return [...new Set(groups.flat())]
}

function syncParallelEngines() {
  if (runner.running.value) {
    return
  }

  const parallelCount = executionMode.value === "parallel" ? activeAlgorithms.value.length : 0
  void runner.preloadParallelEngines(parallelCount)
    .then(() => {
      if (parallelCount > 0 && recommendDataReady.value) {
        preloadCurrentRegionData()
      }
    })
    .catch(() => undefined)
}

function applyDeckRecommendRouteQuery() {
  const signature = createDeckRecommendRouteQuerySignature()
  if (!signature || signature === routeQueryHydrationSignature) {
    return
  }

  routeQueryHydrationSignature = signature
  routeHydrationInProgress.value = true

  const queryRegion = readRouteQueryString("dataRegion") ?? readRouteQueryString("region")
  if (queryRegion && isSekaiRegionValue(queryRegion)) {
    routeRegionLocked = true
    dataRegion.value = queryRegion
  }

  const queryMode = readRouteQueryString("mode")
  const legacyModeTarget = normalizeLegacyRecommendModeTarget(queryMode)
  if (legacyModeTarget) {
    recommendMode.value = legacyModeTarget.mode
    recommendTarget.value = legacyModeTarget.target
  } else if (queryMode && isDeckRecommendMode(queryMode)) {
    recommendMode.value = queryMode
  }

  const queryTarget = readRouteQueryString("target") ?? readRouteQueryString("recommendTarget")
  if (queryTarget && isDeckRecommendTarget(queryTarget) && isAllowedRecommendTarget(queryTarget, recommendMode.value)) {
    recommendTarget.value = queryTarget
  }

  const queryLiveType = readRouteQueryString("liveType")
  if (isLiveTypeLocked.value) {
    liveType.value = "solo"
  } else {
    const normalizedLiveType = normalizeDeckRecommendLiveType(queryLiveType)
    if (normalizedLiveType) {
      liveType.value = normalizedLiveType
    }
  }

  const queryMusicId = readPositiveIntegerRouteQuery("musicId")
  if (queryMusicId) {
    selectedMusicId.value = String(queryMusicId)
  }

  const queryMusicDifficulty = normalizeRouteMusicDifficulty(readRouteQueryString("musicDifficulty"))
    ?? normalizeRouteMusicDifficulty(readRouteQueryString("difficulty"))
  if (queryMusicDifficulty) {
    selectedDifficulty.value = queryMusicDifficulty
  }

  const queryBonusTargets = readRouteQueryString("bonusTargets")
    ?? readRouteQueryString("targetBonuses")
    ?? readRouteQueryString("target_bonus_list")
  if (queryBonusTargets) {
    bonusTargetsInput.value = queryBonusTargets
  }

  const queryCustomBonusAttr = readRouteQueryString("customBonusAttr")
  if (queryCustomBonusAttr && isDeckRecommendEventAttr(queryCustomBonusAttr)) {
    simulatedEventAttr.value = queryCustomBonusAttr
  }

  const queryCustomBonusCharacters = readRouteQueryString("customBonusCharacters")
    ?? readRouteQueryString("customBonusCharacterIds")
  if (queryCustomBonusCharacters) {
    customBonusCharacterIds.value = parseDeckCustomBonusCharacterIdsInput(queryCustomBonusCharacters).values
  }

  const queryCustomBonusSupportUnits = readRouteQueryString("customBonusSupportUnits")
  if (queryCustomBonusSupportUnits) {
    customBonusSupportUnits.value = parseDeckCustomBonusSupportUnitsInput(queryCustomBonusSupportUnits).values
  }

  const queryFilterOtherUnit = readRouteQueryBoolean("filterOtherUnit")
  if (queryFilterOtherUnit != null) {
    filterOtherUnit.value = queryFilterOtherUnit
  }

  const querySimulatedEventUnit = readRouteQueryString("simulatedEventUnit")
  const hasCustomBonusQuery = Boolean(queryCustomBonusCharacters || queryCustomBonusSupportUnits)
  if (querySimulatedEventUnit && isDeckRecommendSimulatedEventUnit(querySimulatedEventUnit)) {
    simulatedEventUnit.value = querySimulatedEventUnit
    eventSimulationEnabled.value = true
  } else if (hasCustomBonusQuery) {
    simulatedEventUnit.value = DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT
    eventSimulationEnabled.value = true
  }

  const queryBoost = readIntegerRouteQuery("boost")
  if (queryBoost != null && queryBoost >= 0 && queryBoost <= 10) {
    boostInput.value = String(queryBoost)
  }

  void nextTick(() => {
    routeHydrationInProgress.value = false
  })
}

function createDeckRecommendRouteQuerySignature() {
  const keys = [
    "source",
    "mode",
    "target",
    "recommendTarget",
    "dataRegion",
    "region",
    "liveType",
    "musicId",
    "musicDifficulty",
    "difficulty",
    "bonusTargets",
    "targetBonuses",
    "target_bonus_list",
    "customBonusAttr",
    "customBonusCharacters",
    "customBonusCharacterIds",
    "customBonusSupportUnits",
    "filterOtherUnit",
    "simulatedEventUnit",
    "boost",
  ]
  const values = keys.map((key) => `${key}=${readRouteQueryString(key) ?? ""}`)
  return values.some((value) => !value.endsWith("=")) ? values.join("&") : ""
}

function readRouteQueryString(key: string): string | null {
  const value = route.query[key]
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== "string") {
    return null
  }

  const trimmed = raw.trim()
  return trimmed ? trimmed : null
}

function readPositiveIntegerRouteQuery(key: string): number | null {
  const value = readIntegerRouteQuery(key)
  return value != null && value > 0 ? value : null
}

function readIntegerRouteQuery(key: string): number | null {
  const value = readRouteQueryString(key)
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function readRouteQueryBoolean(key: string): boolean | null {
  const value = readRouteQueryString(key)
  if (!value) {
    return null
  }

  const normalized = value.toLowerCase()
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false
  }
  return null
}

function normalizeRouteMusicDifficulty(value: string | null): string | null {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return /^[a-z_]+$/.test(normalized) ? normalized : null
}

async function runRecommend() {
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

function formatPercentValue(value: number) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 2,
  }).format(value)
}

function isAllowedRecommendTarget(target: DeckRecommendTarget, mode: DeckRecommendMode): boolean {
  return allowedRecommendTargets(mode).includes(target)
}

function allowedRecommendTargets(mode: DeckRecommendMode): DeckRecommendTarget[] {
  switch (mode) {
    case "event":
      return ["score", "power", "skill", "bonus"]
    case "mysekai":
      return ["score", "power", "bonus"]
    case "challenge":
      return ["score", "power"]
    case "max":
      return ["score", "power", "skill"]
    case "bonus":
      return ["bonus"]
  }
}

function defaultRecommendTarget(mode: DeckRecommendMode): DeckRecommendTarget {
  return mode === "bonus" ? "bonus" : "score"
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

function normalizeLegacyRecommendModeTarget(
  mode: string | null,
): { mode: DeckRecommendMode; target: DeckRecommendTarget } | null {
  if (mode === "max-power") {
    return { mode: "max", target: "power" }
  }
  if (mode === "max-skill") {
    return { mode: "max", target: "skill" }
  }
  return null
}

function normalizeDeckRecommendLiveType(value: string | null): DeckRecommendLiveType | null {
  if (!value) {
    return null
  }

  return value === "cheerful"
    ? "multi"
    : isDeckRecommendLiveType(value)
      ? value
      : null
}

function normalizeDeckRecommendUnit(value: string | null | undefined): DeckRecommendUnitType | null {
  return value && isDeckRecommendUnit(value) ? value : null
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

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}

function parseOptionalNumberInput(
  value: NumericInputValue | null | undefined,
  options: { min?: number; max?: number; integer?: boolean } = {},
): { value: number | null; invalid: boolean } {
  const trimmed = value == null ? "" : String(value).trim()
  if (trimmed === "") {
    return { value: null, invalid: false }
  }

  const parsed = Number(trimmed)
  if (
    !Number.isFinite(parsed)
    || (options.integer === true && !Number.isInteger(parsed))
    || (options.min != null && parsed < options.min)
    || (options.max != null && parsed > options.max)
  ) {
    return { value: null, invalid: true }
  }

  return { value: parsed, invalid: false }
}

function parseFixtureBonusRateInput(value: NumericInputValue | null | undefined): { value: number | null; invalid: boolean } {
  const trimmed = value == null ? "" : String(value).trim()
  if (trimmed === "") {
    return { value: null, invalid: false }
  }

  const parsed = Number(trimmed)
  return isValidFixtureBonusRate(parsed)
    ? { value: parsed, invalid: false }
    : { value: null, invalid: true }
}

function isValidFixtureBonusRate(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MYSEKAI_FIXTURE_BONUS_RATE_MAX && canBuildFixtureBonusRate(value)
}

function canBuildFixtureBonusRate(value: number): boolean {
  // 1 is available, so every integer total in the supported range can be expressed.
  return value >= 0
}

function buildFixtureBonusRateValues(): number[] {
  return Array.from({ length: MYSEKAI_FIXTURE_BONUS_RATE_MAX + 1 }, (_, value) => value)
}

function formatFixtureBonusRate(value: number): string {
  return t("deckRecommend.options.filters.mysekaiFixtureBonusRateOption", {
    value: formatPercentValue(value / 10),
  })
}

function parseWorldBloomTurn(value: string | null): number | null {
  const parsed = typeof value === "string" ? Number(value) : null
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
    return null
  }

  return parsed
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
  dataOverridesInvalid: computed(() =>
    areaItemLevel.value.invalid
    || characterRank.value.invalid
    || mysekaiGateLevel.value.invalid
    || mysekaiFixtureBonusRate.value.invalid),
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
})

</script>

<template>
  <div class="flex w-full flex-1 flex-col px-0 py-4">
    <div class="mx-auto w-full max-w-[100rem] space-y-3 sm:space-y-4">
      <div class="grid items-start gap-3 sm:gap-4 xl:grid-cols-[minmax(23rem,26rem)_minmax(0,1fr)]">
      <Card class="min-w-0 gap-0 rounded-lg py-0 xl:sticky xl:top-[4.25rem] xl:flex xl:max-h-[calc(100vh-5.25rem)] xl:flex-col xl:overflow-hidden">
          <CardHeader class="@container gap-2 border-b px-3 py-3 sm:px-4 [.border-b]:pb-3">
            <CardTitle class="flex items-center gap-2 text-base">
              <LucideGamepad2 class="size-5" />
              {{ t("deckRecommend.title") }}
            </CardTitle>
            <CardDescription class="text-xs">{{ t("deckRecommend.description") }}</CardDescription>
            <Tabs :model-value="recommendMode" class="w-full" @update:model-value="updateRecommendMode">
              <TabsList class="h-auto max-w-full flex-wrap justify-start gap-1">
                <TabsTrigger
                  v-for="option in modeOptions"
                  :key="option.value"
                  :value="option.value"
                  class="h-7 flex-none px-2 text-xs @xl:px-3 @xl:text-sm"
                >
                  {{ option.label }}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent class="@container grid min-h-0 gap-3 px-3 py-3 sm:px-4 xl:flex-1 xl:overflow-y-auto">
            <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3">
              <div class="space-y-1">
                <h2 class="text-sm font-semibold">{{ t("deckRecommend.layers.default.title") }}</h2>
                <p class="text-xs text-muted-foreground">{{ t("deckRecommend.layers.default.description") }}</p>
              </div>

              <div class="grid gap-3 @xl:grid-cols-2">
              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.account") }}</Label>
                <Select :model-value="selectedAccountKey" :disabled="accountOptions.length === 0" @update:model-value="updateAccount">
                  <SelectTrigger class="w-full">
                    <SelectValue :key="`account-value-${selectedAccountLabel}`" :placeholder="t('deckRecommend.form.accountPlaceholder')">
                      {{ selectedAccountLabel }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
                      {{ account.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="accountOptions.length === 0" class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.form.noAccount") }}
                </p>
              </div>

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.dataRegion") }}</Label>
                <Select :model-value="dataRegion" @update:model-value="updateDataRegion">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                      {{ resolveSekaiRegionLabel(option.value, t) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-if="showRecommendTargetSelect" class="grid gap-2">
                <Label>{{ t("deckRecommend.form.target") }}</Label>
                <Select :model-value="activeRecommendTarget" @update:model-value="updateRecommendTarget">
                  <SelectTrigger class="w-full">
                    <SelectValue :key="`recommend-target-${recommendMode}-${activeRecommendTarget}-${locale}`">
                      {{ activeRecommendTargetLabel }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in recommendTargetOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-if="showChallengeCharacterSelect" class="grid gap-2">
                <Label>{{ t("deckRecommend.form.character") }}</Label>
                <CharacterSelect
                  v-model="selectedCharacterId"
                  :region="dataRegion"
                  :disabled="!dataReady || characterOptions.loading.value"
                />
              </div>

              <div v-if="showLiveTypeSelect" class="grid gap-2">
                <Label>{{ t("deckRecommend.form.liveType") }}</Label>
                <Select
                  :model-value="liveType"
                  :disabled="runner.running.value || isLiveTypeLocked"
                  @update:model-value="updateLiveType"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in liveTypeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2">
                <div class="flex items-center gap-1.5">
                  <Label>{{ t("deckRecommend.form.algorithm") }}</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger as-child>
                        <button
                          type="button"
                          class="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          :aria-label="t('deckRecommend.form.algorithmHint')"
                        >
                          <LucideInfo class="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent class="w-max max-w-[calc(100vw-2rem)] !border-slate-200 !bg-white !text-slate-950 text-left leading-5 text-nowrap shadow-lg dark:!border-slate-700 dark:!bg-slate-950 dark:!text-slate-50">
                        <span class="block whitespace-nowrap">
                          {{ t("deckRecommend.form.algorithmHint") }}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div class="grid gap-2 rounded-md border p-2 @sm:grid-cols-2 sm:p-3">
                  <label
                    v-for="option in algorithmOptions"
                    :key="option.value"
                    class="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      :model-value="isAlgorithmSelected(option.value)"
                      :disabled="isAlgorithmDisabled()"
                      @update:model-value="checked => toggleAlgorithm(option.value, checked === true)"
                    />
                    <span>{{ option.label }}</span>
                  </label>
                </div>
              </div>

              <div v-if="activeAlgorithms.length > 1" class="grid gap-2">
                <Label>{{ t("deckRecommend.form.executionMode") }}</Label>
                <Select :model-value="executionMode" :disabled="runner.running.value" @update:model-value="updateExecutionMode">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in executionModeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="grid gap-3 sm:gap-4">
              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.music") }}</Label>
                <MusicSelect
                  v-model="selectedMusicId"
                  v-model:difficulty-value="selectedDifficulty"
                  :region="dataRegion"
                  :disabled="!dataReady"
                />
              </div>

              <section v-if="showEventConditionSection" class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                <div class="flex flex-col gap-3 @lg:flex-row @lg:items-start @lg:justify-between">
                  <div class="space-y-1">
                    <h3 class="text-sm font-medium">{{ t("deckRecommend.options.eventCondition.title") }}</h3>
                    <p class="text-xs leading-5 text-muted-foreground">
                      {{ t("deckRecommend.options.eventCondition.description") }}
                    </p>
                  </div>
                  <label class="flex shrink-0 items-center gap-2 text-sm">
                    <span>{{ t("deckRecommend.options.eventSimulation.title") }}</span>
                    <Switch
                      v-model="eventSimulationEnabled"
                      class="shrink-0"
                      :disabled="runner.running.value || !isEventSimulationAvailable"
                    />
                  </label>
                </div>
                <div class="grid gap-3 @3xl:grid-cols-2">
                  <div class="grid gap-2">
                    <Label>{{ t("deckRecommend.form.event") }}</Label>
                    <EventSelect
                      v-model="selectedEventId"
                      v-model:event-type="selectedEventType"
                      :region="dataRegion"
                      :disabled="!dataReady || isEventSimulationActive"
                    />
                    <p v-if="isEventSimulationActive" class="text-xs text-muted-foreground">
                      {{ t("deckRecommend.options.eventSimulation.realEventDisabled") }}
                    </p>
                  </div>

                  <div v-if="showWorldBloomCharacterSelect" class="grid gap-2">
                    <Label>{{ t("deckRecommend.form.character") }}</Label>
                    <CharacterSelect
                      v-model="selectedCharacterId"
                      :region="dataRegion"
                      :allowed-character-ids="characterSelectAllowedIds"
                      :allow-none-option="worldBloomCharacterSelectAllowNone"
                      :disabled="!dataReady || worldBloomCharacters.loading.value"
                    />
                  </div>
                </div>
                <p v-if="!isEventSimulationAvailable" class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.options.eventSimulation.unavailable") }}
                </p>
                <div v-else-if="eventSimulationEnabled" class="grid gap-3 @xl:grid-cols-2">
                  <div class="grid gap-2">
                    <Label>{{ t("deckRecommend.options.eventSimulation.type") }}</Label>
                    <Select
                      :model-value="simulatedEventMode"
                      :disabled="runner.running.value"
                      @update:model-value="updateEventSimulationMode"
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem v-for="option in eventSimulationModeOptions" :key="option.value" :value="option.value">
                          {{ option.label }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <template v-if="!isWorldBloomSimulation">
                    <div class="grid gap-2">
                      <Label>{{ t("deckRecommend.options.eventSimulation.attr") }}</Label>
                      <Select
                        :model-value="simulatedEventAttr"
                        :disabled="runner.running.value"
                        @update:model-value="updateSimulatedEventAttr"
                      >
                        <SelectTrigger class="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="option in eventAttrOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="grid gap-2">
                      <Label>{{ t("deckRecommend.options.eventSimulation.unit") }}</Label>
                      <Select
                        :model-value="simulatedEventUnit"
                        :disabled="runner.running.value"
                        @update:model-value="updateSimulatedEventUnit"
                      >
                        <SelectTrigger class="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="option in eventUnitOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div
                      v-if="isCustomBonusSimulation"
                      class="grid gap-2 rounded-md border bg-background/60 p-2.5 @xl:col-span-2 sm:p-3"
                    >
                      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div class="space-y-1">
                          <p class="text-sm font-medium">{{ t("deckRecommend.options.eventSimulation.customBonusTitle") }}</p>
                          <p class="text-xs leading-5 text-muted-foreground">
                            {{ t("deckRecommend.options.eventSimulation.customBonusSummary", { count: customBonusCharacterIds.length }) }}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          class="shrink-0"
                          :disabled="runner.running.value || !dataReady"
                          @click="customBonusSimulationDialogOpen = true"
                        >
                          <LucideSettings2 class="mr-2 size-4" aria-hidden="true" />
                          {{ t("deckRecommend.options.eventSimulation.customBonusConfigure") }}
                        </Button>
                      </div>
                    </div>
                  </template>

                  <template v-else>
                    <div class="grid gap-2">
                      <Label>{{ t("deckRecommend.options.eventSimulation.worldBloomTurn") }}</Label>
                      <Select
                        :model-value="simulatedWorldBloomTurn"
                        :disabled="runner.running.value"
                        @update:model-value="updateSimulatedWorldBloomTurn"
                      >
                        <SelectTrigger class="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="option in worldBloomTurnOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="grid gap-2 @xl:col-span-2">
                      <Label>{{ t("deckRecommend.options.eventSimulation.worldBloomCharacter") }}</Label>
                    <CharacterSelect
                      v-model="simulatedWorldBloomCharacterId"
                      :region="dataRegion"
                      :disabled="runner.running.value || !dataReady || characterOptions.loading.value"
                    />
                  </div>
                  </template>
                </div>
                <p v-if="hasEventSimulationError" class="text-xs text-destructive">
                  {{ eventSimulationErrorMessage }}
                </p>
                <p v-else-if="isEventSimulationActive" class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.options.eventSimulation.activeHint") }}
                </p>
              </section>

              <section v-if="showBonusTargetsInput" class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                <div class="space-y-1">
                  <h3 class="text-sm font-medium">{{ t("deckRecommend.options.bonus.title") }}</h3>
                  <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.bonus.description") }}</p>
                </div>
                <div class="grid gap-3 @xl:grid-cols-2">
                  <div class="grid gap-2">
                    <Label for="deck-recommend-bonus-targets">{{ t("deckRecommend.form.bonusTargets") }}</Label>
                    <Input
                      id="deck-recommend-bonus-targets"
                      v-model="bonusTargetsInput"
                      inputmode="numeric"
                      :aria-invalid="hasBonusTargetsError || undefined"
                      :placeholder="t('deckRecommend.form.bonusTargetsPlaceholder')"
                      :disabled="runner.running.value"
                    />
                  </div>
                </div>
                <p
                  v-if="hasBonusTargetsError"
                  class="text-xs text-destructive"
                >
                  {{ t("deckRecommend.form.bonusTargetsInvalid") }}
                </p>
                <p v-else class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.form.bonusTargetsHint") }}
                </p>
              </section>

            </div>
            </section>

            <DeckAdvancedSection v-model:open="advancedConfigOpen" />

            <DeckExpertSheet v-model:open="expertConfigOpen" />

          </CardContent>
          <div class="grid gap-2 border-t px-3 py-3 sm:px-4">
            <p class="text-xs text-muted-foreground">
              {{ runner.running.value && runner.phase.value ? t(`deckRecommend.runner.phases.${runner.phase.value}`) : t("deckRecommend.runner.ready") }}
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" @click="expertConfigOpen = true">
                <LucideSettings2 class="size-4" />
                {{ t("deckRecommend.layers.expert.title") }}
              </Button>
              <Button type="button" variant="outline" size="sm" :disabled="runner.running.value" @click="saveDeckRecommendConfig">
                <LucideSave class="size-4" />
                {{ t("deckRecommend.configActions.save") }}
              </Button>
              <Button type="button" variant="destructive" size="sm" :disabled="runner.running.value" @click="clearConfigConfirmOpen = true">
                <LucideTrash2 class="size-4" />
                {{ t("deckRecommend.configActions.clear") }}
              </Button>
              <Button type="button" class="min-w-28 flex-1" :disabled="!canRunRecommend" @click="runRecommend">
                <LucidePlay class="size-4" />
                {{ runner.running.value ? t("deckRecommend.runner.running") : t("deckRecommend.runner.run") }}
              </Button>
            </div>
          </div>
      </Card>

      <div class="grid min-w-0 content-start gap-3 sm:gap-4">
        <div class="flex gap-2 rounded-md border border-amber-200 bg-amber-50/90 px-2 py-2 text-sm text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:gap-3 sm:rounded-lg sm:px-4 sm:py-3">
          <LucideTriangleAlert class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
          <p class="leading-6">
            <strong class="font-bold text-amber-950 dark:text-amber-50">
              {{ t("deckRecommend.notice.testingPrefix") }}
            </strong><span>&#8288;{{ t("deckRecommend.notice.testingSuffix") }}</span>
          </p>
        </div>

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
      </div>
      </div>

      <div class="space-y-1.5 rounded-md border bg-muted/20 p-2.5 text-xs leading-6 text-muted-foreground sm:p-3 xl:p-4">
        <p>
          {{ t("deckRecommend.attribution.originalPrefix") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/xfl03"
            target="_blank"
            rel="noreferrer noopener"
          >xfl03(33)</a>{{ t("deckRecommend.attribution.originalMiddle") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/xfl03/sekai-calculator"
            target="_blank"
            rel="noreferrer noopener"
          >sekai-calculator</a>{{ t("deckRecommend.attribution.originalSuffix") }}
        </p>
        <p>
          {{ t("deckRecommend.attribution.optimizationPrefix") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/NeuraXmy"
            target="_blank"
            rel="noreferrer noopener"
          >{{ t("deckRecommend.attribution.neuraxmyName") }}</a>{{ t("deckRecommend.attribution.optimizationMiddle") }}<a
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            href="https://github.com/NeuraXmy/sekai-deck-recommend-cpp"
            target="_blank"
            rel="noreferrer noopener"
          >sekai-deck-recommend-cpp</a>
        </p>
        <p>
          {{ t("deckRecommend.attribution.enginePrefix") }}<router-link
            class="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            to="/about"
          >{{ t("deckRecommend.attribution.aboutLink") }}</router-link>{{ t("deckRecommend.attribution.engineSuffix") }}
        </p>
      </div>

      <AlertDialog v-model:open="clearConfigConfirmOpen">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{{ t("deckRecommend.configActions.clearDialogTitle") }}</AlertDialogTitle>
            <AlertDialogDescription>
              {{ t("deckRecommend.configActions.clearDialogDescription") }}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{{ t("deckRecommend.configActions.clearDialogCancel") }}</AlertDialogCancel>
            <AlertDialogAction
              class="bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
              @click="clearDeckRecommendConfig"
            >
              {{ t("deckRecommend.configActions.clearDialogConfirm") }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog v-model:open="customBonusSimulationDialogOpen">
        <DialogScrollContent class="max-h-[88vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{{ t("deckRecommend.options.eventSimulation.customBonusTitle") }}</DialogTitle>
            <DialogDescription>
              {{ t("deckRecommend.options.eventSimulation.customBonusDescription") }}
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-4">
            <CustomBonusCharacterPicker
              v-model="customBonusCharacterIds"
              v-model:support-units="customBonusSupportUnits"
              :region="dataRegion"
              :disabled="runner.running.value || !dataReady"
            />
            <label class="flex items-center justify-between gap-3 rounded-md border bg-background/60 p-3 text-sm">
              <span>{{ t("deckRecommend.form.filterOtherUnit") }}</span>
              <Switch
                v-model="filterOtherUnit"
                :aria-label="t('deckRecommend.form.filterOtherUnit')"
                :disabled="runner.running.value"
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              @click="customBonusSimulationDialogOpen = false"
            >
              {{ t("deckRecommend.options.eventSimulation.customBonusDone") }}
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </div>
  </div>
</template>
