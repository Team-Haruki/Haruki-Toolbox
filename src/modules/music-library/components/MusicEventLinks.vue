<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { ChevronRight, PartyPopper } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { useNowTick } from "@/composables/useNowTick"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { resolveCatalogStatus } from "@/shared/components/catalog/types"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { MusicRelatedEvent } from "@/modules/music-library/composables/useMusicCatalogDetail"
import { useMusicDateFormatter } from "@/modules/music-library/composables/useMusicDateFormatter"
import { formatMusicDate, resolveMusicEventBoxView } from "@/modules/music-library/lib/music-view"
import MusicEventBoxHint from "./MusicEventBoxHint.vue"

/**
 * The events a song was featured in, as one slim link each (banner, name,
 * status, period and the "N箱" hint) for the song header. Renders nothing for
 * a song without events.
 */
const props = defineProps<{
  events: readonly MusicRelatedEvent[]
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  characterMap: ReadonlyMap<number, CatalogCharacter>
}>()

const { t } = useI18n()
const now = useNowTick(30_000)
const dateFormatter = useMusicDateFormatter()

const rows = computed(() => props.events.map(({ event, box }) => ({
  event,
  sources: [
    resolveEventBannerUrl(props.region, event.assetbundleName, props.preference),
    resolveEventLogoUrl(props.region, event.assetbundleName, props.preference),
  ],
  period: `${formatMusicDate(event.startAt, dateFormatter.value) ?? "?"} – ${formatMusicDate(event.aggregateAt, dateFormatter.value) ?? "?"}`,
  status: resolveCatalogStatus(event.startAt, event.aggregateAt, now.value),
  box: resolveMusicEventBoxView(box, props.characterMap),
})))
</script>

<template>
  <div v-if="rows.length > 0" class="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-start sm:gap-2.5" data-testid="music-detail-events">
    <p class="flex shrink-0 items-center gap-1.5 text-muted-foreground sm:mt-2.5">
      <PartyPopper class="size-4 shrink-0" aria-hidden="true" />
      {{ t("musicLibrary.detail.eventsTitle") }}
    </p>
    <ul class="flex min-w-0 flex-1 flex-col gap-1.5">
      <li v-for="row in rows" :key="row.event.id">
        <RouterLink
          :to="`/events/${row.event.id}`"
          class="flex items-center gap-2.5 rounded-lg border bg-background/70 p-1.5 pr-2 outline-none transition-colors hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-accent/30"
          data-slot="music-event-row"
        >
          <!-- The banner's own proportions (488 × 208): nothing is cropped. -->
          <div class="relative aspect-[488/208] w-24 shrink-0 overflow-hidden rounded-md bg-muted">
            <SekaiAssetImage :sources="row.sources" :alt="row.event.name" fit="contain" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex min-w-0 items-center gap-2">
              <p class="min-w-0 truncate text-sm font-medium">{{ row.event.name }}</p>
              <CatalogStatusBadge :status="row.status" size="sm" class="shrink-0" />
            </div>
            <div class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span class="tabular-nums">{{ row.period }}</span>
              <MusicEventBoxHint
                v-if="row.box"
                :character-id="row.box.characterId"
                :name="row.box.name"
                :box-number="row.box.boxNumber"
              />
            </div>
          </div>
          <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
