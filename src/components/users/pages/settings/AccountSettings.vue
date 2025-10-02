<script setup lang="ts">
import {ref} from "vue"
import {toast} from "vue-sonner"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {useUserStore} from "@/components/users/data/store";
import {updateUserProfile} from "@/components/users/data/api"

import {
  Card,
  CardTitle,
  CardHeader,
  CardFooter,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar"

const userStore = useUserStore();
const selectedFile = ref<File | null>(null)
const previewAvatar = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onAvatarChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = () => {
      previewAvatar.value = reader.result as string
    }
    reader.readAsDataURL(file)
  }
}

async function saveChanges() {
  try {
    let avatarPath = userStore.avatarPath
    if (selectedFile.value) {
      const result = await updateUserProfile(userStore.name, selectedFile.value)
      if (result && result.updatedData.avatarPath) {
        avatarPath = result.updatedData.avatarPath
        previewAvatar.value = null
        userStore.avatarPath = avatarPath
      }
      userStore.updateUser && userStore.updateUser({
        name: userStore.name,
        avatarPath: avatarPath,
      })
      toast.success("资料已保存", {
        description: "用户资料更新成功",
      })
    } else {
      await updateUserProfile(userStore.name, null)
      userStore.updateUser && userStore.updateUser({
        name: userStore.name,
        avatarPath: avatarPath,
      })
      toast.success("资料已保存", {
        description: "用户资料更新成功",
      })
    }
  } catch (e) {
    toast.error("保存失败", {
      description: String(e) || "请重试",
    })
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>账号设置</CardTitle>
      <CardDescription>管理您的Haruki工具箱个人信息</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center gap-4">
        <Avatar class="h-16 w-16">
          <AvatarImage :src="previewAvatar || `${userStore.avatarPath}`"/>
          <AvatarFallback>{{ userStore.name.charAt(0) }}</AvatarFallback>
        </Avatar>
        <input type="file" accept="image/*" ref="fileInputRef" class="hidden" @change="onAvatarChange"/>
        <Button variant="outline" @click="triggerFileInput">更换头像</Button>
      </div>
      <div class="grid gap-2">
        <Label for="nickname">昵称</Label>
        <Input id="nickname" v-model="userStore.name"/>
      </div>
    </CardContent>
    <CardFooter>
      <Button class="w-full bg-primary" @click="saveChanges">保存修改</Button>
    </CardFooter>
  </Card>
</template>