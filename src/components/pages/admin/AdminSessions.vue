<script setup lang="ts">
import { ref, onMounted } from "vue"
import { toast } from "vue-sonner"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  LucideTrash2,
  LucideRefreshCw,
  LucideCircleDot,
} from "lucide-vue-next"
import { getAdminSessions, deleteAdminSession, reauthAdmin } from "@/api/admin/sessions"
import type { AdminSession } from "@/types/admin"

const loading = ref(true)
const sessions = ref<AdminSession[]>([])
const actionLoading = ref(false)

async function loadSessions() {
  loading.value = true
  try {
    sessions.value = await getAdminSessions()
  } catch (e: unknown) {
    toast.error("加载会话失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

async function handleDelete(sessionTokenId: string) {
  actionLoading.value = true
  try {
    await deleteAdminSession(sessionTokenId)
    toast.success("会话已注销")
    await loadSessions()
  } catch (e: unknown) {
    toast.error("注销失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleReauth() {
  actionLoading.value = true
  try {
    await reauthAdmin()
    toast.success("已重新认证")
  } catch (e: unknown) {
    toast.error("重新认证失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

onMounted(loadSessions)

function formatDate(d: string) {
  return new Date(d).toLocaleString("zh-CN")
}


</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <div>
          <CardTitle class="text-lg">会话管理</CardTitle>
          <CardDescription>查看和管理您的管理员会话</CardDescription>
        </div>
        <Button variant="outline" size="sm" :disabled="actionLoading" @click="handleReauth">
          <LucideRefreshCw class="w-4 h-4 mr-1" /> 重新认证
        </Button>
      </CardHeader>
      <CardContent class="p-0">
        <template v-if="loading">
          <div class="p-6 flex flex-col gap-3">
            <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>会话ID</TableHead>
                <TableHead>过期时间</TableHead>
                <TableHead>剩余TTL</TableHead>
                <TableHead class="w-16">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="s in sessions" :key="s.sessionTokenId" :class="s.current ? 'bg-primary/5' : ''">
                <TableCell>
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono truncate max-w-[200px]">{{ s.sessionTokenId.slice(0, 8) }}…</span>
                    <span v-if="s.current" class="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                      <LucideCircleDot class="w-3 h-3" /> 当前
                    </span>
                  </div>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatDate(s.expiresAt) }}</TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ Math.floor(s.ttlSeconds / 3600) }}h {{ Math.floor((s.ttlSeconds % 3600) / 60) }}m</TableCell>
                <TableCell>
                  <AlertDialog v-if="!s.current">
                    <AlertDialogTrigger as-child>
                      <Button variant="ghost" size="sm" class="text-destructive" :disabled="actionLoading">
                        <LucideTrash2 class="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认注销会话</AlertDialogTitle>
                        <AlertDialogDescription>确定要注销该会话吗？对应设备将需要重新登录。</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction @click="handleDelete(s.sessionTokenId)">确认注销</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
              <TableRow v-if="sessions.length === 0">
                <TableCell :colspan="4" class="text-center py-8 text-muted-foreground">暂无会话</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
