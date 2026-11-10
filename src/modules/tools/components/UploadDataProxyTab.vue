<script setup lang="ts">
import type { Component } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Download, ExternalLink, Gamepad2, Laptop, LucideAlertTriangle, Monitor, MonitorSmartphone, Smartphone } from "lucide-vue-next"
import UploadPanelHeader from "@/modules/tools/components/upload/UploadPanelHeader.vue"
import UploadStep from "@/modules/tools/components/upload/UploadStep.vue"

// Downloads and guides follow the HarukiProxy pages of the HarukiBot docs
// (docs/haruki-proxy/ in HarukiBot-Docs): bump the version there and here together.
const HARUKI_PROXY_VERSION = "v3.0.0"
const DOWNLOAD_BASE = `https://haruki-dl-esa-cn.seiunx.com/HarukiProxy/${HARUKI_PROXY_VERSION}/HarukiProxy-${HARUKI_PROXY_VERSION}`
const DOCS_BASE = "https://neo.haruki.seiunx.com/haruki-proxy"
const GUIDE_INDEX_URL = `${DOCS_BASE}/`
const CHANGELOG_URL = `${DOCS_BASE}/v3`

type DeviceKey = "android" | "windows" | "mac"

const DEVICES: readonly { key: DeviceKey; icon: Component; downloadUrl: string; guides: readonly { key: string; url: string }[] }[] = [
  {
    key: "android",
    icon: Smartphone,
    downloadUrl: `${DOWNLOAD_BASE}-android-arm64.apk`,
    guides: [
      { key: "vphone", url: `${DOCS_BASE}/android` },
      { key: "noRoot", url: `${DOCS_BASE}/android.india` },
    ],
  },
  {
    key: "windows",
    icon: Monitor,
    downloadUrl: `${DOWNLOAD_BASE}-windows-x64.zip`,
    guides: [{ key: "pc", url: `${DOCS_BASE}/pc.v3` }],
  },
  {
    key: "mac",
    icon: Laptop,
    downloadUrl: `${DOWNLOAD_BASE}-macos-arm64.zip`,
    guides: [
      { key: "pc", url: `${DOCS_BASE}/pc.v3` },
      { key: "macNotes", url: `${DOCS_BASE}/pc.v3#macos` },
    ],
  },
]

const { t, locale } = useI18n()
</script>

<template>
  <Card>
    <CardHeader>
      <UploadPanelHeader
        :icon="MonitorSmartphone"
        :title="t('tools.uploadData.proxyTab.title')"
        :description="t('tools.uploadData.proxyTab.description')"
      >
        <p v-if="!locale.startsWith('zh')" class="mt-1 text-xs text-muted-foreground">
          {{ t("tools.iosModules.tutorialAlert.nonZhWarning") }}
        </p>
        <template #action>
          <Button as-child variant="outline" size="sm">
            <a :href="GUIDE_INDEX_URL" target="_blank" rel="noopener noreferrer" data-testid="harukiproxy-guide-index">
              <BookOpen class="size-4" aria-hidden="true" />
              {{ t("tools.uploadData.proxyTab.guideIndex") }}
              <ExternalLink class="size-3.5 text-muted-foreground" aria-hidden="true" />
            </a>
          </Button>
        </template>
      </UploadPanelHeader>
    </CardHeader>

    <CardContent class="space-y-6">
      <!-- The v1/v2 cutoff is in the past: background for a new user, a nudge for an old one. -->
      <Alert class="border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-100" data-testid="harukiproxy-upgrade-warning">
        <LucideAlertTriangle aria-hidden="true" />
        <AlertTitle>{{ t("tools.uploadData.proxyTab.upgradeWarning.title") }}</AlertTitle>
        <AlertDescription class="text-current">
          {{ t("tools.uploadData.proxyTab.upgradeWarning.deadline") }}
          {{ t("tools.uploadData.proxyTab.upgradeWarning.upgrade") }}
        </AlertDescription>
      </Alert>

      <UploadStep
        :step="1"
        :title="t('tools.uploadData.proxyTab.stepTitles.install')"
        :description="t('tools.uploadData.proxyTab.steps.install')"
      >
        <!-- One line per device: what to download and which guide to follow. -->
        <ul class="divide-y divide-border/60 overflow-hidden rounded-xl border bg-muted/20" data-testid="harukiproxy-downloads">
          <li
            v-for="device in DEVICES"
            :key="device.key"
            class="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3"
            :data-testid="`harukiproxy-device-${device.key}`"
          >
            <div class="flex min-w-0 flex-1 basis-56 items-start gap-3">
              <span class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
                <component :is="device.icon" class="size-4" />
              </span>
              <div class="min-w-0">
                <p class="text-sm font-medium">{{ t(`tools.uploadData.proxyTab.devices.${device.key}.name`) }}</p>
                <p class="mt-0.5 text-xs text-muted-foreground">{{ t(`tools.uploadData.proxyTab.devices.${device.key}.note`) }}</p>
              </div>
            </div>
            <div class="ml-auto flex flex-wrap items-center justify-end gap-1.5">
              <Button
                v-for="guide in device.guides"
                :key="guide.key"
                as-child
                variant="ghost"
                size="sm"
                class="text-primary hover:text-primary"
              >
                <a :href="guide.url" target="_blank" rel="noopener noreferrer">
                  <BookOpen class="size-3.5" aria-hidden="true" />
                  {{ t(`tools.uploadData.proxyTab.guides.${guide.key}`) }}
                </a>
              </Button>
              <Button as-child variant="outline" size="sm">
                <a :href="device.downloadUrl" target="_blank" rel="noopener noreferrer">
                  <Download class="size-3.5" aria-hidden="true" />
                  {{ t(`tools.uploadData.proxyTab.devices.${device.key}.download`) }}
                </a>
              </Button>
            </div>
          </li>
        </ul>
        <p class="text-xs text-muted-foreground">
          {{ t("tools.uploadData.proxyTab.version", { version: HARUKI_PROXY_VERSION }) }}
          <a
            :href="CHANGELOG_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="font-medium text-primary underline-offset-4 hover:underline"
          >{{ t("tools.uploadData.proxyTab.changelog") }}</a>
        </p>
      </UploadStep>

      <Separator />

      <UploadStep
        :step="2"
        :title="t('tools.uploadData.proxyTab.stepTitles.bind')"
        :description="t('tools.uploadData.proxyTab.steps.bind')"
      >
        <Button as-child variant="outline" size="sm">
          <RouterLink to="/user/game-account-bindings">
            <Gamepad2 class="size-4" aria-hidden="true" />
            {{ t("tools.uploadData.proxyTab.bindAction") }}
          </RouterLink>
        </Button>
      </UploadStep>

      <Separator />

      <UploadStep
        :step="3"
        :title="t('tools.uploadData.proxyTab.stepTitles.connect')"
        :description="t('tools.uploadData.proxyTab.steps.connect')"
      />

      <Separator />

      <UploadStep
        :step="4"
        :title="t('tools.uploadData.proxyTab.stepTitles.run')"
        :description="t('tools.uploadData.proxyTab.steps.run')"
      >
        <p class="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {{ t("tools.uploadData.proxyTab.limits") }}
        </p>
      </UploadStep>
    </CardContent>
  </Card>
</template>
