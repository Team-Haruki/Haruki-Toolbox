<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import { useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"

const { t } = useI18n()
const { accounts, selectedAccount, selectedAccountKey, selectAccount } = useGameAccountSelection()

function handleUpdate(value: unknown) {
  selectAccount(typeof value === "string" && value !== "" ? value : null)
}
</script>

<template>
  <div v-if="accounts.length > 0" class="grid gap-2">
    <Select :model-value="selectedAccountKey ?? undefined" @update:model-value="handleUpdate">
      <SelectTrigger class="w-full sm:w-72">
        <GameAccountOption
          v-if="selectedAccount"
          :server="selectedAccount.server"
          :user-id="selectedAccount.userId"
          :verified="selectedAccount.verified"
          :is-default="selectedAccount.isDefault"
        />
        <span v-else class="text-sm text-muted-foreground">
          {{ t("gameAccountSelect.placeholder") }}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="account in accounts"
          :key="account.key"
          :value="account.key"
        >
          <GameAccountOption
            :server="account.server"
            :user-id="account.userId"
            :verified="account.verified"
            :is-default="account.isDefault"
          />
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
