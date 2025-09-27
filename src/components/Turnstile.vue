<script setup lang="ts">
import { ref } from "vue"

const token = ref<string | null>(localStorage.getItem("turnstile_token"))
function onVerifyCallback(res: string) {
  token.value = res
  localStorage.setItem("turnstile_token", res)
}
</script>

<template>
  <div>
    <form @submit.prevent="">
      <div
          class="cf-turnstile"
          data-sitekey="0x4AAAAAAB3p7JESUfJ98K3S"
          :data-callback="onVerifyCallback"
      ></div>
      <button type="submit">提交</button>
    </form>
  </div>
</template>
