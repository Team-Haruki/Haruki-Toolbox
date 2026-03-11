<script setup lang="ts">
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

const { container, reset, execute } = useTurnstileWidget({
  getSitekey: () => props.sitekey,
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
})
</script>

<template>
  <div class="turnstile-container">
    <div class="turnstile" ref="container"></div>
  </div>
</template>

<style scoped>
.turnstile-container {
  width: 100%;
  display: flex;
  justify-content: center;

  @media (max-width: 380px) {
    .turnstile {
      transform: scale(0.85);
      transform-origin: center;
    }
  }
}
</style>
