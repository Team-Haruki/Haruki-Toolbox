<script setup lang="ts">
// Ported from Sekai Station's RoomCard, RoomActions and RoomMenu (MIT ©
// middlered) onto the Toolbox primitives.
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideCheck,
  LucideCopy,
  LucideEllipsis,
  LucideExternalLink,
  LucideEyeOff,
  LucideHash,
  LucidePin,
  LucidePinOff,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useNowTick } from "@/composables/useNowTick"
import { cn } from "@/lib/utils"
import { useHoldToBlock } from "@/modules/sekai-station/composables/useHoldToBlock"
import { useRoomCopy } from "@/modules/sekai-station/composables/useRoomCopy"
import { useStationReducedMotion } from "@/modules/sekai-station/composables/useStationReducedMotion"
import { formatRelativeTime } from "@/modules/sekai-station/lib/relative-time"
import { highlightSegments, type TextSegment } from "@/modules/sekai-station/lib/room-filter"
import { COPIED_FEEDBACK_MS, HOLD_TO_BLOCK_MS } from "@/modules/sekai-station/lib/sekai-station-constants"
import type { StationRoom, StationRoomExtra } from "@/modules/sekai-station/lib/station-types"
import { useSekaiStationFeedStore } from "@/modules/sekai-station/stores/sekai-station-feed"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"
import { useSettingsStore } from "@/shared/stores/settings"

const props = defineProps<{
  room: StationRoom
  roomKey: string
  extra?: StationRoomExtra
}>()

const emit = defineEmits<{ block: [] }>()

/** The hold fill waits this long before growing, so quick clicks do not flash red */
const HOLD_FILL_DELAY_MS = 150

const { t } = useI18n()
const feed = useSekaiStationFeedStore()
const prefs = useSekaiStationPrefsStore()
const settings = useSettingsStore()
const roomCopy = useRoomCopy()
const reducedMotion = useStationReducedMotion()
const now = useNowTick(1000)

const pinned = computed(() => feed.isPinned(props.roomKey))
// Empty for platforms without a public post (QQ)
const originalUrl = computed(() => props.room.info.url || null)

const postedAt = computed(() => new Date(props.room.time * 1000))
const relativeTime = computed(() => formatRelativeTime(props.room.time, settings.locale, now.value))
const absoluteTime = computed(() => postedAt.value.toLocaleString(settings.locale))
const isoTime = computed(() => (Number.isNaN(postedAt.value.getTime()) ? undefined : postedAt.value.toISOString()))

// Name at the base size, message 2px larger, room number 2px larger again
const nameStyle = computed(() => ({ fontSize: `${prefs.fontSize}px` }))
const idStyle = computed(() => ({ fontSize: `${prefs.fontSize + 4}px` }))
const messageStyle = computed(() => ({
  fontSize: `${prefs.fontSize + 2}px`,
  lineHeight: String(prefs.lineHeight),
}))

// In whitelist mode, show why the room matched
const segments = computed<TextSegment[]>(() =>
  prefs.filterMode === "whitelist" && prefs.filterTerms.length > 0
    ? highlightSegments(props.room.msg, prefs.filterTerms)
    : [{ text: props.room.msg, hit: false }],
)

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null
let disposed = false

async function copyId() {
  const ok = await roomCopy.copyId(props.room)
  if (!ok || disposed) {
    return
  }
  copied.value = true
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    copiedTimer = null
    copied.value = false
  }, COPIED_FEEDBACK_MS)
}

function copyText() {
  void roomCopy.copyText(props.room)
}

function togglePin() {
  if (pinned.value) {
    feed.unpinRoom(props.roomKey)
  } else {
    feed.pinRoom(props.roomKey, props.room)
  }
}

const {
  holding,
  onPointerDown,
  onPointerUp,
  onPointerLeave,
  onPointerCancel,
  onClick: onIdClick,
} = useHoldToBlock({
  onClick: () => void copyId(),
  onHold: () => emit("block"),
})

// The hold only shows (red) after HOLD_FILL_DELAY_MS, so a normal click
// never flashes it
const holdShown = ref(false)
let holdShownTimer: ReturnType<typeof setTimeout> | null = null

function clearHoldShownTimer() {
  if (holdShownTimer) {
    clearTimeout(holdShownTimer)
    holdShownTimer = null
  }
}

watch(holding, (on) => {
  clearHoldShownTimer()
  holdShown.value = false
  if (on) {
    holdShownTimer = setTimeout(() => {
      holdShownTimer = null
      holdShown.value = true
    }, HOLD_FILL_DELAY_MS)
  }
})

// Fills left to right while the number is held and snaps back on release;
// delay + duration = HOLD_TO_BLOCK_MS, so the fill is full when the block fires
const holdFillStyle = computed(() => {
  if (reducedMotion.value) {
    return { transform: holdShown.value ? "scaleX(1)" : "scaleX(0)" }
  }
  return holding.value
    ? {
        transform: "scaleX(1)",
        transition: `transform ${HOLD_TO_BLOCK_MS - HOLD_FILL_DELAY_MS}ms linear ${HOLD_FILL_DELAY_MS}ms`,
      }
    : { transform: "scaleX(0)", transition: "transform 150ms ease-out" }
})

onBeforeUnmount(() => {
  disposed = true
  clearHoldShownTimer()
  if (copiedTimer) {
    clearTimeout(copiedTimer)
    copiedTimer = null
  }
})
</script>

<template>
  <article
    :class="cn(
      'flex items-start gap-3 rounded-lg border bg-card px-3 py-2.5 text-card-foreground transition-colors sm:px-4',
      pinned && 'border-primary/50',
    )"
  >
    <!-- Click copies the number; holding it hides every room with this number for a while -->
    <button
      type="button"
      :class="cn(
        'relative inline-flex h-7 shrink-0 touch-manipulation select-none items-center rounded-md px-2 font-mono font-bold leading-none tracking-wider tabular-nums outline-none transition-colors [-webkit-touch-callout:none] focus-visible:ring-[3px] focus-visible:ring-ring/50',
        holdShown ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary hover:bg-primary/15',
      )"
      :style="idStyle"
      :title="t('sekaiStation.rooms.idHint')"
      :aria-label="`${t('sekaiStation.rooms.copyId')} ${room.id}`"
      @pointerdown="onPointerDown"
      @pointerup="onPointerUp"
      @pointerleave="onPointerLeave"
      @pointercancel="onPointerCancel"
      @blur="onPointerCancel"
      @contextmenu.prevent
      @click="onIdClick"
    >
      <span
        class="pointer-events-none absolute inset-0 origin-left rounded-[inherit] bg-destructive/20"
        :style="holdFillStyle"
        aria-hidden="true"
      />
      <span class="relative">{{ room.id }}</span>
      <span
        v-if="copied"
        class="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs"
        aria-hidden="true"
      >
        <LucideCheck class="size-3" :stroke-width="3" />
      </span>
    </button>

    <div class="min-w-0 flex-1">
      <!-- Who and when, with the actions on the same line -->
      <div class="flex min-h-7 min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span class="min-w-0 truncate font-medium text-card-foreground" :style="nameStyle">{{ room.name }}</span>
        <!-- Dropped on narrow screens to leave room for the name -->
        <span v-if="room.info.handle" class="hidden min-w-0 shrink-[3] truncate sm:block">{{ room.info.handle }}</span>
        <time class="ml-auto shrink-0 pl-1 tabular-nums" :datetime="isoTime" :title="absoluteTime">{{ relativeTime }}</time>

        <!-- Negative margins: the buttons keep their hit area without making the row taller -->
        <div class="-my-0.5 -mr-1.5 flex shrink-0 items-center sm:-mr-2">
          <!-- Also in the menu; the shortcut is dropped on narrow screens -->
          <Button
            v-if="originalUrl"
            as-child
            variant="ghost"
            size="icon"
            class="hidden size-8 text-muted-foreground sm:inline-flex"
          >
            <a
              :href="originalUrl"
              target="_blank"
              rel="noopener noreferrer"
              :title="t('sekaiStation.rooms.openOriginal')"
              :aria-label="t('sekaiStation.rooms.openOriginal')"
            >
              <LucideExternalLink aria-hidden="true" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            :class="cn(
              'size-8 text-muted-foreground',
              pinned && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:hover:bg-primary/15',
            )"
            :title="pinned ? t('sekaiStation.rooms.unpin') : t('sekaiStation.rooms.pin')"
            :aria-label="pinned ? t('sekaiStation.rooms.unpin') : t('sekaiStation.rooms.pin')"
            :aria-pressed="pinned"
            @click="togglePin"
          >
            <LucidePin :class="pinned && 'fill-current'" aria-hidden="true" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="size-8 text-muted-foreground"
                :title="t('sekaiStation.rooms.more')"
                :aria-label="t('sekaiStation.rooms.more')"
              >
                <LucideEllipsis aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="min-w-44">
              <DropdownMenuItem @select="copyId">
                <LucideHash aria-hidden="true" />
                {{ t("sekaiStation.rooms.copyId") }}
              </DropdownMenuItem>
              <DropdownMenuItem @select="copyText">
                <LucideCopy aria-hidden="true" />
                {{ t("sekaiStation.rooms.copyText") }}
              </DropdownMenuItem>
              <DropdownMenuItem v-if="originalUrl" as-child>
                <a :href="originalUrl" target="_blank" rel="noopener noreferrer">
                  <LucideExternalLink aria-hidden="true" />
                  {{ t("sekaiStation.rooms.openOriginal") }}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem @select="togglePin">
                <component :is="pinned ? LucidePinOff : LucidePin" aria-hidden="true" />
                {{ pinned ? t("sekaiStation.rooms.unpin") : t("sekaiStation.rooms.pin") }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" @select="emit('block')">
                <LucideEyeOff aria-hidden="true" />
                {{ t("sekaiStation.rooms.block") }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <!-- Plain text only; kept on one line so template whitespace does not reach the pre-wrapped text -->
      <p
        v-if="room.msg"
        class="mt-0.5 whitespace-pre-wrap break-words text-card-foreground/90"
        :style="messageStyle"
      ><template v-for="(segment, index) in segments" :key="index"><mark v-if="segment.hit" class="rounded-sm bg-primary/15 px-0.5 text-foreground">{{ segment.text }}</mark><template v-else>{{ segment.text }}</template></template></p>

      <div v-if="extra?.data.length" class="mt-1.5 flex select-none flex-wrap gap-1">
        <span
          v-for="(value, index) in extra.data"
          :key="index"
          class="rounded-sm bg-muted/50 px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground"
        >{{ value }}</span>
      </div>
    </div>
  </article>
</template>
