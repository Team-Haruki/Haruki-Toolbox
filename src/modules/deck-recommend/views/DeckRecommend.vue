<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  LucideChevronDown,
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
import { Combobox } from "@/components/ui/combobox"
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
import AreaItemOverrideList from "../components/AreaItemOverrideList.vue"
import CardMultiPicker from "../components/CardMultiPicker.vue"
import CardThumbnail from "../components/CardThumbnail.vue"
import CardTrainingConfigTable from "../components/CardTrainingConfigTable.vue"
import CharacterRankOverrideList from "../components/CharacterRankOverrideList.vue"
import CharacterMultiPicker from "../components/CharacterMultiPicker.vue"
import CharacterSelect from "../components/CharacterSelect.vue"
import CustomBonusCharacterPicker from "../components/CustomBonusCharacterPicker.vue"
import EventSelect from "../components/EventSelect.vue"
import MysekaiFixtureBonusOverrideList from "../components/MysekaiFixtureBonusOverrideList.vue"
import MysekaiGateOverrideList from "../components/MysekaiGateOverrideList.vue"
import MusicSelect from "../components/MusicSelect.vue"
import SingleCardOverrideTable from "../components/SingleCardOverrideTable.vue"
import TemporaryOverridePanel from "../components/TemporaryOverridePanel.vue"
import {
  buildDeckRecommendAreaItemOptions,
  resolveAreaItemAttrIconUrl,
  resolveUnitIconUrl,
  type DeckRecommendAreaItemKind,
  type DeckRecommendAreaItemOption,
} from "../lib/area-item-options"
import type { LazyOverrideComboboxOption } from "../components/LazyOverrideCombobox.vue"
import { buildMasterCardOptions } from "../lib/card-options"
import {
  buildDeckResultViews,
  buildDeckSupportCardViews,
  resolveDeckSupportCards,
  type DeckResultCardView,
  type DeckResultDeckView,
  type DeckResultSupportCardView,
} from "../lib/card-thumbnail"
import {
  type DeckRecommendAlgorithm,
  type DeckRecommendEventAttr,
  type DeckRecommendEventSimulationInput,
  type DeckRecommendSimulatedEventType,
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
  resolveMaxAreaItemLevel,
  type DeckRecommendCharacterRankOverride,
  type DeckRecommendMysekaiFixtureBonusRateOverride,
  type DeckRecommendMysekaiGateLevelOverride,
} from "../lib/user-data-preparation"
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
}

const DEFAULT_MUSIC_ID = "74"
const DEFAULT_MUSIC_DIFFICULTY = "expert"
// v0.3.0 前的默认三算法组合；仅用于偏好迁移时识别“用户未定制”
const LEGACY_DEFAULT_ALGORITHMS: DeckRecommendAlgorithm[] = ["dfs_ga", "ga", "rl"]
const DECK_RECOMMEND_ALGORITHMS: DeckRecommendAlgorithm[] = ["dfs_ga", "dfs", "ga", "rl"]
const DECK_RECOMMEND_CARD_OPTION_MASTER_FILES = ["cards", "cardRarities", "gameCharacters", "gameCharacterUnits", "unitProfiles", "areaItems", "areaItemLevels", "areas", "characterRanks", "mysekaiGates", "mysekaiGateLevels"] as const
const DECK_RECOMMEND_PREFERENCES_STORAGE_KEY = "haruki:deck-recommend:preferences"
const DECK_RECOMMEND_PREFERENCES_VERSION = 3
const DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY = "haruki:deck-recommend:saved-config"
const DECK_RECOMMEND_SAVED_CONFIG_VERSION = 1
const DECK_RECOMMEND_EXECUTION_MODES: DeckRecommendExecutionMode[] = ["sequential", "parallel"]
const DEFAULT_EXECUTION_MODE: DeckRecommendExecutionMode = "sequential"
const DECK_RECOMMEND_EVENT_ATTRS: DeckRecommendEventAttr[] = ["happy", "cute", "cool", "pure", "mysterious"]
const DECK_RECOMMEND_UNITS: DeckRecommendUnitType[] = [
  "light_sound",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "piapro",
]
const DECK_RECOMMEND_WORLD_BLOOM_TURNS = ["1", "2", "3"] as const
const DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT = "custom_bonus_characters" as const
const CHARACTER_FILTER_MIN_COUNT = 5
const MYSEKAI_FIXTURE_BONUS_RATE_MAX = 100

type DeckRecommendEventSimulationMode = DeckRecommendSimulatedEventType | "world_bloom"
type DeckRecommendAlgorithmSelectionMode = "auto" | "manual"
type DeckRecommendSimulatedEventUnitValue = DeckRecommendUnitType | typeof DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT
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
type DeckRecommendSavedConfig = {
  selectedAccountKey?: string
  dataRegion?: SekaiRegion
  recommendMode?: DeckRecommendMode
  recommendTarget?: DeckRecommendTarget
  liveType?: DeckRecommendLiveType
  selectedAlgorithms?: DeckRecommendAlgorithm[]
  algorithmSelectionMode?: DeckRecommendAlgorithmSelectionMode
  executionMode?: DeckRecommendExecutionMode
  selectedEventId?: string | null
  selectedCharacterId?: string | null
  selectedMusicId?: string | null
  selectedDifficulty?: string | null
  bonusTargetsInput?: string
  customBonusCharacterIds?: number[]
  customBonusSupportUnits?: Record<string, DeckRecommendSupportUnitType>
  filterOtherUnit?: boolean
  eventSimulationEnabled?: boolean
  simulatedEventMode?: DeckRecommendEventSimulationMode
  simulatedEventAttr?: DeckRecommendEventAttr | null
  simulatedEventUnit?: DeckRecommendSimulatedEventUnitValue | null
  simulatedWorldBloomTurn?: string | null
  simulatedWorldBloomCharacterId?: string | null
  multiLiveTeammatePowerInput?: string
  multiLiveTeammateScoreUpInput?: string
  multiLiveScoreUpLowerBoundInput?: string
  boostInput?: string
  areaItemLevelInput?: string
  areaItemLevelOverrideInputs?: Record<string, string>
  characterRankInput?: string
  characterRankOverrideInputs?: Record<string, string>
  mysekaiGateLevelInput?: string
  mysekaiGateLevelOverrideInputs?: Record<string, string>
  mysekaiFixtureBonusRateInput?: string
  mysekaiFixtureBonusRateOverrideInputs?: Record<string, string>
  resultLimitInput?: string
  engineTimeoutMsInput?: string
  unitFilters?: DeckRecommendUnitType[]
  attrFilters?: DeckRecommendEventAttr[]
  characterFilters?: number[]
  fixedCardIds?: number[]
  useCurrentDeck?: boolean
  fixedCharacterIds?: number[]
  excludedCardIds?: number[]
  singleCardOverrides?: DeckRecommendSingleCardOverride[]
  skillOrderStrategy?: DeckRecommendSkillOrderStrategy
  skillReferenceStrategy?: DeckRecommendSkillReferenceStrategy
  specificSkillOrderInput?: string
  keepAfterTrainingState?: boolean
  supportMasterMax?: boolean
  supportSkillMax?: boolean
  trainingConfig?: CardTrainingConfig[]
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
let silentUserDataCheckSignature = ""
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
const showResultCard = computed(() =>
  runner.error.value != null || runner.elapsedMs.value != null || resultDecks.value.length > 0,
)
const resultTimingItems = computed<Array<{ key: string; label: string; elapsedMs: number; class: string }>>(() => {
  const items: Array<{ key: string; label: string; elapsedMs: number; class: string }> = []
  if (runner.dataElapsedMs.value != null) {
    items.push({
      key: "data",
      label: t("deckRecommend.result.dataElapsed"),
      elapsedMs: runner.dataElapsedMs.value,
      class: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    })
  }
  if (runner.engineDataElapsedMs.value != null) {
    items.push({
      key: "engine-data",
      label: t("deckRecommend.result.engineDataElapsed"),
      elapsedMs: runner.engineDataElapsedMs.value,
      class: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
    })
  }
  if (runner.recommendElapsedMs.value != null) {
    items.push({
      key: "recommend",
      label: recommendElapsedTimingLabel(runner.resultExecutionMode.value),
      elapsedMs: runner.recommendElapsedMs.value,
      class: "border-lime-200 bg-lime-50 text-lime-800 dark:border-lime-500/30 dark:bg-lime-500/10 dark:text-lime-200",
    })
  }

  return items
})
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
      selectedAccountKey.value = accounts[0].key
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

watch(
  () => [userStore.userId, selectedAccount.value?.key],
  () => {
    void checkSelectedAccountSuiteData()
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

async function checkSelectedAccountSuiteData() {
  const account = selectedAccount.value
  if (!userStore.userId || !account) {
    return
  }

  const signature = `${userStore.userId}:${account.server}:${account.uid}:suite`
  if (signature === silentUserDataCheckSignature) {
    return
  }

  silentUserDataCheckSignature = signature
  await runner.refreshUserData({ account, mode: "event" }).catch(() => undefined)
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

function algorithmLabel(algorithm: DeckRecommendAlgorithm) {
  switch (algorithm) {
    case "dfs_ga":
      return t("deckRecommend.algorithms.dfsGa")
    case "dfs":
      return t("deckRecommend.algorithms.dfs")
    case "ga":
      return t("deckRecommend.algorithms.ga")
    case "rl":
      return t("deckRecommend.algorithms.rl")
  }
}

function recommendElapsedTimingLabel(mode: DeckRecommendExecutionMode | null) {
  if (mode === "parallel") {
    return t("deckRecommend.result.parallelRecommendElapsed")
  }

  return t("deckRecommend.result.sequentialRecommendElapsed")
}

function deckSourceAlgorithms(deck: DeckResultDeckView["deck"]): DeckRecommendAlgorithm[] {
  if ("source_algorithms" in deck && Array.isArray(deck.source_algorithms)) {
    return deck.source_algorithms
  }

  return []
}

function algorithmTagClass(algorithm: DeckRecommendAlgorithm) {
  switch (algorithm) {
    case "dfs_ga":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
    case "dfs":
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
    case "ga":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    case "rl":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
  }
}

function deckPointValue(deck: DeckResultDeckView["deck"]) {
  if ((recommendMode.value === "challenge" || recommendMode.value === "max") && Number(deck.live_score) > 0) {
    return deck.live_score
  }

  if (recommendMode.value === "mysekai" && Number(deck.mysekai_event_point) > 0) {
    return deck.mysekai_event_point
  }

  return deck.score
}

type DeckResultMetricKind = "score" | "power" | "bonus" | "effective" | "liveScore" | "challengeDelta"

type DeckResultMetric = {
  kind: DeckResultMetricKind
  label: string
  value: string
  detail?: string
  class?: string
}

function deckPointLabel() {
  return recommendMode.value === "challenge" || recommendMode.value === "max"
    ? t("deckRecommend.targets.score")
    : t("deckRecommend.targets.pt")
}

function deckLiveBoostPointDetailText(deck: DeckResultDeckView["deck"]) {
  const deckWithBoost = deck as DeckResultDeckView["deck"] & {
    live_boost_multiplier?: number
    live_boost_original_score?: number
    live_boost_original_mysekai_event_point?: number
  }
  const multiplier = Number(deckWithBoost.live_boost_multiplier)
  if (!Number.isFinite(multiplier) || multiplier <= 1) {
    return null
  }

  const originalPoint = recommendMode.value === "mysekai" && Number(deckWithBoost.live_boost_original_mysekai_event_point) > 0
    ? Number(deckWithBoost.live_boost_original_mysekai_event_point)
    : Number(deckWithBoost.live_boost_original_score)
  if (!Number.isFinite(originalPoint)) {
    return null
  }

  return `${formatInteger(originalPoint)} (${formatInteger(multiplier)}x)`
}

function deckBonusParts(deck: DeckResultDeckView["deck"]) {
  const main = Number(deck.event_bonus_rate) || 0
  const support = Number(deck.support_deck_bonus_rate) || 0
  return {
    main,
    support,
    total: main + support,
  }
}

function deckSummaryMetrics(deck: DeckResultDeckView["deck"]): DeckResultMetric[] {
  return orderDeckMetricsByTarget(deckSummaryMetricKinds())
    .map((kind) => deckMetric(kind, deck))
}

function deckBasicInfoMetrics(deck: DeckResultDeckView["deck"]): DeckResultMetric[] {
  return deckBasicInfoMetricKinds(deck).map((kind) => deckMetric(kind, deck))
}

function deckMetricGridClass(count: number) {
  switch (Math.min(Math.max(count, 2), 4)) {
    case 2:
      return "grid-cols-2"
    case 3:
      return "grid-cols-3"
    default:
      return "grid-cols-4"
  }
}

function deckBasicInfoGridClass(deck: DeckResultDeckView["deck"]) {
  switch (Math.min(Math.max(deckBasicInfoMetrics(deck).length, 2), 4)) {
    case 2:
      return "sm:grid-cols-2"
    case 3:
      return "sm:grid-cols-3"
    default:
      return "sm:grid-cols-4"
  }
}

function deckSummaryMetricKinds(): DeckResultMetricKind[] {
  switch (recommendMode.value) {
    case "challenge":
      return ["score", "power"]
    case "mysekai":
      return ["score", "power", "bonus"]
    case "max":
      return ["score", "power", "bonus", "effective"]
    case "bonus":
      return ["bonus", "score", "power", "effective"]
    case "event":
    default:
      return ["score", "power", "bonus", "effective"]
  }
}

function deckBasicInfoMetricKinds(deck: DeckResultDeckView["deck"]): DeckResultMetricKind[] {
  switch (recommendMode.value) {
    case "challenge":
      return shouldShowChallengeScoreDelta(deck) ? ["score", "challengeDelta"] : ["score"]
    case "mysekai":
      return ["score", "bonus"]
    case "max":
      return ["score", "bonus", "effective"]
    case "bonus":
    case "event":
    default:
      return ["score", "bonus", "liveScore", "effective"]
  }
}

function orderDeckMetricsByTarget(kinds: DeckResultMetricKind[]): DeckResultMetricKind[] {
  const primary = recommendTargetMetricKind()
  if (!primary || !kinds.includes(primary)) {
    return kinds
  }

  return [primary, ...kinds.filter((kind) => kind !== primary)]
}

function recommendTargetMetricKind(): DeckResultMetricKind | null {
  switch (activeRecommendTarget.value) {
    case "score":
      return "score"
    case "power":
      return "power"
    case "bonus":
      return "bonus"
    case "skill":
      return "effective"
    default:
      return null
  }
}

function deckMetric(kind: DeckResultMetricKind, deck: DeckResultDeckView["deck"]): DeckResultMetric {
  switch (kind) {
    case "score":
      return {
        kind,
        label: deckPointLabel(),
        value: formatInteger(deckPointValue(deck)),
        detail: deckLiveBoostPointDetailText(deck) ?? undefined,
      }
    case "power":
      return {
        kind,
        label: t("deckRecommend.result.summary.power"),
        value: formatInteger(deck.total_power),
      }
    case "bonus": {
      const bonusParts = deckBonusParts(deck)
      return {
        kind,
        label: t("deckRecommend.result.summary.totalBonus"),
        value: `${formatPercentValue(bonusParts.total)}%`,
        detail: t("deckRecommend.result.summary.bonusBreakdown", {
          main: formatPercentValue(bonusParts.main),
          support: formatPercentValue(bonusParts.support),
        }),
        class: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200",
      }
    }
    case "effective":
      return {
        kind,
        label: t("deckRecommend.result.summary.effective"),
        value: `${formatPercentValue(deck.multi_live_score_up)}%`,
        class: "bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-200",
      }
    case "liveScore":
      return {
        kind,
        label: t("deckRecommend.result.liveScoreLabel"),
        value: formatInteger(deck.live_score),
      }
    case "challengeDelta":
      return {
        kind,
        label: t("deckRecommend.result.challengeScoreDeltaLabel"),
        value: formatSignedNumber(deck.challenge_score_delta),
      }
  }
}

function isWorldBloomResultDeck(deck: DeckResultDeckView["deck"]) {
  return Number(deck.support_deck_bonus_rate) > 0
    || showWorldBloomCharacterSelect.value
    || (isEventSimulationActive.value && isWorldBloomSimulation.value)
}

function worldBloomSupportCardViews(deck: DeckResultDeckView["deck"]): DeckResultSupportCardView[] {
  return buildDeckSupportCardViews(
    resolveDeckSupportCards(deck),
    runner.masterData.value,
    dataRegion.value,
    settingsStore.currentAssetEndpoint,
  )
}

function mainDeckSectionTitle(deck: DeckResultDeckView["deck"]) {
  return isWorldBloomResultDeck(deck)
    ? t("deckRecommend.result.sections.mainCards")
    : t("deckRecommend.result.sections.cards")
}

function bonusTagLabel(value: number) {
  return t("deckRecommend.result.bonusTag", { value: formatPercentValue(value) })
}

function cardDetailTitle(cardView: DeckResultCardView) {
  const cardTitle = cardView.thumbnail.title ?? `#${cardView.card.card_id}`
  const characterName = cardView.masterCard?.characterName
  return characterName ? `${cardTitle} - ${characterName}` : cardTitle
}

function readStateLabel(read: boolean) {
  return t(read ? "deckRecommend.result.readState.read" : "deckRecommend.result.readState.unread")
}

function readStateTagClass(read: boolean) {
  return read
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    : "border-muted bg-muted/45 text-muted-foreground"
}

function deckPowerDetailItems(deck: DeckResultDeckView["deck"]) {
  return [
    { key: "total", label: t("deckRecommend.result.power.total"), value: deck.total_power },
    { key: "base", label: t("deckRecommend.result.power.base"), value: deck.base_power },
    { key: "areaItem", label: t("deckRecommend.result.power.areaItem"), value: deck.area_item_bonus_power },
    { key: "character", label: t("deckRecommend.result.power.character"), value: deck.character_bonus_power },
    { key: "honor", label: t("deckRecommend.result.power.honor"), value: deck.honor_bonus_power },
    { key: "fixture", label: t("deckRecommend.result.power.fixture"), value: deck.fixture_bonus_power },
    { key: "gate", label: t("deckRecommend.result.power.gate"), value: deck.gate_bonus_power },
  ]
}

function shouldShowChallengeScoreDelta(deck: DeckResultDeckView["deck"]) {
  return recommendMode.value === "challenge" && "challenge_score_delta" in deck
}

function formatInteger(value: number | undefined) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function formatSignedNumber(value: number | undefined) {
  const numberValue = Number(value) || 0
  return new Intl.NumberFormat(locale.value, {
    signDisplay: "exceptZero",
    maximumFractionDigits: 0,
  }).format(numberValue)
}

function formatPercentValue(value: number) {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: 2,
  }).format(value)
}

function isSekaiRegionValue(value: string): value is SekaiRegion {
  return SEKAI_REGION_OPTIONS.some((option) => option.value === value)
}

function isDeckRecommendMode(value: string): value is DeckRecommendMode {
  return modeOptions.value.some((option) => option.value === value)
}

function isDeckRecommendTarget(value: string): value is DeckRecommendTarget {
  return value === "score" || value === "power" || value === "skill" || value === "bonus"
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

function isDeckRecommendLiveType(value: string): value is DeckRecommendLiveType {
  return liveTypeOptions.value.some((option) => option.value === value)
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

function isDeckRecommendExecutionMode(value: string): value is DeckRecommendExecutionMode {
  return DECK_RECOMMEND_EXECUTION_MODES.includes(value as DeckRecommendExecutionMode)
}

function isDeckRecommendEventSimulationMode(value: string): value is DeckRecommendEventSimulationMode {
  return eventSimulationModeOptions.value.some((option) => option.value === value)
}

function isDeckRecommendEventAttr(value: string): value is DeckRecommendEventAttr {
  return DECK_RECOMMEND_EVENT_ATTRS.includes(value as DeckRecommendEventAttr)
}

function isDeckRecommendUnit(value: string): value is DeckRecommendUnitType {
  return DECK_RECOMMEND_UNITS.includes(value as DeckRecommendUnitType)
}

function isDeckRecommendSimulatedEventUnit(value: string): value is DeckRecommendSimulatedEventUnitValue {
  return value === DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT || isDeckRecommendUnit(value)
}

function normalizeDeckRecommendUnit(value: string | null | undefined): DeckRecommendUnitType | null {
  return value && isDeckRecommendUnit(value) ? value : null
}

function isDeckRecommendSkillOrderStrategy(value: string): value is DeckRecommendSkillOrderStrategy {
  return skillOrderStrategyOptions.value.some((option) => option.value === value)
}

function isDeckRecommendSkillReferenceStrategy(value: string): value is DeckRecommendSkillReferenceStrategy {
  return skillReferenceStrategyOptions.value.some((option) => option.value === value)
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

type DeckRecommendPreferences = {
  algorithms?: DeckRecommendAlgorithm[]
  algorithmsAuto?: boolean
  executionMode?: DeckRecommendExecutionMode
}

function isLegacyDefaultAlgorithmSelection(algorithms: readonly DeckRecommendAlgorithm[]): boolean {
  return algorithms.length === LEGACY_DEFAULT_ALGORITHMS.length
    && LEGACY_DEFAULT_ALGORITHMS.every((algorithm) => algorithms.includes(algorithm))
}

function resolveInitialAlgorithmSelectionIsManual(
  savedConfig: DeckRecommendSavedConfig,
  preferences: DeckRecommendPreferences,
): boolean {
  if (savedConfig.algorithmSelectionMode) {
    return savedConfig.algorithmSelectionMode === "manual"
  }

  // 旧版保存配置没有选择模式标记：与旧默认组合一致视为未手动定制
  if (savedConfig.selectedAlgorithms) {
    return !isLegacyDefaultAlgorithmSelection(savedConfig.selectedAlgorithms)
  }

  return preferences.algorithms != null
}

function readDeckRecommendPreferences(): DeckRecommendPreferences {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DECK_RECOMMEND_PREFERENCES_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const persistedExecutionMode = typeof parsed.executionMode === "string" && isDeckRecommendExecutionMode(parsed.executionMode)
      ? parsed.executionMode
      : undefined
    const preferencesVersion = typeof parsed.version === "number" ? parsed.version : 1
    const persistedAlgorithms = normalizePersistedAlgorithms(parsed.algorithms)

    if (preferencesVersion < 3) {
      // v3迁移：等于旧默认三算法组合（或缺失）视为未定制，交给按场景默认；
      // 用户自选的组合与执行方式原样保留
      const isCustomized = persistedAlgorithms != null
        && persistedAlgorithms.length > 0
        && !isLegacyDefaultAlgorithmSelection(persistedAlgorithms)
      return {
        algorithms: isCustomized ? persistedAlgorithms : undefined,
        executionMode: isCustomized ? persistedExecutionMode : undefined,
      }
    }

    return {
      algorithms: parsed.algorithmsAuto === true ? undefined : persistedAlgorithms,
      executionMode: persistedExecutionMode,
    }
  } catch {
    return {}
  }
}

function writeDeckRecommendPreferences(preferences: Required<DeckRecommendPreferences>) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(DECK_RECOMMEND_PREFERENCES_STORAGE_KEY, JSON.stringify({
      ...preferences,
      version: DECK_RECOMMEND_PREFERENCES_VERSION,
    }))
  } catch {
  }
}

function readDeckRecommendSavedConfig(): DeckRecommendSavedConfig {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== DECK_RECOMMEND_SAVED_CONFIG_VERSION || !isRecord(parsed.config)) {
      return {}
    }

    return normalizeDeckRecommendSavedConfig(parsed.config)
  } catch {
    return {}
  }
}

function writeDeckRecommendSavedConfig(config: DeckRecommendSavedConfig) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY, JSON.stringify({
    version: DECK_RECOMMEND_SAVED_CONFIG_VERSION,
    config,
  }))
}

function removeDeckRecommendSavedConfig() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY)
  } catch {
  }
}

function normalizeDeckRecommendSavedConfig(value: Record<string, unknown>): DeckRecommendSavedConfig {
  const config: DeckRecommendSavedConfig = {}
  const selectedAccount = optionalString(value.selectedAccountKey)
  if (selectedAccount != null) {
    config.selectedAccountKey = selectedAccount
  }

  const region = optionalString(value.dataRegion)
  if (region && isSekaiRegionValue(region)) {
    config.dataRegion = region
  }

  const mode = optionalString(value.recommendMode)
  if (mode && isDeckRecommendMode(mode)) {
    config.recommendMode = mode
  }

  const target = optionalString(value.recommendTarget)
  if (target && isDeckRecommendTarget(target)) {
    config.recommendTarget = target
  }

  const live = optionalString(value.liveType)
  if (live && isDeckRecommendLiveType(live)) {
    config.liveType = live
  }

  config.selectedAlgorithms = normalizePersistedAlgorithms(value.selectedAlgorithms)
  const algorithmSelectionMode = optionalString(value.algorithmSelectionMode)
  if (algorithmSelectionMode === "auto" || algorithmSelectionMode === "manual") {
    config.algorithmSelectionMode = algorithmSelectionMode
  }
  const execution = optionalString(value.executionMode)
  if (execution && isDeckRecommendExecutionMode(execution)) {
    config.executionMode = execution
  }

  config.selectedEventId = optionalNullableString(value.selectedEventId)
  config.selectedCharacterId = optionalNullableString(value.selectedCharacterId)
  config.selectedMusicId = optionalNullableString(value.selectedMusicId)
  config.selectedDifficulty = optionalNullableString(value.selectedDifficulty)
  config.bonusTargetsInput = optionalString(value.bonusTargetsInput)
  config.customBonusCharacterIds = normalizePositiveIntegerArray(value.customBonusCharacterIds)
  config.customBonusSupportUnits = normalizeSupportUnitRecord(value.customBonusSupportUnits)
  config.filterOtherUnit = optionalBoolean(value.filterOtherUnit)
  config.eventSimulationEnabled = optionalBoolean(value.eventSimulationEnabled)

  const simulationMode = optionalString(value.simulatedEventMode)
  if (simulationMode && isDeckRecommendEventSimulationMode(simulationMode)) {
    config.simulatedEventMode = simulationMode
  }

  const simulationAttr = optionalNullableString(value.simulatedEventAttr)
  if (simulationAttr == null || isDeckRecommendEventAttr(simulationAttr)) {
    config.simulatedEventAttr = simulationAttr
  }

  const simulationUnit = optionalNullableString(value.simulatedEventUnit)
  if (simulationUnit == null || isDeckRecommendSimulatedEventUnit(simulationUnit)) {
    config.simulatedEventUnit = simulationUnit
  }

  config.simulatedWorldBloomTurn = optionalNullableString(value.simulatedWorldBloomTurn)
  config.simulatedWorldBloomCharacterId = optionalNullableString(value.simulatedWorldBloomCharacterId)
  config.multiLiveTeammatePowerInput = optionalString(value.multiLiveTeammatePowerInput)
  config.multiLiveTeammateScoreUpInput = optionalString(value.multiLiveTeammateScoreUpInput)
  config.multiLiveScoreUpLowerBoundInput = optionalString(value.multiLiveScoreUpLowerBoundInput)
  config.boostInput = optionalString(value.boostInput)
  config.areaItemLevelInput = optionalString(value.areaItemLevelInput)
  config.areaItemLevelOverrideInputs = normalizeNumericStringRecord(value.areaItemLevelOverrideInputs)
  config.characterRankInput = optionalString(value.characterRankInput)
  config.characterRankOverrideInputs = normalizeNumericStringRecord(value.characterRankOverrideInputs)
  config.mysekaiGateLevelInput = optionalString(value.mysekaiGateLevelInput)
  config.mysekaiGateLevelOverrideInputs = normalizeNumericStringRecord(value.mysekaiGateLevelOverrideInputs)
  config.mysekaiFixtureBonusRateInput = optionalString(value.mysekaiFixtureBonusRateInput)
  config.mysekaiFixtureBonusRateOverrideInputs = normalizeNumericStringRecord(value.mysekaiFixtureBonusRateOverrideInputs)
  config.resultLimitInput = optionalString(value.resultLimitInput)
  config.engineTimeoutMsInput = optionalString(value.engineTimeoutMsInput)
  config.unitFilters = normalizeStringArray(value.unitFilters, isDeckRecommendUnit)
  config.attrFilters = normalizeStringArray(value.attrFilters, isDeckRecommendEventAttr)
  config.characterFilters = normalizePositiveIntegerArray(value.characterFilters)
  config.fixedCardIds = normalizePositiveIntegerArray(value.fixedCardIds)
  config.useCurrentDeck = optionalBoolean(value.useCurrentDeck)
  config.fixedCharacterIds = normalizePositiveIntegerArray(value.fixedCharacterIds)
  config.excludedCardIds = normalizePositiveIntegerArray(value.excludedCardIds)
  config.singleCardOverrides = normalizeSingleCardOverrides(value.singleCardOverrides)

  const skillOrder = optionalString(value.skillOrderStrategy)
  if (skillOrder && isDeckRecommendSkillOrderStrategy(skillOrder)) {
    config.skillOrderStrategy = skillOrder
  }

  const skillReference = optionalString(value.skillReferenceStrategy)
  if (skillReference && isDeckRecommendSkillReferenceStrategy(skillReference)) {
    config.skillReferenceStrategy = skillReference
  }

  config.specificSkillOrderInput = optionalString(value.specificSkillOrderInput)
  config.keepAfterTrainingState = optionalBoolean(value.keepAfterTrainingState)
  config.supportMasterMax = optionalBoolean(value.supportMasterMax)
  config.supportSkillMax = optionalBoolean(value.supportSkillMax)
  config.trainingConfig = normalizeTrainingConfig(value.trainingConfig)

  return config
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function optionalNullableString(value: unknown): string | null | undefined {
  return value == null ? null : optionalString(value)
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function normalizeStringArray<T extends string>(value: unknown, isValid: (item: string) => item is T): T[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return [...new Set(value.filter((item): item is T => typeof item === "string" && isValid(item)))]
}

function normalizePositiveIntegerArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return [...new Set(value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0))]
}

function normalizeNumericStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const record: Record<string, string> = {}
  for (const [key, rawValue] of Object.entries(value)) {
    const id = Number(key)
    const itemValue = Number(rawValue)
    if (Number.isInteger(id) && id > 0 && Number.isFinite(itemValue)) {
      record[String(id)] = String(rawValue)
    }
  }

  return record
}

function normalizeSupportUnitRecord(value: unknown): Record<string, DeckRecommendSupportUnitType> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const record: Record<string, DeckRecommendSupportUnitType> = {}
  for (const [key, rawValue] of Object.entries(value)) {
    const characterId = Number(key)
    if (
      Number.isInteger(characterId)
      && characterId > 0
      && typeof rawValue === "string"
      && DECK_RECOMMEND_UNITS.includes(rawValue as DeckRecommendUnitType)
      && rawValue !== "piapro"
    ) {
      record[String(characterId)] = rawValue as DeckRecommendSupportUnitType
    }
  }

  return record
}

function normalizeSingleCardOverrides(value: unknown): DeckRecommendSingleCardOverride[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      cardId: Number(item.cardId),
      disabled: item.disabled === true,
      level: normalizeNullableInteger(item.level, 1),
      skillLevel: normalizeNullableInteger(item.skillLevel, 1),
      masterRank: normalizeNullableInteger(item.masterRank, 0),
      episodeState: normalizeSingleCardEpisodeState(item.episodeState),
      canvas: typeof item.canvas === "boolean" ? item.canvas : null,
    }))
    .filter((item) => Number.isInteger(item.cardId) && item.cardId > 0)
}

function normalizeTrainingConfig(value: unknown): CardTrainingConfig[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const defaults = createDefaultCardTrainingConfig()
  const inputMap = new Map(
    value
      .filter(isRecord)
      .map((item) => [item.rarity, item]),
  )

  return defaults.map((defaultItem) => {
    const input = inputMap.get(defaultItem.rarity)
    if (!input) {
      return defaultItem
    }

    return {
      rarity: defaultItem.rarity,
      disabled: input.disabled === true,
      maxLevel: input.maxLevel === true,
      episodesRead: input.episodesRead === true,
      maxMasterRank: input.maxMasterRank === true,
      maxSkillLevel: input.maxSkillLevel === true,
      mySekaiCanvas: input.mySekaiCanvas !== false,
    }
  })
}

function normalizeNullableInteger(value: unknown, min: number): number | null {
  if (value == null) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= min ? parsed : null
}

function normalizeSingleCardEpisodeState(value: unknown): DeckRecommendSingleCardOverride["episodeState"] {
  return value === "none" || value === "first" || value === "both" ? value : null
}

function normalizePersistedAlgorithms(value: unknown): DeckRecommendAlgorithm[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return DECK_RECOMMEND_ALGORITHMS.filter((algorithm) => value.includes(algorithm))
}

</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center justify-center px-0 py-4">
    <div class="mx-auto w-full max-w-6xl space-y-3 sm:space-y-4">
      <div class="flex gap-2 rounded-md border border-amber-200 bg-amber-50/90 px-2 py-2 text-sm text-amber-950 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:gap-3 sm:rounded-lg sm:px-4 sm:py-3">
        <LucideTriangleAlert class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
        <p class="leading-6">
          <strong class="font-bold text-amber-950 dark:text-amber-50">
            {{ t("deckRecommend.notice.testingPrefix") }}
          </strong><span>&#8288;{{ t("deckRecommend.notice.testingSuffix") }}</span>
        </p>
      </div>

      <Card class="gap-3 rounded-lg py-3 xl:gap-6 xl:rounded-xl xl:py-6">
          <CardHeader class="gap-3 px-2 sm:flex-row sm:items-start sm:justify-between sm:px-4 xl:px-6">
            <div class="space-y-1.5">
              <CardTitle class="flex items-center gap-2 text-lg">
                <LucideGamepad2 class="size-5" />
                {{ t("deckRecommend.title") }}
              </CardTitle>
              <CardDescription>{{ t("deckRecommend.description") }}</CardDescription>
            </div>
          </CardHeader>
          <CardContent class="grid gap-3 px-2 pb-2 sm:px-4 sm:pb-4 xl:gap-5 xl:px-6 xl:pb-6">
            <section class="grid gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
              <div class="space-y-1">
                <h2 class="text-base font-semibold">{{ t("deckRecommend.layers.default.title") }}</h2>
                <p class="text-sm text-muted-foreground">{{ t("deckRecommend.layers.default.description") }}</p>
              </div>

              <div class="grid gap-3 sm:gap-4 lg:grid-cols-2">
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

              <div class="grid gap-2">
                <Label>{{ t("deckRecommend.form.mode") }}</Label>
                <Select :model-value="recommendMode" @update:model-value="updateRecommendMode">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in modeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
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
                <div class="grid gap-2 rounded-md border p-2 sm:grid-cols-2 sm:p-3 xl:grid-cols-4">
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
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="space-y-1">
                    <h3 class="text-sm font-medium">{{ t("deckRecommend.options.eventCondition.title") }}</h3>
                    <p class="text-xs leading-5 text-muted-foreground">
                      {{ t("deckRecommend.options.eventCondition.description") }}
                    </p>
                  </div>
                  <label class="flex items-center gap-2 text-sm">
                    <span>{{ t("deckRecommend.options.eventSimulation.title") }}</span>
                    <Switch
                      v-model="eventSimulationEnabled"
                      class="shrink-0"
                      :disabled="runner.running.value || !isEventSimulationAvailable"
                    />
                  </label>
                </div>
                <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div class="grid gap-2 md:col-span-2 xl:col-span-2">
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

                  <div v-if="showWorldBloomCharacterSelect" class="grid gap-2 md:col-span-2 xl:col-span-2">
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
                <div v-else-if="eventSimulationEnabled" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                      class="grid gap-2 rounded-md border bg-background/60 p-2.5 sm:p-3 md:col-span-2 xl:col-span-2"
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
                    <div class="grid gap-2 md:col-span-2 xl:col-span-2">
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
                <div class="grid gap-3 md:grid-cols-2">
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

            <section class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
              <button
                type="button"
                class="flex w-full items-start justify-between gap-3 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                :aria-label="t('deckRecommend.layers.advanced.title')"
                :aria-expanded="advancedConfigOpen"
                @click="advancedConfigOpen = !advancedConfigOpen"
              >
                    <span class="space-y-1">
                      <span class="flex items-center gap-2 text-base font-semibold">
                        <LucideSettings2 class="size-4" />
                        {{ t("deckRecommend.layers.advanced.title") }}
                      </span>
                      <span class="block text-sm font-normal text-muted-foreground">
                        {{ t("deckRecommend.layers.advanced.description") }}
                      </span>
                    </span>
                    <LucideChevronDown
                      :class="[
                        'mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                        advancedConfigOpen ? 'rotate-180' : '',
                      ]"
                    />
              </button>

              <div v-show="advancedConfigOpen" class="grid min-w-0 gap-3 sm:gap-4">
                    <section class="grid min-w-0 gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.training.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.training.description") }}</p>
                      </div>
                      <CardTrainingConfigTable v-model="trainingConfig" />
                    </section>

                    <div class="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
                      <div class="grid min-w-0 gap-3 sm:gap-4">
                        <section class="grid h-full content-start gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.filters.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.filters.description") }}</p>
                          </div>
                          <div class="grid gap-3 sm:gap-4">
                            <div class="grid gap-3 xl:grid-cols-2">
                              <div class="grid gap-2">
                                <div class="flex items-center justify-between gap-2">
                                  <Label>{{ t("deckRecommend.options.filters.unit") }}</Label>
                                  <span class="text-xs text-muted-foreground">{{ filterSelectionLabel(unitFilters.length) }}</span>
                                </div>
                                <div class="grid gap-2 sm:grid-cols-2">
                                  <label
                                    v-for="option in unitFilterOptions"
                                    :key="option.value"
                                    :class="[
                                      'flex min-w-0 items-center gap-2 rounded-md border bg-background/70 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40',
                                      unitFilters.includes(option.value) ? 'border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-100' : '',
                                      runner.running.value ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                                    ]"
                                  >
                                    <Checkbox
                                      :model-value="unitFilters.includes(option.value)"
                                      :disabled="runner.running.value"
                                      @update:model-value="checked => toggleUnitFilter(option.value, checked === true)"
                                    />
                                    <img
                                      :src="resolveUnitIconUrl(option.value)"
                                      alt=""
                                      class="size-5 shrink-0 object-contain"
                                      loading="lazy"
                                    >
                                    <span class="min-w-0 truncate">{{ option.label }}</span>
                                  </label>
                                </div>
                              </div>
                              <div class="grid gap-2">
                                <div class="flex items-center justify-between gap-2">
                                  <Label>{{ t("deckRecommend.options.filters.attr") }}</Label>
                                  <span class="text-xs text-muted-foreground">{{ filterSelectionLabel(attrFilters.length) }}</span>
                                </div>
                                <div class="grid gap-2 sm:grid-cols-2">
                                  <label
                                    v-for="option in eventAttrOptions"
                                    :key="option.value"
                                    :class="[
                                      'flex min-w-0 items-center gap-2 rounded-md border bg-background/70 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40',
                                      attrFilters.includes(option.value) ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-100' : '',
                                      runner.running.value ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                                    ]"
                                  >
                                    <Checkbox
                                      :model-value="attrFilters.includes(option.value)"
                                      :disabled="runner.running.value"
                                      @update:model-value="checked => toggleAttrFilter(option.value, checked === true)"
                                    />
                                    <img
                                      :src="resolveAreaItemAttrIconUrl(option.value)"
                                      alt=""
                                      class="size-5 shrink-0 object-contain"
                                      loading="lazy"
                                    >
                                    <span class="min-w-0 truncate">{{ option.label }}</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                            <div class="grid gap-2">
                              <div class="flex items-center justify-between gap-2">
                                <Label>{{ t("deckRecommend.options.filters.character") }}</Label>
                                <span class="text-xs text-muted-foreground">{{ filterSelectionLabel(characterFilters.length) }}</span>
                              </div>
                              <CharacterMultiPicker
                                v-model="characterFilters"
                                :region="dataRegion"
                                :max-characters="characterFilterMaxCount"
                                :disabled="runner.running.value"
                                :placeholder="t('deckRecommend.options.filters.characterSelectPlaceholder')"
                              />
                              <p
                                :class="[
                                  'text-xs leading-5',
                                  hasCharacterFilterError ? 'text-destructive' : 'text-muted-foreground',
                                ]"
                              >
                                {{ t("deckRecommend.options.filters.characterMinHint", { count: CHARACTER_FILTER_MIN_COUNT }) }}
                              </p>
                            </div>
                          </div>
                          <p v-if="hasCharacterFilterError" class="text-xs text-destructive">
                            {{ t("deckRecommend.options.filters.characterMinInvalid", { count: CHARACTER_FILTER_MIN_COUNT }) }}
                          </p>
                        </section>
                      </div>

                      <div class="grid min-w-0 gap-3 sm:gap-4">
                        <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.dataOverrides.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.dataOverrides.description") }}</p>
                          </div>
                          <div class="grid gap-3 sm:grid-cols-2">
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.filters.areaItemLevel") }}</Label>
                              <Select
                                :model-value="areaItemLevelInput === '' ? 'default' : String(areaItemLevelInput)"
                                :disabled="runner.running.value"
                                @update:model-value="updateAreaItemLevelInput"
                              >
                                <SelectTrigger class="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem v-for="option in areaItemLevelOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.filters.characterRank") }}</Label>
                              <Select
                                :model-value="characterRankInput === '' ? 'default' : String(characterRankInput)"
                                :disabled="runner.running.value || characterRankMax === 0"
                                @update:model-value="updateCharacterRankInput"
                              >
                                <SelectTrigger class="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem v-for="option in characterRankLevelOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.filters.mysekaiGateLevel") }}</Label>
                              <Select
                                :model-value="mysekaiGateLevelInput === '' ? 'default' : String(mysekaiGateLevelInput)"
                                :disabled="runner.running.value || mysekaiGateMaxLevel === 0"
                                @update:model-value="updateMysekaiGateLevelInput"
                              >
                                <SelectTrigger class="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem v-for="option in mysekaiGateLevelOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.filters.mysekaiFixtureBonusRate") }}</Label>
                              <Combobox
                                :model-value="mysekaiFixtureBonusRateInput === '' ? 'default' : String(mysekaiFixtureBonusRateInput)"
                                :options="mysekaiFixtureBonusRateComboboxOptions"
                                :disabled="runner.running.value || mysekaiFixtureBonusCharacterOptions.length === 0"
                                :placeholder="t('deckRecommend.options.filters.mysekaiFixtureBonusRateDefault')"
                                :search-placeholder="t('deckRecommend.options.mysekaiFixtureBonusOverride.searchPlaceholder')"
                                :empty-text="t('deckRecommend.options.mysekaiFixtureBonusOverride.emptySearch')"
                                trigger-class="h-9"
                                content-class="min-w-40 max-w-[calc(100vw-2rem)]"
                                @update:model-value="updateMysekaiFixtureBonusRateInput"
                              />
                            </div>
                          </div>
                          <p v-if="areaItemLevel.invalid || characterRank.invalid || mysekaiGateLevel.invalid || mysekaiFixtureBonusRate.invalid" class="text-xs text-destructive">
                            {{ t("deckRecommend.options.dataOverrides.invalid") }}
                          </p>
                        </section>
                        <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.runParameters.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.runParameters.description") }}</p>
                          </div>
                          <div class="grid gap-2">
                            <Label>{{ t("deckRecommend.options.filters.boost") }}</Label>
                            <Select :model-value="String(boostInput)" :disabled="runner.running.value" @update:model-value="updateBoostInput">
                              <SelectTrigger class="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem v-for="option in boostOptions" :key="option.value" :value="option.value">
                                  {{ option.label }}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p v-if="boost.invalid" class="text-xs text-destructive">
                            {{ t("deckRecommend.options.runParameters.invalid") }}
                          </p>
                        </section>

                        <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.multiLive.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.multiLive.description") }}</p>
                          </div>
                          <div class="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                            <div class="grid gap-2">
                              <Label for="deck-recommend-teammate-power">{{ t("deckRecommend.options.multiLive.teammatePower") }}</Label>
                              <Input
                                id="deck-recommend-teammate-power"
                                v-model="multiLiveTeammatePowerInput"
                                type="text"
                                inputmode="numeric"
                                :placeholder="t('deckRecommend.options.multiLive.followSelfPlaceholder')"
                                :aria-invalid="isMultiLiveOptionsEnabled && multiLiveTeammatePower.invalid || undefined"
                                :disabled="runner.running.value || !isMultiLiveOptionsEnabled"
                              />
                            </div>
                            <div class="grid gap-2">
                              <Label for="deck-recommend-teammate-score-up">{{ t("deckRecommend.options.multiLive.teammateScoreUp") }}</Label>
                              <Input
                                id="deck-recommend-teammate-score-up"
                                v-model="multiLiveTeammateScoreUpInput"
                                type="text"
                                inputmode="numeric"
                                :placeholder="t('deckRecommend.options.multiLive.followSelfPlaceholder')"
                                :aria-invalid="isMultiLiveOptionsEnabled && multiLiveTeammateScoreUp.invalid || undefined"
                                :disabled="runner.running.value || !isMultiLiveOptionsEnabled"
                              />
                            </div>
                            <div class="grid gap-2">
                              <Label for="deck-recommend-score-up-lower-bound">{{ t("deckRecommend.options.multiLive.scoreUpLowerBound") }}</Label>
                              <Input
                                id="deck-recommend-score-up-lower-bound"
                                v-model="multiLiveScoreUpLowerBoundInput"
                                type="text"
                                inputmode="decimal"
                                :placeholder="t('deckRecommend.options.multiLive.scoreUpLowerBoundPlaceholder')"
                                :aria-invalid="isMultiLiveOptionsEnabled && multiLiveScoreUpLowerBound.invalid || undefined"
                                :disabled="runner.running.value || !isMultiLiveOptionsEnabled"
                              />
                            </div>
                          </div>
                          <p v-if="!isMultiLiveOptionsEnabled" class="text-xs text-muted-foreground">
                            {{ t("deckRecommend.options.multiLive.disabled") }}
                          </p>
                          <p
                            v-else-if="multiLiveTeammatePower.invalid || multiLiveTeammateScoreUp.invalid || multiLiveScoreUpLowerBound.invalid"
                            class="text-xs text-destructive"
                          >
                            {{ t("deckRecommend.options.multiLive.invalid") }}
                          </p>
                        </section>
                      </div>
                    </div>

                    <section class="grid min-w-0 gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.options.constraints.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.constraints.description") }}</p>
                      </div>
                      <div class="grid gap-3">
                        <label class="flex items-center justify-between gap-3 rounded-md border bg-background/70 p-2.5 text-sm sm:p-3">
                          <span class="min-w-0 space-y-1">
                            <span class="block font-medium">{{ t("deckRecommend.options.constraints.useCurrentDeck") }}</span>
                            <span class="block text-xs leading-5 text-muted-foreground">
                              {{ t("deckRecommend.options.constraints.useCurrentDeckDescription") }}
                            </span>
                          </span>
                          <Switch
                            v-model="useCurrentDeck"
                            :aria-label="t('deckRecommend.options.constraints.useCurrentDeck')"
                            :disabled="runner.running.value || recommendMode === 'challenge'"
                          />
                        </label>

                        <div v-if="!isCurrentDeckEnabled" class="grid gap-3 xl:grid-cols-2">
                          <div class="grid gap-3 rounded-md border bg-background/50 p-2.5 sm:p-3">
                            <div class="space-y-1">
                              <h4 class="text-sm font-medium">{{ t("deckRecommend.options.constraints.fixedGroup") }}</h4>
                              <p class="text-xs leading-5 text-muted-foreground">
                                {{ t("deckRecommend.options.constraints.fixedGroupDescription") }}
                              </p>
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.constraints.fixedCards") }}</Label>
                              <CardMultiPicker
                                v-model="fixedCardIds"
                                :card-options="cardOptions"
                                :disabled="runner.running.value || isCurrentDeckEnabled"
                                :max-cards="5"
                                unique-character
                                :placeholder="t('deckRecommend.options.constraints.fixedCardSelectPlaceholder')"
                              />
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.constraints.fixedCharacters") }}</Label>
                              <CharacterMultiPicker
                                v-model="fixedCharacterIds"
                                :region="dataRegion"
                                :max-characters="5"
                                :disabled="runner.running.value || recommendMode === 'challenge' || isCurrentDeckEnabled"
                                :placeholder="t('deckRecommend.options.constraints.characterSelectPlaceholder')"
                              />
                            </div>
                          </div>
                          <div class="grid content-start gap-3 rounded-md border bg-background/50 p-2.5 sm:p-3">
                            <div class="space-y-1">
                              <h4 class="text-sm font-medium">{{ t("deckRecommend.options.constraints.excludedGroup") }}</h4>
                              <p class="text-xs leading-5 text-muted-foreground">
                                {{ t("deckRecommend.options.constraints.excludedGroupDescription") }}
                              </p>
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.constraints.excludedCards") }}</Label>
                              <CardMultiPicker
                                v-model="excludedCardIds"
                                :card-options="cardOptions"
                                :disabled="runner.running.value"
                                :placeholder="t('deckRecommend.options.constraints.excludedCardSelectPlaceholder')"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <p v-if="recommendMode === 'challenge'" class="text-xs text-muted-foreground">
                        {{ t("deckRecommend.options.constraints.challengeHint") }}
                      </p>
                      <p v-else-if="isCurrentDeckEnabled" class="text-xs text-muted-foreground">
                        {{ t("deckRecommend.options.constraints.currentDeckHint") }}
                      </p>
                    </section>

              </div>
            </section>

            <section class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3 xl:gap-4 xl:rounded-lg xl:p-4">
              <button
                type="button"
                class="flex w-full items-start justify-between gap-3 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                :aria-label="t('deckRecommend.layers.expert.title')"
                :aria-expanded="expertConfigOpen"
                @click="expertConfigOpen = !expertConfigOpen"
              >
                    <span class="space-y-1">
                      <span class="flex items-center gap-2 text-base font-semibold">
                        <LucideSettings2 class="size-4" />
                        {{ t("deckRecommend.layers.expert.title") }}
                      </span>
                      <span class="block text-sm font-normal text-muted-foreground">
                        {{ t("deckRecommend.layers.expert.description") }}
                      </span>
                    </span>
                    <LucideChevronDown
                      :class="[
                        'mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                        expertConfigOpen ? 'rotate-180' : '',
                      ]"
                    />
              </button>

              <div v-show="expertConfigOpen" class="grid min-w-0 gap-3 sm:gap-4">
                    <section class="grid min-w-0 gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.options.random.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.random.description") }}</p>
                      </div>
                      <div class="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
                        <div class="grid gap-3 rounded-md border bg-background/50 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h4 class="text-sm font-medium">{{ t("deckRecommend.options.random.skillGroup") }}</h4>
                            <p class="text-xs leading-5 text-muted-foreground">
                              {{ t("deckRecommend.options.random.skillGroupDescription") }}
                            </p>
                          </div>
                          <div class="grid gap-3 md:grid-cols-2">
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.random.skillOrder") }}</Label>
                              <Select :model-value="skillOrderStrategy" :disabled="runner.running.value" @update:model-value="updateSkillOrderStrategy">
                                <SelectTrigger class="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem v-for="option in skillOrderStrategyOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.random.skillReference") }}</Label>
                              <Select :model-value="skillReferenceStrategy" :disabled="runner.running.value" @update:model-value="updateSkillReferenceStrategy">
                                <SelectTrigger class="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem v-for="option in skillReferenceStrategyOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div v-if="showSpecificSkillOrderInput" class="grid gap-2 md:col-span-2">
                              <Label for="deck-recommend-specific-skill-order">{{ t("deckRecommend.options.random.specificSkillOrder") }}</Label>
                              <Input
                                id="deck-recommend-specific-skill-order"
                                v-model="specificSkillOrderInput"
                                inputmode="numeric"
                                :placeholder="t('deckRecommend.options.random.specificSkillOrderPlaceholder')"
                                :aria-invalid="hasSpecificSkillOrderError || undefined"
                                :disabled="runner.running.value"
                              />
                              <p v-if="hasSpecificSkillOrderError" class="text-xs text-destructive">
                                {{ t("deckRecommend.options.random.specificSkillOrderInvalid") }}
                              </p>
                              <p v-else class="text-xs text-muted-foreground">
                                {{ t("deckRecommend.options.random.specificSkillOrderHint") }}
                              </p>
                            </div>
                          </div>
                          <label class="flex items-center justify-between gap-3 rounded-md border bg-background/70 p-2.5 text-sm sm:p-3">
                            <span class="min-w-0 space-y-1">
                              <span class="block font-medium">{{ t("deckRecommend.options.random.keepAfterTrainingState") }}</span>
                              <span class="block text-xs leading-5 text-muted-foreground">
                                {{ t("deckRecommend.options.random.keepAfterTrainingStateDescription") }}
                              </span>
                            </span>
                            <Switch v-model="keepAfterTrainingState" :disabled="runner.running.value" />
                          </label>
                        </div>

                        <div class="grid content-start gap-3 rounded-md border bg-background/50 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h4 class="text-sm font-medium">{{ t("deckRecommend.options.random.supportGroup") }}</h4>
                            <p class="text-xs leading-5 text-muted-foreground">
                              {{ t("deckRecommend.options.random.supportGroupDescription") }}
                            </p>
                          </div>
                          <label class="flex items-center justify-between gap-3 rounded-md border bg-background/70 p-2.5 text-sm sm:p-3">
                            <span class="min-w-0 space-y-1">
                              <span class="block font-medium">{{ t("deckRecommend.options.random.supportMasterMax") }}</span>
                              <span class="block text-xs leading-5 text-muted-foreground">
                                {{ t("deckRecommend.options.random.supportMasterMaxDescription") }}
                              </span>
                            </span>
                            <Switch v-model="supportMasterMax" :disabled="runner.running.value" />
                          </label>
                          <label class="flex items-center justify-between gap-3 rounded-md border bg-background/70 p-2.5 text-sm sm:p-3">
                            <span class="min-w-0 space-y-1">
                              <span class="block font-medium">{{ t("deckRecommend.options.random.supportSkillMax") }}</span>
                              <span class="block text-xs leading-5 text-muted-foreground">
                                {{ t("deckRecommend.options.random.supportSkillMaxDescription") }}
                              </span>
                            </span>
                            <Switch v-model="supportSkillMax" :disabled="runner.running.value" />
                          </label>
                        </div>
                      </div>
                    </section>

                    <TemporaryOverridePanel
                      v-model:open="areaItemOverrideOpen"
                      :title="t('deckRecommend.options.areaItemOverride.title')"
                      :description="t('deckRecommend.options.areaItemOverride.description')"
                      :selected-count="areaItemLevelOverrides.length"
                      :selected-count-label="t('deckRecommend.options.areaItemOverride.selectedCount', { count: areaItemLevelOverrides.length })"
                      :priority-hint="t('deckRecommend.options.areaItemOverride.priorityHint')"
                      :clear-label="t('deckRecommend.options.areaItemOverride.clear')"
                      :clear-disabled="runner.running.value"
                      @clear="clearAreaItemLevelOverrides"
                    >
                      <AreaItemOverrideList
                        v-model="areaItemLevelOverrideInputs"
                        :sections="areaItemOverrideSections"
                        :disabled="runner.running.value"
                      />
                    </TemporaryOverridePanel>

                    <TemporaryOverridePanel
                      v-model:open="characterRankOverrideOpen"
                      :title="t('deckRecommend.options.characterRankOverride.title')"
                      :description="t('deckRecommend.options.characterRankOverride.description')"
                      :selected-count="characterRankOverrides.length"
                      :selected-count-label="t('deckRecommend.options.characterRankOverride.selectedCount', { count: characterRankOverrides.length })"
                      :priority-hint="t('deckRecommend.options.characterRankOverride.priorityHint')"
                      :clear-label="t('deckRecommend.options.characterRankOverride.clear')"
                      :clear-disabled="runner.running.value"
                      badge-class="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                      @clear="clearCharacterRankOverrides"
                    >
                      <CharacterRankOverrideList
                        v-model="characterRankOverrideInputs"
                        :characters="characterRankOptions"
                        :disabled="runner.running.value"
                      />
                    </TemporaryOverridePanel>

                    <TemporaryOverridePanel
                      v-model:open="mysekaiGateOverrideOpen"
                      :title="t('deckRecommend.options.mysekaiGateOverride.title')"
                      :description="t('deckRecommend.options.mysekaiGateOverride.description')"
                      :selected-count="mysekaiGateLevelOverrides.length"
                      :selected-count-label="t('deckRecommend.options.mysekaiGateOverride.selectedCount', { count: mysekaiGateLevelOverrides.length })"
                      :priority-hint="t('deckRecommend.options.mysekaiGateOverride.priorityHint')"
                      :clear-label="t('deckRecommend.options.mysekaiGateOverride.clear')"
                      :clear-disabled="runner.running.value"
                      badge-class="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-200"
                      @clear="clearMysekaiGateLevelOverrides"
                    >
                      <MysekaiGateOverrideList
                        v-model="mysekaiGateLevelOverrideInputs"
                        :gates="mysekaiGateOptions"
                        :disabled="runner.running.value"
                      />
                    </TemporaryOverridePanel>

                    <TemporaryOverridePanel
                      v-model:open="mysekaiFixtureBonusOverrideOpen"
                      :title="t('deckRecommend.options.mysekaiFixtureBonusOverride.title')"
                      :description="t('deckRecommend.options.mysekaiFixtureBonusOverride.description')"
                      :selected-count="mysekaiFixtureBonusRateOverrides.length"
                      :selected-count-label="t('deckRecommend.options.mysekaiFixtureBonusOverride.selectedCount', { count: mysekaiFixtureBonusRateOverrides.length })"
                      :priority-hint="t('deckRecommend.options.mysekaiFixtureBonusOverride.priorityHint')"
                      :clear-label="t('deckRecommend.options.mysekaiFixtureBonusOverride.clear')"
                      :clear-disabled="runner.running.value"
                      badge-class="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                      @clear="clearMysekaiFixtureBonusRateOverrides"
                    >
                      <MysekaiFixtureBonusOverrideList
                        v-model="mysekaiFixtureBonusRateOverrideInputs"
                        :characters="mysekaiFixtureBonusCharacterOptions"
                        :options="mysekaiFixtureBonusRateComboboxOptions"
                        :max-rate-label="mysekaiFixtureBonusMaxRateLabel"
                        :disabled="runner.running.value"
                      />
                    </TemporaryOverridePanel>

                    <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.options.engine.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.engine.description") }}</p>
                      </div>
                      <div class="grid gap-3 md:grid-cols-2">
                        <div class="grid gap-2">
                          <Label for="deck-recommend-result-limit">{{ t("deckRecommend.options.engine.resultLimit") }}</Label>
                          <Input
                            id="deck-recommend-result-limit"
                            v-model="resultLimitInput"
                            type="text"
                            inputmode="numeric"
                            :placeholder="t('deckRecommend.options.engine.resultLimitPlaceholder')"
                            :aria-invalid="resultLimit.invalid || undefined"
                            :disabled="runner.running.value"
                          />
                        </div>
                        <div class="grid gap-2">
                          <Label for="deck-recommend-engine-timeout">{{ t("deckRecommend.options.engine.timeoutMs") }}</Label>
                          <Input
                            id="deck-recommend-engine-timeout"
                            v-model="engineTimeoutMsInput"
                            type="text"
                            inputmode="numeric"
                            :placeholder="t('deckRecommend.options.engine.timeoutMsPlaceholder')"
                            :aria-invalid="engineTimeoutMs.invalid || undefined"
                            :disabled="runner.running.value"
                          />
                        </div>
                      </div>
                      <p v-if="resultLimit.invalid || engineTimeoutMs.invalid" class="text-xs text-destructive">
                        {{ t("deckRecommend.options.engine.invalid") }}
                      </p>
                    </section>

                    <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.singleCard.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.singleCard.description") }}</p>
                      </div>
                      <SingleCardOverrideTable
                        v-model="singleCardOverrides"
                        :card-options="cardOptions"
                        :disabled="runner.running.value || !dataReady"
                      />
                    </section>
              </div>
            </section>

            <div class="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p class="text-sm text-muted-foreground">
                {{ runner.running.value && runner.phase.value ? t(`deckRecommend.runner.phases.${runner.phase.value}`) : t("deckRecommend.runner.ready") }}
              </p>
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" :disabled="runner.running.value" @click="saveDeckRecommendConfig">
                  <LucideSave class="size-4" />
                  {{ t("deckRecommend.configActions.save") }}
                </Button>
                <Button type="button" variant="destructive" :disabled="runner.running.value" @click="clearConfigConfirmOpen = true">
                  <LucideTrash2 class="size-4" />
                  {{ t("deckRecommend.configActions.clear") }}
                </Button>
                <Button type="button" :disabled="!canRunRecommend" @click="runRecommend">
                  <LucidePlay class="size-4" />
                  {{ runner.running.value ? t("deckRecommend.runner.running") : t("deckRecommend.runner.run") }}
                </Button>
              </div>
            </div>
          </CardContent>
      </Card>

        <Card v-if="showResultCard" class="gap-3 rounded-lg py-3 xl:gap-6 xl:rounded-xl xl:py-6">
          <CardHeader class="px-2 sm:px-4 xl:px-6">
            <CardTitle class="text-base">{{ t("deckRecommend.result.title") }}</CardTitle>
            <CardDescription>
              <template v-if="runner.elapsedMs.value != null">
                {{ t("deckRecommend.result.totalElapsed", { ms: runner.elapsedMs.value }) }}
              </template>
              <template v-else>
                {{ t("deckRecommend.result.description") }}
              </template>
            </CardDescription>
            <div v-if="runner.elapsedMs.value != null && eventRuleWarnings.length > 0" class="grid gap-1.5 pt-1 sm:gap-2">
              <div
                v-for="warning in eventRuleWarnings"
                :key="warning.key"
                class="flex w-full items-start gap-2 rounded-md border border-amber-300 bg-amber-50/90 px-2 py-2 text-sm font-medium leading-5 text-amber-900 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100 sm:px-3"
              >
                <LucideTriangleAlert class="mt-0.5 size-4 shrink-0" />
                <span>{{ warning.message }}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-2 px-2 pb-2 sm:px-4 sm:pb-4 xl:space-y-3 xl:px-6 xl:pb-6">
            <div v-if="resultTimingItems.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in resultTimingItems"
                :key="item.key"
                :class="[
                  'inline-flex items-baseline gap-1 rounded-md border px-1.5 py-1 font-medium sm:px-2',
                  item.class,
                ]"
              >
                <span>{{ item.label }}</span>
                <span class="rounded bg-background/80 px-1 font-mono text-sm font-bold text-foreground shadow-sm">
                  {{ item.elapsedMs }}
                </span>
                <span>ms</span>
              </span>
            </div>
            <div v-if="runner.algorithmTimings.value.length > 0" class="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span
                v-for="item in runner.algorithmTimings.value"
                :key="item.algorithm"
                :class="[
                  'inline-flex items-baseline gap-1 rounded-md border px-1.5 py-1 font-medium sm:px-2',
                  algorithmTagClass(item.algorithm),
                ]"
              >
                <span>{{ algorithmLabel(item.algorithm) }}</span>
                <span class="rounded bg-background/80 px-1 font-mono text-sm font-bold text-foreground shadow-sm">
                  {{ item.elapsedMs }}
                </span>
                <span>ms</span>
              </span>
            </div>
            <div v-if="runner.error.value" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {{ runner.error.value }}
            </div>
            <div v-else-if="resultDecks.length === 0" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {{ t("deckRecommend.result.empty") }}
            </div>
            <Collapsible
              v-for="deckView in resultDecks"
              :key="deckView.index"
              v-slot="{ open }"
              as-child
            >
              <section class="overflow-hidden rounded-md border bg-background/80 shadow-sm">
                <CollapsibleTrigger as-child>
                  <button
                    type="button"
                    class="relative grid w-full gap-2 p-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-start sm:gap-3 sm:p-3"
                  >
                    <div class="min-w-0 space-y-2">
                      <div class="flex min-w-0 flex-wrap items-center gap-2 pr-7 md:pr-0">
                        <span class="shrink-0 text-sm font-semibold text-foreground">
                          {{ t("deckRecommend.result.deckTitle", { index: deckView.index + 1 }) }}
                        </span>
                        <div v-if="deckSourceAlgorithms(deckView.deck).length > 0" class="flex min-w-0 flex-wrap gap-1.5">
                          <span
                            v-for="algorithm in deckSourceAlgorithms(deckView.deck)"
                            :key="algorithm"
                            :class="[
                              'rounded-md border px-1.5 py-0.5 text-[11px] font-medium',
                              algorithmTagClass(algorithm),
                            ]"
                          >
                            {{ algorithmLabel(algorithm) }}
                          </span>
                        </div>
                      </div>

                      <div v-if="!open" :class="['grid min-w-0 gap-1 sm:gap-2', deckMetricGridClass(deckSummaryMetrics(deckView.deck).length)]">
                        <div
                          v-for="metric in deckSummaryMetrics(deckView.deck)"
                          :key="metric.kind"
                          class="min-w-0 rounded bg-muted/20 px-1.5 py-1 sm:rounded-md sm:px-3 sm:py-2"
                        >
                          <span class="block truncate text-[10px] font-medium uppercase leading-4 text-muted-foreground sm:text-[11px]">{{ metric.label }}</span>
                          <span class="block truncate font-mono text-xs font-semibold text-foreground sm:text-sm">
                            {{ metric.value }}
                          </span>
                          <span v-if="metric.detail" class="hidden truncate text-[11px] text-muted-foreground sm:block">
                            {{ metric.detail }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      v-if="!open"
                      class="grid w-full max-w-[41rem] grid-cols-5 content-center justify-items-center gap-0.5 self-end justify-self-center rounded bg-muted/20 p-0.5 ring-1 ring-border/60 sm:gap-1 sm:rounded-md md:w-[26rem] md:max-w-full md:justify-self-end"
                    >
                      <CardThumbnail
                        v-for="cardView in deckView.cards"
                        :key="cardView.card.card_id"
                        :thumbnail="cardView.thumbnail"
                        size="fluid"
                      />
                    </div>

                    <LucideChevronDown
                      :class="[
                        'absolute right-2 top-2 size-5 text-muted-foreground transition-transform duration-200 sm:right-3 sm:top-3 md:static md:mt-1 md:self-start md:justify-self-end',
                        open ? 'rotate-180' : '',
                      ]"
                    />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div class="space-y-3 border-t bg-muted/5 p-2.5 sm:p-3">
                    <Collapsible v-slot="{ open: basicOpen }" as-child>
                      <section class="overflow-hidden rounded-md bg-background/70 ring-1 ring-border/60">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                          >
                            <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                              <span class="mr-1 min-w-0 text-sm font-semibold">{{ t("deckRecommend.result.sections.basic") }}</span>
                              <template v-if="!basicOpen">
                                <span
                                  v-for="metric in deckBasicInfoMetrics(deckView.deck)"
                                  :key="metric.kind"
                                  :class="[
                                    'rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground',
                                    metric.class,
                                  ]"
                                >
                                  {{ metric.label }}
                                  <span class="font-mono font-semibold text-foreground">{{ metric.value }}</span>
                                </span>
                              </template>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                basicOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div :class="['grid grid-cols-2 gap-1.5 border-t bg-muted/5 p-2 sm:gap-2 sm:p-3', deckBasicInfoGridClass(deckView.deck)]">
                            <div
                              v-for="metric in deckBasicInfoMetrics(deckView.deck)"
                              :key="metric.kind"
                              class="rounded bg-background/80 px-2 py-1.5 ring-1 ring-border/40 sm:rounded-md sm:px-3 sm:py-2"
                            >
                              <span class="block text-xs text-muted-foreground">{{ metric.label }}</span>
                              <span class="block font-mono text-sm font-semibold sm:text-base">
                                {{ metric.value }}
                              </span>
                              <span v-if="metric.detail" class="block text-xs text-muted-foreground">
                                {{ metric.detail }}
                              </span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>

                    <Collapsible v-slot="{ open: powerOpen }" as-child>
                      <section class="overflow-hidden rounded-md bg-background/70 ring-1 ring-border/60">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                          >
                            <span class="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                              <span class="mr-1 min-w-0 text-sm font-semibold">{{ t("deckRecommend.result.sections.power") }}</span>
                              <template v-if="!powerOpen">
                                <span class="rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  {{ t("deckRecommend.result.power.total") }}
                                  <span class="font-mono font-semibold text-foreground">{{ formatInteger(deckView.deck.total_power) }}</span>
                                </span>
                                <span class="rounded-md bg-muted/45 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                                  {{ t("deckRecommend.result.power.base") }}
                                  <span class="font-mono font-semibold text-foreground">{{ formatInteger(deckView.deck.base_power) }}</span>
                                </span>
                              </template>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                powerOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="grid grid-cols-2 gap-1.5 border-t bg-muted/5 p-2 sm:grid-cols-4 sm:gap-2 sm:p-3">
                            <div
                              v-for="item in deckPowerDetailItems(deckView.deck)"
                              :key="item.key"
                              class="rounded bg-background/80 px-2 py-1.5 ring-1 ring-border/40 sm:rounded-md sm:px-3 sm:py-2"
                            >
                              <span class="block text-xs text-muted-foreground">{{ item.label }}</span>
                              <span class="block font-mono text-sm font-semibold text-foreground">
                                {{ formatInteger(item.value) }}
                              </span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>

                    <Collapsible v-slot="{ open: mainCardsOpen }" as-child default-open>
                      <section class="overflow-hidden rounded-md bg-background/70 ring-1 ring-border/60">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-center justify-between gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3"
                          >
                            <span class="flex min-w-0 flex-wrap items-center gap-2">
                              <span class="text-sm font-semibold">{{ mainDeckSectionTitle(deckView.deck) }}</span>
                              <span class="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                                {{ bonusTagLabel(deckBonusParts(deckView.deck).main) }}
                              </span>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                mainCardsOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="grid gap-2 border-t bg-muted/5 p-2 sm:p-3 lg:grid-cols-2">
                            <div
                              v-for="cardView in deckView.cards"
                              :key="cardView.card.card_id"
                              class="flex min-w-0 items-start gap-2 rounded-md bg-background/70 p-2 ring-1 ring-border/60 sm:gap-3"
                            >
                              <CardThumbnail :thumbnail="cardView.thumbnail" />
                              <div class="min-w-0 flex-1 space-y-2">
                                <div class="flex min-w-0 flex-wrap items-start justify-between gap-2">
                                  <span class="min-w-0 text-sm font-semibold leading-5">
                                    {{ cardDetailTitle(cardView) }}
                                  </span>
                                  <span class="shrink-0 rounded-md bg-background/70 px-1.5 py-0.5 font-mono text-xs text-muted-foreground ring-1 ring-border/70">
                                    #{{ cardView.card.card_id }}
                                  </span>
                                </div>
                                <div class="flex flex-wrap gap-1.5 text-xs">
                                  <span class="rounded-md bg-muted/50 px-1.5 py-0.5 font-medium text-foreground">
                                    {{ t("deckRecommend.result.cardTotalPowerShort", { value: formatInteger(cardView.card.total_power) }) }}
                                  </span>
                                  <span class="rounded-md bg-muted/50 px-1.5 py-0.5 text-muted-foreground">
                                    {{ t("deckRecommend.result.cardBasePowerShort", { value: formatInteger(cardView.card.base_power) }) }}
                                  </span>
                                  <span class="rounded-md bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                                    {{ t("deckRecommend.result.cardLevel", { value: cardView.card.level }) }}
                                  </span>
                                  <span class="rounded-md bg-violet-50 px-1.5 py-0.5 font-medium text-violet-700 dark:bg-violet-500/10 dark:text-violet-200">
                                    {{ t("deckRecommend.result.skillLevel", { value: cardView.card.skill_level }) }}
                                  </span>
                                  <span class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                    {{ t("deckRecommend.result.skillScoreUpShort", { value: cardView.card.skill_score_up }) }}
                                  </span>
                                  <span
                                    v-if="cardView.card.skill_life_recovery > 0"
                                    class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200"
                                  >
                                    {{ t("deckRecommend.result.skillLifeRecoveryShort", { value: cardView.card.skill_life_recovery }) }}
                                  </span>
                                  <span class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                    {{ t("deckRecommend.result.cardEventBonusShort", { value: cardView.card.event_bonus_rate }) }}
                                  </span>
                                  <span
                                    :class="[
                                      'rounded-md border px-1.5 py-0.5 font-medium',
                                      readStateTagClass(cardView.card.episode1_read),
                                    ]"
                                  >
                                    {{ t("deckRecommend.result.episodeFirst") }} {{ readStateLabel(cardView.card.episode1_read) }}
                                  </span>
                                  <span
                                    :class="[
                                      'rounded-md border px-1.5 py-0.5 font-medium',
                                      readStateTagClass(cardView.card.episode2_read),
                                    ]"
                                  >
                                    {{ t("deckRecommend.result.episodeSecond") }} {{ readStateLabel(cardView.card.episode2_read) }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>

                    <Collapsible
                      v-if="isWorldBloomResultDeck(deckView.deck) && worldBloomSupportCardViews(deckView.deck).length > 0"
                      v-slot="{ open: supportOpen }"
                      as-child
                    >
                      <section class="overflow-hidden rounded-md border bg-background/70">
                        <CollapsibleTrigger as-child>
                          <button
                            type="button"
                            class="flex w-full items-start justify-between gap-3 p-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-3"
                          >
                            <span class="flex min-w-0 flex-wrap items-center gap-2">
                              <span class="text-sm font-semibold">{{ t("deckRecommend.result.sections.supportCards") }}</span>
                              <span class="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                                {{ bonusTagLabel(deckBonusParts(deckView.deck).support) }}
                              </span>
                            </span>
                            <LucideChevronDown
                              :class="[
                                'mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                                supportOpen ? 'rotate-180' : '',
                              ]"
                            />
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="grid grid-cols-3 gap-1.5 border-t bg-muted/5 p-2 sm:grid-cols-4 sm:gap-2 sm:p-3 xl:grid-cols-5">
                            <div
                              v-for="supportCardView in worldBloomSupportCardViews(deckView.deck)"
                              :key="supportCardView.card.card_id"
                              class="grid gap-1.5 rounded-md bg-background/75 p-1.5 ring-1 ring-border/60 sm:gap-2 sm:p-2"
                            >
                              <div class="flex justify-center">
                                <CardThumbnail
                                  :thumbnail="supportCardView.thumbnail"
                                  :corner-badge="`#${supportCardView.card.card_id}`"
                                />
                              </div>
                              <div class="flex flex-wrap items-center justify-center gap-1.5 text-xs">
                                <span class="rounded-md bg-rose-50 px-1.5 py-0.5 font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                                  {{ formatPercentValue(supportCardView.card.bonus) }}%
                                </span>
                                <span class="font-mono text-muted-foreground">
                                  {{ t("deckRecommend.result.supportSkillLevel", { value: supportCardView.card.skill_level }) }}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </section>
                    </Collapsible>
                  </div>
                </CollapsibleContent>
              </section>
            </Collapsible>
          </CardContent>
      </Card>

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
