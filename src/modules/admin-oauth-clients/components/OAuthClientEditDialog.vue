<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LucideLoader2 } from "lucide-vue-next"
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
  saving: boolean
  editClientId: string
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
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminOAuthClients.editDialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminOAuthClients.editDialog.descriptionPrefix") }}
          <code class="bg-muted px-1 py-0.5 rounded text-xs">{{ props.editClientId }}</code>
          {{ t("adminOAuthClients.editDialog.descriptionSuffix") }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-4">
        <OAuthClientFormFields
          :name="props.name"
          :client-type="props.clientType"
          :scopes="props.scopes"
          :redirect-uris="props.redirectUris"
          :available-scopes="props.availableScopes"
          scope-id-prefix="edit-scope"
          @update:name="value => emit('update:name', value)"
          @update:client-type="value => emit('update:client-type', value)"
          @toggle-scope="(scopeId, checked) => emit('toggle-scope', scopeId, checked)"
          @add-redirect-uri="emit('add-redirect-uri')"
          @remove-redirect-uri="index => emit('remove-redirect-uri', index)"
          @update-redirect-uri="payload => emit('update-redirect-uri', payload)"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t("adminOAuthClients.editDialog.cancel") }}
        </Button>
        <Button :disabled="props.saving" @click="emit('submit')">
          <LucideLoader2 v-if="props.saving" class="w-4 h-4 mr-1 animate-spin" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
