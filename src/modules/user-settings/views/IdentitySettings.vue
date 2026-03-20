<script setup lang="ts">
import { watchEffect } from "vue"
import { useRoute, useRouter } from "vue-router"

const router = useRouter()
const route = useRoute()

watchEffect(() => {
  if (route.name !== "user.identitySettings") {
    return
  }

  void router.replace({
    name: "user.settings",
    query: route.query,
  })
})
</script>

<template>
  <div />
</template>
