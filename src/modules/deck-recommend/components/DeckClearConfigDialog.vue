<script setup lang="ts">
import { useI18n } from "vue-i18n"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"

const open = defineModel<boolean>("open", { required: true })

const emit = defineEmits<{
  confirm: []
}>()

const { t } = useI18n()
</script>

<template>
  <ConfirmDialog
    v-model:open="open"
    :title="t('deckRecommend.configActions.clearDialogTitle')"
    :description="t('deckRecommend.configActions.clearDialogDescription')"
    :confirm-label="t('deckRecommend.configActions.clearDialogConfirm')"
    :cancel-label="t('deckRecommend.configActions.clearDialogCancel')"
    destructive
    :on-confirm="() => emit('confirm')"
  />
</template>
