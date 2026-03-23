<script setup lang="ts">
import {
  GameBindingAccountTable,
  GameBindingDeleteDialog,
  GameBindingEditDialog,
  GameBindingVerifyDialog,
} from "@/modules/user-settings/components/game-binding"
import { useGameAccountBindingManagement } from "@/modules/user-settings/composables/useGameAccountBindingManagement"
import { useI18n } from "vue-i18n"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LucideInfo } from "lucide-vue-next"

const {
  data,
  isCreating,
  generatedCode,
  showEditDialog,
  showVerifyDialog,
  showDeleteDialog,
  userIdInput,
  verificationTriggered,
  editTarget,
  deleteTarget,
  isSaving,
  isDeleting,
  isVerifying,
  allowCNMysekai,
  regionLabels,
  regionOptions,
  startAdd,
  startEdit,
  confirmDelete,
  handleDelete,
  handleEditSave,
  handleVerify,
  copyCodeToClipboard,
} = useGameAccountBindingManagement()

const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-4 px-0 py-4">
    <Alert variant="default" class="flex items-start gap-2 w-full max-w-2xl bg-muted/20">
      <LucideInfo class="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
      <div class="space-y-1 w-full">
        <AlertTitle>{{ t("userSettings.gameBinding.alert.title") }}</AlertTitle>
        <AlertDescription class="space-y-1.5 leading-relaxed text-muted-foreground mt-2">
          <p v-html="t('userSettings.gameBinding.alert.line1')"></p>
          <p>{{ t("userSettings.gameBinding.alert.line2") }}</p>
          <p>{{ t("userSettings.gameBinding.alert.line3") }}</p>
          <p>
            {{ t("userSettings.gameBinding.alert.line4Before") }}
            <router-link to="/tickets" class="font-medium underline underline-offset-4 text-primary hover:text-primary/80 transition-colors">{{ t("userSettings.gameBinding.alert.line4Link") }}</router-link>
            {{ t("userSettings.gameBinding.alert.line4After") }}
          </p>
          <p>{{ t("userSettings.gameBinding.alert.line5") }}</p>
        </AlertDescription>
      </div>
    </Alert>

    <GameBindingAccountTable
      :data="data"
      :region-labels="regionLabels"
      @add="startAdd"
      @edit="startEdit"
      @delete="confirmDelete"
    />

    <GameBindingEditDialog
      v-model:open="showEditDialog"
      :is-creating="isCreating"
      :verification-triggered="verificationTriggered"
      :is-saving="isSaving"
      :is-verifying="isVerifying"
      :allow-c-n-mysekai="allowCNMysekai"
      :user-id-input="userIdInput"
      :edit-target="editTarget"
      :region-options="regionOptions"
      @update:user-id-input="userIdInput = $event"
      @update:edit-target="editTarget = $event"
      @verify="handleVerify"
      @save="handleEditSave"
    />

    <GameBindingDeleteDialog
      v-model:open="showDeleteDialog"
      :delete-target="deleteTarget"
      :region-labels="regionLabels"
      :is-deleting="isDeleting"
      @confirm="handleDelete"
    />

    <GameBindingVerifyDialog
      v-model:open="showVerifyDialog"
      :generated-code="generatedCode"
      @copy="copyCodeToClipboard"
    />
  </div>
</template>
