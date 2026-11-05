<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { AlertTriangle, CheckCircle2, Home, Loader2, LogIn, RefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { fetchKratosFlowError, type KratosFlowError } from "@/modules/auth/lib/kratos"
import { describeKratosError, describeKratosFlowError } from "@/modules/auth/lib/kratos-messages"

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const loadError = ref("")
const flowError = ref<KratosFlowError | null>(null)

const errorId = computed(() => {
  const rawId = route.query.id
  return typeof rawId === "string" ? rawId.trim() : ""
})

// Kratos reasons are developer English ("upstream failure"); the page explains
// in the user's language (by error id, known reason or status) and keeps the
// raw reason in the collapsed technical details for bug reports.
const explanation = computed(() => describeKratosFlowError(flowError.value) ?? t("auth.error.fallbackDescription"))

const rawReason = computed(() =>
  flowError.value?.reason?.trim()
  || flowError.value?.message?.trim()
  || ""
)

const detailsText = computed(() => {
  const details = flowError.value?.details
  if (details == null) {
    return ""
  }

  if (typeof details === "string") {
    return details
  }

  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
})

const showMissingId = computed(() => !loading.value && !loadError.value && !errorId.value)
const showResolvedError = computed(() => !loading.value && !loadError.value && !!errorId.value)

// Kratos sends an already signed-in user here from /login: nothing failed,
// so the page reads as a notice and leads home instead of back into login.
const alreadySignedIn = computed(() => flowError.value?.id?.trim() === "session_already_available")

async function goHome() {
  await router.push("/")
}

async function loadKratosError() {
  if (!errorId.value) {
    loadError.value = ""
    flowError.value = null
    loading.value = false
    return
  }

  loading.value = true
  loadError.value = ""
  try {
    flowError.value = await fetchKratosFlowError(errorId.value)
  } catch (error: unknown) {
    flowError.value = null
    loadError.value = describeKratosError(error, t("auth.error.loadFailedDescription"))
  } finally {
    loading.value = false
  }
}

function retryLoad() {
  void loadKratosError()
}

async function goLogin() {
  await router.push({ name: "user.login" })
}

watch(
  errorId,
  () => {
    void loadKratosError()
  },
  { immediate: true }
)
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-2xl">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <CheckCircle2 v-if="alreadySignedIn" class="h-6 w-6 text-primary" />
          <AlertTriangle v-else class="h-6 w-6" />
          {{ alreadySignedIn ? t("auth.error.alreadySignedInTitle") : t("auth.error.title") }}
        </CardTitle>
        <CardDescription>
          {{ alreadySignedIn ? t("auth.error.alreadySignedInDescription") : t("auth.error.description") }}
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="loading" class="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {{ t("auth.common.loadingFlow") }}
        </div>

        <div v-else-if="loadError" class="space-y-4">
          <div class="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {{ loadError }}
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Button class="flex-1" @click="retryLoad">
              <RefreshCw class="mr-2 h-4 w-4" />
              {{ t("auth.error.retry") }}
            </Button>
            <Button variant="outline" class="flex-1" @click="goLogin">
              <LogIn class="mr-2 h-4 w-4" />
              {{ t("auth.error.backToLogin") }}
            </Button>
          </div>
        </div>

        <div v-else-if="showMissingId" class="space-y-4">
          <div class="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
            {{ t("auth.error.missingIdDescription") }}
          </div>
          <Button class="w-full" @click="goLogin">
            <LogIn class="mr-2 h-4 w-4" />
            {{ t("auth.error.backToLogin") }}
          </Button>
        </div>

        <div v-else-if="showResolvedError" class="space-y-4">
          <div
            :class="alreadySignedIn
              ? 'rounded-md border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300'
              : 'rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'"
            :role="alreadySignedIn ? 'status' : 'alert'"
          >
            <p data-testid="kratos-error-explanation">{{ explanation }}</p>
          </div>

          <details class="group rounded-md border px-4 py-3 text-sm text-muted-foreground">
            <summary class="cursor-pointer select-none font-medium text-foreground/80">
              {{ t("auth.kratos.errorPage.technicalDetails") }}
            </summary>
            <div class="mt-3 grid gap-2">
              <div class="break-all">
                {{ t("auth.error.errorIdLabel") }}: {{ flowError?.id || errorId }}
              </div>
              <div v-if="flowError?.code !== undefined">
                {{ t("auth.error.statusCodeLabel") }}: {{ flowError.code }}
              </div>
              <div v-if="rawReason" class="break-words">
                {{ t("auth.kratos.errorPage.reasonLabel") }}: {{ rawReason }}
              </div>
              <div v-if="detailsText" class="space-y-2">
                <div class="font-medium">{{ t("auth.error.detailsLabel") }}</div>
                <pre class="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">{{ detailsText }}</pre>
              </div>
            </div>
          </details>

          <div v-if="alreadySignedIn" class="flex flex-col gap-2 sm:flex-row">
            <Button class="flex-1" @click="goHome">
              <Home class="mr-2 h-4 w-4" />
              {{ t("auth.error.backToHome") }}
            </Button>
          </div>
          <div v-else class="flex flex-col gap-2 sm:flex-row">
            <Button class="flex-1" @click="goLogin">
              <LogIn class="mr-2 h-4 w-4" />
              {{ t("auth.error.backToLogin") }}
            </Button>
            <Button variant="outline" class="flex-1" @click="retryLoad">
              <RefreshCw class="mr-2 h-4 w-4" />
              {{ t("auth.error.retry") }}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
