<script setup lang="ts">
import { watch } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/store"
import EmailSettings from "@/components/pages/users/settings/EmailSettings.vue"
import AccountSettings from "@/components/pages/users/settings/AccountSettings.vue"
import ImAuthorization from "@/components/pages/users/settings/IMAuthorization.vue"
import PasswordSettings from "@/components/pages/users/settings/PasswordSettings.vue"
import ImBindingSettings from "@/components/pages/users/settings/IMBindingSettings.vue"

const router = useRouter()
const userStore = useUserStore()
watch(
  () => userStore.sessionToken,
  (token) => {
    if (!token) {
      if (router.currentRoute.value.path !== "/user/login") {
        router.push("/user/login")
      }
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <AccountSettings />
    <EmailSettings />
    <PasswordSettings />
    <ImBindingSettings />
    <ImAuthorization />
  </div>
</template>