<script setup lang="ts">
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { useI18n } from "vue-i18n"

const props = defineProps<{
  open: boolean
  deleteTargetId: string
  /** Rejects on failure so the dialog stays open with the error. */
  onConfirm: () => Promise<void>
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
}>()

const { t } = useI18n()
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    :title="t('adminWebhooks.deleteDialog.title')"
    :description="t('adminWebhooks.deleteDialog.description', { id: props.deleteTargetId })"
    :cancel-label="t('adminWebhooks.actions.cancel')"
    :confirm-label="t('adminWebhooks.deleteDialog.confirm')"
    destructive
    :on-confirm="props.onConfirm"
    @update:open="emit('update:open', $event)"
  />
</template>
