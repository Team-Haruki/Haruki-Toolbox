<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  availableScopes: ScopeOption[]
  scopeIdPrefix: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "update:name", value: string): void
  (event: "update:clientType", value: NonNullable<OAuthClient["clientType"]>): void
  (event: "toggle-scope", scopeId: string, checked: boolean): void
  (event: "add-redirect-uri"): void
  (event: "remove-redirect-uri", index: number): void
  (event: "update-redirect-uri", payload: RedirectUriUpdatePayload): void
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
  <div class="grid grid-cols-2 gap-4">
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
      <Select :model-value="props.clientType" @update:model-value="handleClientTypeChange">
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
    <div class="flex flex-col gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
      <div v-for="scope in props.availableScopes" :key="scope.id" class="flex items-center space-x-2">
        <Checkbox
          :id="`${props.scopeIdPrefix}-${scope.id}`"
          :checked="props.scopes.includes(scope.id)"
          @update:checked="checked => emit('toggle-scope', scope.id, Boolean(checked))"
        />
        <label
          :for="`${props.scopeIdPrefix}-${scope.id}`"
          class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          {{ scope.label }}
        </label>
      </div>
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
        size="sm"
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
</template>
