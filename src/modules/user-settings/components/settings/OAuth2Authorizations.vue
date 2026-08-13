<script setup lang="ts">
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bot, Clock, Globe, KeyRound, Loader2, RefreshCw, Trash2, X } from "lucide-vue-next"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { extractErrorMessage } from "@/lib/error-utils"

import { ref, onMounted } from "vue"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  listOAuthAuthorizations,
  revokeOAuthAuthorization,
  getScopeLabel,
  type OAuthAuthorization,
} from "@/modules/user-settings/api/oauth2"


const { t } = useI18n()
const userStore = useUserStore()
const authorizations = ref<OAuthAuthorization[]>([])
const isLoading = ref(false)
const isRevoking = ref(false)
const showRevokeDialog = ref(false)
const revokeTarget = ref<OAuthAuthorization | null>(null)
let latestFetchRequestId = 0

async function fetchAuthorizations() {
  const requestId = ++latestFetchRequestId
  if (!userStore.userId) {
    if (requestId !== latestFetchRequestId) return
    authorizations.value = []
    isLoading.value = false
    return
  }
  isLoading.value = true
  try {
    const resp = await listOAuthAuthorizations(userStore.userId, { skipErrorToast: true })
    if (requestId !== latestFetchRequestId) return
    authorizations.value = unwrapUpdatedData(resp, t("userSettings.oauthAuthorizations.title"))
  } catch (e: unknown) {
    if (requestId !== latestFetchRequestId) return
    toast.error(t("userSettings.oauthAuthorizations.toast.fetchFailedTitle"), {
      description: extractErrorMessage(e, t("userSettings.oauthAuthorizations.toast.fetchFailedFallback")),
    })
  } finally {
    if (requestId !== latestFetchRequestId) return
    isLoading.value = false
  }
}

function confirmRevoke(auth: OAuthAuthorization) {
  revokeTarget.value = auth
  showRevokeDialog.value = true
}

async function handleRevoke() {
  if (!revokeTarget.value || !userStore.userId || isRevoking.value) return
  isRevoking.value = true
  try {
    await revokeOAuthAuthorization(userStore.userId, revokeTarget.value.clientId, { skipErrorToast: true })
    toast.success(t("userSettings.oauthAuthorizations.toast.revokeSuccessTitle"), {
      description: t("userSettings.oauthAuthorizations.toast.revokeSuccessDescription", {
        clientName: revokeTarget.value.clientName,
      }),
    })
    showRevokeDialog.value = false
    revokeTarget.value = null
    await fetchAuthorizations()
  } catch (e: unknown) {
    toast.error(t("userSettings.oauthAuthorizations.toast.revokeFailedTitle"), {
      description: extractErrorMessage(e, t("userSettings.oauthAuthorizations.toast.revokeFailedFallback")),
    })
  } finally {
    isRevoking.value = false
  }
}

function formatDate(iso: string): string {
  return formatLocalizedDateTime(iso, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }, iso)
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchAuthorizations()
  }
})
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <CardTitle class="flex items-center gap-2">
            <KeyRound class="h-6 w-6" />
            {{ t("userSettings.oauthAuthorizations.title") }}
          </CardTitle>
          <CardDescription>{{ t("userSettings.oauthAuthorizations.description") }}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          class="shrink-0 text-muted-foreground"
          :disabled="isLoading"
          :title="t('userSettings.oauthAuthorizations.refresh')"
          :aria-label="t('userSettings.oauthAuthorizations.refresh')"
          @click="fetchAuthorizations"
        >
          <RefreshCw class="h-4 w-4" :class="isLoading ? 'animate-spin' : ''" />
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="flex flex-col gap-2">
        <div
          v-for="i in 3"
          :key="i"
          class="flex items-center gap-3 rounded-md border bg-muted/20 p-3"
        >
          <Skeleton class="size-10 shrink-0 rounded-md" />
          <div class="min-w-0 flex-1 space-y-2">
            <Skeleton class="h-4 w-40 max-w-full" />
            <Skeleton class="h-3 w-56 max-w-full" />
          </div>
        </div>
      </div>

      <div
        v-else-if="authorizations.length === 0"
        class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-10 text-center"
      >
        <KeyRound class="h-8 w-8 text-muted-foreground/60" />
        <p class="text-sm font-medium">{{ t("userSettings.oauthAuthorizations.emptyTitle") }}</p>
        <p class="text-sm text-muted-foreground">{{ t("userSettings.oauthAuthorizations.emptyDescription") }}</p>
      </div>

      <ul v-else class="flex flex-col gap-2">
        <li
          v-for="auth in authorizations"
          :key="auth.clientId"
          class="flex items-start gap-3 rounded-md border bg-muted/20 p-3"
        >
          <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Bot v-if="auth.clientType === 'confidential'" class="size-5" />
            <Globe v-else class="size-5" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="truncate text-sm font-medium">{{ auth.clientName }}</span>
              <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {{
                  auth.clientType === 'confidential'
                    ? t("userSettings.oauthAuthorizations.clientType.bot")
                    : t("userSettings.oauthAuthorizations.clientType.website")
                }}
              </span>
            </div>
            <div class="mt-1.5 flex flex-wrap gap-1">
              <span
                v-for="scope in auth.scopes"
                :key="scope"
                class="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
              >
                {{ getScopeLabel(scope) }}
              </span>
            </div>
            <p class="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock class="size-3 shrink-0" />
              <span class="truncate">
                {{ t("userSettings.oauthAuthorizations.authorizedAtPrefix") }} {{ formatDate(auth.createdAt) }}
              </span>
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            class="text-destructive hover:text-destructive shrink-0"
            :disabled="isRevoking"
            :title="t('userSettings.oauthAuthorizations.dialog.revoke')"
            :aria-label="t('userSettings.oauthAuthorizations.dialog.revoke')"
            @click="confirmRevoke(auth)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </li>
      </ul>
    </CardContent>
  </Card>

  <AlertDialog v-model:open="showRevokeDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("userSettings.oauthAuthorizations.dialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("userSettings.oauthAuthorizations.dialog.description", { clientName: revokeTarget?.clientName ?? '' }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <X class="h-4 w-4 mr-2" />
          {{ t("userSettings.common.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction class="bg-destructive" :disabled="isRevoking" @click="handleRevoke">
          <Loader2 v-if="isRevoking" class="h-4 w-4 mr-2 animate-spin" />
          <Trash2 v-else class="h-4 w-4 mr-2" />
          {{ isRevoking ? t("userSettings.oauthAuthorizations.dialog.revoking") : t("userSettings.oauthAuthorizations.dialog.revoke") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
