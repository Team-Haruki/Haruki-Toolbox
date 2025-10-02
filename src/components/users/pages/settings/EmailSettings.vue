<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import Turnstile from "@/components/Turnstile.vue"
import { useUserStore } from "@/components/users/data/store"
import { toast } from "vue-sonner"
import { sendEmailVerificationCode, verifyEmail } from "@/components/users/data/api"

const router = useRouter()
const userStore = useUserStore()

// 展示用：当前邮箱与验证状态
const currentEmail = computed(() => userStore.emailInfo?.email ?? "未绑定")
const isVerified = computed(() => !!userStore.emailInfo?.verified)

// 更换邮箱对话框状态
const newEmail = ref("")
const emailCode = ref("")

const challengeToken = ref("")
const sendingCode = ref(false)
const sendCooldown = ref(0)
let sendTimer: ReturnType<typeof setInterval> | null = null

const changing = ref(false)

function validateEmail(val: string) {
  return /^[\w\-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(val)
}

function startCooldown() {
  sendCooldown.value = 60
  if (sendTimer) clearInterval(sendTimer)
  sendTimer = setInterval(() => {
    sendCooldown.value--
    if (sendCooldown.value <= 0 && sendTimer) {
      clearInterval(sendTimer)
      sendTimer = null
    }
  }, 1000)
}

async function handleSendCode() {
  if (!validateEmail(newEmail.value)) {
    toast.error("请输入有效的新邮箱", { description: "请检查邮箱格式后重试" })
    return
  }
  if (!challengeToken.value) {
    toast.error("请先完成人机验证", { description: "通过下方验证码后再发送邮件" })
    return
  }

  sendingCode.value = true
  try {
    await sendEmailVerificationCode(newEmail.value, challengeToken.value)
    toast.success("验证码已发送", { description: `已发送到 ${newEmail.value}，请注意查收` })
    startCooldown()
  } catch (e: any) {
    toast.error("发送验证码失败", { description: e?.message || "请稍后再试" })
  } finally {
    sendingCode.value = false
  }
}

async function handleChangeEmail() {
  if (!validateEmail(newEmail.value)) {
    toast.error("请输入有效的新邮箱", { description: "请检查邮箱格式后重试" })
    return
  }
  if (!emailCode.value) {
    toast.error("请输入验证码", { description: "请填写邮箱收到的验证码" })
    return
  }

  changing.value = true
  try {
    const response = await verifyEmail(newEmail.value, emailCode.value)
    // API 约定：verifyEmail 返回的 response.updatedData 下带有 emailInfo
    const updatedEmailInfo = (response as any)?.updatedData?.emailInfo ?? (response as any)?.updatedData
    if (updatedEmailInfo) {
      userStore.updateUser({ emailInfo: updatedEmailInfo })
    }

    toast.success("更换邮箱成功", { description: "请重新登录以生效" })
    userStore.clearUser()
    router.push("/user/login")
  } catch (e: any) {
    toast.error("更换邮箱失败", { description: e?.message || "请稍后重试" })
  } finally {
    changing.value = false
  }
}

onUnmounted(() => {
  if (sendTimer) {
    clearInterval(sendTimer)
    sendTimer = null
  }
})
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>邮箱设置</CardTitle>
      <CardDescription>管理您的邮箱绑定信息</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-muted-foreground">当前邮箱</div>
          <div class="text-base font-medium">{{ currentEmail }}</div>
        </div>
        <div>
          <span
            v-if="isVerified"
            class="px-2 py-1 rounded text-xs bg-green-100 text-green-700"
          >已验证</span>
          <span
            v-else
            class="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700"
          >未验证</span>
        </div>
      </div>

      <Dialog>
        <DialogTrigger as-child>
          <Button class="w-full">更换邮箱</Button>
        </DialogTrigger>
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>更换邮箱</DialogTitle>
            <DialogDescription>输入新的邮箱，完成人机验证并发送验证码。</DialogDescription>
          </DialogHeader>

          <div class="grid gap-4 py-4">
            <Input placeholder="新的邮箱地址" v-model="newEmail" />
            <Turnstile @verify="val => (challengeToken = val)" class="mb-2" />
            <div class="flex gap-2">
              <Input placeholder="邮箱验证码" v-model="emailCode" class="flex-1" />
              <Button
                :disabled="sendingCode || sendCooldown > 0 || !validateEmail(newEmail)"
                @click="handleSendCode"
              >
                <span v-if="sendCooldown > 0">{{ sendCooldown }}s</span>
                <span v-else>发送验证码</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button :loading="changing" @click="handleChangeEmail">确认更换</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
</template>