<script setup lang="ts">
import { ref } from "vue"
import type { AcceptableValue } from "reka-ui"
import type { InheritServer, UploadDataType } from "@/types"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, InputWithToggle } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RouterLink } from "vue-router"
import {
  Database,
  Globe,
  Loader2,
  Lock,
  LucideChevronDown,
  LucideFileKey,
  LucideAlertTriangle,
  ServerCog,
  UploadCloud,
  User,
} from "lucide-vue-next"
import { INHERIT_FIELD_IDS, type InheritField } from "@/modules/tools/composables/useUploadDataTool"

const props = defineProps<{
  dataType: UploadDataType
  inheritServer: InheritServer
  inheritId: string
  inheritPassword: string
  fieldErrors: Record<InheritField, string>
  rememberInherit: boolean
  isSubmittingInherit: boolean
  /** MySekai uploads require a verified QQ binding; hidden otherwise. */
  canShowMySekaiDataType: boolean
}>()

const emit = defineEmits<{
  (event: "update:dataType", value: UploadDataType): void
  (event: "update:inheritServer", value: InheritServer): void
  (event: "update:inheritId", value: string): void
  (event: "update:inheritPassword", value: string): void
  (event: "update:rememberInherit", value: boolean): void
  (event: "clear-field-error", field: InheritField): void
  (event: "submit"): void
}>()

const FIELD_IDS = INHERIT_FIELD_IDS
const ERROR_IDS: Record<InheritField, string> = {
  inheritId: "inherit-id-error",
  inheritPassword: "inherit-password-error",
}

function handleDataTypeChange(value: AcceptableValue) {
  if (value === "suite" || (value === "mysekai" && props.canShowMySekaiDataType)) {
    emit("update:dataType", value)
  }
}

function handleServerChange(value: AcceptableValue) {
  if (value === "jp" || value === "en") {
    emit("update:inheritServer", value)
  }
}

const { t, locale } = useI18n()
const notesOpen = ref(false)
</script>

<template>
  <!-- One calm notice that still states the real risk in plain words. -->
  <Alert class="mb-2 border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-100">
    <LucideAlertTriangle class="h-5 w-5" />
    <AlertTitle>{{ t("tools.uploadData.inheritTab.alerts.warning1.title") }}</AlertTitle>
    <AlertDescription class="space-y-1 text-current">
      <p>{{ t("tools.uploadData.inheritTab.alerts.warning2.text") }}</p>
      <p>{{ t("tools.uploadData.inheritTab.alerts.warning1.description") }}</p>
    </AlertDescription>
  </Alert>

  <Collapsible v-model:open="notesOpen" class="mb-2 rounded-lg border bg-muted/20">
    <CollapsibleTrigger
      class="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium"
    >
      <span class="flex items-center gap-2">
        <LucideFileKey class="size-4 text-muted-foreground" />
        {{ t("tools.uploadData.inheritTab.alerts.notesTitle") }}
      </span>
      <LucideChevronDown :class="['size-4 text-muted-foreground transition-transform duration-200', notesOpen ? 'rotate-180' : '']" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div class="space-y-4 border-t px-4 py-3 text-sm text-muted-foreground">
        <div class="space-y-1">
          <p class="font-medium text-foreground">{{ t("tools.uploadData.inheritTab.alerts.reminder1.title") }}</p>
          <p>{{ t("tools.uploadData.inheritTab.alerts.reminder1.line1") }}</p>
          <p>{{ t("tools.uploadData.inheritTab.alerts.reminder1.line2") }}</p>
        </div>
        <div class="space-y-2">
          <p class="font-medium text-foreground">{{ t("tools.uploadData.inheritTab.alerts.reminder2.title") }}</p>
          <p>{{ t("tools.uploadData.inheritTab.alerts.reminder2.text") }}</p>
          <Button as-child variant="outline" size="sm">
            <RouterLink to="/user/game-account-bindings">
              {{ t("tools.uploadData.inheritTab.alerts.reminder2.bindLink") }}
            </RouterLink>
          </Button>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>

  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <ServerCog class="h-6 w-6" />
        {{ t("tools.uploadData.inheritTab.title") }}
      </CardTitle>
      <CardDescription>{{ t("tools.uploadData.inheritTab.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <form id="upload-data-inherit-form" novalidate @submit.prevent="emit('submit')">
        <div class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="flex min-w-0 flex-col space-y-1.5">
            <Label :for="FIELD_IDS.inheritId">{{ t("tools.uploadData.inheritTab.fields.inheritId") }}</Label>
            <div class="relative min-w-0 w-full items-center">
              <Input
                :id="FIELD_IDS.inheritId"
                class="pl-10"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                :placeholder="t('tools.uploadData.inheritTab.fields.inheritIdPlaceholder')"
                :model-value="inheritId"
                :aria-invalid="fieldErrors.inheritId ? 'true' : undefined"
                :aria-describedby="fieldErrors.inheritId ? ERROR_IDS.inheritId : undefined"
                @update:model-value="emit('update:inheritId', String($event)); emit('clear-field-error', 'inheritId')"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
            <p v-if="fieldErrors.inheritId" :id="ERROR_IDS.inheritId" role="alert" class="text-xs text-destructive">{{ fieldErrors.inheritId }}</p>
          </div>
          <div class="flex min-w-0 flex-col space-y-1.5">
            <Label :for="FIELD_IDS.inheritPassword">{{ t("tools.uploadData.inheritTab.fields.inheritPassword") }}</Label>
            <div class="relative min-w-0 w-full items-center">
              <InputWithToggle
                :id="FIELD_IDS.inheritPassword"
                type="password"
                class="w-full pl-10"
                autocomplete="off"
                :placeholder="t('tools.uploadData.inheritTab.fields.inheritPasswordPlaceholder')"
                :model-value="inheritPassword"
                :aria-invalid="fieldErrors.inheritPassword ? 'true' : undefined"
                :aria-describedby="fieldErrors.inheritPassword ? ERROR_IDS.inheritPassword : undefined"
                @update:model-value="emit('update:inheritPassword', String($event)); emit('clear-field-error', 'inheritPassword')"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Lock class="size-4 text-muted-foreground" />
              </span>
            </div>
            <p v-if="fieldErrors.inheritPassword" :id="ERROR_IDS.inheritPassword" role="alert" class="text-xs text-destructive">{{ fieldErrors.inheritPassword }}</p>
          </div>
          <div class="flex min-w-0 flex-col space-y-1.5">
            <Label for="inherit-server-select">{{ t("tools.uploadData.inheritTab.fields.server") }}</Label>
            <div class="relative min-w-0 w-full items-center">
              <Select :key="locale" id="inherit-server-select" :model-value="inheritServer" @update:model-value="handleServerChange">
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.uploadData.inheritTab.fields.serverPlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jp">{{ t("tools.uploadData.region.jp") }}</SelectItem>
                  <SelectItem value="en">{{ t("tools.uploadData.region.en") }}</SelectItem>
                </SelectContent>
              </Select>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                <Globe class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="flex min-w-0 flex-col space-y-1.5">
            <Label for="inherit-data-type-select">{{ t("tools.uploadData.inheritTab.fields.dataType") }}</Label>
            <div class="relative min-w-0 w-full items-center">
              <Select :key="locale" id="inherit-data-type-select" :model-value="dataType" @update:model-value="handleDataTypeChange">
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.uploadData.inheritTab.fields.dataTypePlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suite">{{ t("tools.uploadData.dataTypes.suite") }}</SelectItem>
                  <SelectItem v-if="canShowMySekaiDataType" value="mysekai">
                    {{ t("tools.uploadData.dataTypes.mysekai") }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                <Database class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-md border p-3 sm:col-span-2">
            <Checkbox
              id="remember-inherit"
              class="mt-0.5"
              :model-value="rememberInherit"
              @update:model-value="value => emit('update:rememberInherit', value === true)"
            />
            <label for="remember-inherit" class="flex min-w-0 flex-1 cursor-pointer flex-col gap-1">
              <span class="text-sm font-medium">{{ t("tools.uploadData.inheritTab.remember.label") }}</span>
              <span class="text-xs text-muted-foreground">{{ t("tools.uploadData.inheritTab.remember.description") }}</span>
            </label>
          </div>
        </div>
      </form>
    </CardContent>
    <CardFooter class="flex items-center justify-end">
      <Button type="submit" form="upload-data-inherit-form" :disabled="isSubmittingInherit">
        <Loader2 v-if="isSubmittingInherit" class="mr-2 h-4 w-4 animate-spin" />
        <UploadCloud v-else class="mr-2 h-4 w-4" />
        {{ isSubmittingInherit ? t("tools.uploadData.inheritTab.submitting") : t("tools.uploadData.inheritTab.submit") }}
      </Button>
    </CardFooter>
  </Card>
</template>
