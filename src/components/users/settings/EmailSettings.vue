<script setup lang="ts">
import { ref } from "vue"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

const email = ref("")
const newEmail = ref("")
const emailCode = ref("")
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>邮箱设置</CardTitle>
      <CardDescription>管理您的 Haruki 工具箱账号的邮箱信息</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex gap-2">
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" class="flex-1">验证邮箱</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>验证邮箱</DialogTitle>
              <DialogDescription>请输入邮箱并发送验证码</DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
              <Input placeholder="输入邮箱" v-model="email" />
              <div class="flex gap-2">
                <Input placeholder="验证码" v-model="emailCode" class="flex-1" />
                <Button>发送验证码</Button>
              </div>
            </div>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">取消</Button>
              </DialogClose>
              <Button type="submit">提交</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button variant="outline" class="flex-1">更换邮箱</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认更换邮箱？</AlertDialogTitle>
              <AlertDialogDescription>更换邮箱将需要重新验证。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction as-child>
                <Dialog>
                  <DialogTrigger as-child>
                    <Button>确认</Button>
                  </DialogTrigger>
                  <DialogContent class="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>更换邮箱</DialogTitle>
                      <DialogDescription>请输入新的邮箱并进行验证</DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-4 py-4">
                      <Input placeholder="新邮箱" v-model="newEmail" />
                      <div class="flex gap-2">
                        <Input placeholder="验证码" v-model="emailCode" class="flex-1" />
                        <Button>发送验证码</Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="outline">取消</Button>
                      </DialogClose>
                      <Button type="submit">提交</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CardContent>
  </Card>
</template>