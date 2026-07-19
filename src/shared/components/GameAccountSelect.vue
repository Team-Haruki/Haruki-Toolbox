<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { LucideBadgeCheck } from "lucide-vue-next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"

const { t } = useI18n()
const { accounts, selectedAccountKey, selectAccount } = useGameAccountSelection()

function handleUpdate(value: unknown) {
  selectAccount(typeof value === "string" && value !== "" ? value : null)
}
</script>

<template>
  <div v-if="accounts.length > 0" class="grid gap-2">
    <Select :model-value="selectedAccountKey ?? undefined" @update:model-value="handleUpdate">
      <SelectTrigger class="w-full sm:w-72">
        <SelectValue :placeholder="t('gameAccountSelect.placeholder')" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="account in accounts" :key="account.key" :value="account.key">
          <span class="inline-flex items-center gap-1.5">
            <span>{{ resolveSekaiRegionLabel(account.server, t) }} · {{ account.userId }}</span>
            <LucideBadgeCheck
              v-if="account.verified"
              class="size-3.5 text-emerald-500"
              :aria-label="t('gameAccountSelect.verified')"
            />
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  </div>
  <p v-else class="text-sm text-muted-foreground">
    {{ t("gameAccountSelect.none") }}
    <RouterLink :to="{ name: 'user.gameAccountBindings' }" class="text-primary underline-offset-4 hover:underline">
      {{ t("gameAccountSelect.manage") }}
    </RouterLink>
  </p>
</template>
