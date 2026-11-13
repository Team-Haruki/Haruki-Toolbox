<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideExternalLink, LucideSlidersHorizontal } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import StationControls from "@/modules/sekai-station/components/StationControls.vue"
import StationControlsDialog from "@/modules/sekai-station/components/StationControlsDialog.vue"
import StationRoomList from "@/modules/sekai-station/components/StationRoomList.vue"
import { useSekaiStationConnection } from "@/modules/sekai-station/composables/useSekaiStationConnection"
import { SEKAI_STATION_SITE_URL } from "@/modules/sekai-station/lib/sekai-station-constants"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"
import PageHeader from "@/shared/components/PageHeader.vue"

// The room list is the page. From 56rem the filter, the hidden numbers and the
// display options sit in a column beside it; below that they fold into a
// dialog opened from the list's status line.
const { t } = useI18n()
const feed = useSekaiStationConnection()
const prefs = useSekaiStationPrefsStore()

const controlsOpen = ref(false)
const controlsSection = ref<"blocked" | null>(null)

function openControls(section: "blocked" | null = null) {
  controlsSection.value = section
  controlsOpen.value = true
}

const blockedCount = computed(() => feed.blockedList.length)
const filterCount = computed(() => prefs.filterTerms.length)
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="@container/station mx-auto grid w-full max-w-6xl grid-cols-1 gap-4">
      <PageHeader :title="t('sekaiStation.title')">
        <p class="text-sm text-muted-foreground">
          {{ t("sekaiStation.description") }}
          <a
            :href="SEKAI_STATION_SITE_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 pointer-coarse:-my-2.5 pointer-coarse:py-2.5"
          >
            {{ t("sekaiStation.viewOnSekaiStation") }}
            <LucideExternalLink class="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        </p>
      </PageHeader>

      <div class="flex min-w-0 flex-col gap-4 @min-[56rem]/station:flex-row @min-[56rem]/station:items-start">
        <StationRoomList class="@min-[56rem]/station:flex-1">
          <template #actions>
            <div class="ml-auto flex items-center gap-1 @min-[56rem]/station:hidden">
              <!-- Only once something is hidden: it is where a room that just disappeared went -->
              <Button
                v-if="blockedCount > 0"
                type="button"
                variant="ghost"
                size="sm"
                class="tabular-nums text-muted-foreground"
                data-slot="station-blocked-button"
                @click="openControls('blocked')"
              >
                {{ t("sekaiStation.blocked.count", { n: blockedCount }) }}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-slot="station-controls-button"
                @click="openControls()"
              >
                <LucideSlidersHorizontal aria-hidden="true" />
                {{ t("sekaiStation.settings.title") }}
                <span
                  v-if="filterCount > 0"
                  class="-mr-1 inline-flex min-w-4.5 items-center justify-center rounded-full bg-primary/10 px-1 text-[11px] leading-4.5 font-semibold text-primary tabular-nums"
                >
                  <span aria-hidden="true">{{ filterCount }}</span>
                  <span class="sr-only">{{ t("sekaiStation.settings.activeCount", { n: filterCount }) }}</span>
                </span>
              </Button>
            </div>
          </template>
        </StationRoomList>

        <aside
          v-if="feed.configured"
          class="hidden max-h-[calc(100dvh-5.25rem)] w-80 shrink-0 overflow-y-auto overscroll-contain rounded-xl border bg-card @min-[56rem]/station:sticky @min-[56rem]/station:top-17 @min-[56rem]/station:block"
          :aria-label="t('sekaiStation.settings.title')"
          data-slot="station-side"
        >
          <StationControls />
        </aside>
      </div>

      <StationControlsDialog v-model:open="controlsOpen" :section="controlsSection" />
    </div>
  </div>
</template>
