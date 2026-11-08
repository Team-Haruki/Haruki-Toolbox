<script setup lang="ts">
import { computed, ref } from "vue"
import { Check, Copy, MoreHorizontal } from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { copyTextToClipboard } from "@/lib/clipboard"
import { detectRestrictedBrowserApp, detectRestrictedBrowserPlatform } from "@/lib/restricted-browser"

const { t } = useI18n()

// Shown only inside in-app web views (WeChat, QQ, ...). "Unsupported browser"
// meant nothing to those users; the page now names the app they are in and
// points, literally, at the app's own "···" button in the top-right corner,
// which is where the "open in browser" action lives in every one of them.
const app = detectRestrictedBrowserApp()
const platform = detectRestrictedBrowserPlatform()
const appName = computed(() => (app ? t(`core.unsupportedBrowser.apps.${app}`) : ""))
const browsers = computed(() => t(`core.unsupportedBrowser.browsers.${platform}`))

// iOS in-app browsers all keep their menu in the top-right corner, so the page
// points at it and leads with the menu steps. Android apps and desktop clients
// put the menu in different places or hide it, so there the link comes first
// and the menu is described without a position.
const pointsAtCorner = platform === "ios"

// The OAuth2 device page (/device) opened from an in-app browser: the code
// leaves the address bar, and only the code-free page address is offered for
// copying, so it is never carried into another app or browser.
const DEVICE_PAGE_PATH = "/device"
const isDevicePage = typeof window !== "undefined"
  && (window.location.pathname === DEVICE_PAGE_PATH || window.location.pathname.startsWith(`${DEVICE_PAGE_PATH}/`))
if (isDevicePage && (window.location.search || window.location.hash)) {
  window.history.replaceState(window.history.state, "", DEVICE_PAGE_PATH)
}

const pageLink = typeof window === "undefined"
  ? ""
  : isDevicePage
    ? `${window.location.origin}${DEVICE_PAGE_PATH}`
    : window.location.href

const copyState = ref<"idle" | "copied" | "failed">("idle")

async function copyPageLink() {
  const copied = await copyTextToClipboard(pageLink)
  copyState.value = copied ? "copied" : "failed"
}

function selectLink(event: Event) {
  (event.target as HTMLInputElement).select()
}
</script>

<template>
  <main class="relative min-h-dvh overflow-x-clip bg-background text-foreground">
    <!-- A teal wash pulls the eye to the top-right corner before anything is read.
         Light only: on the dark background it read as a stain, and the bright
         pointer stands out on its own there. -->
    <div v-if="pointsAtCorner" class="corner-glow pointer-events-none absolute inset-x-0 top-0 h-80 dark:hidden" aria-hidden="true" />

    <!-- The pointer: a copy of the app's own "···" button, hugging the corner the
         real one sits above, with an arrow drawn out of the page towards it. -->
    <div
      v-if="pointsAtCorner"
      class="pointer-events-none absolute right-4 top-[max(0.75rem,env(safe-area-inset-top))] flex flex-col items-end gap-1 sm:right-6"
      aria-hidden="true"
    >
      <!-- The arrow and the pill share one 48 px column, so the stroke leaves
           the pill's centre and bends towards the corner above it. -->
      <div class="flex w-12 flex-col items-center">
        <svg class="h-14 w-12 text-primary" viewBox="0 0 48 56" fill="none">
          <path class="corner-arrow" d="M24 54 C 22 38, 28 22, 42 8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path class="corner-arrow-head" d="M31 8 L42 8 L42 19" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="inline-flex h-9 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
          <MoreHorizontal class="h-5 w-5" />
        </span>
      </div>
      <span class="max-w-32 text-right text-xs font-medium leading-4 text-primary">{{ t("core.unsupportedBrowser.cornerLabel") }}</span>
    </div>

    <div :class="['relative mx-auto flex w-full max-w-md flex-col px-5 pb-14 sm:max-w-lg sm:px-8', pointsAtCorner ? 'pt-40 sm:pt-44' : 'pt-12 sm:pt-20']">
      <div class="flex items-center gap-2.5">
        <img src="/pwa-192x192.png" alt="" class="h-8 w-8 rounded-full" width="32" height="32">
        <span class="text-sm font-medium text-muted-foreground">{{ t("app.name") }}</span>
      </div>

      <h1 class="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{{ t("core.unsupportedBrowser.title") }}</h1>
      <p class="mt-4 max-w-prose text-base leading-7 text-muted-foreground">
        {{ app ? t("core.unsupportedBrowser.descriptionApp", { app: appName }) : t("core.unsupportedBrowser.descriptionGeneric") }}
      </p>

      <section :class="pointsAtCorner ? 'order-1 mt-9' : 'order-2 mt-12 border-t pt-7'">
        <h2 v-if="!pointsAtCorner" class="text-base font-semibold">
          {{ app ? t("core.unsupportedBrowser.menuAltTitleApp", { app: appName }) : t("core.unsupportedBrowser.menuAltTitle") }}
        </h2>
        <ol :class="['space-y-7', pointsAtCorner ? '' : 'mt-5']">
        <li class="step relative pl-11">
          <span class="step-badge">1</span>
          <p class="text-base leading-7">
            <i18n-t :keypath="pointsAtCorner ? 'core.unsupportedBrowser.stepMenu' : 'core.unsupportedBrowser.stepMenuAnywhere'" tag="span" scope="global">
              <template #icon>
                <span class="mx-1 inline-flex h-6 min-w-8 translate-y-1 items-center justify-center rounded-full bg-primary px-1.5 text-primary-foreground align-baseline" aria-hidden="true">
                  <MoreHorizontal class="h-4 w-4" />
                </span>
              </template>
            </i18n-t>
          </p>
        </li>
        <li class="step relative pl-11">
          <span class="step-badge">2</span>
          <p class="text-base leading-7">
            {{ platform === "ios" ? t("core.unsupportedBrowser.stepOpenIos") : t("core.unsupportedBrowser.stepOpenAndroid") }}
          </p>
        </li>
        <li class="step relative pl-11">
          <span class="step-badge">3</span>
          <p class="text-base leading-7">{{ t("core.unsupportedBrowser.stepDone") }}</p>
        </li>
        </ol>
      </section>

      <section :class="pointsAtCorner ? 'order-2 mt-12 border-t pt-7' : 'order-1 mt-9'">
        <h2 class="text-base font-semibold">
          {{ pointsAtCorner ? t("core.unsupportedBrowser.fallbackTitle") : t("core.unsupportedBrowser.copyFirstTitle") }}
        </h2>
        <p class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ t("core.unsupportedBrowser.fallbackBody", { browsers }) }}
        </p>
        <p v-if="isDevicePage" class="mt-2 text-sm leading-6 text-muted-foreground">
          {{ t("core.unsupportedBrowser.deviceHint") }}
        </p>
        <div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label class="min-w-0 flex-1">
            <span class="sr-only">{{ t("core.unsupportedBrowser.linkLabel") }}</span>
            <input
              :value="pageLink"
              readonly
              class="h-11 w-full rounded-md border bg-card px-3 font-mono text-xs text-foreground select-all sm:text-sm"
              @focus="selectLink"
              @click="selectLink"
            >
          </label>
          <Button type="button" class="h-11 shrink-0 px-5" @click="copyPageLink">
            <Check v-if="copyState === 'copied'" />
            <Copy v-else />
            {{ t("core.unsupportedBrowser.copyLink") }}
          </Button>
        </div>
        <p v-if="copyState !== 'idle'" class="mt-3 text-sm leading-6 text-muted-foreground" role="status">
          {{ copyState === "copied" ? t("core.unsupportedBrowser.copied") : t("core.unsupportedBrowser.copyFailed") }}
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.corner-glow {
  background: radial-gradient(60% 70% at 100% 0%, color-mix(in oklch, var(--primary) 22%, transparent), transparent 70%);
}

/* The one moment of motion on the page: the arrow draws itself towards the
   real button once, right after load. */
.corner-arrow {
  stroke-dasharray: 70;
  stroke-dashoffset: 70;
  animation: corner-arrow-draw 700ms cubic-bezier(0.2, 0.7, 0.2, 1) 250ms forwards;
}

.corner-arrow-head {
  opacity: 0;
  animation: corner-arrow-show 250ms ease-out 850ms forwards;
}

@keyframes corner-arrow-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes corner-arrow-show {
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .corner-arrow { animation: none; stroke-dashoffset: 0; }
  .corner-arrow-head { animation: none; opacity: 1; }
}

.step-badge {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 2px solid var(--primary);
  background: var(--background);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--primary);
}

/* The line that joins the steps into one path. */
.step:not(:last-child)::after {
  content: "";
  position: absolute;
  left: calc(0.875rem - 1px);
  top: 2rem;
  bottom: -1.5rem;
  width: 2px;
  background: color-mix(in oklch, var(--primary) 30%, transparent);
}
</style>
