<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { cn } from "@/lib/utils"
import SekaiCharacterAvatar from "@/shared/components/SekaiCharacterAvatar.vue"
import SekaiUnitLogo from "@/shared/components/SekaiUnitLogo.vue"
import { SEKAI_UNITS, type CatalogCharacter, type SekaiUnit } from "@/shared/sekai/catalog"
import { resolveSekaiUnitLabel } from "@/shared/sekai/labels"

/**
 * Multi-select character filter: avatars grouped by unit in canonical order,
 * a unit logo heading each group. Clicking the logo toggles the whole group;
 * when anything is selected the rest dims so the selection reads at a glance.
 */
const props = withDefaults(defineProps<{
  characters: readonly CatalogCharacter[]
  label?: string | null
  unitColorMap?: ReadonlyMap<SekaiUnit, string> | null
  size?: "sm" | "md"
  class?: string
}>(), {
  label: null,
  unitColorMap: null,
  size: "md",
  class: undefined,
})

const model = defineModel<number[]>({ required: true })

const { t, te } = useI18n()

const groups = computed(() => {
  const byUnit = new Map<SekaiUnit | null, CatalogCharacter[]>()
  for (const character of [...props.characters].sort((a, b) => a.id - b.id)) {
    const unit = character.unit ?? null
    const list = byUnit.get(unit)
    if (list) {
      list.push(character)
    } else {
      byUnit.set(unit, [character])
    }
  }
  return [...SEKAI_UNITS, null as SekaiUnit | null]
    .map((unit) => ({ unit, characters: byUnit.get(unit) ?? [] }))
    .filter((group) => group.characters.length > 0)
})

const selected = computed(() => new Set(model.value))
const hasSelection = computed(() => model.value.length > 0)

function toggleCharacter(characterId: number) {
  const next = new Set(model.value)
  if (next.has(characterId)) {
    next.delete(characterId)
  } else {
    next.add(characterId)
  }
  model.value = [...next]
}

function toggleGroup(characters: readonly CatalogCharacter[]) {
  const ids = characters.map((character) => character.id)
  const allSelected = ids.every((id) => selected.value.has(id))
  const next = new Set(model.value)
  for (const id of ids) {
    if (allSelected) {
      next.delete(id)
    } else {
      next.add(id)
    }
  }
  model.value = [...next]
}

function groupSelected(characters: readonly CatalogCharacter[]): boolean {
  return characters.every((character) => selected.value.has(character.id))
}

function unitLabel(unit: SekaiUnit): string {
  return resolveSekaiUnitLabel({ t, te }, unit)
}

const avatarSize = computed(() => (props.size === "sm" ? "sm" : "md"))
</script>

<template>
  <div :class="cn('flex flex-wrap items-center gap-1.5', props.class)" role="group" :aria-label="label ?? undefined">
    <span v-if="label" class="mr-1 text-xs font-medium text-muted-foreground">{{ label }}</span>
    <template v-for="group in groups" :key="group.unit ?? 'other'">
      <button
        v-if="group.unit"
        type="button"
        :class="[
          'ml-1 inline-flex shrink-0 items-center rounded-md px-1 py-0.5 transition-colors hover:bg-muted',
          groupSelected(group.characters) ? 'bg-primary/10' : '',
        ]"
        :title="t('catalog.character.toggleUnit', { unit: unitLabel(group.unit) })"
        :aria-label="t('catalog.character.toggleUnit', { unit: unitLabel(group.unit) })"
        :aria-pressed="groupSelected(group.characters)"
        @click="toggleGroup(group.characters)"
      >
        <SekaiUnitLogo :unit="group.unit" size="sm" :color="unitColorMap?.get(group.unit) ?? null" />
      </button>
      <button
        v-for="character in group.characters"
        :key="character.id"
        type="button"
        :class="[
          'relative shrink-0 rounded-full ring-2 transition',
          selected.has(character.id) ? 'ring-primary' : 'ring-transparent hover:ring-border',
          hasSelection && !selected.has(character.id) ? 'opacity-40 hover:opacity-100' : '',
        ]"
        :title="character.name"
        :aria-label="character.name"
        :aria-pressed="selected.has(character.id)"
        @click="toggleCharacter(character.id)"
      >
        <SekaiCharacterAvatar :character-id="character.id" :name="character.name" :size="avatarSize" class="ring-0" />
      </button>
    </template>
  </div>
</template>
