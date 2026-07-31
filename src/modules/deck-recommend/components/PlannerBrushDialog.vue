<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import { LucidePlay } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
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
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import CardThumbnail from "@/shared/components/SekaiCardThumbnail.vue"
import { MUSIC_DIFFICULTY_COLORS } from "@/modules/music-library/lib/music-difficulties"
import MusicSelect from "./MusicSelect.vue"
import { buildDeckResultViews, type DeckResultDeckView } from "../lib/card-thumbnail"
import {
  buildPlannerMusicDurations,
  buildPlannerSongRanking,
  pickPlannerBrushColor,
  type PlannerBrush,
  type PlannerRankedSong,
} from "../lib/planner-calendar"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import type { DeckRecommendLiveBoostFields } from "../lib/recommend-results"
import { createDefaultCardTrainingConfig } from "../lib/training-config"
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
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  save: [brush: PlannerBrush]
}>()

const { t, locale } = useI18n()
const settingsStore = useSettingsStore()
const runner = useDeckRecommendRunner()

const DEFAULT_MUSIC_ID = "226"
const DEFAULT_DIFFICULTY = "hard"

const musicId = ref<string | null>(DEFAULT_MUSIC_ID)
const difficulty = ref<string | null>(DEFAULT_DIFFICULTY)

const regionRef = toRef(props, "dataRegion")
const musicOptions = useMusicOptions(regionRef, ref<string | null>(null))
const musicTitles = computed(() => new Map(musicOptions.options.value.map((option) => [option.id, option.label])))

const deckView = ref<DeckResultDeckView | null>(null)
const rawDeck = ref<RecommendDeck | null>(null)
const rankingRows = ref<PlannerRankedSong[]>([])
const rankingLoading = ref(false)
const errorMessage = ref<string | null>(null)

const selectedSong = ref<PlannerRankedSong | null>(null)
const playsPerHour = ref<number>(30)
const brushName = ref("")

const searchQuery = ref("")
const difficultyFilter = ref("all")

const RANKING_DIFFICULTIES = ["easy", "normal", "hard", "expert", "master", "append"] as const
const RANKING_DISPLAY_LIMIT = 100

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

const canRunDeck = computed(() =>
  !runner.running.value
  && props.account != null
  && props.eventId != null
  && musicId.value != null
  && difficulty.value != null,
)

const filteredRanking = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return rankingRows.value
    .filter((row) => difficultyFilter.value === "all" || row.difficulty === difficultyFilter.value)
    .filter((row) => query === ""
      || row.title.toLowerCase().includes(query)
      || String(row.musicId) === query)
    .slice(0, RANKING_DISPLAY_LIMIT)
})

const pointsPerHour = computed(() => {
  if (selectedSong.value == null) {
    return null
  }

  const plays = Number.isFinite(playsPerHour.value) && playsPerHour.value > 0 ? playsPerHour.value : 0
  return Math.round(selectedSong.value.eventPoint * plays)
})

const canSave = computed(() =>
  selectedSong.value != null
  && pointsPerHour.value != null
  && pointsPerHour.value > 0
  && brushName.value.trim() !== "",
)

watch(() => props.open, (open) => {
  if (open) {
    errorMessage.value = null
  }
})

watch(selectedSong, (song) => {
  if (song != null) {
    playsPerHour.value = song.playsPerHour
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
      multiLiveTeammatePower: null,
      multiLiveTeammateScoreUp: null,
      multiLiveScoreUpLowerBound: null,
      // Boost stays unset so scores are base per-play values.
      boost: null,
      areaItemLevel: null,
      areaItemLevelOverrides: [],
      characterRank: null,
      characterRankOverrides: [],
      mysekaiGateLevel: null,
      mysekaiGateLevelOverrides: [],
      mysekaiFixtureBonusRate: null,
      mysekaiFixtureBonusRateOverrides: [],
      resultLimit: 1,
      timeoutMs: null,
      unitFilters: [],
      attrFilters: [],
      characterFilters: [],
      fixedCards: [],
      useCurrentDeck: false,
      fixedCharacters: [],
      excludedCards: [],
      singleCardOverrides: [],
      skillOrderStrategy: "average",
      skillReferenceStrategy: "average",
      specificSkillOrder: [],
      keepAfterTrainingState: false,
      supportMasterMax: false,
      supportSkillMax: false,
      musicId: musicId.value,
      difficulty: difficulty.value,
      trainingConfig: createDefaultCardTrainingConfig(),
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
    await loadRanking(topRawDeck as RecommendDeck)
  } catch (error) {
    errorMessage.value = runner.error.value ?? (error instanceof Error ? error.message : String(error))
  }
}

async function loadRanking(deck: RecommendDeck) {
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
          skill_order_choose_strategy: "average",
        },
      }),
      readSekaiMusicMetas(props.dataRegion),
    ])
    rankingRows.value = buildPlannerSongRanking(
      results,
      musicTitles.value,
      buildPlannerMusicDurations(metas),
    )
    // Preselect the song the deck was built for.
    selectedSong.value = rankingRows.value.find((row) =>
      String(row.musicId) === musicId.value && row.difficulty === difficulty.value,
    ) ?? rankingRows.value[0] ?? null
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

function deckBasePoint(view: DeckResultDeckView): number | null {
  const boosted = view.deck as DeckResultDeckView["deck"] & DeckRecommendLiveBoostFields
  const original = Number(boosted.live_boost_original_score)
  if (Number.isFinite(original) && original > 0) {
    return original
  }

  const score = Number(view.deck.score)
  return Number.isFinite(score) && score > 0 ? score : null
}

function handlePlaysPerHourInput(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  if (Number.isFinite(value)) {
    playsPerHour.value = Math.max(1, Math.min(120, Math.round(value)))
  }
}

function save() {
  const song = selectedSong.value
  if (!canSave.value || song == null || pointsPerHour.value == null) {
    return
  }

  emit("save", {
    id: crypto.randomUUID(),
    name: brushName.value.trim(),
    color: pickPlannerBrushColor(props.existingBrushes),
    pointsPerHour: pointsPerHour.value,
    musicId: song.musicId,
    difficulty: song.difficulty,
    eventPointPerPlay: song.eventPoint,
    playsPerHour: playsPerHour.value,
    deckCardIds: deckView.value?.cards.map((entry) => entry.card.card_id) ?? [],
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
        <!-- Deck building -->
        <div class="flex flex-wrap items-end gap-2">
          <div class="min-w-64 flex-1">
            <MusicSelect
              v-model="musicId"
              :difficulty-value="difficulty"
              :region="dataRegion"
              :disabled="runner.running.value"
              @update:difficulty-value="difficulty = $event"
            />
          </div>
          <Button :disabled="!canRunDeck" @click="runDeck">
            <LucidePlay class="mr-1 size-4" />
            {{ runner.running.value ? t("eventPlanner.dialog.running") : t("eventPlanner.dialog.runDeck") }}
          </Button>
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
            <span v-if="deckBasePoint(deckView) != null" class="tabular-nums">
              {{ t("eventPlanner.dialog.columns.eventPoint") }} {{ formatInteger(deckBasePoint(deckView) ?? 0) }}
            </span>
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
        <div class="flex flex-col gap-2">
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
          <p v-else-if="rankingRows.length === 0" class="py-4 text-center text-xs text-muted-foreground">
            {{ t("eventPlanner.dialog.noDeck") }}
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
                    {{ t("eventPlanner.dialog.rankingEmpty") }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="rankingRows.length > 0 && selectedSong == null" class="text-xs text-muted-foreground">
            {{ t("eventPlanner.dialog.selectHint") }}
          </p>
        </div>

        <!-- Brush settings -->
        <div v-if="selectedSong" class="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-3">
          <div class="grid gap-1.5 sm:col-span-1">
            <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.dialog.playsPerHour") }}</Label>
            <Input
              type="number"
              min="1"
              max="120"
              :model-value="playsPerHour"
              class="h-8"
              @input="handlePlaysPerHourInput"
            />
            <p class="text-[11px] text-muted-foreground">{{ t("eventPlanner.dialog.playsPerHourHint") }}</p>
          </div>
          <div class="grid gap-1.5 sm:col-span-1">
            <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.dialog.brushName") }}</Label>
            <Input v-model="brushName" class="h-8" />
          </div>
          <div class="grid gap-1.5 sm:col-span-1">
            <Label class="text-xs text-muted-foreground">{{ t("eventPlanner.dialog.pointsPerHour") }}</Label>
            <p class="text-lg font-semibold tabular-nums">
              {{ pointsPerHour != null ? formatInteger(pointsPerHour) : "-" }}
            </p>
          </div>
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
