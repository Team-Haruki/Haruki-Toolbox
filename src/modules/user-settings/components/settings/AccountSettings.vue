<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {Button} from "@/components/ui/button"
import { useAccountSettings } from "@/modules/user-settings/composables/useAccountSettings"
import {Loader2, UserCog, Upload} from "lucide-vue-next"


import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar"

const {
  userStore,
  previewAvatar,
  fileInputRef,
  isSaving,
  triggerFileInput,
  onAvatarChange,
} = useAccountSettings()
const { t } = useI18n()
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <UserCog class="h-6 w-6" />
        {{ t("userSettings.account.title") }}
      </CardTitle>
      <CardDescription>{{ t("userSettings.account.description") }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center gap-4">
        <Avatar class="h-16 w-16">
          <AvatarImage :src="previewAvatar || `${userStore.avatarPath}`"/>
          <AvatarFallback>{{ userStore.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <input type="file" accept="image/*" ref="fileInputRef" class="hidden" @change="onAvatarChange"/>
        <Button variant="outline" :disabled="isSaving" @click="triggerFileInput">
          <Loader2 v-if="isSaving" class="h-4 w-4 mr-2 animate-spin" />
          <Upload v-else class="h-4 w-4 mr-2" />
          {{ isSaving ? t("userSettings.account.uploading") : t("userSettings.account.changeAvatar") }}
        </Button>
      </div>
      <div class="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        {{ t("userSettings.account.autoUploadHint") }}
      </div>
    </CardContent>
  </Card>
</template>
