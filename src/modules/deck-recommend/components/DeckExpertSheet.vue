<script setup lang="ts">
import { LucideSettings2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import AreaItemOverrideList from "./AreaItemOverrideList.vue"
import CharacterRankOverrideList from "./CharacterRankOverrideList.vue"
import MysekaiFixtureBonusOverrideList from "./MysekaiFixtureBonusOverrideList.vue"
import MysekaiGateOverrideList from "./MysekaiGateOverrideList.vue"
import SingleCardOverrideTable from "./SingleCardOverrideTable.vue"
import TemporaryOverridePanel from "./TemporaryOverridePanel.vue"
import { useDeckRecommendFormContext } from "../composables/deck-recommend-form-context"

const open = defineModel<boolean>("open", { required: true })

const { t } = useI18n()
const {
  running,
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
  resultLimitInvalid,
  engineTimeoutInvalid,
  singleCardOverrides,
} = useDeckRecommendFormContext()
</script>

<template>
            <Sheet v-model:open="open">
              <SheetContent side="right" class="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <SheetHeader class="border-b px-4 py-3 text-left">
                  <SheetTitle class="flex items-center gap-2 text-base">
                    <LucideSettings2 class="size-4" />
                    {{ t("deckRecommend.layers.expert.title") }}
                  </SheetTitle>
                  <SheetDescription class="text-xs">
                    {{ t("deckRecommend.layers.expert.description") }}
                  </SheetDescription>
                </SheetHeader>
                <div class="@container grid min-h-0 min-w-0 flex-1 content-start gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-4">
                    <section class="grid min-w-0 gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.options.random.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.random.description") }}</p>
                      </div>
                      <div class="grid gap-3 @3xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.75fr)]">
                        <div class="grid gap-3 rounded-md border bg-background/50 p-2.5 sm:p-3">
                          <div class="space-y-1">
                            <h4 class="text-sm font-medium">{{ t("deckRecommend.options.random.skillGroup") }}</h4>
                            <p class="text-xs leading-5 text-muted-foreground">
                              {{ t("deckRecommend.options.random.skillGroupDescription") }}
                            </p>
                          </div>
                          <div class="grid gap-3 @md:grid-cols-2">
                            <div class="grid gap-2">
                              <Label>{{ t("deckRecommend.options.random.skillOrder") }}</Label>
                              <Select :model-value="skillOrderStrategy" :disabled="running" @update:model-value="updateSkillOrderStrategy">
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
                              <Select :model-value="skillReferenceStrategy" :disabled="running" @update:model-value="updateSkillReferenceStrategy">
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
                                :disabled="running"
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
                            <Switch v-model="keepAfterTrainingState" :disabled="running" />
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
                            <Switch v-model="supportMasterMax" :disabled="running" />
                          </label>
                          <label class="flex items-center justify-between gap-3 rounded-md border bg-background/70 p-2.5 text-sm sm:p-3">
                            <span class="min-w-0 space-y-1">
                              <span class="block font-medium">{{ t("deckRecommend.options.random.supportSkillMax") }}</span>
                              <span class="block text-xs leading-5 text-muted-foreground">
                                {{ t("deckRecommend.options.random.supportSkillMaxDescription") }}
                              </span>
                            </span>
                            <Switch v-model="supportSkillMax" :disabled="running" />
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
                      :clear-disabled="running"
                      @clear="clearAreaItemLevelOverrides"
                    >
                      <AreaItemOverrideList
                        v-model="areaItemLevelOverrideInputs"
                        :sections="areaItemOverrideSections"
                        :disabled="running"
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
                      :clear-disabled="running"
                      badge-class="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                      @clear="clearCharacterRankOverrides"
                    >
                      <CharacterRankOverrideList
                        v-model="characterRankOverrideInputs"
                        :characters="characterRankOptions"
                        :disabled="running"
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
                      :clear-disabled="running"
                      badge-class="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-200"
                      @clear="clearMysekaiGateLevelOverrides"
                    >
                      <MysekaiGateOverrideList
                        v-model="mysekaiGateLevelOverrideInputs"
                        :gates="mysekaiGateOptions"
                        :disabled="running"
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
                      :clear-disabled="running"
                      badge-class="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                      @clear="clearMysekaiFixtureBonusRateOverrides"
                    >
                      <MysekaiFixtureBonusOverrideList
                        v-model="mysekaiFixtureBonusRateOverrideInputs"
                        :characters="mysekaiFixtureBonusCharacterOptions"
                        :options="mysekaiFixtureBonusRateComboboxOptions"
                        :max-rate-label="mysekaiFixtureBonusMaxRateLabel"
                        :disabled="running"
                      />
                    </TemporaryOverridePanel>

                    <section class="grid gap-3 rounded-md border bg-muted/20 p-2.5 sm:p-3">
                      <div class="space-y-1">
                        <h3 class="text-sm font-medium">{{ t("deckRecommend.options.engine.title") }}</h3>
                        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.engine.description") }}</p>
                      </div>
                      <div class="grid gap-3 @md:grid-cols-2">
                        <div class="grid gap-2">
                          <Label for="deck-recommend-result-limit">{{ t("deckRecommend.options.engine.resultLimit") }}</Label>
                          <Input
                            id="deck-recommend-result-limit"
                            v-model="resultLimitInput"
                            type="text"
                            inputmode="numeric"
                            :placeholder="t('deckRecommend.options.engine.resultLimitPlaceholder')"
                            :aria-invalid="resultLimitInvalid || undefined"
                            :disabled="running"
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
                            :aria-invalid="engineTimeoutInvalid || undefined"
                            :disabled="running"
                          />
                        </div>
                      </div>
                      <p v-if="resultLimitInvalid || engineTimeoutInvalid" class="text-xs text-destructive">
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
                        :disabled="running || !dataReady"
                      />
                    </section>
                </div>
              </SheetContent>
            </Sheet>
</template>
