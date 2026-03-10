<script setup lang="ts">
import { useI18n } from "vue-i18n"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import { useAccountSettings } from "@/modules/user-settings/composables/useAccountSettings"
import {Loader2, UserCog, User, Upload, Save} from "lucide-vue-next"


import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
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
  saveChanges,
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
        <Button variant="outline" @click="triggerFileInput">
          <Upload class="h-4 w-4 mr-2" />
          {{ t("userSettings.account.changeAvatar") }}
        </Button>
      </div>
      <div class="grid gap-2">
        <Label for="nickname">{{ t("userSettings.account.nicknameLabel") }}</Label>
        <div class="relative w-full items-center">
          <Input id="nickname" v-model="userStore.name" class="pl-10"/>
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
            <User class="size-4 text-muted-foreground" />
          </span>
        </div>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full bg-primary" :disabled="isSaving" @click="saveChanges">
        <Loader2 v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
        <Save v-else class="mr-2 h-4 w-4" />
        {{ t("userSettings.account.save") }}
      </Button>
    </CardFooter>
  </Card>
</template>
