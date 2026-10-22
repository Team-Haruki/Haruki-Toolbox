<script setup lang="ts">
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input, InputWithToggle } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { LucideLoader2, LucideSave } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import FieldError from "@/shared/components/FieldError.vue"
import {
  WEBHOOK_FIELD_IDS,
  type WebhookFormErrors,
  type WebhookFormField,
} from "@/modules/admin-webhooks/composables/useAdminWebhookManagement"

const props = defineProps<{
  open: boolean
  formMode: "create" | "edit"
  formId: string
  formCredential: string
  formCallbackUrl: string
  formBearer: string
  formEnabled: boolean
  formClearBearer: boolean
  formSaving: boolean
  formErrors: WebhookFormErrors
  /** False when an edit has nothing to save yet; the save button is then disabled. */
  formDirty: boolean
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:formId", value: string): void
  (event: "update:formCredential", value: string): void
  (event: "update:formCallbackUrl", value: string): void
  (event: "update:formBearer", value: string): void
  (event: "update:formEnabled", value: boolean): void
  (event: "update:formClearBearer", value: boolean): void
  (event: "clearError", field: WebhookFormField): void
  (event: "save"): void
}>()

const { t } = useI18n()

const formTitle = computed(() =>
  props.formMode === "create"
    ? t("adminWebhooks.form.createTitle")
    : t("adminWebhooks.form.editTitle")
)

function errorId(field: WebhookFormField) {
  return `${WEBHOOK_FIELD_IDS[field]}-error`
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ formTitle }}</DialogTitle>
        <p class="text-sm text-muted-foreground">{{ t("adminWebhooks.form.description") }}</p>
      </DialogHeader>

      <form class="space-y-4" novalidate @submit.prevent="emit('save')">
        <div v-if="props.formMode === 'create'" class="space-y-2">
          <Label :for="WEBHOOK_FIELD_IDS.id">{{ t("adminWebhooks.form.idLabel") }}</Label>
          <Input
            :id="WEBHOOK_FIELD_IDS.id"
            :model-value="props.formId"
            :placeholder="t('adminWebhooks.form.idPlaceholder')"
            :disabled="props.formSaving"
            :aria-invalid="!!props.formErrors.id || undefined"
            :aria-describedby="props.formErrors.id ? errorId('id') : undefined"
            @update:model-value="emit('update:formId', String($event ?? '')); emit('clearError', 'id')"
          />
          <FieldError :id="errorId('id')" :message="props.formErrors.id" />
          <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.form.idHelp") }}</p>
        </div>

        <div v-else class="space-y-2">
          <p class="text-sm font-medium">{{ t("adminWebhooks.form.idLabel") }}</p>
          <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm font-medium">{{ props.formId }}</div>
        </div>

        <div class="space-y-2">
          <Label :for="WEBHOOK_FIELD_IDS.callbackUrl">{{ t("adminWebhooks.form.callbackUrlLabel") }}</Label>
          <Input
            :id="WEBHOOK_FIELD_IDS.callbackUrl"
            :model-value="props.formCallbackUrl"
            type="url"
            :placeholder="t('adminWebhooks.form.callbackUrlPlaceholder')"
            :disabled="props.formSaving"
            :aria-invalid="!!props.formErrors.callbackUrl || undefined"
            :aria-describedby="props.formErrors.callbackUrl ? errorId('callbackUrl') : undefined"
            @update:model-value="emit('update:formCallbackUrl', String($event ?? '')); emit('clearError', 'callbackUrl')"
          />
          <FieldError :id="errorId('callbackUrl')" :message="props.formErrors.callbackUrl" />
        </div>

        <div class="space-y-2">
          <Label :for="WEBHOOK_FIELD_IDS.credential">{{ t("adminWebhooks.form.credentialLabel") }}</Label>
          <Input
            :id="WEBHOOK_FIELD_IDS.credential"
            :model-value="props.formCredential"
            :placeholder="t('adminWebhooks.form.credentialPlaceholder')"
            :disabled="props.formSaving"
            :aria-invalid="!!props.formErrors.credential || undefined"
            :aria-describedby="props.formErrors.credential ? errorId('credential') : undefined"
            @update:model-value="emit('update:formCredential', String($event ?? '')); emit('clearError', 'credential')"
          />
          <FieldError :id="errorId('credential')" :message="props.formErrors.credential" />
          <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.form.credentialHelp") }}</p>
        </div>

        <div class="space-y-2">
          <Label for="webhook-bearer">{{ t("adminWebhooks.form.bearerLabel") }}</Label>
          <InputWithToggle
            id="webhook-bearer"
            :model-value="props.formBearer"
            type="password"
            :placeholder="t('adminWebhooks.form.bearerPlaceholder')"
            :disabled="props.formSaving || props.formClearBearer"
            @update:model-value="emit('update:formBearer', String($event ?? ''))"
          />
          <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.form.bearerHelp") }}</p>
        </div>

        <div v-if="props.formMode === 'edit'" class="flex items-center gap-3">
          <Checkbox
            id="webhook-clear-bearer"
            :model-value="props.formClearBearer"
            @update:model-value="emit('update:formClearBearer', $event === true)"
          />
          <Label for="webhook-clear-bearer">{{ t("adminWebhooks.form.clearBearerLabel") }}</Label>
        </div>

        <div class="flex items-center gap-3">
          <Switch
            id="webhook-enabled"
            :model-value="props.formEnabled"
            :disabled="props.formSaving"
            @update:model-value="emit('update:formEnabled', !!$event)"
          />
          <Label for="webhook-enabled">{{ t("adminWebhooks.form.enabledLabel") }}</Label>
        </div>

        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">{{ t("adminWebhooks.actions.cancel") }}</Button>
          </DialogClose>
          <Button
            type="submit"
            :disabled="props.formSaving || !props.formDirty"
            :title="!props.formDirty ? t('adminWebhooks.settings.noChanges') : undefined"
          >
            <LucideLoader2 v-if="props.formSaving" class="w-4 h-4 mr-2 animate-spin" />
            <LucideSave v-else class="w-4 h-4 mr-2" />
            {{ props.formMode === "create" ? t("adminWebhooks.actions.create") : t("common.save") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogScrollContent>
  </Dialog>
</template>
