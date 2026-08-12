<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Gamepad2,
  LogIn,
  LucideClock,
  LucideCloudUpload,
  LucideUserRound,
  UserPlus,
} from "lucide-vue-next"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { useUserStore } from "@/shared/stores/user"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"

const { t, locale } = useI18n()
const userStore = useUserStore()
const { selectedAccount } = useGameAccountSelection()

// Light suite subset purely to surface the account's last upload time; the
// cache layer keeps this cheap on repeat visits.
const { uploadTime } = useUserSuite(["userGamedata"], selectedAccount)

const uploadTimeText = computed(() => {
  if (uploadTime.value == null) {
    return null
  }

  return new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short" })
    .format(suiteUploadTimeToMillis(uploadTime.value))
})
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <CardTitle class="flex items-center gap-2 text-base">
        <LucideUserRound class="h-4.5 w-4.5" />
        {{ t("home.accountCard.title") }}
      </CardTitle>
    </CardHeader>

    <CardContent v-if="userStore.isLoggedIn" class="flex flex-1 flex-col gap-3">
      <GameAccountSelect />
      <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LucideClock class="h-3.5 w-3.5 shrink-0" />
        <span v-if="uploadTimeText">{{ t("home.accountCard.dataUpdatedAt", { time: uploadTimeText }) }}</span>
        <span v-else>{{ t("home.accountCard.noUploadData") }}</span>
      </p>
      <div class="mt-auto grid grid-cols-2 gap-2">
        <router-link to="/upload-data" class="flex">
          <Button class="w-full">
            <LucideCloudUpload class="h-4 w-4" />
            {{ t("navigation.items.uploadData") }}
          </Button>
        </router-link>
        <router-link to="/user/game-account-bindings" class="flex">
          <Button variant="outline" class="w-full">
            <Gamepad2 class="h-4 w-4" />
            {{ t("home.gameAccountManagement") }}
          </Button>
        </router-link>
      </div>
    </CardContent>

    <CardContent v-else class="flex flex-1 flex-col gap-3">
      <p class="text-sm text-muted-foreground">{{ t("home.accountCard.guestDescription") }}</p>
      <div class="mt-auto grid grid-cols-2 gap-2">
        <router-link to="/user/login" class="flex">
          <Button class="w-full">
            <LogIn class="h-4 w-4" />
            {{ t("home.login") }}
          </Button>
        </router-link>
        <router-link to="/user/register" class="flex">
          <Button variant="outline" class="w-full">
            <UserPlus class="h-4 w-4" />
            {{ t("home.register") }}
          </Button>
        </router-link>
      </div>
    </CardContent>
  </Card>
</template>
