<script setup lang="ts">
import {toast} from "vue-sonner"
import {storeToRefs} from "pinia"
import {useRouter} from "vue-router"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {MoreHorizontal} from "lucide-vue-next"
import type {ColumnDef} from "@tanstack/vue-table"
import {useUserStore} from "@/components/users/data/store"

import {
  h,
  ref,
  reactive,
  computed,
  onMounted
} from "vue"
import {
  FlexRender,
  useVueTable,
  getCoreRowModel,
} from "@tanstack/vue-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"

import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger
} from "@/components/ui/select";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table"
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
  addAuthorizeSocialPlatformAccount,
  removeAuthorizeSocialPlatformAccount
} from "@/components/users/data/api"

const router = useRouter()
const userStore = useUserStore()
const showEditDialog = ref(false)
const editTarget = ref<SocialAuth | null>(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref<SocialAuth | null>(null)
type SocialPlatform = "qq" | "qqbot" | "discord" | "telegram"

export interface SocialAuth {
  id: string
  platform: SocialPlatform
  userId: string
  comment: string
}

const platformLabel: Record<SocialPlatform, string> = {
  qq: "QQ",
  qqbot: "QQ官方Bot",
  discord: "Discord",
  telegram: "Telegram",
}

const {authorizeSocialPlatformInfo, isLoggedIn} = storeToRefs(userStore)

const tableData = computed<SocialAuth[]>(() => {
  const src: any = authorizeSocialPlatformInfo.value
  const arr: any[] = Array.isArray(src) ? src : []
  return arr.map((item: any) => ({
    id: String(item.id),
    platform: item.platform,
    userId: item.userId,
    comment: item.comment ?? item.remark ?? "",
  }))
})


function nextId(): number {
  const src: any = authorizeSocialPlatformInfo.value
  const list: any[] = Array.isArray(src) ? src : []
  if (!list.length) return 1
  const set = new Set<number>(list.map((i: any) => Number(i.id)))
  let i = 1
  while (set.has(i)) i++
  return i
}

function extractAuthorizeList(resp: any): any[] {
  const root = (resp as any) ?? {}
  const updated = root.updatedData ?? root.data?.updatedData ?? root.data ?? root
  const list = updated?.authorizeSocialPlatformInfo ?? updated?.authorize_social_platform_info ?? updated
  return Array.isArray(list) ? list : []
}

function startEdit(row: SocialAuth) {
  editTarget.value = reactive({...row})
  showEditDialog.value = true
}

function startAdd() {
  const id = nextId()
  editTarget.value = reactive({
    id: String(id),
    platform: "qq",
    userId: "",
    comment: "",
  })
  showEditDialog.value = true
}

async function handleEditSave() {
  if (!editTarget.value) return
  try {
    const idNum = Number(editTarget.value.id)
    const resp = await addAuthorizeSocialPlatformAccount(
        idNum,
        editTarget.value.platform,
        editTarget.value.userId,
        editTarget.value.comment
    )

    const normalized = extractAuthorizeList(resp)
    userStore.updateUser({authorizeSocialPlatformInfo: normalized})
    toast.success("已保存授权", {description: "社交平台账号授权信息已更新"})
    showEditDialog.value = false
  } catch (e: any) {
    toast.error("保存失败", {description: e?.message || String(e)})
  }
}

function confirmDelete(row: SocialAuth) {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  try {
    const idNum = Number(deleteTarget.value.id)
    const resp = await removeAuthorizeSocialPlatformAccount(idNum)
    const normalized = extractAuthorizeList(resp)
    userStore.updateUser({authorizeSocialPlatformInfo: normalized})
    toast.success("已删除授权", {description: "该社交平台账号授权已移除"})
    showDeleteDialog.value = false
  } catch (e: any) {
    toast.error("删除失败", {description: e?.message || String(e)})
  }
}

const columns: ColumnDef<SocialAuth>[] = [
  {
    accessorKey: "platform",
    header: "平台",
    cell: ({row}) => platformLabel[row.getValue("platform") as SocialPlatform] ?? row.getValue("platform"),
  },
  {
    accessorKey: "userId",
    header: "账号",
    cell: ({row}) => row.getValue("userId"),
  },
  {
    accessorKey: "comment",
    header: "备注",
    cell: ({row}) => row.getValue("comment"),
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
    return tableData.value
  },
  columns,
  getCoreRowModel: getCoreRowModel(),
})

onMounted(() => {
  if (!isLoggedIn.value) {
    router.push("/user/login")
  }
})
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <div class="flex items-center justify-between gap-2">
        <div>
          <CardTitle>授权社交平台查询</CardTitle>
          <CardDescription>管理您的Haruki工具箱账号授权可查询游戏账号信息的社交平台</CardDescription>
        </div>
        <Button size="sm" @click="startAdd">新增授权</Button>
      </div>
    </CardHeader>
    <CardContent>
      <div class="w-full flex justify-center">
        <div class="rounded-md border w-full max-w-sm">
          <Table>
            <TableHeader>
              <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                <TableHead
                    v-for="header in headerGroup.headers"
                    :key="header.id"
                    class="text-center"
                >
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
                  <TableCell
                      v-for="cell in row.getVisibleCells()"
                      :key="cell.id"
                      class="text-center"
                  >
                    <FlexRender
                        :render="cell.column.columnDef.cell"
                        :props="cell.getContext()"
                    />
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
      </div>
    </CardContent>
  </Card>

  <Dialog v-model:open="showEditDialog">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>编辑社交平台授权</DialogTitle>
        <DialogDescription>修改授权可查询信息的社交平台账号</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="platform" class="text-right">平台</Label>
          <Select v-model="editTarget.platform">
            <SelectTrigger
                id="platform"
                class="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <SelectValue placeholder="请选择社交平台"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qq">QQ</SelectItem>
              <SelectItem value="qqbot">QQ官方Bot</SelectItem>
              <SelectItem value="discord">Discord</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="account" class="text-right">账号</Label>
          <Input id="account" v-model="editTarget.userId" class="col-span-3"/>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="remark" class="text-right">备注</Label>
          <Input id="remark" v-model="editTarget.comment" class="col-span-3"/>
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
          确认删除 {{ deleteTarget?.platform }} {{ deleteTarget?.userId }} 吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction class="bg-destructive" @click="handleDelete">删除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>