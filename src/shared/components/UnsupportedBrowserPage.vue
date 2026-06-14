<script setup lang="ts">
import { AlertTriangle } from "lucide-vue-next"
import { useI18n } from "vue-i18n"

const { t } = useI18n()
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
    </section>
  </main>
</template>
