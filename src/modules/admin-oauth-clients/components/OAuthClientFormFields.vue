<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LucidePlus, LucideX } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { OAuthClient } from "@/types/admin"

interface ScopeOption {
  id: string
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
  availableScopes: ScopeOption[]
}

const props = defineProps<Props>()
const { t, locale } = useI18n()
const emit = defineEmits<{
  (event: "update:name", value: string): void
  (event: "update:clientType", value: NonNullable<OAuthClient["clientType"]>): void
  (event: "toggle-scope", scopeId: string, checked: boolean): void
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
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-2">
      <Label>{{ t("adminOAuthClients.form.nameLabel") }}</Label>
      <Input
        :model-value="props.name"
        :placeholder="t('adminOAuthClients.form.namePlaceholder')"
        @update:model-value="value => emit('update:name', String(value ?? ''))"
      />
    </div>
    <div class="flex flex-col gap-2">
      <Label>{{ t("adminOAuthClients.form.clientTypeLabel") }}</Label>
      <Select :key="locale" :model-value="props.clientType" @update:model-value="handleClientTypeChange">
        <SelectTrigger>
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
    <Label>{{ t("adminOAuthClients.form.scopesLabel") }}</Label>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="scope in props.availableScopes"
        :key="scope.id"
        type="button"
        :aria-pressed="props.scopes.includes(scope.id)"
        :class="[
          'rounded-full border px-2.5 py-1 text-xs transition-colors',
          props.scopes.includes(scope.id)
            ? 'border-primary/40 bg-primary/10 font-medium text-primary'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        ]"
        @click="emit('toggle-scope', scope.id, !props.scopes.includes(scope.id))"
      >
        {{ scope.label }}
      </button>
    </div>
  </div>

  <div class="flex flex-col gap-2">
    <Label>{{ t("adminOAuthClients.form.redirectUrisLabel") }}</Label>
    <div v-for="(uri, i) in props.redirectUris" :key="i" class="flex gap-2">
      <Input
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
    <Label>{{ t("adminOAuthClients.form.postLogoutRedirectUrisLabel") }}</Label>
    <p class="text-xs text-muted-foreground">{{ t("adminOAuthClients.form.postLogoutRedirectUrisHelp") }}</p>
    <div v-for="(uri, i) in props.postLogoutRedirectUris" :key="i" class="flex gap-2">
      <Input
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
</template>
