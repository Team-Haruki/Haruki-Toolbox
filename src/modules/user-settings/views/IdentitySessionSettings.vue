<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRoute } from "vue-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { formatLocalizedDateTime } from "@/lib/date-time"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import { describeKratosError } from "@/modules/auth/lib/kratos-messages"
import { KratosRequestError } from "@/modules/auth/lib/kratos-errors"
import {
  disableKratosOtherSessions,
  disableKratosSession,
  fetchKratosCurrentSession,
  fetchKratosMySessions,
  type KratosSessionInfo
} from "@/modules/auth/lib/kratos"
import { describeUserAgent } from "@/modules/user-settings/lib/user-agent"
import { Laptop2, Loader2, LogIn, RefreshCw, ShieldX } from "lucide-vue-next"

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const loadError = ref("")
/** Kratos answered 401: the login session is gone, so there is nothing to list. */
const sessionExpired = ref(false)
const currentSession = ref<KratosSessionInfo | null>(null)
const otherSessions = ref<KratosSessionInfo[]>([])
const revokingSessionId = ref("")
const revokingOthers = ref(false)
const revokeTarget = ref<KratosSessionInfo | null>(null)
const revokeOneDialogOpen = ref(false)
const revokeOthersDialogOpen = ref(false)

const hasOtherSessions = computed(() => otherSessions.value.length > 0)
const loginRoute = computed(() => ({ name: "user.login", query: { redirect: route.fullPath } }))

function formatDateTime(value: string | undefined): string {
  return formatLocalizedDateTime(value, undefined, "—")
}

function readDeviceLabel(session: KratosSessionInfo): string {
  const primary = session.devices[0]
  return describeUserAgent(primary?.userAgent, t("userSettings.sessions.page.unknownDevice"))
}

function readDeviceMeta(session: KratosSessionInfo): string {
  const primary = session.devices[0]
  if (!primary) {
    return "—"
  }

  const parts = [primary.ipAddress, primary.location]
    .map((item) => item?.trim() ?? "")
    .filter((item) => item !== "")
  return parts.join(" · ") || "—"
}

/** "Two-step" when the session reached aal2; everything else is a plain login. */
function readSecurityLevel(session: KratosSessionInfo): string {
  const aal = session.aal?.trim().toLowerCase() ?? ""
  return aal === "aal2"
    ? t("userSettings.sessions.page.securityLevel.twoFactor")
    : t("userSettings.sessions.page.securityLevel.normal")
}

function isSessionExpiredError(error: unknown): boolean {
  return error instanceof KratosRequestError && error.status === 401
}

async function loadSessions() {
  loading.value = true
  loadError.value = ""
  sessionExpired.value = false

  try {
    const [current, others] = await Promise.all([
      fetchKratosCurrentSession(),
      fetchKratosMySessions(),
    ])

    currentSession.value = current
    const currentId = current?.id ?? ""
    otherSessions.value = others.filter((session) => session.id !== currentId)
  } catch (error: unknown) {
    if (isSessionExpiredError(error)) {
      sessionExpired.value = true
    } else {
      loadError.value = describeKratosError(error, t("userSettings.sessions.page.loadFailed"))
    }
  } finally {
    loading.value = false
  }
}

function requestRevokeSession(session: KratosSessionInfo) {
  revokeTarget.value = session
  revokeOneDialogOpen.value = true
}

/** Runs inside the confirm dialog: rejects with a localized message on failure. */
async function revokeSession() {
  const sessionId = revokeTarget.value?.id ?? ""
  if (!sessionId || revokingSessionId.value || revokingOthers.value) {
    return
  }

  revokingSessionId.value = sessionId
  try {
    try {
      await disableKratosSession(sessionId)
    } catch (error: unknown) {
      throw new Error(describeKratosError(error, t("userSettings.sessions.page.revokeFailed")), { cause: error })
    }
    revokeTarget.value = null
    await loadSessions()
  } finally {
    revokingSessionId.value = ""
  }
}

async function revokeOtherSessions() {
  if (revokingOthers.value || revokingSessionId.value) {
    return
  }

  revokingOthers.value = true
  try {
    try {
      await disableKratosOtherSessions()
    } catch (error: unknown) {
      throw new Error(describeKratosError(error, t("userSettings.sessions.page.revokeOthersFailed")), { cause: error })
    }
    await loadSessions()
  } finally {
    revokingOthers.value = false
  }
}

onMounted(() => {
  void loadSessions()
})
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <Card class="w-full max-w-3xl">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Laptop2 class="h-6 w-6" />
          {{ t("userSettings.sessions.page.title") }}
        </CardTitle>
        <CardDescription>{{ t("userSettings.sessions.page.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" class="sm:w-auto" :disabled="loading" @click="loadSessions">
            <RefreshCw class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" />
            {{ t("userSettings.sessions.page.refresh") }}
          </Button>
          <Button
            variant="destructive"
            class="sm:w-auto"
            :disabled="loading || !hasOtherSessions || revokingOthers || revokingSessionId !== ''"
            @click="revokeOthersDialogOpen = true"
          >
            <Loader2 v-if="revokingOthers" class="mr-2 h-4 w-4 animate-spin" />
            <ShieldX v-else class="mr-2 h-4 w-4" />
            {{ t("userSettings.sessions.page.revokeOthers") }}
          </Button>
        </div>

        <div v-if="loading" class="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          {{ t("auth.common.loadingFlow") }}
        </div>

        <div
          v-else-if="sessionExpired"
          class="flex flex-col items-center gap-3 rounded-md border bg-muted/30 px-4 py-8 text-center"
          data-testid="sessions-expired"
        >
          <p class="text-sm font-medium">{{ t("userSettings.sessions.page.sessionExpired") }}</p>
          <p class="max-w-md text-sm text-muted-foreground">{{ t("userSettings.sessions.page.sessionExpiredDescription") }}</p>
          <Button as-child size="sm">
            <RouterLink :to="loginRoute">
              <LogIn class="mr-2 h-4 w-4" />
              {{ t("userSettings.sessions.page.goLogin") }}
            </RouterLink>
          </Button>
        </div>

        <LoadErrorState
          v-else-if="loadError"
          :title="t('userSettings.sessions.page.loadFailed')"
          :description="loadError"
          :retrying="loading"
          @retry="loadSessions"
        />

        <div v-else class="space-y-4">
          <section v-if="currentSession" class="space-y-2 rounded-md border p-3">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-medium">{{ t("userSettings.sessions.page.currentSession") }}</h3>
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                {{ t("userSettings.sessions.page.currentTag") }}
              </span>
            </div>
            <div class="text-sm font-medium break-all">{{ readDeviceLabel(currentSession) }}</div>
            <div class="text-xs text-muted-foreground">{{ readDeviceMeta(currentSession) }}</div>
            <dl class="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              <div><dt class="inline">{{ t("userSettings.sessions.page.loginAt") }}: </dt><dd class="inline">{{ formatDateTime(currentSession.issuedAt) }}</dd></div>
              <div><dt class="inline">{{ t("userSettings.sessions.page.lastVerified") }}: </dt><dd class="inline">{{ formatDateTime(currentSession.authenticatedAt) }}</dd></div>
              <div><dt class="inline">{{ t("userSettings.sessions.page.expiresAt") }}: </dt><dd class="inline">{{ formatDateTime(currentSession.expiresAt) }}</dd></div>
              <div><dt class="inline">{{ t("userSettings.sessions.page.securityLevel.label") }}: </dt><dd class="inline">{{ readSecurityLevel(currentSession) }}</dd></div>
            </dl>
          </section>

          <section class="space-y-2">
            <h3 class="text-sm font-medium">{{ t("userSettings.sessions.page.otherSessions") }}</h3>

            <div v-if="!hasOtherSessions" class="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {{ t("userSettings.sessions.page.empty") }}
            </div>

            <div v-else class="space-y-2">
              <div v-for="session in otherSessions" :key="session.id" class="space-y-3 rounded-md border p-3">
                <div class="text-sm font-medium break-all">{{ readDeviceLabel(session) }}</div>
                <div class="text-xs text-muted-foreground">{{ readDeviceMeta(session) }}</div>
                <dl class="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <div><dt class="inline">{{ t("userSettings.sessions.page.loginAt") }}: </dt><dd class="inline">{{ formatDateTime(session.issuedAt) }}</dd></div>
                  <div><dt class="inline">{{ t("userSettings.sessions.page.lastVerified") }}: </dt><dd class="inline">{{ formatDateTime(session.authenticatedAt) }}</dd></div>
                  <div><dt class="inline">{{ t("userSettings.sessions.page.expiresAt") }}: </dt><dd class="inline">{{ formatDateTime(session.expiresAt) }}</dd></div>
                  <div><dt class="inline">{{ t("userSettings.sessions.page.securityLevel.label") }}: </dt><dd class="inline">{{ readSecurityLevel(session) }}</dd></div>
                </dl>
                <Button
                  variant="destructive"
                  :disabled="revokingOthers || (revokingSessionId !== '' && revokingSessionId !== session.id)"
                  @click="requestRevokeSession(session)"
                >
                  <Loader2 v-if="revokingSessionId === session.id" class="mr-2 h-4 w-4 animate-spin" />
                  <ShieldX v-else class="mr-2 h-4 w-4" />
                  {{ t("userSettings.sessions.page.revokeOne") }}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>

    <ConfirmDialog
      v-model:open="revokeOneDialogOpen"
      :title="t('userSettings.sessions.page.revokeOneDialog.title')"
      :description="t('userSettings.sessions.page.revokeOneDialog.description', {
        device: revokeTarget ? readDeviceLabel(revokeTarget) : '',
        meta: revokeTarget ? readDeviceMeta(revokeTarget) : '',
      })"
      :confirm-label="t('userSettings.sessions.page.revokeOne')"
      destructive
      :on-confirm="revokeSession"
    />

    <ConfirmDialog
      v-model:open="revokeOthersDialogOpen"
      :title="t('userSettings.sessions.page.revokeOthersDialog.title')"
      :description="t('userSettings.sessions.page.revokeOthersDialog.description', { count: otherSessions.length })"
      :confirm-label="t('userSettings.sessions.page.revokeOthers')"
      destructive
      :on-confirm="revokeOtherSessions"
    />
  </div>
</template>
