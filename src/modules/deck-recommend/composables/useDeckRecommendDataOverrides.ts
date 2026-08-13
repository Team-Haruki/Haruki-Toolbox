import { computed, ref, watch, type Ref } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import type { LazyOverrideComboboxOption } from "../components/LazyOverrideCombobox.vue"
import {
  buildDeckRecommendAreaItemOptions,
  type DeckRecommendAreaItemKind,
  type DeckRecommendAreaItemOption,
} from "../lib/area-item-options"
import {
  buildCharacterRankOptions,
  buildMysekaiGateOptions,
  type CharacterOption,
} from "../lib/master-options"
import {
  buildFixtureBonusRateValues,
  isValidFixtureBonusRate,
  MYSEKAI_FIXTURE_BONUS_RATE_MAX,
  parseFixtureBonusRateInput,
  parseOptionalNumberInput,
  type NumericInputValue,
} from "../lib/recommend-form-utils"
import type { DeckRecommendSavedConfig } from "../lib/saved-config"
import {
  resolveMaxAreaItemLevel,
  type DeckRecommendCharacterRankOverride,
  type DeckRecommendMysekaiFixtureBonusRateOverride,
  type DeckRecommendMysekaiGateLevelOverride,
} from "../lib/user-data-preparation"

export type AreaItemOverrideAreaGroup = {
  key: string
  label: string
  items: DeckRecommendAreaItemOption[]
}
export type AreaItemOverrideSection = {
  kind: DeckRecommendAreaItemKind
  label: string
  areas: AreaItemOverrideAreaGroup[]
}

/**
 * Owns the temporary data-override slice of the DeckRecommend form: area item
 * levels, character ranks, mysekai gate levels and mysekai fixture bonus
 * rates, together with their option lists, validation and clamping watchers.
 */
export function useDeckRecommendDataOverrides(input: {
  initialSavedConfig: DeckRecommendSavedConfig
  cardOptionMasterData: Ref<Record<string, unknown> | null>
  runnerMasterData: Ref<Record<string, unknown> | null>
  characterOptions: Ref<CharacterOption[]>
}) {
  const { t, locale } = useI18n()
  const { initialSavedConfig, cardOptionMasterData, runnerMasterData } = input

  const areaItemLevelInput = ref<NumericInputValue>(initialSavedConfig.areaItemLevelInput ?? "")
  const areaItemLevelOverrideInputs = ref<Record<string, string>>(initialSavedConfig.areaItemLevelOverrideInputs ?? {})
  const characterRankInput = ref<NumericInputValue>(initialSavedConfig.characterRankInput ?? "")
  const characterRankOverrideInputs = ref<Record<string, string>>(initialSavedConfig.characterRankOverrideInputs ?? {})
  const mysekaiGateLevelInput = ref<NumericInputValue>(initialSavedConfig.mysekaiGateLevelInput ?? "")
  const mysekaiGateLevelOverrideInputs = ref<Record<string, string>>(initialSavedConfig.mysekaiGateLevelOverrideInputs ?? {})
  const mysekaiFixtureBonusRateInput = ref<NumericInputValue>(initialSavedConfig.mysekaiFixtureBonusRateInput ?? "")
  const mysekaiFixtureBonusRateOverrideInputs = ref<Record<string, string>>(initialSavedConfig.mysekaiFixtureBonusRateOverrideInputs ?? {})

  const areaItemOptions = computed(() =>
    buildDeckRecommendAreaItemOptions(cardOptionMasterData.value ?? runnerMasterData.value),
  )
  const areaItemOptionMap = computed(() =>
    new Map(areaItemOptions.value.map((option) => [option.id, option])),
  )
  const characterRankOptions = computed(() =>
    buildCharacterRankOptions(cardOptionMasterData.value ?? runnerMasterData.value),
  )
  const characterRankOptionMap = computed(() =>
    new Map(characterRankOptions.value.map((option) => [option.id, option])),
  )
  const mysekaiFixtureBonusCharacterOptions = computed(() =>
    input.characterOptions.value,
  )
  const mysekaiFixtureBonusCharacterIdSet = computed(() =>
    new Set(mysekaiFixtureBonusCharacterOptions.value.map((option) => option.id)),
  )
  const mysekaiGateOptions = computed(() =>
    buildMysekaiGateOptions(cardOptionMasterData.value ?? runnerMasterData.value),
  )
  const mysekaiGateOptionMap = computed(() =>
    new Map(mysekaiGateOptions.value.map((option) => [option.id, option])),
  )
  const areaItemMaxLevel = computed(() =>
    resolveMaxAreaItemLevel((runnerMasterData.value ?? cardOptionMasterData.value)?.areaItemLevels) ?? 20,
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
  const dataOverridesInvalid = computed(() =>
    areaItemLevel.value.invalid
    || characterRank.value.invalid
    || mysekaiGateLevel.value.invalid
    || mysekaiFixtureBonusRate.value.invalid)

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

  function formatPercentValue(value: number) {
    return new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: 2,
    }).format(value)
  }

  function formatFixtureBonusRate(value: number): string {
    return t("deckRecommend.options.filters.mysekaiFixtureBonusRateOption", {
      value: formatPercentValue(value / 10),
    })
  }

  return {
    areaItemLevelInput,
    areaItemLevelOverrideInputs,
    characterRankInput,
    characterRankOverrideInputs,
    mysekaiGateLevelInput,
    mysekaiGateLevelOverrideInputs,
    mysekaiFixtureBonusRateInput,
    mysekaiFixtureBonusRateOverrideInputs,
    areaItemOptions,
    characterRankOptions,
    mysekaiFixtureBonusCharacterOptions,
    mysekaiGateOptions,
    areaItemMaxLevel,
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
  }
}

export type DeckRecommendDataOverrides = ReturnType<typeof useDeckRecommendDataOverrides>
