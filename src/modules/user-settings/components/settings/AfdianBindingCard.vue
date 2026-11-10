<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { HeartHandshake, Loader2, ArrowUpRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { useAfdianBinding } from "@/modules/user-settings/composables/useAfdianBinding"

const { t } = useI18n()
const { status, loading, busy, failed, unlinkOpen, verificationMethod, orderNumber, orderError, emailVerified, refresh, bind, unlink, verifyOrder } = useAfdianBinding()
const isBound = computed(() => !!status.value?.afdianUserId || status.value?.accessOverride === "granted")
/** Nothing linked and no admin decision: the verification form is shown. */
const canVerify = computed(() => status.value != null && !status.value.afdianUserId && !status.value.accessOverride)
const hasActions = computed(() => status.value != null && (
  !!status.value.afdianUserId
  || (status.value.verificationMethod === "order" && status.value.oauthEnabled)
  || status.value.eligible
))
</script>

<template>
  <SettingsGroup :title="t('userSettings.afdian.title')" surface="card" data-testid="account-afdian">
    <p v-if="loading" role="status" class="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />{{ t("userSettings.afdian.loading") }}
    </p>
    <div v-else-if="failed" role="alert" class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <p class="text-sm text-destructive">{{ t("userSettings.afdian.loadFailed") }}</p>
      <Button variant="outline" size="sm" @click="refresh">{{ t("userSettings.afdian.retry") }}</Button>
    </div>
    <template v-else-if="status">
      <!-- Where the binding stands, and what it is for. -->
      <SettingsRow
        :icon="HeartHandshake"
        :tone="isBound ? 'success' : 'default'"
        :label="t(isBound ? 'userSettings.afdian.bound' : 'userSettings.afdian.unbound')"
        :help="t('userSettings.afdian.description')"
      >
        <template #label>
          <Badge v-if="status.eligible" variant="outline">{{ t("userSettings.afdian.permanent") }}</Badge>
          <span v-if="status.eligible" class="text-xs text-muted-foreground">{{ t(`userSettings.afdian.${status.category}`) }}</span>
        </template>
        <template #note>
          <div class="mt-1.5 flex flex-col gap-1 empty:hidden">
            <p v-if="status.afdianUserId" class="break-all text-xs text-muted-foreground">{{ t("userSettings.afdian.account", { id: status.afdianUserId }) }}</p>
            <p v-if="status.afdianUserId" class="text-xs text-muted-foreground">{{ t(status.verificationMethod === 'order' ? 'userSettings.afdian.methodOrder' : 'userSettings.afdian.methodOAuth') }}</p>
            <p v-if="status.accessOverride === 'granted'" class="text-xs text-muted-foreground">{{ t("userSettings.afdian.manualGranted") }}</p>
            <p v-if="status.accessOverride === 'blocked'" role="status" class="text-xs text-destructive">{{ t("userSettings.afdian.accessBlocked") }}</p>
            <p v-else-if="status.afdianUserId && !status.eligible" class="text-xs text-muted-foreground">{{ t("userSettings.afdian.noSponsorship") }}</p>
          </div>
        </template>
      </SettingsRow>

      <div v-if="canVerify" class="px-4 py-3">
        <Tabs v-model="verificationMethod" class="space-y-3">
          <TabsList v-if="status.oauthEnabled && status.orderVerificationEnabled" class="grid w-full grid-cols-2">
            <TabsTrigger value="oauth2" :disabled="busy">{{ t("userSettings.afdian.oauthTab") }}</TabsTrigger>
            <TabsTrigger value="order" :disabled="busy">{{ t("userSettings.afdian.order.tab") }}</TabsTrigger>
          </TabsList>
          <TabsContent v-if="status.oauthEnabled" value="oauth2" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p class="min-w-0 flex-1 basis-56 text-sm text-muted-foreground">{{ t("userSettings.afdian.oauthDescription") }}</p>
            <Button class="shrink-0" :disabled="busy || !status.oauthEnabled" @click="bind">
              <Loader2 v-if="busy" class="size-4 animate-spin" />{{ t("userSettings.afdian.bind") }}<ArrowUpRight class="size-4" />
            </Button>
          </TabsContent>
          <TabsContent value="order" class="space-y-2">
            <p class="text-sm text-muted-foreground">{{ t("userSettings.afdian.order.description") }}</p>
            <p v-if="!status.orderVerificationEnabled" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.order.unavailable") }}</p>
            <form class="space-y-2" @submit.prevent="verifyOrder">
              <Label for="afdian-order-number">{{ t("userSettings.afdian.order.label") }}</Label>
              <!-- The number and its button on one line; stacked on a phone. -->
              <div class="flex flex-col gap-2 sm:flex-row">
                <Input id="afdian-order-number" v-model="orderNumber" class="sm:flex-1" inputmode="numeric" autocomplete="off" :maxlength="128" :disabled="busy || !status.orderVerificationEnabled" :aria-invalid="!!orderError" aria-describedby="afdian-order-help afdian-order-error" :placeholder="t('userSettings.afdian.order.placeholder')" />
                <Button type="submit" class="shrink-0" :disabled="busy || !status.orderVerificationEnabled || !emailVerified || !orderNumber.trim()">
                  <Loader2 v-if="busy" class="size-4 animate-spin" />{{ t("userSettings.afdian.order.submit") }}
                </Button>
              </div>
              <p id="afdian-order-help" class="text-xs leading-relaxed text-muted-foreground">{{ t("userSettings.afdian.order.help") }}</p>
              <p v-if="!emailVerified" class="text-xs text-amber-700 dark:text-amber-300">{{ t("userSettings.afdian.order.verifyEmail") }}</p>
              <p v-if="orderError" id="afdian-order-error" role="alert" class="text-sm text-destructive">{{ orderError }}</p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </template>

    <template v-if="!loading && !failed && status && hasActions" #footer>
      <Button v-if="status.afdianUserId" variant="ghost" size="sm" :disabled="busy" @click="refresh">{{ t("userSettings.afdian.refresh") }}</Button>
      <Button v-if="status.afdianUserId" variant="outline" size="sm" :disabled="busy" @click="unlinkOpen = true">{{ t("userSettings.afdian.unlink") }}</Button>
      <Button v-if="status.verificationMethod === 'order' && status.oauthEnabled" variant="outline" size="sm" :disabled="busy" @click="bind">{{ t("userSettings.afdian.upgradeOAuth") }}</Button>
      <Button v-if="status.eligible" as-child size="sm"><RouterLink :to="{ name: 'user.sponsorFrames' }">{{ t("userSettings.frames.title") }}</RouterLink></Button>
    </template>
  </SettingsGroup>
  <ConfirmDialog v-model:open="unlinkOpen" :title="t('userSettings.afdian.unlink')" :description="t(status?.accessOverride === 'granted' ? 'userSettings.afdian.unlinkManualConfirm' : 'userSettings.afdian.unlinkConfirm')" :confirm-label="t('userSettings.afdian.unlink')" :on-confirm="unlink" :describe-error="() => t('userSettings.afdian.actionFailed')" destructive />
</template>
