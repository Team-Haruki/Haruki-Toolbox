<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useI18n } from "vue-i18n"
import {
  Dialog,
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
  groupName,
  groupSaving,
  itemDialogOpen,
  editingItem,
  itemForm,
  itemSaving,
  openCreateLink,
  openEditLink,
  saveLink,
  handleDeleteLink,
  handleCreateGroup,
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
          :group-name="groupName"
          :group-saving="groupSaving"
          @update:group-dialog-open="groupDialogOpen = $event"
          @update:group-name="groupName = $event"
          @create-group="handleCreateGroup"
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
        <div class="flex flex-col gap-3 py-4">
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.linkDialog.fields.name") }}</Label>
            <Input v-model="linkForm.name" :placeholder="t('adminContent.linkDialog.placeholders.name')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.linkDialog.fields.description") }}</Label>
            <Input v-model="linkForm.description" :placeholder="t('adminContent.linkDialog.placeholders.description')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.linkDialog.fields.avatarUrl") }}</Label>
            <Input v-model="linkForm.avatar" :placeholder="t('adminContent.linkDialog.placeholders.avatarUrl')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.linkDialog.fields.linkUrl") }}</Label>
            <Input v-model="linkForm.url" :placeholder="t('adminContent.linkDialog.placeholders.linkUrl')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.linkDialog.fields.tags") }}</Label>
            <Input v-model="linkForm.tags" :placeholder="t('adminContent.linkDialog.placeholders.tags')" />
          </div>
        </div>
        <DialogFooter>
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
        <div class="flex flex-col gap-3 py-4">
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.itemDialog.fields.name") }}</Label>
            <Input v-model="itemForm.name" :placeholder="t('adminContent.itemDialog.placeholders.name')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.itemDialog.fields.avatarUrl") }}</Label>
            <Input v-model="itemForm.avatar" :placeholder="t('adminContent.itemDialog.placeholders.avatarUrl')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.itemDialog.fields.backgroundUrl") }}</Label>
            <Input v-model="itemForm.bg" :placeholder="t('adminContent.itemDialog.placeholders.backgroundUrl')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.linkDialog.fields.linkUrl") }}</Label>
            <Input v-model="itemForm.url" :placeholder="t('adminContent.linkDialog.placeholders.linkUrl')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.itemDialog.fields.groupInfo") }}</Label>
            <Input v-model="itemForm.groupInfo" :placeholder="t('adminContent.itemDialog.placeholders.optional')" />
          </div>
          <div class="flex flex-col gap-1.5">
            <Label>{{ t("adminContent.itemDialog.fields.detail") }}</Label>
            <Input v-model="itemForm.detail" :placeholder="t('adminContent.itemDialog.placeholders.optional')" />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="itemSaving" @click="saveItem">
            <LucideLoader2 v-if="itemSaving" class="w-4 h-4 mr-1 animate-spin" />
            {{ t("common.save") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
