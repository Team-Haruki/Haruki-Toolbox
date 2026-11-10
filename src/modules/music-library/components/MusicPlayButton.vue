<script setup lang="ts">
/**
 * The round play button on a song's jacket in a list. It stays visible while
 * its song is the one loaded in the player, and on touch screens (no hover).
 */
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Pause, Play } from "lucide-vue-next"
import { useMusicListPlayer } from "@/modules/music-library/composables/useMusicListPlayer"
import type { MusicLibraryEntry } from "@/modules/music-library/lib/music-data"

const props = withDefaults(defineProps<{
  entry: MusicLibraryEntry
  size?: "sm" | "md"
}>(), {
  size: "md",
})

const { t } = useI18n()
const listPlayer = useMusicListPlayer()

const available = computed(() => listPlayer?.canPlay(props.entry) ?? false)
const current = computed(() => listPlayer?.isCurrent(props.entry) ?? false)
const playing = computed(() => listPlayer?.isPlaying(props.entry) ?? false)
</script>

<template>
  <button
    v-if="available"
    type="button"
    :class="[
      'inline-flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md outline-none transition-[opacity,transform] hover:scale-105 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none pointer-coarse:opacity-100',
      size === 'sm' ? 'size-8' : 'size-10',
      current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
    ]"
    :aria-label="playing ? t('musicPlayer.pause') : t('musicPlayer.playSong', { title: entry.title })"
    :aria-pressed="playing"
    data-slot="music-play-button"
    :data-playing="playing ? 'true' : undefined"
    @click.stop.prevent="listPlayer?.toggle(entry)"
  >
    <Pause v-if="playing" :class="size === 'sm' ? 'size-4' : 'size-4.5'" />
    <Play v-else :class="[size === 'sm' ? 'size-4' : 'size-4.5', 'translate-x-px']" />
  </button>
</template>
