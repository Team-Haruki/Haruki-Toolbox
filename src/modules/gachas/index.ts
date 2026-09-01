export * from "./routes"

export {
  buildGachaLogoCandidates,
  normalizeCatalogGachas,
  type CatalogGacha,
} from "./lib/gacha-catalog"

export {
  GACHAS_INDEX_FILES,
  GACHAS_INDEX_KEY,
  buildGachasIndex,
  normalizeCatalogGachaSummary,
  useGachasIndex,
  type CatalogGachaSummary,
  type GachasIndex,
} from "./composables/useGachasIndex"
