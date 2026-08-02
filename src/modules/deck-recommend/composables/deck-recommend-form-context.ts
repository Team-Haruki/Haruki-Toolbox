import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from "vue"
import type { AcceptableValue } from "reka-ui"
import type { SekaiRegion } from "@/types"
import type { LazyOverrideComboboxOption } from "../components/LazyOverrideCombobox.vue"
import type { DeckRecommendAreaItemKind, DeckRecommendAreaItemOption } from "../lib/area-item-options"
import type { DeckRecommendMasterCardOption } from "../lib/card-options"
import type { CharacterOption, CharacterRankOption, MysekaiGateOption } from "../lib/master-options"
import type {
  DeckRecommendAlgorithm,
  DeckRecommendEventAttr,
  DeckRecommendLiveType,
  DeckRecommendMode,
  DeckRecommendSkillOrderStrategy,
  DeckRecommendSkillReferenceStrategy,
  DeckRecommendTarget,
  DeckRecommendUnitType,
} from "../lib/recommend-options"
import type {
  DeckRecommendEventSimulationMode,
  DeckRecommendSimulatedEventUnitValue,
} from "../lib/saved-config"
import type { CardTrainingConfig } from "../lib/training-config"
import type { DeckRecommendSingleCardOverride } from "../lib/user-data-preparation"

type SelectOption<T extends string = string> = { value: T; label: string }
type NumericInput = Ref<string | number>

export type AreaItemOverrideSectionView = {
  kind: DeckRecommendAreaItemKind
  label: string
  areas: Array<{ key: string; label: string; items: DeckRecommendAreaItemOption[] }>
}

/**
 * Reactive slice of the DeckRecommend form shared with section components via
 * provide/inject. The state itself stays owned by the view; sections only
 * read refs and call the update functions.
 */
export type DeckRecommendFormContext = {
  running: ComputedRef<boolean>
  dataReady: ComputedRef<boolean>
  cardOptions: ComputedRef<DeckRecommendMasterCardOption[]>

  // Skill strategy and support assumptions (expert sheet)
  skillOrderStrategy: Ref<DeckRecommendSkillOrderStrategy>
  skillOrderStrategyOptions: ComputedRef<Array<{ value: DeckRecommendSkillOrderStrategy; label: string }>>
  updateSkillOrderStrategy: (value: AcceptableValue) => void
  skillReferenceStrategy: Ref<DeckRecommendSkillReferenceStrategy>
  skillReferenceStrategyOptions: ComputedRef<Array<{ value: DeckRecommendSkillReferenceStrategy; label: string }>>
  updateSkillReferenceStrategy: (value: AcceptableValue) => void
  showSpecificSkillOrderInput: ComputedRef<boolean>
  specificSkillOrderInput: Ref<string>
  hasSpecificSkillOrderError: ComputedRef<boolean>
  keepAfterTrainingState: Ref<boolean>
  supportMasterMax: Ref<boolean>
  supportSkillMax: Ref<boolean>

  // Temporary data overrides (expert sheet)
  areaItemOverrideOpen: Ref<boolean>
  areaItemOverrideSections: ComputedRef<AreaItemOverrideSectionView[]>
  areaItemLevelOverrideInputs: Ref<Record<string, string>>
  areaItemLevelOverrides: ComputedRef<readonly unknown[]>
  clearAreaItemLevelOverrides: () => void
  characterRankOverrideOpen: Ref<boolean>
  characterRankOptions: ComputedRef<CharacterRankOption[]>
  characterRankOverrideInputs: Ref<Record<string, string>>
  characterRankOverrides: ComputedRef<readonly unknown[]>
  clearCharacterRankOverrides: () => void
  mysekaiGateOverrideOpen: Ref<boolean>
  mysekaiGateOptions: ComputedRef<MysekaiGateOption[]>
  mysekaiGateLevelOverrideInputs: Ref<Record<string, string>>
  mysekaiGateLevelOverrides: ComputedRef<readonly unknown[]>
  clearMysekaiGateLevelOverrides: () => void
  mysekaiFixtureBonusOverrideOpen: Ref<boolean>
  mysekaiFixtureBonusCharacterOptions: ComputedRef<CharacterOption[]>
  mysekaiFixtureBonusRateComboboxOptions: ComputedRef<LazyOverrideComboboxOption[]>
  mysekaiFixtureBonusMaxRateLabel: ComputedRef<string>
  mysekaiFixtureBonusRateOverrideInputs: Ref<Record<string, string>>
  mysekaiFixtureBonusRateOverrides: ComputedRef<readonly unknown[]>
  clearMysekaiFixtureBonusRateOverrides: () => void

  // Engine parameters and single card overrides (expert sheet)
  resultLimitInput: Ref<string | number>
  engineTimeoutMsInput: Ref<string | number>
  resultLimitInvalid: ComputedRef<boolean>
  engineTimeoutInvalid: ComputedRef<boolean>
  singleCardOverrides: Ref<DeckRecommendSingleCardOverride[]>

  // Advanced section
  recommendMode: Ref<DeckRecommendMode>
  dataRegion: Ref<SekaiRegion>
  trainingConfig: Ref<CardTrainingConfig[]>
  unitFilters: Ref<DeckRecommendUnitType[]>
  unitFilterOptions: ComputedRef<Array<SelectOption<DeckRecommendUnitType>>>
  toggleUnitFilter: (value: DeckRecommendUnitType, checked: boolean) => void
  attrFilters: Ref<DeckRecommendEventAttr[]>
  eventAttrOptions: ComputedRef<Array<SelectOption<DeckRecommendEventAttr>>>
  toggleAttrFilter: (value: DeckRecommendEventAttr, checked: boolean) => void
  filterSelectionLabel: (count: number) => string
  characterFilters: Ref<number[]>
  characterFilterMaxCount: ComputedRef<number>
  characterFilterMinCount: number
  hasCharacterFilterError: ComputedRef<boolean>
  areaItemLevelInput: NumericInput
  updateAreaItemLevelInput: (value: AcceptableValue) => void
  areaItemLevelOptions: ComputedRef<SelectOption[]>
  characterRankInput: NumericInput
  updateCharacterRankInput: (value: AcceptableValue) => void
  characterRankLevelOptions: ComputedRef<SelectOption[]>
  characterRankMax: ComputedRef<number>
  mysekaiGateLevelInput: NumericInput
  updateMysekaiGateLevelInput: (value: AcceptableValue) => void
  mysekaiGateLevelOptions: ComputedRef<SelectOption[]>
  mysekaiGateMaxLevel: ComputedRef<number>
  mysekaiFixtureBonusRateInput: NumericInput
  updateMysekaiFixtureBonusRateInput: (value: string | null) => void
  dataOverridesInvalid: ComputedRef<boolean>
  boostInput: NumericInput
  updateBoostInput: (value: AcceptableValue) => void
  boostOptions: ComputedRef<SelectOption[]>
  boostInvalid: ComputedRef<boolean>
  isMultiLiveOptionsEnabled: ComputedRef<boolean>
  multiLiveTeammatePowerInput: NumericInput
  multiLiveTeammateScoreUpInput: NumericInput
  multiLiveScoreUpLowerBoundInput: NumericInput
  multiLiveTeammatePowerInvalid: ComputedRef<boolean>
  multiLiveTeammateScoreUpInvalid: ComputedRef<boolean>
  multiLiveScoreUpLowerBoundInvalid: ComputedRef<boolean>
  useCurrentDeck: Ref<boolean>
  isCurrentDeckEnabled: ComputedRef<boolean>
  fixedCardIds: Ref<number[]>
  fixedCharacterIds: Ref<number[]>
  excludedCardIds: Ref<number[]>

  // Basic section
  selectedAccountKey: Ref<string>
  accountOptions: ComputedRef<Array<{ key: string; label: string }>>
  selectedAccountLabel: ComputedRef<string>
  updateAccount: (value: AcceptableValue) => void
  updateDataRegion: (value: AcceptableValue) => void
  showRecommendTargetSelect: ComputedRef<boolean>
  activeRecommendTarget: ComputedRef<DeckRecommendTarget>
  activeRecommendTargetLabel: ComputedRef<string>
  updateRecommendTarget: (value: AcceptableValue) => void
  recommendTargetOptions: ComputedRef<Array<SelectOption<DeckRecommendTarget>>>
  showChallengeCharacterSelect: ComputedRef<boolean>
  selectedCharacterId: Ref<string | null>
  characterOptionsLoading: ComputedRef<boolean>
  showLiveTypeSelect: ComputedRef<boolean>
  liveType: Ref<DeckRecommendLiveType>
  isLiveTypeLocked: ComputedRef<boolean>
  updateLiveType: (value: AcceptableValue) => void
  liveTypeOptions: ComputedRef<Array<SelectOption<DeckRecommendLiveType>>>
  algorithmOptions: ComputedRef<Array<SelectOption<DeckRecommendAlgorithm>>>
  isAlgorithmSelected: (value: DeckRecommendAlgorithm) => boolean
  isAlgorithmDisabled: () => boolean
  toggleAlgorithm: (value: DeckRecommendAlgorithm, checked: boolean) => void
  activeAlgorithms: ComputedRef<DeckRecommendAlgorithm[]>
  executionMode: Ref<string>
  updateExecutionMode: (value: AcceptableValue) => void
  executionModeOptions: ComputedRef<SelectOption[]>
  selectedMusicId: Ref<string | null>
  selectedDifficulty: Ref<string | null>
  showEventConditionSection: ComputedRef<boolean>
  eventSimulationEnabled: Ref<boolean>
  isEventSimulationAvailable: ComputedRef<boolean>
  isEventSimulationActive: ComputedRef<boolean>
  selectedEventId: Ref<string | null>
  selectedEventType: Ref<string | null>
  showWorldBloomCharacterSelect: ComputedRef<boolean>
  characterSelectAllowedIds: ComputedRef<readonly number[] | null>
  worldBloomCharacterSelectAllowNone: ComputedRef<boolean>
  worldBloomCharactersLoading: ComputedRef<boolean>
  simulatedEventMode: Ref<DeckRecommendEventSimulationMode>
  updateEventSimulationMode: (value: AcceptableValue) => void
  eventSimulationModeOptions: ComputedRef<Array<SelectOption<DeckRecommendEventSimulationMode>>>
  isWorldBloomSimulation: ComputedRef<boolean>
  simulatedEventAttr: Ref<DeckRecommendEventAttr | null>
  updateSimulatedEventAttr: (value: AcceptableValue) => void
  simulatedEventUnit: Ref<DeckRecommendSimulatedEventUnitValue | null>
  updateSimulatedEventUnit: (value: AcceptableValue) => void
  eventUnitOptions: ComputedRef<Array<SelectOption<DeckRecommendSimulatedEventUnitValue>>>
  isCustomBonusSimulation: ComputedRef<boolean>
  customBonusCharacterIds: Ref<number[]>
  customBonusSimulationDialogOpen: Ref<boolean>
  simulatedWorldBloomTurn: Ref<string | null>
  updateSimulatedWorldBloomTurn: (value: AcceptableValue) => void
  worldBloomTurnOptions: ComputedRef<SelectOption[]>
  simulatedWorldBloomCharacterId: Ref<string | null>
  hasEventSimulationError: ComputedRef<boolean>
  eventSimulationErrorMessage: ComputedRef<string>
  showBonusTargetsInput: ComputedRef<boolean>
  bonusTargetsInput: Ref<string>
  hasBonusTargetsError: ComputedRef<boolean>
}

const deckRecommendFormContextKey: InjectionKey<DeckRecommendFormContext> = Symbol("deck-recommend-form-context")

export function provideDeckRecommendFormContext(context: DeckRecommendFormContext): DeckRecommendFormContext {
  provide(deckRecommendFormContextKey, context)
  return context
}

export function useDeckRecommendFormContext(): DeckRecommendFormContext {
  const context = inject(deckRecommendFormContextKey, null)
  if (context == null) {
    throw new Error("DeckRecommend form context is not provided")
  }

  return context
}
