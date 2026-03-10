<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LucideCopy } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

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
  <AlertDialog :open="open" @update:open="(value) => emit('update:open', value)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle class="text-green-600 dark:text-green-400">
          {{ t("adminOAuthClients.secretDialog.title") }}
        </AlertDialogTitle>
        <AlertDialogDescription>{{ t("adminOAuthClients.secretDialog.description") }}</AlertDialogDescription>
      </AlertDialogHeader>
      <div class="my-4 flex items-center justify-between gap-2 p-3 bg-muted rounded-md border text-sm font-mono break-all">
        <span class="text-foreground">{{ secret }}</span>
        <Button variant="ghost" size="sm" class="shrink-0 flex items-center" @click="emit('copy')">
          <LucideCopy class="w-4 h-4 mr-1" /> {{ t("adminOAuthClients.secretDialog.copy") }}
        </Button>
      </div>
      <AlertDialogFooter>
        <AlertDialogAction @click="emit('update:open', false)">
          {{ t("adminOAuthClients.secretDialog.confirmSaved") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
