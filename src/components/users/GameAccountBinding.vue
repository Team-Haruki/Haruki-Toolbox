<script setup lang="ts">
import {ref, reactive, h} from "vue"
import type {ColumnDef} from "@tanstack/vue-table"
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {Label} from "@/components/ui/label"
import {Switch} from "@/components/ui/switch"
import {MoreHorizontal} from "lucide-vue-next"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

interface GameAccount {
  id: string
  server: string
  uid: string
  verified: boolean
  allowApi: boolean
  allow8823: boolean
  allowSakura: boolean
  allowResona: boolean
}

const showVerifyDialog = ref(false)
const generatedCode = ref("")
const showEditDialog = ref(false)
const editTarget = ref<GameAccount | null>(null)
const verifying = ref(false)
const verifySuccess = ref<null | boolean>(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref<GameAccount | null>(null)
const data = ref<GameAccount[]>([
  {
    id: "1",
    server: "日服",
    uid: "114514",
    verified: false,
    allowApi: true,
    allow8823: false,
    allowSakura: false,
    allowResona: true,
  },
  {
    id: "2",
    server: "国服",
    uid: "1919810",
    verified: true,
    allowApi: true,
    allow8823: true,
    allowSakura: false,
    allowResona: false,
  },
])

async function submitVerification() {
  verifying.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟请求
    verifySuccess.value = true
  } catch (e) {
    verifySuccess.value = false
  } finally {
    verifying.value = false
  }
}

function handleEditSave() {
  if (editTarget.value) {
    const idx = data.value.findIndex(d => d.id === editTarget.value!.id)
    if (idx !== -1) data.value[idx] = {...editTarget.value}
    showEditDialog.value = false
  }
}

function handleDelete() {
  if (deleteTarget.value) {
    data.value = data.value.filter(d => d.id !== deleteTarget.value!.id)
    showDeleteDialog.value = false
  }
}

function startEdit(row: GameAccount) {
  editTarget.value = reactive({...row})
  showEditDialog.value = true
}

function confirmDelete(row: GameAccount) {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

function handleVerify() {
  generatedCode.value = "123456"
  showVerifyDialog.value = true
}

const columns: ColumnDef<GameAccount>[] = [
  {accessorKey: "id", header: "ID"},
  {accessorKey: "server", header: "区服"},
  {accessorKey: "uid", header: "UID"},
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
        <CardTitle>游戏账号绑定</CardTitle>
        <CardDescription>
          管理您的 Haruki 工具箱账号绑定的《世界计划: 缤纷舞台 feat. 初音未来》游戏账号
        </CardDescription>
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
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑账号</DialogTitle>
        </DialogHeader>
        <div class="grid gap-6 py-4">
          <div>
            <h3 class="font-semibold mb-2">账号基本信息</h3>
            <div class="grid gap-3">
              <div class="flex items-center gap-4">
                <Label class="w-24">ID</Label>
                <Input v-model="editTarget!.id" disabled class="flex-1"/>
              </div>
              <div class="flex items-center gap-4">
                <Label class="w-24">区服</Label>
                <Input v-model="editTarget!.server" :disabled="editTarget?.verified" class="flex-1"/>
              </div>
              <div class="flex items-center gap-4">
                <Label class="w-24">UID</Label>
                <Input v-model="editTarget!.uid" :disabled="editTarget?.verified" class="flex-1"/>
              </div>
              <div class="flex items-center gap-4">
                <Label class="w-24">验证状态</Label>
                <div class="flex-1">
                  <span v-if="editTarget?.verified" class="block text-green-600">已验证</span>
                  <Button v-else variant="outline" @click="handleVerify">验证</Button>
                </div>
              </div>
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <Card class="p-3">
              <div class="flex items-center gap-3">
                <Switch v-model:checked="editTarget!.allowApi"/>
                <div class="flex-1">
                  <Label class="font-semibold">公开API访问</Label>
                  <p class="text-sm text-muted-foreground">允许Haruki工具箱公开API访问</p>
                </div>
              </div>
            </Card>
            <Card class="p-3">
              <div class="flex items-center gap-3">
                <Switch v-model:checked="editTarget!.allow8823"/>
                <div class="flex-1">
                  <Label class="font-semibold">上传至烤森Bot</Label>
                  <p class="text-sm text-muted-foreground">允许上传数据到烤森Bot</p>
                </div>
              </div>
            </Card>
            <Card class="p-3">
              <div class="flex items-center gap-3">
                <Switch v-model:checked="editTarget!.allowSakura"/>
                <div class="flex-1">
                  <Label class="font-semibold">上传至SakuraBot</Label>
                  <p class="text-sm text-muted-foreground">允许上传数据到SakuraBot</p>
                </div>
              </div>
            </Card>
            <Card class="p-3">
              <div class="flex items-center gap-3">
                <Switch v-model:checked="editTarget!.allowResona"/>
                <div class="flex-1">
                  <Label class="font-semibold">上传至ResonaBot</Label>
                  <p class="text-sm text-muted-foreground">允许上传数据到ResonaBot</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button @click="handleEditSave">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            确认删除区服 {{ deleteTarget?.server }} 的 UID {{ deleteTarget?.uid }} 吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="handleDelete">删除</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Dialog v-model:open="showVerifyDialog">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>验证码生成成功</DialogTitle>
          <DialogDescription>请在游戏内输入以下验证码完成验证</DialogDescription>
        </DialogHeader>
        <div class="text-center text-2xl font-bold py-4">
          {{ generatedCode }}
        </div>
        <DialogFooter class="flex justify-between">
          <DialogClose as-child>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button :disabled="verifying" @click="submitVerification">
            {{ verifying ? "验证中..." : "验证" }}
          </Button>
        </DialogFooter>
        <p v-if="verifySuccess === true" class="text-green-600 text-center mt-2">
          绑定成功！
        </p>
        <p v-else-if="verifySuccess === false" class="text-red-600 text-center mt-2">
          验证失败，请重试
        </p>
      </DialogContent>
    </Dialog>
  </div>


</template>