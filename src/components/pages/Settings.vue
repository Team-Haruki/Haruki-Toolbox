<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { toast } from "vue-sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, Sun, Moon, Monitor, Save, RotateCcw } from 'lucide-vue-next'
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import { useSettingsStore, type ThemeType, type EndpointType } from "@/settingsStore"

const settingsStore = useSettingsStore()

// Local state for editing
const selectedEndpoint = ref<EndpointType>(settingsStore.preferredEndpoint)
const selectedTheme = ref<ThemeType>(settingsStore.theme)

// Endpoint options
const endpointOptions = [
  { value: 'direct' as EndpointType, label: '直连', desc: '直接连接后端服务器' },
  { value: 'cdn' as EndpointType, label: 'CDN', desc: '通过CDN加速访问' },
]

// Theme options
const themeOptions = [
  { value: 'light' as ThemeType, label: '浅色', icon: Sun },
  { value: 'dark' as ThemeType, label: '深色', icon: Moon },
  { value: 'system' as ThemeType, label: '跟随系统', icon: Monitor },
]

// Methods
function saveSettings() {
  settingsStore.setPreferredEndpoint(selectedEndpoint.value)
  settingsStore.setTheme(selectedTheme.value)
  toast.success('设置已保存')
}

function resetSettings() {
  selectedEndpoint.value = 'direct'
  selectedTheme.value = 'system'
  settingsStore.setPreferredEndpoint('direct')
  settingsStore.setTheme('system')
  toast.info('设置已重置为默认值')
}

// Initialize theme on mount
onMounted(() => {
  settingsStore.initTheme()
})
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md space-y-3">
      <CardHeader class="flex flex-row items-center gap-2">
        <Settings class="w-6 h-6 text-primary"/>
        <div>
          <CardTitle>Haruki工具箱设置</CardTitle>
          <CardDescription>配置Haruki工具箱的端点和外观等</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent class="space-y-6">
        <!-- Endpoint Selection -->
        <div>
          <Label class="text-base font-medium">服务器端点</Label>
          <p class="text-sm text-muted-foreground mb-2">
            选择服务器连接方式，默认使用直连
            <br>如果你不在中国大陆且连接困难，可以尝试使用CDN加速
          </p>
          <Select v-model="selectedEndpoint">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择端点" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in endpointOptions" :key="opt.value" :value="opt.value">
                <div class="flex flex-col">
                  <span>{{ opt.label }}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Theme Selection -->
        <div>
          <Label class="text-base font-medium">外观主题</Label>
          <p class="text-sm text-muted-foreground mb-2">选择您偏好的界面主题</p>
          <Select v-model="selectedTheme">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="请选择主题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
                <div class="flex items-center gap-2">
                  <component :is="opt.icon" class="w-4 h-4" />
                  {{ opt.label }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-2">
          <Button @click="saveSettings" class="flex-1">
            <Save class="w-4 h-4 mr-2" />
            保存设置
          </Button>
          <Button variant="outline" @click="resetSettings">
            <RotateCcw class="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>

        <!-- Tips -->
        <div class="p-3 bg-muted/50 rounded-lg">
          <p class="text-sm text-muted-foreground">
            <strong>提示：</strong>主题设置会立即生效，端点设置将在下次请求时生效。
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
