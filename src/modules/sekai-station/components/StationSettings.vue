<script setup lang="ts">
import { computed, ref, useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { LucideMinus, LucidePlus, LucideX } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { captureFocusHandOff } from "@/modules/sekai-station/lib/focus-hand-off"
import {
  EXPIRE_OPTIONS_SECONDS,
  FONT_SIZE,
  LINE_HEIGHT,
  PRESET_TAGS,
} from "@/modules/sekai-station/lib/sekai-station-constants"
import type { StationFilterMode } from "@/modules/sekai-station/lib/station-types"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

/**
 * Filter and display preferences as one plain column (the Station author
 * prefers that over tabs). Ported from Sekai Station's FilterSetting and
 * DisplaySetting (MIT © middlered); theme and effects live in the Toolbox's
 * own settings.
 */
const { t } = useI18n()
const prefs = useSekaiStationPrefsStore()
const id = useId()

const KEYWORD_MAX_LENGTH = 50
const keyword = ref("")
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
// left, or to the filter section (not the text box: that would open a
// phone's keyboard)
const filterSection = ref<HTMLElement | null>(null)

function removeKeyword(event: MouseEvent, item: string) {
  const handOffFocus = captureFocusHandOff((event.currentTarget as HTMLElement | null)?.closest("li"), () => filterSection.value)
  prefs.removeKeyword(item)
  handOffFocus?.()
}

function clearFilters(event: MouseEvent) {
  const handOffFocus = captureFocusHandOff(event.currentTarget as HTMLElement | null, () => filterSection.value)
  prefs.clearFilters()
  handOffFocus?.()
}

function addKeyword() {
  if (prefs.addKeyword(keyword.value)) {
    keyword.value = ""
  }
}

// Enter also confirms an IME composition (Chinese/Japanese input); Safari
// reports that keydown with keyCode 229 instead of isComposing
function onKeywordEnter(event: KeyboardEvent) {
  if (!event.isComposing && event.keyCode !== 229) {
    addKeyword()
  }
}

function durationLabel(seconds: number): string {
  return seconds < 60
    ? t("sekaiStation.settings.durationSeconds", { n: seconds })
    : t("sekaiStation.settings.durationMinutes", { n: Math.round((seconds / 60) * 10) / 10 })
}

// An expire time saved by another version may not be one of the options; then
// none is selected rather than silently changing it
function onExpireChange(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "number" && EXPIRE_OPTIONS_SECONDS.includes(value)) {
    prefs.setExpireSeconds(value)
  }
}

// Line height moves in tenths; comparing and stepping in integer tenths keeps
// 1.2 + 0.1 from drifting to 1.3000000000000003
const lineHeightTenths = computed(() => Math.round(prefs.lineHeight * 10))

const steppers = computed(() => [
  {
    key: "fontSize",
    label: t("sekaiStation.settings.fontSize"),
    value: String(prefs.fontSize),
    canDecrease: prefs.fontSize > FONT_SIZE.min,
    canIncrease: prefs.fontSize < FONT_SIZE.max,
    step: (direction: 1 | -1) => prefs.setFontSize(prefs.fontSize + direction),
  },
  {
    key: "lineHeight",
    label: t("sekaiStation.settings.lineHeight"),
    value: (lineHeightTenths.value / 10).toFixed(1),
    canDecrease: lineHeightTenths.value > Math.round(LINE_HEIGHT.min * 10),
    canIncrease: lineHeightTenths.value < Math.round(LINE_HEIGHT.max * 10),
    step: (direction: 1 | -1) => prefs.setLineHeight((lineHeightTenths.value + direction) / 10),
  },
])

const chipClass = "inline-flex h-7 max-w-full items-center gap-1 rounded-full border border-primary bg-primary/10 pr-2 pl-2.5 text-xs font-medium text-primary transition-colors outline-none hover:bg-primary/15 focus-visible:ring-[3px] focus-visible:ring-ring/50"
</script>

<template>
  <div class="flex flex-col divide-y" data-slot="station-settings">
    <section ref="filterSection" tabindex="-1" class="grid gap-3 p-4 outline-none" :aria-labelledby="`${id}-filter`">
      <div class="flex min-h-7 items-center justify-between gap-2">
        <h3 :id="`${id}-filter`" class="text-xs font-semibold tracking-wide text-muted-foreground">
          {{ t("sekaiStation.settings.filter") }}
        </h3>
        <Button
          v-if="prefs.hasActiveFilters"
          type="button"
          variant="ghost"
          size="sm"
          class="h-7 px-2 text-xs text-muted-foreground"
          @click="clearFilters"
        >
          {{ t("sekaiStation.settings.clear") }}
        </Button>
      </div>

      <div class="grid gap-1.5">
        <span :id="`${id}-mode`" class="text-sm font-medium">{{ t("sekaiStation.settings.mode") }}</span>
        <ToggleGroup
          type="single"
          variant="segment"
          size="sm"
          class="w-full"
          :model-value="prefs.filterMode"
          :aria-labelledby="`${id}-mode`"
          :aria-describedby="`${id}-mode-desc`"
          @update:model-value="onModeChange"
        >
          <ToggleGroupItem v-for="mode in FILTER_MODES" :key="mode" :value="mode" class="flex-1">
            {{ t(`sekaiStation.settings.${mode}`) }}
          </ToggleGroupItem>
        </ToggleGroup>
        <p :id="`${id}-mode-desc`" class="text-xs text-muted-foreground">
          {{ prefs.filterMode === "whitelist" ? t("sekaiStation.settings.whitelistDesc") : t("sekaiStation.settings.blacklistDesc") }}
        </p>
      </div>

      <div class="grid gap-1.5">
        <span :id="`${id}-tags`" class="text-sm font-medium">{{ t("sekaiStation.settings.presetTags") }}</span>
        <ToggleGroup
          type="multiple"
          variant="chip"
          size="sm"
          :model-value="prefs.activeTags"
          :aria-labelledby="`${id}-tags`"
          @update:model-value="onTagsChange"
        >
          <ToggleGroupItem v-for="tag in PRESET_TAGS" :key="tag" :value="tag">
            {{ tag }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div class="grid gap-2">
        <div class="flex gap-2">
          <Input
            v-model="keyword"
            type="text"
            class="h-8"
            enterkeyhint="done"
            :maxlength="KEYWORD_MAX_LENGTH"
            :placeholder="t('sekaiStation.settings.keywordPlaceholder')"
            :aria-label="t('sekaiStation.settings.keywordPlaceholder')"
            @keydown.enter="onKeywordEnter"
          />
          <Button type="button" variant="outline" size="sm" :disabled="!canAddKeyword" @click="addKeyword">
            <LucidePlus aria-hidden="true" />
            {{ t("sekaiStation.settings.add") }}
          </Button>
        </div>
        <ul v-if="prefs.filterKeywords.length > 0" class="m-0 flex list-none flex-wrap gap-1.5 p-0">
          <li v-for="item in prefs.filterKeywords" :key="item" class="flex max-w-full min-w-0">
            <button
              type="button"
              :class="chipClass"
              :aria-label="t('sekaiStation.settings.removeFilter', { name: item })"
              @click="removeKeyword($event, item)"
            >
              <span class="truncate">{{ item }}</span>
              <LucideX class="size-3.5 shrink-0" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </div>
    </section>

    <section class="grid gap-3 p-4" :aria-labelledby="`${id}-display`">
      <h3 :id="`${id}-display`" class="text-xs font-semibold tracking-wide text-muted-foreground">
        {{ t("sekaiStation.settings.display") }}
      </h3>

      <div class="grid gap-1.5">
        <span :id="`${id}-expire`" class="text-sm font-medium">{{ t("sekaiStation.settings.expireTime") }}</span>
        <ToggleGroup
          type="single"
          variant="segment"
          size="sm"
          class="w-full"
          :model-value="prefs.expireSeconds"
          :aria-labelledby="`${id}-expire`"
          @update:model-value="onExpireChange"
        >
          <ToggleGroupItem
            v-for="seconds in EXPIRE_OPTIONS_SECONDS"
            :key="seconds"
            :value="seconds"
            class="flex-1 px-1.5"
          >
            {{ durationLabel(seconds) }}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div v-for="stepper in steppers" :key="stepper.key" class="flex items-center justify-between gap-3">
        <span :id="`${id}-${stepper.key}`" class="text-sm font-medium">{{ stepper.label }}</span>
        <div
          role="group"
          :aria-labelledby="`${id}-${stepper.key}`"
          class="inline-flex shrink-0 items-center rounded-md border bg-background p-0.5 shadow-xs dark:bg-input/30"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7"
            :disabled="!stepper.canDecrease"
            :aria-label="t('sekaiStation.settings.decrease')"
            @click="stepper.step(-1)"
          >
            <LucideMinus class="size-3.5" aria-hidden="true" />
          </Button>
          <span class="w-10 text-center text-sm tabular-nums" aria-live="polite">{{ stepper.value }}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="size-7"
            :disabled="!stepper.canIncrease"
            :aria-label="t('sekaiStation.settings.increase')"
            @click="stepper.step(1)"
          >
            <LucidePlus class="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  </div>
</template>
