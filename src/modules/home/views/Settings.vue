<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, Save, RotateCcw, Network, Palette, Info } from 'lucide-vue-next'
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
import { useHomeSettings } from "@/modules/home/composables/useHomeSettings"

const {
  selectedEndpoint,
  selectedTheme,
  selectedLocale,
  endpointOptions,
  themeOptions,
  localeOptions,
  selectedEndpointLabel,
  selectedThemeLabel,
  selectedLocaleLabel,
  saveSettings,
  resetSettings,
} = useHomeSettings()
const { t, locale } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md space-y-3">
      <CardHeader class="flex flex-row items-center gap-2">
        <Settings class="w-6 h-6 text-primary"/>
        <div>
          <CardTitle>{{ t("homeSettings.title") }}</CardTitle>
          <CardDescription>{{ t("homeSettings.description") }}</CardDescription>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <div>
          <Label class="text-base font-medium flex items-center gap-2">
            <Network class="w-4 h-4" />
            {{ t("homeSettings.endpoint.label") }}
          </Label>
          <p class="text-sm text-muted-foreground mb-2">
            {{ t("homeSettings.endpoint.help") }}
          </p>
          <Select v-model="selectedEndpoint" :key="`endpoint-${locale}`">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('homeSettings.endpoint.placeholder')">
                {{ selectedEndpointLabel }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in endpointOptions" :key="opt.value" :value="opt.value">
                <div class="flex items-center gap-2">
                  <component :is="opt.icon" class="w-4 h-4" />
                  <span>{{ opt.label }}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label class="text-base font-medium flex items-center gap-2">
            <Palette class="w-4 h-4" />
            {{ t("homeSettings.theme.label") }}
          </Label>
          <p class="text-sm text-muted-foreground mb-2">{{ t("homeSettings.theme.help") }}</p>
          <Select v-model="selectedTheme" :key="`theme-${locale}`">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('homeSettings.theme.placeholder')">
                {{ selectedThemeLabel }}
              </SelectValue>
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
        <div>
          <Label class="text-base font-medium flex items-center gap-2">
            <Info class="w-4 h-4" />
            {{ t("homeSettings.locale.label") }}
          </Label>
          <p class="text-sm text-muted-foreground mb-2">{{ t("homeSettings.locale.help") }}</p>
          <Select v-model="selectedLocale" :key="`locale-${locale}`">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('homeSettings.locale.placeholder')">
                {{ selectedLocaleLabel }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in localeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex gap-2 pt-2">
          <Button @click="saveSettings" class="flex-1">
            <Save class="w-4 h-4 mr-2" />
            {{ t("common.save") }}
          </Button>
          <Button variant="outline" @click="resetSettings">
            <RotateCcw class="w-4 h-4 mr-2" />
            {{ t("common.reset") }}
          </Button>
        </div>
        <div class="p-3 bg-muted/50 rounded-lg">
          <p class="text-sm text-muted-foreground flex items-center gap-2">
            <Info class="w-4 h-4" />
            <span><strong>{{ t("common.tip") }}：</strong>{{ t("homeSettings.tip.content") }}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
