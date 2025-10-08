<template>
  <router-view></router-view>
  <Toaster position="top-right" richColors/>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'
import { useUserStore } from "@/store"
import { getSettings } from "@/api/settings/get-settings"
import {
  computed,
  onMounted
} from "vue"
import {Toaster} from "@/components/ui/sonner";

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

onMounted(async () => {
  if (isLoggedIn.value) {
    await getSettings()
  }
})
</script>