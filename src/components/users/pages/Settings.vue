<script setup lang="ts">
import { watch } from "vue"
import { useRouter } from "vue-router"
import { useUserStore } from "@/components/users/data/store"
import EmailSettings from "@/components/users/pages/settings/EmailSettings.vue"
import AccountSettings from "@/components/users/pages/settings/AccountSettings.vue"
import ImAuthorization from "@/components/users/pages/settings/IMAuthorization.vue"
import PasswordSettings from "@/components/users/pages/settings/PasswordSettings.vue"
import ImBindingSettings from "@/components/users/pages/settings/IMBindingSettings.vue"

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