<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideFlag } from "lucide-vue-next"
import type { SekaiRegion } from "@/types"
import CatalogDetailSection from "@/shared/components/catalog/CatalogDetailSection.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import type { SekaiAssetEndpointPreference } from "@/shared/sekai/types"
import { resolveEventTeamImageUrl } from "@/modules/events/lib/event-assets"
import type { CheerfulCarnivalTeam } from "@/modules/events/lib/event-extras"

/**
 * Cheerful Carnival teams with their emblem art. Parents hide the section
 * when the event has no teams (every non-carnival event).
 */
const props = defineProps<{
  teams: readonly CheerfulCarnivalTeam[]
  eventAssetbundleName: string | null
  region: SekaiRegion
  assetEndpoint: SekaiAssetEndpointPreference
}>()

const { t } = useI18n()

const rows = computed(() => props.teams.map((team) => ({
  team,
  image: resolveEventTeamImageUrl(props.region, props.eventAssetbundleName, team.assetbundleName, props.assetEndpoint),
})))
</script>

<template>
  <CatalogDetailSection
    :title="t('eventCatalog.teams.title')"
    :icon="LucideFlag"
    :empty="teams.length === 0"
    :empty-message="t('eventCatalog.teams.empty')"
  >
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div
        v-for="row in rows"
        :key="row.team.id"
        class="flex flex-col items-center gap-2 rounded-md border border-border/60 p-3"
      >
        <div class="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-muted/40">
          <SekaiAssetImage :sources="[row.image]" :alt="row.team.teamName" fit="contain" :placeholder-icon="LucideFlag" />
        </div>
        <span class="text-center text-sm font-medium">{{ row.team.teamName }}</span>
      </div>
    </div>
  </CatalogDetailSection>
</template>
