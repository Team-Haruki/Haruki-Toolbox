<script setup lang="ts">
import {ref} from "vue"
import {toast} from "vue-sonner"
import {resetPassword} from "@/api"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Loader2} from "lucide-vue-next"
import { extractErrorMessage } from "@/lib/error-utils"


import {
  useRoute,
  useRouter
} from "vue-router"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"

const route = useRoute()
const router = useRouter()
const newPassword = ref("")
const confirmPassword = ref("")
const verifyHash = route.params.verifyHash as string
const email = ref((route.query.email as string) || "")
const isSubmitting = ref(false)


async function handleSubmit() {
  if (!newPassword.value || !confirmPassword.value) {
    toast.error("请输入完整信息")
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error("两次密码输入不一致")
    return
  }
  isSubmitting.value = true
  try {
    await resetPassword(email.value, verifyHash, newPassword.value)
    toast.success("密码重置成功", {
      description: "请重新登录"
    })
    await router.push("/user/login")
  } catch (err: unknown) {
    toast.error("重置失败", {description: extractErrorMessage(err, "重置失败")})
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>重置密码</CardTitle>
        <CardDescription>重置您的Haruki工具箱账号的密码</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <Label for="email">邮箱</Label>
            <Input id="email" type="email" v-model="email" readonly disabled/>
          </div>

          <div>
            <Label for="new-password">新密码</Label>
            <Input
                id="new-password"
                type="password"
                v-model="newPassword"
                placeholder="请输入新密码"
            />
          </div>

          <div>
            <Label for="confirm-password">确认密码</Label>
            <Input
                id="confirm-password"
                type="password"
                v-model="confirmPassword"
                placeholder="请再次输入新密码"
            />
          </div>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            确认重置
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>