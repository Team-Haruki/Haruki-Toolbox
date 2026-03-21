<script setup lang="ts">
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LucideSave, LucideLoader2 } from "lucide-vue-next"
import { VueMonacoEditor } from "@guolao/vue-monaco-editor"
import { useI18n } from "vue-i18n"
import { useSystemConfig } from "@/modules/admin-config/composables/useSystemConfig"

const { t } = useI18n()

const {
  editorOptions,
  apiKeysLoading,
  apiKeysJson,
  apiKeysSaving,
  runtimeLoading,
  runtimeJson,
  runtimeSaving,
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
        <template v-else>
          <div class="w-full h-64 rounded-md border border-input overflow-hidden shadow-sm">
            <VueMonacoEditor
              v-model:value="apiKeysJson"
              language="json"
              theme="vs-dark"
              :options="editorOptions"
            />
          </div>
          <Button class="self-end" :disabled="apiKeysSaving" @click="saveApiKeys">
            <LucideLoader2 v-if="apiKeysSaving" class="w-4 h-4 mr-1 animate-spin" />
            <LucideSave v-else class="w-4 h-4 mr-1" />
            {{ t("common.save") }}
          </Button>
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
        <template v-else>
          <div class="w-full h-96 rounded-md border border-input overflow-hidden shadow-sm">
            <VueMonacoEditor
              v-model:value="runtimeJson"
              language="json"
              theme="vs-dark"
              :options="editorOptions"
            />
          </div>
          <Button class="self-end" :disabled="runtimeSaving" @click="saveRuntimeConfig">
            <LucideLoader2 v-if="runtimeSaving" class="w-4 h-4 mr-1 animate-spin" />
            <LucideSave v-else class="w-4 h-4 mr-1" />
            {{ t("common.save") }}
          </Button>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
