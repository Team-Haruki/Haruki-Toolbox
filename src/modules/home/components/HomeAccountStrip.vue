<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Gamepad2, LogIn, LucideClock, LucideCloudUpload, UserPlus } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"

const props = defineProps<{
  isLoggedIn: boolean
  hasBinding: boolean
  /** Formatted time of the selected account's last upload, null when none. */
  uploadTimeText: string | null
}>()

const { t } = useI18n()

const guestSteps = computed(() => [
  t("home.account.steps.signIn"),
  t("home.account.steps.bind"),
  t("home.account.steps.upload"),
])
// The next step is the primary action: bind an account first, then upload.
const uploadVariant = computed(() => (props.hasBinding ? "default" : "outline"))
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border bg-card px-4 py-3 shadow-xs"
    data-testid="home-account-strip"
  >
    <template v-if="isLoggedIn">
      <div class="flex min-w-0 flex-1 basis-64 flex-wrap items-center gap-x-4 gap-y-2">
        <div class="min-w-0 max-w-full">
          <GameAccountSelect capability="suite" />
        </div>
        <p v-if="hasBinding" class="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <LucideClock class="size-3.5 shrink-0" />
          {{ uploadTimeText ? t("home.accountCard.dataUpdatedAt", { time: uploadTimeText }) : t("home.accountCard.noUploadData") }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button v-if="!hasBinding" size="sm" as-child>
          <RouterLink to="/user/game-account-bindings">
            <Gamepad2 class="size-4" />
            {{ t("home.account.steps.bind") }}
          </RouterLink>
        </Button>
        <Button v-else variant="ghost" size="sm" as-child>
          <RouterLink to="/user/game-account-bindings">
            <Gamepad2 class="size-4" />
            {{ t("home.gameAccountManagement") }}
          </RouterLink>
        </Button>
        <Button :variant="uploadVariant" size="sm" as-child>
          <RouterLink to="/upload-data">
            <LucideCloudUpload class="size-4" />
            {{ t("navigation.items.uploadData") }}
          </RouterLink>
        </Button>
      </div>
    </template>

    <template v-else>
      <div class="min-w-0 flex-1 basis-64">
        <p class="text-sm font-semibold">{{ t("home.account.guestTitle") }}</p>
        <ol class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <li v-for="(step, index) in guestSteps" :key="step" class="inline-flex items-center gap-1.5">
            <span class="flex size-4.5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {{ index + 1 }}
            </span>
            {{ step }}
          </li>
        </ol>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button size="sm" as-child>
          <RouterLink to="/user/login">
            <LogIn class="size-4" />
            {{ t("home.login") }}
          </RouterLink>
        </Button>
        <Button variant="outline" size="sm" as-child>
          <RouterLink to="/user/register">
            <UserPlus class="size-4" />
            {{ t("home.register") }}
          </RouterLink>
        </Button>
      </div>
    </template>
  </div>
</template>
