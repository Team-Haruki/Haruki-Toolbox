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
    <div class="flex items-center justify-between gap-2 rounded-xl border bg-muted/40 px-3 py-2.5">
      <span class="min-w-0 font-mono text-sm text-foreground select-all [overflow-wrap:anywhere]">{{ secret }}</span>
      <Button variant="outline" size="sm" class="shrink-0" @click="emit('copy')">
        <LucideCopy class="size-4" /> {{ t("adminOAuthClients.secretDialog.copy") }}
      </Button>
    </div>
  </ConfirmDialog>
</template>
