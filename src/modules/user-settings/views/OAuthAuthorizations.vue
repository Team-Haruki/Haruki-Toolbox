<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { OAuth2Authorizations } from "@/modules/user-settings/components/settings"
import PageHeader from "@/shared/components/PageHeader.vue"

const { t } = useI18n()
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-0 py-4">
    <!-- The one heading of the page; the list below carries only its toolbar. -->
    <PageHeader
      size="compact"
      :title="t('userSettings.oauthAuthorizations.title')" :description="t('userSettings.oauthAuthorizations.description')"
    />

    <OAuth2Authorizations />
  </div>
</template>
