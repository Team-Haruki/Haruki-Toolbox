<script setup lang="ts">
import AccountSettings from "@/components/users/settings/AccountSettings.vue"
import EmailSettings from "@/components/users/settings/EmailSettings.vue"
import PasswordSettings from "@/components/users/settings/PasswordSettings.vue"
import QQBindingSettings from "@/components/users/settings/QQBindingSettings.vue"
import QQAuthorization from "@/components/users/settings/QQAuthorization.vue"
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-start gap-6 px-0 py-4">
    <AccountSettings />
    <EmailSettings />
    <PasswordSettings />
    <QQBindingSettings />
    <QQAuthorization />
  </div>
</template>