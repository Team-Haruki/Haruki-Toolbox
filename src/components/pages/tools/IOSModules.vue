<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {toast} from "vue-sonner"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Checkbox} from "@/components/ui/checkbox"
import {Input} from "@/components/ui/input"
import {Copy, PackageCheck, RefreshCw} from 'lucide-vue-next'
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from '@/components/ui/card'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select"
import {useUserStore} from "@/store"
import {useSettingsStore} from "@/settingsStore"
import {generateIOSUploadCode} from "@/api/settings/ios-upload-code"

const userStore = useUserStore()
const settingsStore = useSettingsStore()
const selectedSoftware = ref<string>('surge')
const selectedEndpoint = ref<string>('direct')
const selectedMode = ref<string>('script') // 默认脚本上传
const selectedRegions = ref<string[]>(['jp'])
const selectedDataTypes = ref<string[]>(['suite'])
const chunkSize = ref<number>(1)
const isGeneratingCode = ref<boolean>(false)

const softwareOptions = [
  { value: 'surge', label: 'Surge' },
  { value: 'shadowrocket', label: 'Shadowrocket' },
  { value: 'loon', label: 'Loon' },
  { value: 'qx', label: 'Quantumult X' },
  { value: 'stash', label: 'Stash' },
]

const endpointOptions = [
  { value: 'direct', label: 'Direct (直连)' },
  { value: 'cdn', label: 'CDN (加速)' },
]

const modeOptions = [
  { value: 'proxy', label: '307 代理' },
  { value: 'script', label: '脚本上传' },
]

const regionOptions = [
  { value: 'jp', label: '日服' },
  { value: 'en', label: '国际服' },
  { value: 'tw', label: '台服' },
  { value: 'kr', label: '韩服' },
  { value: 'cn', label: '国服' },
]

const dataTypeOptionsWithDesc = [
  { value: 'suite', label: 'Suite', desc: '上传你的游戏账号的完整数据' },
  { value: 'mysekai', label: 'MySekai', desc: '上传你的游戏账号的MySekai数据' },
  { value: 'mysekai_force', label: 'MySekai (强制刷新)', desc: '每次进入都强制刷新MySekai数据' },
  { value: 'mysekai_birthday_party', label: 'MySekai生日派对', desc: '上传MySekai生日派对双叶地图数据' },
]

const extensionMap: Record<string, string> = {
  surge: 'sgmodule',
  shadowrocket: 'sgmodule',
  loon: 'lnplugin',
  qx: 'conf',
  stash: 'stoverride',
}

const uriSchemes: Record<string, (url: string) => string> = {
  shadowrocket: url => `shadowrocket://install?module=${encodeURIComponent(url)}`,
  surge: url => `surge:///install-module?url=${encodeURIComponent(url)}`,
  qx: url => `quantumult-x:///add-resource?remote-resource={"rewrite_remote":["${encodeURIComponent(url)}"]}`,
  loon: url => `loon://import?plugin=${encodeURIComponent(url)}`,
  stash: url => `https://link.stash.ws/install-override/${url.replace(/^https?:\/\//, '')}`,
}

const hasUploadCode = computed(() => !!userStore.iosUploadCode)
const isCnRestricted = computed(() => {
  const hasMysekaiType = selectedDataTypes.value.some(dt => 
    ['mysekai', 'mysekai_force', 'mysekai_birthday_party'].includes(dt)
  )
  const hasCn = selectedRegions.value.includes('cn')
  return hasMysekaiType && hasCn && !userStore.allowCNMysekai
})
const isQxScriptWarning = computed(() => {
  return selectedSoftware.value === 'qx' && selectedMode.value === 'script'
})
const finalDataTypes = computed(() => selectedDataTypes.value)
const moduleUrl = computed(() => {
  if (!hasUploadCode.value || selectedRegions.value.length === 0 || finalDataTypes.value.length === 0) {
    return null
  }
  const baseUrl = selectedEndpoint.value === 'cdn' 
    ? settingsStore.cdnEndpoint 
    : settingsStore.directEndpoint
  const regions = selectedRegions.value.join('-')
  const dataTypes = finalDataTypes.value.join('-')
  const ext = extensionMap[selectedSoftware.value]
  let url = `${baseUrl}/ios/module/${userStore.iosUploadCode}/${regions}-haruki-toolbox-${dataTypes}.${ext}`
  url += `?mode=${selectedMode.value}&endpoint=${selectedEndpoint.value}`
  if (selectedMode.value === 'script') {
    url += `&chunk=${chunkSize.value}`
  }
  return url
})

const scriptUrl = computed(() => {
  if (!hasUploadCode.value) return null
  const baseUrl = selectedEndpoint.value === 'cdn' 
    ? settingsStore.cdnEndpoint 
    : settingsStore.directEndpoint
  return `${baseUrl}/ios/script/${userStore.iosUploadCode}/haruki-toolbox.js?chunk=${chunkSize.value}&endpoint=${selectedEndpoint.value}`
})

const canInstall = computed(() => {
  return hasUploadCode.value && 
         selectedRegions.value.length > 0 && 
         finalDataTypes.value.length > 0 && 
         !isCnRestricted.value &&
         !isQxScriptWarning.value
})
async function generateCode() {
  if (!userStore.userId) {
    toast.warning('请先登录')
    return
  }
  isGeneratingCode.value = true
  try {
    const code = await generateIOSUploadCode(userStore.userId)
    userStore.setIOSUploadCode(code)
    toast.success('上传码生成成功')
  } catch (error: unknown) {
    console.error('Failed to generate iOS upload code:', error)
    const message = error instanceof Error && error.message ? error.message : '未知错误'
    toast.error(`生成上传码失败：${message}`)
  } finally {
    isGeneratingCode.value = false
  }
}

async function copyToClipboard(text: string, label: string) {
  if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
    toast.error('当前环境不支持剪贴板操作')
    return
  }
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label}已复制到剪贴板`)
  } catch (error) {
    toast.error('复制到剪贴板失败，请检查浏览器权限设置')
  }
}

function toggleRegion(region: string) {
  if (selectedRegions.value.includes(region)) {
    selectedRegions.value = selectedRegions.value.filter(r => r !== region)
  } else {
    selectedRegions.value = [...selectedRegions.value, region]
  }
}

function toggleDataType(dataType: string) {
  if (selectedDataTypes.value.includes(dataType)) {
    selectedDataTypes.value = selectedDataTypes.value.filter(d => d !== dataType)
  } else {
    let newTypes = [...selectedDataTypes.value]
    if (dataType === 'mysekai') {
      newTypes = newTypes.filter(d => d !== 'mysekai_force')
    } else if (dataType === 'mysekai_force') {
      newTypes = newTypes.filter(d => d !== 'mysekai')
    }
    newTypes.push(dataType)
    selectedDataTypes.value = newTypes
  }
}

async function installModule() {
  if (!canInstall.value || !moduleUrl.value) return
  const schemeFn = uriSchemes[selectedSoftware.value]
  if (!schemeFn) {
    toast.warning('不支持的客户端')
    return
  }
  window.location.href = schemeFn(moduleUrl.value)
}

watch(selectedSoftware, (newSoftware) => {
  if (newSoftware === 'qx' && selectedMode.value === 'script') {
    selectedMode.value = 'proxy'
    toast.info('Quantumult X 不支持脚本上传模式，已切换为代理模式')
  }
})
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md space-y-3">
      <CardHeader class="flex flex-row items-center gap-2">
        <PackageCheck class="w-6 h-6 text-primary"/>
        <div>
          <CardTitle>iOS模块生成器</CardTitle>
          <CardDescription>生成自定义的iOS代理模块</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent class="space-y-4">
        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base">上传码</CardTitle>
            <CardDescription>用于验证模块和脚本的访问权限</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="hasUploadCode" class="flex items-center gap-2">
              <Input 
                :model-value="userStore.iosUploadCode ?? ''" 
                readonly 
                class="font-mono text-sm"
              />
              <Button variant="outline" size="icon" @click="copyToClipboard(userStore.iosUploadCode!, '上传码')">
                <Copy class="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                @click="generateCode" 
                :disabled="isGeneratingCode || !userStore.isLoggedIn"
              >
                <RefreshCw class="w-4 h-4 mr-1" :class="{ 'animate-spin': isGeneratingCode }" />
                重新生成
              </Button>
            </div>
            <div v-else>
              <Button 
                @click="generateCode" 
                :disabled="isGeneratingCode || !userStore.isLoggedIn"
                class="w-full"
              >
                <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isGeneratingCode }" />
                {{ userStore.isLoggedIn ? '生成上传码' : '请先登录' }}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base">选择软件</CardTitle>
            <CardDescription>选择需要安装模块的代理工具</CardDescription>
          </CardHeader>
          <CardContent>
            <Select v-model="selectedSoftware">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择软件" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in softwareOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base">选择工具箱域名</CardTitle>
            <CardDescription class="whitespace-pre-line">选择要使用的工具箱服务端域名
              <br>默认情况下使用直连即可
              <br>如果你人不在中国大陆使用困难的话，选择CDN可能有改善</CardDescription>
          </CardHeader>
          <CardContent>
            <Select v-model="selectedEndpoint">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择域名" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in endpointOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base">选择上传数据方式</CardTitle>
            <CardDescription class="whitespace-pre-line">
              脚本上传可以和其他Bot的模块共存，也不会受到工具箱服务端代理宕机的影响，但是不一定稳定
              <br>如果使用脚本上传不稳定，可以切换为307代理</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Select v-model="selectedMode">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="请选择上传方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="opt in modeOptions" 
                  :key="opt.value" 
                  :value="opt.value"
                  :disabled="opt.value === 'script' && selectedSoftware === 'qx'"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="selectedSoftware === 'qx'" class="text-sm text-amber-600">
              Quantumult X 不支持脚本上传模式
            </p>
          </CardContent>
        </Card>
        <Card v-if="selectedMode === 'script'">
          <CardHeader class="pb-1">
            <CardTitle class="text-base">文件分片大小</CardTitle>
            <CardDescription>分片大小越大，进游戏速度越快，但是有可能软件顶不住
              <br>除非你了解这个东西是做什么的，不然不需要更改</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-2">
              <Input 
                v-model.number="chunkSize" 
                type="number" 
                min="1" 
                max="10" 
                class="flex-1"
              />
              <span class="text-sm text-muted-foreground whitespace-nowrap">MB</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base">选择区服</CardTitle>
            <CardDescription>选择需要上传数据的游戏服务器（可多选）</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div 
                v-for="opt in regionOptions" 
                :key="opt.value" 
                class="flex items-center space-x-2 p-2 rounded-md border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                :class="{ 'border-primary bg-primary/5': selectedRegions.includes(opt.value) }"
                @click="toggleRegion(opt.value)"
              >
                <Checkbox 
                  :id="`region-${opt.value}`"
                  :model-value="selectedRegions.includes(opt.value)"
                  class="pointer-events-none"
                />
                <Label :for="`region-${opt.value}`" class="cursor-pointer flex-1 pointer-events-none">{{ opt.label }}</Label>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader class="pb-1">
            <CardTitle class="text-base">选择数据类型</CardTitle>
            <CardDescription>选择需要上传的数据类型（可多选）</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div 
                v-for="opt in dataTypeOptionsWithDesc" 
                :key="opt.value" 
                class="flex flex-col p-3 rounded-md border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                :class="{ 'border-primary bg-primary/5': selectedDataTypes.includes(opt.value) }"
                @click="toggleDataType(opt.value)"
              >
                <div class="flex items-center space-x-2">
                  <Checkbox 
                    :id="`datatype-${opt.value}`"
                    :model-value="selectedDataTypes.includes(opt.value)"
                    class="pointer-events-none"
                  />
                  <Label :for="`datatype-${opt.value}`" class="cursor-pointer font-medium pointer-events-none">{{ opt.label }}</Label>
                </div>
                <p class="text-xs text-muted-foreground mt-1 ml-6">{{ opt.desc }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <p v-if="isCnRestricted" class="text-red-600 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
          由于相关法律法规限制，本站不提供国服的MySekai功能的安装。
        </p>
        <Card v-if="moduleUrl">
          <CardHeader class="pb-1">
            <CardTitle class="text-base">生成的 URL</CardTitle>
            <CardDescription>可以复制 URL 手动安装，或点击下方按钮快速安装</CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <div>
              <Label class="text-sm font-medium">模块 URL</Label>
              <div class="flex items-center gap-2 mt-1">
                <Input :model-value="moduleUrl ?? ''" readonly class="font-mono text-xs" />
                <Button variant="outline" size="icon" @click="copyToClipboard(moduleUrl, '模块URL')">
                  <Copy class="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div v-if="selectedMode === 'script' && scriptUrl">
              <Label class="text-sm font-medium">脚本 URL</Label>
              <div class="flex items-center gap-2 mt-1">
                <Input :model-value="scriptUrl ?? ''" readonly class="font-mono text-xs" />
                <Button variant="outline" size="icon" @click="copyToClipboard(scriptUrl, '脚本URL')">
                  <Copy class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
      
      <CardFooter class="flex-col gap-2">
        <Button 
          class="w-full flex items-center justify-center gap-2" 
          :disabled="!canInstall"
          @click="installModule"
        >
          <PackageCheck />
          快速安装模块
        </Button>
        <p class="text-xs text-muted-foreground text-center">
          点击后将调用对应软件的安装协议
        </p>
      </CardFooter>
    </Card>
  </div>
</template>