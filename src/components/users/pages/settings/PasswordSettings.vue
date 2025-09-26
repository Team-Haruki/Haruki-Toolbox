<script setup lang="ts">
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const newPassword = ref("")
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
                  <AlertDialogAction>确认</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>