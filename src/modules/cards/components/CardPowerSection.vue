<script setup lang="ts">
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGauge, LucideMinus, LucidePlay, LucidePlus } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { resolveSekaiEnumLabel } from "@/shared/sekai/labels"
import { buildStoryPlayerLink } from "@/modules/story"
import type { CardIndexExtras, CardPowerBonus, CardPowerTable } from "@/modules/cards/composables/useCardsIndex"
import {
  resolveCardLevelCap,
  resolveCardPowerBreakdown,
  type CardEpisodeCost,
  type CardEpisodeRow,
  type CardRarityInfo,
} from "@/modules/cards/lib/card-power"

/**
 * Interactive base-power calculator. The game shows one power number, so the
 * section does too: the total up top, then one line per thing that feeds it
 * (level, special training, each side story, master rank, the MySekai canvas)
 * with its control and what it adds. A side story's line also carries its
 * play link and unlock cost, so the stories need no section of their own. Every number comes from
 * `resolveCardPowerBreakdown` (lib/card-power.ts).
 */
const props = defineProps<{
  table: CardPowerTable | null
  extras: CardIndexExtras | null
  rarity: CardRarityInfo | null
  episodes: readonly CardEpisodeRow[]
  masterLessons: readonly CardPowerBonus[]
  canvasBonus: CardPowerBonus | null
  /** The rarity supports special training (3★ / 4★). */
  canTrain: boolean
  /** The card only exists trained (`initialSpecialTrainingStatus: done`). */
  trainedByDefault: boolean
  /** Material id → name from the `materials` dump; ids fall back to "#id". */
  materialNames: ReadonlyMap<number, string>
  /** The card is released, so its side stories can open in the story player. */
  playable: boolean
  loading: boolean
}>()

const { t, te } = useI18n()
const id = useId()

// One line of the list: name, control, and what it adds (right-aligned, so
// the amounts form a column). The label's `for` makes the whole name a target.
const ROW_CLASS = "grid min-h-11 grid-cols-[minmax(0,1fr)_auto_4.75rem] items-center gap-3 px-4 py-1.5"
const ROW_LABEL_CLASS = "flex min-h-8 min-w-0 cursor-pointer items-center text-sm font-normal"

const trained = ref(props.canTrain)
const episodeFlags = ref<boolean[]>([])
const masterRank = ref(0)
const canvas = ref(false)

const effectiveTrained = computed(() => props.canTrain && (props.trainedByDefault || trained.value))
const levelCap = computed(() => resolveCardLevelCap(props.rarity, props.table, effectiveTrained.value))
const level = ref(levelCap.value)

// Keep the slider pinned to the cap while it moves (training toggle, data
// arriving) unless the user already picked a lower level.
watch(levelCap, (cap, previous) => {
  if (level.value > cap || level.value === previous) {
    level.value = cap
  }
})

watch(() => props.episodes.length, (count) => {
  episodeFlags.value = Array.from({ length: count }, () => true)
}, { immediate: true })

watch(() => props.table, () => {
  trained.value = props.canTrain
  masterRank.value = 0
  canvas.value = false
  level.value = levelCap.value
})

const maxMasterRank = computed(() => props.masterLessons.length)

const episodeBonuses = computed(() => props.episodes.map((episode) => episode.bonus))

function breakdownFor(options: { trained: boolean; episodes: boolean[]; canvas: boolean }) {
  return resolveCardPowerBreakdown(
    props.table,
    { level: level.value, masterRank: masterRank.value, ...options },
    props.extras,
    episodeBonuses.value,
    props.masterLessons,
    props.canvasBonus,
  )
}

const power = computed(() => breakdownFor({
  trained: effectiveTrained.value,
  episodes: episodeFlags.value,
  canvas: canvas.value,
}))
// What each switch would add when on: shown dimmed while it is off.
const potential = computed(() => breakdownFor({
  trained: props.canTrain,
  episodes: props.episodes.map(() => true),
  canvas: true,
}))

const formatNumber = (value: number) => value.toLocaleString()
const formatBonus = (value: number) => `+${value.toLocaleString()}`

function handleLevel(value: number[] | undefined) {
  const next = value?.[0]
  if (typeof next === "number" && Number.isFinite(next)) {
    level.value = Math.min(Math.max(1, Math.round(next)), levelCap.value)
  }
}

function toggleEpisode(index: number, enabled: boolean) {
  const next = [...episodeFlags.value]
  next[index] = enabled
  episodeFlags.value = next
}

function costLabel(cost: CardEpisodeCost): string {
  const resource = cost.resourceType === "material" && cost.resourceId != null
    ? props.materialNames.get(cost.resourceId) ?? t("cardCatalog.detail.episodes.material", { id: cost.resourceId })
    : `${cost.resourceType}${cost.resourceId != null ? ` #${cost.resourceId}` : ""}`
  return t("cardCatalog.detail.episodes.cost", { resource, quantity: cost.quantity })
}

function episodeLabel(episode: CardEpisodeRow): string {
  return resolveSekaiEnumLabel({ t, te }, "cardCatalog.detail.episodes.partType", episode.partType, episode.title || undefined)
}
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.power.title')"
    :icon="LucideGauge"
    :loading="loading && !table"
    :empty="!loading && !table"
    :empty-message="t('cardCatalog.detail.power.noData')"
    content-class="flex flex-col gap-4"
  >
    <div class="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <p class="text-4xl leading-none font-bold tracking-tight tabular-nums" data-testid="card-power-total" aria-live="polite">
        {{ formatNumber(power.total) }}
      </p>
      <p class="text-xs text-muted-foreground sm:text-right">{{ t("cardCatalog.detail.power.hint") }}</p>
    </div>

    <div class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-muted/20" data-testid="card-power-sources">
      <div class="flex flex-col gap-2 px-4 py-3">
        <div class="flex items-center justify-between gap-3 text-sm">
          <Label :for="`${id}-level`" class="font-normal">
            {{ t("cardCatalog.detail.power.level") }}
            <span class="tabular-nums text-muted-foreground">Lv. {{ level }} / {{ levelCap }}</span>
          </Label>
          <span class="font-medium tabular-nums">{{ formatNumber(power.level) }}</span>
        </div>
        <Slider
          :id="`${id}-level`"
          :model-value="[level]"
          :min="1"
          :max="levelCap"
          :step="1"
          :aria-label="t('cardCatalog.detail.power.level')"
          @update:model-value="handleLevel"
        />
      </div>

      <div v-if="canTrain" :class="ROW_CLASS">
        <Label :for="`${id}-trained`" :class="ROW_LABEL_CLASS">{{ t("cardCatalog.detail.power.trained") }}</Label>
        <Switch
          :id="`${id}-trained`"
          :model-value="effectiveTrained"
          :disabled="trainedByDefault"
          @update:model-value="trained = $event"
        />
        <span :class="['text-right text-sm tabular-nums', effectiveTrained ? 'font-medium' : 'text-muted-foreground/70']">
          {{ formatBonus(potential.training) }}
        </span>
      </div>

      <!-- A side story: what reading it adds, the way to read it, and what unlocking it costs. -->
      <div v-for="(episode, index) in episodes" :key="episode.id" data-slot="card-power-episode">
        <div :class="ROW_CLASS">
          <div class="flex min-w-0 items-center gap-1.5">
            <Label :for="`${id}-episode-${index}`" :class="ROW_LABEL_CLASS" :title="episode.title || undefined">
              <span class="truncate">{{ t("cardCatalog.detail.power.episodes") }} · {{ episodeLabel(episode) }}</span>
            </Label>
            <Button v-if="playable && episode.scenarioId" as-child variant="ghost" size="sm" class="h-7 shrink-0 gap-1 px-1.5 text-xs text-primary hover:text-primary pointer-coarse:h-9">
              <RouterLink :to="buildStoryPlayerLink(episode.scenarioId)">
                <LucidePlay class="size-3.5" />
                {{ t("cardCatalog.detail.episodes.play") }}
              </RouterLink>
            </Button>
          </div>
          <Switch
            :id="`${id}-episode-${index}`"
            :model-value="episodeFlags[index] ?? false"
            @update:model-value="toggleEpisode(index, $event)"
          />
          <span :class="['text-right text-sm tabular-nums', episodeFlags[index] ? 'font-medium' : 'text-muted-foreground/70']">
            {{ formatBonus(potential.episodes[index] ?? 0) }}
          </span>
        </div>
        <div v-if="episode.costs.length > 0" class="-mt-1 flex flex-wrap items-center gap-1.5 px-4 pb-2.5 text-xs text-muted-foreground">
          <span>{{ t("cardCatalog.detail.episodes.costs") }}</span>
          <Badge v-for="(cost, costIndex) in episode.costs" :key="costIndex" variant="outline" size="sm" class="bg-background tabular-nums dark:bg-input/30">
            {{ costLabel(cost) }}
          </Badge>
        </div>
      </div>

      <div v-if="maxMasterRank > 0" :class="ROW_CLASS">
        <span class="min-w-0 text-sm">
          {{ t("cardCatalog.detail.power.masterRank") }}
          <span class="tabular-nums text-muted-foreground">{{ masterRank }} / {{ maxMasterRank }}</span>
        </span>
        <div class="inline-flex items-center rounded-md border bg-background dark:bg-input/30" role="group" :aria-label="t('cardCatalog.detail.power.masterRank')">
          <Button
            variant="ghost"
            size="sm"
            class="size-9 rounded-r-none p-0 sm:size-8"
            :disabled="masterRank <= 0"
            :aria-label="`${t('cardCatalog.detail.power.masterRank')} -1`"
            @click="masterRank -= 1"
          >
            <LucideMinus class="size-4" />
          </Button>
          <span class="w-8 text-center text-sm font-medium tabular-nums" aria-live="polite">{{ masterRank }}</span>
          <Button
            variant="ghost"
            size="sm"
            class="size-9 rounded-l-none p-0 sm:size-8"
            :disabled="masterRank >= maxMasterRank"
            :aria-label="`${t('cardCatalog.detail.power.masterRank')} +1`"
            @click="masterRank += 1"
          >
            <LucidePlus class="size-4" />
          </Button>
        </div>
        <span :class="['text-right text-sm tabular-nums', masterRank > 0 ? 'font-medium' : 'text-muted-foreground/70']">
          {{ formatBonus(power.masterRank) }}
        </span>
      </div>

      <div v-if="canvasBonus" :class="ROW_CLASS">
        <Label :for="`${id}-canvas`" :class="ROW_LABEL_CLASS">{{ t("cardCatalog.detail.power.canvas") }}</Label>
        <Switch :id="`${id}-canvas`" :model-value="canvas" @update:model-value="canvas = $event" />
        <span :class="['text-right text-sm tabular-nums', canvas ? 'font-medium' : 'text-muted-foreground/70']">
          {{ formatBonus(potential.canvas) }}
        </span>
      </div>
    </div>
  </CatalogDetailSection>
</template>
