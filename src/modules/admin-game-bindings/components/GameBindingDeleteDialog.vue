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
import { LucideLoader2 } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { GlobalGameBinding } from "@/modules/admin-game-bindings/api/binding"

defineProps<{
  open: boolean
  target: GlobalGameBinding | null
  actionLoading: boolean
  serverLabel: (server: string) => string
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "confirm"): void
}>()
</script>

<template>
  <AlertDialog :open="open" @update:open="emit('update:open', $event)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("adminGameBindings.deleteDialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription v-if="target">
          {{ t("adminGameBindings.deleteDialog.description", { server: serverLabel(target.server), gameUserId: target.gameUserId }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('update:open', false)">{{ t("adminGameBindings.common.cancel") }}</AlertDialogCancel>
        <AlertDialogAction @click="emit('confirm')" :disabled="actionLoading">
          <LucideLoader2 v-if="actionLoading" class="w-4 h-4 mr-1 animate-spin" />
          {{ t("adminGameBindings.deleteDialog.confirm") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
