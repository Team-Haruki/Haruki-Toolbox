<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
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
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminUsers.detail.dialog.social.platform") }}</Label>
          <Select :key="locale" :model-value="platform" @update:model-value="handlePlatformChange">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('adminUsers.detail.dialog.social.platformPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="[key, platformOption] in socialPlatformOptions" :key="key" :value="key">
                <div class="flex items-center gap-2">
                  <component :is="platformOption.icon" class="w-4 h-4" />
                  {{ platformOption.label }}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminUsers.detail.dialog.social.userId") }}</Label>
          <Input
            :model-value="userId"
            :placeholder="t('adminUsers.detail.dialog.social.userIdPlaceholder')"
            @update:model-value="emit('update:user-id', String($event ?? ''))"
          />
        </div>
        <div class="flex items-center gap-2">
          <Checkbox
            id="socialVerified"
            :model-value="verified"
            @update:model-value="emit('update:verified', !!$event)"
          />
          <Label for="socialVerified" class="text-sm font-normal">{{ t("adminUsers.common.verified") }}</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminUsers.common.cancel") }}</Button>
        <Button @click="emit('save')" :disabled="!platform.trim() || !userId.trim() || actionLoading">
          {{ t("adminUsers.common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
