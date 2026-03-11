<script setup lang="ts">
import type { InheritServer, UploadDataType } from "@/types"
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, InputWithToggle } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Database,
  Globe,
  Loader2,
  Lock,
  LucideFileKey,
  LucideShieldAlert,
  LucideAlertTriangle,
  ServerCog,
  UploadCloud,
  User,
} from "lucide-vue-next"

defineProps<{
  dataType: UploadDataType
  inheritServer: InheritServer
  inheritId: string
  inheritPassword: string
  rememberInherit: boolean
  isSubmittingInherit: boolean
}>()

const emit = defineEmits<{
  (event: "update:dataType", value: UploadDataType): void
  (event: "update:inheritServer", value: InheritServer): void
  (event: "update:inheritId", value: string): void
  (event: "update:inheritPassword", value: string): void
  (event: "update:rememberInherit", value: boolean): void
  (event: "submit"): void
}>()

function handleDataTypeChange(value: string) {
  if (value === "suite" || value === "mysekai") {
    emit("update:dataType", value)
  }
}

function handleServerChange(value: string) {
    if (value === "jp" || value === "en") {
      emit("update:inheritServer", value)
    }
  }

const { t, locale } = useI18n()
</script>

<template>
  <Alert variant="destructive" class="mb-2 bg-red-200">
    <LucideAlertTriangle class="h-5 w-5" />
    <AlertTitle class="text-red-600 dark:text-red-600">{{ t("tools.uploadData.inheritTab.alerts.warning1.title") }}</AlertTitle>
    <AlertDescription class="text-red-600 dark:text-red-600">
      {{ t("tools.uploadData.inheritTab.alerts.warning1.description") }}
    </AlertDescription>
  </Alert>
  <Alert variant="destructive" class="mb-2 bg-amber-200">
    <LucideShieldAlert class="h-5 w-5" />
    <AlertTitle class="text-red-600 dark:text-red-600">{{ t("tools.uploadData.inheritTab.alerts.warning2.title") }}</AlertTitle>
    <AlertDescription class="text-red-600 dark:text-red-600">
      {{ t("tools.uploadData.inheritTab.alerts.warning2.line1") }}<br>
      {{ t("tools.uploadData.inheritTab.alerts.warning2.line2") }}
    </AlertDescription>
  </Alert>

  <Alert class="mb-2 bg-green-300">
    <LucideFileKey class="h-5 w-5" />
    <AlertTitle class="dark:text-black">{{ t("tools.uploadData.inheritTab.alerts.reminder1.title") }}</AlertTitle>
    <AlertDescription class="dark:text-black">
      {{ t("tools.uploadData.inheritTab.alerts.reminder1.line1") }}<br>
      {{ t("tools.uploadData.inheritTab.alerts.reminder1.line2") }}
    </AlertDescription>
  </Alert>
  <Alert class="mb-2 bg-green-300">
    <LucideFileKey class="h-5 w-5" />
    <AlertTitle class="dark:text-black">{{ t("tools.uploadData.inheritTab.alerts.reminder2.title") }}</AlertTitle>
    <AlertDescription class="dark:text-black">
      {{ t("tools.uploadData.inheritTab.alerts.reminder2.line1") }}<br>
      {{ t("tools.uploadData.inheritTab.alerts.reminder2.line2") }}<br>
      {{ t("tools.uploadData.inheritTab.alerts.reminder2.line3") }}<br>
      {{ t("tools.uploadData.inheritTab.alerts.reminder2.line4") }}
      <router-link to="/user/game-account-bindings" class="text-blue-500 hover:underline">
        {{ t("tools.uploadData.inheritTab.alerts.reminder2.bindLink") }}
      </router-link>
    </AlertDescription>
  </Alert>

  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <ServerCog class="h-6 w-6" />
        {{ t("tools.uploadData.inheritTab.title") }}
      </CardTitle>
      <CardDescription>{{ t("tools.uploadData.inheritTab.description") }}</CardDescription>
    </CardHeader>
    <CardContent>
      <form id="upload-data-inherit-form" @submit.prevent="emit('submit')">
        <div class="grid gap-4">
          <div class="flex flex-col space-y-1.5">
            <Label for="inherit-id">{{ t("tools.uploadData.inheritTab.fields.inheritId") }}</Label>
            <div class="relative w-full items-center">
              <Input
                id="inherit-id"
                class="pl-10"
                :placeholder="t('tools.uploadData.inheritTab.fields.inheritIdPlaceholder')"
                :model-value="inheritId"
                @update:model-value="emit('update:inheritId', $event)"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label for="inherit-password">{{ t("tools.uploadData.inheritTab.fields.inheritPassword") }}</Label>
            <div class="relative w-full items-center">
              <InputWithToggle
                type="password"
                class="w-full pl-10"
                :placeholder="t('tools.uploadData.inheritTab.fields.inheritPasswordPlaceholder')"
                :model-value="inheritPassword"
                @update:model-value="emit('update:inheritPassword', $event)"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Lock class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="flex flex-col space-y-1.5">
            <Label for="inherit-server-select">{{ t("tools.uploadData.inheritTab.fields.server") }}</Label>
            <div class="relative w-full items-center">
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
          <div class="flex flex-col space-y-1.5">
            <Label for="inherit-data-type-select">{{ t("tools.uploadData.inheritTab.fields.dataType") }}</Label>
            <div class="relative w-full items-center">
              <Select :key="locale" id="inherit-data-type-select" :model-value="dataType" @update:model-value="handleDataTypeChange">
                <SelectTrigger class="w-full pl-10">
                  <SelectValue :placeholder="t('tools.uploadData.inheritTab.fields.dataTypePlaceholder')" />
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
          <div class="flex items-start gap-3 rounded-md border p-3">
            <Checkbox
              id="remember-inherit"
              :checked="rememberInherit"
              @update:checked="value => emit('update:rememberInherit', Boolean(value))"
            />
            <label for="remember-inherit" class="flex flex-col gap-1 cursor-pointer">
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
