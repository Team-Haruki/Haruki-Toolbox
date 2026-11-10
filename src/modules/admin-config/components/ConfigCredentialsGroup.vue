<script setup lang="ts">
/**
 * What the runtime configuration reports about its secrets and connection
 * settings, read-only. The backend never returns a secret, only whether one
 * is set; each line names the JSON field that replaces it through the
 * runtime editor. A member the backend does not report shows a dash.
 */
import { computed, type Component } from "vue"
import { useI18n } from "vue-i18n"
import { LucideKeyRound, LucideLock, LucidePackageOpen, LucideWebhook } from "lucide-vue-next"
import { Badge } from "@/components/ui/badge"
import SettingsFacts, { type SettingsFact } from "@/shared/components/settings/SettingsFacts.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow, { type SettingsRowTone } from "@/shared/components/settings/SettingsRow.vue"
import {
  RUNTIME_TEXT_KEYS,
  readRuntimeFlag,
  readRuntimeText,
  type RuntimeSecretKey,
} from "@/modules/admin-config/lib/runtime-facts"
import type { RuntimeConfig } from "@/types/admin"

const props = defineProps<{
  config: RuntimeConfig
}>()

const { t } = useI18n()

/** Each `…Configured` flag with the label and the writable field behind it. */
const SECRETS: ReadonlyArray<{ flag: RuntimeSecretKey; field: string; labelKey: string; icon: Component }> = [
  { flag: "privateApiTokenConfigured", field: "privateApiToken", labelKey: "privateApiToken", icon: LucideLock },
  { flag: "harukiProxySecretConfigured", field: "harukiProxySecret", labelKey: "harukiProxySecret", icon: LucideKeyRound },
  { flag: "harukiProxyUnpackKeyConfigured", field: "harukiProxyUnpackKey", labelKey: "harukiProxyUnpackKey", icon: LucidePackageOpen },
  { flag: "webhookJwtSecretConfigured", field: "webhookJwtSecret", labelKey: "webhookJwtSecret", icon: LucideWebhook },
]

const secretRows = computed(() => SECRETS.map((secret) => {
  const configured = readRuntimeFlag(props.config, secret.flag)
  const tone: SettingsRowTone = configured === null ? "default" : configured ? "success" : "warning"
  return { ...secret, configured, tone, label: t(`adminConfig.credentials.${secret.labelKey}`) }
}))

const textFacts = computed<SettingsFact[]>(() => RUNTIME_TEXT_KEYS.map((key) => {
  const value = readRuntimeText(props.config, key)
  return {
    key,
    label: t(`adminConfig.credentials.${key}`),
    value: value === null ? "—" : value || t("adminConfig.credentials.notSet"),
    mono: !!value,
  }
}))
</script>

<template>
  <SettingsGroup :title="t('adminConfig.credentials.title')" surface="card" data-testid="config-credentials">
    <SettingsRow
      v-for="secret in secretRows"
      :key="secret.flag"
      :icon="secret.icon"
      :tone="secret.tone"
      :label="secret.label"
      :data-secret="secret.flag"
    >
      <template #help>
        <code class="font-mono text-[11px] [overflow-wrap:anywhere]">({{ secret.field }})</code>
      </template>
      <Badge v-if="secret.configured === null" variant="muted">—</Badge>
      <Badge v-else :variant="secret.configured ? 'emerald' : 'amber'">
        {{ t(secret.configured ? "adminConfig.credentials.configured" : "adminConfig.credentials.notConfigured") }}
      </Badge>
    </SettingsRow>
    <SettingsFacts :items="textFacts" />
    <p class="px-4 py-2.5 text-xs text-muted-foreground">{{ t("adminConfig.credentials.note") }}</p>
  </SettingsGroup>
</template>
