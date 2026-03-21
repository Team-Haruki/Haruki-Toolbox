<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import { Laptop2, ShieldCheck } from "lucide-vue-next"

const router = useRouter()
const { t } = useI18n()

async function openSessionSettings() {
  await router.push({ name: "user.identitySessionSettings" })
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Laptop2 class="h-6 w-6" />
        {{ t("userSettings.sessions.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.sessions.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <Button class="w-full" @click="openSessionSettings">
        <ShieldCheck class="mr-2 h-4 w-4" />
        {{ t("userSettings.sessions.manageButton") }}
      </Button>
    </CardContent>
  </Card>
</template>
