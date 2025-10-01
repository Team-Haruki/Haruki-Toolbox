<script setup lang="ts">
import AccountSettings from "@/components/users/pages/settings/AccountSettings.vue"
import EmailSettings from "@/components/users/pages/settings/EmailSettings.vue"
import PasswordSettings from "@/components/users/pages/settings/PasswordSettings.vue"
import ImBindingSettings from "@/components/users/pages/settings/IMBindingSettings.vue"
import ImAuthorization from "@/components/users/pages/settings/IMAuthorization.vue"
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