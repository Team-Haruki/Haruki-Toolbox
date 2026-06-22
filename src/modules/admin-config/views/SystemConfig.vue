<script setup lang="ts">
import { computed } from "vue"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LucideSave, LucideLoader2 } from "lucide-vue-next"
import { VueMonacoEditor } from "@guolao/vue-monaco-editor"
import { useI18n } from "vue-i18n"
import { storeToRefs } from "pinia"
import { useSettingsStore } from "@/shared/stores/settings"
import { useSystemConfig } from "@/modules/admin-config/composables/useSystemConfig"

const { t } = useI18n()

const settingsStore = useSettingsStore()
const { theme } = storeToRefs(settingsStore)
const monacoTheme = computed(() => {
  if (theme.value === "dark") {
    return "vs-dark"
  }
  if (theme.value === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "vs-dark" : "vs"
  }
  return "vs"
})

const {
  editorOptions,
  apiKeysLoading,
  apiKeysLoadError,
  apiKeysJson,
  apiKeysSaving,
  apiKeysDirty,
  runtimeLoading,
  runtimeLoadError,
  runtimeJson,
  runtimeSaving,
  runtimeDirty,
  loadApiKeys,
  loadRuntimeConfig,
  saveApiKeys,
  saveRuntimeConfig,
} = useSystemConfig()
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <!-- API Keys -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t("adminConfig.publicApiKeys.title") }}</CardTitle>
        <CardDescription>{{ t("adminConfig.publicApiKeys.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <template v-if="apiKeysLoading">
          <Skeleton class="h-40 w-full" />
        </template>
        <template v-else-if="apiKeysLoadError">
          <div class="flex flex-col items-center gap-3 py-8 text-center">
            <p class="text-sm text-muted-foreground">{{ t("adminConfig.loadError") }}</p>
            <Button variant="outline" size="sm" @click="loadApiKeys">
              {{ t("adminConfig.retry") }}
            </Button>
          </div>
        </template>
        <template v-else>
          <div class="w-full h-64 rounded-md border border-input overflow-hidden shadow-sm">
            <VueMonacoEditor
              v-model:value="apiKeysJson"
              language="json"
              :theme="monacoTheme"
              :options="editorOptions"
            />
          </div>
          <div class="flex items-center justify-end gap-3">
            <span v-if="apiKeysDirty" class="text-xs text-muted-foreground">
              {{ t("adminConfig.unsavedChanges") }}
            </span>
            <Button :disabled="apiKeysSaving || !apiKeysDirty" @click="saveApiKeys">
              <LucideLoader2 v-if="apiKeysSaving" class="w-4 h-4 mr-1 animate-spin" />
              <LucideSave v-else class="w-4 h-4 mr-1" />
              {{ t("common.save") }}
            </Button>
          </div>
        </template>
      </CardContent>
    </Card>

    <!-- Runtime Config -->
    <Card>
      <CardHeader>
        <CardTitle>{{ t("adminConfig.runtime.title") }}</CardTitle>
        <CardDescription>{{ t("adminConfig.runtime.description") }}</CardDescription>
      </CardHeader>
      <CardContent class="flex flex-col gap-4">
        <template v-if="runtimeLoading">
          <Skeleton class="h-48 w-full" />
        </template>
        <template v-else-if="runtimeLoadError">
          <div class="flex flex-col items-center gap-3 py-8 text-center">
            <p class="text-sm text-muted-foreground">{{ t("adminConfig.loadError") }}</p>
            <Button variant="outline" size="sm" @click="loadRuntimeConfig">
              {{ t("adminConfig.retry") }}
            </Button>
          </div>
        </template>
        <template v-else>
          <div class="w-full h-96 rounded-md border border-input overflow-hidden shadow-sm">
            <VueMonacoEditor
              v-model:value="runtimeJson"
              language="json"
              :theme="monacoTheme"
              :options="editorOptions"
            />
          </div>
          <div class="flex items-center justify-end gap-3">
            <span v-if="runtimeDirty" class="text-xs text-muted-foreground">
              {{ t("adminConfig.unsavedChanges") }}
            </span>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button :disabled="runtimeSaving || !runtimeDirty">
                  <LucideLoader2 v-if="runtimeSaving" class="w-4 h-4 mr-1 animate-spin" />
                  <LucideSave v-else class="w-4 h-4 mr-1" />
                  {{ t("common.save") }}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t("adminConfig.runtime.saveDialogTitle") }}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {{ t("adminConfig.runtime.saveDialogDescription") }}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t("common.cancel") }}</AlertDialogCancel>
                  <AlertDialogAction @click="saveRuntimeConfig">{{ t("adminConfig.runtime.saveDialogConfirm") }}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
