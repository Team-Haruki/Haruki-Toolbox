<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { toast } from "vue-sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  LucideSearch,
  LucideRefreshCw,
  LucideTrash2,
  LucideArrowRightLeft,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCheckSquare,
  LucidePlus,
  LucidePencil,
  LucideMoreHorizontal,
  LucideLoader2,
} from "lucide-vue-next"
import {
  getGlobalGameBindings,
  deleteGlobalGameBinding,
  reassignGlobalGameBinding,
  batchDeleteGameBindings,
  type GlobalGameBinding,
} from "@/api/admin/game-account-bindings"
import { updateGameAccountBinding } from "@/api/admin/users"

// ===== 状态 =====
const loading = ref(true)
const bindings = ref<GlobalGameBinding[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)

// ===== 筛选 =====
const filterQ = ref("")
const filterServer = ref<string>("all")
const filterUserId = ref("")
const filterGameUserId = ref("")
const filterSort = ref("id_desc")

// ===== 选择 =====
const selected = ref<Set<string>>(new Set())
const selectAll = ref(false)

// ===== 对话框 =====
const reassignDialogOpen = ref(false)
const reassignTarget = ref<GlobalGameBinding | null>(null)
const reassignTargetUserId = ref("")
const actionLoading = ref(false)

// ===== 删除对话框 =====
const deleteDialogOpen = ref(false)
const deleteTarget = ref<GlobalGameBinding | null>(null)

// ===== 新增/编辑对话框 =====
const editDialogOpen = ref(false)
const editTargetUserId = ref("")
const editServer = ref("jp")
const editGameUserId = ref("")
const editSuite = ref({
  allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false,
})
const editMysekai = ref({
  allowPublicApi: false, allowFixtureApi: false, allow8823: false, allowResona: false, allowLuna: false,
})
const isEditMode = ref(false)

// ===== 常量 =====
const servers = [
  { value: "all", label: "全部区服" },
  { value: "jp", label: "日服" },
  { value: "en", label: "国际服" },
  { value: "tw", label: "台服" },
  { value: "kr", label: "韩服" },
  { value: "cn", label: "国服" },
]

const sortOptions = [
  { value: "id_desc", label: "ID ↓" },
  { value: "id_asc", label: "ID ↑" },
  { value: "game_user_id_desc", label: "游戏ID ↓" },
  { value: "game_user_id_asc", label: "游戏ID ↑" },
  { value: "user_id_desc", label: "用户ID ↓" },
  { value: "user_id_asc", label: "用户ID ↑" },
]

function bindingKey(b: GlobalGameBinding) {
  return `${b.server}:${b.gameUserId}`
}

function serverLabel(server: string) {
  return servers.find(s => s.value === server)?.label ?? server
}

// ===== 加载 =====
async function loadBindings() {
  loading.value = true
  selected.value.clear()
  selectAll.value = false
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      page_size: pageSize.value,
      sort: filterSort.value,
    }
    if (filterQ.value.trim()) params.q = filterQ.value.trim()
    if (filterServer.value !== "all") params.server = filterServer.value
    if (filterUserId.value.trim()) params.user_id = filterUserId.value.trim()
    if (filterGameUserId.value.trim()) params.game_user_id = filterGameUserId.value.trim()

    const res = await getGlobalGameBindings(params)
    bindings.value = res.items ?? []
    total.value = res.total ?? 0
  } catch (e: unknown) {
    toast.error("加载游戏绑定失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  page.value = 1
  loadBindings()
}

function resetFilters() {
  filterQ.value = ""
  filterServer.value = "all"
  filterUserId.value = ""
  filterGameUserId.value = ""
  filterSort.value = "id_desc"
  page.value = 1
  loadBindings()
}

onMounted(loadBindings)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
function prevPage() { if (page.value > 1) { page.value--; loadBindings() } }
function nextPage() { if (page.value < totalPages.value) { page.value++; loadBindings() } }

// ===== 选择 =====
function toggleSelect(key: string) {
  if (selected.value.has(key)) {
    selected.value.delete(key)
  } else {
    selected.value.add(key)
  }
}

function toggleSelectAll() {
  if (selectAll.value) {
    selected.value.clear()
    selectAll.value = false
  } else {
    bindings.value.forEach(b => selected.value.add(bindingKey(b)))
    selectAll.value = true
  }
}

// ===== 操作 =====
function openDeleteConfirm(b: GlobalGameBinding) {
  deleteTarget.value = b
  deleteDialogOpen.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  actionLoading.value = true
  try {
    await deleteGlobalGameBinding(deleteTarget.value.server, deleteTarget.value.gameUserId)
    toast.success("已解绑")
    deleteDialogOpen.value = false
    await loadBindings()
  } catch (e: unknown) {
    toast.error("解绑失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

function openReassign(b: GlobalGameBinding) {
  reassignTarget.value = b
  reassignTargetUserId.value = ""
  reassignDialogOpen.value = true
}

async function handleReassign() {
  if (!reassignTarget.value || !reassignTargetUserId.value.trim()) return
  actionLoading.value = true
  try {
    await reassignGlobalGameBinding(
      reassignTarget.value.server,
      reassignTarget.value.gameUserId,
      reassignTargetUserId.value.trim()
    )
    toast.success("已转移")
    reassignDialogOpen.value = false
    await loadBindings()
  } catch (e: unknown) {
    toast.error("转移失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleBatchDelete() {
  if (selected.value.size === 0) return
  actionLoading.value = true
  try {
    const items = Array.from(selected.value).map(key => {
      const parts = key.split(":")
      return { server: parts[0] ?? "", gameUserId: parts[1] ?? "" }
    })
    await batchDeleteGameBindings(items)
    toast.success(`已批量解绑 ${items.length} 条`)
    await loadBindings()
  } catch (e: unknown) {
    toast.error("批量解绑失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

function openAddBinding() {
  isEditMode.value = false
  editTargetUserId.value = ""
  editServer.value = "jp"
  editGameUserId.value = ""
  editSuite.value = { allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false }
  editMysekai.value = { allowPublicApi: false, allowFixtureApi: false, allow8823: false, allowResona: false, allowLuna: false }
  editDialogOpen.value = true
}

function openEditBinding(b: GlobalGameBinding) {
  isEditMode.value = true
  editTargetUserId.value = b.userId
  editServer.value = b.server
  editGameUserId.value = b.gameUserId
  const s = b.suite as any
  editSuite.value = (s && typeof s === 'object')
    ? { allowPublicApi: !!s.allowPublicApi, allowSakura: !!s.allowSakura, allow8823: !!s.allow8823, allowResona: !!s.allowResona, allowLuna: !!s.allowLuna }
    : { allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false }
  const m = b.mysekai as any
  editMysekai.value = (m && typeof m === 'object')
    ? { allowPublicApi: !!m.allowPublicApi, allowFixtureApi: !!m.allowFixtureApi, allow8823: !!m.allow8823, allowResona: !!m.allowResona, allowLuna: !!m.allowLuna }
    : { allowPublicApi: false, allowFixtureApi: false, allow8823: false, allowResona: false, allowLuna: false }
  editDialogOpen.value = true
}

async function handleSaveBinding() {
  if (!editTargetUserId.value.trim() || !editGameUserId.value.trim()) return
  actionLoading.value = true
  try {
    await updateGameAccountBinding(
      editTargetUserId.value.trim(),
      editServer.value,
      editGameUserId.value.trim(),
      { suite: editSuite.value, mysekai: editMysekai.value }
    )
    toast.success(isEditMode.value ? "绑定已更新" : "绑定已创建")
    editDialogOpen.value = false
    await loadBindings()
  } catch (e: unknown) {
    toast.error("保存失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <!-- 筛选器 -->
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-center gap-2">
          <LucideSearch class="w-5 h-5 text-muted-foreground" />
          <CardTitle class="text-base">搜索与筛选</CardTitle>
          <div class="ml-auto">
            <Button size="sm" @click="openAddBinding">
              <LucidePlus class="w-4 h-4 mr-1" />
              新增绑定
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="pt-0">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">模糊搜索</Label>
            <Input v-model="filterQ" placeholder="游戏ID / 用户名 / 邮箱" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">精确游戏ID</Label>
            <Input v-model="filterGameUserId" placeholder="游戏用户ID" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">工具箱用户ID</Label>
            <Input v-model="filterUserId" placeholder="工具箱用户ID" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">区服</Label>
            <Select v-model="filterServer">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="全部区服" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in servers" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label class="text-sm">排序</Label>
            <Select v-model="filterSort">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="flex items-center gap-2 mt-4">
          <Button size="sm" @click="applyFilters">
            <LucideSearch class="w-4 h-4 mr-1" />
            查询
          </Button>
          <Button variant="outline" size="sm" @click="resetFilters">
            <LucideRefreshCw class="w-4 h-4 mr-1" />
            重置
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- 批量操作栏 -->
    <div v-if="selected.size > 0" class="flex items-center gap-3 px-2">
      <span class="text-sm text-muted-foreground">
        已选 <strong class="text-foreground">{{ selected.size }}</strong> 条
      </span>
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="destructive" size="sm" :disabled="actionLoading">
            <LucideTrash2 class="w-4 h-4 mr-1" /> 批量解绑
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量解绑</AlertDialogTitle>
            <AlertDialogDescription>
              将解绑选中的 {{ selected.size }} 条游戏账号绑定，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction @click="handleBatchDelete">确认解绑</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>

    <!-- 表格 -->
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
                <TableHead class="w-10">
                  <button
                    class="flex items-center justify-center w-5 h-5 border rounded cursor-pointer"
                    :class="selectAll ? 'bg-primary border-primary text-primary-foreground' : 'border-input'"
                    @click="toggleSelectAll"
                  >
                    <LucideCheckSquare v-if="selectAll" class="w-3.5 h-3.5" />
                  </button>
                </TableHead>
                <TableHead>区服</TableHead>
                <TableHead>游戏ID</TableHead>
                <TableHead>所属用户</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="b in bindings" :key="bindingKey(b)">
                <TableCell>
                  <button
                    class="flex items-center justify-center w-5 h-5 border rounded cursor-pointer"
                    :class="selected.has(bindingKey(b)) ? 'bg-primary border-primary text-primary-foreground' : 'border-input'"
                    @click="toggleSelect(bindingKey(b))"
                  >
                    <LucideCheckSquare v-if="selected.has(bindingKey(b))" class="w-3.5 h-3.5" />
                  </button>
                </TableCell>
                <TableCell>
                  <span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-muted">
                    {{ serverLabel(b.server) }}
                  </span>
                </TableCell>
                <TableCell class="font-mono text-sm">{{ b.gameUserId }}</TableCell>
                <TableCell>
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{{ b.userName || b.userId }}</span>
                    <span v-if="b.userName" class="text-xs text-muted-foreground">ID: {{ b.userId }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="ghost" class="h-8 w-8 p-0">
                        <span class="sr-only">打开菜单</span>
                        <LucideMoreHorizontal class="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>操作</DropdownMenuLabel>
                      <DropdownMenuItem @click="openEditBinding(b)">
                        <LucidePencil class="w-4 h-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="openReassign(b)">
                        <LucideArrowRightLeft class="w-4 h-4 mr-2" />
                        转移绑定
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="openDeleteConfirm(b)">
                        <LucideTrash2 class="w-4 h-4 mr-2" />
                        解绑
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow v-if="bindings.length === 0">
                <TableCell :colspan="5" class="text-center py-8 text-muted-foreground">
                  暂无游戏账号绑定记录
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- 分页 -->
    <div class="flex items-center justify-between px-2">
      <span class="text-sm text-muted-foreground">共 {{ total.toLocaleString() }} 条记录</span>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm" :disabled="page <= 1" @click="prevPage">
          <LucideChevronLeft class="w-4 h-4" />
        </Button>
        <span class="text-sm tabular-nums">{{ page }} / {{ totalPages }}</span>
        <Button variant="outline" size="sm" :disabled="page >= totalPages" @click="nextPage">
          <LucideChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- 转移对话框 -->
    <Dialog v-model:open="reassignDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>转移游戏账号</DialogTitle>
          <DialogDescription>
            将 {{ serverLabel(reassignTarget?.server ?? '') }} 游戏ID
            <strong>{{ reassignTarget?.gameUserId }}</strong>
            从 {{ reassignTarget?.userName || reassignTarget?.userId }} 转移到目标用户。
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-2 py-2">
          <Label>目标用户ID</Label>
          <Input v-model="reassignTargetUserId" placeholder="请输入目标工具箱用户ID" />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="reassignDialogOpen = false">取消</Button>
          <Button
            @click="handleReassign"
            :disabled="!reassignTargetUserId.trim() || actionLoading"
          >
            <LucideArrowRightLeft class="w-4 h-4 mr-1" />
            确认转移
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 新增/编辑绑定对话框 -->
    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{{ isEditMode ? '编辑游戏绑定' : '新增游戏绑定' }}</DialogTitle>
          <DialogDescription>
            {{ isEditMode ? '修改游戏账号绑定的数据设置。' : '为用户添加新的游戏账号绑定。' }}
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-2">
          <div class="flex flex-col gap-1.5">
            <Label>工具箱用户ID</Label>
            <Input v-model="editTargetUserId" placeholder="输入工具箱用户ID" :disabled="isEditMode" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>服务器</Label>
            <Select v-model="editServer">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jp">日服 (JP)</SelectItem>
                <SelectItem value="en">国际服 (EN)</SelectItem>
                <SelectItem value="tw">台服 (TW)</SelectItem>
                <SelectItem value="kr">韩服 (KR)</SelectItem>
                <SelectItem value="cn">国服 (CN)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>游戏用户ID</Label>
            <Input v-model="editGameUserId" placeholder="输入游戏内用户ID" :disabled="isEditMode" />
          </div>
          <!-- Suite 设置 -->
          <div class="border rounded-lg p-3">
            <Label class="font-semibold text-sm">Suite 数据设置</Label>
            <div class="grid gap-2 mt-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">允许公开API访问</span>
                <Switch :model-value="editSuite.allowPublicApi" @update:model-value="v => editSuite.allowPublicApi = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至SakuraBot</span>
                <Switch :model-value="editSuite.allowSakura" @update:model-value="v => editSuite.allowSakura = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至烤森Bot</span>
                <Switch :model-value="editSuite.allow8823" @update:model-value="v => editSuite.allow8823 = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至ResonaBot</span>
                <Switch :model-value="editSuite.allowResona" @update:model-value="v => editSuite.allowResona = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至LunaBot</span>
                <Switch :model-value="editSuite.allowLuna" @update:model-value="v => editSuite.allowLuna = v" />
              </div>
            </div>
          </div>
          <!-- MySekai 设置 -->
          <div class="border rounded-lg p-3">
            <Label class="font-semibold text-sm">MySekai 数据设置</Label>
            <div class="grid gap-2 mt-2">
              <div class="flex items-center justify-between">
                <span class="text-sm">允许公开API访问</span>
                <Switch :model-value="editMysekai.allowPublicApi" @update:model-value="v => editMysekai.allowPublicApi = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许家具共享API</span>
                <Switch :model-value="editMysekai.allowFixtureApi" @update:model-value="v => editMysekai.allowFixtureApi = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至烤森Bot</span>
                <Switch :model-value="editMysekai.allow8823" @update:model-value="v => editMysekai.allow8823 = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至ResonaBot</span>
                <Switch :model-value="editMysekai.allowResona" @update:model-value="v => editMysekai.allowResona = v" />
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm">允许上传至LunaBot</span>
                <Switch :model-value="editMysekai.allowLuna" @update:model-value="v => editMysekai.allowLuna = v" />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editDialogOpen = false">取消</Button>
          <Button
            @click="handleSaveBinding"
            :disabled="!editTargetUserId.trim() || !editGameUserId.trim() || actionLoading"
          >
            {{ isEditMode ? '保存' : '创建' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 单条删除确认弹窗 -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认解绑</AlertDialogTitle>
          <AlertDialogDescription v-if="deleteTarget">
            此操作将解除 {{ serverLabel(deleteTarget.server) }} 游戏账号 {{ deleteTarget.gameUserId }} 的绑定关系。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteDialogOpen = false">取消</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete" :disabled="actionLoading">
            <LucideLoader2 v-if="actionLoading" class="w-4 h-4 mr-1 animate-spin" />
            确认解绑
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
