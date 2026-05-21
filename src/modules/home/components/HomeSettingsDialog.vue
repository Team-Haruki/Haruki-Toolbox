<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  Info,
  Network,
  Palette,
  RotateCcw,
  Save,
  Settings,
} from "lucide-vue-next"
import { Button } from "@/components/ui/button"
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
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SekaiDataSettings from "@/modules/home/components/SekaiDataSettings.vue"
import { useHomeSettings } from "@/modules/home/composables/useHomeSettings"

const {
  selectedEndpoint,
  selectedTheme,
  selectedLocale,
  selectedReducedVisualEffects,
  endpointOptions,
  endpointSelectionDisabled,
  endpointUnavailable,
  themeOptions,
  localeOptions,
  selectedEndpointLabel,
  selectedThemeLabel,
  selectedLocaleLabel,
  visualEffectsIcon,
  saveSettings,
  resetSettings,
} = useHomeSettings()
const { t, locale } = useI18n()
const localeKey = computed(() => locale.value)
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button type="button" variant="ghost" size="sm" class="gap-2" :aria-label="t('homeSettings.trigger')">
        <Settings class="size-4" />
        <span class="hidden sm:inline">{{ t("homeSettings.trigger") }}</span>
      </Button>
    </DialogTrigger>
    <DialogScrollContent class="max-h-[88vh] overflow-y-auto sm:max-w-[960px]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Settings class="size-5" />
          {{ t("homeSettings.title") }}
        </DialogTitle>
        <DialogDescription>{{ t("homeSettings.description") }}</DialogDescription>
      </DialogHeader>

      <Tabs default-value="preferences" class="space-y-4">
        <TabsList class="grid w-full grid-cols-2 sm:w-fit">
          <TabsTrigger value="preferences">
            <Settings class="size-4" />
            {{ t("homeSettings.tabs.preferences") }}
          </TabsTrigger>
          <TabsTrigger value="sekai-data">
            <Network class="size-4" />
            {{ t("homeSettings.tabs.sekaiData") }}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" class="space-y-5">
          <div class="grid gap-5 md:grid-cols-2">
            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <Network class="size-4" />
                {{ t("homeSettings.endpoint.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">
                {{ t("homeSettings.endpoint.help") }}
              </p>
              <Select v-model="selectedEndpoint" :key="`endpoint-${localeKey}`" :disabled="endpointSelectionDisabled || endpointUnavailable">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`endpoint-value-${localeKey}`" :placeholder="t('homeSettings.endpoint.placeholder')">
                    {{ selectedEndpointLabel }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in endpointOptions" :key="opt.value" :value="opt.value">
                    <div class="flex items-center gap-2">
                      <component :is="opt.icon" class="size-4" />
                      <span>{{ opt.label }}</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="endpointUnavailable" class="text-sm text-destructive">
                {{ t("homeSettings.endpoint.unavailable") }}
              </p>
            </section>

            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <Palette class="size-4" />
                {{ t("homeSettings.theme.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">{{ t("homeSettings.theme.help") }}</p>
              <Select v-model="selectedTheme" :key="`theme-${localeKey}`">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`theme-value-${localeKey}`" :placeholder="t('homeSettings.theme.placeholder')">
                    {{ selectedThemeLabel }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
                    <div class="flex items-center gap-2">
                      <component :is="opt.icon" class="size-4" />
                      {{ opt.label }}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section class="grid h-full content-center gap-2 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <Label class="flex items-center gap-2 text-base font-medium">
                <Info class="size-4" />
                {{ t("homeSettings.locale.label") }}
              </Label>
              <p class="text-sm text-muted-foreground">{{ t("homeSettings.locale.help") }}</p>
              <Select v-model="selectedLocale" :key="`locale-${localeKey}`">
                <SelectTrigger class="w-full">
                  <SelectValue :key="`locale-value-${localeKey}`" :placeholder="t('homeSettings.locale.placeholder')">
                    {{ selectedLocaleLabel }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in localeOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </section>

            <section class="grid h-full content-center gap-4 rounded-md border border-foreground/10 bg-muted/20 p-4 shadow-sm ring-1 ring-foreground/5">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <Label for="dialog-reduced-visual-effects" class="flex items-center gap-2 text-base font-medium">
                    <component :is="visualEffectsIcon" class="size-4" />
                    {{ t("homeSettings.visualEffects.label") }}
                  </Label>
                  <p class="mt-2 text-sm text-muted-foreground">{{ t("homeSettings.visualEffects.help") }}</p>
                </div>
                <Switch id="dialog-reduced-visual-effects" v-model="selectedReducedVisualEffects" class="mt-1 shrink-0" />
              </div>
            </section>
          </div>

          <div class="grid gap-2 border-t pt-4 sm:grid-cols-2">
            <Button type="button" class="w-full" @click="saveSettings">
              <Save class="size-4" />
              {{ t("common.save") }}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button type="button" variant="destructive" class="w-full">
                  <RotateCcw class="size-4" />
                  {{ t("common.reset") }}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{{ t("homeSettings.resetDialog.title") }}</AlertDialogTitle>
                  <AlertDialogDescription>{{ t("homeSettings.resetDialog.description") }}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{{ t("common.cancel") }}</AlertDialogCancel>
                  <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="resetSettings">
                    {{ t("homeSettings.resetDialog.confirm") }}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div class="rounded-md border bg-muted/30 p-3">
            <p class="flex items-start gap-2 text-sm text-muted-foreground">
              <Info class="mt-0.5 size-4 shrink-0" />
              <span><strong>{{ t("common.tip") }}: </strong>{{ t("homeSettings.tip.content") }}</span>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="sekai-data">
          <SekaiDataSettings />
        </TabsContent>
      </Tabs>
    </DialogScrollContent>
  </Dialog>
</template>
