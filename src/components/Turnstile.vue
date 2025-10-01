<script setup lang="ts">
import { onMounted, ref, defineProps, defineEmits, defineExpose } from "vue"

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

function handleVerify(res: string) {
  token.value = res
  localStorage.setItem("turnstile_token", res)
  emit("verify", res)
  if (props.callback) {
    props.callback(res)
  }
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
  widgetId = (window as any).turnstile.render(container.value!, {
    sitekey: props.sitekey ?? "0x4AAAAAAB3p7JESUfJ98K3S",
    callback: handleVerify,
    theme: props.theme,
    size: props.size,
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
  localStorage.removeItem("turnstile_token")
  token.value = null

  if (container.value) {
    if ((window as any).turnstile) {
      renderTurnstile()
    } else {
      const interval = setInterval(() => {
        if ((window as any).turnstile) {
          renderTurnstile()
          clearInterval(interval)
        }
      }, 200)
    }
  }
})
</script>

<template>
  <div ref="container"></div>
</template>