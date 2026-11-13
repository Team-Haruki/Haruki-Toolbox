<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { ChevronRight, CircleAlert, CircleX } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import AuthPageShell from "@/modules/auth/components/AuthPageShell.vue"
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

// The facts a bug report needs, label over value.
const technicalFacts = computed(() => {
  const facts: Array<{ key: string; label: string; value: string }> = [
    { key: "id", label: t("auth.error.errorIdLabel"), value: flowError.value?.id || errorId.value },
  ]
  if (flowError.value?.code !== undefined) {
    facts.push({ key: "code", label: t("auth.error.statusCodeLabel"), value: String(flowError.value.code) })
  }
  if (rawReason.value) {
    facts.push({ key: "reason", label: t("auth.kratos.errorPage.reasonLabel"), value: rawReason.value })
  }
  return facts
})
</script>

<template>
  <AuthPageShell
    :title="alreadySignedIn ? t('auth.error.alreadySignedInTitle') : t('auth.error.title')"
    :loading="loading"
    :load-error="loadError"
    :retry-label="t('auth.error.retry')"
    @restart="retryLoad"
  >
    <div v-if="showMissingId" class="grid min-w-0 gap-4 p-4">
      <p class="flex min-w-0 items-start gap-2 text-sm text-amber-800 dark:text-amber-300" role="alert">
        <CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span class="min-w-0 [overflow-wrap:anywhere]">{{ t("auth.error.missingIdDescription") }}</span>
      </p>
      <Button size="lg" class="w-full" @click="goLogin">{{ t("auth.error.backToLogin") }}</Button>
    </div>

    <div v-else-if="showResolvedError" class="divide-y divide-border/60">
      <div class="grid min-w-0 gap-4 p-4">
        <!-- An already signed-in visitor has nothing to fix: the heading says so and one button leads on. -->
        <p
          v-if="!alreadySignedIn"
          class="flex min-w-0 items-start gap-2 text-sm text-destructive"
          role="alert"
        >
          <CircleX class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span class="min-w-0 [overflow-wrap:anywhere]" data-testid="kratos-error-explanation">{{ explanation }}</span>
        </p>
        <Button v-if="alreadySignedIn" size="lg" class="w-full" @click="goHome">{{ t("auth.error.backToHome") }}</Button>
        <div v-else class="grid gap-2">
          <Button size="lg" class="w-full" @click="goLogin">{{ t("auth.error.backToLogin") }}</Button>
          <Button size="lg" variant="outline" class="w-full" @click="retryLoad">{{ t("auth.error.retry") }}</Button>
        </div>
      </div>

      <details class="group min-w-0 text-sm">
        <summary
          class="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-muted-foreground outline-none transition-colors select-none hover:text-foreground focus-visible:bg-muted/50 [&::-webkit-details-marker]:hidden"
        >
          <ChevronRight class="size-4 shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
          <span class="min-w-0">{{ t("auth.kratos.errorPage.technicalDetails") }}</span>
        </summary>
        <!-- Grid items do not shrink below their content by default: a long
             reason or a wide details dump would push the block past the
             panel on a phone, so every item may shrink (`min-w-0`). -->
        <dl class="grid gap-3 px-4 pb-4 [&>*]:min-w-0">
          <div v-for="fact in technicalFacts" :key="fact.key">
            <dt class="text-[11px] text-muted-foreground">{{ fact.label }}</dt>
            <dd class="text-sm tabular-nums [overflow-wrap:anywhere]">{{ fact.value }}</dd>
          </div>
          <div v-if="detailsText">
            <dt class="text-[11px] text-muted-foreground">{{ t("auth.error.detailsLabel") }}</dt>
            <dd>
              <pre class="font-mono text-xs whitespace-pre-wrap [overflow-wrap:anywhere]">{{ detailsText }}</pre>
            </dd>
          </div>
        </dl>
      </details>
    </div>

    <template v-if="!loading && !alreadySignedIn && (loadError || showResolvedError)" #footer>
      <router-link
        v-if="loadError"
        :to="{ name: 'user.login' }"
        class="font-medium text-foreground underline-offset-4 hover:underline"
      >
        {{ t("auth.error.backToLogin") }}
      </router-link>
      <router-link to="/" class="underline-offset-4 hover:text-foreground hover:underline">
        {{ t("auth.error.backToHome") }}
      </router-link>
    </template>
  </AuthPageShell>
</template>
