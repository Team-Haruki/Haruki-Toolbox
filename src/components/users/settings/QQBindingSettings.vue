<script setup lang="ts">
import { ref } from "vue"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const qq = ref("")
const qqCode = ref("")
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>QQ绑定设置</CardTitle>
      <CardDescription>管理您的Haruki工具箱账号的QQ绑定信息</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex gap-2">
        <Dialog>
          <DialogTrigger as-child>
            <Button variant="outline" class="flex-1">验证QQ</Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>验证QQ</DialogTitle>
              <DialogDescription>请输入QQ并发送验证码</DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-4">
              <Input placeholder="QQ号" v-model="qq"/>
              <div class="flex gap-2">
                <Input placeholder="验证码" v-model="qqCode" class="flex-1"/>
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
            <Button variant="outline" class="flex-1">更换QQ</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认更换QQ？</AlertDialogTitle>
              <AlertDialogDescription>更换QQ将需要重新验证。</AlertDialogDescription>
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
                      <DialogTitle>更换QQ</DialogTitle>
                      <DialogDescription>请输入新的QQ并进行验证</DialogDescription>
                    </DialogHeader>
                    <div class="grid gap-4 py-4">
                      <Input placeholder="新QQ号" v-model="qq"/>
                      <div class="flex gap-2">
                        <Input placeholder="验证码" v-model="qqCode" class="flex-1"/>
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