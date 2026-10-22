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
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideLink,
  LucideLoader2,
  LucidePencil,
  LucidePlus,
  LucideTrash2,
  LucideUsers,
} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import FieldError from "@/shared/components/FieldError.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { CONTENT_FIELD_IDS } from "@/modules/admin-content/lib/form-validation"
import type { GroupFormErrorMessages } from "@/modules/admin-content/composables/useContentManagement"
import type { AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"

defineProps<{
  loading: boolean
  /** A failed load; the empty state below is only for a real empty list. */
  loadError: ErrorDescription | null
  groups: AdminFriendGroup[]
  groupDialogOpen: boolean
  editingGroup: AdminFriendGroup | null
  groupName: string
  groupSortOrder: number
  groupSaving: boolean
  groupFormErrors: GroupFormErrorMessages
}>()
const { t } = useI18n()

const emit = defineEmits<{
  (e: "update:groupDialogOpen", value: boolean): void
  (e: "update:groupName", value: string): void
  (e: "update:groupSortOrder", value: number): void
  (e: "openCreateGroup"): void
  (e: "editGroup", group: AdminFriendGroup): void
  (e: "saveGroup"): void
  /** Asks the page to confirm and delete the group. */
  (e: "deleteGroup", group: AdminFriendGroup): void
  (e: "createItem", groupId: string): void
  (e: "editItem", groupId: string, item: AdminFriendGroupItem): void
  /** Asks the page to confirm and delete the item. */
  (e: "deleteItem", groupId: string, item: AdminFriendGroupItem): void
  (e: "retry"): void
}>()

const groupNameErrorId = `${CONTENT_FIELD_IDS.group.name}-error`
</script>

<template>
  <Card class="rounded-lg">
    <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2">
      <CardTitle class="text-base">{{ t("adminContent.groupsTab.title") }}</CardTitle>
      <Button size="sm" @click="emit('openCreateGroup')">
        <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminContent.groupsTab.createGroupButton") }}
      </Button>
    </CardHeader>
    <CardContent>
      <template v-if="loading">
        <div class="flex flex-col gap-3">
          <Skeleton v-for="i in 3" :key="i" class="h-20 w-full" />
        </div>
      </template>
      <LoadErrorState
        v-else-if="loadError"
        :title="t('adminContent.toast.loadGroupsFailedTitle')"
        :description="loadError.message"
        :detail="loadError.detail"
        :retrying="loading"
        @retry="emit('retry')"
      />
      <template v-else-if="groups.length > 0">
        <div class="flex flex-col gap-4">
          <Card v-for="group in groups" :key="group.id" class="gap-3 rounded-lg py-4 shadow-none">
            <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 px-4">
              <CardTitle class="text-base flex items-center gap-2">
                <span class="text-xs text-muted-foreground tabular-nums">#{{ group.sortOrder }}</span>
                {{ group.group }}
              </CardTitle>
              <div class="flex items-center gap-1">
                <Button variant="outline" size="sm" @click="emit('createItem', String(group.id))">
                  <LucidePlus class="w-3 h-3 mr-1" /> {{ t("adminContent.groupsTab.addItemButton") }}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8"
                  :title="t('adminContent.actions.edit')"
                  :aria-label="t('adminContent.actions.edit')"
                  @click="emit('editGroup', group)"
                >
                  <LucidePencil class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive hover:text-destructive"
                  :title="t('adminContent.actions.delete')"
                  :aria-label="t('adminContent.actions.delete')"
                  @click="emit('deleteGroup', group)"
                >
                  <LucideTrash2 class="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent v-if="group.groupList && group.groupList.length > 0" class="px-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div
                  v-for="item in group.groupList"
                  :key="item.id"
                  class="flex items-center justify-between gap-2 p-2 border rounded-md"
                >
                  <span class="flex items-center gap-1 text-sm font-medium truncate">
                    <span class="text-xs text-muted-foreground tabular-nums shrink-0">#{{ item.sortOrder }}</span>
                    <span class="truncate">{{ item.name }}</span>
                    <LucideLink v-if="item.url" class="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </span>
                  <div class="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7"
                      :title="t('adminContent.actions.edit')"
                      :aria-label="t('adminContent.actions.edit')"
                      @click="emit('editItem', String(group.id), item)"
                    >
                      <LucidePencil class="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="size-7 text-destructive hover:text-destructive"
                      :title="t('adminContent.actions.delete')"
                      :aria-label="t('adminContent.actions.delete')"
                      @click="emit('deleteItem', String(group.id), item)"
                    >
                      <LucideTrash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardContent v-else class="px-4">
              <div class="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-6 text-center">
                <p class="text-sm text-muted-foreground">{{ t("adminContent.groupsTab.emptyItems") }}</p>
                <Button variant="outline" size="sm" @click="emit('createItem', String(group.id))">
                  <LucidePlus class="w-3.5 h-3.5 mr-1" /> {{ t("adminContent.groupsTab.addItemButton") }}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </template>
      <template v-else>
        <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center">
          <LucideUsers class="h-8 w-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminContent.groupsTab.emptyGroups") }}</p>
          <Button size="sm" @click="emit('openCreateGroup')">
            <LucidePlus class="w-4 h-4 mr-1" /> {{ t("adminContent.groupsTab.createGroupButton") }}
          </Button>
        </div>
      </template>
    </CardContent>
  </Card>

  <Dialog :open="groupDialogOpen" @update:open="emit('update:groupDialogOpen', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ editingGroup ? t("adminContent.groupsTab.createGroupDialog.editTitle") : t("adminContent.groupsTab.createGroupDialog.title") }}
        </DialogTitle>
      </DialogHeader>
      <form novalidate @submit.prevent="emit('saveGroup')">
        <div class="-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1 py-1">
          <div class="flex flex-col gap-1.5">
            <Label :for="CONTENT_FIELD_IDS.group.name">{{ t("adminContent.groupsTab.createGroupDialog.groupNameLabel") }}</Label>
            <Input
              :id="CONTENT_FIELD_IDS.group.name"
              :model-value="groupName"
              :placeholder="t('adminContent.groupsTab.createGroupDialog.groupNamePlaceholder')"
              :aria-invalid="groupFormErrors.name ? true : undefined"
              :aria-describedby="groupFormErrors.name ? groupNameErrorId : undefined"
              @update:model-value="emit('update:groupName', String($event ?? ''))"
            />
            <FieldError :id="groupNameErrorId" :message="groupFormErrors.name" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label for="content-group-sort-order">{{ t("adminContent.linkDialog.fields.sortOrder") }}</Label>
            <Input
              id="content-group-sort-order"
              :model-value="groupSortOrder"
              type="number"
              min="0"
              :placeholder="t('adminContent.linkDialog.placeholders.sortOrder')"
              @update:model-value="emit('update:groupSortOrder', Number($event ?? 0))"
            />
            <p class="text-xs text-muted-foreground">{{ t("adminContent.linkDialog.fields.sortOrderHint") }}</p>
          </div>
        </div>
        <DialogFooter class="mt-4">
          <DialogClose as-child>
            <Button type="button" variant="outline" :disabled="groupSaving">{{ t("common.cancel") }}</Button>
          </DialogClose>
          <Button type="submit" :disabled="groupSaving">
            <LucideLoader2 v-if="groupSaving" class="w-4 h-4 mr-1 animate-spin" />
            {{ t("adminContent.groupsTab.createGroupDialog.create") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
