<script setup lang="ts">
import { ref, h, reactive } from "vue"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-vue-next"
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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import type { ColumnDef } from "@tanstack/vue-table"
import { FlexRender, getCoreRowModel, useVueTable } from "@tanstack/vue-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"



const showEditDialog = ref(false)
const editTarget = ref<QQAuth | null>(null)
const showDeleteDialog = ref(false)
const deleteTarget = ref<QQAuth | null>(null)
const data = ref<QQAuth[]>([
  { id: "1", qq: "123456789", remark: "主账号" },
  { id: "2", qq: "987654321", remark: "小号" },
])

export interface QQAuth {
  id: string
  qq: string
  remark: string
}

function startEdit(row: QQAuth) {
  editTarget.value = reactive({ ...row })
  showEditDialog.value = true
}

function handleEditSave() {
  if (editTarget.value) {
    const index = data.value.findIndex((d) => d.id === editTarget.value?.id)
    if (index !== -1) {
      data.value[index] = { ...editTarget.value }
    }
    showEditDialog.value = false
  }
}

function confirmDelete(row: QQAuth) {
  deleteTarget.value = row
  showDeleteDialog.value = true
}

function handleDelete() {
  if (deleteTarget.value) {
    data.value = data.value.filter((d) => d.id !== deleteTarget.value?.id)
    showDeleteDialog.value = false
  }
}

const columns: ColumnDef<QQAuth>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => row.getValue("id"),
  },
  {
    accessorKey: "qq",
    header: "QQ号",
    cell: ({ row }) => row.getValue("qq"),
  },
  {
    accessorKey: "remark",
    header: "备注",
    cell: ({ row }) => row.getValue("remark"),
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) =>
        h(DropdownMenu, null, {
          default: () => [
            h(DropdownMenuTrigger, { asChild: true }, () =>
                h(Button, { variant: "ghost", size: "icon" }, () =>
                    h(MoreHorizontal, { class: "h-4 w-4" })
                )
            ),
            h(DropdownMenuContent, { align: "end" }, () => [
              h(DropdownMenuItem, { onClick: () => startEdit(row.original) }, () => "编辑"),
              h(DropdownMenuItem, { onClick: () => confirmDelete(row.original) }, () => "删除"),
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
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle>授权QQ查询</CardTitle>
      <CardDescription>
        管理您的Haruki工具箱账号授权可查询游戏账号信息的QQ号
      </CardDescription>
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
        <DialogTitle>编辑 QQ 授权</DialogTitle>
        <DialogDescription>修改 QQ 信息，ID 不可更改</DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="id" class="text-right">ID</Label>
          <Input id="id" v-model="editTarget.id" class="col-span-3" disabled />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="qq" class="text-right">QQ号</Label>
          <Input id="qq" v-model="editTarget.qq" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="remark" class="text-right">备注</Label>
          <Input id="remark" v-model="editTarget.remark" class="col-span-3" />
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
          确认删除 QQ {{ deleteTarget?.qq }} 吗？此操作无法撤销。
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction @click="handleDelete">删除</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>