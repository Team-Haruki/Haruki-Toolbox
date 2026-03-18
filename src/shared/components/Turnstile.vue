<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { useTurnstileWidget } from "@/composables/useTurnstileWidget"

const props = defineProps<{
  sitekey?: string
  callback?: (token: string) => void
  theme?: string
  size?: string
  action?: string
}>()

const emit = defineEmits<{
  (e: "verify", token: string): void
  (e: "invalid"): void
}>()
const { t } = useI18n()

function resolveSitekey() {
  const propSitekey = props.sitekey?.trim()
  if (propSitekey) {
    return propSitekey
  }

  const envSitekey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim()
  if (envSitekey) {
    return envSitekey
  }

  return undefined
}

const { container, isLoading, isUnavailable, reset, execute, retry } = useTurnstileWidget({
  getSitekey: resolveSitekey,
  getCallback: () => props.callback,
  getTheme: () => props.theme,
  getSize: () => props.size,
  getAction: () => props.action,
  onVerify: (token) => emit("verify", token),
  onInvalid: () => emit("invalid"),
})

defineExpose({
  reset,
  execute,
  retry,
})
</script>

<template>
  <div class="turnstile-container">
    <div class="turnstile-shell">
      <div class="turnstile" ref="container"></div>
      <div v-if="isLoading && !isUnavailable" class="turnstile-status" aria-live="polite">
        {{ t("turnstile.loading") }}
      </div>
      <div v-else-if="isUnavailable" class="turnstile-status turnstile-status-error" role="status" aria-live="polite">
        <span>{{ t("turnstile.loadFailed") }}</span>
        <Button type="button" variant="outline" size="sm" @click="retry">
          {{ t("turnstile.retry") }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.turnstile-container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.turnstile-shell {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.turnstile-status {
  font-size: 0.875rem;
  color: var(--muted-foreground);
  text-align: center;
}

.turnstile-status-error {
  max-width: 22rem;
}

.turnstile-status-error :deep(button) {
  margin-top: 0.5rem;
}

@media (max-width: 380px) {
  .turnstile {
    transform: scale(0.85);
    transform-origin: center;
  }
}
</style>
