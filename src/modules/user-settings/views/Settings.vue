<script setup lang="ts">
import {
  AccountSettings,
  EmailSettings,
  IMAuthorization,
  IMBindingSettings,
  OAuth2Authorizations,
  PasswordSettings,
} from "@/modules/user-settings/components/settings"
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <AccountSettings />
    <EmailSettings />
    <PasswordSettings />
    <IMBindingSettings />
    <IMAuthorization />
    <OAuth2Authorizations />
  </div>
</template>
