<script setup lang="ts">
import { computed, useId } from "vue"
import { useI18n } from "vue-i18n"
import type { AcceptableValue } from "reka-ui"
import { LucideMinus, LucidePlus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { EXPIRE_OPTIONS_SECONDS, FONT_SIZE, LINE_HEIGHT } from "@/modules/sekai-station/lib/sekai-station-constants"
import { useSekaiStationPrefsStore } from "@/modules/sekai-station/stores/sekai-station-prefs"

/**
 * How long a room stays listed and how large its text is. Ported from Sekai
 * Station's DisplaySetting (MIT © middlered); theme and effects live in the
 * Toolbox's own settings.
 */
withDefaults(defineProps<{ heading?: "h2" | "h3" }>(), { heading: "h2" })

const { t } = useI18n()
const prefs = useSekaiStationPrefsStore()
const id = useId()

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
</script>

<template>
  <section class="grid min-w-0 gap-3" :aria-labelledby="`${id}-title`" data-slot="station-display-settings">
    <component :is="heading" :id="`${id}-title`" class="flex min-h-7 items-center text-sm font-semibold">
      {{ t("sekaiStation.settings.display") }}
    </component>

    <div class="grid gap-1.5">
      <span :id="`${id}-expire`" class="text-xs text-muted-foreground">{{ t("sekaiStation.settings.expireTime") }}</span>
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
      <span :id="`${id}-${stepper.key}`" class="text-sm">{{ stepper.label }}</span>
      <div role="group" :aria-labelledby="`${id}-${stepper.key}`" class="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          class="size-8"
          :disabled="!stepper.canDecrease"
          :aria-label="t('sekaiStation.settings.decrease')"
          @click="stepper.step(-1)"
        >
          <LucideMinus aria-hidden="true" />
        </Button>
        <span class="w-10 text-center text-sm font-medium tabular-nums" aria-live="polite">{{ stepper.value }}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          class="size-8"
          :disabled="!stepper.canIncrease"
          :aria-label="t('sekaiStation.settings.increase')"
          @click="stepper.step(1)"
        >
          <LucidePlus aria-hidden="true" />
        </Button>
      </div>
    </div>
  </section>
</template>
