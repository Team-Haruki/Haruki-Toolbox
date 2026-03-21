<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { extractErrorMessage } from "@/lib/error-utils"
import {
  disableKratosOtherSessions,
  disableKratosSession,
  fetchKratosCurrentSession,
  fetchKratosMySessions,
  type KratosSessionInfo
} from "@/modules/auth/lib/kratos"
import { Laptop2, Loader2, RefreshCw, ShieldX } from "lucide-vue-next"

const { t } = useI18n()

const loading = ref(true)
const loadError = ref("")
const currentSession = ref<KratosSessionInfo | null>(null)
const otherSessions = ref<KratosSessionInfo[]>([])
const revokingSessionId = ref("")
const revokingOthers = ref(false)

const hasOtherSessions = computed(() => otherSessions.value.length > 0)

function formatDateTime(value: string | undefined): string {
  return formatLocalizedDateTime(value, undefined, "—")
}

function readDeviceLabel(session: KratosSessionInfo): string {
  const primary = session.devices[0]
  if (!primary) {
    return t("userSettings.sessions.page.unknownDevice")
  }

  return primary.userAgent?.trim() || t("userSettings.sessions.page.unknownDevice")
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

async function loadSessions() {
  loading.value = true
  loadError.value = ""

  try {
    const [current, others] = await Promise.all([
      fetchKratosCurrentSession(),
      fetchKratosMySessions(),
    ])

    currentSession.value = current
    const currentId = current?.id ?? ""
    otherSessions.value = others.filter((session) => session.id !== currentId)
  } catch (error: unknown) {
    loadError.value = extractErrorMessage(error, t("userSettings.sessions.page.loadFailed"))
  } finally {
    loading.value = false
  }
}

async function revokeSession(sessionId: string) {
  if (!sessionId || revokingSessionId.value || revokingOthers.value) {
    return
  }

  revokingSessionId.value = sessionId
  loadError.value = ""
  try {
    await disableKratosSession(sessionId)
    await loadSessions()
  } catch (error: unknown) {
    loadError.value = extractErrorMessage(error, t("userSettings.sessions.page.revokeFailed"))
  } finally {
    revokingSessionId.value = ""
  }
}

async function revokeOtherSessions() {
  if (revokingOthers.value || revokingSessionId.value) {
    return
  }

  revokingOthers.value = true
  loadError.value = ""
  try {
    await disableKratosOtherSessions()
    await loadSessions()
  } catch (error: unknown) {
    loadError.value = extractErrorMessage(error, t("userSettings.sessions.page.revokeOthersFailed"))
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
            <RefreshCw class="mr-2 h-4 w-4" />
            {{ t("userSettings.sessions.page.refresh") }}
          </Button>
          <Button
            variant="destructive"
            class="sm:w-auto"
            :disabled="loading || !hasOtherSessions || revokingOthers || revokingSessionId !== ''"
            @click="revokeOtherSessions"
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
          v-else-if="loadError"
          class="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {{ loadError }}
        </div>

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
            <div class="grid gap-1 text-xs text-muted-foreground">
              <div>{{ t("userSettings.sessions.page.issuedAt") }}: {{ formatDateTime(currentSession.issuedAt) }}</div>
              <div>{{ t("userSettings.sessions.page.authenticatedAt") }}: {{ formatDateTime(currentSession.authenticatedAt) }}</div>
              <div>{{ t("userSettings.sessions.page.expiresAt") }}: {{ formatDateTime(currentSession.expiresAt) }}</div>
              <div>{{ t("userSettings.sessions.page.aal") }}: {{ currentSession.aal || "—" }}</div>
            </div>
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
                <div class="grid gap-1 text-xs text-muted-foreground">
                  <div>{{ t("userSettings.sessions.page.issuedAt") }}: {{ formatDateTime(session.issuedAt) }}</div>
                  <div>{{ t("userSettings.sessions.page.authenticatedAt") }}: {{ formatDateTime(session.authenticatedAt) }}</div>
                  <div>{{ t("userSettings.sessions.page.expiresAt") }}: {{ formatDateTime(session.expiresAt) }}</div>
                  <div>{{ t("userSettings.sessions.page.aal") }}: {{ session.aal || "—" }}</div>
                </div>
                <Button
                  variant="destructive"
                  :disabled="revokingOthers || (revokingSessionId !== '' && revokingSessionId !== session.id)"
                  @click="revokeSession(session.id)"
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
  </div>
</template>
