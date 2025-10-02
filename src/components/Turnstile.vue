<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted,
  defineProps,
  defineEmits,
  defineExpose
} from "vue"

const props = defineProps<{
  sitekey?: string
  callback?: (token: string) => void
  theme?: string
  size?: string
  action?: string
}>()

const emit = defineEmits<{
  (e: "verify", token: string): void
}>()

const token = ref<string | null>(null)
const container = ref<HTMLDivElement | null>(null)
let widgetId: number | null = null
let interval: number | null = null

function handleVerify(res: string) {
  token.value = res
  localStorage.setItem("turnstile_token", res)
  emit("verify", res)
  props.callback?.(res)
}

function handleExpired() {
  token.value = null
  localStorage.removeItem("turnstile_token")
}

function handleError() {
  token.value = null
  localStorage.removeItem("turnstile_token")
}

function renderTurnstile() {
  if (!container.value || widgetId !== null) return
  widgetId = (window as any).turnstile.render(container.value, {
    sitekey: props.sitekey ?? "0x4AAAAAAB3p7JESUfJ98K3S",
    callback: handleVerify,
    theme: props.theme,
    size: props.size || "flexible",
    action: props.action,
    "expired-callback": handleExpired,
    "error-callback": handleError,
  })
}

function reset() {
  if (widgetId !== null && (window as any).turnstile) {
    (window as any).turnstile.reset(widgetId)
    handleExpired()
  }
}

function execute() {
  if (widgetId !== null && (window as any).turnstile) {
    (window as any).turnstile.execute(widgetId)
  }
}

defineExpose({
  reset,
  execute,
})

onMounted(() => {
  token.value = localStorage.getItem("turnstile_token")

  if (container.value) {
    if ((window as any).turnstile) {
      renderTurnstile()
    } else {
      interval = window.setInterval(() => {
        if ((window as any).turnstile) {
          renderTurnstile()
          if (interval) {
            clearInterval(interval)
            interval = null
          }
        }
      }, 200)
    }
  }
})

onUnmounted(() => {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
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
      max-width: 275px;
      overflow: hidden;
    }
  }
}
</style>