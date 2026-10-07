<script setup lang="ts">
import { ref } from "vue"
import { AlertTriangle, Copy } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { copyTextToClipboard } from "@/lib/clipboard"

const { t } = useI18n()

// The OAuth2 device page (/device) opened from an in-app browser: the code
// leaves the address bar, and only the code-free page address is offered for
// copying, so it is never carried into another app or browser.
const DEVICE_PAGE_PATH = "/device"
const isDevicePage = typeof window !== "undefined"
  && (window.location.pathname === DEVICE_PAGE_PATH || window.location.pathname.startsWith(`${DEVICE_PAGE_PATH}/`))
if (isDevicePage && (window.location.search || window.location.hash)) {
  window.history.replaceState(window.history.state, "", DEVICE_PAGE_PATH)
}

const copyState = ref<"idle" | "copied" | "failed">("idle")

async function copyDevicePageLink() {
  const copied = await copyTextToClipboard(`${window.location.origin}${DEVICE_PAGE_PATH}`)
  copyState.value = copied ? "copied" : "failed"
}
</script>

<template>
  <main class="min-h-dvh bg-background text-foreground flex items-center justify-center px-6 py-10">
    <section class="w-full max-w-xl rounded-lg border bg-card p-6 text-center shadow-sm sm:p-8">
      <div class="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle class="h-6 w-6" />
      </div>
      <h1 class="text-2xl font-semibold tracking-normal">{{ t("core.unsupportedBrowser.title") }}</h1>
      <p class="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
        {{ t("core.unsupportedBrowser.description") }}
        <br>
        {{ t("core.unsupportedBrowser.suggestion") }}
      </p>
      <div v-if="isDevicePage" class="mt-6 space-y-3">
        <p class="text-sm leading-6">{{ t("core.unsupportedBrowser.deviceHint") }}</p>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          @click="copyDevicePageLink"
        >
          <Copy class="h-4 w-4" />
          {{ t("core.unsupportedBrowser.copyDeviceLink") }}
        </button>
        <p v-if="copyState !== 'idle'" class="text-xs text-muted-foreground" role="status">
          {{ copyState === "copied" ? t("core.unsupportedBrowser.copied") : t("core.unsupportedBrowser.copyFailed") }}
        </p>
      </div>
    </section>
  </main>
</template>
