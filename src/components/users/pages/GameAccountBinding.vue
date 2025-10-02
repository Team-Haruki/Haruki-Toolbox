<script setup lang="ts">
import {toast} from "vue-sonner";
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Switch} from "@/components/ui/switch"
import {MoreHorizontal} from "lucide-vue-next"
import type {ColumnDef} from "@tanstack/vue-table"
import {logout} from "@/components/users/data/api"
import {useUserStore} from "@/components/users/data/store";

import {
  h,
  ref,
  watch,
  computed,
  reactive,
  onMounted
} from "vue"
import {
  FlexRender,
  useVueTable,
  getCoreRowModel,
} from "@tanstack/vue-table"
import {
  Select,
  SelectItem,
  SelectLabel,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select"
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader
} from "@/components/ui/table"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card";

import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu"

import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {
  removeGameAccount,
  addOrUpdateGameAccount,
  generateGameAccountVerificationCode
} from "@/components/users/data/api"

interface GameAccount {
  server: string
  userId: number
  verified: boolean
  suite: {
    allowPublicApi: boolean
    allow8823: boolean
    allowSakura: boolean
    allowResona: boolean
  }
  mysekai: {
    allowPublicApi: boolean
    allowFixtureApi: boolean
    allow8823: boolean
    allowResona: boolean
  }
}

const router = useRouter()
const userStore = useUserStore()
const isCreating = ref(false)
const generatedCode = ref("")
const showEditDialog = ref(false)
const showVerifyDialog = ref(false)
const showDeleteDialog = ref(false)
const userIdInput = ref<string>("")
const verificationTriggered = ref(false)
const verificationAcknowledged = ref(false)
const editTarget = ref<GameAccount | null>(null)
const deleteTarget = ref<GameAccount | null>(null)
const regionLabels: Record<string, string> = {
  jp: "日服",
  en: "国际服",
  tw: "台服",
  kr: "韩服",
  cn: "国服",
}
const regionOptions = [
  {value: "jp", label: regionLabels.jp},
  {value: "en", label: regionLabels.en},
  {value: "tw", label: regionLabels.tw},
  {value: "kr", label: regionLabels.kr},
  {value: "cn", label: regionLabels.cn},
]


onMounted(() => {
  if (!userStore.isLoggedIn) {
    toast.warning("请先登录")
    logout().finally(() => {
      router.push("/user/login")
    })
  }
})

watch(
    () => userStore.isLoggedIn,
    (isLoggedIn) => {
      if (!isLoggedIn) {
        logout().finally(() => {
          router.push("/user/login")
        })
      }
    }
)


function startAdd() {
  isCreating.value = true
  verificationTriggered.value = false
  verificationAcknowledged.value = false
  generatedCode.value = ""
  editTarget.value = reactive({
    server: "jp",
    userId: 0,
    verified: false,
    suite: {
      allowPublicApi: false,
      allowSakura: false,
      allow8823: false,
      allowResona: false,
    },
    mysekai: {
      allowPublicApi: false,
      allowFixtureApi: false,
      allow8823: false,
      allowResona: false,
    },
  })
  userIdInput.value = ""
  showEditDialog.value = true
}

const data = computed(() => Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : [])

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    const resp = await removeGameAccount(deleteTarget.value.server as any, String(deleteTarget.value.userId))
    const updated = (resp as any)?.updatedData?.gameAccountBindings
    if (Array.isArray(updated)) {
      userStore.updateUser({gameAccountBindings: updated})
    }
    toast.success("删除成功", {description: "账号已解除绑定"})
  } catch (e: any) {
    toast.error("删除失败", {description: e?.message ?? String(e)})
  } finally {
    showDeleteDialog.value = false
  }
}

async function handleEditSave() {
  if (!editTarget.value) return
  if (isCreating.value && !verificationTriggered.value) {
    toast.error("保存失败", {description: "新增账号前请先点击“验证”生成验证码，并在游戏内完成设置。"})
    return
  }
  try {
    const server = editTarget.value.server as any
    const gameUidStr = userIdInput.value?.trim() ?? ""
    if (!/^\d+$/.test(gameUidStr)) {
      toast.error("保存失败", {description: "游戏UID必须是纯数字"})
      return
    }

    // If CN and not allowed, force-hide MySekai in payload (all false)
    const mysekaiPayload = (server === 'cn' && userStore.allowCNMysekai === false)
        ? {allowPublicApi: false, allowFixtureApi: false, allow8823: false, allowResona: false}
        : editTarget.value.mysekai ?? {
      allowPublicApi: false,
      allowFixtureApi: false,
      allow8823: false,
      allowResona: false
    }

    const suitePayload = editTarget.value.suite ?? {
      allowPublicApi: false,
      allowSakura: false,
      allow8823: false,
      allowResona: false
    }

    const resp = await (addOrUpdateGameAccount as any)(
        server,
        gameUidStr,
        gameUidStr,
        {
          suite: suitePayload as any,
          mysekai: mysekaiPayload as any,
        }
    )

    const updated = (resp as any)?.updatedData?.gameAccountBindings
    if (Array.isArray(updated)) {
      userStore.updateUser({gameAccountBindings: updated})
    }
    toast.success("保存成功", {description: "账号设置已更新"})
    showEditDialog.value = false
  } catch (e: any) {
    toast.error("保存失败", {description: e?.message ?? String(e)})
  }
}

async function handleVerify() {
  const uidStr = userIdInput.value?.trim()
  if (!/^\d+$/.test(uidStr || "")) {
    toast.error("无法生成验证码", {description: "游戏UID必须是纯数字"})
    return
  }
  if (!editTarget.value?.server || !uidStr) {
    toast.error("无法生成验证码", {description: "请先选择区服并填写游戏UID"})
    return
  }
  try {
    const resp = await generateGameAccountVerificationCode(editTarget.value.server as any, uidStr)
    generatedCode.value = (resp as any)?.oneTimePassword ?? ""
    if (!generatedCode.value) {
      toast.error("生成失败", {description: "未返回验证码"})
      return
    }
    showVerifyDialog.value = true
    verificationTriggered.value = true
  } catch (e: any) {
    toast.error("生成失败", {description: e?.message ?? String(e)})
  }
}

function startEdit(row: GameAccount) {
  isCreating.value = false
  verificationTriggered.value = false
  verificationAcknowledged.value = false
  generatedCode.value = ""
  editTarget.value = reactive({...row})
  userIdInput.value = String(row.userId)
  showEditDialog.value = true
}

function confirmDelete(row: GameAccount) {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

const columns: ColumnDef<GameAccount>[] = [
  {accessorKey: "server", header: "区服", cell: ({row}) => regionLabels[row.original.server] ?? row.original.server},
  {accessorKey: "userId", header: "游戏UID", cell: ({row}) => row.original.userId},
  {
    accessorKey: "verified",
    header: "验证状态",
    cell: ({row}) => row.original.verified ? "已验证" : "未验证",
  },
  {
    id: "actions",
    header: "操作",
    cell: ({row}) =>
        h(DropdownMenu, null, {
          default: () => [
            h(DropdownMenuTrigger, {asChild: true}, () =>
                h(Button, {variant: "ghost", size: "icon"}, () =>
                    h(MoreHorizontal, {class: "h-4 w-4"})
                )
            ),
            h(DropdownMenuContent, {align: "end"}, () => [
              h(DropdownMenuItem, {onClick: () => startEdit(row.original)}, () => "编辑"),
              h(DropdownMenuItem, {onClick: () => confirmDelete(row.original)}, () => "删除"),
            ]),
          ],
        }),
  },
]

const table = useVueTable({
  get data() {
    return data.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center px-0 py-4">
    <Card class="w-full max-w-2xl">
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>游戏账号绑定</CardTitle>
            <CardDescription>
              管理您的 Haruki 工具箱账号绑定的《世界计划: 缤纷舞台 feat. 初音未来》游戏账号
            </CardDescription>
          </div>
          <Button @click="startAdd">绑定新账号</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="w-full rounded-md border">
          <Table>
            <TableHeader>
              <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <TableHead v-for="header in headerGroup.headers" :key="header.id" class="text-center">
                  <FlexRender
                      v-if="!header.isPlaceholder"
                      :render="header.column.columnDef.header"
                      :props="header.getContext()"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <template v-if="table.getRowModel().rows?.length">
                <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                  <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id" class="text-center">
                    <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()"/>
                  </TableCell>
                </TableRow>
              </template>
              <TableRow v-else>
                <TableCell :colspan="columns.length" class="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="showEditDialog">
      <DialogContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑账号</DialogTitle>
        </DialogHeader>
        <div class="grid gap-6 py-4">
          <Card class="p-4">
            <h3 class="font-semibold mb-1">账号基本信息</h3>
            <div class="grid gap-3">
              <div class="flex items-center gap-4">
                <Label class="w-24">区服</Label>
                <div class="flex-1">
                  <Select v-model="editTarget!.server">
                    <SelectTrigger class="w-full" :disabled="editTarget?.verified">
                      <SelectValue placeholder="选择区服"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>区服</SelectLabel>
                        <SelectItem v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
                          {{ opt.label }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <Label class="w-24">游戏UID</Label>
                <Input
                    v-model="userIdInput"
                    :disabled="editTarget?.verified"
                    class="flex-1"
                    type="text"
                    pattern="\\d*"
                />
              </div>
              <div class="flex items-center gap-4">
                <Label class="w-24">验证状态</Label>
                <div class="flex-1">
                  <span
                      v-if="editTarget?.verified"
                      class="px-2 py-1 rounded text-xs bg-green-100 text-green-700"
                  >已验证</span>
                  <Button v-else variant="outline" @click="handleVerify">验证</Button>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Suite数据设置</CardTitle>
              <CardDescription>
                管理您上传的游戏账号的Suite数据设置
              </CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 sm:grid-cols-2">
              <Card class="p-3">
                <div class="flex items-center gap-3">
                  <Switch v-model="editTarget!.suite.allowPublicApi"/>
                  <div class="flex-1">
                    <Label class="font-semibold">允许公开API访问</Label>
                    <p class="text-sm text-muted-foreground">允许Suite数据通过Haruki工具箱公开API访问</p>
                  </div>
                </div>
              </Card>
              <Card class="p-3">
                <div class="flex items-center gap-3">
                  <Switch v-model="editTarget!.suite.allowSakura"/>
                  <div class="flex-1">
                    <Label class="font-semibold">允许上传至SakuraBot</Label>
                    <p class="text-sm text-muted-foreground">允许Suite数据上传到SakuraBot</p>
                  </div>
                </div>
              </Card>
              <Card class="p-3">
                <div class="flex items-center gap-3">
                  <Switch v-model="editTarget!.suite.allow8823"/>
                  <div class="flex-1">
                    <Label class="font-semibold">允许上传至烤森Bot</Label>
                    <p class="text-sm text-muted-foreground">允许Suite数据上传到烤森Bot</p>
                  </div>
                </div>
              </Card>
              <Card class="p-3">
                <div class="flex items-center gap-3">
                  <Switch v-model="editTarget!.suite.allowResona"/>
                  <div class="flex-1">
                    <Label class="font-semibold">允许上传至ResonaBot</Label>
                    <p class="text-sm text-muted-foreground">允许Suite数据上传到ResonaBot</p>
                  </div>
                </div>
              </Card>
            </CardContent>
          </Card>

          <template v-if="userStore.allowCNMysekai || editTarget?.server !== 'cn'">
            <Card>
              <CardHeader>
                <CardTitle>MySekai数据设置</CardTitle>
                <CardDescription>
                  管理您上传的游戏账号的MySekai数据设置
                </CardDescription>
              </CardHeader>
              <CardContent class="grid gap-4 sm:grid-cols-2">
                <Card class="p-3">
                  <div class="flex items-center gap-3">
                    <Switch v-model="editTarget!.mysekai.allowPublicApi"/>
                    <div class="flex-1">
                      <Label class="font-semibold">允许公开API访问</Label>
                      <p class="text-sm text-muted-foreground">允许MySekai数据通过Haruki工具箱公开API访问</p>
                    </div>
                  </div>
                </Card>
                <Card class="p-3">
                  <div class="flex items-center gap-3">
                    <Switch v-model="editTarget!.mysekai.allowFixtureApi"/>
                    <div class="flex-1">
                      <Label class="font-semibold">允许家具共享API</Label>
                      <p class="text-sm text-muted-foreground">允许MySekai账号UID出现在家具共享API</p>
                    </div>
                  </div>
                </Card>
                <Card class="p-3">
                  <div class="flex items-center gap-3">
                    <Switch v-model="editTarget!.mysekai.allow8823"/>
                    <div class="flex-1">
                      <Label class="font-semibold">允许上传至烤森Bot</Label>
                      <p class="text-sm text-muted-foreground">允许MySekai数据上传到烤森Bot</p>
                    </div>
                  </div>
                </Card>
                <Card class="p-3">
                  <div class="flex items-center gap-3">
                    <Switch v-model="editTarget!.mysekai.allowResona"/>
                    <div class="flex-1">
                      <Label class="font-semibold">允许上传至ResonaBot</Label>
                      <p class="text-sm text-muted-foreground">允许MySekai数据上传到ResonaBot</p>
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </template>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button @click="handleEditSave" :disabled="isCreating && !verificationTriggered">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确认删除{{ deleteTarget?.server }}的User ID{{ deleteTarget?.userId }} 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-foreground" @click="handleDelete">删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog v-model:open="showVerifyDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>验证码生成成功</DialogTitle>
          <DialogDescription>请在游戏内的个性签名中输入以下验证码完成验证</DialogDescription>
        </DialogHeader>
        <div class="text-center text-2xl font-bold py-4 select-all">
          {{ generatedCode }}
        </div>
        <DialogDescription>请务必完整输入进个性签名，不要移除斜杠</DialogDescription>
        <DialogFooter>
          <DialogClose as-child>
            <Button @click="verificationAcknowledged = true">我已输入，确定</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>


</template>