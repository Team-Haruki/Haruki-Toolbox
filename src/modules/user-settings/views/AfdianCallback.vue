<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Loader2, CheckCircle2, CircleAlert } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useUserStore } from "@/shared/stores/user"
import { completeAfdianBinding } from "@/modules/user-settings/api/sponsor"

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const { t } = useI18n()
const result = ref<"loading" | "success" | "failed">("loading")

onMounted(async () => {
  const { code, state } = route.query
  // Remove the one-time authorization code from history before issuing API calls.
  await router.replace({ name: "user.afdianCallback", query: {} })
  if (!user.userId || typeof code !== "string" || typeof state !== "string" || !code || !state) { result.value = "failed"; return }
  try { await completeAfdianBinding(user.userId, code, state); result.value = "success" }
  catch { result.value = "failed" }
})
</script>

<template>
  <Card class="mx-auto my-8 w-full max-w-lg">
    <CardHeader><CardTitle>{{ t("userSettings.afdian.callbackTitle") }}</CardTitle></CardHeader>
    <CardContent class="space-y-4" role="status">
      <Loader2 v-if="result === 'loading'" class="size-8 animate-spin text-primary" /><CheckCircle2 v-else-if="result === 'success'" class="size-8 text-primary" /><CircleAlert v-else class="size-8 text-destructive" />
      <p>{{ t(`userSettings.afdian.callback_${result}`) }}</p>
      <div v-if="result !== 'loading'" class="flex flex-wrap gap-2"><Button v-if="result === 'success'" as-child><RouterLink :to="{ name: 'user.sponsorFrames' }">{{ t("userSettings.frames.title") }}</RouterLink></Button><Button as-child variant="outline"><RouterLink to="/user/settings">{{ t("userSettings.frames.back") }}</RouterLink></Button></div>
    </CardContent>
  </Card>
</template>
