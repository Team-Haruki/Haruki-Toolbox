<script setup lang="ts">
import { ref, onMounted } from "vue"
import { toast } from "vue-sonner"
import { useUserStore } from "@/store"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  LucidePlus,
  LucideCheckCircle2,
  LucideAlertTriangle,
  LucideChevronLeft,
  LucideChevronRight,
  LucideLoader2,
} from "lucide-vue-next"
import { getRiskEvents, createRiskEvent, resolveRiskEvent, getRiskRules, updateRiskRules } from "@/api/admin/risk"
import type { RiskEvent, RiskRule } from "@/types/admin"

const userStore = useUserStore()

// 事件
const eventsLoading = ref(true)
const events = ref<RiskEvent[]>([])
const totalEvents = ref(0)
const eventPage = ref(1)
const eventPageSize = ref(20)
const actionLoading = ref(false)

// 创建事件
const createOpen = ref(false)
const newSeverity = ref("medium")
const newSource = ref("dashboard")
const newAction = ref("")
const newReason = ref("")
const newTargetUserId = ref("")
const creating = ref(false)

// 规则
const rulesLoading = ref(true)
const rules = ref<RiskRule[]>([])
const rulesJson = ref("")
const rulesSaving = ref(false)

async function loadEvents() {
  eventsLoading.value = true
  try {
    const res = await getRiskEvents({ page: eventPage.value, page_size: eventPageSize.value })
    events.value = res.items
    totalEvents.value = res.total
  } catch (e: unknown) {
    toast.error("加载风控事件失败", { description: (e as Error).message })
  } finally {
    eventsLoading.value = false
  }
}

async function loadRules() {
  rulesLoading.value = true
  try {
    rules.value = await getRiskRules()
    rulesJson.value = JSON.stringify(rules.value, null, 2)
  } catch (e: unknown) {
    toast.error("加载风控规则失败", { description: (e as Error).message })
  } finally {
    rulesLoading.value = false
  }
}

async function handleCreate() {
  if (!newAction.value.trim() || !newReason.value.trim()) {
    toast.error("请填写事件动作和原因")
    return
  }
  creating.value = true
  try {
    await createRiskEvent({
      severity: newSeverity.value,
      source: newSource.value,
      action: newAction.value.trim(),
      reason: newReason.value.trim(),
      targetUserId: newTargetUserId.value.trim() || undefined,
    })
    toast.success("事件已创建")
    createOpen.value = false
    newAction.value = ""
    newReason.value = ""
    newTargetUserId.value = ""
    await loadEvents()
  } catch (e: unknown) {
    toast.error("创建失败", { description: (e as Error).message })
  } finally {
    creating.value = false
  }
}

async function handleResolve(eventId: string) {
  actionLoading.value = true
  try {
    await resolveRiskEvent(eventId)
    toast.success("事件已解决")
    await loadEvents()
  } catch (e: unknown) {
    toast.error("操作失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function saveRules() {
  rulesSaving.value = true
  try {
    const parsed = JSON.parse(rulesJson.value)
    await updateRiskRules(parsed)
    toast.success("风控规则已更新")
    rules.value = parsed
  } catch (e: unknown) {
    if (e instanceof SyntaxError) {
      toast.error("JSON 格式错误")
    } else {
      toast.error("保存失败", { description: (e as Error).message })
    }
  } finally {
    rulesSaving.value = false
  }
}

onMounted(() => { loadEvents(); loadRules() })

const eventTotalPages = () => Math.max(1, Math.ceil(totalEvents.value / eventPageSize.value))
function prevPage() { if (eventPage.value > 1) { eventPage.value--; loadEvents() } }
function nextPage() { if (eventPage.value < eventTotalPages()) { eventPage.value++; loadEvents() } }

function formatDate(d: string) {
  return new Date(d).toLocaleString("zh-CN")
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Tabs default-value="events">
      <TabsList>
        <TabsTrigger value="events">风控事件</TabsTrigger>
        <TabsTrigger value="rules">风控规则</TabsTrigger>
      </TabsList>

      <!-- 风控事件 -->
      <TabsContent value="events">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle class="text-lg">风控事件</CardTitle>
            <Dialog v-model:open="createOpen">
              <DialogTrigger as-child>
                <Button size="sm">
                  <LucidePlus class="w-4 h-4 mr-1" /> 创建事件
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建风控事件</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col gap-3 py-4">
                  <div class="flex flex-col gap-1.5">
                    <Label>严重程度</Label>
                    <select v-model="newSeverity" class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="critical">严重</option>
                    </select>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <Label>来源</Label>
                    <Input v-model="newSource" placeholder="如: dashboard" />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <Label>动作</Label>
                    <Input v-model="newAction" placeholder="如: suspicious_login" />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <Label>原因</Label>
                    <textarea
                      v-model="newReason"
                      placeholder="描述风控原因…"
                      rows="3"
                      class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <Label>目标用户ID（可选）</Label>
                    <Input v-model="newTargetUserId" placeholder="用户ID" />
                  </div>
                </div>
                <DialogFooter>
                  <Button :disabled="creating" @click="handleCreate">
                    <LucideLoader2 v-if="creating" class="w-4 h-4 mr-1 animate-spin" />
                    创建
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent class="p-0">
            <template v-if="eventsLoading">
              <div class="p-6 flex flex-col gap-3">
                <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
              </div>
            </template>
            <template v-else>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>严重程度</TableHead>
                    <TableHead>动作</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead class="hidden sm:table-cell">用户</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead class="hidden md:table-cell">时间</TableHead>
                    <TableHead class="w-16">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="e in events" :key="e.id">
                    <TableCell>
                      <span :class="[
                        'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                        e.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        e.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                        e.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      ]">
                        {{ e.severity }}
                      </span>
                    </TableCell>
                    <TableCell class="font-medium">{{ e.action }}</TableCell>
                    <TableCell class="max-w-[200px] truncate text-muted-foreground">{{ e.reason }}</TableCell>
                    <TableCell class="hidden sm:table-cell text-muted-foreground text-sm">{{ e.userName || e.targetUserId || '—' }}</TableCell>
                    <TableCell>
                      <span :class="[
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        e.status === 'open'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      ]">
                        <LucideAlertTriangle v-if="e.status === 'open'" class="w-3 h-3" />
                        <LucideCheckCircle2 v-else class="w-3 h-3" />
                        {{ e.status === 'open' ? '待处理' : '已解决' }}
                      </span>
                    </TableCell>
                    <TableCell class="hidden md:table-cell text-muted-foreground text-sm">{{ formatDate(e.createdAt) }}</TableCell>
                    <TableCell>
                      <Button
                        v-if="e.status === 'open'"
                        variant="outline"
                        size="sm"
                        :disabled="actionLoading"
                        @click="handleResolve(e.id)"
                      >
                        <LucideCheckCircle2 class="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="events.length === 0">
                    <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">暂无风控事件</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </template>
          </CardContent>
        </Card>

        <!-- 分页 -->
        <div v-if="totalEvents > eventPageSize" class="flex items-center justify-between px-2 mt-4">
          <span class="text-sm text-muted-foreground">共 {{ totalEvents }} 个事件</span>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" :disabled="eventPage <= 1" @click="prevPage">
              <LucideChevronLeft class="w-4 h-4" />
            </Button>
            <span class="text-sm tabular-nums">{{ eventPage }} / {{ eventTotalPages() }}</span>
            <Button variant="outline" size="sm" :disabled="eventPage >= eventTotalPages()" @click="nextPage">
              <LucideChevronRight class="w-4 h-4" />
            </Button>
          </div>
        </div>
      </TabsContent>

      <!-- 风控规则 -->
      <TabsContent value="rules">
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">风控规则</CardTitle>
            <CardDescription>查看和编辑风控规则配置（仅超级管理员可编辑）</CardDescription>
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <template v-if="rulesLoading">
              <Skeleton class="h-48 w-full" />
            </template>
            <template v-else>
              <textarea
                v-model="rulesJson"
                :disabled="!userStore.isSuperAdmin"
                class="w-full h-64 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y disabled:opacity-60"
                spellcheck="false"
              />
              <Button
                v-if="userStore.isSuperAdmin"
                class="self-end"
                :disabled="rulesSaving"
                @click="saveRules"
              >
                <LucideLoader2 v-if="rulesSaving" class="w-4 h-4 mr-1 animate-spin" />
                保存规则
              </Button>
            </template>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
