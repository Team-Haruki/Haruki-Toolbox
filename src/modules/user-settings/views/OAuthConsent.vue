<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldX } from "lucide-vue-next"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { getScopeLabel, submitOAuthConsent } from "@/modules/user-settings/api/oauth2"
import { extractErrorMessage } from "@/lib/error-utils"

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const isSubmitting = ref(false)

// Parse query params from the authorization server redirect
const clientId = computed(() => String(route.query.client_id ?? ""))
const clientName = computed(() => String(route.query.client_name ?? t("oauth.consent.unknownApp")))
const scopeStr = computed(() => String(route.query.scope ?? ""))
const redirectUri = computed(() => String(route.query.redirect_uri ?? ""))
const state = computed(() => String(route.query.state ?? ""))
const codeChallenge = computed(() => String(route.query.code_challenge ?? ""))
const codeChallengeMethod = computed(() => String(route.query.code_challenge_method ?? ""))

const scopes = computed(() =>
  scopeStr.value ? scopeStr.value.split(" ").filter(Boolean) : []
)

const isValid = computed(() =>
  clientId.value !== "" && redirectUri.value !== "" && scopes.value.length > 0
)

async function submitConsent(approved: boolean) {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    const data = await submitOAuthConsent({
      clientId: clientId.value,
      redirectUri: redirectUri.value,
      scope: scopeStr.value,
      state: state.value || undefined,
      codeChallenge: codeChallenge.value || undefined,
      codeChallengeMethod: codeChallengeMethod.value || undefined,
      approved,
    })
    const redirectUrl = data.redirectUrl ?? data.redirect_url
    if (redirectUrl) {
      window.location.href = redirectUrl
      return
    }
    toast.error(t("oauth.consent.toast.failedTitle"), {
      description:
        data.message ||
        data.error_description ||
        data.errorDescription ||
        t("oauth.consent.toast.missingRedirect"),
    })
  } catch (e: unknown) {
    toast.error(t("oauth.consent.toast.failedTitle"), {
      description: extractErrorMessage(e, t("oauth.consent.toast.retry")),
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md" v-if="isValid">
      <CardHeader class="text-center">
        <div class="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck class="h-6 w-6 text-primary" />
        </div>
        <CardTitle class="text-xl">{{ t("oauth.consent.title") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.consent.descriptionPrefix") }}
          <strong class="text-foreground">{{ clientName }}</strong>
          {{ t("oauth.consent.descriptionSuffix") }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <p class="text-sm font-medium text-muted-foreground mb-2">{{ t("oauth.consent.scopeIntro") }}</p>
            <ul class="space-y-2">
              <li
                v-for="scope in scopes"
                :key="scope"
                class="flex items-center gap-2 text-sm"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {{ getScopeLabel(scope) }}
              </li>
            </ul>
          </div>
          <div class="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            {{ t("oauth.consent.revokeHint") }}
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          :disabled="isSubmitting"
          @click="submitConsent(false)"
        >
          <ShieldX class="h-4 w-4 mr-2" />
          {{ t("oauth.consent.reject") }}
        </Button>
        <Button
          class="flex-1"
          :disabled="isSubmitting"
          @click="submitConsent(true)"
        >
          <ShieldCheck class="h-4 w-4 mr-2" />
          {{ isSubmitting ? t("oauth.consent.authorizing") : t("oauth.consent.authorize") }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="w-full max-w-md" v-else>
      <CardHeader class="text-center">
        <CardTitle class="text-xl text-destructive">{{ t("oauth.consent.invalidTitle") }}</CardTitle>
        <CardDescription>
          {{ t("oauth.consent.invalidDescription") }}
        </CardDescription>
      </CardHeader>
      <CardFooter class="justify-center">
        <Button variant="outline" @click="router.push({ name: 'home' })">
          {{ t("oauth.consent.backHome") }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
