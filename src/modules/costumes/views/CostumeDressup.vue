<script setup lang="ts">
import { computed, ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { LucideRefreshCcw, LucideRotateCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { buildCatalogCharacterMap, type CatalogCharacter } from "@/shared/sekai/catalog"
import { resolveCostumeThumbnailUrl } from "@/shared/sekai/data-sources"
import { SEKAI_CATALOG_REGION_FOLLOW_VALUE, useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import CostumeViewer, { type CostumeViewerRecipe } from "../components/CostumeViewer.vue"
import { useCostumeRoleData } from "../composables/useCostumeRoleData"
import { pickDefaultOptionId, type CostumeSlot } from "../lib/costume-options"

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

const characterOptions = computed<ComboboxOption[]>(() =>
  [...characterMap.value.values()]
    .sort((a, b) => a.id - b.id)
    .map((character) => ({
      value: String(character.id),
      label: character.name,
      description: `#${character.id}`,
      iconUrl: character.iconUrl,
      keywords: [String(character.id), character.name],
    })),
)

function partComboboxOptions(slot: CostumeSlot): ComboboxOption[] {
  return (roleData.value?.options[slot] ?? []).map((option) => ({
    value: String(option.id),
    label: option.name,
    description: option.colorName ? `#${option.id} · ${option.colorName}` : `#${option.id}`,
    iconUrl: option.thumbnailAssetbundleName
      ? resolveCostumeThumbnailUrl(region.value, option.thumbnailAssetbundleName, assetEndpoint.value)
      : null,
    // Regional asset mirrors miss some costume thumbnails; the jp mirror is the superset.
    iconFallbackUrl: option.thumbnailAssetbundleName && region.value !== "jp"
      ? resolveCostumeThumbnailUrl("jp", option.thumbnailAssetbundleName, assetEndpoint.value)
      : null,
    keywords: [String(option.id), option.name, option.colorName].filter(Boolean),
  }))
}

function handleCharacterChange(value: string | null) {
  const parsed = value != null ? Number(value) : null
  if (parsed != null && Number.isInteger(parsed) && characterMap.value.has(parsed)) {
    characterId.value = parsed
    bodyId.value = null
    headId.value = null
    hairId.value = null
  }
}

function handlePartChange(selection: typeof bodyId) {
  return (value: string | null) => {
    const parsed = value != null ? Number(value) : null
    if (parsed != null && Number.isInteger(parsed) && parsed > 0) {
      selection.value = parsed
    }
  }
}

const handleBodyChange = handlePartChange(bodyId)
const handleHeadChange = handlePartChange(headId)
const handleHairChange = handlePartChange(hairId)

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
</script>

<template>
  <div class="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("costumes.dressup.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("costumes.dressup.description") }}</p>
      </div>
      <Select :key="locale" v-model="selectedRegion">
        <SelectTrigger class="w-32" :aria-label="t('costumes.dressup.region')">
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
      <div class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <Skeleton class="h-72 w-full rounded-lg" />
        <Skeleton class="aspect-[7/5] w-full rounded-lg" />
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

    <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <Card class="h-fit">
        <CardContent class="flex flex-col gap-4 pt-6">
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">{{ t("costumes.dressup.character") }}</Label>
            <Combobox
              :model-value="String(characterId)"
              :options="characterOptions"
              :placeholder="t('costumes.dressup.characterPlaceholder')"
              :search-placeholder="t('costumes.dressup.searchPlaceholder')"
              :empty-text="t('costumes.dressup.empty')"
              :clearable="false"
              trigger-class="w-full"
              @update:model-value="handleCharacterChange"
            />
          </div>
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
            <Skeleton v-for="index in 3" :key="index" class="h-14 w-full rounded-md" />
          </template>
          <template v-else>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">{{ t("costumes.dressup.body") }}</Label>
              <Combobox
                :model-value="bodyId != null ? String(bodyId) : null"
                :options="partComboboxOptions('body')"
                :placeholder="t('costumes.dressup.partPlaceholder')"
                :search-placeholder="t('costumes.dressup.searchPlaceholder')"
                :empty-text="t('costumes.dressup.empty')"
                :clearable="false"
                trigger-class="w-full"
                @update:model-value="handleBodyChange"
              />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">{{ t("costumes.dressup.head") }}</Label>
              <Combobox
                :model-value="headId != null ? String(headId) : null"
                :options="partComboboxOptions('head')"
                :placeholder="t('costumes.dressup.partPlaceholder')"
                :search-placeholder="t('costumes.dressup.searchPlaceholder')"
                :empty-text="t('costumes.dressup.empty')"
                :clearable="false"
                trigger-class="w-full"
                @update:model-value="handleHeadChange"
              />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">{{ t("costumes.dressup.hair") }}</Label>
              <Combobox
                :model-value="hairId != null ? String(hairId) : null"
                :options="partComboboxOptions('hair')"
                :placeholder="t('costumes.dressup.partPlaceholder')"
                :search-placeholder="t('costumes.dressup.searchPlaceholder')"
                :empty-text="t('costumes.dressup.empty')"
                :clearable="false"
                :disabled="hairLocked"
                trigger-class="w-full"
                @update:model-value="handleHairChange"
              />
              <p v-if="hairLocked" class="text-[11px] text-muted-foreground">
                {{ t("costumes.dressup.hairLockedHint") }}
              </p>
            </div>
            <Button variant="outline" size="sm" class="w-fit" @click="resetToDefaults">
              <LucideRotateCcw class="mr-1 size-4" /> {{ t("costumes.dressup.reset") }}
            </Button>
          </template>
        </CardContent>
      </Card>

      <CostumeViewer :region="region" :preference="assetEndpoint" :recipe="recipe" />
    </div>
  </div>
</template>
