<script setup lang="ts">
import {
  ref,
  onMounted,
  onUnmounted
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
let widgetId: string | null = null
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
  if (!container.value || widgetId !== null || !window.turnstile) return
  widgetId = window.turnstile.render(container.value, {
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
  if (widgetId && window.turnstile) {
    try {
      window.turnstile.reset(widgetId)
    } catch {
      widgetId = null
      if (container.value) {
        container.value.innerHTML = ""
        renderTurnstile()
      }
    }
  }
}

function execute() {
  if (widgetId !== null && window.turnstile) {
    window.turnstile.execute(widgetId)
  }
}

defineExpose({
  reset,
  execute,
})

onMounted(() => {
  token.value = localStorage.getItem("turnstile_token")

  if (container.value) {
    if (window.turnstile) {
      renderTurnstile()
    } else {
      interval = window.setInterval(() => {
        if (window.turnstile) {
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
      transform: scale(0.85);
      transform-origin: center;
    }
  }
}
</style>