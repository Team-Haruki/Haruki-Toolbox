<script setup lang="ts">
import {ref} from "vue";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {
  Card,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  LucideCalculator,
  LucideAlertCircle
} from "lucide-vue-next";


const inputPt = ref<number | undefined>(undefined);
const isCalculating = ref<boolean>(false);
const results = ref<any[]>([]);
const calculatedOnce = ref<boolean>(false);
const boostRateTable = [1, 5, 10, 15, 20, 25, 27, 29, 31, 33, 35];
const musicRate = 1;
const boostIndex = ref<number>(0);
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

  const boost = boostRateTable[boostIndex.value];

  outerLoop:
      for (let k = 0; k <= 100; k++) {
        const baseScore = 100 + k;
        const selfMin = 20000 * k;
        if (selfMin > 2700000) break;

        for (let bonusPct = 0; bonusPct <= (deckBonusCap.value ?? 0); bonusPct++) {
          const deckR = 1 + bonusPct / 100;
          const raw = Math.floor(baseScore * musicRate * deckR);
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
          就算真的要用，也一定要点击加成详细确认加成为整数，完全没有小数点！
        </AlertDescription>
      </Alert>
      <Card class="w-full">
        <CardHeader class="flex items-center space-x-2">
          <LucideCalculator class="w-5 h-5"/>
          <CardTitle>活动Pt计算器(仅支持孑然妒火)</CardTitle>
        </CardHeader>
        <div class="space-y-4 p-4">
          <div>
            <Label for="inputPt">目标Pt</Label>
            <Input id="inputPt" placeholder="请输入目标Pt" v-model.number="inputPt" type="number" min="0"/>
          </div>
          <div>
            <Label for="deckBonusCap">卡组加成上限 (%)</Label>
            <Input id="deckBonusCap" v-model.number="deckBonusCap" type="number" min="1" max="500"
                   placeholder="请输入卡组加成上限"/>
          </div>
          <div>
            <Label for="maxResults">输出结果上限</Label>
            <Input id="maxResults" v-model.number="maxResults" type="number" min="1" placeholder="请输入输出结果上限"/>
          </div>
          <div>
            <Label for="boostIndex">体力消耗档位</Label>
            <div class="w-full">
              <Select v-model="boostIndex">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="选择体力消耗档位"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>体力档位</SelectLabel>
                    <SelectItem
                        v-for="(rate, index) in boostRateTable"
                        :key="index"
                        :value="index"
                    >
                      {{ index }} ({{ rate }}倍)
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
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

<style scoped></style>