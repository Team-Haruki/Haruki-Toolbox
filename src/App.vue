<template>
  <router-view></router-view>
  <Toaster position="top-right" richColors/>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'
import { toast } from "vue-sonner"
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
  if (isLoggedIn.value && userStore.userId) {
    try {
      const response = await getSettings(userStore.userId)
      if (response.status === 200 && response.updatedData) {
        userStore.setUser(response.updatedData)
        toast.success("同步设置成功", {description: "已成功同步当前账号的云端设置"})
      }
    } catch (e) {
    }
  }
})
</script>