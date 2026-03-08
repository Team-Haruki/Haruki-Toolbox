<script setup lang="ts">
import { ref, onMounted } from "vue"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LucidePlus,
  LucideTrash2,
  LucideRefreshCw,
  LucideLoader2,
  LucidePower,
  LucideUndo2,
  LucideKey,
  LucideBarChart3,
  LucidePencil,
  LucideX,
  LucideCopy,
  LucideMoreHorizontal,
  LucideCheckCircle2,
  LucideBan,
} from "lucide-vue-next"
import {
  getOAuthClients,
  createOAuthClient,
  setOAuthClientActive,
  rotateClientSecret,
  deleteOAuthClient,
  restoreOAuthClient,
  revokeOAuthClient,
  updateOAuthClient,
  getOAuthClientStatistics,
} from "@/api/admin/oauth-clients"
import type { OAuthClient, OAuthClientStatistics } from "@/types/admin"

const userStore = useUserStore()
const loading = ref(true)
const clients = ref<OAuthClient[]>([])
const actionLoading = ref(false)

// 创建弹窗
const createOpen = ref(false)
const newClientId = ref('')
const newName = ref('')
const newClientType = ref('confidential')
const newScopes = ref<string[]>(['user:read'])
const newRedirectUris = ref<string[]>([''])
const creating = ref(false)

// 编辑弹窗
const editOpen = ref(false)
const editClientId = ref('')
const editName = ref('')
const editClientType = ref('confidential')
const editScopes = ref<string[]>([])
const editRedirectUris = ref<string[]>([])
const saving = ref(false)

const statsOpen = ref(false)
const statsLoading = ref(false)
const statsClientId = ref("")
const stats = ref<OAuthClientStatistics | null>(null)

// Secret 展示弹窗
const secretDisplayOpen = ref(false)
const displayedSecret = ref('')

// 删除确认通用状态
const deleteConfirmOpen = ref(false)
const clientToDelete = ref<string | null>(null)

function confirmDelete(clientId: string) {
  clientToDelete.value = clientId
  deleteConfirmOpen.value = true
}

async function executeDelete() {
  if (!clientToDelete.value) return
  actionLoading.value = true
  try {
    await deleteOAuthClient(clientToDelete.value)
    toast.success("已删除")
    await loadClients()
    deleteConfirmOpen.value = false
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
    clientToDelete.value = null
  }
}

async function loadClients() {
  loading.value = true
  try {
    clients.value = await getOAuthClients()
  } catch (e: unknown) {
    toast.error("加载OAuth客户端失败", { description: (e as Error).message })
  } finally {
    loading.value = false
  }
}

const AVAILABLE_SCOPES = [
  { id: 'user:read', label: '基础信息 (user:read)' },
  { id: 'bindings:read', label: '游戏绑定 (bindings:read)' },
  { id: 'game-data:read', label: '游戏数据 (game-data:read)' }
]

function toggleNewScope(scopeId: string, checked: boolean) {
  if (checked) {
    if (!newScopes.value.includes(scopeId)) newScopes.value.push(scopeId)
  } else {
    newScopes.value = newScopes.value.filter(s => s !== scopeId)
  }
}

function toggleEditScope(scopeId: string, checked: boolean) {
  if (checked) {
    if (!editScopes.value.includes(scopeId)) editScopes.value.push(scopeId)
  } else {
    editScopes.value = editScopes.value.filter(s => s !== scopeId)
  }
}

async function handleCreate() {
  const uris = newRedirectUris.value.map(u => u.trim()).filter(Boolean)
  if (!newClientId.value.trim() || !newName.value.trim()) {
    toast.error("客户端ID和名称不能为空")
    return
  }
  if (uris.length === 0) {
    toast.error("请至少填写一个回调URI")
    return
  }
  if (newScopes.value.length === 0) {
    toast.error("请至少选择一个Scope")
    return
  }
  
  creating.value = true
  try {
    const data = await createOAuthClient({
      clientId: newClientId.value.trim(),
      name: newName.value.trim(),
      clientType: newClientType.value as any,
      redirectUris: uris,
      scopes: newScopes.value,
    })
    
    if (data?.clientSecret) {
      displayedSecret.value = data.clientSecret
      secretDisplayOpen.value = true
    } else {
      toast.success("OAuth客户端已创建")
    }

    createOpen.value = false
    newClientId.value = ''
    newName.value = ''
    newScopes.value = ['user:read']
    newRedirectUris.value = ['']
    await loadClients()
  } catch (e: unknown) {
    toast.error("创建失败", { description: (e as Error).message })
  } finally {
    creating.value = false
  }
}

function openEdit(client: OAuthClient) {
  editClientId.value = client.clientId
  editName.value = client.name ?? ''
  editClientType.value = client.clientType ?? 'confidential'
  editScopes.value = [...(client.scopes ?? [])]
  editRedirectUris.value = [...(client.redirectUris ?? (client.redirectUri ? [client.redirectUri] : []))]
  if (editRedirectUris.value.length === 0) editRedirectUris.value = ['']
  editOpen.value = true
}

async function handleSaveEdit() {
  const uris = editRedirectUris.value.map(u => u.trim()).filter(Boolean)
  if (!editName.value.trim()) {
    toast.error("客户端名称不能为空")
    return
  }
  if (uris.length === 0) {
    toast.error("请至少填写一个回调URI")
    return
  }
  if (editScopes.value.length === 0) {
    toast.error("请至少选择一个Scope")
    return
  }
  
  saving.value = true
  try {
    await updateOAuthClient(editClientId.value, {
      name: editName.value.trim(),
      clientType: editClientType.value as any,
      scopes: editScopes.value,
      redirectUris: uris,
    })
    toast.success("已保存")
    editOpen.value = false
    await loadClients()
  } catch (e: unknown) {
    toast.error("保存失败", { description: (e as Error).message })
  } finally {
    saving.value = false
  }
}

async function toggleActive(client: OAuthClient) {
  actionLoading.value = true
  try {
    await setOAuthClientActive(client.clientId, !client.active)
    toast.success(client.active ? "已禁用" : "已启用")
    await loadClients()
  } catch (e: unknown) {
    toast.error("操作失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleRotateSecret(clientId: string) {
  actionLoading.value = true
  try {
    const data = await rotateClientSecret(clientId)
    if (data?.clientSecret) {
      displayedSecret.value = data.clientSecret
      secretDisplayOpen.value = true
    } else {
      toast.success("已成功重新生成 Secret")
    }
  } catch (e: unknown) {
    toast.error("轮换失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleDelete(clientId: string) {
  actionLoading.value = true
  try {
    await deleteOAuthClient(clientId)
    toast.success("已删除")
    await loadClients()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleRestore(clientId: string) {
  actionLoading.value = true
  try {
    await restoreOAuthClient(clientId)
    toast.success("已恢复")
    await loadClients()
  } catch (e: unknown) {
    toast.error("恢复失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function handleRevoke(clientId: string) {
  actionLoading.value = true
  try {
    await revokeOAuthClient(clientId)
    toast.success("已撤销所有授权")
  } catch (e: unknown) {
    toast.error("撤销失败", { description: (e as Error).message })
  } finally {
    actionLoading.value = false
  }
}

async function showStats(clientId: string) {
  statsClientId.value = clientId
  statsOpen.value = true
  statsLoading.value = true
  try {
    stats.value = await getOAuthClientStatistics(clientId)
  } catch (e: unknown) {
    toast.error("加载统计失败", { description: (e as Error).message })
  } finally {
    statsLoading.value = false
  }
}

function copySecret() {
  navigator.clipboard.writeText(displayedSecret.value).then(() => {
    toast.success("已复制到剪贴板")
  }).catch(() => {
    toast.error("复制失败")
  })
}

onMounted(loadClients)
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between">
        <CardTitle class="text-lg">OAuth客户端管理</CardTitle>
        <Dialog v-if="userStore.isSuperAdmin" v-model:open="createOpen">
          <DialogTrigger as-child>
            <Button size="sm">
              <LucidePlus class="w-4 h-4 mr-1" /> 创建客户端
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建OAuth客户端</DialogTitle>
              <DialogDescription>创建一个新的 OAuth2 客户端应用</DialogDescription>
            </DialogHeader>
            <div class="flex flex-col gap-4 py-4">
              <div class="flex flex-col gap-2">
                <Label>客户端ID (Client ID)</Label>
                <Input v-model="newClientId" placeholder="英文字母/数字/杠/下划线组合" />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-2">
                  <Label>客户端名称</Label>
                  <Input v-model="newName" placeholder="显示名称" />
                </div>
                <div class="flex flex-col gap-2">
                  <Label>客户端类型</Label>
                  <Select v-model="newClientType">
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confidential">Confidential (含Secret)</SelectItem>
                      <SelectItem value="public">Public (无Secret)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <Label>授权范围 (Scopes)</Label>
                <div class="flex flex-col gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
                  <div v-for="scope in AVAILABLE_SCOPES" :key="scope.id" class="flex items-center space-x-2">
                    <Checkbox
                      :id="`new-scope-${scope.id}`"
                      :checked="newScopes.includes(scope.id)"
                      @update:checked="(c: boolean) => toggleNewScope(scope.id, c)"
                    />
                    <label
                      :for="`new-scope-${scope.id}`"
                      class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {{ scope.label }}
                    </label>
                  </div>
                </div>
              </div>
              <div class="flex flex-col gap-2">
                <Label>回调URI (Redirect URIs)</Label>
                <div v-for="(_, i) in newRedirectUris" :key="i" class="flex gap-2">
                  <Input v-model="newRedirectUris[i]" placeholder="https://example.com/callback" class="flex-1" />
                  <Button v-if="newRedirectUris.length > 1" variant="ghost" size="sm" @click="newRedirectUris.splice(i, 1)">
                    <LucideX class="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" @click="newRedirectUris.push('')" class="self-start">
                  <LucidePlus class="w-4 h-4 mr-1" /> 添加URI
                </Button>
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
        <template v-if="loading">
          <div class="p-6 flex flex-col gap-3">
            <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
          </div>
        </template>
        <template v-else>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client ID</TableHead>
                <TableHead>名称</TableHead>
                <TableHead class="hidden sm:table-cell">回调URI</TableHead>
                <TableHead>状态</TableHead>
                <TableHead class="hidden md:table-cell">创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="c in clients" :key="c.clientId">
                <TableCell>
                  <div class="flex flex-col gap-1 items-start">
                    <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ c.clientId }}</code>
                    <span v-if="c.clientType === 'public'" class="text-[10px] text-muted-foreground bg-muted border px-1 rounded">Public</span>
                  </div>
                </TableCell>
                <TableCell class="text-sm font-medium">
                  {{ c.name || '—' }}
                </TableCell>
                <TableCell class="hidden sm:table-cell text-muted-foreground text-sm max-w-[200px]">
                  <div v-if="(c.redirectUris?.length ?? 0) > 0" class="flex flex-col gap-0.5">
                    <code v-for="(uri, i) in c.redirectUris" :key="i" class="text-xs truncate block">{{ uri }}</code>
                  </div>
                  <span v-else-if="c.redirectUri">{{ c.redirectUri }}</span>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
                <TableCell>
                  <span :class="[
                    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
                    c.deleted ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                    c.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  ]">
                    <LucideTrash2 v-if="c.deleted" class="w-3.5 h-3.5" />
                    <LucideCheckCircle2 v-else-if="c.active" class="w-3.5 h-3.5" />
                    <LucideBan v-else class="w-3.5 h-3.5" />
                    {{ c.deleted ? '已删除' : c.active ? '启用' : '禁用' }}
                  </span>
                </TableCell>
                <TableCell class="hidden md:table-cell text-muted-foreground text-sm">
                  {{ new Date(c.createdAt).toLocaleDateString('zh-CN') }}
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
                      <DropdownMenuItem @click="openEdit(c)" :disabled="actionLoading">
                        <LucidePencil class="w-4 h-4 mr-2" />
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="showStats(c.clientId)" :disabled="actionLoading">
                        <LucideBarChart3 class="w-4 h-4 mr-2" />
                        访问统计
                      </DropdownMenuItem>
                      <DropdownMenuItem @click="toggleActive(c)" :disabled="actionLoading">
                        <LucidePower class="w-4 h-4 mr-2" />
                        {{ c.active ? '禁用客户端' : '启用客户端' }}
                      </DropdownMenuItem>

                      <template v-if="userStore.isSuperAdmin">
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel class="text-xs text-muted-foreground">危险操作</DropdownMenuLabel>
                        <DropdownMenuItem @click="handleRotateSecret(c.clientId)" :disabled="actionLoading">
                          <LucideKey class="w-4 h-4 mr-2" />
                          轮换 Secret
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleRevoke(c.clientId)" :disabled="actionLoading">
                          <LucideRefreshCw class="w-4 h-4 mr-2" />
                          撤销全部授权
                        </DropdownMenuItem>

                        <DropdownMenuItem v-if="c.deleted" @click="handleRestore(c.clientId)" :disabled="actionLoading">
                          <LucideUndo2 class="w-4 h-4 mr-2" />
                          恢复删除
                        </DropdownMenuItem>
                        <DropdownMenuItem v-else @click="confirmDelete(c.clientId)" class="text-destructive focus:text-destructive" :disabled="actionLoading">
                          <LucideTrash2 class="w-4 h-4 mr-2" />
                          删除客户端
                        </DropdownMenuItem>
                      </template>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              <TableRow v-if="clients.length === 0">
                <TableCell :colspan="6" class="text-center py-8 text-muted-foreground">暂无OAuth客户端</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </template>
      </CardContent>
    </Card>

    <!-- 统计弹窗 -->
    <Dialog v-model:open="statsOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>客户端统计</DialogTitle>
        </DialogHeader>
        <template v-if="statsLoading">
          <Skeleton class="h-20 w-full" />
        </template>
        <template v-else-if="stats">
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold">{{ stats.totalAuthorizations }}</div>
              <div class="text-xs text-muted-foreground">总授权</div>
            </div>
            <div>
              <div class="text-2xl font-bold">{{ stats.activeAuthorizations }}</div>
              <div class="text-xs text-muted-foreground">活跃授权</div>
            </div>
            <div>
              <div class="text-2xl font-bold">{{ stats.last30DaysAuthorizations }}</div>
              <div class="text-xs text-muted-foreground">近30天</div>
            </div>
          </div>
        </template>
      </DialogContent>
    </Dialog>

    <!-- 编辑弹窗 -->
    <Dialog v-model:open="editOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑OAuth客户端</DialogTitle>
          <DialogDescription>
            修改客户端 <code class="bg-muted px-1 py-0.5 rounded text-xs">{{ editClientId }}</code> 的设置。
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-2">
              <Label>客户端名称</Label>
              <Input v-model="editName" placeholder="显示名称" />
            </div>
            <div class="flex flex-col gap-2">
              <Label>客户端类型</Label>
              <Select v-model="editClientType">
                <SelectTrigger>
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confidential">Confidential (含Secret)</SelectItem>
                  <SelectItem value="public">Public (无Secret)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <Label>授权范围 (Scopes)</Label>
            <div class="flex flex-col gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
              <div v-for="scope in AVAILABLE_SCOPES" :key="scope.id" class="flex items-center space-x-2">
                <Checkbox
                  :id="`edit-scope-${scope.id}`"
                  :checked="editScopes.includes(scope.id)"
                  @update:checked="(c: boolean) => toggleEditScope(scope.id, c)"
                />
                <label
                  :for="`edit-scope-${scope.id}`"
                  class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {{ scope.label }}
                </label>
              </div>
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <Label>回调URI</Label>
            <div v-for="(_, i) in editRedirectUris" :key="i" class="flex gap-2">
              <Input v-model="editRedirectUris[i]" placeholder="https://example.com/callback" class="flex-1" />
              <Button v-if="editRedirectUris.length > 1" variant="ghost" size="sm" @click="editRedirectUris.splice(i, 1)">
                <LucideX class="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" @click="editRedirectUris.push('')" class="self-start">
              <LucidePlus class="w-4 h-4 mr-1" /> 添加URI
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editOpen = false">取消</Button>
          <Button :disabled="saving" @click="handleSaveEdit">
            <LucideLoader2 v-if="saving" class="w-4 h-4 mr-1 animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 通用删除确认弹窗 -->
    <AlertDialog v-model:open="deleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>确定要删除OAuth客户端 <strong>{{ clientToDelete }}</strong> 吗？</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="deleteConfirmOpen = false">取消</AlertDialogCancel>
          <AlertDialogAction @click="executeDelete">确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Client Secret 展示弹窗 -->
    <AlertDialog v-model:open="secretDisplayOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle class="text-green-600 dark:text-green-400">凭证生成成功</AlertDialogTitle>
          <AlertDialogDescription>
            请注意：这是 Client Secret <strong>唯一一次</strong> 出现的时刻，系统不会保存其明文。请务必立即复制并将其保存在安全的地方。如果遗失，只能重新生成。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="my-4 flex items-center justify-between gap-2 p-3 bg-muted rounded-md border text-sm font-mono break-all">
          <span class="text-foreground">{{ displayedSecret }}</span>
          <Button variant="ghost" size="sm" @click="copySecret" class="shrink-0 flex items-center">
            <LucideCopy class="w-4 h-4 mr-1" /> 复制
          </Button>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction @click="secretDisplayOpen = false">我已妥善保存</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
