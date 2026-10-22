<script setup lang="ts">
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"

const { t } = useI18n()

defineProps<{
  open: boolean
  deleteTarget: GameAccountBinding | null
  regionLabels: Record<SekaiRegion, string>
  /** Runs the deletion; must reject on failure so the dialog can stay open and say why. */
  onConfirm: () => Promise<unknown>
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
}>()
</script>

<template>
  <ConfirmDialog
    :open="open"
    :title="t('userSettings.gameBinding.deleteDialog.title')"
    :description="t('userSettings.gameBinding.deleteDialog.description', {
      server: deleteTarget ? regionLabels[deleteTarget.server] ?? deleteTarget.server : '',
      userId: deleteTarget?.userId ?? '',
    })"
    :confirm-label="t('userSettings.gameBinding.actions.delete')"
    :cancel-label="t('userSettings.common.cancel')"
    destructive
    :on-confirm="onConfirm"
    @update:open="emit('update:open', $event)"
  />
</template>
