<script setup lang="ts">
import {toast} from "vue-sonner"
import {useUserStore} from "@/store"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Turnstile from "@/components/Turnstile.vue"
import {isAxiosError} from "axios"
import type {ApiErrorResponse} from "@/types/response"
import {Loader2} from "lucide-vue-next"

import {
  ref,
  computed
} from "vue"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogScrollContent
} from "@/components/ui/dialog"
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  verifyQQ,
  clearSocialPlatformBinding,
  sendQQMailVerificationCode,
  getSocialPlatformVerificationStatus,
  generateSocialPlatformVerificationCode,
} from "@/api"

const userStore = useUserStore()
const current = computed(() => userStore.socialPlatformInfo)
const sending = ref(false)
const clearing = ref(false)
const qqInputCode = ref("")
const verifying = ref(false)
const generatedCode = ref("")
const account = ref<string>("")
const showCodeDialog = ref(false)
const platform = ref<string>("qq")
const statusToken = ref<string | null>(null)
const dialogMode = ref<"qq" | "other">("other")
const turnstileToken = ref<string | null>(null)
const turnstileRef = ref<InstanceType<typeof Turnstile> | null>(null)

function onTurnstileVerify(token: string) {
  turnstileToken.value = token
}

function extractUpdatedSocial(resp: any) {
  const root = resp ?? {}
  const updated = root.updatedData ?? root.data?.updatedData ?? root.data ?? root
  const sp = updated?.socialPlatformInfo ?? updated?.social_platform_info ?? updated
  return sp && typeof sp === "object" && ("platform" in sp || "userId" in sp) ? sp : null
}

function extractGenResult(resp: any) {
  const root = resp ?? {}
  const data = root.updatedData ?? root.data ?? root
  return {
    statusToken: data.statusToken as string,
    oneTimePassword: data.oneTimePassword as string,
    message: root.message ?? data.message,
  }
}

async function handleVerify() {
  if (!userStore.userId) {
    toast.error("操作失败", {description: "用户信息缺失，请重新登录"})
    return
  }

  if (platform.value === "qq") {
    if (!account.value.trim()) {
      toast.error("发送失败", {description: "请先填写 QQ 号"})
      return
    }
    if (!turnstileToken.value) {
      toast.error("发送失败", {description: "请先完成验证码验证"})
      try {
        turnstileRef.value?.execute?.()
      } catch {
      }
      return
    }
    try {
      sending.value = true
      await sendQQMailVerificationCode(userStore.userId, account.value.trim(), turnstileToken.value)
      toast.success("验证码已发送", {description: `请前往QQ ${account.value.trim()} 的邮箱查收`})
      dialogMode.value = "qq"
      qqInputCode.value = ""
      showCodeDialog.value = true
    } catch (e: unknown) {
      let message = "发送失败"
      if (isAxiosError(e)) {
          message = (e.response?.data as ApiErrorResponse)?.message || e.message
      } else if (e instanceof Error) {
          message = e.message
      }
      toast.error("发送失败", {description: message})
    } finally {
      sending.value = false
    }
    return
  }

  if (!account.value.trim()) {
    toast.error("生成失败", {description: "请填写需要绑定的账号 ID"})
    return
  }
  try {
    sending.value = true
    const resp = await generateSocialPlatformVerificationCode(userStore.userId, platform.value as any, account.value.trim())
    const {statusToken: token, oneTimePassword} = extractGenResult(resp)
    if (!token || !oneTimePassword) {
      toast.error("生成失败", {description: "返回数据不完整"})
      return
    }
    statusToken.value = token
    generatedCode.value = oneTimePassword
    dialogMode.value = "other"
    showCodeDialog.value = true
    toast.success("验证码已生成")
  } catch (e: unknown) {
      let message = "生成失败"
      if (isAxiosError(e)) {
          message = (e.response?.data as ApiErrorResponse)?.message || e.message
      } else if (e instanceof Error) {
          message = e.message
      }
      toast.error("生成失败", {description: message})
  } finally {
    sending.value = false
  }
}

async function handleDialogVerify() {
  if (!userStore.userId) {
    toast.error("操作失败", {description: "用户信息缺失，请重新登录"})
    return
  }
  try {
    verifying.value = true
    if (dialogMode.value === "qq") {
      if (!qqInputCode.value.trim()) {
        toast.error("验证失败", {description: "请输入邮件中的验证码"})
        return
      }
      const resp = await verifyQQ(userStore.userId, account.value.trim(), qqInputCode.value.trim())
      const updated = extractUpdatedSocial(resp)
      if (updated) {
        userStore.updateUser({socialPlatformInfo: updated})
      }
      toast.success("验证成功", {description: resp?.message || "已完成绑定"})
      showCodeDialog.value = false
      try {
        turnstileRef.value?.reset?.()
      } catch {
      }
      turnstileToken.value = null
      return
    }
    if (!statusToken.value) {
      toast.error("验证失败", {description: "缺少状态令牌，请重新生成验证码"})
      return
    }
    const resp = await getSocialPlatformVerificationStatus(userStore.userId, statusToken.value)
    const respStatus = resp?.status ?? resp?.status
    const respMessage = resp?.message ?? resp?.message
    if (respStatus === 400 && String(respMessage).toLowerCase() === "you have not verified yet") {
      toast.error("未完成验证", {description: "您还没有完成验证"})
      return
    }

    const updated = extractUpdatedSocial(resp)
    if (updated) {
      userStore.updateUser({socialPlatformInfo: updated})
      toast.success("验证成功", {description: respMessage || "已完成绑定"})
      showCodeDialog.value = false
    } else {
      const desc = respMessage || "请在社交平台完成验证后再试"
      if (String(respMessage).toLowerCase().includes("not verified")) {
        toast.error("未完成验证", {description: "您还没有完成验证"})
      } else {
        toast.error("未完成验证", {description: desc})
      }
    }
  } catch (e: unknown) {
      let message = "验证失败"
      if (isAxiosError(e)) {
          message = (e.response?.data as ApiErrorResponse)?.message || e.message
      } else if (e instanceof Error) {
          message = e.message
      }
      toast.error("验证失败", {description: message})
  } finally {
    verifying.value = false
  }
}

async function handleUnbind() {
  if (!userStore.userId) {
    toast.error("操作失败", {description: "用户信息缺失，请重新登录"})
    return
  }
  try {
    clearing.value = true
    const resp = await clearSocialPlatformBinding(userStore.userId)
    userStore.updateUser({socialPlatformInfo: null})
    toast.success("已取消绑定", {description: resp?.message || "该社交平台账号已与当前账号解绑"})
  } catch (e: unknown) {
      let message = "操作失败"
      if (isAxiosError(e)) {
          message = (e.response?.data as ApiErrorResponse)?.message || e.message
      } else if (e instanceof Error) {
          message = e.message
      }
      toast.error("操作失败", {description: message})
  } finally {
    clearing.value = false
  }
}
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>社交平台账号绑定设置</CardTitle>
      <CardDescription>管理您的Haruki工具箱账号的社交平台账号绑定信息</CardDescription>
    </CardHeader>

    <CardContent class="space-y-4">
      <template v-if="current">
        <div class="space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">平台</span>
            <span>{{ current.platform }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">账号</span>
            <span>{{ current.userId }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">验证状态</span>
            <div>
          <span
              v-if="current.verified"
              class="px-2 py-1 rounded text-xs bg-green-100 text-green-700"
          >已验证</span>
              <span
                  v-else
                  class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700"
              >未验证</span>
            </div>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button :disabled="clearing" variant="destructive" class="w-full mt-4">
              <Loader2 v-if="clearing" class="mr-2 h-4 w-4 animate-spin" />
              取消绑定
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认取消绑定？</AlertDialogTitle>
              <AlertDialogDescription>
                取消绑定后，您将无法通过此社交平台账号使用HarukiBot查询您上传的数据。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>取消</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive" @click="handleUnbind">
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
                <SelectValue placeholder="选择平台"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qq">QQ</SelectItem>
                <!--
                <SelectItem value="qqbot">QQBot</SelectItem>
                <SelectItem value="discord">Discord</SelectItem>
                <SelectItem value="telegram">Telegram</SelectItem>
                -->
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">账号</label>
            <Input v-model="account" placeholder="请输入账号 ID"/>
          </div>
        </div>

        <div v-if="platform === 'qq'" class="space-y-2">
          <p class="text-xs text-muted-foreground">为防止滥用，请先通过下方验证码再发送邮件验证码。</p>
          <Turnstile ref="turnstileRef" @verify="onTurnstileVerify"/>
        </div>

        <Button class="w-full" :disabled="sending" @click="handleVerify">
          <Loader2 v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
          <span v-else>{{ platform === 'qq' ? '发送邮件验证码' : '生成验证码' }}</span>
        </Button>
      </template>

      <Dialog v-model:open="showCodeDialog">
        <DialogScrollContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>绑定社交平台验证</DialogTitle>
            <DialogDescription>
              <span v-if="dialogMode === 'qq'">请输入邮件中的验证码完成绑定。</span>
              <span v-else>请在对应平台使用下方验证码完成绑定，然后点击“验证”刷新状态。</span>
            </DialogDescription>
          </DialogHeader>

          <div class="py-4 text-center font-mono text-lg">
            <template v-if="dialogMode === 'qq'">
              <Input v-model="qqInputCode" placeholder="请输入邮件验证码"/>
            </template>
            <template v-else>
              {{ generatedCode }}
            </template>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button :disabled="verifying" @click="handleDialogVerify">
              <Loader2 v-if="verifying" class="mr-2 h-4 w-4 animate-spin" />
              <span>验证</span>
            </Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    </CardContent>
  </Card>
</template>