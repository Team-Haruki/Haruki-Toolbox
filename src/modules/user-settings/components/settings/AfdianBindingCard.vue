<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { HeartHandshake, Loader2, ArrowUpRight } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAfdianBinding } from "@/modules/user-settings/composables/useAfdianBinding"

const { t } = useI18n()
const { status, loading, busy, failed, unlinkOpen, refresh, bind, unlink } = useAfdianBinding()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle class="flex items-center gap-2"><HeartHandshake class="size-5" />{{ t("userSettings.afdian.title") }}</CardTitle>
      <CardDescription>{{ t("userSettings.afdian.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <p v-if="loading" role="status" class="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 class="size-4 animate-spin" />{{ t("userSettings.afdian.loading") }}</p>
      <div v-else-if="failed" role="alert" class="space-y-2">
        <p class="text-sm text-destructive">{{ t("userSettings.afdian.loadFailed") }}</p>
        <Button variant="outline" size="sm" @click="refresh">{{ t("userSettings.afdian.retry") }}</Button>
      </div>
      <template v-else-if="status">
        <div class="flex flex-wrap items-center gap-2">
          <Badge :variant="status.afdianUserId ? 'default' : 'secondary'">{{ t(status.afdianUserId ? 'userSettings.afdian.bound' : 'userSettings.afdian.unbound') }}</Badge>
          <Badge v-if="status.eligible" variant="outline">{{ t("userSettings.afdian.permanent") }}</Badge>
          <span v-if="status.eligible" class="text-xs text-muted-foreground">{{ t(`userSettings.afdian.${status.category}`) }}</span>
        </div>
        <p v-if="status.afdianUserId" class="break-all text-xs text-muted-foreground">{{ t("userSettings.afdian.account", { id: status.afdianUserId }) }}</p>
        <p v-if="status.afdianUserId && !status.eligible" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.noSponsorship") }}</p>
        <p v-if="!status.oauthEnabled" class="text-sm text-muted-foreground">{{ t("userSettings.afdian.unavailable") }}</p>
        <div class="flex flex-wrap gap-2">
          <Button v-if="!status.afdianUserId" :disabled="busy || !status.oauthEnabled" @click="bind"><Loader2 v-if="busy" class="mr-2 size-4 animate-spin" />{{ t("userSettings.afdian.bind") }}<ArrowUpRight class="ml-1 size-4" /></Button>
          <Button v-else variant="outline" :disabled="busy" @click="unlinkOpen = true">{{ t("userSettings.afdian.unlink") }}</Button>
          <Button v-if="status.afdianUserId" variant="ghost" :disabled="busy" @click="refresh">{{ t("userSettings.afdian.refresh") }}</Button>
          <Button as-child variant="outline"><RouterLink :to="{ name: 'user.sponsorFrames' }">{{ t("userSettings.frames.title") }}</RouterLink></Button>
        </div>
      </template>
    </CardContent>
    <Dialog v-model:open="unlinkOpen">
      <DialogContent><DialogHeader><DialogTitle>{{ t("userSettings.afdian.unlink") }}</DialogTitle><DialogDescription>{{ t("userSettings.afdian.unlinkConfirm") }}</DialogDescription></DialogHeader>
        <DialogFooter><Button variant="outline" :disabled="busy" @click="unlinkOpen = false">{{ t("userSettings.common.cancel") }}</Button><Button variant="destructive" :disabled="busy" @click="unlink">{{ t("userSettings.afdian.unlink") }}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </Card>
</template>
