<script setup lang="ts">
import { LucideChevronDown, LucideSettings2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
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
  resolveAreaItemAttrIconUrl,
  resolveUnitIconUrl,
} from "../lib/area-item-options"
import CardMultiPicker from "./CardMultiPicker.vue"
import CardTrainingConfigTable from "./CardTrainingConfigTable.vue"
import CharacterMultiPicker from "./CharacterMultiPicker.vue"
import { useDeckRecommendFormContext } from "../composables/deck-recommend-form-context"

const open = defineModel<boolean>("open", { required: true })

const { t } = useI18n()
const {
  running,
  cardOptions,
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
  characterFilterMinCount,
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
  mysekaiFixtureBonusCharacterOptions,
  mysekaiFixtureBonusRateComboboxOptions,
  dataOverridesInvalid,
  boostInput,
  updateBoostInput,
  boostOptions,
  boostInvalid,
  isMultiLiveOptionsEnabled,
  multiLiveTeammatePowerInput,
  multiLiveTeammateScoreUpInput,
  multiLiveScoreUpLowerBoundInput,
  multiLiveTeammatePowerInvalid,
  multiLiveTeammateScoreUpInvalid,
  multiLiveScoreUpLowerBoundInvalid,
  useCurrentDeck,
  isCurrentDeckEnabled,
  fixedCardIds,
  fixedCharacterIds,
  excludedCardIds,
} = useDeckRecommendFormContext()
</script>

<template>
            <section class="grid min-w-0 gap-3 border-t pt-4">
              <button
                type="button"
                class="flex w-full items-start justify-between gap-3 rounded-md text-left outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                :aria-label="t('deckRecommend.layers.advanced.title')"
                :aria-expanded="open"
                @click="open = !open"
              >
                    <span class="space-y-1">
                      <span class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <LucideSettings2 class="size-3.5" />
                        {{ t("deckRecommend.layers.advanced.title") }}
                      </span>
                      <span class="block text-xs font-normal text-muted-foreground">
                        {{ t("deckRecommend.layers.advanced.description") }}
                      </span>
                    </span>
                    <LucideChevronDown
                      :class="[
                        'mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                        open ? 'rotate-180' : '',
                      ]"
                    />
              </button>

              <div v-show="open" class="grid min-w-0 gap-3 sm:gap-4">
                    <section class="grid min-w-0 gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.training.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.training.description") }}</p>
                      </div>
                      <CardTrainingConfigTable v-model="trainingConfig" />
                    </section>

                    <div class="grid gap-3 sm:gap-4 @5xl:grid-cols-2 @5xl:items-start">
                      <div class="@container grid min-w-0 gap-3 sm:gap-4">
                        <section class="grid h-full content-start gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.filters.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.filters.description") }}</p>
                          </div>
                          <div class="grid gap-3 sm:gap-4">
                            <div class="grid gap-3 @3xl:grid-cols-2">
                              <div class="grid gap-2">
                                <div class="flex items-center justify-between gap-2">
                                  <Label>{{ t("deckRecommend.options.filters.unit") }}</Label>
                                  <span class="text-xs text-muted-foreground">{{ filterSelectionLabel(unitFilters.length) }}</span>
                                </div>
                                <div class="grid gap-2 @xs:grid-cols-2">
                                  <label
                                    v-for="option in unitFilterOptions"
                                    :key="option.value"
                                    :class="[
                                      'flex min-w-0 items-center gap-2 rounded-md border bg-background/70 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40',
                                      unitFilters.includes(option.value) ? 'border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-100' : '',
                                      running ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                                    ]"
                                  >
                                    <Checkbox
                                      :model-value="unitFilters.includes(option.value)"
                                      :disabled="running"
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
                                <div class="grid gap-2 @xs:grid-cols-2">
                                  <label
                                    v-for="option in eventAttrOptions"
                                    :key="option.value"
                                    :class="[
                                      'flex min-w-0 items-center gap-2 rounded-md border bg-background/70 px-2 py-1.5 text-sm transition-colors hover:bg-muted/40',
                                      attrFilters.includes(option.value) ? 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900 dark:border-fuchsia-500/40 dark:bg-fuchsia-500/10 dark:text-fuchsia-100' : '',
                                      running ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                                    ]"
                                  >
                                    <Checkbox
                                      :model-value="attrFilters.includes(option.value)"
                                      :disabled="running"
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
                                :disabled="running"
                                :placeholder="t('deckRecommend.options.filters.characterSelectPlaceholder')"
                              />
                              <p
                                :class="[
                                  'text-xs leading-5',
                                  hasCharacterFilterError ? 'text-destructive' : 'text-muted-foreground',
                                ]"
                              >
                                {{ t("deckRecommend.options.filters.characterMinHint", { count: characterFilterMinCount }) }}
                              </p>
                            </div>
                          </div>
                          <p v-if="hasCharacterFilterError" class="text-xs text-destructive">
                            {{ t("deckRecommend.options.filters.characterMinInvalid", { count: characterFilterMinCount }) }}
                          </p>
                        </section>
                      </div>

                      <div class="@container grid min-w-0 gap-3 sm:gap-4">
                        <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.dataOverrides.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.dataOverrides.description") }}</p>
                          </div>
                          <div class="grid gap-3 @sm:grid-cols-2">
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.filters.areaItemLevel") }}</Label>
                              <Select
                                :model-value="areaItemLevelInput === '' ? 'default' : String(areaItemLevelInput)"
                                :disabled="running"
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
                                :disabled="running || characterRankMax === 0"
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
                                :disabled="running || mysekaiGateMaxLevel === 0"
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
                                :disabled="running || mysekaiFixtureBonusCharacterOptions.length === 0"
                                :placeholder="t('deckRecommend.options.filters.mysekaiFixtureBonusRateDefault')"
                                :search-placeholder="t('deckRecommend.options.mysekaiFixtureBonusOverride.searchPlaceholder')"
                                :empty-text="t('deckRecommend.options.mysekaiFixtureBonusOverride.emptySearch')"
                                trigger-class="h-9"
                                content-class="min-w-40 max-w-[calc(100vw-2rem)]"
                                @update:model-value="updateMysekaiFixtureBonusRateInput"
                              />
                            </div>
                          </div>
                          <p v-if="dataOverridesInvalid" class="text-xs text-destructive">
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
                            <Select :model-value="String(boostInput)" :disabled="running" @update:model-value="updateBoostInput">
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
                          <p v-if="boostInvalid" class="text-xs text-destructive">
                            {{ t("deckRecommend.options.runParameters.invalid") }}
                          </p>
                        </section>

                        <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h3 class="text-sm font-medium">{{ t("deckRecommend.options.multiLive.title") }}</h3>
                            <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.multiLive.description") }}</p>
                          </div>
                          <div class="grid gap-3 @lg:grid-cols-3">
                            <div class="grid gap-2">
                              <Label for="deck-recommend-teammate-power">{{ t("deckRecommend.options.multiLive.teammatePower") }}</Label>
                              <Input
                                id="deck-recommend-teammate-power"
                                v-model="multiLiveTeammatePowerInput"
                                type="text"
                                inputmode="numeric"
                                :placeholder="t('deckRecommend.options.multiLive.followSelfPlaceholder')"
                                :aria-invalid="isMultiLiveOptionsEnabled && multiLiveTeammatePowerInvalid || undefined"
                                :disabled="running || !isMultiLiveOptionsEnabled"
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
                                :aria-invalid="isMultiLiveOptionsEnabled && multiLiveTeammateScoreUpInvalid || undefined"
                                :disabled="running || !isMultiLiveOptionsEnabled"
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
                                :aria-invalid="isMultiLiveOptionsEnabled && multiLiveScoreUpLowerBoundInvalid || undefined"
                                :disabled="running || !isMultiLiveOptionsEnabled"
                              />
                            </div>
                          </div>
                          <p v-if="!isMultiLiveOptionsEnabled" class="text-xs text-muted-foreground">
                            {{ t("deckRecommend.options.multiLive.disabled") }}
                          </p>
                          <p
                            v-else-if="multiLiveTeammatePowerInvalid || multiLiveTeammateScoreUpInvalid || multiLiveScoreUpLowerBoundInvalid"
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
                            :disabled="running || recommendMode === 'challenge'"
                          />
                        </label>

                        <div v-if="!isCurrentDeckEnabled" class="grid gap-3 @3xl:grid-cols-2">
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
                                :disabled="running || isCurrentDeckEnabled"
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
                                :disabled="running || recommendMode === 'challenge' || isCurrentDeckEnabled"
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
                                :disabled="running"
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
</template>
