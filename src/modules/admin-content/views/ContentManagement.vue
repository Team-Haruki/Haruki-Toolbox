<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "vue-i18n"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LucideLoader2 } from "lucide-vue-next"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import FieldError from "@/shared/components/FieldError.vue"
import {
  ContentFriendGroupsTab,
  ContentFriendLinksTab,
} from "@/modules/admin-content/components"
import { useContentManagement } from "@/modules/admin-content/composables/useContentManagement"
import { CONTENT_FIELD_IDS } from "@/modules/admin-content/lib/form-validation"

const { t } = useI18n()

const {
  linksLoading,
  linksLoadError,
  links,
  linkDialogOpen,
  editingLink,
  linkForm,
  linkFormErrors,
  linkSaving,
  groupsLoading,
  groupsLoadError,
  groups,
  groupDialogOpen,
  editingGroup,
  groupName,
  groupSortOrder,
  groupFormErrors,
  groupSaving,
  itemDialogOpen,
  editingItem,
  itemForm,
  itemFormErrors,
  itemSaving,
  linkToDelete,
  linkDeleteOpen,
  groupToDelete,
  groupDeleteOpen,
  itemToDelete,
  itemDeleteOpen,
  loadLinks,
  loadGroups,
  clearLinkFormError,
  clearItemFormError,
  clearGroupFormError,
  openCreateLink,
  openEditLink,
  saveLink,
  requestDeleteLink,
  executeDeleteLink,
  openCreateGroup,
  openEditGroup,
  handleSaveGroup,
  requestDeleteGroup,
  executeDeleteGroup,
  openCreateItem,
  openEditItem,
  saveItem,
  requestDeleteItem,
  executeDeleteItem,
} = useContentManagement()

const linkErrorIds = {
  name: `${CONTENT_FIELD_IDS.link.name}-error`,
  url: `${CONTENT_FIELD_IDS.link.url}-error`,
}
const itemErrorIds = {
  name: `${CONTENT_FIELD_IDS.item.name}-error`,
  url: `${CONTENT_FIELD_IDS.item.url}-error`,
}
</script>

<template>
  <div class="w-full flex flex-col gap-4">
    <Tabs default-value="links">
      <TabsList>
        <TabsTrigger value="links">{{ t("adminContent.tabs.links") }}</TabsTrigger>
        <TabsTrigger value="groups">{{ t("adminContent.tabs.groups") }}</TabsTrigger>
      </TabsList>

      <TabsContent value="links">
        <ContentFriendLinksTab
          :loading="linksLoading"
          :load-error="linksLoadError"
          :links="links"
          @create="openCreateLink"
          @edit="openEditLink"
          @delete="requestDeleteLink"
          @retry="loadLinks()"
        />
      </TabsContent>

      <TabsContent value="groups">
        <ContentFriendGroupsTab
          :loading="groupsLoading"
          :load-error="groupsLoadError"
          :groups="groups"
          :group-dialog-open="groupDialogOpen"
          :editing-group="editingGroup"
          :group-name="groupName"
          :group-sort-order="groupSortOrder"
          :group-saving="groupSaving"
          :group-form-errors="groupFormErrors"
          @update:group-dialog-open="groupDialogOpen = $event"
          @update:group-name="groupName = $event; clearGroupFormError('name')"
          @update:group-sort-order="groupSortOrder = $event"
          @open-create-group="openCreateGroup"
          @edit-group="openEditGroup"
          @save-group="handleSaveGroup"
          @delete-group="requestDeleteGroup"
          @create-item="openCreateItem"
          @edit-item="openEditItem"
          @delete-item="requestDeleteItem"
          @retry="loadGroups()"
        />
      </TabsContent>
    </Tabs>

    <Dialog v-model:open="linkDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editingLink ? t("adminContent.linkDialog.editTitle") : t("adminContent.linkDialog.createTitle") }}
          </DialogTitle>
        </DialogHeader>
        <form novalidate @submit.prevent="saveLink">
          <div class="-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1 py-1">
            <div class="flex flex-col gap-1.5">
              <Label :for="CONTENT_FIELD_IDS.link.name">{{ t("adminContent.linkDialog.fields.name") }}</Label>
              <Input
                :id="CONTENT_FIELD_IDS.link.name"
                v-model="linkForm.name"
                :placeholder="t('adminContent.linkDialog.placeholders.name')"
                :aria-invalid="linkFormErrors.name ? true : undefined"
                :aria-describedby="linkFormErrors.name ? linkErrorIds.name : undefined"
                @update:model-value="clearLinkFormError('name')"
              />
              <FieldError :id="linkErrorIds.name" :message="linkFormErrors.name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-link-description">{{ t("adminContent.linkDialog.fields.description") }}</Label>
              <Input id="content-link-description" v-model="linkForm.description" :placeholder="t('adminContent.linkDialog.placeholders.description')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-link-avatar">{{ t("adminContent.linkDialog.fields.avatarUrl") }}</Label>
              <Input id="content-link-avatar" v-model="linkForm.avatar" :placeholder="t('adminContent.linkDialog.placeholders.avatarUrl')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label :for="CONTENT_FIELD_IDS.link.url">{{ t("adminContent.linkDialog.fields.linkUrl") }}</Label>
              <Input
                :id="CONTENT_FIELD_IDS.link.url"
                v-model="linkForm.url"
                type="url"
                :placeholder="t('adminContent.linkDialog.placeholders.linkUrl')"
                :aria-invalid="linkFormErrors.url ? true : undefined"
                :aria-describedby="linkFormErrors.url ? linkErrorIds.url : undefined"
                @update:model-value="clearLinkFormError('url')"
              />
              <FieldError :id="linkErrorIds.url" :message="linkFormErrors.url" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-link-tags">{{ t("adminContent.linkDialog.fields.tags") }}</Label>
              <Input id="content-link-tags" v-model="linkForm.tags" :placeholder="t('adminContent.linkDialog.placeholders.tags')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-link-sort-order">{{ t("adminContent.linkDialog.fields.sortOrder") }}</Label>
              <Input
                id="content-link-sort-order"
                v-model.number="linkForm.sortOrder"
                type="number"
                min="0"
                :placeholder="t('adminContent.linkDialog.placeholders.sortOrder')"
              />
              <p class="text-xs text-muted-foreground">{{ t("adminContent.linkDialog.fields.sortOrderHint") }}</p>
            </div>
          </div>
          <DialogFooter class="mt-4">
            <DialogClose as-child>
              <Button type="button" variant="outline" :disabled="linkSaving">{{ t("common.cancel") }}</Button>
            </DialogClose>
            <Button type="submit" :disabled="linkSaving">
              <LucideLoader2 v-if="linkSaving" class="w-4 h-4 mr-1 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="itemDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editingItem ? t("adminContent.itemDialog.editTitle") : t("adminContent.itemDialog.createTitle") }}
          </DialogTitle>
        </DialogHeader>
        <form novalidate @submit.prevent="saveItem">
          <div class="-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1 py-1">
            <div class="flex flex-col gap-1.5">
              <Label :for="CONTENT_FIELD_IDS.item.name">{{ t("adminContent.itemDialog.fields.name") }}</Label>
              <Input
                :id="CONTENT_FIELD_IDS.item.name"
                v-model="itemForm.name"
                :placeholder="t('adminContent.itemDialog.placeholders.name')"
                :aria-invalid="itemFormErrors.name ? true : undefined"
                :aria-describedby="itemFormErrors.name ? itemErrorIds.name : undefined"
                @update:model-value="clearItemFormError('name')"
              />
              <FieldError :id="itemErrorIds.name" :message="itemFormErrors.name" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-item-avatar">{{ t("adminContent.itemDialog.fields.avatarUrl") }}</Label>
              <Input id="content-item-avatar" v-model="itemForm.avatar" :placeholder="t('adminContent.itemDialog.placeholders.avatarUrl')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-item-bg">{{ t("adminContent.itemDialog.fields.backgroundUrl") }}</Label>
              <Input id="content-item-bg" v-model="itemForm.bg" :placeholder="t('adminContent.itemDialog.placeholders.backgroundUrl')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label :for="CONTENT_FIELD_IDS.item.url">{{ t("adminContent.linkDialog.fields.linkUrl") }}</Label>
              <Input
                :id="CONTENT_FIELD_IDS.item.url"
                v-model="itemForm.url"
                type="url"
                :placeholder="t('adminContent.linkDialog.placeholders.linkUrl')"
                :aria-invalid="itemFormErrors.url ? true : undefined"
                :aria-describedby="itemFormErrors.url ? itemErrorIds.url : undefined"
                @update:model-value="clearItemFormError('url')"
              />
              <FieldError :id="itemErrorIds.url" :message="itemFormErrors.url" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-item-group-info">{{ t("adminContent.itemDialog.fields.groupInfo") }}</Label>
              <Input id="content-item-group-info" v-model="itemForm.groupInfo" :placeholder="t('adminContent.itemDialog.placeholders.optional')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-item-detail">{{ t("adminContent.itemDialog.fields.detail") }}</Label>
              <Input id="content-item-detail" v-model="itemForm.detail" :placeholder="t('adminContent.itemDialog.placeholders.optional')" />
            </div>
            <div class="flex flex-col gap-1.5">
              <Label for="content-item-sort-order">{{ t("adminContent.linkDialog.fields.sortOrder") }}</Label>
              <Input
                id="content-item-sort-order"
                v-model.number="itemForm.sortOrder"
                type="number"
                min="0"
                :placeholder="t('adminContent.linkDialog.placeholders.sortOrder')"
              />
              <p class="text-xs text-muted-foreground">{{ t("adminContent.linkDialog.fields.sortOrderHint") }}</p>
            </div>
          </div>
          <DialogFooter class="mt-4">
            <DialogClose as-child>
              <Button type="button" variant="outline" :disabled="itemSaving">{{ t("common.cancel") }}</Button>
            </DialogClose>
            <Button type="submit" :disabled="itemSaving">
              <LucideLoader2 v-if="itemSaving" class="w-4 h-4 mr-1 animate-spin" />
              {{ t("common.save") }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmDialog
      v-model:open="linkDeleteOpen"
      :title="t('adminContent.linksTab.deleteDialog.title')"
      :description="t('adminContent.linksTab.deleteDialog.description', { name: linkToDelete?.name ?? '' })"
      :cancel-label="t('adminContent.linksTab.deleteDialog.cancel')"
      :confirm-label="t('adminContent.linksTab.deleteDialog.confirm')"
      destructive
      :on-confirm="executeDeleteLink"
    />

    <ConfirmDialog
      v-model:open="groupDeleteOpen"
      :title="t('adminContent.groupsTab.deleteGroupDialog.title')"
      :description="t('adminContent.groupsTab.deleteGroupDialog.description', { group: groupToDelete?.group ?? '' })"
      :cancel-label="t('adminContent.groupsTab.deleteGroupDialog.cancel')"
      :confirm-label="t('adminContent.groupsTab.deleteGroupDialog.confirm')"
      destructive
      :on-confirm="executeDeleteGroup"
    />

    <ConfirmDialog
      v-model:open="itemDeleteOpen"
      :title="t('adminContent.groupsTab.deleteItemDialog.title')"
      :description="t('adminContent.groupsTab.deleteItemDialog.description', { name: itemToDelete?.item.name ?? '' })"
      :confirm-label="t('adminContent.groupsTab.deleteItemDialog.confirm')"
      destructive
      :on-confirm="executeDeleteItem"
    />
  </div>
</template>
