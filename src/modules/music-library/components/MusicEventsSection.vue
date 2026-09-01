<script setup lang="ts">
import { computed } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { ChevronRight, PartyPopper } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import { useNowTick } from "@/composables/useNowTick"
import { resolveEventBannerUrl, resolveEventLogoUrl } from "@/modules/events"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import CatalogStatusBadge from "@/shared/components/catalog/CatalogStatusBadge.vue"
import { resolveCatalogStatus } from "@/shared/components/catalog/types"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { CatalogCharacter } from "@/shared/sekai/catalog"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import type { MusicRelatedEvent } from "@/modules/music-library/composables/useMusicCatalogDetail"
import { useMusicDateFormatter } from "@/modules/music-library/composables/useMusicDateFormatter"
import { formatMusicDate, resolveMusicEventBoxView } from "@/modules/music-library/lib/music-view"
import MusicEventBoxHint from "./MusicEventBoxHint.vue"

/** Events the song was featured in: banner, period, status and the "N箱" hint. */
const props = defineProps<{
  events: readonly MusicRelatedEvent[]
  region: SekaiRegion
  preference: SekaiAssetEndpointPreference
  characterMap: ReadonlyMap<number, CatalogCharacter>
  loading: boolean
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
  <CatalogDetailSection
    :title="t('musicLibrary.detail.eventsTitle')"
    :icon="PartyPopper"
    :loading="loading && events.length === 0"
    :empty="events.length === 0"
    :empty-message="t('musicCatalog.detail.events.empty')"
    content-class="flex flex-col gap-2"
  >
    <RouterLink
      v-for="row in rows"
      :key="row.event.id"
      :to="`/events/${row.event.id}`"
      class="flex items-center gap-3 rounded-md border bg-muted/20 p-2.5 transition-colors hover:bg-accent/50 dark:hover:bg-accent/30"
      data-slot="music-event-row"
    >
      <div class="relative aspect-[2/1] w-28 shrink-0 overflow-hidden rounded-md bg-muted sm:w-36">
        <SekaiAssetImage :sources="row.sources" :alt="row.event.name" fit="cover" />
      </div>
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex min-w-0 flex-wrap items-center gap-2">
          <p class="min-w-0 truncate text-sm font-medium">{{ row.event.name }}</p>
          <CatalogStatusBadge :status="row.status" size="sm" />
        </div>
        <p class="text-xs text-muted-foreground tabular-nums">{{ row.period }}</p>
        <MusicEventBoxHint
          v-if="row.box"
          :character-id="row.box.characterId"
          :name="row.box.name"
          :box-number="row.box.boxNumber"
          class="flex"
        />
      </div>
      <ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </RouterLink>
  </CatalogDetailSection>
</template>
