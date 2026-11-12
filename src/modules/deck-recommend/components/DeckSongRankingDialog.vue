<script setup lang="ts">
import { computed, ref, toRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import {
  Dialog,
  DialogBody,
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
import type { SekaiRegion } from "@/types"
import { isMusicDifficulty, resolveMusicDifficultyChipClass } from "@/modules/music-library/lib/music-difficulties"
import {
  buildPlannerMusicDurations,
  buildPlannerSongRanking,
  type PlannerRankedSong,
} from "../lib/planner-calendar"
import { useDeckRecommendRunner } from "../composables/useDeckRecommendRunner"
import { useMusicOptions } from "../composables/useMusicOptions"

const props = defineProps<{
  open: boolean
  dataRegion: SekaiRegion
  accountServer: SekaiRegion | null
  /** Deck whose per-song PT income gets ranked; nothing loads while null. */
  deck: RecommendDeck | null
  eventId: string | null
  liveType: "multi" | "solo"
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
}>()

const { t, locale } = useI18n()
const runner = useDeckRecommendRunner()
const regionRef = toRef(props, "dataRegion")
const musicOptions = useMusicOptions(regionRef, ref<string | null>(null))
const musicTitles = computed(() => new Map(musicOptions.options.value.map((option) => [option.id, option.label])))

const rankingRows = ref<PlannerRankedSong[]>([])
const rankingLoading = ref(false)
const errorMessage = ref<string | null>(null)

const searchQuery = ref("")
const { matchedIds: aliasMatchedIds, pending: aliasPending } = useMusicAliasMatches(searchQuery)
const difficultyFilter = ref("all")

const RANKING_DIFFICULTIES = ["easy", "normal", "hard", "expert", "master", "append"] as const
const RANKING_DISPLAY_LIMIT = 100

const numberFormatter = computed(() => new Intl.NumberFormat(locale.value))

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

watch(() => props.open, (open) => {
  if (open) {
    errorMessage.value = null
    searchQuery.value = ""
    difficultyFilter.value = "all"
    void loadRanking()
  }
})

async function loadRanking() {
  const deck = props.deck
  if (deck == null) {
    return
  }

  rankingLoading.value = true
  rankingRows.value = []
  try {
    const [results, metas] = await Promise.all([
      runner.recommendMusicForDeck({
        dataRegion: props.dataRegion,
        accountServer: props.accountServer ?? undefined,
        deck,
        options: {
          region: props.dataRegion,
          live_type: props.liveType,
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
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    rankingLoading.value = false
  }
}

function difficultyLabel(value: string): string {
  return t(`musicLibrary.difficulty.${value}`)
}

function difficultyChipClass(value: string): string {
  return isMusicDifficulty(value)
    ? resolveMusicDifficultyChipClass(value)
    : "inline-flex items-center rounded bg-muted text-xs font-semibold text-muted-foreground"
}

function formatInteger(value: number): string {
  return numberFormatter.value.format(Math.round(value))
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent size="lg" tall>
      <DialogHeader>
        <DialogTitle>{{ t("eventPlanner.dialog.rankingTitle") }}</DialogTitle>
        <DialogDescription>{{ t("eventPlanner.dialog.rankingHint") }}</DialogDescription>
      </DialogHeader>

      <!-- The filters stay put while the table scrolls under them. -->
      <div class="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3 sm:px-5">
        <Input
          v-model="searchQuery"
          class="h-8 min-w-0 flex-1 basis-40 text-xs"
          :placeholder="t('eventPlanner.dialog.searchPlaceholder')"
          :aria-label="t('eventPlanner.dialog.searchPlaceholder')"
        />
        <Label id="deck-song-ranking-difficulty-label" for="deck-song-ranking-difficulty" class="sr-only">
          {{ t("eventPlanner.dialog.columns.difficulty") }}
        </Label>
        <Select id="deck-song-ranking-difficulty" v-model="difficultyFilter">
          <SelectTrigger class="h-8 w-28 text-xs" aria-labelledby="deck-song-ranking-difficulty-label">
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

      <!-- The table runs edge to edge: the dialog is its frame. -->
      <DialogBody class="gap-0 px-0 py-0 sm:px-0">
      <p v-if="errorMessage" role="alert" class="px-4 py-3 text-xs text-destructive sm:px-5">
        {{ errorMessage }}
      </p>

      <p v-if="rankingLoading" class="py-8 text-center text-xs text-muted-foreground">
        {{ t("eventPlanner.dialog.rankingLoading") }}
      </p>
      <div v-else class="min-w-0">
        <table class="w-full text-xs [&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4 sm:[&_td:first-child]:pl-5 sm:[&_td:last-child]:pr-5 sm:[&_th:first-child]:pl-5 sm:[&_th:last-child]:pr-5">
          <thead class="sticky top-0 z-10 bg-background">
            <tr class="border-b border-border/60 text-muted-foreground">
              <th class="px-2 py-1.5 text-left font-medium">{{ t("eventPlanner.dialog.columns.song") }}</th>
              <th class="px-2 py-1.5 text-left font-medium">{{ t("eventPlanner.dialog.columns.difficulty") }}</th>
              <th class="px-2 py-1.5 text-right font-medium">{{ t("eventPlanner.dialog.columns.eventPoint") }}</th>
              <!-- Plays/h is derived from song length; on a phone it yields its column so the ranking key (PT/h) stays visible. -->
              <th class="hidden whitespace-nowrap px-2 py-1.5 text-right font-medium sm:table-cell">{{ t("eventPlanner.dialog.columns.playsPerHour") }}</th>
              <th class="whitespace-nowrap px-2 py-1.5 text-right font-medium">{{ t("eventPlanner.dialog.columns.pointsPerHour") }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredRanking"
              :key="`${row.musicId}:${row.difficulty}`"
              class="border-b border-border/40 last:border-b-0"
            >
              <td class="max-w-36 truncate px-2 py-1.5 sm:max-w-52">{{ row.title }}</td>
              <td class="px-2 py-1.5">
                <span :class="[difficultyChipClass(row.difficulty), 'px-1.5 py-0.5']">
                  {{ difficultyLabel(row.difficulty) }}
                </span>
              </td>
              <td class="px-2 py-1.5 text-right tabular-nums">{{ formatInteger(row.eventPoint) }}</td>
              <td class="hidden px-2 py-1.5 text-right tabular-nums sm:table-cell">{{ row.playsPerHour }}</td>
              <td class="px-2 py-1.5 text-right font-semibold tabular-nums">{{ formatInteger(row.pointsPerHour) }}</td>
            </tr>
            <tr v-if="filteredRanking.length === 0">
              <td colspan="5" class="px-2 py-6 text-center text-muted-foreground">
                {{ aliasPending ? t("eventPlanner.dialog.rankingAliasSearching") : t("eventPlanner.dialog.rankingEmpty") }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </DialogBody>
    </DialogContent>
  </Dialog>
</template>
