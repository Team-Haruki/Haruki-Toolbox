<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogBody,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { SocialPlatform } from "@/types/social-platform"
import {
  getSocialPlatformOptions,
  isSocialPlatform,
} from "@/modules/admin-users/constants"

defineProps<{
    open: boolean
    userName?: string
    hasSocial: boolean
    platform: SocialPlatform
    userId: string
    verified: boolean
    actionLoading: boolean
}>()

const emit = defineEmits<{
    (e: "update:open", value: boolean): void
    (e: "update:platform", value: SocialPlatform): void
    (e: "update:user-id", value: string): void
    (e: "update:verified", value: boolean): void
    (e: "save"): void
}>()

function handlePlatformChange(value: unknown) {
    if (!isSocialPlatform(value)) return
    emit("update:platform", value)
}

const { t, locale } = useI18n()
const socialPlatformOptions = computed(() => getSocialPlatformOptions(t))
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ hasSocial ? t("adminUsers.detail.dialog.social.editTitle") : t("adminUsers.detail.dialog.social.addTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ t("adminUsers.detail.dialog.social.description", { name: userName }) }}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <div class="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <div class="grid content-start gap-1.5">
            <Label id="user-social-platform-label" for="user-social-platform">{{ t("adminUsers.detail.dialog.social.platform") }}</Label>
            <Select id="user-social-platform" :key="locale" :model-value="platform" @update:model-value="handlePlatformChange">
              <SelectTrigger aria-labelledby="user-social-platform-label" class="w-full">
                <SelectValue :placeholder="t('adminUsers.detail.dialog.social.platformPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="[key, platformOption] in socialPlatformOptions" :key="key" :value="key">
                  <div class="flex items-center gap-2">
                    <component :is="platformOption.icon" class="size-4" aria-hidden="true" />
                    {{ platformOption.label }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid content-start gap-1.5">
            <Label for="user-social-user-id">{{ t("adminUsers.detail.dialog.social.userId") }}</Label>
            <Input
              id="user-social-user-id"
              :model-value="userId"
              class="font-mono"
              :placeholder="t('adminUsers.detail.dialog.social.userIdPlaceholder')"
              @update:model-value="emit('update:user-id', String($event ?? ''))"
            />
          </div>
        </div>
        <div class="flex items-center justify-between gap-4 border-t border-border/60 pt-4">
          <Label for="socialVerified" class="min-w-0 flex-1">{{ t("adminUsers.common.verified") }}</Label>
          <Switch
            id="socialVerified"
            class="shrink-0"
            :model-value="verified"
            @update:model-value="emit('update:verified', !!$event)"
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminUsers.common.cancel") }}</Button>
        <Button :disabled="!platform.trim() || !userId.trim() || actionLoading" @click="emit('save')">
          {{ t("adminUsers.common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
