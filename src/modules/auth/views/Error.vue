<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { AlertTriangle, Loader2, LogIn, RefreshCw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { extractErrorMessage } from "@/lib/error-utils"
import { fetchKratosFlowError, type KratosFlowError } from "@/modules/auth/lib/kratos"

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

const resolvedMessage = computed(() =>
  flowError.value?.reason?.trim()
  || flowError.value?.message?.trim()
  || t("auth.error.fallbackDescription")
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
    loadError.value = extractErrorMessage(error, t("auth.error.loadFailedDescription"))
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
          <AlertTriangle class="h-6 w-6" />
          {{ t("auth.error.title") }}
        </CardTitle>
        <CardDescription>{{ t("auth.error.description") }}</CardDescription>
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
          <div class="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {{ resolvedMessage }}
          </div>

          <div class="grid gap-2 text-sm text-muted-foreground">
            <div class="break-all">
              {{ t("auth.error.errorIdLabel") }}: {{ flowError?.id || errorId }}
            </div>
            <div v-if="flowError?.code !== undefined">
              {{ t("auth.error.statusCodeLabel") }}: {{ flowError.code }}
            </div>
          </div>

          <div v-if="detailsText" class="space-y-2">
            <div class="text-sm font-medium">{{ t("auth.error.detailsLabel") }}</div>
            <pre class="max-h-80 overflow-auto rounded-md border bg-muted p-3 text-xs">{{ detailsText }}</pre>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row">
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
