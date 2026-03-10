<script setup lang="ts">
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { Button } from "@/components/ui/button"
import { KeyRound, Trash2, X } from "lucide-vue-next"
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


const { t, locale } = useI18n()
const userStore = useUserStore()
const authorizations = ref<OAuthAuthorization[]>([])
const isLoading = ref(false)
const isRevoking = ref(false)
const showRevokeDialog = ref(false)
const revokeTarget = ref<OAuthAuthorization | null>(null)

async function fetchAuthorizations() {
  if (!userStore.userId) return
  isLoading.value = true
  try {
    const resp = await listOAuthAuthorizations(userStore.userId, { skipErrorToast: true })
    authorizations.value = resp.updatedData ?? []
  } catch (e: unknown) {
    toast.error(t("userSettings.oauthAuthorizations.toast.fetchFailedTitle"), {
      description: extractErrorMessage(e, t("userSettings.oauthAuthorizations.toast.fetchFailedFallback")),
    })
  } finally {
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
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(locale.value, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchAuthorizations()
  }
})
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <div>
        <CardTitle class="flex items-center gap-2">
          <KeyRound class="h-6 w-6" />
          {{ t("userSettings.oauthAuthorizations.title") }}
        </CardTitle>
        <CardDescription>{{ t("userSettings.oauthAuthorizations.description") }}</CardDescription>
      </div>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="text-center text-muted-foreground py-6">
        {{ t("userSettings.oauthAuthorizations.loading") }}
      </div>
      <div v-else-if="authorizations.length === 0" class="text-center text-muted-foreground py-6">
        {{ t("userSettings.oauthAuthorizations.empty") }}
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="auth in authorizations"
          :key="auth.clientId"
          class="flex items-start justify-between gap-3 rounded-lg border p-3"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="font-medium text-sm">{{ auth.clientName }}</span>
              <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium">
                {{
                  auth.clientType === 'confidential'
                    ? t("userSettings.oauthAuthorizations.clientType.bot")
                    : t("userSettings.oauthAuthorizations.clientType.website")
                }}
              </span>
            </div>
            <div class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-for="scope in auth.scopes"
                :key="scope"
                class="inline-flex items-center rounded-full bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
              >
                {{ getScopeLabel(scope) }}
              </span>
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              {{ t("userSettings.oauthAuthorizations.authorizedAtPrefix") }} {{ formatDate(auth.createdAt) }}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            class="text-destructive hover:text-destructive shrink-0"
            :disabled="isRevoking"
            @click="confirmRevoke(auth)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </div>
      </div>
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
          <Trash2 class="h-4 w-4 mr-2" />
          {{ isRevoking ? t("userSettings.oauthAuthorizations.dialog.revoking") : t("userSettings.oauthAuthorizations.dialog.revoke") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
