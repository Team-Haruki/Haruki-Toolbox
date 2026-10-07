<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LucidePencilLine, LucidePlus, LucideX } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { OAuthClient, OAuthClientDevicePolicy } from "@/types/admin"
import {
  DEVICE_MAX_CODES_PER_10M_DEFAULT,
  DEVICE_MAX_CODES_PER_10M_MAX,
  DEVICE_MAX_CODES_PER_10M_MIN,
  type ManagedGrantType,
  canAllowDeviceWrite,
  hasAuthorizationCodeGrant,
  hasDeviceGrant,
  isFirstPartyApplicable,
} from "@/modules/admin-oauth-clients/lib/grant-types"

interface ScopeOption {
  id: string
  label: string
  /** Write scopes act on the user's behalf and are marked as such. */
  write?: boolean
}

interface GrantTypeOption {
  id: ManagedGrantType
  label: string
}

interface RedirectUriUpdatePayload {
  index: number
  value: string
}

interface Props {
  name: string
  clientType: NonNullable<OAuthClient["clientType"]>
  scopes: string[]
  redirectUris: string[]
  postLogoutRedirectUris: string[]
  grantTypes: ManagedGrantType[]
  devicePolicy: OAuthClientDevicePolicy
  availableScopes: ScopeOption[]
  availableGrantTypes: GrantTypeOption[]
}

const props = defineProps<Props>()
const { t, locale } = useI18n()
const emit = defineEmits<{
  (event: "update:name", value: string): void
  (event: "update:clientType", value: NonNullable<OAuthClient["clientType"]>): void
  (event: "toggle-scope", scopeId: string, checked: boolean): void
  (event: "toggle-grant-type", grantType: ManagedGrantType, checked: boolean): void
  (event: "update-device-policy", update: Partial<OAuthClientDevicePolicy>): void
  (event: "add-redirect-uri"): void
  (event: "remove-redirect-uri", index: number): void
  (event: "update-redirect-uri", payload: RedirectUriUpdatePayload): void
  (event: "add-post-logout-redirect-uri"): void
  (event: "remove-post-logout-redirect-uri", index: number): void
  (event: "update-post-logout-redirect-uri", payload: RedirectUriUpdatePayload): void
}>()

function isClientType(value: unknown): value is NonNullable<OAuthClient["clientType"]> {
  return value === "public" || value === "confidential"
}

function handleClientTypeChange(value: unknown) {
  if (!isClientType(value)) return
  emit("update:clientType", value)
}

const deviceSelected = computed(() => hasDeviceGrant(props.grantTypes))
const redirectUrisRequired = computed(() => hasAuthorizationCodeGrant(props.grantTypes))
const firstPartyApplicable = computed(() => isFirstPartyApplicable(props.clientType))
const allowWriteEligible = computed(() => canAllowDeviceWrite({
  clientType: props.clientType,
  grantTypes: props.grantTypes,
  scopes: props.scopes,
}))

function handleMaxCodesChange(value: string | number) {
  const text = String(value ?? "").trim()
  // An emptied field becomes NaN, which the form reports as invalid instead of
  // silently sending the default.
  emit("update-device-policy", { maxCodesPer10m: text === "" ? Number.NaN : Number(text) })
}
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-2">
      <Label for="oauth-client-form-name">{{ t("adminOAuthClients.form.nameLabel") }}</Label>
      <Input
        id="oauth-client-form-name"
        :model-value="props.name"
        :placeholder="t('adminOAuthClients.form.namePlaceholder')"
        @update:model-value="value => emit('update:name', String(value ?? ''))"
      />
    </div>
    <div class="flex flex-col gap-2">
      <Label id="oauth-client-form-type-label" for="oauth-client-form-type">{{ t("adminOAuthClients.form.clientTypeLabel") }}</Label>
      <Select id="oauth-client-form-type" :key="locale" :model-value="props.clientType" @update:model-value="handleClientTypeChange">
        <SelectTrigger aria-labelledby="oauth-client-form-type-label">
          <SelectValue :placeholder="t('adminOAuthClients.form.clientTypePlaceholder')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="confidential">{{ t("adminOAuthClients.form.clientTypeConfidential") }}</SelectItem>
          <SelectItem value="public">{{ t("adminOAuthClients.form.clientTypePublic") }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-medium">{{ t("adminOAuthClients.form.grantTypesLabel") }}</h3>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="grantType in props.availableGrantTypes"
        :key="grantType.id"
        type="button"
        :aria-pressed="props.grantTypes.includes(grantType.id)"
        :class="[
          'rounded-full border px-2.5 py-1 text-xs transition-colors',
          props.grantTypes.includes(grantType.id)
            ? 'border-primary/40 bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="emit('toggle-grant-type', grantType.id, !props.grantTypes.includes(grantType.id))"
      >
        {{ grantType.label }}
      </button>
    </div>
    <p class="text-xs text-muted-foreground">{{ t("adminOAuthClients.form.grantTypesHelp") }}</p>
  </div>

  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-medium">{{ t("adminOAuthClients.form.scopesLabel") }}</h3>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="scope in props.availableScopes"
        :key="scope.id"
        type="button"
        :aria-pressed="props.scopes.includes(scope.id)"
        :title="scope.write ? t('adminOAuthClients.form.writeScopeHint') : undefined"
        :class="[
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors',
          props.scopes.includes(scope.id)
            ? scope.write
              ? 'border-amber-500/50 bg-amber-500/10 font-medium text-amber-700 dark:text-amber-400'
              : 'border-primary/40 bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="emit('toggle-scope', scope.id, !props.scopes.includes(scope.id))"
      >
        <LucidePencilLine v-if="scope.write" class="h-3 w-3 shrink-0" aria-hidden="true" />
        {{ scope.label }}
        <span v-if="scope.write" class="sr-only">{{ t("adminOAuthClients.form.writeScopeHint") }}</span>
      </button>
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-medium">{{ t("adminOAuthClients.form.redirectUrisLabel") }}</h3>
    <p v-if="!redirectUrisRequired" class="text-xs text-muted-foreground">{{ t("adminOAuthClients.form.redirectUrisOptionalHelp") }}</p>
    <div v-for="(uri, i) in props.redirectUris" :key="i" class="flex gap-2">
      <Input
        :aria-label="`${t('adminOAuthClients.form.redirectUrisLabel')} ${i + 1}`"
        :model-value="uri"
        :placeholder="t('adminOAuthClients.form.redirectUriPlaceholder')"
        class="flex-1"
        @update:model-value="value => emit('update-redirect-uri', { index: i, value: String(value ?? '') })"
      />
      <Button
        v-if="props.redirectUris.length > 1"
        variant="ghost"
        size="icon"
        class="shrink-0"
        :title="t('adminOAuthClients.form.removeRedirectUri')"
        :aria-label="t('adminOAuthClients.form.removeRedirectUri')"
        @click="emit('remove-redirect-uri', i)"
      >
        <LucideX class="w-4 h-4" />
      </Button>
    </div>
    <Button variant="outline" size="sm" class="self-start" @click="emit('add-redirect-uri')">
      <LucidePlus class="w-4 h-4 mr-1" />
      {{ t("adminOAuthClients.form.addRedirectUri") }}
    </Button>
  </div>

  <div class="flex flex-col gap-2">
    <h3 class="text-sm font-medium">{{ t("adminOAuthClients.form.postLogoutRedirectUrisLabel") }}</h3>
    <p class="text-xs text-muted-foreground">{{ t("adminOAuthClients.form.postLogoutRedirectUrisHelp") }}</p>
    <div v-for="(uri, i) in props.postLogoutRedirectUris" :key="i" class="flex gap-2">
      <Input
        :aria-label="`${t('adminOAuthClients.form.postLogoutRedirectUrisLabel')} ${i + 1}`"
        :model-value="uri"
        :placeholder="t('adminOAuthClients.form.postLogoutRedirectUriPlaceholder')"
        class="flex-1"
        @update:model-value="value => emit('update-post-logout-redirect-uri', { index: i, value: String(value ?? '') })"
      />
      <Button
        v-if="props.postLogoutRedirectUris.length > 1"
        variant="ghost"
        size="icon"
        class="shrink-0"
        :title="t('adminOAuthClients.form.removeRedirectUri')"
        :aria-label="t('adminOAuthClients.form.removeRedirectUri')"
        @click="emit('remove-post-logout-redirect-uri', i)"
      >
        <LucideX class="w-4 h-4" />
      </Button>
    </div>
    <Button variant="outline" size="sm" class="self-start" @click="emit('add-post-logout-redirect-uri')">
      <LucidePlus class="w-4 h-4 mr-1" />
      {{ t("adminOAuthClients.form.addRedirectUri") }}
    </Button>
  </div>

  <section v-if="deviceSelected" class="flex flex-col gap-3" aria-labelledby="oauth-client-form-device-policy">
    <h3 id="oauth-client-form-device-policy" class="text-sm font-medium">{{ t("adminOAuthClients.form.devicePolicy.title") }}</h3>
    <p v-if="props.scopes.includes('email')" class="text-xs text-amber-700 dark:text-amber-400">
      {{ t("adminOAuthClients.form.devicePolicy.emailNeverGranted") }}
    </p>
    <div class="flex items-center justify-between gap-3 rounded-md border p-3">
      <div>
        <Label for="oauth-client-form-device-first-party">{{ t("adminOAuthClients.form.devicePolicy.firstParty") }}</Label>
        <p class="text-sm text-muted-foreground">
          {{ firstPartyApplicable ? t("adminOAuthClients.form.devicePolicy.firstPartyHelp") : t("adminOAuthClients.form.devicePolicy.firstPartyPublicHelp") }}
        </p>
      </div>
      <Switch
        id="oauth-client-form-device-first-party"
        :model-value="firstPartyApplicable && props.devicePolicy.firstParty"
        :disabled="!firstPartyApplicable"
        @update:model-value="emit('update-device-policy', { firstParty: Boolean($event) })"
      />
    </div>
    <div class="flex items-center justify-between gap-3 rounded-md border p-3">
      <div>
        <Label for="oauth-client-form-device-allow-write">{{ t("adminOAuthClients.form.devicePolicy.allowWrite") }}</Label>
        <p :class="['text-sm', props.devicePolicy.allowWrite && !allowWriteEligible ? 'text-destructive' : 'text-muted-foreground']">
          {{ t("adminOAuthClients.form.devicePolicy.allowWriteHelp") }}
        </p>
      </div>
      <!-- Stays enabled while on so an ineligible client can still turn it off. -->
      <Switch
        id="oauth-client-form-device-allow-write"
        :model-value="props.devicePolicy.allowWrite"
        :disabled="!allowWriteEligible && !props.devicePolicy.allowWrite"
        @update:model-value="emit('update-device-policy', { allowWrite: Boolean($event) })"
      />
    </div>
    <div class="flex flex-col gap-2">
      <Label for="oauth-client-form-device-max-codes">{{ t("adminOAuthClients.form.devicePolicy.maxCodesPer10m") }}</Label>
      <Input
        id="oauth-client-form-device-max-codes"
        type="number"
        inputmode="numeric"
        :min="DEVICE_MAX_CODES_PER_10M_MIN"
        :max="DEVICE_MAX_CODES_PER_10M_MAX"
        step="1"
        class="sm:max-w-40"
        :model-value="Number.isNaN(props.devicePolicy.maxCodesPer10m) ? '' : props.devicePolicy.maxCodesPer10m"
        @update:model-value="handleMaxCodesChange"
      />
      <p class="text-xs text-muted-foreground">
        {{ t("adminOAuthClients.form.devicePolicy.maxCodesPer10mHelp", { min: DEVICE_MAX_CODES_PER_10M_MIN, max: DEVICE_MAX_CODES_PER_10M_MAX, default: DEVICE_MAX_CODES_PER_10M_DEFAULT }) }}
      </p>
    </div>
  </section>
</template>
