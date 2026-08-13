<script setup lang="ts">
import { useI18n } from "vue-i18n"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"
import { Button } from "@/components/ui/button"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Inbox, KeyRound, Pencil, Plus, Star, Trash2 } from "lucide-vue-next"

defineProps<{
  data: GameAccountBinding[]
  regionLabels: Record<SekaiRegion, string>
}>()

const emit = defineEmits<{
  (e: "add"): void
  (e: "edit", account: GameAccountBinding): void
  (e: "delete", account: GameAccountBinding): void
  (e: "grants", account: GameAccountBinding): void
  (e: "received-grants"): void
  (e: "set-default", account: GameAccountBinding): void
}>()

const { t } = useI18n()
</script>

<template>
  <Card class="w-full max-w-2xl">
    <CardHeader class="space-y-4">
      <div>
        <CardTitle>{{ t("userSettings.gameBinding.title") }}</CardTitle>
        <CardDescription>
          {{ t("userSettings.gameBinding.description") }}
        </CardDescription>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" class="w-full sm:w-auto" @click="emit('received-grants')">
          <Inbox class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.actions.receivedGrants") }}
        </Button>
        <Button class="w-full sm:w-auto" @click="emit('add')">
          <Plus class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.addButton") }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <ul v-if="data.length" class="flex flex-col gap-2">
        <li
          v-for="account in data"
          :key="`${account.server}:${account.userId}`"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30"
        >
          <GameAccountOption
            class="min-w-0 flex-1 basis-56"
            :server="account.server"
            :user-id="account.userId"
            :verified="account.verified"
            :is-default="account.isDefault"
          />

          <VerificationStatusBadge
            v-if="!account.verified"
            class="shrink-0"
            :verified="false"
            :verified-label="t('userSettings.gameBinding.status.verified')"
            :unverified-label="t('userSettings.gameBinding.status.unverified')"
          />

          <div class="ml-auto flex shrink-0 items-center gap-0.5">
            <Button
              v-if="account.verified && !account.isDefault"
              variant="ghost"
              size="icon"
              :title="t('userSettings.gameBinding.actions.setDefault')"
              :aria-label="t('userSettings.gameBinding.actions.setDefault')"
              @click="emit('set-default', account)"
            >
              <Star class="h-4 w-4" />
            </Button>
            <Button
              v-if="account.verified"
              variant="ghost"
              size="icon"
              :title="t('userSettings.gameBinding.actions.grants')"
              :aria-label="t('userSettings.gameBinding.actions.grants')"
              @click="emit('grants', account)"
            >
              <KeyRound class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              :title="t('userSettings.gameBinding.actions.edit')"
              :aria-label="t('userSettings.gameBinding.actions.edit')"
              @click="emit('edit', account)"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive hover:text-destructive"
              :title="t('userSettings.gameBinding.actions.delete')"
              :aria-label="t('userSettings.gameBinding.actions.delete')"
              @click="emit('delete', account)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </li>
      </ul>

      <div
        v-else
        class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center"
      >
        <Inbox class="h-8 w-8 text-muted-foreground/60" />
        <p class="text-sm text-muted-foreground">{{ t("userSettings.gameBinding.empty") }}</p>
        <Button size="sm" @click="emit('add')">
          <Plus class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.addButton") }}
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
