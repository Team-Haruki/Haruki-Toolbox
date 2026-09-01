<script setup lang="ts">
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGauge, LucideMinus, LucidePlus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import { resolveSekaiEnumLabel } from "@/shared/sekai/labels"
import type { CardIndexExtras, CardPowerBonus, CardPowerTable } from "@/modules/cards/composables/useCardsIndex"
import {
  resolveCardLevelCap,
  resolveCardPower,
  type CardEpisodeRow,
  type CardRarityInfo,
} from "@/modules/cards/lib/card-power"

/**
 * Interactive base-power calculator: level slider, special training,
 * side-story toggles, master rank stepper and MySekai canvas bonus. Every
 * number comes from `resolveCardPower` (lib/card-power.ts).
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
  loading: boolean
}>()

const { t, te } = useI18n()
const id = useId()

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

const power = computed(() => resolveCardPower(
  props.table,
  {
    level: level.value,
    trained: effectiveTrained.value,
    episodes: episodeFlags.value,
    masterRank: masterRank.value,
    canvas: canvas.value,
  },
  props.extras,
  props.episodes.map((episode) => episode.bonus),
  props.masterLessons,
  props.canvasBonus,
))

const shares = computed(() => {
  const total = power.value.total
  if (total <= 0) {
    return { p1: 0, p2: 0, p3: 0 }
  }
  return {
    p1: (power.value.p1 / total) * 100,
    p2: (power.value.p2 / total) * 100,
    p3: (power.value.p3 / total) * 100,
  }
})

const parameters = computed(() => [
  { key: "p1", label: t("cardCatalog.detail.power.perf"), value: power.value.p1, share: shares.value.p1, dot: "bg-rose-400" },
  { key: "p2", label: t("cardCatalog.detail.power.tech"), value: power.value.p2, share: shares.value.p2, dot: "bg-sky-400" },
  { key: "p3", label: t("cardCatalog.detail.power.stam"), value: power.value.p3, share: shares.value.p3, dot: "bg-emerald-400" },
])

const formatNumber = (value: number) => value.toLocaleString()

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

function episodeLabel(episode: CardEpisodeRow): string {
  return resolveSekaiEnumLabel({ t, te }, "cardCatalog.detail.episodes.partType", episode.partType, episode.title || undefined)
}
</script>

<template>
  <CatalogDetailSection
    :title="t('cardCatalog.detail.power.title')"
    :icon="LucideGauge"
    :description="t('cardCatalog.detail.power.hint')"
    :loading="loading && !table"
    :empty="!loading && !table"
    :empty-message="t('cardCatalog.detail.power.noData')"
    content-class="flex flex-col gap-4"
  >
    <div class="flex flex-col gap-3">
      <div class="flex items-baseline justify-between gap-3">
        <span class="text-sm text-muted-foreground">{{ t("cardCatalog.detail.power.total") }}</span>
        <span class="text-2xl font-bold tabular-nums">{{ formatNumber(power.total) }}</span>
      </div>
      <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div
          v-for="parameter in parameters"
          :key="parameter.key"
          :class="['h-full transition-[width]', parameter.dot]"
          :style="{ width: `${parameter.share}%` }"
        />
      </div>
      <dl class="grid grid-cols-3 gap-2">
        <div v-for="parameter in parameters" :key="parameter.key" class="rounded-md bg-muted/50 px-2.5 py-2">
          <dt class="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span :class="['size-2 shrink-0 rounded-full', parameter.dot]" aria-hidden="true" />
            <span class="truncate">{{ parameter.label }}</span>
          </dt>
          <dd class="mt-0.5 text-base font-semibold tabular-nums">{{ formatNumber(parameter.value) }}</dd>
        </div>
      </dl>
    </div>

    <div class="flex flex-col gap-3 border-t pt-4">
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between text-sm">
          <Label :for="`${id}-level`">{{ t("cardCatalog.detail.power.level") }}</Label>
          <span class="tabular-nums text-muted-foreground">Lv. {{ level }} / {{ levelCap }}</span>
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

      <div class="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <div v-if="canTrain" class="flex min-h-9 items-center justify-between gap-3">
          <Label :for="`${id}-trained`" class="text-sm">{{ t("cardCatalog.detail.power.trained") }}</Label>
          <Switch
            :id="`${id}-trained`"
            :model-value="effectiveTrained"
            :disabled="trainedByDefault"
            @update:model-value="trained = $event"
          />
        </div>

        <div
          v-for="(episode, index) in episodes"
          :key="episode.id"
          class="flex min-h-9 items-center justify-between gap-3"
        >
          <Label :for="`${id}-episode-${index}`" class="min-w-0 truncate text-sm">
            {{ t("cardCatalog.detail.power.episodes") }} · {{ episodeLabel(episode) }}
          </Label>
          <Switch
            :id="`${id}-episode-${index}`"
            :model-value="episodeFlags[index] ?? false"
            @update:model-value="toggleEpisode(index, $event)"
          />
        </div>

        <div v-if="canvasBonus" class="flex min-h-9 items-center justify-between gap-3">
          <Label :for="`${id}-canvas`" class="text-sm">{{ t("cardCatalog.detail.power.canvas") }}</Label>
          <Switch :id="`${id}-canvas`" :model-value="canvas" @update:model-value="canvas = $event" />
        </div>

        <div v-if="maxMasterRank > 0" class="flex min-h-9 items-center justify-between gap-3">
          <span class="text-sm">{{ t("cardCatalog.detail.power.masterRank") }}</span>
          <div class="inline-flex items-center rounded-md border" role="group" :aria-label="t('cardCatalog.detail.power.masterRank')">
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
        </div>
      </div>
    </div>
  </CatalogDetailSection>
</template>
