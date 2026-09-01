<script setup lang="ts">
import { computed, ref, toRef } from "vue"
import { useI18n } from "vue-i18n"
import { LoaderCircle, MicVocal, Pause, Play, TriangleAlert } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { resolveSekaiVocalTypeLabel } from "@/shared/sekai/labels"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { useMusicVocalPlayer } from "@/modules/music-library/composables/useMusicVocalPlayer"
import type { MusicVocalCharacter, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import { formatPlayerClock } from "@/modules/music-library/lib/music-player"

/**
 * The "Vocal versions" section with the page's single shared `<audio>`:
 * one play/pause button per version, and a seek bar with elapsed / total
 * clocks under the version currently loaded. Starting playback pauses the
 * chart preview (and vice versa) through the exclusive-audio bus.
 */
const props = defineProps<{
  musicId: number | null
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  fillerSec: number | null
  vocals: readonly MusicVocalEntry[]
  characterMap: ReadonlyMap<number, CatalogCharacter>
  outsideCharacterNames: ReadonlyMap<number, string>
  loading: boolean
}>()

const { t, te } = useI18n()

const {
  currentVocalId,
  status,
  playing,
  displayTime,
  displayDuration,
  resolveUrl,
  toggle,
  seek,
} = useMusicVocalPlayer({
  region: toRef(props, "region"),
  preference: toRef(props, "preference"),
  fillerSec: toRef(props, "fillerSec"),
  musicId: toRef(props, "musicId"),
})

// While the thumb is dragged the bar follows the pointer, not the clock.
const dragValue = ref<number | null>(null)
const seekMax = computed(() => Math.max(1, Math.ceil(displayDuration.value ?? 0)))
const seekValue = computed(() => [dragValue.value ?? Math.min(displayTime.value, seekMax.value)])
const totalLabel = computed(() => (displayDuration.value != null ? formatPlayerClock(displayDuration.value) : "–:––"))

function handleSeekInput(value: number[] | undefined) {
  if (value && value.length > 0) {
    dragValue.value = value[0]
  }
}

function handleSeekCommit(value: number[] | undefined) {
  if (value && value.length > 0) {
    seek(value[0])
  }
  dragValue.value = null
}

function isCurrent(vocal: MusicVocalEntry): boolean {
  return currentVocalId.value === vocal.id
}

function vocalTypeLabel(vocal: MusicVocalEntry): string {
  return resolveSekaiVocalTypeLabel({ t, te }, vocal.musicVocalType)
}

function isGameCharacter(character: MusicVocalCharacter): boolean {
  return character.characterType === "game_character" && character.characterId != null
}

function characterName(character: MusicVocalCharacter): string {
  if (character.characterId == null) {
    return t("musicLibrary.detail.unknownCharacter")
  }
  if (character.characterType === "game_character") {
    return props.characterMap.get(character.characterId)?.name ?? t("musicLibrary.detail.unknownCharacter")
  }
  if (character.characterType === "outside_character") {
    return props.outsideCharacterNames.get(character.characterId) ?? t("musicLibrary.detail.unknownCharacter")
  }
  return t("musicLibrary.detail.unknownCharacter")
}
</script>

<template>
  <CatalogDetailSection
    :title="t('musicLibrary.detail.vocalsTitle')"
    :icon="MicVocal"
    :loading="loading && vocals.length === 0"
    :empty="vocals.length === 0"
    :empty-message="t('musicLibrary.detail.vocalsEmpty')"
    content-class="flex flex-col gap-2"
  >
    <div
      v-for="vocal in vocals"
      :key="vocal.id"
      :class="[
        'rounded-md border p-3 transition-colors',
        isCurrent(vocal) ? 'border-primary/40 bg-primary/5' : 'bg-muted/20',
      ]"
      data-slot="music-vocal-row"
    >
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="resolveUrl(vocal)"
          variant="outline"
          size="sm"
          class="size-8 shrink-0 rounded-full p-0"
          :aria-label="isCurrent(vocal) && playing ? t('musicLibrary.detail.pause') : t('musicLibrary.detail.play')"
          :aria-pressed="isCurrent(vocal) && playing"
          @click="toggle(vocal)"
        >
          <LoaderCircle v-if="isCurrent(vocal) && status === 'loading'" class="size-4 animate-spin" />
          <Pause v-else-if="isCurrent(vocal) && playing" class="size-4" />
          <Play v-else class="size-4" />
        </Button>
        <Badge variant="sky">{{ vocalTypeLabel(vocal) }}</Badge>
        <span class="text-sm font-medium">{{ vocal.caption || "—" }}</span>
        <span
          v-if="isCurrent(vocal) && status === 'error'"
          class="inline-flex items-center gap-1 text-xs text-destructive"
          role="alert"
        >
          <TriangleAlert class="size-3.5" aria-hidden="true" />
          {{ t("musicCatalog.detail.player.error") }}
        </span>
      </div>

      <div v-if="vocal.characters.length > 0" class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="(character, index) in vocal.characters"
          :key="`${vocal.id}-${index}`"
          class="inline-flex items-center gap-1.5 rounded-full border bg-background py-0.5 pr-2.5 pl-1 text-xs dark:bg-input/30"
        >
          <SekaiCharacterAvatar
            v-if="isGameCharacter(character)"
            :character-id="character.characterId!"
            :name="characterName(character)"
            size="xs"
            class="ring-0"
          />
          <span v-else class="w-1" aria-hidden="true" />
          {{ characterName(character) }}
        </span>
      </div>

      <div v-if="isCurrent(vocal)" class="mt-3 flex items-center gap-3">
        <span class="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">{{ formatPlayerClock(seekValue[0]) }}</span>
        <Slider
          :model-value="seekValue"
          :min="0"
          :max="seekMax"
          :step="1"
          :aria-label="t('musicCatalog.detail.player.seek')"
          class="min-w-0 flex-1"
          @update:model-value="handleSeekInput"
          @value-commit="handleSeekCommit"
        />
        <span class="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{{ totalLabel }}</span>
      </div>
    </div>
  </CatalogDetailSection>
</template>
