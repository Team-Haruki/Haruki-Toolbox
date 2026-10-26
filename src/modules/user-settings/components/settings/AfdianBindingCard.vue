<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { HeartHandshake, Loader2, ArrowUpRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import { useAfdianBinding } from "@/modules/user-settings/composables/useAfdianBinding"

const { t } = useI18n()
const { status, loading, busy, failed, unlinkOpen, verificationMethod, orderNumber, orderError, emailVerified, refresh, bind, unlink, verifyOrder } = useAfdianBinding()
const isBound = computed(() => !!status.value?.afdianUserId || status.value?.accessOverride === "granted")
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2"><HeartHandshake class="size-5" />{{ t("userSettings.afdian.title") }}</CardTitle>
    </CardHeader>
    <CardContent class="space-y-4">
      <p v-if="loading" role="status" class="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 class="size-4 animate-spin" />{{ t("userSettings.afdian.loading") }}</p>
      <div v-else-if="failed" role="alert" class="space-y-2">
        <p class="text-sm text-destructive">{{ t("userSettings.afdian.loadFailed") }}</p>
        <Button variant="outline" size="sm" @click="refresh">{{ t("userSettings.afdian.retry") }}</Button>
      </div>
      <template v-else-if="status">
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="isBound ? 'default' : 'secondary'">{{ t(isBound ? 'userSettings.afdian.bound' : 'userSettings.afdian.unbound') }}</Badge>
          <Badge v-if="status.eligible" variant="outline">{{ t("userSettings.afdian.permanent") }}</Badge>
          <span v-if="status.eligible" class="text-xs text-muted-foreground">{{ t(`userSettings.afdian.${status.category}`) }}</span>
        </div>
        <p v-if="status.afdianUserId" class="break-all text-xs text-muted-foreground">{{ t("userSettings.afdian.account", { id: status.afdianUserId }) }}</p>
        <p v-if="status.afdianUserId" class="text-xs text-muted-foreground">{{ t(status.verificationMethod === 'order' ? 'userSettings.afdian.methodOrder' : 'userSettings.afdian.methodOAuth') }}</p>
        <p v-if="status.accessOverride === 'granted'" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.manualGranted") }}</p>
        <p v-if="status.accessOverride === 'blocked'" role="status" class="text-sm text-destructive">{{ t("userSettings.afdian.accessBlocked") }}</p>
        <p v-else-if="status.afdianUserId && !status.eligible" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.noSponsorship") }}</p>
        <Tabs v-if="!status.afdianUserId && !status.accessOverride" v-model="verificationMethod" class="space-y-3">
          <TabsList v-if="status.oauthEnabled && status.orderVerificationEnabled" class="grid w-full grid-cols-2">
            <TabsTrigger value="oauth2" :disabled="busy">{{ t("userSettings.afdian.oauthTab") }}</TabsTrigger>
            <TabsTrigger value="order" :disabled="busy">{{ t("userSettings.afdian.order.tab") }}</TabsTrigger>
          </TabsList>
          <TabsContent v-if="status.oauthEnabled" value="oauth2" class="space-y-3">
            <p class="text-sm text-muted-foreground">{{ t("userSettings.afdian.oauthDescription") }}</p>
            <Button :disabled="busy || !status.oauthEnabled" @click="bind"><Loader2 v-if="busy" class="mr-2 size-4 animate-spin" />{{ t("userSettings.afdian.bind") }}<ArrowUpRight class="ml-1 size-4" /></Button>
          </TabsContent>
          <TabsContent value="order" class="space-y-3">
            <p class="text-sm text-muted-foreground">{{ t("userSettings.afdian.order.description") }}</p>
            <p v-if="!status.orderVerificationEnabled" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.order.unavailable") }}</p>
            <form class="space-y-3" @submit.prevent="verifyOrder">
              <div class="space-y-2">
                <Label for="afdian-order-number">{{ t("userSettings.afdian.order.label") }}</Label>
                <Input id="afdian-order-number" v-model="orderNumber" inputmode="numeric" autocomplete="off" :maxlength="128" :disabled="busy || !status.orderVerificationEnabled" :aria-invalid="!!orderError" aria-describedby="afdian-order-help afdian-order-error" :placeholder="t('userSettings.afdian.order.placeholder')" />
                <p id="afdian-order-help" class="text-xs leading-relaxed text-muted-foreground">{{ t("userSettings.afdian.order.help") }}</p>
                <p v-if="!emailVerified" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.order.verifyEmail") }}</p>
                <p v-if="orderError" id="afdian-order-error" role="alert" class="text-sm text-destructive">{{ orderError }}</p>
              </div>
              <Button type="submit" :disabled="busy || !status.orderVerificationEnabled || !emailVerified || !orderNumber.trim()"><Loader2 v-if="busy" class="mr-2 size-4 animate-spin" />{{ t("userSettings.afdian.order.submit") }}</Button>
            </form>
          </TabsContent>
        </Tabs>
        <div class="flex flex-wrap gap-2">
          <Button v-if="status.afdianUserId" variant="outline" :disabled="busy" @click="unlinkOpen = true">{{ t("userSettings.afdian.unlink") }}</Button>
          <Button v-if="status.verificationMethod === 'order' && status.oauthEnabled" variant="outline" :disabled="busy" @click="bind">{{ t("userSettings.afdian.upgradeOAuth") }}</Button>
          <Button v-if="status.afdianUserId" variant="ghost" :disabled="busy" @click="refresh">{{ t("userSettings.afdian.refresh") }}</Button>
          <Button v-if="status.eligible" as-child variant="outline"><RouterLink :to="{ name: 'user.sponsorFrames' }">{{ t("userSettings.frames.title") }}</RouterLink></Button>
        </div>
      </template>
    </CardContent>
    <ConfirmDialog v-model:open="unlinkOpen" :title="t('userSettings.afdian.unlink')" :description="t(status?.accessOverride === 'granted' ? 'userSettings.afdian.unlinkManualConfirm' : 'userSettings.afdian.unlinkConfirm')" :confirm-label="t('userSettings.afdian.unlink')" :on-confirm="unlink" :describe-error="() => t('userSettings.afdian.actionFailed')" destructive />
  </Card>
</template>
