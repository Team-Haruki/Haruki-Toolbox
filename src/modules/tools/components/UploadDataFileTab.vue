<script setup lang="ts">
import type { UploadDataType } from "@/types"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Database,
  Loader2,
  LucideAlertTriangle,
  LucideShieldAlert,
  Upload,
  UploadCloud,
  User,
} from "lucide-vue-next"

type BoundAccount = {
  key: string
  label: string
}

withDefaults(
  defineProps<{
    dataType: UploadDataType
    boundAccounts: BoundAccount[]
    selectedAccountKey: string | null
    disabledReason: string | null
    isCnMySekaiForbidden: boolean
    isSubmittingFile: boolean
    uploadProgress: number
    uploadStatus: string
  }>(),
  {
    selectedAccountKey: null,
    disabledReason: null,
  }
)

const { t, locale } = useI18n()

const emit = defineEmits<{
  (event: "update:dataType", value: UploadDataType): void
  (event: "update:selectedAccountKey", value: string | null): void
  (event: "fileChange", payload: Event): void
  (event: "submit"): void
}>()

function handleAccountChange(value: string) {
  emit("update:selectedAccountKey", value || null)
}

function handleDataTypeChange(value: string) {
  if (value === "suite" || value === "mysekai") {
    emit("update:dataType", value)
  }
}
</script>

<template>
  <Card class="dark:green">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Upload class="h-6 w-6" />
        {{ t("tools.uploadData.fileTab.title") }}
      </CardTitle>
      <CardDescription>{{ t("tools.uploadData.fileTab.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <Alert v-if="disabledReason" variant="destructive" class="mb-3">
        <LucideAlertTriangle class="h-5 w-5" />
        <AlertTitle>{{ t("tools.uploadData.fileTab.unavailableTitle") }}</AlertTitle>
        <AlertDescription>{{ disabledReason }}</AlertDescription>
      </Alert>
      <Alert v-else-if="isCnMySekaiForbidden" variant="destructive" class="mb-3">
        <LucideShieldAlert class="h-5 w-5" />
        <AlertTitle>{{ t("tools.uploadData.fileTab.forbiddenTitle") }}</AlertTitle>
        <AlertDescription>{{ t("tools.uploadData.fileTab.forbiddenDescription") }}</AlertDescription>
      </Alert>
      <form id="upload-data-file-form" @submit.prevent="emit('submit')">
        <div class="grid gap-4">
          <div class="flex flex-col space-y-1.5">
            <Label for="file-upload">{{ t("tools.uploadData.fileTab.fields.file") }}</Label>
            <Input
              id="file-upload"
              type="file"
              class="w-full"
              :disabled="!!disabledReason"
              @change="emit('fileChange', $event)"
            />
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label for="account-select">{{ t("tools.uploadData.fileTab.fields.account") }}</Label>
            <div class="relative w-full items-center">
              <Select :key="locale"
                id="account-select"
                :model-value="selectedAccountKey ?? ''"
                :disabled="!!disabledReason"
                @update:model-value="handleAccountChange"
              >
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.uploadData.fileTab.fields.accountPlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="acc in boundAccounts" :key="acc.key" :value="acc.key">
                    {{ acc.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label for="data-type-select">{{ t("tools.uploadData.fileTab.fields.dataType") }}</Label>
            <div class="relative w-full items-center">
              <Select :key="locale"
                id="data-type-select"
                :model-value="dataType"
                :disabled="!!disabledReason"
                @update:model-value="handleDataTypeChange"
              >
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.uploadData.fileTab.fields.dataTypePlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suite">{{ t("tools.uploadData.dataTypes.suite") }}</SelectItem>
                  <SelectItem value="mysekai">{{ t("tools.uploadData.dataTypes.mysekai") }}</SelectItem>
                </SelectContent>
              </Select>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                <Database class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex items-center justify-end">
      <Button
        type="submit"
        form="upload-data-file-form"
        variant="default"
        :disabled="isSubmittingFile || !!disabledReason || isCnMySekaiForbidden"
      >
        <Loader2 v-if="isSubmittingFile" class="mr-2 h-4 w-4 animate-spin" />
        <UploadCloud v-else class="mr-2 h-4 w-4" />
        {{ isSubmittingFile ? t("tools.uploadData.fileTab.submitting") : t("tools.uploadData.fileTab.submit") }}
      </Button>
    </CardFooter>
    <div v-if="isSubmittingFile || uploadStatus" class="w-full px-6">
      <Progress :model-value="uploadProgress" class="w-full h-3 rounded" />
      <div class="flex justify-between mt-2 text-sm font-medium">
        <span>{{ uploadStatus }}</span>
        <span v-if="isSubmittingFile">{{ uploadProgress }}%</span>
      </div>
    </div>
  </Card>
</template>
