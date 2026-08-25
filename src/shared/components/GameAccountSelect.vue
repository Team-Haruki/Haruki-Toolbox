<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import type { GameAccountCapabilityName } from "@/shared/sekai/user-snapshot/accessible-accounts"
import { useGameAccountSelection } from "@/shared/sekai/user-snapshot/use-user-suite"

const props = defineProps<{
  /** Feature gate passed through to the selection composable — must match the capability the page's data composables use. */
  capability?: GameAccountCapabilityName
}>()

const { t } = useI18n()
const { accounts, selectedAccount, selectedAccountKey, selectAccount } = useGameAccountSelection({
  capability: props.capability,
})

const ownAccounts = computed(() => accounts.value.filter((account) => account.ownership === "own"))
const grantedAccounts = computed(() => accounts.value.filter((account) => account.ownership === "granted"))

function handleUpdate(value: unknown) {
  selectAccount(typeof value === "string" && value !== "" ? value : null)
}
</script>

<template>
  <div v-if="accounts.length > 0" class="grid gap-2">
    <Select :model-value="selectedAccountKey ?? undefined" @update:model-value="handleUpdate">
      <SelectTrigger class="w-full sm:w-72">
        <!-- No owner name in the always-visible trigger: it would crush the
             uid in the fixed-width trigger and stay visible even with the
             hide-game-uid privacy toggle on. The badge still marks the
             account as granted; the dropdown option carries the name. -->
        <GameAccountOption
          v-if="selectedAccount"
          :server="selectedAccount.server"
          :user-id="selectedAccount.userId"
          :verified="selectedAccount.verified"
          :is-default="selectedAccount.isDefault"
          :ownership="selectedAccount.ownership"
        />
        <span v-else class="text-sm text-muted-foreground">
          {{ t("gameAccountSelect.placeholder") }}
        </span>
      </SelectTrigger>
      <SelectContent>
        <!-- Flat list while no granted accounts exist: the common case keeps its familiar look. -->
        <template v-if="grantedAccounts.length === 0">
          <SelectItem
            v-for="account in ownAccounts"
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
        </template>
        <template v-else>
          <SelectGroup v-if="ownAccounts.length > 0">
            <SelectLabel class="text-xs text-muted-foreground">{{ t("gameAccountSelect.groups.own") }}</SelectLabel>
            <SelectItem
              v-for="account in ownAccounts"
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
          </SelectGroup>
          <SelectGroup>
            <SelectLabel class="text-xs text-muted-foreground">{{ t("gameAccountSelect.groups.granted") }}</SelectLabel>
            <SelectItem
              v-for="account in grantedAccounts"
              :key="account.key"
              :value="account.key"
            >
              <GameAccountOption
                :server="account.server"
                :user-id="account.userId"
                :verified="account.verified"
                ownership="granted"
                :owner-name="account.owner?.name"
              />
            </SelectItem>
          </SelectGroup>
        </template>
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
