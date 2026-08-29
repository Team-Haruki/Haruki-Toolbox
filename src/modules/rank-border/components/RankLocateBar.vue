<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { ChartLine, UserSearch } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import { useRankBorderContext } from "../composables/rank-border-context"

const { t } = useI18n()

const { query, detail, live, ui } = useRankBorderContext()
const {
  selectedAccountKey,
  accountOptions,
  selectedAccount,
  hideProfileAssets,
  updateAccount,
  intervalOptions,
  intervalSeconds,
} = query
const {
  locateSelectedAccount,
  selectedAccountDetail,
  mobileLocateOpen,
  detailLoading,
  detailError,
  detailDialogOpen,
  formatDetailRank,
  detailGrowth,
} = detail
const { canRefresh } = live
const {
  isMobileViewport,
  formatPt,
  formatGrowth,
  formatElapsed,
  elapsedSince,
} = ui
</script>

<template>
  <div class="grid min-w-0 gap-3">
  <div class="rank-border-locate-panels">
    <div class="rank-border-locate-panel">
      <div class="rank-border-account-controls">
        <Label id="rank-locate-account-label" for="rank-locate-account">{{ t("rankBorder.fields.account") }}</Label>
        <Select
          id="rank-locate-account"
          :model-value="selectedAccountKey"
          :disabled="accountOptions.length === 0"
          @update:model-value="updateAccount"
        >
          <SelectTrigger class="w-full" aria-labelledby="rank-locate-account-label">
            <GameAccountOption
              v-if="selectedAccount"
              :server="selectedAccount.server"
              :user-id="selectedAccount.userId"
              :verified="selectedAccount.verified"
              :is-default="selectedAccount.isDefault"
            />
            <span v-else class="text-sm text-muted-foreground">
              {{ t("rankBorder.fields.accountPlaceholder") }}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
              <GameAccountOption
                :server="account.server"
                :user-id="account.userId"
                :verified="account.verified"
                :is-default="account.isDefault"
              />
            </SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" :disabled="!canRefresh || accountOptions.length === 0 || detailLoading" @click="locateSelectedAccount">
          <UserSearch :class="['size-4', detailLoading ? 'animate-pulse' : '']" />
          {{ t("rankBorder.actions.locate") }}
        </Button>
      </div>

      <p
        :class="[
          'text-xs leading-5',
          accountOptions.length === 0 ? 'text-destructive' : 'text-muted-foreground',
        ]"
      >
        {{ accountOptions.length === 0 ? t("rankBorder.result.noBoundAccount") : t("rankBorder.sections.locateDescription") }}
      </p>
    </div>

    <div class="rank-border-locate-panel rank-border-locate-panel--switch">
      <div class="flex min-w-0 items-center gap-2">
        <Switch
          v-model="hideProfileAssets"
          class="shrink-0"
          :aria-label="t('rankBorder.fields.hideProfileAssets')"
        />
        <p class="min-w-0 text-sm font-medium leading-5">{{ t("rankBorder.fields.hideProfileAssets") }}</p>
      </div>
      <p class="text-xs leading-5 text-muted-foreground">{{ t("rankBorder.fields.hideProfileAssetsHint") }}</p>
    </div>
  </div>

  <section
    v-if="isMobileViewport && (mobileLocateOpen || selectedAccountDetail || detailLoading || detailError)"
    class="rank-border-mobile-locator md:hidden"
  >
    <div class="rank-border-mobile-locator__head">
      <div class="min-w-0">
        <p class="truncate text-xs text-muted-foreground">{{ t("rankBorder.sections.locateIndicator") }}</p>
        <p class="truncate text-sm font-semibold">{{ selectedAccount?.label ?? t("rankBorder.result.noBoundAccount") }}</p>
      </div>
      <Button
        v-if="selectedAccountDetail"
        type="button"
        variant="outline"
        size="sm"
        class="h-8 shrink-0"
        @click="detailDialogOpen = true"
      >
        <ChartLine class="size-4" />
        {{ t("rankBorder.actions.showDetails") }}
      </Button>
    </div>
    <div v-if="detailLoading && !selectedAccountDetail" class="rank-border-mobile-locator__state">
      {{ t("rankBorder.result.waitingLiveData") }}
    </div>
    <div v-else-if="detailError && !selectedAccountDetail" class="rank-border-mobile-locator__state rank-border-mobile-locator__state--error">
      {{ detailError }}
    </div>
    <div v-else-if="selectedAccountDetail" class="rank-border-mobile-locator__metrics">
      <div>
        <span>{{ t("rankBorder.result.rank") }}</span>
        <strong>{{ formatDetailRank(selectedAccountDetail) }}</strong>
      </div>
      <div>
        <span>{{ t("rankBorder.result.score") }}</span>
        <strong>{{ formatPt(selectedAccountDetail.result.score) }}</strong>
      </div>
      <div>
        <span>{{ t("rankBorder.result.intervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
        <strong :class="(detailGrowth(selectedAccountDetail) ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">
          {{ formatGrowth(detailGrowth(selectedAccountDetail)) }}
        </strong>
      </div>
      <div>
        <span>{{ t("rankBorder.result.latestPlain") }}</span>
        <strong>{{ formatElapsed(elapsedSince(selectedAccountDetail.result.timestamp)) }}</strong>
      </div>
    </div>
  </section>
  </div>
</template>

<style scoped>
.rank-border-locate-panels {
  display: grid;
  min-width: 0;
  gap: 0.75rem;
}

.rank-border-locate-panel {
  display: grid;
  min-width: 0;
  gap: 0.625rem;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  padding: 0.875rem;
}

.rank-border-account-controls {
  display: grid;
  min-width: 0;
  gap: 0.5rem;
}

@media (min-width: 1024px) {
  .rank-border-locate-panels {
    grid-template-columns: minmax(0, 1.5fr) minmax(16rem, 0.8fr);
    align-items: stretch;
  }

  .rank-border-account-controls {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .rank-border-account-controls label {
    grid-column: 1 / -1;
  }

  .rank-border-locate-panel--switch {
    align-content: start;
  }
}

.rank-border-mobile-locator {
  display: grid;
  min-width: 0;
  gap: 0.625rem;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  padding: 0.625rem;
  box-shadow: 0 8px 22px rgb(15 23 42 / 0.08);
}

.rank-border-mobile-locator__head {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.rank-border-mobile-locator__metrics {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.375rem;
}

.rank-border-mobile-locator__metrics div,
.rank-border-mobile-locator__state {
  min-width: 0;
  border: 1px solid color-mix(in oklab, var(--border) 76%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 84%, transparent);
  padding: 0.45rem 0.5rem;
}

.rank-border-mobile-locator__metrics span {
  display: block;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-locator__metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.125rem;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-locator__state {
  color: var(--muted-foreground);
  font-size: 0.8125rem;
}

.rank-border-mobile-locator__state--error {
  border-color: color-mix(in oklab, var(--destructive) 52%, var(--border));
  background: color-mix(in oklab, var(--destructive) 8%, var(--background));
  color: var(--destructive);
}
</style>
