<script setup lang="ts">
/**
 * The site-wide player bar. It appears once something on the music pages
 * starts playing and stays through navigation: transport, the seek bar, and
 * the vocal switcher, which changes singers without stopping the song.
 */
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { Check, ChevronUp, Disc3, LoaderCircle, MicVocal, Music, Pause, Play, TriangleAlert, Volume1, Volume2, VolumeX, X } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import MarqueeText from "@/shared/components/MarqueeText.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import MusicJacket from "@/modules/music-library/components/MusicJacket.vue"
import { useGlobalMusicPlayer } from "@/modules/music-library/composables/useGlobalMusicPlayer"
import { formatPlayerClock } from "@/modules/music-library/lib/music-player"
import { describeSingers, resolveVocalBadge, type PlayerVocal } from "@/modules/music-library/player/player-track"

const { t } = useI18n()
const player = useGlobalMusicPlayer()
const { state, vocal, playing, displayTime, displayDuration } = player

const track = computed(() => state.track)
const detailRoute = computed(() => (
  track.value ? { path: `/music/${track.value.musicId}`, query: { region: track.value.region } } : "/music"
))
const singersLabel = computed(() => describeSingers(vocal.value, t("musicPlayer.singerSeparator")))
const subtitle = computed(() => [vocal.value?.caption, singersLabel.value].filter(Boolean).join(" · "))

// While the thumb is dragged the bar follows the pointer, not the clock.
const dragValue = ref<number | null>(null)
const seekMax = computed(() => Math.max(1, Math.ceil(displayDuration.value ?? 0)))
const seekValue = computed(() => [dragValue.value ?? Math.min(displayTime.value, seekMax.value)])
const totalLabel = computed(() => (displayDuration.value != null ? formatPlayerClock(displayDuration.value) : "–:––"))

function handleSeekInput(value: number[] | undefined) {
  if (value && value.length > 0) dragValue.value = value[0]
}

function handleSeekCommit(value: number[] | undefined) {
  if (value && value.length > 0) player.seek(value[0])
  dragValue.value = null
}

const badge = computed(() => (vocal.value ? resolveVocalBadge(vocal.value) : null))
const BADGE_ICONS = { original: Disc3, instrumental: Music, vocal: MicVocal } as const

const vocalsOpen = ref(false)
const hasChoice = computed(() => (track.value?.vocals.length ?? 0) > 1)

function chooseVocal(target: PlayerVocal) {
  player.switchVocal(target.id)
  vocalsOpen.value = false
}

function avatarSingers(target: PlayerVocal | null) {
  return (target?.singers ?? []).filter((singer) => singer.characterId != null)
}

const volumeValue = computed(() => [state.muted ? 0 : Math.round(state.volume * 100)])
const volumeIcon = computed(() => (state.muted || state.volume === 0 ? VolumeX : state.volume < 0.5 ? Volume1 : Volume2))

function handleVolume(value: number[] | undefined) {
  if (value && value.length > 0) player.setVolume(value[0] / 100)
}

const iconButtonClass = "inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:size-10"
</script>

<template>
  <section
    v-if="track"
    data-glass-surface="compose-bar"
    class="sticky bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)]"
    :aria-label="t('musicPlayer.label')"
    data-testid="global-music-player"
    :data-status="state.status"
    :data-vocal-id="state.vocalId ?? undefined"
  >
    <div class="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 sm:px-4 md:flex-nowrap md:gap-x-4">
      <!-- What is playing -->
      <div class="flex min-w-0 flex-1 items-center gap-3 md:w-64 md:flex-none lg:w-72">
        <RouterLink
          :to="detailRoute"
          class="shrink-0 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          :aria-label="t('musicPlayer.openSong')"
          :title="t('musicPlayer.openSong')"
        >
          <MusicJacket :url="track.jacketUrl" alt="" class="size-11 rounded-md shadow-sm" eager />
        </RouterLink>
        <div class="min-w-0 flex-1">
          <RouterLink
            :to="detailRoute"
            class="block text-sm font-semibold outline-none hover:underline focus-visible:underline"
            data-testid="global-music-player-title"
          >
            <MarqueeText :text="track.title" />
          </RouterLink>
          <p class="text-xs text-muted-foreground" data-testid="global-music-player-vocal">
            <span v-if="state.status === 'error'" class="inline-flex max-w-full items-center gap-1 truncate text-destructive" role="alert">
              <TriangleAlert class="size-3.5 shrink-0" aria-hidden="true" />
              {{ t("musicPlayer.error") }}
            </span>
            <MarqueeText v-else :text="subtitle || '—'" />
          </p>
        </div>
      </div>

      <!-- Transport -->
      <button
        type="button"
        class="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm outline-none transition-colors hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50 md:order-none"
        :aria-label="playing ? t('musicPlayer.pause') : t('musicPlayer.play')"
        :aria-pressed="playing"
        data-testid="global-music-player-toggle"
        @click="player.toggle()"
      >
        <LoaderCircle v-if="state.status === 'loading'" class="size-5 animate-spin" />
        <Pause v-else-if="playing" class="size-5" />
        <Play v-else class="size-5 translate-x-px" />
      </button>

      <!-- Seek: its own full-width line on phones, inline from md up. -->
      <div class="order-last flex w-full min-w-0 items-center gap-2.5 md:order-none md:w-auto md:flex-1">
        <span class="w-9 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{{ formatPlayerClock(seekValue[0]) }}</span>
        <Slider
          :model-value="seekValue"
          :min="0"
          :max="seekMax"
          :step="1"
          :aria-label="t('musicPlayer.seek')"
          class="min-w-0 flex-1"
          @update:model-value="handleSeekInput"
          @value-commit="handleSeekCommit"
        />
        <span class="w-9 shrink-0 text-xs tabular-nums text-muted-foreground">{{ totalLabel }}</span>
      </div>

      <div class="flex shrink-0 items-center gap-0.5">
        <!-- Who sings: switching keeps the song going. -->
        <Popover v-if="hasChoice" v-model:open="vocalsOpen">
          <PopoverTrigger as-child>
            <button
              type="button"
              class="inline-flex h-9 max-w-44 shrink-0 items-center gap-1.5 rounded-full border bg-background/60 px-2 text-xs font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:h-10 dark:bg-input/30"
              :aria-label="t('musicPlayer.vocal')"
              :title="t('musicPlayer.vocal')"
              data-testid="global-music-player-vocals"
            >
              <LoaderCircle v-if="state.switchingTo != null" class="size-4 shrink-0 animate-spin text-primary" aria-hidden="true" />
              <!-- A SEKAI version wears its unit's emblem; an Another Vocal shows who sings. -->
              <SekaiUnitLogo v-else-if="badge?.kind === 'unit'" :unit="badge.unit" size="md" class="shrink-0" />
              <span v-else-if="badge?.kind === 'singers'" class="flex shrink-0 -space-x-1.5">
                <SekaiCharacterAvatar
                  v-for="singer in avatarSingers(vocal).slice(0, 3)"
                  :key="singer.characterId!"
                  :character-id="singer.characterId!"
                  :name="singer.name"
                  size="xs"
                />
                <span
                  v-if="avatarSingers(vocal).length > 3"
                  class="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-background"
                >
                  +{{ avatarSingers(vocal).length - 3 }}
                </span>
              </span>
              <component :is="BADGE_ICONS[badge?.kind === 'icon' ? badge.icon : 'vocal']" v-else class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span class="hidden min-w-0 truncate sm:inline">{{ vocal?.typeLabel }}</span>
              <ChevronUp class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" class="w-80 max-w-[calc(100vw-1.5rem)] p-1.5">
            <p class="px-2.5 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">{{ t("musicPlayer.vocalsTitle") }}</p>
            <ul class="max-h-[min(60vh,22rem)] overflow-y-auto" data-testid="global-music-player-vocal-list">
              <li v-for="option in track.vocals" :key="option.id">
                <button
                  type="button"
                  :class="[
                    'flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent',
                    option.id === state.vocalId ? 'bg-primary/5' : '',
                  ]"
                  :aria-current="option.id === state.vocalId ? 'true' : undefined"
                  :data-vocal-id="option.id"
                  @click="chooseVocal(option)"
                >
                  <span class="mt-0.5 flex size-4 shrink-0 items-center justify-center text-primary">
                    <LoaderCircle v-if="option.id === state.switchingTo" class="size-4 animate-spin" aria-hidden="true" />
                    <Check v-else-if="option.id === state.vocalId" class="size-4" aria-hidden="true" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <Badge variant="sky" size="sm">{{ option.typeLabel }}</Badge>
                      <span class="min-w-0 text-sm font-medium">{{ option.caption || "—" }}</span>
                    </span>
                    <span v-if="option.singers.length" class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span v-for="(singer, index) in option.singers" :key="index" class="inline-flex items-center gap-1">
                        <SekaiCharacterAvatar
                          v-if="singer.characterId != null"
                          :character-id="singer.characterId"
                          :name="singer.name"
                          size="xs"
                          class="ring-0"
                        />
                        {{ singer.name }}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            </ul>
          </PopoverContent>
        </Popover>

        <!-- Volume: a slider from lg up, a popover below (phones use their own keys). -->
        <div class="hidden items-center gap-1 lg:flex">
          <button
            type="button"
            :class="iconButtonClass"
            :aria-label="state.muted ? t('musicPlayer.unmute') : t('musicPlayer.mute')"
            :aria-pressed="state.muted"
            @click="player.toggleMuted()"
          >
            <component :is="volumeIcon" class="size-4.5" />
          </button>
          <Slider
            :model-value="volumeValue"
            :min="0"
            :max="100"
            :step="1"
            :aria-label="t('musicPlayer.volume')"
            class="w-20"
            @update:model-value="handleVolume"
          />
        </div>
        <Popover>
          <PopoverTrigger as-child>
            <button type="button" :class="[iconButtonClass, 'hidden sm:inline-flex lg:hidden']" :aria-label="t('musicPlayer.volume')">
              <component :is="volumeIcon" class="size-4.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" class="flex w-56 items-center gap-2 p-3">
            <button
              type="button"
              :class="iconButtonClass"
              :aria-label="state.muted ? t('musicPlayer.unmute') : t('musicPlayer.mute')"
              :aria-pressed="state.muted"
              @click="player.toggleMuted()"
            >
              <component :is="volumeIcon" class="size-4.5" />
            </button>
            <Slider
              :model-value="volumeValue"
              :min="0"
              :max="100"
              :step="1"
              :aria-label="t('musicPlayer.volume')"
              class="min-w-0 flex-1"
              @update:model-value="handleVolume"
            />
          </PopoverContent>
        </Popover>

        <button
          type="button"
          :class="iconButtonClass"
          :aria-label="t('musicPlayer.close')"
          :title="t('musicPlayer.close')"
          data-testid="global-music-player-close"
          @click="player.close()"
        >
          <X class="size-4.5" />
        </button>
      </div>
    </div>
  </section>
</template>
