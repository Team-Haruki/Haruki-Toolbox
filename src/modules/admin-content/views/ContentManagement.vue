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
import {
  ContentFriendGroupsTab,
  ContentFriendLinksTab,
} from "@/modules/admin-content/components"
import { useContentManagement } from "@/modules/admin-content/composables/useContentManagement"

const { t } = useI18n()

const {
  linksLoading,
  links,
  linkDialogOpen,
  editingLink,
  linkForm,
  linkSaving,
  groupsLoading,
  groups,
  groupDialogOpen,
  editingGroup,
  groupName,
  groupSortOrder,
  groupSaving,
  itemDialogOpen,
  editingItem,
  itemForm,
  itemSaving,
  openCreateLink,
  openEditLink,
  saveLink,
  handleDeleteLink,
  openCreateGroup,
  openEditGroup,
  handleSaveGroup,
  handleDeleteGroup,
  openCreateItem,
  openEditItem,
  saveItem,
  handleDeleteItem,
} = useContentManagement()
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
          :links="links"
          @create="openCreateLink"
          @edit="openEditLink"
          @delete="handleDeleteLink"
        />
      </TabsContent>

      <TabsContent value="groups">
        <ContentFriendGroupsTab
          :loading="groupsLoading"
          :groups="groups"
          :group-dialog-open="groupDialogOpen"
          :editing-group="editingGroup"
          :group-name="groupName"
          :group-sort-order="groupSortOrder"
          :group-saving="groupSaving"
          @update:group-dialog-open="groupDialogOpen = $event"
          @update:group-name="groupName = $event"
          @update:group-sort-order="groupSortOrder = $event"
          @open-create-group="openCreateGroup"
          @edit-group="openEditGroup"
          @save-group="handleSaveGroup"
          @delete-group="handleDeleteGroup"
          @create-item="openCreateItem"
          @edit-item="openEditItem"
          @delete-item="handleDeleteItem"
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
        <div class="-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1 py-1">
          <div class="flex flex-col gap-1.5">
            <Label for="content-link-name">{{ t("adminContent.linkDialog.fields.name") }}</Label>
            <Input id="content-link-name" v-model="linkForm.name" :placeholder="t('adminContent.linkDialog.placeholders.name')" />
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
            <Label for="content-link-url">{{ t("adminContent.linkDialog.fields.linkUrl") }}</Label>
            <Input id="content-link-url" v-model="linkForm.url" :placeholder="t('adminContent.linkDialog.placeholders.linkUrl')" />
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
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" :disabled="linkSaving">{{ t("common.cancel") }}</Button>
          </DialogClose>
          <Button :disabled="linkSaving" @click="saveLink">
            <LucideLoader2 v-if="linkSaving" class="w-4 h-4 mr-1 animate-spin" />
            {{ t("common.save") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="itemDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editingItem ? t("adminContent.itemDialog.editTitle") : t("adminContent.itemDialog.createTitle") }}
          </DialogTitle>
        </DialogHeader>
        <div class="-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1 py-1">
          <div class="flex flex-col gap-1.5">
            <Label for="content-item-name">{{ t("adminContent.itemDialog.fields.name") }}</Label>
            <Input id="content-item-name" v-model="itemForm.name" :placeholder="t('adminContent.itemDialog.placeholders.name')" />
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
            <Label for="content-item-url">{{ t("adminContent.linkDialog.fields.linkUrl") }}</Label>
            <Input id="content-item-url" v-model="itemForm.url" :placeholder="t('adminContent.linkDialog.placeholders.linkUrl')" />
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
        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" :disabled="itemSaving">{{ t("common.cancel") }}</Button>
          </DialogClose>
          <Button :disabled="itemSaving" @click="saveItem">
            <LucideLoader2 v-if="itemSaving" class="w-4 h-4 mr-1 animate-spin" />
            {{ t("common.save") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
