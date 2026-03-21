<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useI18n } from "vue-i18n"

withDefaults(
  defineProps<{
    open: boolean
    clientId: string | null
  }>(),
  {
    clientId: null,
  }
)

const { t } = useI18n()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "confirm"): void
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="(value) => emit('update:open', value)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("adminOAuthClients.deleteDialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ t("adminOAuthClients.deleteDialog.descriptionPrefix") }}
          <strong>{{ clientId }}</strong>
          {{ t("adminOAuthClients.deleteDialog.descriptionSuffix") }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('update:open', false)">
          {{ t("adminOAuthClients.deleteDialog.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')">
          {{ t("adminOAuthClients.deleteDialog.confirm") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
