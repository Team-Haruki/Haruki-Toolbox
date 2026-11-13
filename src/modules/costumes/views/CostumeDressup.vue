<script setup lang="ts">
import { computed, ref, shallowRef, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import {
  LucideCrown,
  LucideImage,
  LucideLink,
  LucidePersonStanding,
  LucideRefreshCcw,
  LucideRotateCcw,
  LucideRotateCw,
  LucideZoomIn,
  LucideZoomOut,
  LucideScissors,
  LucideSearch,
  LucideShirt,
  LucideUndo2,
  LucideUsers,
} from "lucide-vue-next"
import type { AcceptableValue } from "reka-ui"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { usePagedSlice } from "@/composables/usePagedSlice"
import CatalogCharacterPicker from "@/shared/components/catalog/CatalogCharacterPicker.vue"
import CatalogChipsField from "@/shared/components/catalog/CatalogChipsField.vue"
import CatalogDownloadProgress from "@/shared/components/catalog/CatalogDownloadProgress.vue"
import CatalogFilterPanel, { type CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import type { CatalogFieldOption } from "@/shared/components/catalog/types"
import CatalogErrorState from "@/shared/components/catalog/CatalogErrorState.vue"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import CatalogRegionSelect from "@/shared/components/catalog/CatalogRegionSelect.vue"
import { buildCatalogCharacterMap, resolveSekaiCharacterColor, SEKAI_UNITS, type CatalogCharacter } from "@/shared/sekai/catalog"
import { resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import { loadMasterFilesCacheFirst } from "@/shared/sekai/master-loader"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import { resolveCostumeThumbnailUrl } from "@/shared/sekai/data-sources"
import { applyCatalogRegionQuery, useCatalogRegionQuerySync, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import CostumeViewer, { type CostumeViewerBackground, type CostumeViewerRecipe } from "../components/CostumeViewer.vue"
import { useCostumeRoleData } from "../composables/useCostumeRoleData"
import { COSTUME_SLOTS, pickDefaultOptionId, type CostumeSlot, type RuntimeCostumeOption } from "../lib/costume-options"
import { NONE_HEAD_COSTUME3D_IDS, orderBySeries, type SeriesContext, type WornPart } from "../lib/costume-series-order"
import { hairForHead, headForHair, type HeadHairRules } from "../lib/costume-head-hair"
import { MOTION_FOLLOW, motionValue, orderMotions, parseMotionValue } from "../lib/costume-motions"
import {
  CARD_SUPPLIES,
  COSTUME_SOURCES,
  costumeFilterCount,
  costumeRegionBadge,
  costumeYearOptions,
  emptyCostumeFilters,
  isCostumeReleased,
  matchesCostumeFilters,
  UNKNOWN_YEAR,
  type CardSupplyFilter,
  type CostumeFilters,
  type CostumeSourceKind,
} from "../lib/costume-filters"

const { t, te } = useI18n()
const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const sekaiDataStore = useSekaiDataStore()

// A shared link names its server (`?region=`): apply it before the region is
// read, and keep the address bar naming the server in use.
applyCatalogRegionQuery()
const { region } = useEffectiveCatalogRegion()
useCatalogRegionQuerySync(region)
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

// Only character names/units come from masterdata; the selectable parts and
// per-role defaults come from the deployed 3D runtime registry instead.
const DRESSUP_MASTER_FILES = ["gameCharacters"] as const

const loading = ref(false)
const error = ref<string | null>(null)
const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())
/**
 * Characters whose CostumeShop changes unit (gameCharacters.supportUnitType "full", CostumeUtility.IsChangeableUnit:
 * only Miku); every other character, the other Virtual Singers included, stays on its own unit.
 */
const unitChangeableIds = shallowRef<Set<number>>(new Set())

let loadToken = 0

async function loadMaster(targetRegion: SekaiRegion) {
  const token = ++loadToken
  loading.value = true
  error.value = null
  try {
    // Cache first: a cached roster renders at once and a failed remote check
    // keeps it, instead of the strip waiting out the retries on a dead CDN.
    await loadMasterFilesCacheFirst({
      region: targetRegion,
      files: DRESSUP_MASTER_FILES,
      ensure: () => sekaiDataStore.ensureRegionData(targetRegion, { files: DRESSUP_MASTER_FILES, musicMetas: false }),
      isCurrent: () => token === loadToken,
      apply: (files) => {
        characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
        unitChangeableIds.value = new Set(
          (files.gameCharacters as { id?: unknown; supportUnitType?: unknown }[])
            .filter((character) => character.supportUnitType === "full" && typeof character.id === "number")
            .map((character) => character.id as number),
        )
      },
    })
  } catch (loadError) {
    if (token === loadToken) {
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    }
  } finally {
    if (token === loadToken) {
      loading.value = false
    }
  }
}

watch(region, (nextRegion) => {
  void loadMaster(nextRegion)
}, { immediate: true })

function queryNumber(name: string): number | null {
  const raw = route.query[name]
  const value = Number(Array.isArray(raw) ? raw[0] : raw)
  return Number.isInteger(value) && value > 0 ? value : null
}

const characterId = ref<number>(queryNumber("characterId") ?? 1)
const bodyId = ref<number | null>(queryNumber("body"))
const headId = ref<number | null>(queryNumber("head"))
const hairId = ref<number | null>(queryNumber("hair"))

function queryUnit(): string | null {
  const raw = route.query.unit
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === "string" && (SEKAI_UNITS as readonly string[]).includes(value) ? value : null
}

function queryMotion(): string {
  const raw = route.query.motion
  const value = Array.isArray(raw) ? raw[0] : raw
  return typeof value === "string" && parseMotionValue(value) != null ? value : MOTION_FOLLOW
}

/**
 * A Virtual Singer's unit version (`?unit=`): each unit is a role of its own, with its own models of the same
 * costumes, preset and CostumeShop motion. Null is the character's own unit.
 */
const unitOverride = ref<string | null>(queryUnit())
/**
 * The motion the stage plays (`?motion=<type>:<characterId>:<unit>`): any character's CostumeShop or Live result
 * motion, or a preview loop; by default the current role's own CostumeShop motion.
 */
const motionChoice = ref<string>(queryMotion())

const BACKGROUNDS = ["archive", "transparent"] as const satisfies readonly CostumeViewerBackground[]

/** `?bg=plain`: the plain frame instead of the game's backdrop. */
function queryBackground(): CostumeViewerBackground {
  return route.query.bg === "plain" ? "transparent" : "archive"
}

const background = ref<CostumeViewerBackground>(queryBackground())

/** `?part=accessory`: only the head accessory's model, loaded without the character. */
const accessoryOnly = ref(route.query.part === "accessory")

function setBackground(value: AcceptableValue) {
  if (typeof value === "string" && (BACKGROUNDS as readonly string[]).includes(value)) {
    background.value = value as CostumeViewerBackground
  }
}

const defaultUnit = computed<string | null>(() => characterMap.value.get(characterId.value)?.unit ?? null)
const roleCharacterId = computed<number | null>(() => characterId.value)
// Only a character whose CostumeShop changes unit (Miku) has other unit versions.
const roleUnit = computed<string | null>(() =>
  unitChangeableIds.value.has(characterId.value) && unitOverride.value != null ? unitOverride.value : defaultUnit.value,
)

const {
  data: roleData,
  loading: roleLoading,
  error: roleError,
  reload: reloadRole,
} = useCostumeRoleData(region, roleCharacterId, roleUnit)

/** Fill empty/foreign selections with the role's stock parts. */
watch(roleData, (data) => {
  if (data == null) {
    return
  }
  const slots: Array<[typeof bodyId, CostumeSlot, number | undefined]> = [
    [bodyId, "body", data.defaults?.bodyCostume3dId],
    [headId, "head", data.defaults?.headCostume3dId],
    [hairId, "hair", data.defaults?.hairCostume3dId],
  ]
  for (const [selection, slot, defaultId] of slots) {
    const options = data.options[slot]
    if (options.length === 0) {
      selection.value = null
      continue
    }
    if (selection.value == null || !options.some((option) => option.id === selection.value)) {
      selection.value = pickDefaultOptionId(options, defaultId)
    }
  }
}, { immediate: true })

function resetToDefaults() {
  const data = roleData.value
  if (data == null) {
    return
  }
  bodyId.value = pickDefaultOptionId(data.options.body, data.defaults?.bodyCostume3dId)
  headId.value = pickDefaultOptionId(data.options.head, data.defaults?.headCostume3dId)
  hairId.value = pickDefaultOptionId(data.options.hair, data.defaults?.hairCostume3dId)
}

/** The unit versions the stage offers: the character's units, when it has more than one. */
const unitOptions = computed<string[]>(() => {
  const units = roleData.value?.units ?? []
  return units.length > 1 ? units : []
})

function setUnit(value: AcceptableValue) {
  if (typeof value === "string") {
    unitOverride.value = value === defaultUnit.value ? null : value
  }
}

function setMotion(value: string | null) {
  if (value != null && parseMotionValue(value) != null) {
    motionChoice.value = value
  }
}

/** Every motion of the content, each character's together, with the character's icon; the default first. */
const motionOptions = computed<ComboboxOption[]>(() => {
  const typeLabel = (type: string) => t(`costumes.dressup.motions.${type}`)
  const options: ComboboxOption[] = [{
    value: MOTION_FOLLOW,
    label: t("costumes.dressup.motions.follow"),
    description: t("costumes.dressup.motions.followHint"),
  }]
  for (const motion of orderMotions(roleData.value?.motions ?? [])) {
    if (motion.characterId == null) {
      options.push({
        value: motionValue(motion),
        label: t(`costumes.dressup.motions.preview_${motion.figure}`),
      })
      continue
    }
    const character = characterMap.value.get(motion.characterId)
    const name = character?.name ?? `#${motion.characterId}`
    // A Virtual Singer's motion in another unit names that unit.
    const unitLabel = motion.unit != null && motion.unit !== character?.unit ? resolveSekaiUnitLabel({ t, te }, motion.unit) : null
    // The type leads, so the closed picker still says which of the character's motions plays.
    options.push({
      value: motionValue(motion),
      label: [typeLabel(motion.motionType), name, ...(unitLabel ? [unitLabel] : [])].join(" · "),
      iconUrl: character?.iconUrl ?? null,
      keywords: [typeLabel(motion.motionType), ...(motion.unit ? [resolveSekaiUnitLabel({ t, te }, motion.unit)] : [])],
    })
  }
  return options
})

const characters = computed<CatalogCharacter[]>(() =>
  [...characterMap.value.values()].sort((a, b) => a.id - b.id),
)
const characterOptions = characters
const currentCharacter = computed(() => characterMap.value.get(characterId.value) ?? null)

// --- The rack: one slot at a time, thumbnails, a search box ---------------

const SLOT_ICONS = { body: LucideShirt, head: LucideCrown, hair: LucideScissors } as const

const activeSlot = ref<CostumeSlot>("body")
const query = ref("")

function setActiveSlot(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && (COSTUME_SLOTS as readonly string[]).includes(value)) {
    activeSlot.value = value as CostumeSlot
  }
}

function slotOptions(slot: CostumeSlot): RuntimeCostumeOption[] {
  return roleData.value?.options[slot] ?? []
}

// --- Filters: source, origin character, year, region exclusivity ---------
// From the mirror's costume3dSources (jp's values for every costume jp has too); a mirror whose slices carry none
// shows no filter panel.

const filterId = useId()
const filters = ref<CostumeFilters>(emptyCostumeFilters())
const sourceById = computed(() => roleData.value?.sourceById ?? new Map())
const hasSources = computed(() => sourceById.value.size > 0)
/** jp is the reference: it has no exclusive costumes. */
const exclusiveAvailable = computed(() => region.value !== "jp")
const effectiveFilters = computed<CostumeFilters>(() =>
  exclusiveAvailable.value ? filters.value : { ...filters.value, regionExclusive: false })
const filterCount = computed(() => (hasSources.value ? costumeFilterCount(effectiveFilters.value) : 0))

const sourceOptions = computed<CatalogFieldOption[]>(() =>
  COSTUME_SOURCES.map((value) => ({ value, label: t(`costumes.dressup.filters.sources.${value}`) })))
const yearOptions = computed<CatalogFieldOption[]>(() =>
  // The years of the costumes on the rack (an unreleased one is held back, its year too).
  costumeYearOptions([...sourceById.value.values()].filter((source) => isCostumeReleased(source, Date.now())))
    .map((value) => ({ value, label: yearLabel(value) })))

function yearLabel(year: string): string {
  return year === UNKNOWN_YEAR ? t("costumes.dressup.filters.unknownYear") : year
}

function patchFilters(patch: Partial<CostumeFilters>) {
  filters.value = { ...filters.value, ...patch }
}

function setSources(values: string[]) {
  patchFilters({ sources: values.filter((value): value is CostumeSourceKind => (COSTUME_SOURCES as readonly string[]).includes(value)) })
}

function setCardSupply(value: AcceptableValue | AcceptableValue[] | undefined) {
  // Deselecting the active chip goes back to all.
  patchFilters({ cardSupply: (CARD_SUPPLIES as readonly unknown[]).includes(value) ? (value as CardSupplyFilter) : "all" })
}

function resetFilters() {
  filters.value = emptyCostumeFilters()
}

/** The active filters as chips, shown while the panel is collapsed. */
const filterChips = computed<CatalogActiveChip[]>(() => {
  if (!hasSources.value) {
    return []
  }
  const state = effectiveFilters.value
  const chips: CatalogActiveChip[] = state.sources.map((source) => ({
    key: `source:${source}`,
    label: source === "card" && state.cardSupply !== "all"
      ? `${t("costumes.dressup.filters.sources.card")} · ${t(`costumes.dressup.filters.cardSupplies.${state.cardSupply}`)}`
      : t(`costumes.dressup.filters.sources.${source}`),
  }))
  for (const id of state.originCharacterIds) {
    chips.push({ key: `origin:${id}`, label: characterMap.value.get(id)?.name ?? `#${id}` })
  }
  for (const year of state.years) {
    chips.push({ key: `year:${year}`, label: yearLabel(year) })
  }
  if (state.regionExclusive) {
    chips.push({ key: "exclusive", label: t("costumes.dressup.filters.regionExclusive") })
  }
  return chips
})

function removeFilterChip(key: string) {
  const [kind, value = ""] = key.split(":")
  const state = filters.value
  if (kind === "source") {
    patchFilters({ sources: state.sources.filter((source) => source !== value), ...(value === "card" ? { cardSupply: "all" } : {}) })
  } else if (kind === "origin") {
    patchFilters({ originCharacterIds: state.originCharacterIds.filter((id) => String(id) !== value) })
  } else if (kind === "year") {
    patchFilters({ years: state.years.filter((year) => year !== value) })
  } else if (kind === "exclusive") {
    patchFilters({ regionExclusive: false })
  }
}

function regionBadge(option: RuntimeCostumeOption): string | null {
  return costumeRegionBadge(sourceById.value.get(option.id))
}

const visibleOptions = computed<RuntimeCostumeOption[]>(() => {
  const needle = query.value.trim().toLowerCase()
  const filtering = filterCount.value > 0
  const options = filtering
    ? slotOptions(activeSlot.value).filter((option) => matchesCostumeFilters(sourceById.value.get(option.id), effectiveFilters.value))
    : slotOptions(activeSlot.value)
  if (!needle) {
    return options
  }
  return options.filter((option) =>
    String(option.id).includes(needle)
    || option.name.toLowerCase().includes(needle)
    || option.colorName.toLowerCase().includes(needle),
  )
})

/**
 * One rack tile per costume, its colour variants folded in. The runtime
 * registry lists every colour as its own `costume3dId`, which is what the
 * old dropdown showed as four adjacent "スクールロック" rows; the shared
 * `costume3dGroupId` is the costume.
 */
type RackGroup = { key: string; name: string; options: RuntimeCostumeOption[] }

function groupKey(option: RuntimeCostumeOption): string {
  return option.costume3dGroupId != null ? `g:${option.costume3dGroupId}` : `id:${option.id}`
}

/**
 * The game's list order (CostumeSelectSortOrder): the worn costume first, then the costumes of the same series as the
 * other two worn parts. Taken when a list opens (slot, character or unit change), like the game, so picking within a
 * list does not reshuffle it under the pointer.
 */
const seriesRank = shallowRef<Map<string, number>>(new Map())

function wornPart(slot: CostumeSlot, id: number | null): WornPart {
  if (id == null) {
    return null
  }
  const option = roleData.value?.options[slot].find((candidate) => candidate.id === id)
  return { id, costume3dGroupId: option?.costume3dGroupId ?? null }
}

function rankSeries() {
  const data = roleData.value
  if (data == null) {
    seriesRank.value = new Map()
    return
  }
  const slot = activeSlot.value
  const cells = new Map<string, RuntimeCostumeOption[]>()
  for (const option of data.options[slot]) {
    const key = groupKey(option)
    cells.set(key, [...(cells.get(key) ?? []), option])
  }
  const context: SeriesContext = {
    body: wornPart("body", bodyId.value),
    head: wornPart("head", headId.value),
    hair: wornPart("hair", hairId.value),
    notAvailable: data.notAvailable,
  }
  const ordered = orderBySeries([...cells.entries()], slot, context, ([, options]) => {
    // The cell's default costume: its first colour.
    const first = [...options].sort((a, b) => (a.colorId ?? 0) - (b.colorId ?? 0) || a.id - b.id)[0]!
    return { representativeId: first.id, costume3dGroupId: first.costume3dGroupId, ids: options.map((option) => option.id) }
  })
  seriesRank.value = new Map(ordered.map(([key], index) => [key, index]))
}

const visibleGroups = computed<RackGroup[]>(() => {
  const groups = new Map<string, RackGroup>()
  for (const option of visibleOptions.value) {
    const key = groupKey(option)
    const group = groups.get(key)
    if (group) {
      group.options.push(option)
    } else {
      groups.set(key, { key, name: option.name, options: [option] })
    }
  }
  for (const group of groups.values()) {
    group.options.sort((a, b) => (a.colorId ?? 0) - (b.colorId ?? 0) || a.id - b.id)
  }
  const rank = seriesRank.value
  return [...groups.values()]
    .map((group, index) => ({ group, index, rank: rank.get(group.key) ?? Number.MAX_SAFE_INTEGER }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.group)
})

// The body and accessory slots hold every colour variant the runtime ships —
// ~2.7k entries for a character — so the rack pages, and follows the current
// selection to whatever page it sits on when the slot or character changes.
const RACK_PAGE_SIZE = 48
const page = ref(1)
const pageSize = ref(RACK_PAGE_SIZE)
const rackAnchor = ref<HTMLElement | null>(null)
const { pageItems: pagedGroups, totalPages, currentPage } = usePagedSlice(visibleGroups, page, pageSize)

const selectedId = computed(() => {
  switch (activeSlot.value) {
    case "body": return bodyId.value
    case "head": return headId.value
    default: return hairId.value
  }
})

function showSelectedPage() {
  const index = visibleGroups.value.findIndex((group) => group.options.some((option) => option.id === selectedId.value))
  page.value = index >= 0 ? Math.floor(index / pageSize.value) + 1 : 1
}

/** The colour a tile shows: the selected one when the group is worn, else its first. */
function activeOption(group: RackGroup): RuntimeCostumeOption {
  return group.options.find((option) => option.id === selectedId.value) ?? group.options[0]
}

function isGroupSelected(group: RackGroup): boolean {
  return group.options.some((option) => option.id === selectedId.value)
}

watch([query, effectiveFilters], () => {
  page.value = 1
})
// After the stock-part watcher above has filled the selection of a new role.
watch([activeSlot, () => roleData.value], rankSeries, { immediate: true })
watch([activeSlot, () => roleData.value, selectedId, seriesRank], showSelectedPage, { immediate: true })

function headHairRules(): HeadHairRules | null {
  const data = roleData.value
  return data ? { notAvailable: data.notAvailable, defaultHairs: data.defaultHairs } : null
}

/**
 * Wearing a head that overrides the hair (a full head set, or one the hair cannot go with) also picks the hair it
 * brings; picking a hair the worn head overrides takes the head off (the unset head, or the role's default).
 */
function selectOption(id: number) {
  const rules = headHairRules()
  const options = roleData.value?.options
  switch (activeSlot.value) {
    case "body":
      bodyId.value = id
      break
    case "head": {
      headId.value = id
      const head = options?.head.find((option) => option.id === id)
      if (rules && head && options) {
        hairId.value = hairForHead(head, hairId.value, rules, new Set(options.hair.map((option) => option.id)))
      }
      break
    }
    default: {
      hairId.value = id
      if (rules && options) {
        const head = options.head.find((option) => option.id === headId.value) ?? null
        headId.value = headForHair(head, id, rules, options.head, roleData.value?.defaults?.headCostume3dId ?? null)
      }
    }
  }
}

function thumbnailSources(option: RuntimeCostumeOption): string[] {
  if (!option.thumbnailAssetbundleName) {
    return []
  }
  const sources = [resolveCostumeThumbnailUrl(region.value, option.thumbnailAssetbundleName, assetEndpoint.value)]
  // Regional asset mirrors miss some costume thumbnails; the jp mirror is the superset.
  if (region.value !== "jp") {
    sources.push(resolveCostumeThumbnailUrl("jp", option.thumbnailAssetbundleName, assetEndpoint.value))
  }
  return sources
}

/** What is on the model right now, by name, for the caption under the stage. */
const currentOutfit = computed(() => {
  const names = roleData.value?.nameById
  const label = (id: number | null) => (id != null ? names?.get(id)?.name ?? `#${id}` : null)
  return { body: label(bodyId.value), head: label(headId.value), hair: label(hairId.value) }
})

// --- Stage controls ---------------------------------------------------------

const viewerRef = ref<InstanceType<typeof CostumeViewer> | null>(null)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success(t("costumes.dressup.linkCopied"))
  } catch {
    toast.error(t("costumes.dressup.linkCopyFailed"))
  }
}

function selectCharacter(id: number) {
  if (id !== characterId.value && characterMap.value.has(id)) {
    characterId.value = id
    unitOverride.value = null
    bodyId.value = null
    headId.value = null
    hairId.value = null
    query.value = ""
  }
}

// Full head sets ship their own hairstyle, so the hair slot has no effect
// while one is selected (in-game behavior).
/**
 * The head slot holds an accessory of its own. A full head set has none to show alone: its head piece is part of the
 * set's Hair mesh.
 */
const hasStandaloneAccessory = computed(() => {
  const option = roleData.value?.options.head.find((candidate) => candidate.id === headId.value)
  return option != null && !option.includesHair && !NONE_HEAD_COSTUME3D_IDS.has(option.id)
})

const showingAccessoryOnly = computed(() => accessoryOnly.value && hasStandaloneAccessory.value)

/**
 * The character's own head of a costume (a head_and_hair set for this role's unit, thumbnail `*_unique_head`), not
 * the accessory every character gets with it.
 */
function isExclusiveHead(group: RackGroup): boolean {
  return activeOption(group).includesHair
}

/**
 * The game's hairstyle label (CostumeSelectCell.labelHairStyle): this head cannot be worn with the hair worn now
 * (costume3dModelNotAvailablePatterns), so wearing it changes the hair.
 */
function isHairStyleHead(group: RackGroup): boolean {
  const notAvailable = roleData.value?.notAvailable
  return notAvailable != null && hairId.value != null && notAvailable.has(`${activeOption(group).id}|${hairId.value}`)
}

const hairLocked = computed(() =>
  roleData.value?.options.head.find((option) => option.id === headId.value)?.includesHair === true,
)

const recipe = computed<CostumeViewerRecipe | null>(() => {
  const unit = roleUnit.value
  if (unit == null || bodyId.value == null || headId.value == null || hairId.value == null) {
    return null
  }

  return {
    characterId: characterId.value,
    unit,
    bodyCostume3dId: bodyId.value,
    headCostume3dId: headId.value,
    hairCostume3dId: hairId.value,
    ...parseMotionValue(motionChoice.value),
    accessoryOnly: showingAccessoryOnly.value,
  }
})

// Keep the URL shareable without polluting history.
watch([characterId, bodyId, headId, hairId, unitOverride, motionChoice, background, accessoryOnly], ([nextCharacter, nextBody, nextHead, nextHair, nextUnit, nextMotion, nextBackground, nextAccessoryOnly]) => {
  void router.replace({
    query: {
      ...route.query,
      characterId: String(nextCharacter),
      unit: nextUnit ?? undefined,
      motion: nextMotion !== MOTION_FOLLOW ? nextMotion : undefined,
      bg: nextBackground === "transparent" ? "plain" : undefined,
      part: nextAccessoryOnly ? "accessory" : undefined,
      body: nextBody != null ? String(nextBody) : undefined,
      head: nextHead != null ? String(nextHead) : undefined,
      hair: nextHair != null ? String(nextHair) : undefined,
    },
  })
})

// URL → state: the layout no longer remounts on query-only navigations, so
// deep links and back/forward through the replace-written URLs resync here.
// Same-value writes are skipped, which also breaks the loop with the
// state → URL watcher above.
watch(() => route.query, () => {
  const nextCharacter = queryNumber("characterId") ?? characterId.value
  const nextBody = queryNumber("body")
  const nextHead = queryNumber("head")
  const nextHair = queryNumber("hair")
  const nextUnit = queryUnit()
  const nextMotion = queryMotion()
  if (characterId.value !== nextCharacter) {
    characterId.value = nextCharacter
  }
  if (unitOverride.value !== nextUnit) {
    unitOverride.value = nextUnit
  }
  if (motionChoice.value !== nextMotion) {
    motionChoice.value = nextMotion
  }
  const nextBackground = queryBackground()
  if (background.value !== nextBackground) {
    background.value = nextBackground
  }
  const nextAccessoryOnly = route.query.part === "accessory"
  if (accessoryOnly.value !== nextAccessoryOnly) {
    accessoryOnly.value = nextAccessoryOnly
  }
  if (bodyId.value !== nextBody) {
    bodyId.value = nextBody
  }
  if (headId.value !== nextHead) {
    headId.value = nextHead
  }
  if (hairId.value !== nextHair) {
    hairId.value = nextHair
  }
})
</script>

<template>
  <div class="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("costumes.dressup.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("costumes.dressup.description") }}</p>
      </div>
      <!-- The shared catalog selector: names the server in use and the
           "following" state exactly like /cards, /events, /gachas, /music. -->
      <CatalogRegionSelect />
    </div>

    <!-- Localized message with the raw error as a muted detail line, like
         every catalog page; a cached roster keeps rendering through a failed
         refresh, so this only shows on a cold cache. -->
    <CatalogErrorState
      v-if="error && characterOptions.length === 0"
      :message="t('costumes.dressup.loadError')"
      :detail="error"
      :retry-label="t('costumes.dressup.retry')"
      :retrying="loading"
      @retry="loadMaster(region)"
    />

    <template v-else-if="loading && characterOptions.length === 0">
      <CatalogDownloadProgress :region="region" />
      <Skeleton class="h-12 w-full rounded-lg" />
      <div class="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Skeleton class="aspect-[4/5] w-full rounded-lg sm:aspect-[7/5]" />
        <Skeleton class="h-96 w-full rounded-lg" />
      </div>
    </template>

    <template v-else>
      <!-- Who: every character in one strip, the current one ringed in their
           colour. A dropdown hid the cast; a strip shows it. -->
      <div
        class="flex gap-1.5 overflow-x-auto rounded-lg border bg-card px-3 py-2 lg:flex-wrap"
        role="radiogroup"
        :aria-label="t('costumes.dressup.character')"
      >
        <button
          v-for="character in characters"
          :key="character.id"
          type="button"
          role="radio"
          :aria-checked="character.id === characterId"
          :title="character.name"
          :class="[
            'flex shrink-0 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-card transition pointer-coarse:min-h-10 pointer-coarse:min-w-10',
            character.id === characterId ? 'ring-current' : 'ring-transparent opacity-70 hover:opacity-100 hover:ring-border',
          ]"
          :style="character.id === characterId ? { color: resolveSekaiCharacterColor(character.id) ?? undefined } : undefined"
          @click="selectCharacter(character.id)"
        >
          <SekaiCharacterAvatar :character-id="character.id" :name="character.name" size="md" class="ring-0" />
        </button>
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <!-- The stage. Tall, and pinned on wide screens so the model stays in
             view while the rack scrolls. -->
        <div class="flex flex-col gap-2 lg:sticky lg:top-17">
          <CostumeViewer
            ref="viewerRef"
            :region="region"
            :recipe="recipe"
            :background="background"
            class="aspect-[4/5] sm:aspect-[7/5] lg:aspect-auto lg:h-[calc(100vh-11rem)] lg:min-h-96"
          />
          <div class="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" :title="t('costumes.dressup.rotateLeft')" @click="viewerRef?.rotateBy(-45)">
              <LucideRotateCcw class="size-4" />
              <span class="sr-only">{{ t("costumes.dressup.rotateLeft") }}</span>
            </Button>
            <Button variant="outline" size="sm" :title="t('costumes.dressup.rotateRight')" @click="viewerRef?.rotateBy(45)">
              <LucideRotateCw class="size-4" />
              <span class="sr-only">{{ t("costumes.dressup.rotateRight") }}</span>
            </Button>
            <Button variant="outline" size="sm" :title="t('costumes.dressup.zoomIn')" @click="viewerRef?.zoomBy(1.25)">
              <LucideZoomIn class="size-4" />
              <span class="sr-only">{{ t("costumes.dressup.zoomIn") }}</span>
            </Button>
            <Button variant="outline" size="sm" :title="t('costumes.dressup.zoomOut')" @click="viewerRef?.zoomBy(1 / 1.25)">
              <LucideZoomOut class="size-4" />
              <span class="sr-only">{{ t("costumes.dressup.zoomOut") }}</span>
            </Button>
            <Button variant="outline" size="sm" @click="viewerRef?.resetView()">
              <LucideUndo2 class="size-4" /> {{ t("costumes.dressup.resetView") }}
            </Button>
            <span class="flex-1" />
            <Button variant="outline" size="sm" @click="copyLink">
              <LucideLink class="size-4" /> {{ t("costumes.dressup.copyLink") }}
            </Button>
            <Button variant="ghost" size="sm" class="text-muted-foreground" @click="resetToDefaults">
              <LucideRefreshCcw class="size-4" /> {{ t("costumes.dressup.reset") }}
            </Button>
          </div>
          <!-- What the stage shows: the unit version (Virtual Singers), the motion and the backdrop. -->
          <div class="flex flex-wrap items-center gap-1.5">
            <!-- A Virtual Singer's unit version: its own models of the same costumes, preset and motion. -->
            <Select v-if="unitOptions.length > 0" :model-value="roleUnit ?? undefined" @update:model-value="setUnit">
              <SelectTrigger size="sm" class="w-auto gap-1.5" :aria-label="t('costumes.dressup.unit')" :title="t('costumes.dressup.unit')">
                <LucideUsers class="size-4" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="unit in unitOptions" :key="unit" :value="unit">
                  {{ resolveSekaiUnitLabel({ t, te }, unit) }}
                </SelectItem>
              </SelectContent>
            </Select>
            <span id="costume-motion-label" class="sr-only">{{ t("costumes.dressup.motion") }}</span>
            <Combobox
              :model-value="motionChoice"
              :options="motionOptions"
              :clearable="false"
              :placeholder="t('costumes.dressup.motion')"
              :search-placeholder="t('costumes.dressup.motionSearch')"
              :empty-text="t('costumes.dressup.motionEmpty')"
              :icon-component="LucidePersonStanding"
              trigger-aria-labelledby="costume-motion-label"
              trigger-class="h-8 w-auto max-w-72 px-3 font-normal"
              content-class="w-72"
              @update:model-value="setMotion"
            />
            <!-- The accessory's model alone; only for an accessory of its own (a full head carries the hair). -->
            <Button
              variant="outline"
              size="sm"
              :aria-pressed="showingAccessoryOnly"
              :disabled="!hasStandaloneAccessory"
              :title="hasStandaloneAccessory ? t('costumes.dressup.accessoryOnlyHint') : t('costumes.dressup.accessoryOnlyUnavailable')"
              :class="showingAccessoryOnly ? 'bg-accent text-accent-foreground' : undefined"
              @click="accessoryOnly = !accessoryOnly"
            >
              <LucideCrown class="size-4" /> {{ t("costumes.dressup.accessoryOnly") }}
            </Button>
            <Select :model-value="background" @update:model-value="setBackground">
              <SelectTrigger size="sm" class="w-auto gap-1.5" :aria-label="t('costumes.dressup.background')" :title="t('costumes.dressup.background')">
                <LucideImage class="size-4" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in BACKGROUNDS" :key="option" :value="option">
                  {{ t(`costumes.dressup.backgrounds.${option}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p v-if="currentCharacter && recipe" class="text-xs text-muted-foreground">
            <span class="font-medium text-foreground">{{ currentCharacter.name }}</span>
            <template v-for="slot in COSTUME_SLOTS" :key="slot">
              <span class="mx-1.5 opacity-50">/</span>
              <span>{{ t(`costumes.dressup.${slot}`) }} {{ currentOutfit[slot] ?? "—" }}</span>
            </template>
          </p>
        </div>

        <!-- The rack: one slot at a time, every option as a thumbnail. -->
        <Card class="min-w-0">
          <CardContent class="flex min-w-0 flex-col gap-3 px-3 pt-4 sm:px-4 sm:pt-4">
            <div
              v-if="roleError"
              class="flex flex-col gap-2 rounded-md border border-dashed p-3 text-center"
            >
              <p class="text-xs text-muted-foreground">{{ t("costumes.dressup.roleLoadError") }}</p>
              <p class="max-w-full truncate font-mono text-[11px] text-muted-foreground" :title="roleError">
                {{ roleError }}
              </p>
              <Button variant="outline" size="sm" class="mx-auto" @click="reloadRole">
                <LucideRefreshCcw class="mr-1 size-4" /> {{ t("costumes.dressup.retry") }}
              </Button>
            </div>
            <template v-else-if="roleLoading && roleData == null">
              <Skeleton class="h-9 w-full rounded-md" />
              <div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
                <Skeleton v-for="index in 8" :key="index" class="aspect-square w-full rounded-md" />
              </div>
            </template>
            <template v-else>
              <ToggleGroup
                type="single"
                variant="segment"
                size="sm"
                :model-value="activeSlot"
                class="w-full"
                :aria-label="t('costumes.dressup.partPlaceholder')"
                @update:model-value="setActiveSlot"
              >
                <ToggleGroupItem v-for="slot in COSTUME_SLOTS" :key="slot" :value="slot" class="flex-1 gap-1.5">
                  <component :is="SLOT_ICONS[slot]" class="size-3.5" aria-hidden="true" />
                  {{ t(`costumes.dressup.${slot}`) }}
                  <span class="text-[11px] text-muted-foreground tabular-nums">{{ slotOptions(slot).length }}</span>
                </ToggleGroupItem>
              </ToggleGroup>

              <div class="relative">
                <LucideSearch class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  v-model="query"
                  type="search"
                  class="h-9 pl-9"
                  :placeholder="t('costumes.dressup.searchPlaceholder')"
                  :aria-label="t('costumes.dressup.searchPlaceholder')"
                />
              </div>

              <CatalogFilterPanel
                v-if="hasSources"
                :title="t('catalog.filters.title')"
                :reset-label="t('catalog.filters.reset')"
                :count-label="t('costumes.dressup.filters.count', { count: visibleGroups.length })"
                page-key="costumes"
                :active-count="filterCount"
                :active-chips="filterChips"
                content-class="flex flex-col gap-3"
                @reset="resetFilters"
                @remove-chip="removeFilterChip"
              >
                <CatalogChipsField
                  :model-value="filters.sources"
                  :label="t('costumes.dressup.filters.source')"
                  :options="sourceOptions"
                  compact
                  @update:model-value="setSources"
                />
                <div v-if="filters.sources.includes('card')" class="flex flex-wrap items-center gap-1.5">
                  <p :id="`${filterId}-supply`" class="mr-1 min-w-14 text-xs font-medium text-muted-foreground">
                    {{ t("costumes.dressup.filters.cardSupply") }}
                  </p>
                  <ToggleGroup
                    type="single"
                    variant="chip"
                    size="sm"
                    :model-value="filters.cardSupply"
                    :aria-labelledby="`${filterId}-supply`"
                    @update:model-value="setCardSupply"
                  >
                    <ToggleGroupItem v-for="supply in CARD_SUPPLIES" :key="supply" :value="supply">
                      {{ t(`costumes.dressup.filters.cardSupplies.${supply}`) }}
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <CatalogChipsField
                  :model-value="filters.years"
                  :label="t('costumes.dressup.filters.year')"
                  :options="yearOptions"
                  compact
                  @update:model-value="patchFilters({ years: $event })"
                />
                <div v-if="exclusiveAvailable" class="flex items-center gap-2">
                  <Switch
                    :id="`${filterId}-exclusive`"
                    :model-value="filters.regionExclusive"
                    @update:model-value="patchFilters({ regionExclusive: $event === true })"
                  />
                  <Label :for="`${filterId}-exclusive`" class="text-xs font-medium">
                    {{ t("costumes.dressup.filters.regionExclusive") }}
                  </Label>
                  <span class="text-[11px] text-muted-foreground">{{ t("costumes.dressup.filters.regionExclusiveHint") }}</span>
                </div>
                <CatalogCharacterPicker
                  :model-value="filters.originCharacterIds"
                  :characters="characters"
                  :label="t('costumes.dressup.filters.origin')"
                  size="sm"
                  @update:model-value="patchFilters({ originCharacterIds: $event })"
                />
              </CatalogFilterPanel>

              <p v-if="activeSlot === 'hair' && hairLocked" class="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                {{ t("costumes.dressup.hairLockedHint") }}
              </p>

              <p v-if="visibleOptions.length === 0" class="py-8 text-center text-sm text-muted-foreground">
                {{ t("costumes.dressup.empty") }}
              </p>
              <div
                v-else
                ref="rackAnchor"
                class="grid grid-cols-3 gap-2 sm:grid-cols-4"
                role="radiogroup"
                :aria-label="t(`costumes.dressup.${activeSlot}`)"
              >
                <div
                  v-for="group in pagedGroups"
                  :key="group.key"
                  class="flex min-w-0 flex-col gap-1"
                >
                  <button
                    type="button"
                    role="radio"
                    :aria-checked="isGroupSelected(group)"
                    :title="activeOption(group).colorName ? `${group.name} · ${activeOption(group).colorName}` : group.name"
                    class="group flex min-w-0 flex-col gap-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    @click="selectOption(activeOption(group).id)"
                  >
                    <span
                      :class="[
                        'relative block aspect-square w-full overflow-hidden rounded-md bg-muted/40 ring-2 transition',
                        isGroupSelected(group) ? 'ring-primary' : 'ring-transparent group-hover:ring-border',
                      ]"
                    >
                      <SekaiAssetImage :sources="thumbnailSources(activeOption(group))" :alt="group.name" fit="contain" placeholder-class="bg-transparent" />
                      <span v-if="activeSlot === 'head' && (isExclusiveHead(group) || isHairStyleHead(group))" class="absolute top-1 left-1 flex flex-col items-start gap-0.5">
                        <span
                          v-if="isExclusiveHead(group)"
                          class="rounded bg-background/85 px-1 text-[10px] leading-4 text-muted-foreground shadow-sm"
                          :title="t('costumes.dressup.headExclusiveHint')"
                        >
                          {{ t("costumes.dressup.headExclusive") }}
                        </span>
                        <span
                          v-if="isHairStyleHead(group)"
                          class="rounded bg-background/85 px-1 text-[10px] leading-4 text-muted-foreground shadow-sm"
                          :title="t('costumes.dressup.headHairStyleHint')"
                        >
                          {{ t("costumes.dressup.headHairStyle") }}
                        </span>
                      </span>
                      <span
                        v-if="regionBadge(activeOption(group))"
                        class="absolute bottom-1 left-1 rounded bg-background/85 px-1 font-mono text-[10px] leading-4 text-muted-foreground shadow-sm"
                        :title="t('costumes.dressup.filters.regionBadgeHint', { regions: regionBadge(activeOption(group)) })"
                      >
                        {{ regionBadge(activeOption(group)) }}
                      </span>
                      <span
                        v-if="group.options.length > 1"
                        class="absolute top-1 right-1 rounded bg-background/85 px-1 text-[10px] leading-4 text-muted-foreground tabular-nums shadow-sm"
                      >
                        {{ t("costumes.dressup.colorCount", { count: group.options.length }) }}
                      </span>
                    </span>
                    <span class="truncate text-[11px] leading-tight" :class="isGroupSelected(group) ? 'font-medium' : 'text-muted-foreground'">
                      {{ group.name }}
                    </span>
                  </button>
                  <!-- Colour variants, one tap each; the worn one is ringed. -->
                  <div v-if="group.options.length > 1" class="flex flex-wrap gap-1" role="radiogroup" :aria-label="group.name">
                    <button
                      v-for="option in group.options"
                      :key="option.id"
                      type="button"
                      role="radio"
                      :aria-checked="option.id === selectedId"
                        :title="option.colorName || option.name"
                      :class="[
                        'relative size-6 shrink-0 overflow-hidden rounded bg-muted/40 ring-2 transition disabled:cursor-not-allowed',
                        option.id === selectedId ? 'ring-primary' : 'ring-transparent hover:ring-border',
                      ]"
                      @click="selectOption(option.id)"
                    >
                      <SekaiAssetImage :sources="thumbnailSources(option)" :alt="option.colorName || option.name" fit="contain" placeholder-class="bg-transparent" />
                    </button>
                  </div>
                  <span v-else-if="activeOption(group).colorName" class="truncate text-[10px] leading-tight text-muted-foreground">
                    {{ activeOption(group).colorName }}
                  </span>
                </div>
              </div>
              <CatalogPagination
                v-if="totalPages > 1"
                v-model:page="page"
                v-model:page-size="pageSize"
                :total-pages="totalPages"
                :total="visibleGroups.length"
                :page-size-options="[24, 48, 96]"
                :anchor="rackAnchor"
              />
              <span class="sr-only">{{ currentPage }}</span>
            </template>
          </CardContent>
        </Card>
      </div>
    </template>
  </div>
</template>
