<script setup lang="ts">
/**
 * The recommended group chats: one panel per group (its order, name and
 * size in the heading, its entries as rows underneath), with a breakdown of
 * how many entries each group holds beside the list. The group editor dialog
 * lives here too; entries and deletions are handled by the page.
 */
import { computed } from "vue"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LucideImage,
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
import AdminMeterList, { type AdminMeterItem } from "@/modules/admin/components/AdminMeterList.vue"
import AdminPanel from "@/modules/admin/components/AdminPanel.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import { formatNumberCN } from "@/lib/number-format"
import { countGroupItems } from "@/modules/admin-content/lib/content-stats"
import { CONTENT_FIELD_IDS } from "@/modules/admin-content/lib/form-validation"
import type { GroupFormErrorMessages } from "@/modules/admin-content/composables/useContentManagement"
import type { AdminFriendGroup, AdminFriendGroupItem } from "@/types/admin"

const props = defineProps<{
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

const groupDialogTitle = computed(() =>
  props.editingGroup
    ? t("adminContent.groupsTab.createGroupDialog.editTitle")
    : t("adminContent.groupsTab.createGroupDialog.title"))

const sizeItems = computed<AdminMeterItem[]>(() =>
  countGroupItems(props.groups).map((entry) => ({
    key: entry.key,
    label: entry.label,
    value: entry.count,
    text: formatNumberCN(entry.count),
  })))

/** The line under an entry's name: what kind of group it is, then its note. */
function itemSummary(item: AdminFriendGroupItem): string {
  return [item.groupInfo, item.detail].filter(Boolean).join(" · ")
}
</script>

<template>
  <div class="@container">
    <div class="grid items-start gap-4 @min-[52rem]:grid-cols-[minmax(0,1fr)_17rem]">
      <div class="flex min-w-0 flex-col gap-3" data-testid="content-groups">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="text-sm font-semibold">{{ t("adminContent.groupsTab.title") }}</h2>
          <Button size="sm" @click="emit('openCreateGroup')">
            <LucidePlus class="size-4" /> {{ t("adminContent.groupsTab.createGroupButton") }}
          </Button>
        </div>

        <template v-if="loading">
          <div v-for="i in 2" :key="i" class="overflow-hidden rounded-xl border bg-card" aria-busy="true">
            <div class="border-b border-border/60 px-4 py-3"><Skeleton class="h-4 w-40 max-w-full" /></div>
            <div class="divide-y divide-border/60">
              <div v-for="row in 2" :key="row" class="flex items-center gap-3 px-4 py-2.5">
                <Skeleton class="size-8 shrink-0 rounded-full" />
                <Skeleton class="h-3.5 w-48 max-w-full" />
              </div>
            </div>
          </div>
        </template>

        <div v-else-if="loadError" class="rounded-xl border bg-card">
          <LoadErrorState
            :title="t('adminContent.toast.loadGroupsFailedTitle')"
            :description="loadError.message"
            :detail="loadError.detail"
            :retrying="loading"
            @retry="emit('retry')"
          />
        </div>

        <template v-else-if="groups.length > 0">
          <AdminPanel
            v-for="group in groups"
            :key="group.id"
            :title="group.group"
            :description="t('adminContent.groupsTab.summary', { order: group.sortOrder, count: group.groupList?.length ?? 0 })"
            flush
            :data-group="group.id"
          >
            <template #actions>
              <Button variant="outline" size="sm" @click="emit('createItem', String(group.id))">
                <LucidePlus class="size-4" /> {{ t("adminContent.groupsTab.addItemButton") }}
              </Button>
              <div class="flex gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-muted-foreground pointer-coarse:size-10"
                  :title="t('adminContent.actions.edit')"
                  :aria-label="t('adminContent.actions.edit')"
                  @click="emit('editGroup', group)"
                >
                  <LucidePencil class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
                  :title="t('adminContent.actions.delete')"
                  :aria-label="t('adminContent.actions.delete')"
                  @click="emit('deleteGroup', group)"
                >
                  <LucideTrash2 class="size-4" />
                </Button>
              </div>
            </template>

            <ul v-if="group.groupList && group.groupList.length > 0" class="divide-y divide-border/60" role="list">
              <li
                v-for="item in group.groupList"
                :key="item.id"
                class="flex items-start gap-3 px-4 py-2"
                :data-item="item.id"
              >
                <span
                  class="w-7 shrink-0 pt-1.5 text-right text-xs tabular-nums text-muted-foreground"
                  :title="t('adminContent.linksTab.table.sortOrder')"
                >
                  {{ item.sortOrder }}
                </span>
                <Avatar class="size-8 shrink-0 border">
                  <AvatarImage :src="item.avatar" alt="" />
                  <AvatarFallback class="text-muted-foreground"><LucideUsers class="size-4" /></AvatarFallback>
                </Avatar>
                <div class="min-w-0 flex-1">
                  <p class="flex items-start gap-1.5 text-sm font-medium">
                    <span class="min-w-0 [overflow-wrap:anywhere]">{{ item.name }}</span>
                    <LucideLink
                      v-if="item.url"
                      class="mt-1 size-3.5 shrink-0 text-muted-foreground"
                      role="img"
                      :aria-label="t('adminContent.groupsTab.hasLink')"
                    />
                    <LucideImage
                      v-if="item.bg"
                      class="mt-1 size-3.5 shrink-0 text-muted-foreground"
                      role="img"
                      :aria-label="t('adminContent.groupsTab.hasBackground')"
                    />
                  </p>
                  <p v-if="itemSummary(item)" class="text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ itemSummary(item) }}</p>
                </div>
                <div class="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-muted-foreground pointer-coarse:size-10"
                    :title="t('adminContent.actions.edit')"
                    :aria-label="t('adminContent.actions.edit')"
                    @click="emit('editItem', String(group.id), item)"
                  >
                    <LucidePencil class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
                    :title="t('adminContent.actions.delete')"
                    :aria-label="t('adminContent.actions.delete')"
                    @click="emit('deleteItem', String(group.id), item)"
                  >
                    <LucideTrash2 class="size-4" />
                  </Button>
                </div>
              </li>
            </ul>
            <p v-else class="px-4 py-5 text-center text-sm text-muted-foreground">
              {{ t("adminContent.groupsTab.emptyItems") }}
            </p>
          </AdminPanel>
        </template>

        <div v-else class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-4 py-10 text-center">
          <LucideUsers class="size-8 text-muted-foreground/60" />
          <p class="text-sm text-muted-foreground">{{ t("adminContent.groupsTab.emptyGroups") }}</p>
          <Button size="sm" @click="emit('openCreateGroup')">
            <LucidePlus class="size-4" /> {{ t("adminContent.groupsTab.createGroupButton") }}
          </Button>
        </div>
      </div>

      <AdminPanel
        v-if="!loadError"
        :title="t('adminContent.groupsTab.sizePanel.title')"
        :description="t('adminContent.groupsTab.sizePanel.description')"
        data-testid="content-group-sizes"
      >
        <AdminMeterList :items="sizeItems" :loading="loading" :empty-text="t('adminContent.groupsTab.emptyGroups')" />
      </AdminPanel>
    </div>
  </div>

  <Dialog :open="groupDialogOpen" @update:open="emit('update:groupDialogOpen', $event)">
    <DialogContent :description="groupDialogTitle">
      <DialogHeader>
        <DialogTitle>{{ groupDialogTitle }}</DialogTitle>
      </DialogHeader>
      <!-- The form spans the body and the footer, so it carries the dialog's column on. -->
      <form class="flex min-h-0 flex-1 flex-col" novalidate @submit.prevent="emit('saveGroup')">
        <DialogBody class="gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <div class="grid content-start gap-1.5">
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
          <div class="grid content-start gap-1.5">
            <Label for="content-group-sort-order">{{ t("adminContent.linkDialog.fields.sortOrder") }}</Label>
            <Input
              id="content-group-sort-order"
              :model-value="groupSortOrder"
              type="number"
              min="0"
              inputmode="numeric"
              class="tabular-nums"
              :placeholder="t('adminContent.linkDialog.placeholders.sortOrder')"
              aria-describedby="content-group-sort-order-hint"
              @update:model-value="emit('update:groupSortOrder', Number($event ?? 0))"
            />
          </div>
          <p id="content-group-sort-order-hint" class="text-xs text-muted-foreground sm:col-span-2">{{ t("adminContent.linkDialog.fields.sortOrderHint") }}</p>
        </DialogBody>
        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline" :disabled="groupSaving">{{ t("common.cancel") }}</Button>
          </DialogClose>
          <Button type="submit" :disabled="groupSaving">
            <LucideLoader2 v-if="groupSaving" class="size-4 animate-spin" />
            {{ t("adminContent.groupsTab.createGroupDialog.create") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
