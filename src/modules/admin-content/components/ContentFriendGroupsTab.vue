<script setup lang="ts">
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
  LucideLink,
  LucideLoader2,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import type { AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"

defineProps<{
  loading: boolean
  groups: AdminFriendGroup[]
  groupDialogOpen: boolean
  groupName: string
  groupSaving: boolean
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "update:groupDialogOpen", value: boolean): void
  (e: "update:groupName", value: string): void
  (e: "createGroup"): void
  (e: "deleteGroup", groupId: string): void
  (e: "createItem", groupId: string): void
  (e: "editItem", groupId: string, item: AdminFriendGroupItem): void
  (e: "deleteItem", groupId: string, itemId: string): void
}>()
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between">
      <CardTitle class="text-lg">{{ t("adminContent.groupsTab.title") }}</CardTitle>
      <Dialog :open="groupDialogOpen" @update:open="emit('update:groupDialogOpen', $event)">
        <DialogTrigger as-child>
          <Button size="sm">
            <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminContent.groupsTab.createGroupButton") }}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{{ t("adminContent.groupsTab.createGroupDialog.title") }}</DialogTitle>
          </DialogHeader>
          <div class="flex flex-col gap-2 py-4">
            <Label>{{ t("adminContent.groupsTab.createGroupDialog.groupNameLabel") }}</Label>
            <Input
              :model-value="groupName"
              :placeholder="t('adminContent.groupsTab.createGroupDialog.groupNamePlaceholder')"
              @update:model-value="emit('update:groupName', String($event ?? ''))"
            />
          </div>
          <DialogFooter>
            <Button :disabled="groupSaving" @click="emit('createGroup')">
              <LucideLoader2 v-if="groupSaving" class="w-4 h-4 mr-1 animate-spin" />
              {{ t("adminContent.groupsTab.createGroupDialog.create") }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <Skeleton v-for="i in 3" :key="i" class="h-20 w-full mb-3" />
      </template>
      <template v-else-if="groups.length > 0">
        <div class="flex flex-col gap-4">
          <Card v-for="group in groups" :key="group.id" class="border">
            <CardHeader class="flex flex-row items-center justify-between py-3">
              <CardTitle class="text-base">{{ group.group }}</CardTitle>
              <div class="flex gap-1">
                <Button variant="outline" size="sm" @click="emit('createItem', String(group.id))">
                  <LucidePlus class="w-3 h-3 mr-1" /> {{ t("adminContent.groupsTab.addItemButton") }}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger as-child>
                    <Button variant="ghost" size="sm" class="text-destructive">
                      <LucideTrash2 class="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{{ t("adminContent.groupsTab.deleteGroupDialog.title") }}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {{ t("adminContent.groupsTab.deleteGroupDialog.description", { group: group.group }) }}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{{ t("adminContent.groupsTab.deleteGroupDialog.cancel") }}</AlertDialogCancel>
                      <AlertDialogAction @click="emit('deleteGroup', String(group.id))">
                        {{ t("adminContent.groupsTab.deleteGroupDialog.confirm") }}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>

            <CardContent v-if="group.groupList && group.groupList.length > 0" class="pt-0">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div
                  v-for="item in group.groupList"
                  :key="item.id"
                  class="flex items-center justify-between p-2 border rounded-md"
                >
                  <span class="flex items-center gap-1 text-sm font-medium truncate">
                    <span class="truncate">{{ item.name }}</span>
                    <LucideLink v-if="item.url" class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </span>
                  <div class="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="sm" @click="emit('editItem', String(group.id), item)">
                      <LucidePencil class="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      class="text-destructive"
                      @click="emit('deleteItem', String(group.id), String(item.id))"
                    >
                      <LucideTrash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardContent v-else class="pt-0">
              <p class="text-sm text-muted-foreground">{{ t("adminContent.groupsTab.emptyItems") }}</p>
            </CardContent>
          </Card>
        </div>
      </template>
      <template v-else>
        <p class="text-center text-muted-foreground py-8">{{ t("adminContent.groupsTab.emptyGroups") }}</p>
      </template>
    </CardContent>
  </Card>
</template>
