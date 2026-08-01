<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import { LucideExternalLink, LucideLoaderCircle, LucidePlay } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useMusicAliasMatches } from "@/shared/sekai/music-alias"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { MUSIC_DIFFICULTY_COLORS } from "@/modules/music-library/lib/music-difficulties"
import { buildDeckResultViews, type DeckResultDeckView } from "../lib/card-thumbnail"
import {
  buildPlannerMusicDurations,
  buildPlannerSongRanking,
  pickPlannerBrushColor,
  PLANNER_BRUSH_COLORS,
  resolvePlannerBrushPointsPerHour,
  type PlannerBrush,
  type PlannerRankedSong,
} from "../lib/planner-calendar"
import {
  createDefaultPlannerDeckConfig,
  readPlannerDeckConfig,
  type PlannerDeckConfig,
} from "../lib/planner-config"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"
import { useMusicOptions } from "../composables/useMusicOptions"

const props = defineProps<{
  open: boolean
  dataRegion: SekaiRegion
  account: { server: SekaiRegion; uid: string } | null
  eventId: string | null
  characterId: string | null
  forcedLeaderCharacterId: string | null
  algorithms: DeckRecommendAlgorithm[]
  existingBrushes: PlannerBrush[]
  /** Brush being edited; null creates a new one. Loops per hour stay outside. */
  editingBrush: PlannerBrush | null
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  save: [brush: PlannerBrush]
}>()

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const runner = useDeckRecommendRunner()

/** Reference chart for the deck search; the brush song comes from the ranking. */
const FALLBACK_REFERENCE_MUSIC_ID = "226"
const FALLBACK_REFERENCE_DIFFICULTY = "hard"

const regionRef = toRef(props, "dataRegion")
const musicOptions = useMusicOptions(regionRef, ref<string | null>(null))
const musicTitles = computed(() => new Map(musicOptions.options.value.map((option) => [option.id, option.label])))

const useSavedConfig = ref(true)

const deckView = ref<DeckResultDeckView | null>(null)
const rawDeck = ref<RecommendDeck | null>(null)
const rankingRows = ref<PlannerRankedSong[]>([])
const rankingLoading = ref(false)
const errorMessage = ref<string | null>(null)

const selectedSong = ref<PlannerRankedSong | null>(null)
const brushName = ref("")
const brushColor = ref<string>(PLANNER_BRUSH_COLORS[0])

const searchQuery = ref("")
const { matchedIds: aliasMatchedIds, pending: aliasPending } = useMusicAliasMatches(searchQuery)
const difficultyFilter = ref("all")

const RANKING_DIFFICULTIES = ["easy", "normal", "hard", "expert", "master", "append"] as const
const RANKING_DISPLAY_LIMIT = 100

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const canRunDeck = computed(() =>
  !runner.running.value
  && !rankingLoading.value
  && props.account != null
  && props.eventId != null,
)

const runnerPhaseText = computed(() => {
  if (rankingLoading.value) {
    return t("eventPlanner.dialog.rankingLoading")
  }
  if (!runner.running.value) {
    return null
  }

  return runner.phase.value != null
    ? t(`deckRecommend.runner.phases.${runner.phase.value}`)
    : t("eventPlanner.dialog.running")
})

const filteredRanking = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return rankingRows.value
    .filter((row) => difficultyFilter.value === "all" || row.difficulty === difficultyFilter.value)
    .filter((row) => query === ""
      || row.title.toLowerCase().includes(query)
      || String(row.musicId) === query
      || aliasMatchedIds.value.has(row.musicId))
    .slice(0, RANKING_DISPLAY_LIMIT)
})

const canSave = computed(() =>
  brushName.value.trim() !== ""
  && (selectedSong.value != null || props.editingBrush != null),
)

watch(() => props.open, (open) => {
  if (open) {
    errorMessage.value = null
    deckView.value = null
    rawDeck.value = null
    rankingRows.value = []
    selectedSong.value = null
    brushName.value = props.editingBrush?.name ?? ""
    brushColor.value = props.editingBrush?.color ?? pickPlannerBrushColor(props.existingBrushes)
    // Warm the engine and region data as soon as the dialog opens so the
    // first deck build does not pay the whole load inside the run.
    void runner.preloadEngine().catch(() => undefined)
    void runner.preloadRegionData(props.dataRegion, props.account?.server ?? props.dataRegion)
      .catch(() => undefined)
  }
})

watch(selectedSong, (song) => {
  if (song != null && (props.editingBrush == null || brushName.value.trim() === "")) {
    brushName.value = `${song.title} · ${difficultyLabel(song.difficulty)}`
  }
})

function difficultyLabel(value: string): string {
  return t(`musicLibrary.difficulty.${value}`)
}

function difficultyColor(value: string): string {
  return MUSIC_DIFFICULTY_COLORS[value as keyof typeof MUSIC_DIFFICULTY_COLORS] ?? "#64748b"
}

function formatInteger(value: number): string {
  return numberFormatter.value.format(Math.round(value))
}

async function runDeck() {
  if (!canRunDeck.value || props.account == null) {
    return
  }

  errorMessage.value = null
  deckView.value = null
  rawDeck.value = null
  rankingRows.value = []
  selectedSong.value = null
  const config: PlannerDeckConfig = useSavedConfig.value
    ? readPlannerDeckConfig()
    : createDefaultPlannerDeckConfig()
  try {
    await runner.run({
      account: props.account,
      dataRegion: props.dataRegion,
      mode: "event",
      target: "score",
      liveType: "multi",
      algorithms: props.algorithms,
      executionMode: "sequential",
      eventId: props.eventId,
      characterId: props.forcedLeaderCharacterId ? null : props.characterId,
      forcedLeaderCharacterId: props.forcedLeaderCharacterId,
      eventSimulation: {
        enabled: false,
        eventType: "marathon",
        attr: null,
        unit: null,
        worldBloomTurn: null,
        worldBloomCharacterId: null,
        worldBloomCharacterUnit: null,
      },
      targetBonuses: [],
      customBonusAttr: null,
      customBonusCharacterIds: [],
      customBonusCharacterSupportUnits: {},
      filterOtherUnit: false,
      multiLiveTeammatePower: config.multiLiveTeammatePower,
      multiLiveTeammateScoreUp: config.multiLiveTeammateScoreUp,
      multiLiveScoreUpLowerBound: config.multiLiveScoreUpLowerBound,
      // Boost stays unset so scores are base per-play values.
      boost: null,
      areaItemLevel: config.areaItemLevel,
      areaItemLevelOverrides: config.areaItemLevelOverrides,
      characterRank: config.characterRank,
      characterRankOverrides: config.characterRankOverrides,
      mysekaiGateLevel: config.mysekaiGateLevel,
      mysekaiGateLevelOverrides: config.mysekaiGateLevelOverrides,
      mysekaiFixtureBonusRate: config.mysekaiFixtureBonusRate,
      mysekaiFixtureBonusRateOverrides: config.mysekaiFixtureBonusRateOverrides,
      resultLimit: 1,
      timeoutMs: null,
      unitFilters: config.unitFilters,
      attrFilters: config.attrFilters,
      characterFilters: config.characterFilters,
      fixedCards: config.fixedCards,
      useCurrentDeck: false,
      fixedCharacters: config.fixedCharacters,
      excludedCards: config.excludedCards,
      singleCardOverrides: config.singleCardOverrides,
      skillOrderStrategy: config.skillOrderStrategy,
      skillReferenceStrategy: config.skillReferenceStrategy,
      specificSkillOrder: config.specificSkillOrder,
      keepAfterTrainingState: config.keepAfterTrainingState,
      supportMasterMax: config.supportMasterMax,
      supportSkillMax: config.supportSkillMax,
      musicId: config.referenceMusicId ?? FALLBACK_REFERENCE_MUSIC_ID,
      difficulty: config.referenceDifficulty ?? FALLBACK_REFERENCE_DIFFICULTY,
      trainingConfig: config.trainingConfig,
    })

    const deckViews = buildDeckResultViews(
      runner.result.value,
      runner.masterData.value,
      props.dataRegion,
      settingsStore.currentAssetEndpoint,
    )
    const topDeck = deckViews[0] ?? null
    const topRawDeck = runner.result.value?.decks?.[0] ?? null
    if (topDeck == null || topRawDeck == null) {
      errorMessage.value = t("eventPlanner.errors.noResult")
      return
    }

    deckView.value = topDeck
    rawDeck.value = topRawDeck as RecommendDeck
    await loadRanking(topRawDeck as RecommendDeck, config)
  } catch (error) {
    errorMessage.value = runner.error.value ?? (error instanceof Error ? error.message : String(error))
  }
}

async function loadRanking(deck: RecommendDeck, config: PlannerDeckConfig) {
  rankingLoading.value = true
  try {
    const [results, metas] = await Promise.all([
      runner.recommendMusicForDeck({
        dataRegion: props.dataRegion,
        accountServer: props.account?.server,
        deck,
        options: {
          region: props.dataRegion,
          live_type: "multi",
          event_id: props.eventId != null ? Number(props.eventId) : undefined,
          skill_order_choose_strategy: config.skillOrderStrategy === "specific" && config.specificSkillOrder.length === 0
            ? "average"
            : config.skillOrderStrategy,
          ...(config.skillOrderStrategy === "specific" && config.specificSkillOrder.length > 0
            ? { specific_skill_order: config.specificSkillOrder }
            : {}),
          ...(config.multiLiveTeammateScoreUp != null
            ? { multi_live_teammate_score_up: config.multiLiveTeammateScoreUp }
            : {}),
          ...(config.multiLiveTeammatePower != null
            ? { multi_live_teammate_power: config.multiLiveTeammatePower }
            : {}),
        },
      }),
      readSekaiMusicMetas(props.dataRegion),
    ])
    rankingRows.value = buildPlannerSongRanking(
      results,
      musicTitles.value,
      buildPlannerMusicDurations(metas),
    )
    selectedSong.value = rankingRows.value[0] ?? null
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    rankingLoading.value = false
  }
}

function selectSong(row: PlannerRankedSong) {
  selectedSong.value = row
}

function deckBonusTotal(view: DeckResultDeckView): number {
  return (Number(view.deck.event_bonus_rate) || 0) + (Number(view.deck.support_deck_bonus_rate) || 0)
}

function save() {
  const song = selectedSong.value
  const base = props.editingBrush
  if (!canSave.value || (song == null && base == null)) {
    return
  }

  // Loops per hour and boost live outside the dialog: new brushes start from
  // the ranking estimate with no boost, edits keep the planner's settings.
  const playsPerHour = base?.playsPerHour ?? song?.playsPerHour ?? 30
  const boostCount = base?.boostCount ?? 0
  const eventPointPerPlay = song?.eventPoint ?? base?.eventPointPerPlay ?? null
  emit("save", {
    id: base?.id ?? crypto.randomUUID(),
    name: brushName.value.trim(),
    color: brushColor.value,
    pointsPerHour: resolvePlannerBrushPointsPerHour(eventPointPerPlay, playsPerHour, boostCount)
      ?? base?.pointsPerHour ?? 0,
    musicId: song?.musicId ?? base?.musicId ?? null,
    difficulty: song?.difficulty ?? base?.difficulty ?? null,
    eventPointPerPlay,
    playsPerHour,
    boostCount,
    deckCardIds: song != null
      ? deckView.value?.cards.map((entry) => entry.card.card_id) ?? []
      : base?.deckCardIds ?? [],
  })
  emit("update:open", false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="flex max-h-[90vh] flex-col gap-4 overflow-hidden sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ t("eventPlanner.dialog.title") }}</DialogTitle>
        <DialogDescription>{{ t("eventPlanner.dialog.description") }}</DialogDescription>
      </DialogHeader>

      <div class="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
        <!-- Deck building against the selected event -->
        <div class="flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
          <div class="flex flex-wrap items-center gap-3">
            <Button :disabled="!canRunDeck" @click="runDeck">
              <LucideLoaderCircle v-if="runner.running.value || rankingLoading" class="mr-1 size-4 animate-spin" />
              <LucidePlay v-else class="mr-1 size-4" />
              {{ runnerPhaseText ?? t("eventPlanner.dialog.runDeck") }}
            </Button>
            <label class="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                :model-value="useSavedConfig"
                @update:model-value="useSavedConfig = $event === true"
              />
              {{ t("eventPlanner.dialog.useSavedConfig") }}
            </label>
            <a
              href="/deck-recommend"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {{ t("eventPlanner.dialog.openDeckRecommend") }}
              <LucideExternalLink class="size-3" />
            </a>
          </div>
          <p class="text-[11px] text-muted-foreground">{{ t("eventPlanner.dialog.savedConfigHint") }}</p>
        </div>

        <p v-if="errorMessage" class="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
          {{ errorMessage }}
        </p>

        <!-- Deck result -->
        <div v-if="deckView" class="flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span class="font-medium text-foreground">{{ t("eventPlanner.dialog.deckTitle") }}</span>
            <span>{{ t("eventPlanner.dialog.deckPower") }} {{ formatInteger(Number(deckView.deck.total_power) || 0) }}</span>
            <span>{{ t("eventPlanner.dialog.deckBonus", { value: deckBonusTotal(deckView).toFixed(1) }) }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <CardThumbnail
              v-for="entry in deckView.cards"
              :key="entry.card.card_id"
              :thumbnail="entry.thumbnail"
              size="sm"
            />
          </div>
        </div>

        <!-- Song ranking -->
        <div v-if="rankingRows.length > 0 || rankingLoading" class="flex flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="text-sm font-medium">{{ t("eventPlanner.dialog.rankingTitle") }}</span>
            <div class="flex flex-wrap items-center gap-2">
              <Input
                v-model="searchQuery"
                class="h-8 w-44 text-xs"
                :placeholder="t('eventPlanner.dialog.searchPlaceholder')"
              />
              <Select v-model="difficultyFilter">
                <SelectTrigger class="h-8 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{{ t("eventPlanner.dialog.allDifficulties") }}</SelectItem>
                  <SelectItem v-for="value in RANKING_DIFFICULTIES" :key="value" :value="value">
                    {{ difficultyLabel(value) }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p class="text-xs text-muted-foreground">{{ t("eventPlanner.dialog.rankingHint") }}</p>

          <p v-if="rankingLoading" class="py-4 text-center text-xs text-muted-foreground">
            {{ t("eventPlanner.dialog.rankingLoading") }}
          </p>
          <div v-else class="max-h-64 overflow-y-auto rounded-md border">
            <table class="w-full text-xs">
              <thead class="sticky top-0 bg-background">
                <tr class="border-b text-muted-foreground">
                  <th class="px-2 py-1.5 text-left font-medium">{{ t("eventPlanner.dialog.columns.song") }}</th>
                  <th class="px-2 py-1.5 text-left font-medium">{{ t("eventPlanner.dialog.columns.difficulty") }}</th>
                  <th class="px-2 py-1.5 text-right font-medium">{{ t("eventPlanner.dialog.columns.eventPoint") }}</th>
                  <th class="px-2 py-1.5 text-right font-medium">{{ t("eventPlanner.dialog.columns.playsPerHour") }}</th>
                  <th class="px-2 py-1.5 text-right font-medium">{{ t("eventPlanner.dialog.columns.pointsPerHour") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in filteredRanking"
                  :key="`${row.musicId}:${row.difficulty}`"
                  :class="[
                    'cursor-pointer border-b border-border/40 transition-colors last:border-b-0',
                    selectedSong?.musicId === row.musicId && selectedSong?.difficulty === row.difficulty
                      ? 'bg-primary/10'
                      : 'hover:bg-muted/40',
                  ]"
                  @click="selectSong(row)"
                >
                  <td class="max-w-52 truncate px-2 py-1.5">{{ row.title }}</td>
                  <td class="px-2 py-1.5">
                    <span
                      class="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      :style="{ backgroundColor: difficultyColor(row.difficulty) }"
                    >
                      {{ difficultyLabel(row.difficulty) }}
                    </span>
                  </td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ formatInteger(row.eventPoint) }}</td>
                  <td class="px-2 py-1.5 text-right tabular-nums">{{ row.playsPerHour }}</td>
                  <td class="px-2 py-1.5 text-right font-semibold tabular-nums">{{ formatInteger(row.pointsPerHour) }}</td>
                </tr>
                <tr v-if="filteredRanking.length === 0">
                  <td colspan="5" class="px-2 py-4 text-center text-muted-foreground">
                    {{ aliasPending ? t("eventPlanner.dialog.rankingAliasSearching") : t("eventPlanner.dialog.rankingEmpty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p v-else-if="!deckView && !runner.running.value" class="text-xs text-muted-foreground">
          {{ t("eventPlanner.dialog.noDeck") }}
        </p>

        <!-- Brush identity: loops per hour and boost are set on the brush list. -->
        <div v-if="selectedSong || editingBrush" class="flex flex-col gap-2 rounded-md border bg-muted/20 p-3">
          <div class="grid items-start gap-3 sm:grid-cols-[1fr_auto]">
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.dialog.brushName") }}</Label>
              <Input v-model="brushName" class="h-8" />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.dialog.brushColor") }}</Label>
              <div class="flex h-8 items-center gap-1.5">
                <button
                  v-for="color in PLANNER_BRUSH_COLORS"
                  :key="color"
                  type="button"
                  :class="[
                    'size-5 rounded-full transition-transform',
                    brushColor === color ? 'ring-2 ring-foreground/70 ring-offset-1 ring-offset-background' : 'hover:scale-110',
                  ]"
                  :style="{ backgroundColor: color }"
                  :aria-pressed="brushColor === color"
                  @click="brushColor = color"
                />
              </div>
            </div>
          </div>
          <p class="text-[11px] text-muted-foreground">{{ t("eventPlanner.dialog.externalSettingsHint") }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t pt-3">
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t("common.cancel") }}
        </Button>
        <Button :disabled="!canSave" @click="save">
          {{ t("eventPlanner.dialog.save") }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
