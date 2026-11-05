<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { Loader2, CheckCircle2, CircleAlert } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useUserStore } from "@/shared/stores/user"
import { completeAfdianBinding } from "@/modules/user-settings/api/sponsor"
import { classifyAfdianCallbackError, type AfdianCallbackFailure } from "@/modules/user-settings/lib/afdian-callback"

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const { t } = useI18n()
// Each failure gets its own sentence: a conflict (the Afdian account belongs
// to another toolbox user) cannot be fixed by authorizing again, a stale
// authorization can, and a transient failure only needs a retry.
const result = ref<"loading" | "success" | AfdianCallbackFailure>("loading")

onMounted(async () => {
  const { code, state } = route.query
  // Remove the one-time authorization code from history before issuing API calls.
  await router.replace({ name: "user.afdianCallback", query: {} })
  if (!user.userId || typeof code !== "string" || typeof state !== "string" || !code || !state) { result.value = "invalid"; return }
  try { await completeAfdianBinding(user.userId, code, state); result.value = "success" }
  catch (error: unknown) { result.value = classifyAfdianCallbackError(error) }
})
</script>

<template>
  <Card class="mx-auto my-8 w-full max-w-lg">
    <CardHeader><CardTitle>{{ t("userSettings.afdian.callbackTitle") }}</CardTitle></CardHeader>
    <CardContent class="space-y-4" role="status">
      <Loader2 v-if="result === 'loading'" class="size-8 animate-spin text-primary" /><CheckCircle2 v-else-if="result === 'success'" class="size-8 text-primary" /><CircleAlert v-else class="size-8 text-destructive" />
      <p>{{ t(`userSettings.afdian.callback_${result}`) }}</p>
      <Button v-if="result !== 'loading'" as-child variant="outline"><RouterLink :to="{ name: 'user.settings' }">{{ t("userSettings.frames.back") }}</RouterLink></Button>
    </CardContent>
  </Card>
</template>
