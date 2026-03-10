import type { SekaiRegion } from "@/types/store"

type TranslateFn = (key: string, params?: Record<string, unknown>) => string

export const SEKAI_REGIONS: readonly SekaiRegion[] = ["jp", "en", "tw", "kr", "cn"]

const SEKAI_REGION_SET = new Set<string>(SEKAI_REGIONS)

export const SEKAI_REGION_LABEL_KEYS: Record<SekaiRegion, string> = {
  jp: "userSettings.gameBinding.region.jp",
  en: "userSettings.gameBinding.region.en",
  tw: "userSettings.gameBinding.region.tw",
  kr: "userSettings.gameBinding.region.kr",
  cn: "userSettings.gameBinding.region.cn",
}

export const SEKAI_REGION_OPTIONS: ReadonlyArray<{ value: SekaiRegion; labelKey: string }> =
  SEKAI_REGIONS.map((value) => ({
    value,
    labelKey: SEKAI_REGION_LABEL_KEYS[value],
  }))

export function isSekaiRegion(value: unknown): value is SekaiRegion {
  return typeof value === "string" && SEKAI_REGION_SET.has(value)
}

export function normalizeSekaiRegion(value: unknown): SekaiRegion | null {
  if (typeof value !== "string") return null

  const normalized = value.toLowerCase()
  return isSekaiRegion(normalized) ? normalized : null
}

export function resolveSekaiRegionLabel(region: string, t: TranslateFn) {
  if (!isSekaiRegion(region)) return region
  return t(SEKAI_REGION_LABEL_KEYS[region])
}
