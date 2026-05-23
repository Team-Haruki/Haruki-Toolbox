<script setup lang="ts">
import { computed, ref, toRef } from "vue"
import type { AcceptableValue } from "reka-ui"
import { XIcon } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SekaiRegion } from "@/types"
import { useCharacterOptions } from "../composables/useCharacterOptions"
import type { CharacterOption } from "../lib/master-options"

const props = withDefaults(defineProps<{
  modelValue: readonly number[]
  region: SekaiRegion
  disabled?: boolean
  maxCharacters?: number
  placeholder?: string
  allowedCharacterIds?: readonly number[] | null
}>(), {
  maxCharacters: 5,
  allowedCharacterIds: null,
})

const emit = defineEmits<{
  "update:modelValue": [value: number[]]
}>()

const { t } = useI18n()
const regionRef = toRef(props, "region")
const { options, loading } = useCharacterOptions(regionRef)
const pendingCharacterId = ref("")

const selectedIds = computed(() => props.modelValue ?? [])
const selectedIdSet = computed(() => new Set(selectedIds.value))
const characterOptionMap = computed(() =>
  new Map(options.value.map((option) => [option.id, option])),
)
const selectedCharacters = computed(() =>
  selectedIds.value.map((id) => characterOptionMap.value.get(id) ?? createUnknownCharacterOption(id)),
)
const filteredOptions = computed(() => {
  const allowedIds = props.allowedCharacterIds ? new Set(props.allowedCharacterIds) : null
  return options.value.filter((option) =>
    !selectedIdSet.value.has(option.id)
    && (!allowedIds || allowedIds.has(option.id)),
  )
})
const canSelectMore = computed(() => selectedIds.value.length < props.maxCharacters)

function handleUpdate(value: AcceptableValue) {
  pendingCharacterId.value = ""
  const characterId = typeof value === "string" ? Number(value) : null
  if (!characterId || !Number.isInteger(characterId) || selectedIdSet.value.has(characterId) || !canSelectMore.value) {
    return
  }

  emit("update:modelValue", [...selectedIds.value, characterId])
}

function removeCharacter(characterId: number) {
  emit("update:modelValue", selectedIds.value.filter((id) => id !== characterId))
}

function createUnknownCharacterOption(characterId: number): CharacterOption {
  return {
    id: characterId,
    value: String(characterId),
    label: `#${characterId}`,
    unit: null,
    iconUrl: "",
  }
}
</script>

<template>
  <div class="grid gap-3">
    <Select
      :model-value="pendingCharacterId"
      :disabled="props.disabled || loading || !canSelectMore"
      @update:model-value="handleUpdate"
    >
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="loading ? t('deckRecommend.select.loading') : (props.placeholder ?? t('deckRecommend.options.constraints.characterSelectPlaceholder'))" />
      </SelectTrigger>
      <SelectContent class="max-h-72">
        <SelectItem v-for="option in filteredOptions" :key="option.id" :value="option.value">
          <img :src="option.iconUrl" alt="" aria-hidden="true" class="size-6 rounded-sm object-cover" loading="lazy">
          <span class="truncate">{{ option.label }}</span>
        </SelectItem>
      </SelectContent>
    </Select>

    <div v-if="selectedCharacters.length === 0" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      {{ t("deckRecommend.options.constraints.noSelectedCharacters") }}
    </div>
    <div v-else class="grid gap-2 sm:grid-cols-2">
      <div
        v-for="character in selectedCharacters"
        :key="character.id"
        class="flex min-w-0 items-center gap-2 rounded-md border bg-background/70 p-2"
      >
        <img
          v-if="character.iconUrl"
          :src="character.iconUrl"
          alt=""
          class="size-10 shrink-0 rounded-md object-cover"
          loading="lazy"
        >
        <div v-else class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
          #{{ character.id }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-medium">{{ character.label }}</div>
          <div v-if="character.unit" class="truncate text-xs text-muted-foreground">
            {{ t(`deckRecommend.eventUnits.${character.unit}`) }}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-8 shrink-0"
          :disabled="props.disabled"
          :aria-label="t('deckRecommend.options.constraints.removeCharacter')"
          @click="removeCharacter(character.id)"
        >
          <XIcon class="size-4" />
        </Button>
      </div>
    </div>
    <p class="text-xs text-muted-foreground">
      {{ t("deckRecommend.options.constraints.selectedCharactersCount", { count: selectedCharacters.length, max: props.maxCharacters }) }}
    </p>
  </div>
</template>
