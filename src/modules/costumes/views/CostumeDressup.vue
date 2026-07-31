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
import {
  listCostumeOptions,
  pickDefaultCostumeId,
  type CostumePartType,
} from "../lib/costume-options"

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

const DRESSUP_MASTER_FILES = ["costume3ds", "gameCharacters"] as const

const loading = ref(false)
const error = ref<string | null>(null)
const rawCostume3ds = shallowRef<unknown>(null)
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

    rawCostume3ds.value = files.costume3ds ?? null
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

const bodyOptions = computed(() => listCostumeOptions(rawCostume3ds.value, characterId.value, "body"))
const headOptions = computed(() => listCostumeOptions(rawCostume3ds.value, characterId.value, "head"))
const hairOptions = computed(() => listCostumeOptions(rawCostume3ds.value, characterId.value, "hair"))

/** Fill empty/foreign selections with the slot defaults for the character. */
watch([bodyOptions, headOptions, hairOptions], () => {
  const slots: Array<[typeof bodyId, typeof bodyOptions]> = [
    [bodyId, bodyOptions],
    [headId, headOptions],
    [hairId, hairOptions],
  ]
  for (const [selection, options] of slots) {
    if (options.value.length === 0) {
      continue
    }
    if (selection.value == null || !options.value.some((option) => option.id === selection.value)) {
      selection.value = pickDefaultCostumeId(options.value)
    }
  }
}, { immediate: true })

function resetToDefaults() {
  bodyId.value = pickDefaultCostumeId(bodyOptions.value)
  headId.value = pickDefaultCostumeId(headOptions.value)
  hairId.value = pickDefaultCostumeId(hairOptions.value)
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

function partComboboxOptions(partType: CostumePartType): ComboboxOption[] {
  const options = partType === "body"
    ? bodyOptions.value
    : partType === "head" ? headOptions.value : hairOptions.value
  return options.map((option) => ({
    value: String(option.id),
    label: option.colorName ? `${option.name} · ${option.colorName}` : option.name,
    description: `#${option.id}`,
    iconUrl: option.assetbundleName
      ? resolveCostumeThumbnailUrl(region.value, option.assetbundleName, assetEndpoint.value)
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

const recipe = computed<CostumeViewerRecipe | null>(() => {
  const unit = characterMap.value.get(characterId.value)?.unit ?? null
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
  <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4">
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
      <div class="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
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

    <div v-else class="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
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
              trigger-class="w-full"
              @update:model-value="handleHairChange"
            />
          </div>
          <Button variant="outline" size="sm" class="w-fit" @click="resetToDefaults">
            <LucideRotateCcw class="mr-1 size-4" /> {{ t("costumes.dressup.reset") }}
          </Button>
        </CardContent>
      </Card>

      <CostumeViewer :region="region" :preference="assetEndpoint" :recipe="recipe" />
    </div>
  </div>
</template>
