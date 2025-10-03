<script setup lang="ts">
import {toast} from "vue-sonner";
import {Label} from "@/components/ui/label"
import {PackageCheck} from 'lucide-vue-next'
import {Button} from "@/components/ui/button"

import {
  ref,
  computed,
  nextTick
} from 'vue'
import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,

} from "@/components/ui/select"

const selectedModule = ref<string>('suite')
const selectedServer = ref<string>('jp')
const selectedClient = ref<string>('shadowrocket')

const basePath = 'https://public.assets.haruki.seiunx.com'

const isCnRestricted = computed(() => {
  return (
      (selectedModule.value === 'mysekai' || selectedModule.value === 'mysekai_force') &&
      selectedServer.value === 'cn'
  )
})

const moduleMap: Record<string, Record<string, string>> = {
  unlocker: {
    shadowrocket: 'unlocker/unlocker.sgmodule',
    surge: 'unlocker/unlocker.sgmodule',
    qx: 'unlocker/unlocker.conf',
    loon: 'unlocker/unlocker.lnplugin',
    stash: 'unlocker/unlocker.stoverride'
  },
  mysekai: {
    shadowrocket: 'mysekai/<server>_mysekai.sgmodule',
    surge: 'mysekai/<server>_mysekai.sgmodule',
    qx: 'mysekai/<server>_mysekai.conf',
    loon: 'mysekai/<server>_mysekai.lnplugin',
    stash: 'mysekai/<server>_mysekai.stoverride'
  },
  mysekai_force: {
    shadowrocket: 'mysekai_force/<server>_mysekai.sgmodule',
    surge: 'mysekai_force/<server>_mysekai.sgmodule',
    qx: 'mysekai_force/<server>_mysekai.conf',
    loon: 'mysekai_force/<server>_mysekai.lnplugin',
    stash: 'mysekai_force/<server>_mysekai.stoverride'
  },
  suite: {
    shadowrocket: 'suite/<server>_suite.sgmodule',
    surge: 'suite/<server>_suite.sgmodule',
    qx: 'suite/<server>_suite.conf',
    loon: 'suite/<server>_suite.lnplugin',
    stash: 'suite/<server>_suite.stoverride'
  }
}

const uriSchemes: Record<string, (url: string) => string> = {
  shadowrocket: url => `shadowrocket://install?module=${encodeURIComponent(url)}`,
  surge: url => `surge:///install-module?url=${encodeURIComponent(url)}`,
  qx: url => `quantumult-x:///add-resource?remote-resource={"rewrite_remote":["${encodeURIComponent(url)}"]}`,
  loon: url => `loon://import?plugin=${encodeURIComponent(url)}`,
  stash: url => `https://link.stash.ws/install-override/${url.replace(/^https?:\/\//, '')}`
}

async function installModule() {
  if (isCnRestricted.value) {
    return
  }

  let path = moduleMap[selectedModule.value]?.[selectedClient.value]
  if (!path) {
    toast.warning('模块或平台不支持')
    return
  }
  if (path.includes('<server>')) {
    path = path.replace('<server>', selectedServer.value)
  }
  const rawUrl = `${basePath}/${path}`
  const schemeFn = uriSchemes[selectedClient.value]
  if (!schemeFn) {
    toast.warning('不支持的客户端')
    return
  }
  const uri = schemeFn(rawUrl)
  await nextTick()
  window.location.href = uri
}
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="flex flex-row items-center gap-2">
        <PackageCheck class="w-6 h-6 text-primary"/>
        <CardTitle>iOS模块快速安装工具</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div>
          <Label for="module-select">选择模块</Label>
          <Select v-model="selectedModule" id="module-select">
            <SelectTrigger class="w-full mt-1">
              <SelectValue placeholder="请选择模块"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unlocker">解锁日服登录IP限制</SelectItem>
              <SelectItem value="mysekai">MySekai</SelectItem>
              <SelectItem value="mysekai_force">MySekai强制刷新</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="selectedModule !== 'unlocker'">
          <Label for="server-select">选择区服</Label>
          <Select v-model="selectedServer" id="server-select">
            <SelectTrigger class="w-full mt-1">
              <SelectValue placeholder="请选择服务器"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jp">日服</SelectItem>
              <SelectItem value="en">国际服</SelectItem>
              <SelectItem value="tw">台服</SelectItem>
              <SelectItem value="kr">韩服</SelectItem>
              <SelectItem value="cn">国服</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label for="client-select">选择软件</Label>
          <Select v-model="selectedClient" id="client-select">
            <SelectTrigger class="w-full mt-1">
              <SelectValue placeholder="请选择软件"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shadowrocket">Shadowrocket</SelectItem>
              <SelectItem value="surge">Surge</SelectItem>
              <SelectItem value="qx">Quantumult X</SelectItem>
              <SelectItem value="loon">Loon</SelectItem>
              <SelectItem value="stash">Stash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p v-if="isCnRestricted" class="text-red-600">由于相关法律法规限制，本站不提供该区服的该功能的安装。</p>
      </CardContent>
      <CardFooter>
        <Button class="w-full flex items-center justify-center gap-2" :disabled="isCnRestricted" @click="installModule">
          <PackageCheck/>
          快速安装
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<style scoped>

</style>