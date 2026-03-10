<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, KeyRound, LucideInfo } from "lucide-vue-next"
import { UploadDataFileTab, UploadDataInheritTab } from "@/modules/tools/components"
import { useUploadDataTool } from "@/modules/tools/composables/useUploadDataTool"

const { t } = useI18n()

const {
  dataType,
  inheritServer,
  inheritId,
  inheritPassword,
  isSubmittingFile,
  isSubmittingInherit,
  uploadProgress,
  uploadStatus,
  boundAccounts,
  selectedAccountKey,
  disabledReason,
  isCNMySekaiForbidden,
  onFileChange,
  submitFileUpload,
  submitInheritUpload,
} = useUploadDataTool()
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Tabs default-value="inherit" class="max-w-md">
      <Alert variant="default" class="flex items-start gap-2">
        <LucideInfo class="h-4 w-4" />
        <div>
          <AlertDescription>{{ t("tools.uploadData.groupNotice", { groupId: "730020933" }) }}</AlertDescription>
        </div>
      </Alert>

      <TabsList class="grid w-full grid-cols-2">
        <TabsTrigger value="file" class="flex items-center gap-2">
          <FileUp class="h-4 w-4" />
          {{ t("tools.uploadData.tabs.file") }}
        </TabsTrigger>
        <TabsTrigger value="inherit" class="flex items-center gap-2">
          <KeyRound class="h-4 w-4" />
          {{ t("tools.uploadData.tabs.inherit") }}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file">
        <UploadDataFileTab
          v-model:data-type="dataType"
          v-model:selected-account-key="selectedAccountKey"
          :bound-accounts="boundAccounts"
          :disabled-reason="disabledReason"
          :is-cn-my-sekai-forbidden="isCNMySekaiForbidden"
          :is-submitting-file="isSubmittingFile"
          :upload-progress="uploadProgress"
          :upload-status="uploadStatus"
          @file-change="onFileChange"
          @submit="submitFileUpload"
        />
      </TabsContent>

      <TabsContent value="inherit">
        <UploadDataInheritTab
          v-model:data-type="dataType"
          v-model:inherit-server="inheritServer"
          v-model:inherit-id="inheritId"
          v-model:inherit-password="inheritPassword"
          :is-submitting-inherit="isSubmittingInherit"
          @submit="submitInheritUpload"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
