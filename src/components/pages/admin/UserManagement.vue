<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Label } from "@/components/ui/label"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  LucideBan,
  LucideSearch,
  LucideShieldOff,
  LucideLogOut,
  LucideChevronLeft,
  LucideChevronRight,
  LucideLoader2,
  LucideShieldAlert,
  LucideShield,
  LucideUser,
  LucideTrash2,
  LucideCheckCircle2,
  LucideUserCog,
  LucideSettings2
} from "lucide-vue-next"
import { getUsers, batchBan, batchUnban, batchForceLogout, batchRole, batchAllowCNMysekai } from "@/api/admin/users"
import type { AdminUser } from "@/types/admin"

const router = useRouter()

const loading = ref(true)
const users = ref<AdminUser[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const search = ref("")
const roleFilter = ref("all")
const bannedFilter = ref("all")
const allowCNMysekaiFilter = ref("all")
const sortFilter = ref("id_desc")
const createdFrom = ref<Date>()
const createdTo = ref<Date>()
const searchTimer = ref<ReturnType<typeof setTimeout>>()

const selectedIds = ref<string[]>([])
const batchLoading = ref(false)
const batchRoleTarget = ref<string>('user')
const batchAllowCNTarget = ref<string>('true')

async function loadUsers() {
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (search.value.trim()) {
      params.q = search.value.trim()
    }
    if (roleFilter.value !== 'all') params.role = roleFilter.value
    if (bannedFilter.value !== 'all') params.banned = bannedFilter.value
    if (allowCNMysekaiFilter.value !== 'all') params.allow_cn_mysekai = allowCNMysekaiFilter.value
    if (createdFrom.value) params.created_from = createdFrom.value.toISOString()
    if (createdTo.value) params.created_to = createdTo.value.toISOString()
    params.sort = sortFilter.value
    const res = await getUsers(params)
    users.value = res.items
    total.value = res.total
  } catch (e: unknown) {
    const err = e as Error
    toast.error("加载用户列表失败", { description: err.message })
  } finally {
    loading.value = false
  }
}

watch(search, () => {
  clearTimeout(searchTimer.value)
  searchTimer.value = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 400)
})
watch([roleFilter, bannedFilter, allowCNMysekaiFilter, sortFilter, createdFrom, createdTo, pageSize], () => { page.value = 1; loadUsers() })

onMounted(loadUsers)

const totalPages = () => Math.max(1, Math.ceil(total.value / pageSize.value))

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadUsers()
  }
}

function nextPage() {
  if (page.value < totalPages()) {
    page.value++
    loadUsers()
  }
}

function toggleSelect(userId: string) {
  if (selectedIds.value.includes(userId)) {
    selectedIds.value = selectedIds.value.filter(id => id !== userId)
  } else {
    selectedIds.value.push(userId)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === users.value.length && users.value.length > 0) {
    selectedIds.value = []
  } else {
    selectedIds.value = users.value.map(u => u.userId)
  }
}

async function doBatchBan() {
  if (selectedIds.value.length === 0) return
  batchLoading.value = true
  try {
    await batchBan({ userIds: selectedIds.value })
    toast.success(`已批量封禁 ${selectedIds.value.length} 个用户`)
    selectedIds.value = []
    await loadUsers()
  } catch (e: unknown) {
    const err = e as Error
    toast.error("批量封禁失败", { description: err.message })
  } finally {
    batchLoading.value = false
  }
}

async function doBatchUnban() {
  if (selectedIds.value.length === 0) return
  batchLoading.value = true
  try {
    await batchUnban({ userIds: selectedIds.value })
    toast.success(`已批量解封 ${selectedIds.value.length} 个用户`)
    selectedIds.value = []
    await loadUsers()
  } catch (e: unknown) {
    const err = e as Error
    toast.error("批量解封失败", { description: err.message })
  } finally {
    batchLoading.value = false
  }
}

async function doBatchForceLogout() {
  if (selectedIds.value.length === 0) return
  batchLoading.value = true
  try {
    await batchForceLogout({ userIds: selectedIds.value })
    toast.success(`已批量强制登出 ${selectedIds.value.length} 个用户`)
    selectedIds.value = []
    await loadUsers()
  } catch (e: unknown) {
    const err = e as Error
    toast.error("批量强制登出失败", { description: err.message })
  } finally {
    batchLoading.value = false
  }
}

async function doBatchRole() {
  if (selectedIds.value.length === 0) return
  batchLoading.value = true
  try {
    await batchRole({ userIds: selectedIds.value, role: batchRoleTarget.value })
    toast.success(`已批量修改 ${selectedIds.value.length} 个用户的角色`)
    selectedIds.value = []
    await loadUsers()
  } catch (e: unknown) {
    const err = e as Error
    toast.error("批量修改角色失败", { description: err.message })
  } finally {
    batchLoading.value = false
  }
}

async function doBatchAllowCNMysekai() {
  if (selectedIds.value.length === 0) return
  batchLoading.value = true
  try {
    await batchAllowCNMysekai({ userIds: selectedIds.value, allowCNMysekai: batchAllowCNTarget.value === 'true' })
    toast.success(`已批量修改 ${selectedIds.value.length} 个国服功能权限`)
    selectedIds.value = []
    await loadUsers()
  } catch (e: unknown) {
    const err = e as Error
    toast.error("批量功能权限失败", { description: err.message })
  } finally {
    batchLoading.value = false
  }
}

function goToUser(userId: string) {
  router.push(`/admin/users/${userId}`)
}

function roleLabel(role: string) {
  switch (role) {
    case "super_admin": return "超级管理员"
    case "admin": return "管理员"
    default: return "用户"
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 搜索和批量操作栏 -->
    <Card>
      <CardHeader class="pb-3">
        <CardTitle class="text-lg">用户管理</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="flex flex-wrap gap-x-4 gap-y-3 items-end">
          <!-- 搜索 -->
          <div class="flex flex-col gap-1.5 grow max-w-sm">
            <Label class="text-xs">搜索</Label>
            <div class="relative">
              <LucideSearch class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                v-model="search"
                placeholder="搜索用户名、邮箱或ID…"
                class="pl-9"
              />
            </div>
          </div>

          <!-- 筛选器 -->
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">角色</Label>
            <Select v-model="roleFilter">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="user">
                  <div class="flex items-center gap-2">
                    <LucideUser class="w-4 h-4 text-muted-foreground" />
                    用户
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div class="flex items-center gap-2">
                    <LucideShield class="w-4 h-4 text-blue-500" />
                    管理员
                  </div>
                </SelectItem>
                <SelectItem value="super_admin">
                  <div class="flex items-center gap-2">
                    <LucideShieldAlert class="w-4 h-4 text-red-500" />
                    超级管理员
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">账号状态</Label>
            <Select v-model="bannedFilter">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="false">
                  <div class="flex items-center gap-2">
                    <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
                    正常
                  </div>
                </SelectItem>
                <SelectItem value="true">
                  <div class="flex items-center gap-2">
                    <LucideBan class="w-4 h-4 text-red-500" />
                    已封禁
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">国服MySekai权限</Label>
            <Select v-model="allowCNMysekaiFilter">
              <SelectTrigger class="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="true">
                  <div class="flex items-center gap-2">
                    <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
                    允许
                  </div>
                </SelectItem>
                <SelectItem value="false">
                  <div class="flex items-center gap-2">
                    <LucideBan class="w-4 h-4 text-red-500" />
                    禁止
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">排序</Label>
            <Select v-model="sortFilter">
              <SelectTrigger class="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id_desc">ID ↓</SelectItem>
                <SelectItem value="id_asc">ID ↑</SelectItem>
                <SelectItem value="name_desc">名称 ↓</SelectItem>
                <SelectItem value="name_asc">名称 ↑</SelectItem>
                <SelectItem value="created_at_desc">注册时间 ↓</SelectItem>
                <SelectItem value="created_at_asc">注册时间 ↑</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">注册时间起</Label>
            <div class="w-48">
              <DateTimePicker24h v-model="createdFrom" placeholder="按起始时间过滤" />
            </div>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-xs">注册时间止</Label>
            <div class="w-48">
              <DateTimePicker24h v-model="createdTo" placeholder="按结束时间过滤" />
            </div>
          </div>
        </div>

        <!-- 批量操作 -->
        <div v-if="selectedIds.length > 0" class="flex items-center gap-2 flex-wrap mt-4 pt-4 border-t">
          <span class="text-sm text-muted-foreground mr-2">
            已选 {{ selectedIds.length }} 个用户
          </span>

          <AlertDialog>
            <AlertDialogTrigger as-child>
              <Button variant="destructive" size="sm" :disabled="batchLoading">
                <LucideBan class="w-4 h-4 mr-1" />批量封禁
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认批量封禁</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要封禁选中的 {{ selectedIds.length }} 个用户吗？此操作可以撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction @click="doBatchBan">确认封禁</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" size="sm" :disabled="batchLoading" @click="doBatchUnban">
            <LucideShieldOff class="w-4 h-4 mr-1" />批量解封
          </Button>
          <Button variant="outline" size="sm" :disabled="batchLoading" @click="doBatchForceLogout">
            <LucideLogOut class="w-4 h-4 mr-1" />批量登出
          </Button>

          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" :disabled="batchLoading">
                <LucideUserCog class="w-4 h-4 mr-1" />批量角色
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64 p-4">
              <div class="space-y-4">
                <h4 class="font-medium leading-none mb-3">修改选中用户的角色</h4>
                <Select v-model="batchRoleTarget">
                  <SelectTrigger>
                    <SelectValue placeholder="选择目标角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div class="flex items-center gap-2">
                        <LucideUser class="w-4 h-4 text-muted-foreground" />
                        普通用户
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div class="flex items-center gap-2">
                        <LucideShield class="w-4 h-4 text-blue-500" />
                        管理员
                      </div>
                    </SelectItem>
                    <SelectItem value="super_admin">
                      <div class="flex items-center gap-2">
                        <LucideShieldAlert class="w-4 h-4 text-red-500" />
                        超级管理员
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div class="flex justify-end gap-2 mt-4">
                  <Button size="sm" @click="doBatchRole">确认修改</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" size="sm" :disabled="batchLoading">
                <LucideSettings2 class="w-4 h-4 mr-1" />批量国服MySekai权限
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64 p-4">
              <div class="space-y-4">
                <h4 class="font-medium leading-none mb-3">修改选中用户的国服MySekai权限</h4>
                <Select v-model="batchAllowCNTarget">
                  <SelectTrigger>
                    <SelectValue placeholder="修改权限状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">
                      <div class="flex items-center gap-2">
                        <LucideCheckCircle2 class="w-4 h-4 text-green-500" />
                        允许国服功能
                      </div>
                    </SelectItem>
                    <SelectItem value="false">
                      <div class="flex items-center gap-2">
                        <LucideBan class="w-4 h-4 text-red-500" />
                        禁止国服功能
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div class="flex justify-end gap-2 mt-4">
                  <Button size="sm" @click="doBatchAllowCNMysekai">确认修改</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <LucideLoader2 v-if="batchLoading" class="w-4 h-4 animate-spin" />
        </div>
      </CardContent>
    </Card>

    <!-- 用户表格 -->
    <Card>
      <CardContent class="p-0">
        <template v-if="loading">
          <div class="p-6 flex flex-col gap-3">
            <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead class="w-12 cursor-pointer" @click.stop="toggleSelectAll()">
                  <Checkbox
                    :model-value="users.length > 0 && selectedIds.length === users.length"
                    class="pointer-events-none"
                  />
                </TableHead>
                <TableHead>用户名</TableHead>
                <TableHead class="hidden sm:table-cell">邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>国服MySekai权限</TableHead>
                <TableHead>账号状态</TableHead>
                <TableHead class="hidden md:table-cell">注册时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow
                v-for="user in users"
                :key="user.userId"
                class="cursor-pointer hover:bg-muted/50 transition-colors"
                @click="goToUser(user.userId)"
              >
                <TableCell class="cursor-pointer" @click.stop="toggleSelect(user.userId)">
                  <Checkbox
                    :model-value="selectedIds.includes(user.userId)"
                    class="pointer-events-none"
                  />
                </TableCell>
                <TableCell class="font-medium">{{ user.name }}</TableCell>
                <TableCell class="hidden sm:table-cell text-muted-foreground">
                  {{ user.email || '—' }}
                </TableCell>
                <TableCell>
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      user.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    ]"
                  >
                    <LucideShieldAlert v-if="user.role === 'super_admin'" class="w-3.5 h-3.5" />
                    <LucideShield v-else-if="user.role === 'admin'" class="w-3.5 h-3.5" />
                    <LucideUser v-else class="w-3.5 h-3.5" />
                    {{ roleLabel(user.role) }}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    v-if="(user.allowCNMysekai ?? (user as any).allow_cn_mysekai) !== undefined"
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                      (user.allowCNMysekai ?? (user as any).allow_cn_mysekai) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    ]"
                  >
                    <LucideCheckCircle2 v-if="(user.allowCNMysekai ?? (user as any).allow_cn_mysekai)" class="w-3.5 h-3.5" />
                    <LucideBan v-else class="w-3.5 h-3.5" />
                    {{ (user.allowCNMysekai ?? (user as any).allow_cn_mysekai) ? '允许' : '禁止' }}
                  </span>
                  <span v-else class="text-muted-foreground text-sm">—</span>
                </TableCell>
                <TableCell>
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                      user.banned
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : user.deleted
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    ]"
                  >
                    <LucideBan v-if="user.banned" class="w-3.5 h-3.5" />
                    <LucideTrash2 v-else-if="user.deleted" class="w-3.5 h-3.5" />
                    <LucideCheckCircle2 v-else class="w-3.5 h-3.5" />
                    {{ user.banned ? '已封禁' : user.deleted ? '已删除' : '正常' }}
                  </span>
                </TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
                  {{ user.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '—' }}
                </TableCell>
              </TableRow>
              <TableRow v-if="users.length === 0">
                <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">
                  暂无用户数据
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- 分页 -->
    <div class="flex items-center justify-between px-2">
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground mr-2">
          共 {{ total }} 个用户
        </span>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground hidden sm:inline">每页显示</span>
          <Select :model-value="String(pageSize)" @update:model-value="v => pageSize = Number(v)">
            <SelectTrigger class="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages() }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages()" @click="nextPage">
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
