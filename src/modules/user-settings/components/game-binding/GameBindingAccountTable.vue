<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"
import { Button } from "@/components/ui/button"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import { Gamepad2, KeyRound, Pencil, Plus, Star, Trash2 } from "lucide-vue-next"

defineProps<{
  data: GameAccountBinding[]
  regionLabels: Record<SekaiRegion, string>
}>()

const emit = defineEmits<{
  (e: "add"): void
  (e: "edit", account: GameAccountBinding): void
  (e: "delete", account: GameAccountBinding): void
  (e: "grants", account: GameAccountBinding): void
  (e: "set-default", account: GameAccountBinding): void
}>()

const { t } = useI18n()

/**
 * How many of an upload's sharing switches are on, as "3/5". The switches
 * live in the edit dialog; the list only says how open each upload is.
 * null when the binding carries no settings for that upload.
 */
function sharingCount(settings: object | null | undefined): string | null {
  if (settings == null) {
    return null
  }

  const values = Object.values(settings)
  return `${values.filter((value) => value === true).length}/${values.length}`
}
</script>

<template>
  <!-- The bound accounts as one list: the account on the left with what it
       shares underneath, its actions on the right. -->
  <SettingsGroup
    :title="data.length > 0 ? t('userSettings.gameBinding.listTitle', { count: data.length }) : t('userSettings.gameBinding.listTitleEmpty')"
    surface="card"
    data-testid="game-bindings"
  >
    <ul v-if="data.length" class="divide-y divide-border/60">
      <li
        v-for="account in data"
        :key="`${account.server}:${account.userId}`"
        class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3"
        :data-account="`${account.server}:${account.userId}`"
      >
        <div class="min-w-0 flex-1 basis-56">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <GameAccountOption
              :server="account.server"
              :user-id="account.userId"
              :verified="account.verified"
              :is-default="account.isDefault"
              inline-marks
            />
            <VerificationStatusBadge
              v-if="!account.verified"
              class="shrink-0"
              :verified="false"
              :verified-label="t('userSettings.gameBinding.status.verified')"
              :unverified-label="t('userSettings.gameBinding.status.unverified')"
            />
          </div>
          <!-- Indented under the server name, past the region badge. -->
          <p
            v-if="account.verified && (sharingCount(account.suite) != null || sharingCount(account.mysekai) != null)"
            class="mt-1 flex flex-wrap gap-x-3 pl-8 text-xs tabular-nums text-muted-foreground"
          >
            <span>{{ t("userSettings.gameBinding.sharing.label") }}</span>
            <span v-if="sharingCount(account.suite) != null">{{ t("userSettings.gameBinding.sharing.suite", { count: sharingCount(account.suite) }) }}</span>
            <span v-if="sharingCount(account.mysekai) != null">{{ t("userSettings.gameBinding.sharing.mysekai", { count: sharingCount(account.mysekai) }) }}</span>
          </p>
        </div>

        <div class="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            v-if="!account.verified"
            variant="outline"
            size="sm"
            class="mr-1"
            :title="t('userSettings.gameBinding.unverifiedHint')"
            @click="emit('edit', account)"
          >
            {{ t("userSettings.gameBinding.editDialog.verifyButton") }}
          </Button>
          <Button
            v-if="account.verified && !account.isDefault"
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground pointer-coarse:size-10"
            :title="t('userSettings.gameBinding.actions.setDefault')"
            :aria-label="t('userSettings.gameBinding.actions.setDefault')"
            @click="emit('set-default', account)"
          >
            <Star class="size-4" />
          </Button>
          <Button
            v-if="account.verified"
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground pointer-coarse:size-10"
            :title="t('userSettings.gameBinding.actions.grants')"
            :aria-label="t('userSettings.gameBinding.actions.grants')"
            @click="emit('grants', account)"
          >
            <KeyRound class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground pointer-coarse:size-10"
            :title="t('userSettings.gameBinding.actions.edit')"
            :aria-label="t('userSettings.gameBinding.actions.edit')"
            @click="emit('edit', account)"
          >
            <Pencil class="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
            :title="t('userSettings.gameBinding.actions.delete')"
            :aria-label="t('userSettings.gameBinding.actions.delete')"
            @click="emit('delete', account)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      </li>
    </ul>

    <div v-else class="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <Gamepad2 class="size-8 text-muted-foreground/60" />
      <p class="text-sm font-medium">{{ t("userSettings.gameBinding.emptyTitle") }}</p>
      <Button size="sm" class="mt-1" @click="emit('add')">
        <Plus class="size-4" />
        {{ t("userSettings.gameBinding.addButton") }}
      </Button>
    </div>
  </SettingsGroup>
</template>
