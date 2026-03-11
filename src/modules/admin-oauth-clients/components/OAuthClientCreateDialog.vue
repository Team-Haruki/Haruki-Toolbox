<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LucideLoader2, LucidePlus } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { OAuthClient } from "@/types/admin"
import OAuthClientFormFields from "./OAuthClientFormFields.vue"

interface ScopeOption {
  id: string
  label: string
}

interface RedirectUriUpdatePayload {
  index: number
  value: string
}

interface Props {
  open: boolean
  creating: boolean
  clientId: string
  name: string
  clientType: NonNullable<OAuthClient["clientType"]>
  scopes: string[]
  redirectUris: string[]
  availableScopes: ScopeOption[]
}

const props = defineProps<Props>()
const { t } = useI18n()
const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:client-id", value: string): void
  (event: "update:name", value: string): void
  (event: "update:client-type", value: NonNullable<OAuthClient["clientType"]>): void
  (event: "toggle-scope", scopeId: string, checked: boolean): void
  (event: "add-redirect-uri"): void
  (event: "remove-redirect-uri", index: number): void
  (event: "update-redirect-uri", payload: RedirectUriUpdatePayload): void
  (event: "submit"): void
}>()
</script>

<template>
  <Dialog :open="props.open" @update:open="value => emit('update:open', value)">
    <DialogTrigger as-child>
      <Button size="sm">
        <LucidePlus class="w-4 h-4 mr-1" />
        {{ t("adminOAuthClients.createDialog.trigger") }}
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.createDialog.title") }}</DialogTitle>
        <DialogDescription>{{ t("adminOAuthClients.createDialog.description") }}</DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-4">
        <div class="flex flex-col gap-2">
          <Label>{{ t("adminOAuthClients.createDialog.clientIdLabel") }}</Label>
          <Input
            :model-value="props.clientId"
            :placeholder="t('adminOAuthClients.createDialog.clientIdPlaceholder')"
            @update:model-value="value => emit('update:client-id', String(value ?? ''))"
          />
        </div>
        <OAuthClientFormFields
          :name="props.name"
          :client-type="props.clientType"
          :scopes="props.scopes"
          :redirect-uris="props.redirectUris"
          :available-scopes="props.availableScopes"
          scope-id-prefix="new-scope"
          @update:name="value => emit('update:name', value)"
          @update:client-type="value => emit('update:client-type', value)"
          @toggle-scope="(scopeId, checked) => emit('toggle-scope', scopeId, checked)"
          @add-redirect-uri="emit('add-redirect-uri')"
          @remove-redirect-uri="index => emit('remove-redirect-uri', index)"
          @update-redirect-uri="payload => emit('update-redirect-uri', payload)"
        />
      </div>
      <DialogFooter>
        <Button :disabled="props.creating" @click="emit('submit')">
          <LucideLoader2 v-if="props.creating" class="w-4 h-4 mr-1 animate-spin" />
          {{ t("adminOAuthClients.createDialog.submit") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
