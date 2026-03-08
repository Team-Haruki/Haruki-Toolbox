<script setup lang="ts">
import { ref, onMounted } from "vue"
import { toast } from "vue-sonner"
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
  LucidePlus,
  LucideTrash2,
  LucidePencil,
  LucideLoader2,
} from "lucide-vue-next"
import {
  getFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
  getFriendGroups,
  createFriendGroup,
  deleteFriendGroup,
  createFriendGroupItem,
  updateFriendGroupItem,
  deleteFriendGroupItem,
} from "@/api/admin/content"
import type { AdminFriendLink, AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"

// 友链
const linksLoading = ref(true)
const links = ref<AdminFriendLink[]>([])
const linkDialogOpen = ref(false)
const editingLink = ref<AdminFriendLink | null>(null)
const linkForm = ref({ name: "", description: "", avatar: "", url: "", tags: "" })
const linkSaving = ref(false)

// 友链分组
const groupsLoading = ref(true)
const groups = ref<AdminFriendGroup[]>([])
const groupDialogOpen = ref(false)
const groupName = ref("")
const groupSaving = ref(false)

// 分组项
const itemDialogOpen = ref(false)
const editingItem = ref<AdminFriendGroupItem | null>(null)
const itemGroupId = ref("")
const itemForm = ref({ name: "", avatar: "", bg: "", groupInfo: "", detail: "" })
const itemSaving = ref(false)

async function loadLinks() {
  linksLoading.value = true
  try {
    links.value = await getFriendLinks()
  } catch (e: unknown) {
    toast.error("加载友链失败", { description: (e as Error).message })
  } finally {
    linksLoading.value = false
  }
}

async function loadGroups() {
  groupsLoading.value = true
  try {
    groups.value = await getFriendGroups()
  } catch (e: unknown) {
    toast.error("加载友链分组失败", { description: (e as Error).message })
  } finally {
    groupsLoading.value = false
  }
}

// ===== 友链操作 =====

function openCreateLink() {
  editingLink.value = null
  linkForm.value = { name: "", description: "", avatar: "", url: "", tags: "" }
  linkDialogOpen.value = true
}

function openEditLink(link: AdminFriendLink) {
  editingLink.value = link
  linkForm.value = {
    name: link.name,
    description: link.description,
    avatar: link.avatar,
    url: link.url,
    tags: (link.tags || []).join(", "),
  }
  linkDialogOpen.value = true
}

async function saveLink() {
  if (!linkForm.value.name.trim() || !linkForm.value.url.trim()) {
    toast.error("请填写名称和URL")
    return
  }
  linkSaving.value = true
  try {
    const data = {
      name: linkForm.value.name.trim(),
      description: linkForm.value.description.trim(),
      avatar: linkForm.value.avatar.trim(),
      url: linkForm.value.url.trim(),
      tags: linkForm.value.tags.split(",").map(t => t.trim()).filter(Boolean),
    }
    if (editingLink.value) {
      await updateFriendLink(editingLink.value.id, data)
      toast.success("友链已更新")
    } else {
      await createFriendLink(data)
      toast.success("友链已创建")
    }
    linkDialogOpen.value = false
    await loadLinks()
  } catch (e: unknown) {
    toast.error("保存失败", { description: (e as Error).message })
  } finally {
    linkSaving.value = false
  }
}

async function handleDeleteLink(id: string) {
  try {
    await deleteFriendLink(id)
    toast.success("已删除友链")
    await loadLinks()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

// ===== 友链分组操作 =====

async function handleCreateGroup() {
  if (!groupName.value.trim()) {
    toast.error("请输入分组名称")
    return
  }
  groupSaving.value = true
  try {
    await createFriendGroup({ group: groupName.value.trim() })
    toast.success("分组已创建")
    groupDialogOpen.value = false
    groupName.value = ""
    await loadGroups()
  } catch (e: unknown) {
    toast.error("创建失败", { description: (e as Error).message })
  } finally {
    groupSaving.value = false
  }
}

async function handleDeleteGroup(groupId: number | string) {
  try {
    await deleteFriendGroup(String(groupId))
    toast.success("分组已删除")
    await loadGroups()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

// ===== 分组项操作 =====

function openCreateItem(groupId: number | string) {
  editingItem.value = null
  itemGroupId.value = String(groupId)
  itemForm.value = { name: "", avatar: "", bg: "", groupInfo: "", detail: "" }
  itemDialogOpen.value = true
}

function openEditItem(groupId: number | string, item: AdminFriendGroupItem) {
  editingItem.value = item
  itemGroupId.value = String(groupId)
  itemForm.value = {
    name: item.name,
    avatar: item.avatar,
    bg: item.bg,
    groupInfo: item.groupInfo || "",
    detail: item.detail || "",
  }
  itemDialogOpen.value = true
}

async function saveItem() {
  if (!itemForm.value.name.trim()) {
    toast.error("请填写名称")
    return
  }
  itemSaving.value = true
  try {
    const data = {
      name: itemForm.value.name.trim(),
      avatar: itemForm.value.avatar.trim(),
      bg: itemForm.value.bg.trim(),
      groupInfo: itemForm.value.groupInfo.trim() || undefined,
      detail: itemForm.value.detail.trim() || undefined,
    }
    if (editingItem.value) {
      await updateFriendGroupItem(itemGroupId.value, String(editingItem.value.id), data)
      toast.success("项目已更新")
    } else {
      await createFriendGroupItem(itemGroupId.value, data)
      toast.success("项目已创建")
    }
    itemDialogOpen.value = false
    await loadGroups()
  } catch (e: unknown) {
    toast.error("保存失败", { description: (e as Error).message })
  } finally {
    itemSaving.value = false
  }
}

async function handleDeleteItem(groupId: number | string, itemId: number | string) {
  try {
    await deleteFriendGroupItem(String(groupId), String(itemId))
    toast.success("项目已删除")
    await loadGroups()
  } catch (e: unknown) {
    toast.error("删除失败", { description: (e as Error).message })
  }
}

onMounted(() => { loadLinks(); loadGroups() })
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Tabs default-value="links">
      <TabsList>
        <TabsTrigger value="links">友情链接管理</TabsTrigger>
        <TabsTrigger value="groups">推荐群聊管理</TabsTrigger>
      </TabsList>

      <!-- 友链管理 -->
      <TabsContent value="links">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle class="text-lg">友情链接管理</CardTitle>
            <Button size="sm" @click="openCreateLink">
              <LucidePlus class="w-4 h-4 mr-1" /> 添加友情链接
            </Button>
          </CardHeader>
          <CardContent class="p-0">
            <template v-if="linksLoading">
              <div class="p-6 flex flex-col gap-3">
                <Skeleton v-for="i in 3" :key="i" class="h-12 w-full" />
              </div>
            </template>
            <template v-else>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead class="hidden sm:table-cell">URL</TableHead>
                    <TableHead class="hidden md:table-cell">标签</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="link in links" :key="link.id">
                    <TableCell class="font-medium">{{ link.name }}</TableCell>
                    <TableCell class="hidden sm:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                      {{ link.url }}
                    </TableCell>
                    <TableCell class="hidden md:table-cell">
                      <div class="flex gap-1 flex-wrap">
                        <span v-for="tag in (link.tags || [])" :key="tag" class="bg-muted px-1.5 py-0.5 rounded text-xs">
                          {{ tag }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex gap-1">
                        <Button variant="ghost" size="sm" @click="openEditLink(link)">
                          <LucidePencil class="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger as-child>
                            <Button variant="ghost" size="sm" class="text-destructive">
                              <LucideTrash2 class="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>确认删除</AlertDialogTitle>
                              <AlertDialogDescription>确定删除友链 {{ link.name }}？</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>取消</AlertDialogCancel>
                              <AlertDialogAction @click="handleDeleteLink(link.id)">确认</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="links.length === 0">
                    <TableCell :colspan="4" class="text-center py-8 text-muted-foreground">暂无友情链接</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </template>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- 友链分组 -->
      <TabsContent value="groups">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <CardTitle class="text-lg">推荐群聊管理</CardTitle>
            <Dialog v-model:open="groupDialogOpen">
              <DialogTrigger as-child>
                <Button size="sm">
                  <LucidePlus class="w-4 h-4 mr-1" /> 创建群聊分组
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建分组</DialogTitle>
                </DialogHeader>
                <div class="flex flex-col gap-2 py-4">
                  <Label>分组名称</Label>
                  <Input v-model="groupName" placeholder="分组名称" />
                </div>
                <DialogFooter>
                  <Button :disabled="groupSaving" @click="handleCreateGroup">
                    <LucideLoader2 v-if="groupSaving" class="w-4 h-4 mr-1 animate-spin" />
                    创建
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <template v-if="groupsLoading">
              <Skeleton v-for="i in 3" :key="i" class="h-20 w-full mb-3" />
            </template>
            <template v-else-if="groups.length > 0">
              <div class="flex flex-col gap-4">
                <Card v-for="group in groups" :key="group.id" class="border">
                  <CardHeader class="flex flex-row items-center justify-between py-3">
                    <CardTitle class="text-base">{{ group.group }}</CardTitle>
                    <div class="flex gap-1">
                      <Button variant="outline" size="sm" @click="openCreateItem(group.id)">
                        <LucidePlus class="w-3 h-3 mr-1" /> 添加项目
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger as-child>
                          <Button variant="ghost" size="sm" class="text-destructive">
                            <LucideTrash2 class="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除分组</AlertDialogTitle>
                            <AlertDialogDescription>确定删除群聊分组 {{ group.group }}？分组内的所有项目也会被删除。</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction @click="handleDeleteGroup(String(group.id))">确认</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent v-if="group.groupList && group.groupList.length > 0" class="pt-0">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div v-for="item in group.groupList" :key="item.id" class="flex items-center justify-between p-2 border rounded-md">
                        <span class="text-sm font-medium truncate">{{ item.name }}</span>
                        <div class="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" @click="openEditItem(group.id, item)">
                            <LucidePencil class="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" class="text-destructive" @click="handleDeleteItem(String(group.id), String(item.id))">
                            <LucideTrash2 class="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardContent v-else class="pt-0">
                    <p class="text-sm text-muted-foreground">暂无群聊项目</p>
                  </CardContent>
                </Card>
              </div>
            </template>
            <template v-else>
              <p class="text-center text-muted-foreground py-8">暂无群聊分组</p>
            </template>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- 友链编辑弹窗 -->
    <Dialog v-model:open="linkDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingLink ? '编辑友情链接' : '添加友情链接' }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-3 py-4">
          <div class="flex flex-col gap-1.5">
            <Label>名称</Label>
            <Input v-model="linkForm.name" placeholder="站点名称" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>描述</Label>
            <Input v-model="linkForm.description" placeholder="简短描述" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>头像URL</Label>
            <Input v-model="linkForm.avatar" placeholder="https://..." />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>链接URL</Label>
            <Input v-model="linkForm.url" placeholder="https://..." />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>标签（逗号分隔）</Label>
            <Input v-model="linkForm.tags" placeholder="博客, 技术" />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="linkSaving" @click="saveLink">
            <LucideLoader2 v-if="linkSaving" class="w-4 h-4 mr-1 animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 分组项编辑弹窗 -->
    <Dialog v-model:open="itemDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ editingItem ? '编辑项目' : '添加项目' }}</DialogTitle>
        </DialogHeader>
        <div class="flex flex-col gap-3 py-4">
          <div class="flex flex-col gap-1.5">
            <Label>名称</Label>
            <Input v-model="itemForm.name" placeholder="项目名称" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>头像URL</Label>
            <Input v-model="itemForm.avatar" placeholder="https://..." />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>背景图URL</Label>
            <Input v-model="itemForm.bg" placeholder="https://..." />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>群组信息</Label>
            <Input v-model="itemForm.groupInfo" placeholder="可选" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>详情</Label>
            <Input v-model="itemForm.detail" placeholder="可选" />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="itemSaving" @click="saveItem">
            <LucideLoader2 v-if="itemSaving" class="w-4 h-4 mr-1 animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
