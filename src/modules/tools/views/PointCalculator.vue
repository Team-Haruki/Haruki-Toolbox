<script setup lang="ts">
import {ref} from "vue"
import { useI18n } from "vue-i18n"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
} from "@/components/ui/card"
import {
  Select,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import {
  LucideCalculator,
  LucideAlertCircle,
  Target,
  Percent,
  List,
  Flame
} from "lucide-vue-next"
import { formatNumberCN } from "@/lib/number-format"

const { t, locale } = useI18n()

interface CalculationResult {
  selfScoreMin: number
  selfScoreMax: number
  deckBonus: number
}

const inputPt = ref<number | undefined>(undefined);
const isCalculating = ref<boolean>(false);
const results = ref<CalculationResult[]>([]);
const calculatedOnce = ref<boolean>(false);
const boostRateTable = [1, 5, 10, 15, 20, 25, 27, 29, 31, 33, 35];
const musicRate = 1;
const boostIndex = ref<string>("0");
const maxResults = ref<number | undefined>(10);
const deckBonusCap = ref<number | undefined>(435);

function calcResult(): void {
  results.value = [];
  isCalculating.value = true;

  const pt = Number(inputPt.value);
  if (isNaN(pt) || pt <= 0) {
    calculatedOnce.value = false;
    isCalculating.value = false;
    return;
  }

  const index = Number(boostIndex.value);
  const boost = boostRateTable[isNaN(index) ? 0 : index];

  outerLoop:
      for (let k = 0; k <= 100; k++) {
        const baseScore = 100 + k;
        const selfMin = 20000 * k;
        if (selfMin > 2700000) break;

        for (let bonusPct = 0; bonusPct <= (deckBonusCap.value ?? 0); bonusPct++) {
          const deckR = 100 + bonusPct;
          const raw = Math.floor(baseScore * musicRate * deckR / 100);
          const ptPrime = raw * (boost ?? 1);

          if (ptPrime === pt) {
            results.value.push({
              selfScoreMin: selfMin,
              selfScoreMax: 20000 * (k + 1) - 1,
              deckBonus: bonusPct,
            });
            if (results.value.length >= (maxResults.value ?? 0)) break outerLoop;
            break;
          }
        }
      }

  calculatedOnce.value = true;
  isCalculating.value = false;
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <div class="w-full max-w-md space-y-3">
      <Alert class="w-full mb-2">
        <LucideAlertCircle class="h-4 w-4"/>
        <AlertTitle>{{ t("tools.pointCalculator.tips.title") }}</AlertTitle>
        <AlertDescription>
          {{ t("tools.pointCalculator.tips.multipleOfFive") }}
        </AlertDescription>
      </Alert>
      <Alert class="w-full mb-2">
        <LucideAlertCircle class="h-4 w-4"/>
        <AlertTitle>{{ t("tools.pointCalculator.tips.title") }}</AlertTitle>
        <AlertDescription>
          {{ t("tools.pointCalculator.tips.multiStepLine1") }}<br>
          {{ t("tools.pointCalculator.tips.multiStepLine2") }}
        </AlertDescription>
      </Alert>
      <Alert class="w-full mb-2">
        <LucideAlertCircle class="h-4 w-4"/>
        <AlertTitle>{{ t("tools.pointCalculator.tips.title") }}</AlertTitle>
        <AlertDescription>
          {{ t("tools.pointCalculator.tips.worldLinkLine1") }}<br>
          {{ t("tools.pointCalculator.tips.worldLinkLine2") }}
        </AlertDescription>
      </Alert>
      <Card class="w-full">
        <CardHeader class="flex items-center space-x-2">
          <LucideCalculator class="w-5 h-5"/>
          <CardTitle>{{ t("tools.pointCalculator.title") }}</CardTitle>
        </CardHeader>
        <div class="space-y-4 p-4">
          <div class="grid gap-2">
            <Label for="inputPt">{{ t("tools.pointCalculator.fields.targetPt") }}</Label>
            <div class="relative w-full items-center">
              <Input id="inputPt" class="pl-10" :placeholder="t('tools.pointCalculator.fields.targetPtPlaceholder')" v-model.number="inputPt" type="number" min="0"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Target class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="deckBonusCap">{{ t("tools.pointCalculator.fields.deckBonusCap") }}</Label>
            <div class="relative w-full items-center">
              <Input id="deckBonusCap" class="pl-10" v-model.number="deckBonusCap" type="number" min="1" max="500"
                     :placeholder="t('tools.pointCalculator.fields.deckBonusCapPlaceholder')"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Percent class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="maxResults">{{ t("tools.pointCalculator.fields.maxResults") }}</Label>
            <div class="relative w-full items-center">
              <Input id="maxResults" class="pl-10" v-model.number="maxResults" type="number" min="1" :placeholder="t('tools.pointCalculator.fields.maxResultsPlaceholder')"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <List class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="boostIndex">{{ t("tools.pointCalculator.fields.boostIndex") }}</Label>
            <div class="relative w-full items-center">
              <Select :key="locale" v-model="boostIndex">
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.pointCalculator.fields.boostIndexPlaceholder')"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{{ t("tools.pointCalculator.fields.boostIndexGroupLabel") }}</SelectLabel>
                    <SelectItem
                        v-for="(rate, index) in boostRateTable"
                        :key="index"
                        :value="String(index)"
                    >
                      {{ t("tools.pointCalculator.fields.boostIndexOption", { index, rate }) }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                <Flame class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>

          <Button class="w-full" @click="calcResult" :disabled="isCalculating">
            <LucideCalculator class="w-4 h-4 mr-2"/>
            {{ t("tools.pointCalculator.actions.calculate") }}
          </Button>
          <div v-if="calculatedOnce" class="mt-2">
            <template v-if="results.length">
              <Alert variant="default" class="space-y-2">
                <AlertTitle>{{ t("tools.pointCalculator.result.title") }}</AlertTitle>
                <AlertDescription>
                  <div class="mb-2">
                    {{ t("tools.pointCalculator.result.summary", { count: results.length }) }}
                  </div>
                  <div
                      v-for="(row, i) in results"
                      :key="i"
                      class="flex flex-col gap-1 border-b border-border py-2 text-sm last:border-0 w-full"
                  >
                    <div>
                      <span class="font-semibold">{{ t("tools.pointCalculator.result.scoreRangeLabel") }}</span>
                      <span class="font-mono text-emerald-500">
                        {{ formatNumberCN(row.selfScoreMin, "0") }} ~ {{ formatNumberCN(row.selfScoreMax, "0") }}
                      </span>
                    </div>
                    <div>
                      <span class="font-semibold">{{ t("tools.pointCalculator.result.deckBonusLabel") }}</span>
                      <span class="font-mono text-blue-500">{{ row.deckBonus }}%</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </template>
            <Alert variant="destructive" v-else class="flex items-center space-x-2">
              <span class="font-semibold">{{ t("tools.pointCalculator.result.noMatchTitle") }}</span>
              <span class="text-sm">{{ t("tools.pointCalculator.result.noMatchDescription") }}</span>
            </Alert>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
