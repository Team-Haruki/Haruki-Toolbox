<script setup lang="ts">
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { LucideCopy } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

// The secret is shown exactly once, so the dialog cannot be dismissed by
// accident: only the "I have saved it" button closes it.
withDefaults(
  defineProps<{
    open: boolean
    secret: string
  }>(),
  {
    secret: "",
  }
)

const { t } = useI18n()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "copy"): void
}>()
</script>

<template>
  <ConfirmDialog
    :open="open"
    non-dismissable
    :title="t('adminOAuthClients.secretDialog.title')"
    :description="t('adminOAuthClients.secretDialog.description')"
    :confirm-label="t('adminOAuthClients.secretDialog.confirmSaved')"
    @update:open="(value) => emit('update:open', value)"
  >
    <div class="flex items-center justify-between gap-2 p-3 bg-muted rounded-md border text-sm font-mono break-all">
      <span class="text-foreground">{{ secret }}</span>
      <Button variant="ghost" size="sm" class="shrink-0 flex items-center" @click="emit('copy')">
        <LucideCopy class="w-4 h-4 mr-1" /> {{ t("adminOAuthClients.secretDialog.copy") }}
      </Button>
    </div>
  </ConfirmDialog>
</template>
