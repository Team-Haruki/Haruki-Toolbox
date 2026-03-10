<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
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
    isCreateMode: boolean
    editId: string
    platform: SocialPlatform
    userId: string
    comment: string
    actionLoading: boolean
}>()

const emit = defineEmits<{
    (e: "update:open", value: boolean): void
    (e: "update:platform", value: SocialPlatform): void
    (e: "update:user-id", value: string): void
    (e: "update:comment", value: string): void
    (e: "save"): void
}>()

function handlePlatformChange(value: unknown) {
    if (!isSocialPlatform(value)) return
    emit("update:platform", value)
}

const { t } = useI18n()
const socialPlatformOptions = computed(() => getSocialPlatformOptions(t))
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ isCreateMode ? t("adminUsers.detail.dialog.authSocial.addTitle") : t("adminUsers.detail.dialog.authSocial.editTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ t("adminUsers.detail.dialog.authSocial.description", { name: userName }) }}
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-2">
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminUsers.detail.dialog.authSocial.platform") }}</Label>
          <Select :model-value="platform" @update:model-value="handlePlatformChange">
            <SelectTrigger class="w-full">
              <SelectValue :placeholder="t('adminUsers.detail.dialog.authSocial.platformPlaceholder')" />
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
          <Label>{{ t("adminUsers.detail.dialog.authSocial.userId") }}</Label>
          <Input
            :model-value="userId"
            :placeholder="t('adminUsers.detail.dialog.authSocial.userIdPlaceholder')"
            @update:model-value="emit('update:user-id', String($event ?? ''))"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <Label>{{ t("adminUsers.detail.dialog.authSocial.comment") }}</Label>
          <Input
            :model-value="comment"
            :placeholder="t('adminUsers.detail.dialog.authSocial.commentPlaceholder')"
            @update:model-value="emit('update:comment', String($event ?? ''))"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminUsers.common.cancel") }}</Button>
        <Button @click="emit('save')" :disabled="!userId.trim() || actionLoading">
          {{ t("adminUsers.common.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
