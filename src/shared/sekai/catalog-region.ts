import { computed, watch, type ComputedRef } from "vue"
import { storeToRefs } from "pinia"
import { useRoute, useRouter, type LocationQuery } from "vue-router"
import type { SekaiRegion } from "@/types"
import { isSekaiRegion } from "@/lib/sekai-region"
import { useSettingsStore, type SekaiCatalogRegionMode } from "@/shared/stores/settings"
import { useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"

export const SEKAI_CATALOG_REGION_FOLLOW_VALUE = "follow"

/**
 * The query key catalog pages carry their server in (`/cards?region=tw`), so a
 * copied link opens the same data for the recipient instead of their own
 * default region (where the id may not exist).
 */
export const CATALOG_REGION_QUERY_KEY = "region"

/** The region a catalog link names, or null when the query has none / an unknown one. */
export function readCatalogRegionQuery(query: LocationQuery): SekaiRegion | null {
  const raw = query[CATALOG_REGION_QUERY_KEY]
  const value = Array.isArray(raw) ? raw[0] : raw
  return isSekaiRegion(value) ? value : null
}

/**
 * Call first in a catalog page's setup: a link that names a server switches
 * the catalog region to it before any data composable reads the region, so
 * the page loads that server's data once instead of the default and then the
 * link's. Only catalog pages call it; other pages (rank border) use the same
 * key for their own purposes.
 */
export function applyCatalogRegionQuery(): void {
  const route = useRoute()
  const region = readCatalogRegionQuery(route.query)
  if (!region) {
    return
  }
  const { region: effective, updateSelectorValue } = useEffectiveCatalogRegion()
  if (effective.value !== region) {
    updateSelectorValue(region)
  }
}

/**
 * Keeps `?region=` on the current catalog URL equal to the region in use
 * (also after a region switch), so the address bar is always a shareable
 * link. `router.replace`: no history entry.
 */
export function useCatalogRegionQuerySync(region: ComputedRef<SekaiRegion>): void {
  const route = useRoute()
  const router = useRouter()
  const ownedPath = route.path
  watch(
    () => [region.value, readCatalogRegionQuery(route.query), route.query[CATALOG_REGION_QUERY_KEY]] as const,
    ([current, inQuery]) => {
      if (router.currentRoute.value.path !== ownedPath || inQuery === current) {
        return
      }
      void router.replace({ query: { ...route.query, [CATALOG_REGION_QUERY_KEY]: current } })
    },
    { immediate: true },
  )
}

export function resolveEffectiveCatalogRegion(
  mode: SekaiCatalogRegionMode,
  manualRegion: SekaiRegion,
  accountServer: SekaiRegion | null | undefined,
): SekaiRegion {
  if (mode === "follow" && accountServer) {
    return accountServer
  }

  return manualRegion
}

export type UseEffectiveCatalogRegionResult = {
  /** The region catalog pages should actually read masterdata from. */
  region: ComputedRef<SekaiRegion>
  mode: ComputedRef<SekaiCatalogRegionMode>
  /** Selector model value: the follow sentinel or the manual region. */
  selectorValue: ComputedRef<string>
  /** Applies a selector change: the follow sentinel or a concrete region. */
  updateSelectorValue: (value: unknown) => void
}

export function useEffectiveCatalogRegion(): UseEffectiveCatalogRegionResult {
  const settingsStore = useSettingsStore()
  const { sekaiCatalogRegion, sekaiCatalogRegionMode } = storeToRefs(settingsStore)
  const { selectedAccount } = useGameAccountSelection()

  const region = computed(() =>
    resolveEffectiveCatalogRegion(
      sekaiCatalogRegionMode.value,
      sekaiCatalogRegion.value,
      selectedAccount.value?.server ?? null,
    ),
  )

  return {
    region,
    mode: computed(() => sekaiCatalogRegionMode.value),
    selectorValue: computed(() =>
      sekaiCatalogRegionMode.value === "follow" ? SEKAI_CATALOG_REGION_FOLLOW_VALUE : sekaiCatalogRegion.value,
    ),
    updateSelectorValue: (value: unknown) => {
      if (value === SEKAI_CATALOG_REGION_FOLLOW_VALUE) {
        settingsStore.setSekaiCatalogRegionFollowAccount()
        return
      }
      if (isSekaiRegion(value)) {
        settingsStore.setSekaiCatalogRegion(value)
      }
    },
  }
}
