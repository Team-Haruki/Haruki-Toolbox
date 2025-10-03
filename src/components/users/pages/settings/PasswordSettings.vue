<script setup lang="ts">
import {ref} from "vue"
import {toast} from "vue-sonner";
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {useUserStore} from "@/components/users/data/store";
import {changePassword} from "@/components/users/data/api"

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"

const router = useRouter()
const userStore = useUserStore()
const newPassword = ref("")

const handleChangePassword = async () => {
  try {
    await changePassword(newPassword.value)
    toast.success("密码修改成功", {description: "请重新登录"})
    userStore.clearUser()
    await router.push("/user/login")
  } catch (error: any) {
    toast.error("密码修改失败", {description: error?.message || "请稍后重试"})
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
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>更换密码</DialogTitle>
            <DialogDescription>请输入新的密码</DialogDescription>
          </DialogHeader>
          <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="password" class="text-right">新密码</Label>
              <Input id="password" type="password" v-model="newPassword" class="col-span-3"/>
            </div>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button type="button">提交</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认提交？</AlertDialogTitle>
                  <AlertDialogDescription>你确定要更新密码吗？</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction @click="handleChangePassword">确认</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>