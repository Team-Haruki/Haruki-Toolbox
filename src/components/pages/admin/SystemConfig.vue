<script setup lang="ts">
import { ref, onMounted } from "vue"
import { toast } from "vue-sonner"
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
import { getPublicApiKeys, updatePublicApiKeys, getRuntimeConfig, updateRuntimeConfig } from "@/api/admin/config"
import type { PublicApiKeys, RuntimeConfig } from "@/types/admin"

const editorOptions = {
  minimap: { enabled: false },
  wordWrap: 'on',
  formatOnPaste: true,
  formatOnType: true,
  tabSize: 2,
  scrollBeyondLastLine: false,
}

const apiKeysLoading = ref(true)
const apiKeys = ref<PublicApiKeys>({})
const apiKeysJson = ref("")
const apiKeysSaving = ref(false)

const runtimeLoading = ref(true)
const runtimeConfig = ref<RuntimeConfig>({})
const runtimeJson = ref("")
const runtimeSaving = ref(false)

async function loadApiKeys() {
  apiKeysLoading.value = true
  try {
    const data = await getPublicApiKeys()
    apiKeys.value = data
    apiKeysJson.value = JSON.stringify(data, null, 2)
  } catch (e: unknown) {
    toast.error("加载API Keys失败", { description: (e as Error).message })
  } finally {
    apiKeysLoading.value = false
  }
}

async function loadRuntimeConfig() {
  runtimeLoading.value = true
  try {
    const data = await getRuntimeConfig()
    runtimeConfig.value = data
    runtimeJson.value = JSON.stringify(data, null, 2)
  } catch (e: unknown) {
    toast.error("加载运行时配置失败", { description: (e as Error).message })
  } finally {
    runtimeLoading.value = false
  }
}

async function saveApiKeys() {
  apiKeysSaving.value = true
  try {
    const parsed = JSON.parse(apiKeysJson.value)
    await updatePublicApiKeys(parsed)
    toast.success("API Keys 已更新")
    apiKeys.value = parsed
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      toast.error("JSON 格式错误")
    } else {
      toast.error("保存失败", { description: (e as Error).message })
    }
  } finally {
    apiKeysSaving.value = false
  }
}

async function saveRuntimeConfig() {
  runtimeSaving.value = true
  try {
    const parsed = JSON.parse(runtimeJson.value)
    await updateRuntimeConfig(parsed)
    toast.success("运行时配置已更新")
    runtimeConfig.value = parsed
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      toast.error("JSON 格式错误")
    } else {
      toast.error("保存失败", { description: (e as Error).message })
    }
  } finally {
    runtimeSaving.value = false
  }
}

onMounted(() => { loadApiKeys(); loadRuntimeConfig() })
</script>

<template>
  <div class="w-full flex flex-col gap-6">
    <!-- API Keys -->
    <Card>
      <CardHeader>
        <CardTitle>Public API Keys</CardTitle>
        <CardDescription>管理公共 API 密钥配置（仅超级管理员可操作）</CardDescription>
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
            保存
          </Button>
        </template>
      </CardContent>
    </Card>

    <!-- Runtime Config -->
    <Card>
      <CardHeader>
        <CardTitle>Runtime Configuration</CardTitle>
        <CardDescription>管理运行时配置项（修改后立即生效）</CardDescription>
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
            保存
          </Button>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
