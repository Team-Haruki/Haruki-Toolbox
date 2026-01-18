<script setup lang="ts">
import {ref} from "vue"
import {toast} from "vue-sonner"
import {useRouter} from "vue-router"
import {useUserStore} from "@/store"
import {changePassword} from "@/api"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {isAxiosError} from "axios"
import type {ApiErrorResponse} from "@/types/response"
import {Loader2} from "lucide-vue-next"


import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogScrollContent
} from "@/components/ui/dialog"

const router = useRouter()
const userStore = useUserStore()
const oldPassword = ref("")
const newPassword = ref("")
const confirmPassword = ref("")
const isSubmitting = ref(false)

const handleChangePassword = async () => {
  if (!userStore.userId) {
    toast.error("操作失败", {description: "用户信息缺失，请重新登录"})
    return
  }
  
  if (!oldPassword.value) {
    toast.error("验证失败", {description: "请输入当前密码"})
    return
  }
  
  if (!newPassword.value) {
    toast.error("验证失败", {description: "请输入新密码"})
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    toast.error("验证失败", {description: "两次输入的新密码不一致"})
    return
  }
  
  if (newPassword.value.length < 8) {
    toast.error("验证失败", {description: "新密码长度至少为8位"})
    return
  }
  
  isSubmitting.value = true
  
  try {
    await changePassword(userStore.userId, oldPassword.value, newPassword.value, { skipErrorToast: true })
    toast.success("密码修改成功", {description: "请重新登录"})
    userStore.clearUser()
    await router.push("/user/login")
  } catch (error: unknown) {
    let message = "密码修改失败"
    if (isAxiosError(error)) {
        message = (error.response?.data as ApiErrorResponse)?.message || error.message
    } else if (error instanceof Error) {
        message = error.message
    }
    toast.error("密码修改失败", {description: message})
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>密码设置</CardTitle>
      <CardDescription>管理您的Haruki工具箱账号的密码</CardDescription>
    </CardHeader>
    <CardContent>
      <Dialog>
        <DialogTrigger as-child>
          <Button class="w-full">更换密码</Button>
        </DialogTrigger>
        <DialogScrollContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>更换密码</DialogTitle>
            <DialogDescription>请输入当前密码和新密码</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="old-password" class="text-right">当前密码</Label>
              <Input id="old-password" type="password" v-model="oldPassword" class="col-span-3" placeholder="请输入当前密码"/>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="new-password" class="text-right">新密码</Label>
              <Input id="new-password" type="password" v-model="newPassword" class="col-span-3" placeholder="请输入新密码"/>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="confirm-password" class="text-right">确认密码</Label>
              <Input id="confirm-password" type="password" v-model="confirmPassword" class="col-span-3" placeholder="请再次输入新密码"/>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" :disabled="isSubmitting" @click="handleChangePassword">
              <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
              提交
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </CardContent>
  </Card>
</template>