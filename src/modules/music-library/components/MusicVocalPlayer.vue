<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LoaderCircle, MicVocal, Pause, Play, TriangleAlert } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import { resolveSekaiVocalTypeLabel } from "@/shared/sekai/labels"
import { useGlobalMusicPlayer } from "@/modules/music-library/composables/useGlobalMusicPlayer"
import type { MusicVocalCharacter, MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import { formatPlayerClock } from "@/modules/music-library/lib/music-player"
import { findPlayerVocal, type PlayerTrack } from "@/modules/music-library/player/player-track"

/**
 * The song's vocal versions, two to a line. Each one plays that version in
 * the site-wide player; while the song is playing, picking another changes
 * singers without stopping it. The seek bar sits under the version being heard.
 */
const props = defineProps<{
  /** The song as the global player takes it; null until a version has audio. */
  track: PlayerTrack | null
  vocals: readonly MusicVocalEntry[]
  characterMap: ReadonlyMap<number, CatalogCharacter>
  outsideCharacterNames: ReadonlyMap<number, string>
  loading: boolean
}>()

const { t, te } = useI18n()
const player = useGlobalMusicPlayer()
const { state, displayTime, displayDuration } = player

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
    player.seek(value[0])
  }
  dragValue.value = null
}

function isPlayable(vocal: MusicVocalEntry): boolean {
  return findPlayerVocal(props.track, vocal.id) != null
}

function isCurrent(vocal: MusicVocalEntry): boolean {
  return player.isCurrent(props.track, vocal.id)
}

function isSounding(vocal: MusicVocalEntry): boolean {
  return isCurrent(vocal) && player.playing.value
}

function isJoining(vocal: MusicVocalEntry): boolean {
  return player.isCurrent(props.track) && state.switchingTo === vocal.id
}

function toggle(vocal: MusicVocalEntry) {
  if (!props.track) {
    return
  }
  if (isSounding(vocal)) {
    player.pause()
    return
  }
  player.play(props.track, vocal.id)
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
    content-class="grid gap-2 sm:grid-cols-2"
  >
    <div
      v-for="vocal in vocals"
      :key="vocal.id"
      :class="[
        'rounded-xl border px-3 py-2.5 transition-colors',
        isCurrent(vocal) ? 'border-primary/50 bg-primary/5' : 'bg-muted/20',
      ]"
      data-slot="music-vocal-row"
      :data-vocal-id="vocal.id"
      :data-current="isCurrent(vocal) ? 'true' : undefined"
    >
      <div class="flex items-center gap-3">
        <button
          v-if="isPlayable(vocal)"
          type="button"
          :class="[
            'inline-flex size-10 shrink-0 items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
            isCurrent(vocal) ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border bg-background hover:bg-accent dark:bg-input/30',
          ]"
          :aria-label="isSounding(vocal) ? t('musicLibrary.detail.pause') : t('musicLibrary.detail.play')"
          :aria-pressed="isSounding(vocal)"
          @click="toggle(vocal)"
        >
          <LoaderCircle v-if="isJoining(vocal) || (isCurrent(vocal) && state.status === 'loading')" class="size-4.5 animate-spin" />
          <Pause v-else-if="isSounding(vocal)" class="size-4.5" />
          <Play v-else class="size-4.5 translate-x-px" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant="sky" size="sm">{{ vocalTypeLabel(vocal) }}</Badge>
            <span class="min-w-0 text-sm font-medium">{{ vocal.caption || "—" }}</span>
            <span
              v-if="isCurrent(vocal) && state.status === 'error'"
              class="inline-flex items-center gap-1 text-xs text-destructive"
              role="alert"
            >
              <TriangleAlert class="size-3.5" aria-hidden="true" />
              {{ t("musicCatalog.detail.player.error") }}
            </span>
          </div>
          <div v-if="vocal.characters.length > 0" class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            <span
              v-for="(character, index) in vocal.characters"
              :key="`${vocal.id}-${index}`"
              class="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <SekaiCharacterAvatar
                v-if="isGameCharacter(character)"
                :character-id="character.characterId!"
                :name="characterName(character)"
                size="xs"
                class="ring-0"
              />
              {{ characterName(character) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="isCurrent(vocal)" class="mt-2.5 flex items-center gap-3 pl-[3.25rem]">
        <span class="w-9 shrink-0 text-xs text-muted-foreground tabular-nums">{{ formatPlayerClock(seekValue[0]) }}</span>
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
        <span class="w-9 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{{ totalLabel }}</span>
      </div>
    </div>
  </CatalogDetailSection>
</template>
