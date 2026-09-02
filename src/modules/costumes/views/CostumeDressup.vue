<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import {
  LucideCrown,
  LucideLink,
  LucideRefreshCcw,
  LucideRotateCcw,
  LucideRotateCw,
  LucideZoomIn,
  LucideZoomOut,
  LucideScissors,
  LucideSearch,
  LucideShirt,
  LucideUndo2,
} from "lucide-vue-next"
import type { AcceptableValue } from "reka-ui"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { usePagedSlice } from "@/composables/usePagedSlice"
import CatalogPagination from "@/shared/components/catalog/CatalogPagination.vue"
import { SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { buildCatalogCharacterMap, resolveSekaiCharacterColor, type CatalogCharacter } from "@/shared/sekai/catalog"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import { resolveCostumeThumbnailUrl } from "@/shared/sekai/data-sources"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import CostumeViewer, { type CostumeViewerRecipe } from "../components/CostumeViewer.vue"
import { useCostumeRoleData } from "../composables/useCostumeRoleData"
import { COSTUME_SLOTS, pickDefaultOptionId, type CostumeSlot, type RuntimeCostumeOption } from "../lib/costume-options"

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const sekaiDataStore = useSekaiDataStore()

const { region, selectorValue: regionSelectorValue, updateSelectorValue: updateRegionSelector } = useEffectiveCatalogRegion()
const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const selectedRegion = computed<string>({
  get: () => regionSelectorValue.value,
  set: (value) => updateRegionSelector(value),
})

// Only character names/units come from masterdata; the selectable parts and
// per-role defaults come from the deployed 3D runtime registry instead.
const DRESSUP_MASTER_FILES = ["gameCharacters"] as const

const loading = ref(false)
const error = ref<string | null>(null)
const characterMap = shallowRef<Map<number, CatalogCharacter>>(new Map())

let loadToken = 0

async function loadMaster(targetRegion: SekaiRegion) {
  const token = ++loadToken
  loading.value = true
  error.value = null
  try {
    await sekaiDataStore.ensureRegionData(targetRegion, { files: DRESSUP_MASTER_FILES, musicMetas: false })
    const files = await readSekaiMasterFiles(targetRegion, DRESSUP_MASTER_FILES)
    if (token !== loadToken) {
      return
    }

    characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
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

const roleCharacterId = computed<number | null>(() => characterId.value)
const roleUnit = computed<string | null>(() => characterMap.value.get(characterId.value)?.unit ?? null)

const {
  data: roleData,
  loading: roleLoading,
  error: roleError,
  reload: reloadRole,
} = useCostumeRoleData(region, assetEndpoint, roleCharacterId, roleUnit)

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

const visibleOptions = computed<RuntimeCostumeOption[]>(() => {
  const needle = query.value.trim().toLowerCase()
  const options = slotOptions(activeSlot.value)
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

const visibleGroups = computed<RackGroup[]>(() => {
  const groups = new Map<string, RackGroup>()
  for (const option of visibleOptions.value) {
    const key = option.costume3dGroupId != null ? `g:${option.costume3dGroupId}` : `id:${option.id}`
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
  return [...groups.values()]
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

watch(query, () => {
  page.value = 1
})
watch([activeSlot, () => roleData.value, selectedId], showSelectedPage, { immediate: true })

function selectOption(id: number) {
  switch (activeSlot.value) {
    case "body": bodyId.value = id; break
    case "head": headId.value = id; break
    default: if (!hairLocked.value) hairId.value = id
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
    bodyId.value = null
    headId.value = null
    hairId.value = null
    query.value = ""
  }
}

// Full head sets ship their own hairstyle, so the hair slot has no effect
// while one is selected (in-game behavior).
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
  }
})

// Keep the URL shareable without polluting history.
watch([characterId, bodyId, headId, hairId], ([nextCharacter, nextBody, nextHead, nextHair]) => {
  void router.replace({
    query: {
      ...route.query,
      characterId: String(nextCharacter),
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
  if (characterId.value !== nextCharacter) {
    characterId.value = nextCharacter
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
      <Label id="costume-region-label" for="costume-region" class="sr-only">
        {{ t("costumes.dressup.region") }}
      </Label>
      <Select id="costume-region" :key="locale" v-model="selectedRegion">
        <SelectTrigger class="w-32" aria-labelledby="costume-region-label">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="SEKAI_CATALOG_REGION_FOLLOW_VALUE">
            {{ t("sekaiRegion.followAccount") }}
          </SelectItem>
          <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
            {{ t(option.labelKey) }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <template v-if="loading && characterOptions.length === 0">
      <Skeleton class="h-12 w-full rounded-lg" />
      <div class="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Skeleton class="aspect-[4/5] w-full rounded-lg sm:aspect-[7/5]" />
        <Skeleton class="h-96 w-full rounded-lg" />
      </div>
    </template>

    <Card v-else-if="error">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("costumes.dressup.loadError") }}</p>
        <p class="max-w-full truncate font-mono text-xs text-muted-foreground">{{ error }}</p>
        <Button variant="outline" size="sm" @click="loadMaster(region)">
          <LucideRefreshCcw class="mr-1 size-4" /> {{ t("costumes.dressup.retry") }}
        </Button>
      </CardContent>
    </Card>

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
            'shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-card transition',
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
            :preference="assetEndpoint"
            :recipe="recipe"
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
                    :disabled="activeSlot === 'hair' && hairLocked"
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
                      :disabled="activeSlot === 'hair' && hairLocked"
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
