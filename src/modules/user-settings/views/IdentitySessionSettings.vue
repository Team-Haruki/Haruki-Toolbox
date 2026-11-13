<script setup lang="ts">
import { computed, onMounted, ref, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRoute } from "vue-router"
import { Button } from "@/components/ui/button"
import { formatLocalizedDateTime } from "@/lib/date-time"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import PageHeader from "@/shared/components/PageHeader.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import { describeKratosError } from "@/modules/auth/lib/kratos-messages"
import { KratosRequestError } from "@/modules/auth/lib/kratos-errors"
import {
  disableKratosOtherSessions,
  disableKratosSession,
  fetchKratosCurrentSession,
  fetchKratosMySessions,
  type KratosSessionInfo
} from "@/modules/auth/lib/kratos"
import { describeUserAgent, parseUserAgent } from "@/modules/user-settings/lib/user-agent"
import { Loader2, LogOut, Monitor, MonitorSmartphone, RefreshCw, Smartphone } from "lucide-vue-next"

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
  return formatLocalizedDateTime(value, "dateTime", "—")
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

const PHONE_SYSTEMS = new Set(["iOS", "Android", "HarmonyOS"])

/** A phone or a computer, from the device's operating system; a generic mark when unknown. */
function readDeviceIcon(session: KratosSessionInfo): Component {
  const os = parseUserAgent(session.devices[0]?.userAgent).os
  if (!os) {
    return MonitorSmartphone
  }
  return PHONE_SYSTEMS.has(os) ? Smartphone : Monitor
}

/** When the device signed in, was last verified and will be signed out, label over value. */
function readSessionFacts(session: KratosSessionInfo): Array<{ key: string; label: string; value: string }> {
  return [
    { key: "loginAt", label: t("userSettings.sessions.page.loginAt"), value: formatDateTime(session.issuedAt) },
    { key: "lastVerified", label: t("userSettings.sessions.page.lastVerified"), value: formatDateTime(session.authenticatedAt) },
    { key: "expiresAt", label: t("userSettings.sessions.page.expiresAt"), value: formatDateTime(session.expiresAt) },
    { key: "securityLevel", label: t("userSettings.sessions.page.securityLevel.label"), value: readSecurityLevel(session) },
  ]
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
  <div class="@container mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-0 py-4">
    <PageHeader
      size="compact"
      :title="t('userSettings.sessions.page.title')"
      :back="{ name: 'user.settings' }"
      :back-label="t('userSettings.kratosFlow.redirect.backToSettings')"
    >
      <template #actions>
        <Button variant="outline" size="sm" :disabled="loading" @click="loadSessions">
          <RefreshCw :class="['size-4', loading ? 'animate-spin motion-reduce:animate-none' : '']" aria-hidden="true" />
          {{ t("userSettings.sessions.page.refresh") }}
        </Button>
      </template>
    </PageHeader>

    <p
      v-if="loading"
      class="flex items-center justify-center gap-2 rounded-xl border bg-card px-4 py-12 text-sm text-muted-foreground"
      role="status"
    >
      <Loader2 class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
      {{ t("auth.common.loadingFlow") }}
    </p>

    <div v-else-if="sessionExpired" class="rounded-xl border bg-card px-4" data-testid="sessions-expired">
      <EmptyState :icon="LogOut" :title="t('userSettings.sessions.page.sessionExpired')">
        <template #action>
          <Button as-child size="sm">
            <RouterLink :to="loginRoute">{{ t("userSettings.sessions.page.goLogin") }}</RouterLink>
          </Button>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="loadError" class="rounded-xl border bg-card px-4">
      <LoadErrorState :title="loadError" description="" :retrying="loading" @retry="loadSessions" />
    </div>

    <template v-else>
      <SettingsGroup
        v-if="currentSession"
        :title="t('userSettings.sessions.page.currentSession')"
        surface="card"
        data-testid="sessions-current"
      >
        <SettingsRow
          :icon="readDeviceIcon(currentSession)"
          tone="primary"
          :label="readDeviceLabel(currentSession)"
        >
          <!-- An IPv6 address has no break opportunity of its own. -->
          <template #help>
            <span class="[overflow-wrap:anywhere]">{{ readDeviceMeta(currentSession) }}</span>
          </template>
          <template #below>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 @min-[34rem]:grid-cols-4">
              <div v-for="fact in readSessionFacts(currentSession)" :key="fact.key" class="min-w-0">
                <dt class="text-[11px] text-muted-foreground">{{ fact.label }}</dt>
                <dd class="text-xs tabular-nums">{{ fact.value }}</dd>
              </div>
            </dl>
          </template>
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup :title="t('userSettings.sessions.page.otherSessions')" surface="card" data-testid="sessions-others">
        <template v-if="hasOtherSessions" #action>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-destructive hover:text-destructive"
            :disabled="revokingOthers || revokingSessionId !== ''"
            @click="revokeOthersDialogOpen = true"
          >
            <Loader2 v-if="revokingOthers" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {{ t("userSettings.sessions.page.revokeOthers") }}
          </Button>
        </template>

        <EmptyState v-if="!hasOtherSessions" size="sm" :icon="MonitorSmartphone" :title="t('userSettings.sessions.page.empty')" />

        <SettingsRow
          v-for="session in otherSessions"
          :key="session.id"
          :icon="readDeviceIcon(session)"
          :label="readDeviceLabel(session)"
        >
          <template #help>
            <span class="[overflow-wrap:anywhere]">{{ readDeviceMeta(session) }}</span>
          </template>
          <Button
            variant="outline"
            size="sm"
            class="text-destructive hover:text-destructive"
            :aria-label="t('userSettings.sessions.page.revokeOneNamed', { device: readDeviceLabel(session) })"
            :disabled="revokingOthers || (revokingSessionId !== '' && revokingSessionId !== session.id)"
            @click="requestRevokeSession(session)"
          >
            <Loader2 v-if="revokingSessionId === session.id" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            {{ t("userSettings.sessions.page.revokeOne") }}
          </Button>
          <template #below>
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2 @min-[34rem]:grid-cols-4">
              <div v-for="fact in readSessionFacts(session)" :key="fact.key" class="min-w-0">
                <dt class="text-[11px] text-muted-foreground">{{ fact.label }}</dt>
                <dd class="text-xs tabular-nums">{{ fact.value }}</dd>
              </div>
            </dl>
          </template>
        </SettingsRow>
      </SettingsGroup>
    </template>

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
