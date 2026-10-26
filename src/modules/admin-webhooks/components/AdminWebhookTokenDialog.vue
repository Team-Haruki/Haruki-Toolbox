<script setup lang="ts">
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { LucideCopy } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

// The token is shown exactly once, so the dialog cannot be dismissed by
// accident: only the "I have saved it" button closes it.
const props = defineProps<{
  open: boolean
  token: string
  tokenHeaderName: string
  webhookId: string
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "copy"): void
}>()

const { t } = useI18n()
</script>

<template>
  <ConfirmDialog
    :open="props.open"
    non-dismissable
    :title="t('adminWebhooks.tokenDialog.title')"
    :description="t('adminWebhooks.tokenDialog.description', { id: props.webhookId })"
    :confirm-label="t('adminWebhooks.tokenDialog.confirmSaved')"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-4">
      <div class="space-y-2">
        <p class="text-sm font-medium">{{ t("adminWebhooks.tokenDialog.headerNameLabel") }}</p>
        <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm font-mono">
          {{ props.tokenHeaderName }}
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">{{ t("adminWebhooks.tokenDialog.tokenLabel") }}</p>
        <div class="max-h-56 overflow-auto rounded-md border bg-muted/20 px-3 py-2 text-sm font-mono break-all select-all">
          {{ props.token }}
        </div>
        <p class="text-xs text-muted-foreground">{{ t("adminWebhooks.tokenDialog.tokenHelp") }}</p>
      </div>

      <Button variant="outline" size="sm" @click="emit('copy')">
        <LucideCopy class="w-4 h-4 mr-2" />
        {{ t("adminWebhooks.actions.copyToken") }}
      </Button>
    </div>
  </ConfirmDialog>
</template>
