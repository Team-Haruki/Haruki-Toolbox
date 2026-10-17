<template>
  <div class="mx-auto w-full max-w-2xl space-y-4 py-4">
    <KratosSettingsFlow section="oidc" />
    <AfdianBindingCard />
  </div>
</template>

<script setup lang="ts">
import { KratosSettingsFlow } from "@/modules/user-settings/components/settings"
import AfdianBindingCard from "@/modules/user-settings/components/settings/AfdianBindingCard.vue"
</script>
