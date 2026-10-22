<script setup lang="ts">
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"

const props = defineProps<{
  open: boolean
  target: GlobalGameBinding | null
  serverLabel: (server: string) => string
  /** Rejects on failure so the dialog stays open with the error. */
  onConfirm: () => Promise<void>
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
}>()
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    :title="t('adminGameBindings.deleteDialog.title')"
    :description="props.target
      ? t('adminGameBindings.deleteDialog.description', { server: props.serverLabel(props.target.server), gameUserId: props.target.gameUserId })
      : ''"
    :cancel-label="t('adminGameBindings.common.cancel')"
    :confirm-label="t('adminGameBindings.deleteDialog.confirm')"
    destructive
    :on-confirm="props.onConfirm"
    @update:open="emit('update:open', $event)"
  />
</template>
