<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import type { SekaiRegion } from "@/types"
import CustomBonusCharacterPicker from "./CustomBonusCharacterPicker.vue"
import type { DeckRecommendSupportUnitType } from "../lib/recommend-options"

defineProps<{
  region: SekaiRegion
  running: boolean
  dataReady: boolean
}>()

const open = defineModel<boolean>("open", { required: true })
const characterIds = defineModel<number[]>("characterIds", { required: true })
const supportUnits = defineModel<Record<string, DeckRecommendSupportUnitType>>("supportUnits", { required: true })
const filterOtherUnit = defineModel<boolean>("filterOtherUnit", { required: true })

const { t } = useI18n()
</script>

<template>
  <Dialog v-model:open="open">
    <DialogScrollContent class="max-h-[88vh] overflow-y-auto sm:max-w-[760px]">
      <DialogHeader>
        <DialogTitle>{{ t("deckRecommend.options.eventSimulation.customBonusTitle") }}</DialogTitle>
        <DialogDescription>
          {{ t("deckRecommend.options.eventSimulation.customBonusDescription") }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4">
        <CustomBonusCharacterPicker
          v-model="characterIds"
          v-model:support-units="supportUnits"
          :region="region"
          :disabled="running || !dataReady"
        />
        <label class="flex items-center justify-between gap-3 rounded-md border bg-background/60 p-3 text-sm">
          <span>{{ t("deckRecommend.form.filterOtherUnit") }}</span>
          <Switch
            v-model="filterOtherUnit"
            :aria-label="t('deckRecommend.form.filterOtherUnit')"
            :disabled="running"
          />
        </label>
      </div>
      <DialogFooter>
        <Button
          type="button"
          @click="open = false"
        >
          {{ t("deckRecommend.options.eventSimulation.customBonusDone") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
