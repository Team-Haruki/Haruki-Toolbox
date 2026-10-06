<script setup lang="ts">
import { computed } from "vue"
import type { UploadDataType } from "@/types"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import type { UploadTargetAccount } from "@/modules/tools/lib/upload-targets"
import {
  Database,
  Loader2,
  LucideAlertTriangle,
  LucideRefreshCw,
  LucideShieldAlert,
  Upload,
  UploadCloud,
} from "lucide-vue-next"

const props = withDefaults(
  defineProps<{
    dataType: UploadDataType
    uploadAccounts: UploadTargetAccount[]
    selectedAccount: UploadTargetAccount | null
    selectedAccountKey: string | null
    targetsLoading: boolean
    targetsFailed: boolean
    canShowMySekaiDataType: boolean
    canSelectSuiteDataType: boolean
    canSelectMySekaiDataType: boolean
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

const ownAccounts = computed(() => props.uploadAccounts.filter((account) => account.ownership === "own"))
const grantedAccounts = computed(() => props.uploadAccounts.filter((account) => account.ownership === "granted"))
const isGrantedTarget = computed(() => props.selectedAccount?.ownership === "granted")
const controlsDisabled = computed(() => !!props.disabledReason || props.targetsLoading)

const emit = defineEmits<{
  (event: "update:dataType", value: UploadDataType): void
  (event: "update:selectedAccountKey", value: string | null): void
  (event: "fileChange", payload: Event): void
  (event: "refreshTargets"): void
  (event: "submit"): void
}>()

function handleAccountChange(value: unknown) {
  emit("update:selectedAccountKey", typeof value === "string" && value !== "" ? value : null)
}

function handleDataTypeChange(value: unknown) {
  if (value === "suite" && props.canSelectSuiteDataType) {
    emit("update:dataType", value)
  } else if (value === "mysekai" && props.canSelectMySekaiDataType) {
    emit("update:dataType", value)
  }
}

function accountOptionTitle(account: UploadTargetAccount): string | undefined {
  return account.canUpload ? undefined : t("tools.uploadData.fileTab.accountNotWritable")
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
      <Alert v-if="targetsFailed" variant="default" class="mb-3 bg-muted/20">
        <LucideAlertTriangle class="h-5 w-5" />
        <AlertTitle>{{ t("tools.uploadData.fileTab.targetsFailedTitle") }}</AlertTitle>
        <AlertDescription>{{ t("tools.uploadData.fileTab.targetsFailedDescription") }}</AlertDescription>
      </Alert>
      <form id="upload-data-file-form" @submit.prevent="emit('submit')">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col space-y-1.5 sm:col-span-2">
            <Label for="file-upload">{{ t("tools.uploadData.fileTab.fields.file") }}</Label>
            <Input
              id="file-upload"
              type="file"
              class="w-full"
              :disabled="controlsDisabled"
              @change="emit('fileChange', $event)"
            />
          </div>
          <div class="flex flex-col space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <Label for="account-select">{{ t("tools.uploadData.fileTab.fields.account") }}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                class="h-7 px-2 text-xs"
                :disabled="targetsLoading"
                :title="t('tools.uploadData.fileTab.refreshTargets')"
                @click="emit('refreshTargets')"
              >
                <LucideRefreshCw class="h-3.5 w-3.5" :class="{ 'animate-spin': targetsLoading }" />
                {{ t("tools.uploadData.fileTab.refreshTargets") }}
              </Button>
            </div>
            <Select :key="locale"
              id="account-select"
              :model-value="selectedAccountKey ?? ''"
              :disabled="controlsDisabled"
              @update:model-value="handleAccountChange"
            >
              <SelectTrigger class="w-full">
                <GameAccountOption
                  v-if="selectedAccount"
                  :server="selectedAccount.server"
                  :user-id="selectedAccount.uid"
                  :verified="selectedAccount.verified"
                  :is-default="selectedAccount.isDefault"
                  :ownership="selectedAccount.ownership"
                />
                <span v-else class="text-sm text-muted-foreground">
                  {{ targetsLoading ? t("tools.uploadData.fileTab.targetsLoading") : t("tools.uploadData.fileTab.fields.accountPlaceholder") }}
                </span>
              </SelectTrigger>
              <SelectContent>
                <template v-if="grantedAccounts.length === 0">
                  <SelectItem
                    v-for="acc in ownAccounts"
                    :key="acc.key"
                    :value="acc.key"
                    :disabled="!acc.canUpload"
                    :title="accountOptionTitle(acc)"
                  >
                    <GameAccountOption
                      :server="acc.server"
                      :user-id="acc.uid"
                      :verified="acc.verified"
                      :is-default="acc.isDefault"
                    />
                  </SelectItem>
                </template>
                <template v-else>
                  <SelectGroup v-if="ownAccounts.length > 0">
                    <SelectLabel class="text-xs text-muted-foreground">{{ t("gameAccountSelect.groups.own") }}</SelectLabel>
                    <SelectItem
                      v-for="acc in ownAccounts"
                      :key="acc.key"
                      :value="acc.key"
                      :disabled="!acc.canUpload"
                      :title="accountOptionTitle(acc)"
                    >
                      <GameAccountOption
                        :server="acc.server"
                        :user-id="acc.uid"
                        :verified="acc.verified"
                        :is-default="acc.isDefault"
                      />
                    </SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel class="text-xs text-muted-foreground">{{ t("gameAccountSelect.groups.granted") }}</SelectLabel>
                    <SelectItem
                      v-for="acc in grantedAccounts"
                      :key="acc.key"
                      :value="acc.key"
                      :disabled="!acc.canUpload"
                      :title="accountOptionTitle(acc)"
                    >
                      <GameAccountOption
                        :server="acc.server"
                        :user-id="acc.uid"
                        :verified="acc.verified"
                        ownership="granted"
                      />
                    </SelectItem>
                  </SelectGroup>
                </template>
              </SelectContent>
            </Select>
            <p v-if="selectedAccount && !selectedAccount.canUpload" class="text-xs text-destructive">
              {{ t("tools.uploadData.fileTab.accountNotWritable") }}
            </p>
            <p v-else-if="isGrantedTarget" class="text-xs text-muted-foreground">
              {{ t("tools.uploadData.fileTab.grantedTargetNotice") }}
            </p>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label for="data-type-select">{{ t("tools.uploadData.fileTab.fields.dataType") }}</Label>
            <div class="relative w-full items-center">
              <Select :key="locale"
                id="data-type-select"
                :model-value="dataType"
                :disabled="controlsDisabled"
                @update:model-value="handleDataTypeChange"
              >
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.uploadData.fileTab.fields.dataTypePlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suite" :disabled="!canSelectSuiteDataType">
                    {{ t("tools.uploadData.dataTypes.suite") }}
                  </SelectItem>
                  <SelectItem v-if="canShowMySekaiDataType" value="mysekai" :disabled="!canSelectMySekaiDataType">
                    {{ t("tools.uploadData.dataTypes.mysekai") }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                <Database class="size-4 text-muted-foreground" />
              </span>
            </div>
            <p
              v-if="selectedAccount?.canUpload && (!canSelectSuiteDataType || (canShowMySekaiDataType && !canSelectMySekaiDataType && selectedAccount.server !== 'cn'))"
              class="text-xs text-muted-foreground"
            >
              {{ t("tools.uploadData.fileTab.dataTypeLimited") }}
            </p>
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex items-center justify-end">
      <Button
        type="submit"
        form="upload-data-file-form"
        variant="default"
        :disabled="isSubmittingFile || controlsDisabled || isCnMySekaiForbidden || !selectedAccount?.canUpload"
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
