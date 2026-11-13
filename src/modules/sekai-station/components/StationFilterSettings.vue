<script setup lang="ts">
import { computed, ref, useId, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import StationFilterChip from "@/modules/sekai-station/components/StationFilterChip.vue"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import { PRESET_TAG_NAME_KEYS, PRESET_TAGS } from "@/modules/sekai-station/lib/sekai-station-constants"
import type { StationFilterMode } from "@/modules/sekai-station/lib/station-types"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

/**
 * Which rooms the list leaves out or keeps: hide or show only, the preset
 * terms, and the user's own keywords. Ported from Sekai Station's
 * FilterSetting (MIT © middlered).
 */
withDefaults(defineProps<{ heading?: "h2" | "h3" }>(), { heading: "h2" })

const { t } = useI18n()
const prefs = useSekaiStationPrefsStore()
const id = useId()

const KEYWORD_MAX_LENGTH = 50
const keyword = ref("")
const keywordError = ref("")
const canAddKeyword = computed(() => keyword.value.trim() !== "")

const FILTER_MODES: readonly StationFilterMode[] = ["blacklist", "whitelist"]

function onModeChange(value: AcceptableValue | AcceptableValue[] | undefined) {
  const mode = FILTER_MODES.find((item) => item === value)
  if (mode) {
    prefs.setFilterMode(mode)
  }
}

// The group reports the whole new selection; a click changes exactly one tag
function onTagsChange(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (!Array.isArray(value)) {
    return
  }
  const next = value.filter((item): item is string => typeof item === "string")
  const changed = next.find((tag) => !prefs.activeTags.includes(tag))
    ?? prefs.activeTags.find((tag) => !next.includes(tag))
  if (changed) {
    prefs.toggleTag(changed)
  }
}

// The pressed button goes away; keyboard focus moves to the nearest keyword
// left, or to the section (not the text box: that would open a phone's
// keyboard)
const section = ref<HTMLElement | null>(null)

function removeKeyword(event: MouseEvent, item: string) {
  const handOffFocus = captureFocusHandOff((event.currentTarget as HTMLElement | null)?.closest("li"), () => section.value)
  prefs.removeKeyword(item)
  handOffFocus?.()
}

function clearFilters(event: MouseEvent) {
  const handOffFocus = captureFocusHandOff(event.currentTarget as HTMLElement | null, () => section.value)
  prefs.clearFilters()
  handOffFocus?.()
}

function addKeyword() {
  const trimmed = keyword.value.trim()
  if (!trimmed) {
    return
  }
  // The store ignores a repeat; say so instead of leaving the box looking stuck
  if (prefs.filterKeywords.includes(trimmed)) {
    keywordError.value = t("sekaiStation.settings.keywordDuplicate")
    return
  }
  if (prefs.addKeyword(trimmed)) {
    keyword.value = ""
  }
}

watch(keyword, () => {
  keywordError.value = ""
})

// Enter also confirms an IME composition (Chinese/Japanese input); Safari
// reports that keydown with keyCode 229 instead of isComposing
function onKeywordEnter(event: KeyboardEvent) {
  if (!event.isComposing && event.keyCode !== 229) {
    addKeyword()
  }
}

// An emoji-only preset gets a spoken name and a tooltip; the text presets name themselves
function presetTagLabel(tag: string): string | undefined {
  const nameKey = PRESET_TAG_NAME_KEYS[tag]
  return nameKey ? t("sekaiStation.settings.presetTagLabel", { tag, name: t(`sekaiStation.settings.tagNames.${nameKey}`) }) : undefined
}
</script>

<template>
  <section
    ref="section"
    tabindex="-1"
    class="grid min-w-0 gap-3 outline-none"
    :aria-labelledby="`${id}-title`"
    data-slot="station-filter-settings"
  >
    <div class="flex min-h-7 items-center justify-between gap-2">
      <component :is="heading" :id="`${id}-title`" class="text-sm font-semibold">
        {{ t("sekaiStation.settings.filter") }}
      </component>
      <Button
        v-if="prefs.hasActiveFilters"
        type="button"
        variant="ghost"
        size="sm"
        class="-my-1.5 -mr-2 h-7 px-2 text-xs text-muted-foreground"
        @click="clearFilters"
      >
        {{ t("sekaiStation.settings.clear") }}
      </Button>
    </div>

    <div class="grid gap-1.5">
      <span :id="`${id}-mode`" class="text-xs text-muted-foreground">{{ t("sekaiStation.settings.mode") }}</span>
      <ToggleGroup
        type="single"
        variant="segment"
        size="sm"
        class="w-full"
        :model-value="prefs.filterMode"
        :aria-labelledby="`${id}-mode`"
        @update:model-value="onModeChange"
      >
        <ToggleGroupItem v-for="mode in FILTER_MODES" :key="mode" :value="mode" class="flex-1">
          {{ t(`sekaiStation.settings.${mode}`) }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="grid gap-1.5">
      <span :id="`${id}-tags`" class="text-xs text-muted-foreground">{{ t("sekaiStation.settings.presetTags") }}</span>
      <ToggleGroup
        type="multiple"
        variant="chip"
        size="sm"
        :model-value="prefs.activeTags"
        :aria-labelledby="`${id}-tags`"
        @update:model-value="onTagsChange"
      >
        <ToggleGroupItem
          v-for="tag in PRESET_TAGS"
          :key="tag"
          :value="tag"
          :aria-label="presetTagLabel(tag)"
          :title="presetTagLabel(tag)"
        >
          {{ tag }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>

    <div class="grid gap-1.5">
      <Label :for="`${id}-keyword`" class="text-xs font-normal text-muted-foreground">
        {{ t("sekaiStation.settings.keyword") }}
      </Label>
      <div class="flex gap-2">
        <Input
          :id="`${id}-keyword`"
          v-model="keyword"
          type="text"
          class="h-8"
          autocomplete="off"
          enterkeyhint="done"
          :maxlength="KEYWORD_MAX_LENGTH"
          :placeholder="t('sekaiStation.settings.keywordPlaceholder')"
          :aria-invalid="keywordError ? true : undefined"
          :aria-describedby="keywordError ? `${id}-keyword-error` : undefined"
          @keydown.enter="onKeywordEnter"
        />
        <Button type="button" variant="outline" size="sm" :disabled="!canAddKeyword" @click="addKeyword">
          {{ t("sekaiStation.settings.add") }}
        </Button>
      </div>
      <p v-if="keywordError" :id="`${id}-keyword-error`" role="alert" class="text-xs text-destructive">{{ keywordError }}</p>
      <ul
        v-if="prefs.filterKeywords.length > 0"
        role="list"
        class="m-0 flex list-none flex-wrap gap-x-1.5 gap-y-1 p-0 pt-0.5 pointer-coarse:gap-y-0 pointer-coarse:pt-0"
        :aria-label="t('sekaiStation.settings.keyword')"
      >
        <li v-for="item in prefs.filterKeywords" :key="item" class="flex max-w-full min-w-0">
          <StationFilterChip
            :label="item"
            :remove-label="t('sekaiStation.settings.removeFilter', { name: item })"
            @remove="removeKeyword($event, item)"
          />
        </li>
      </ul>
    </div>
  </section>
</template>
