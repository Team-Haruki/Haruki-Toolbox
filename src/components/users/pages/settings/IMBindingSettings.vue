<script setup lang="ts">
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "vue-sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"

const platform = ref("qq")
const account = ref("11")
const code = ref("verified")
const generatedCode = ref("")
const showCodeDialog = ref(false)

function handleVerify() {
  if (platform.value === "qq") {
    toast.success(`验证码已发送到 ${account.value}@qq.com 的邮箱，请查收！`)
  } else {
    generatedCode.value = Math.random().toString(36).substring(2, 8).toUpperCase()
    showCodeDialog.value = true
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>账号绑定设置</CardTitle>
      <CardDescription>管理您的 Haruki 工具箱账号的社交平台账号绑定信息</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <template v-if="account && platform && code === 'verified'">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">平台</span>
            <span>{{ platform }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">账号</span>
            <span>{{ account }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">验证状态</span>
            <span class="text-green-600 font-semibold">已验证</span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="destructive" class="w-full mt-4">取消绑定</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认取消绑定？</AlertDialogTitle>
              <AlertDialogDescription>
                取消绑定后，您将无法通过此平台登录或同步数据。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-foreground" @click="() => { account = ''; code = '' }">
                确认
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </template>
      <template v-else>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">选择平台</label>
            <Select v-model="platform">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择平台" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qq">QQ</SelectItem>
                <SelectItem value="qqbot">QQBot</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">账号</label>
            <Input v-model="account" placeholder="请输入账号" />
          </div>
        </div>
        <Button class="w-full" @click="handleVerify">验证账号</Button>
      </template>
      <Dialog v-model:open="showCodeDialog">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>绑定社交平台验证码</DialogTitle>
            <DialogDescription>
              请在需要绑定的社交平台输入以下验证码完成绑定：
            </DialogDescription>
          </DialogHeader>
          <div class="py-4 text-center font-mono text-lg">
            {{ generatedCode }}
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button type="submit">验证</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>