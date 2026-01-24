<script setup lang="ts">
import {ref} from "vue"
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
        <AlertTitle>小提示</AlertTitle>
        <AlertDescription>
          选择倍率为 5 的倍数时，请确保目标 PT 的个位数是 0 或 5。
        </AlertDescription>
      </Alert>
      <Alert class="w-full mb-2">
        <LucideAlertCircle class="h-4 w-4"/>
        <AlertTitle>小提示</AlertTitle>
        <AlertDescription>
          距离目标Pt差距太大时，可以多步控分<br>
          如: 3333 = 3000 + 333
        </AlertDescription>
      </Alert>
      <Alert class="w-full mb-2">
        <LucideAlertCircle class="h-4 w-4"/>
        <AlertTitle>小提示</AlertTitle>
        <AlertDescription>
          为World Link活动控分时，请不要用支援队！<br>
          就算真的要用，也一定要点击加成详细确认加成为整数，确认完全没有小数点！
        </AlertDescription>
      </Alert>
      <Card class="w-full">
        <CardHeader class="flex items-center space-x-2">
          <LucideCalculator class="w-5 h-5"/>
          <CardTitle>活动Pt计算器(仅支持孑然妒火)</CardTitle>
        </CardHeader>
        <div class="space-y-4 p-4">
          <div class="grid gap-2">
            <Label for="inputPt">目标Pt</Label>
            <div class="relative w-full items-center">
              <Input id="inputPt" class="pl-10" placeholder="请输入目标Pt" v-model.number="inputPt" type="number" min="0"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Target class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="deckBonusCap">卡组加成上限 (%)</Label>
            <div class="relative w-full items-center">
              <Input id="deckBonusCap" class="pl-10" v-model.number="deckBonusCap" type="number" min="1" max="500"
                     placeholder="请输入卡组加成上限"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Percent class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="maxResults">输出结果上限</Label>
            <div class="relative w-full items-center">
              <Input id="maxResults" class="pl-10" v-model.number="maxResults" type="number" min="1" placeholder="请输入输出结果上限"/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <List class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="boostIndex">体力消耗档位</Label>
            <div class="relative w-full items-center">
              <Select v-model="boostIndex">
                <SelectTrigger class="w-full pl-10">
                  <SelectValue placeholder="选择体力消耗档位"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>体力档位</SelectLabel>
                    <SelectItem
                        v-for="(rate, index) in boostRateTable"
                        :key="index"
                        :value="String(index)"
                    >
                      {{ index }} ({{ rate }}倍)
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
            开始计算
          </Button>
          <div v-if="calculatedOnce" class="mt-2">
            <template v-if="results.length">
              <Alert variant="default" class="space-y-2">
                <AlertTitle>计算结果</AlertTitle>
                <AlertDescription>
                  <div class="mb-2">
                    以下是共 {{ results.length }} 组方案（需要打的分数区间和所需卡组加成）：
                  </div>
                  <div
                      v-for="(row, i) in results"
                      :key="i"
                      class="flex flex-col gap-1 border-b border-border py-2 text-sm last:border-0 w-full"
                  >
                    <div>
                      <span class="font-semibold">分数区间：</span>
                      <span class="font-mono text-emerald-500">
                        {{ row.selfScoreMin.toLocaleString() }} ~ {{ row.selfScoreMax.toLocaleString() }}
                      </span>
                    </div>
                    <div>
                      <span class="font-semibold">所需加成：</span>
                      <span class="font-mono text-blue-500">{{ row.deckBonus }}%</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </template>
            <Alert variant="destructive" v-else class="flex items-center space-x-2">
              <span class="font-semibold">未找到符合条件的方案</span>
              <span class="text-sm">请尝试调整 PT 值或其他参数。</span>
            </Alert>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>