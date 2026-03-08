<script setup lang="ts">
import { ref } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useUserStore } from "@/store"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LucideArrowLeft,
  LucideSend,
  LucideLoader2,
  LucideFlame,
  LucideChevronUp,
  LucideMinus,
  LucideChevronDown
} from "lucide-vue-next"
import { createTicket } from "@/api/tickets"
import type { TicketCategory, TicketPriority } from "@/types/ticket"

const router = useRouter()
const userStore = useUserStore()

const subject = ref("")
const category = ref<TicketCategory>("other")
const priority = ref<TicketPriority>("normal")
const message = ref("")
const submitting = ref(false)

const categories = [
  { value: "upload", label: "上传问题" },
  { value: "account", label: "账号问题" },
  { value: "bug", label: "Bug反馈" },
  { value: "feature", label: "功能建议" },
  { value: "other", label: "其他" },
]

const priorities = [
  { value: "low", label: "低" },
  { value: "normal", label: "普通" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
]

function priorityColor(p: string) {
  switch (p) {
    case "urgent": return "text-red-500"
    case "high": return "text-orange-500"
    case "medium": return "text-yellow-500"
    case "normal": return "text-blue-500"
    case "low": return "text-gray-500"
    default: return "text-muted-foreground"
  }
}

function priorityIcon(p: string) {
  switch (p) {
    case "urgent": return LucideFlame
    case "high": return LucideChevronUp
    case "medium": return LucideMinus
    case "normal": return LucideMinus
    case "low": return LucideChevronDown
    default: return null
  }
}

async function handleSubmit() {
  if (!subject.value.trim()) {
    toast.error("请输入工单主题")
    return
  }
  if (!message.value.trim()) {
    toast.error("请输入工单描述")
    return
  }
  if (!userStore.userId) {
    toast.error("请先登录")
    return
  }

  submitting.value = true
  try {
    await createTicket(userStore.userId, {
      subject: subject.value.trim(),
      category: category.value,
      priority: priority.value,
      message: message.value.trim(),
    })
    toast.success("工单已创建")
    router.push("/tickets")
  } catch (e: unknown) {
    toast.error("创建工单失败", { description: (e as Error).message })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-xl mx-auto flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="self-start" @click="router.push('/tickets')">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> 返回工单列表
    </Button>

    <Card>
      <CardHeader>
        <CardTitle>创建工单</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-5">
        <!-- 主题 -->
        <div class="flex flex-col gap-2">
          <Label for="subject">主题</Label>
          <Input id="subject" v-model="subject" placeholder="请简要描述您的问题" />
        </div>

        <!-- 分类和优先级 -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <Label>分类</Label>
            <Select v-model="category">
              <SelectTrigger class="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in categories" :key="c.value" :value="c.value">
                  {{ c.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-2">
            <Label>优先级</Label>
            <Select v-model="priority">
              <SelectTrigger class="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in priorities" :key="p.value" :value="p.value">
                  <div class="flex items-center gap-2 py-0.5">
                    <component :is="priorityIcon(p.value)" :class="['w-4 h-4', priorityColor(p.value)]" v-if="priorityIcon(p.value)" />
                    <span>{{ p.label }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 描述 -->
        <div class="flex flex-col gap-2">
          <Label for="message">描述</Label>
          <textarea
            id="message"
            v-model="message"
            placeholder="请详细描述您遇到的问题…"
            rows="6"
            class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
          />
        </div>

        <!-- 提交 -->
        <Button @click="handleSubmit" :disabled="submitting" class="self-end">
          <LucideLoader2 v-if="submitting" class="w-4 h-4 mr-1 animate-spin" />
          <LucideSend v-else class="w-4 h-4 mr-1" />
          提交工单
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
