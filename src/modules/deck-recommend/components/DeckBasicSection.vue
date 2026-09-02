<script setup lang="ts">
import { computed } from "vue"
import { LucideInfo, LucideSettings2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { Button } from "@/components/ui/button"
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import CharacterSelect from "./CharacterSelect.vue"
import EventSelect from "./EventSelect.vue"
import MusicSelect from "./MusicSelect.vue"
import { useDeckRecommendFormContext } from "../composables/deck-recommend-form-context"

const { t, locale } = useI18n()
const {
  running,
  dataReady,
  recommendMode,
  dataRegion,
  selectedAccountKey,
  accountOptions,
  updateAccount,
  updateDataRegion,
  showRecommendTargetSelect,
  activeRecommendTarget,
  activeRecommendTargetLabel,
  updateRecommendTarget,
  recommendTargetOptions,
  showChallengeCharacterSelect,
  selectedCharacterId,
  characterOptionsLoading,
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
  worldBloomCharactersLoading,
  simulatedEventMode,
  updateEventSimulationMode,
  eventSimulationModeOptions,
  isWorldBloomSimulation,
  simulatedEventAttr,
  updateSimulatedEventAttr,
  simulatedEventUnit,
  updateSimulatedEventUnit,
  eventUnitOptions,
  eventAttrOptions,
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
} = useDeckRecommendFormContext()

const selectedAccountOption = computed(() =>
  accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
)

const selectedAlgorithmValues = computed(() =>
  algorithmOptions.value.filter((option) => isAlgorithmSelected(option.value)).map((option) => option.value))

/** Chips report the whole selection; forward the changed entries to the existing toggle. */
function setAlgorithms(value: AcceptableValue | AcceptableValue[] | undefined) {
  const next = new Set(Array.isArray(value) ? value.map(String) : value == null ? [] : [String(value)])
  for (const option of algorithmOptions.value) {
    const selected = next.has(option.value)
    if (selected !== isAlgorithmSelected(option.value)) {
      toggleAlgorithm(option.value, selected)
    }
  }
}
</script>

<template>
  <section class="grid gap-5">
    <div class="grid gap-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t("deckRecommend.groups.accountTarget") }}
      </h2>
      <div class="grid gap-3 @sm:grid-cols-2 @5xl:grid-cols-4">
        <!-- The account option (server, id, badges) needs the full pane width; it shares a row only on wide forms. -->
        <div class="grid content-start gap-2 @sm:col-span-2 @5xl:col-span-1">
          <Label id="deck-account-label" for="deck-account">{{ t("deckRecommend.form.account") }}</Label>
          <Select id="deck-account" :model-value="selectedAccountKey" :disabled="accountOptions.length === 0" @update:model-value="updateAccount">
            <SelectTrigger class="w-full" aria-labelledby="deck-account-label">
              <GameAccountOption
                v-if="selectedAccountOption"
                :server="selectedAccountOption.server"
                :user-id="selectedAccountOption.uid"
                :verified="selectedAccountOption.verified"
                :is-default="selectedAccountOption.isDefault"
                :ownership="selectedAccountOption.ownership"
              />
              <span v-else class="text-sm text-muted-foreground">
                {{ t("deckRecommend.form.accountPlaceholder") }}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
                <GameAccountOption
                  :server="account.server"
                  :user-id="account.uid"
                  :verified="account.verified"
                  :is-default="account.isDefault"
                  :ownership="account.ownership"
                  :owner-name="account.ownerName"
                />
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="accountOptions.length === 0" class="text-xs text-muted-foreground">
            {{ t("deckRecommend.form.noAccount") }}
          </p>
        </div>

        <div class="grid content-start gap-2">
          <Label id="deck-data-region-label" for="deck-data-region">{{ t("deckRecommend.form.dataRegion") }}</Label>
          <Select id="deck-data-region" :model-value="dataRegion" @update:model-value="updateDataRegion">
            <SelectTrigger class="w-full" aria-labelledby="deck-data-region-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                {{ resolveSekaiRegionLabel(option.value, t) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="showRecommendTargetSelect" class="grid content-start gap-2">
          <Label id="deck-target-label" for="deck-target">{{ t("deckRecommend.form.target") }}</Label>
          <Select id="deck-target" :model-value="activeRecommendTarget" @update:model-value="updateRecommendTarget">
            <SelectTrigger class="w-full" aria-labelledby="deck-target-label">
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

        <div v-if="showLiveTypeSelect" class="grid content-start gap-2">
          <Label id="deck-live-type-label" for="deck-live-type">{{ t("deckRecommend.form.liveType") }}</Label>
          <Select
            id="deck-live-type"
            :model-value="liveType"
            :disabled="running || isLiveTypeLocked"
            @update:model-value="updateLiveType"
          >
            <SelectTrigger class="w-full" aria-labelledby="deck-live-type-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in liveTypeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="showChallengeCharacterSelect" class="grid content-start gap-2">
          <p class="text-sm font-medium">{{ t("deckRecommend.form.character") }}</p>
          <CharacterSelect
            v-model="selectedCharacterId"
            :region="dataRegion"
            :disabled="!dataReady || characterOptionsLoading"
          />
        </div>
      </div>
    </div>

    <div class="grid gap-3 border-t pt-4">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {{ t("deckRecommend.groups.musicAlgorithm") }}
      </h2>
      <div class="grid gap-3 @3xl:grid-cols-2">
        <div class="grid content-start gap-2">
          <p class="text-sm font-medium">{{ t("deckRecommend.form.music") }}</p>
          <MusicSelect
            v-model="selectedMusicId"
            v-model:difficulty-value="selectedDifficulty"
            :region="dataRegion"
            :disabled="!dataReady"
          />
        </div>

        <div class="grid content-start gap-3">
          <div class="grid gap-2">
            <div class="flex flex-wrap items-center gap-1.5">
              <p class="text-sm font-medium">{{ t("deckRecommend.form.algorithm") }}</p>
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
                  <TooltipContent class="w-max max-w-[calc(100vw-2rem)] !border-slate-200 !bg-white !text-slate-950 text-left leading-5 shadow-lg dark:!border-slate-700 dark:!bg-slate-950 dark:!text-slate-50 sm:max-w-md">
                    <span class="block whitespace-normal">
                      {{ t("deckRecommend.form.algorithmHint") }}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div class="ml-auto flex items-center gap-1.5">
                <Label id="deck-execution-mode-label" for="deck-execution-mode" class="text-xs text-muted-foreground">
                  {{ t("deckRecommend.form.executionMode") }}
                </Label>
                <Select
                  id="deck-execution-mode"
                  :model-value="executionMode"
                  :disabled="running || activeAlgorithms.length <= 1"
                  @update:model-value="updateExecutionMode"
                >
                  <SelectTrigger size="sm" class="h-7 gap-1 px-2 text-xs" aria-labelledby="deck-execution-mode-label">
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
            <ToggleGroup
              type="multiple"
              variant="chip"
              size="sm"
              :model-value="selectedAlgorithmValues"
              :disabled="isAlgorithmDisabled()"
              :aria-label="t('deckRecommend.form.algorithm')"
              class="min-h-9"
              @update:model-value="setAlgorithms"
            >
              <ToggleGroupItem v-for="option in algorithmOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

        </div>
      </div>
    </div>

    <div v-if="showEventConditionSection" class="grid gap-3 border-t pt-4">
      <div class="flex flex-col gap-2 @lg:flex-row @lg:items-start @lg:justify-between">
        <div class="space-y-1">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ t("deckRecommend.options.eventCondition.title") }}
          </h2>
          <p class="text-xs leading-5 text-muted-foreground">
            {{ t("deckRecommend.options.eventCondition.description") }}
          </p>
        </div>
        <label for="deck-event-simulation" class="flex shrink-0 items-center gap-2 text-sm">
          <span>{{ t("deckRecommend.options.eventSimulation.title") }}</span>
          <Switch
            id="deck-event-simulation"
            v-model="eventSimulationEnabled"
            class="shrink-0"
            :disabled="running || !isEventSimulationAvailable"
          />
        </label>
      </div>
      <div class="grid gap-3 @3xl:grid-cols-2">
        <div class="grid content-start gap-2">
          <p class="text-sm font-medium">{{ t("deckRecommend.form.event") }}</p>
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

        <div v-if="showWorldBloomCharacterSelect" class="grid content-start gap-2 @3xl:grid-rows-[auto_1fr] @3xl:content-stretch">
          <p class="text-sm font-medium">{{ t("deckRecommend.form.character") }}</p>
          <CharacterSelect
            v-model="selectedCharacterId"
            :region="dataRegion"
            :allowed-character-ids="characterSelectAllowedIds"
            :allow-none-option="worldBloomCharacterSelectAllowNone"
            :disabled="!dataReady || worldBloomCharactersLoading"
            trigger-class="@3xl:!h-full @3xl:min-h-9"
          />
        </div>
      </div>
      <p v-if="!isEventSimulationAvailable" class="text-xs text-muted-foreground">
        {{ t("deckRecommend.options.eventSimulation.unavailable") }}
      </p>
      <div v-else-if="eventSimulationEnabled" class="grid gap-3 @lg:grid-cols-2 @3xl:grid-cols-3">
        <div class="grid content-start gap-2">
          <Label id="deck-simulation-type-label" for="deck-simulation-type">
            {{ t("deckRecommend.options.eventSimulation.type") }}
          </Label>
          <Select
            id="deck-simulation-type"
            :model-value="simulatedEventMode"
            :disabled="running"
            @update:model-value="updateEventSimulationMode"
          >
            <SelectTrigger class="w-full" aria-labelledby="deck-simulation-type-label">
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
          <div class="grid content-start gap-2">
            <Label id="deck-simulation-attr-label" for="deck-simulation-attr">
              {{ t("deckRecommend.options.eventSimulation.attr") }}
            </Label>
            <Select
              id="deck-simulation-attr"
              :model-value="simulatedEventAttr"
              :disabled="running"
              @update:model-value="updateSimulatedEventAttr"
            >
              <SelectTrigger class="w-full" aria-labelledby="deck-simulation-attr-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in eventAttrOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid content-start gap-2">
            <Label id="deck-simulation-unit-label" for="deck-simulation-unit">
              {{ t("deckRecommend.options.eventSimulation.unit") }}
            </Label>
            <Select
              id="deck-simulation-unit"
              :model-value="simulatedEventUnit"
              :disabled="running"
              @update:model-value="updateSimulatedEventUnit"
            >
              <SelectTrigger class="w-full" aria-labelledby="deck-simulation-unit-label">
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
            class="col-span-full grid gap-2 rounded-md border bg-background/60 p-2.5 sm:p-3"
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
                :disabled="running || !dataReady"
                @click="customBonusSimulationDialogOpen = true"
              >
                <LucideSettings2 class="mr-2 size-4" aria-hidden="true" />
                {{ t("deckRecommend.options.eventSimulation.customBonusConfigure") }}
              </Button>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="grid content-start gap-2">
            <Label id="deck-world-bloom-turn-label" for="deck-world-bloom-turn">
              {{ t("deckRecommend.options.eventSimulation.worldBloomTurn") }}
            </Label>
            <Select
              id="deck-world-bloom-turn"
              :model-value="simulatedWorldBloomTurn"
              :disabled="running"
              @update:model-value="updateSimulatedWorldBloomTurn"
            >
              <SelectTrigger class="w-full" aria-labelledby="deck-world-bloom-turn-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in worldBloomTurnOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid content-start gap-2">
            <p class="text-sm font-medium">{{ t("deckRecommend.options.eventSimulation.worldBloomCharacter") }}</p>
            <CharacterSelect
              v-model="simulatedWorldBloomCharacterId"
              :region="dataRegion"
              :disabled="running || !dataReady || characterOptionsLoading"
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
    </div>

    <div v-if="showBonusTargetsInput" class="grid gap-3 border-t pt-4">
      <div class="space-y-1">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {{ t("deckRecommend.options.bonus.title") }}
        </h2>
        <p class="text-xs leading-5 text-muted-foreground">{{ t("deckRecommend.options.bonus.description") }}</p>
      </div>
      <div class="grid gap-2 @lg:max-w-96">
        <Label for="deck-recommend-bonus-targets">{{ t("deckRecommend.form.bonusTargets") }}</Label>
        <Input
          id="deck-recommend-bonus-targets"
          v-model="bonusTargetsInput"
          inputmode="numeric"
          :aria-invalid="hasBonusTargetsError || undefined"
          :placeholder="t('deckRecommend.form.bonusTargetsPlaceholder')"
          :disabled="running"
        />
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
    </div>
  </section>
</template>
