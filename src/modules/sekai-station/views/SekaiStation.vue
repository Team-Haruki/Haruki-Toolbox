<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideExternalLink, LucideSend } from "lucide-vue-next"
import StationRoomList from "@/modules/sekai-station/components/StationRoomList.vue"
import StationToolbar from "@/modules/sekai-station/components/StationToolbar.vue"
import { useSekaiStationConnection } from "@/modules/sekai-station/composables/useSekaiStationConnection"
import { SEKAI_STATION_SITE_URL } from "@/modules/sekai-station/lib/sekai-station-constants"

const { t } = useI18n()
useSekaiStationConnection()
</script>

<template>
  <div class="@container mx-auto flex w-full max-w-3xl flex-col gap-4">
    <!-- The toolbar sits under the description in a narrow column (phones, or
         a tablet with the sidebar open), at the bottom right once both fit -->
    <header class="flex flex-col gap-3 @2xl:flex-row @2xl:items-end @2xl:justify-between @2xl:gap-6">
      <div class="min-w-0 space-y-1">
        <h1 class="flex items-center gap-2 text-2xl font-bold">
          <LucideSend class="size-6 text-primary" aria-hidden="true" />
          {{ t("sekaiStation.title") }}
        </h1>
        <p class="text-sm text-muted-foreground">
          {{ t("sekaiStation.description") }}
          <a
            :href="SEKAI_STATION_SITE_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 rounded-sm font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {{ t("sekaiStation.viewOnSekaiStation") }}
            <LucideExternalLink class="size-3.5 shrink-0" aria-hidden="true" />
          </a>
        </p>
      </div>
      <StationToolbar class="@2xl:shrink-0" />
    </header>

    <StationRoomList />
  </div>
</template>
