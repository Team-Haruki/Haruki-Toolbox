<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { HeartHandshake, Check, Image, Loader2, Lock } from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import PageHeader from "@/shared/components/PageHeader.vue"
import SekaiAssetImage from "@/shared/components/SekaiAssetImage.vue"
import ImageLightbox from "@/shared/components/ImageLightbox.vue"
import { useSponsorFrames } from "@/modules/user-settings/composables/useSponsorFrames"

const { t } = useI18n()
const lightboxOpen = ref(false)
const { data, loading, failed, saving, accountKey, accounts, account, selectedId, selected, search, preview, previewURL, eligible, lockReason, dirty, canSave, frameName, frames, load, save } = useSponsorFrames()

// Why the page is preview-only, in the person's own situation: blocked by an
// administrator, or not verified yet (with the order number as the only way
// in when Afdian sign-in is not configured).
const lockDescription = computed(() => {
  switch (lockReason.value) {
    case "blocked":
      return t("userSettings.afdian.accessBlocked")
    case "orderOnly":
      return t("userSettings.frames.lockedOrderOnly")
    case "unverified":
      return t("userSettings.frames.locked")
    default:
      return ""
  }
})

const selectedName = computed(() => (selected.value ? frameName(selected.value) : t("userSettings.frames.default")))
const saveStatusKey = computed(() => (
  !account.value?.verified || !eligible.value
    ? "userSettings.frames.previewOnly"
    : dirty.value ? "userSettings.frames.unsaved" : "userSettings.frames.applied"
))

function accountLabel(entry: { server: string; gameUserId: string; verified: boolean }): string {
  const region = resolveSekaiRegionLabel(entry.server, t)
  return entry.verified ? `${region} · ${entry.gameUserId}` : `${region} · ${entry.gameUserId} · ${t("userSettings.frames.unverified")}`
}
</script>

<template>
  <div class="mx-auto w-full max-w-6xl space-y-6 py-4">
    <PageHeader
      :title="t('userSettings.frames.title')"
      :description="t('userSettings.frames.description')"
      :back="{ name: 'user.settings' }"
      :back-label="t('userSettings.frames.back')"
    >
      <template v-if="eligible" #badge>
        <Badge><HeartHandshake class="mr-1 size-3" />{{ t("userSettings.afdian.permanent") }}</Badge>
      </template>
    </PageHeader>
    <p v-if="loading" role="status" class="flex items-center gap-2 py-12"><Loader2 class="size-5 animate-spin" />{{ t("userSettings.afdian.loading") }}</p>
    <Card v-else-if="failed"><CardContent class="space-y-3 pt-6"><p role="alert">{{ t("userSettings.frames.loadFailed") }}</p><Button variant="outline" @click="load">{{ t("userSettings.afdian.retry") }}</Button></CardContent></Card>
    <template v-else-if="data">
      <!-- Not eligible: the page stays browsable (every frame and example), saving is off, and this says why. -->
      <Alert v-if="lockReason" role="status" data-testid="frames-locked" class="flex items-start gap-3">
        <Lock class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <div class="min-w-0 flex-1 space-y-2">
          <AlertTitle>{{ t("userSettings.frames.lockedTitle") }}</AlertTitle>
          <AlertDescription>{{ lockDescription }}</AlertDescription>
          <Button as-child variant="outline" size="sm"><RouterLink :to="{ name: 'user.settings' }">{{ t("userSettings.frames.back") }}</RouterLink></Button>
        </div>
      </Alert>
      <!-- Phones: account, preview, then the grid, with a sticky save bar at the bottom.
           Desktop: account + grid on the left, the preview pinned on the right. -->
      <div class="grid items-start gap-6 lg:grid-cols-[1fr_1.15fr]">
        <Card class="lg:col-start-1 lg:row-start-1">
          <CardHeader><CardTitle class="text-base">{{ t("userSettings.frames.accountTitle") }}</CardTitle><CardDescription>{{ t("userSettings.frames.accountDescription") }}</CardDescription></CardHeader>
          <CardContent class="space-y-3">
            <template v-if="accounts.length">
              <Label for="frame-account">{{ t("userSettings.frames.account") }}</Label>
              <select id="frame-account" v-model="accountKey" :disabled="saving" class="h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option v-for="a in accounts" :key="`${a.server}:${a.gameUserId}`" :value="`${a.server}:${a.gameUserId}`">{{ accountLabel(a) }}</option>
              </select>
              <p v-if="account && !account.verified" class="text-sm text-muted-foreground">{{ t("userSettings.frames.verifyFirst") }}</p>
            </template>
            <p v-else class="text-sm text-muted-foreground">{{ t("userSettings.frames.noAccounts") }}</p>
            <Button v-if="!account?.verified" as-child variant="outline" size="sm"><RouterLink :to="{ name: 'user.gameAccountBindings' }">{{ t("userSettings.frames.manageAccounts") }}</RouterLink></Button>
          </CardContent>
        </Card>
        <Card class="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-6 lg:self-start">
          <CardHeader class="space-y-3"><div class="flex flex-wrap items-center gap-2"><CardTitle class="text-base">{{ t("userSettings.frames.previewTitle") }}</CardTitle><Badge variant="outline">{{ t("userSettings.frames.example") }}</Badge></div><CardDescription>{{ t("userSettings.frames.previewDescription") }}</CardDescription></CardHeader>
          <CardContent class="space-y-4">
            <div class="flex gap-2" role="group" :aria-label="t('userSettings.frames.previewTitle')"><Button size="sm" :variant="preview === 'panel' ? 'default' : 'outline'" :aria-pressed="preview === 'panel'" @click="preview = 'panel'">{{ t("userSettings.frames.panel") }}</Button><Button size="sm" :variant="preview === 'profile' ? 'default' : 'outline'" :aria-pressed="preview === 'profile'" @click="preview = 'profile'">{{ t("userSettings.frames.profile") }}</Button></div>
            <button type="button" class="relative block w-full overflow-hidden rounded-xl border bg-muted focus-visible:outline-2 focus-visible:outline-primary" :class="preview === 'panel' ? 'aspect-[3/1]' : 'aspect-[4/5]'" :aria-label="t('userSettings.frames.enlarge')" @click="lightboxOpen = true"><SekaiAssetImage :sources="[previewURL]" :alt="t('userSettings.frames.previewAlt', { name: selectedName })" fit="contain" eager /></button>
            <p class="text-sm font-medium">{{ selectedName }}</p>
            <p class="text-xs leading-relaxed text-muted-foreground">{{ t("userSettings.frames.sampleNotice") }}</p>
            <div class="hidden flex-wrap items-center gap-3 border-t pt-4 lg:flex">
              <Button :disabled="!canSave" data-testid="save-frame" @click="save"><Loader2 v-if="saving" class="mr-2 size-4 animate-spin" />{{ t("userSettings.frames.save") }}</Button>
              <span class="text-xs text-muted-foreground" role="status">{{ t(saveStatusKey) }}</span>
            </div>
          </CardContent>
        </Card>
        <Card class="lg:col-start-1 lg:row-start-2">
          <CardHeader><CardTitle class="text-base">{{ t("userSettings.frames.choose") }}</CardTitle></CardHeader>
          <CardContent class="space-y-4">
            <Input v-model="search" :placeholder="t('userSettings.frames.search')" :aria-label="t('userSettings.frames.search')" />
            <div class="grid max-h-[28rem] grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3 lg:grid-cols-2" role="group" :aria-label="t('userSettings.frames.choose')">
              <button type="button" :disabled="saving" :aria-pressed="selectedId === ''" class="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 p-2 text-xs transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary" :class="selectedId === '' ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'" @click="selectedId = ''"><Image class="size-9 text-muted-foreground" />{{ t("userSettings.frames.default") }}</button>
              <button v-for="frame in frames" :key="frame.id" type="button" :disabled="saving" :aria-pressed="selectedId === frame.id" :aria-label="frameName(frame)" :data-frame-id="frame.id" class="relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 p-2 text-xs transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary" :class="selectedId === frame.id ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'" @click="selectedId = frame.id">
                <div class="relative aspect-[3/1] w-full"><SekaiAssetImage :sources="[frame.thumbnail]" :alt="frameName(frame)" fit="contain" /></div>
                <span class="text-center leading-snug">{{ frameName(frame) }}</span><Check v-if="selectedId === frame.id" class="absolute right-1 top-1 size-4 text-primary" aria-hidden="true" />
              </button>
            </div>
            <p v-if="!frames.length" class="text-sm text-muted-foreground">{{ t("userSettings.frames.noResults") }}</p>
          </CardContent>
        </Card>
      </div>
      <!-- Phones: the selection and Save stay in reach while the grid scrolls. -->
      <div class="sticky bottom-0 -mx-4 flex items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ selectedName }}</p>
          <p class="text-xs text-muted-foreground" role="status">{{ t(saveStatusKey) }}</p>
        </div>
        <Button :disabled="!canSave" data-testid="save-frame-mobile" @click="save"><Loader2 v-if="saving" class="mr-2 size-4 animate-spin" />{{ t("userSettings.frames.save") }}</Button>
      </div>
    </template>
    <ImageLightbox v-if="data" v-model:open="lightboxOpen" :title="t('userSettings.frames.previewTitle')" :description="t('userSettings.frames.sampleNotice')" :items="[{ label: t(preview === 'panel' ? 'userSettings.frames.panel' : 'userSettings.frames.profile'), sources: [previewURL] }]" />
  </div>
</template>
