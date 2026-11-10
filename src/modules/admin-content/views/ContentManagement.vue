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
import { LucideFolders, LucideLink, LucideLoader2, LucideMessagesSquare, LucideTags } from "lucide-vue-next"
import { computed } from "vue"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AdminStatGrid from "@/modules/admin/components/AdminStatGrid.vue"
import AdminStatTile from "@/modules/admin/components/AdminStatTile.vue"
import { formatNumberCN } from "@/lib/number-format"
import { countGroupItems, countLinkTags, summarizeContent } from "@/modules/admin-content/lib/content-stats"
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

// Counted over both lists as loaded; neither is paged.
const overview = computed(() => summarizeContent(links.value, groups.value))
const linksReady = computed(() => !linksLoading.value && !linksLoadError.value)
const groupsReady = computed(() => !groupsLoading.value && !groupsLoadError.value)

const linkDetail = computed(() => {
  if (!linksReady.value || overview.value.links === 0) return null
  return overview.value.untaggedLinks > 0
    ? t("adminContent.stats.untagged", { count: formatNumberCN(overview.value.untaggedLinks) })
    : t("adminContent.stats.allTagged")
})

const tagDetail = computed(() => {
  const top = linksReady.value ? countLinkTags(links.value)[0] : undefined
  return top ? t("adminContent.stats.topTag", { tag: top.label, count: formatNumberCN(top.count) }) : null
})

const groupDetail = computed(() => {
  if (!groupsReady.value || overview.value.groups === 0) return null
  return overview.value.emptyGroups > 0
    ? t("adminContent.stats.emptyGroups", { count: formatNumberCN(overview.value.emptyGroups) })
    : t("adminContent.stats.noEmptyGroups")
})

const itemDetail = computed(() => {
  if (!groupsReady.value) return null
  const largest = countGroupItems(groups.value).reduce<{ label: string; count: number } | null>(
    (best, entry) => (best === null || entry.count > best.count ? entry : best),
    null,
  )
  return largest && largest.count > 0
    ? t("adminContent.stats.largestGroup", { group: largest.label, count: formatNumberCN(largest.count) })
    : null
})

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
  <div class="flex w-full flex-col gap-4">
    <AdminStatGrid :columns="4" data-testid="content-stats">
      <AdminStatTile
        :label="t('adminContent.stats.links')"
        :value="linksLoadError ? null : overview.links"
        :icon="LucideLink"
        tone="primary"
        :loading="linksLoading"
        :detail="linkDetail"
      />
      <AdminStatTile
        :label="t('adminContent.stats.tags')"
        :value="linksLoadError ? null : overview.tags"
        :icon="LucideTags"
        tone="info"
        :loading="linksLoading"
        :detail="tagDetail"
      />
      <AdminStatTile
        :label="t('adminContent.stats.groups')"
        :value="groupsLoadError ? null : overview.groups"
        :icon="LucideFolders"
        tone="success"
        :loading="groupsLoading"
        :detail="groupDetail"
      />
      <AdminStatTile
        :label="t('adminContent.stats.items')"
        :value="groupsLoadError ? null : overview.items"
        :icon="LucideMessagesSquare"
        tone="warning"
        :loading="groupsLoading"
        :detail="itemDetail"
      />
    </AdminStatGrid>

    <Tabs default-value="links" class="gap-3">
      <TabsList>
        <TabsTrigger value="links">
          {{ t("adminContent.tabs.links") }}
          <span v-if="linksReady" class="tabular-nums text-muted-foreground">{{ formatNumberCN(overview.links) }}</span>
        </TabsTrigger>
        <TabsTrigger value="groups">
          {{ t("adminContent.tabs.groups") }}
          <span v-if="groupsReady" class="tabular-nums text-muted-foreground">{{ formatNumberCN(overview.groups) }}</span>
        </TabsTrigger>
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
          <div class="-mx-1 grid max-h-[60vh] gap-x-3 gap-y-3 overflow-y-auto px-1 py-1 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <div class="grid content-start gap-1.5">
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
            <div class="grid content-start gap-1.5">
              <Label for="content-link-sort-order">{{ t("adminContent.linkDialog.fields.sortOrder") }}</Label>
              <Input
                id="content-link-sort-order"
                v-model.number="linkForm.sortOrder"
                type="number"
                min="0"
                inputmode="numeric"
                class="tabular-nums"
                :placeholder="t('adminContent.linkDialog.placeholders.sortOrder')"
                aria-describedby="content-link-sort-order-hint"
              />
            </div>
            <p id="content-link-sort-order-hint" class="-mt-1.5 text-xs text-muted-foreground sm:col-span-2">{{ t("adminContent.linkDialog.fields.sortOrderHint") }}</p>
            <div class="grid content-start gap-1.5 sm:col-span-2">
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
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-link-avatar">{{ t("adminContent.linkDialog.fields.avatarUrl") }}</Label>
              <!-- The icon as it will show, next to the address that produces it. -->
              <div class="flex items-center gap-2">
                <Avatar class="size-9 shrink-0 rounded-lg border">
                  <AvatarImage :key="linkForm.avatar" :src="linkForm.avatar" alt="" class="rounded-lg" />
                  <AvatarFallback class="rounded-lg text-muted-foreground"><LucideLink class="size-4" /></AvatarFallback>
                </Avatar>
                <Input id="content-link-avatar" v-model="linkForm.avatar" class="min-w-0 flex-1" :placeholder="t('adminContent.linkDialog.placeholders.avatarUrl')" />
              </div>
            </div>
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-link-description">{{ t("adminContent.linkDialog.fields.description") }}</Label>
              <Input id="content-link-description" v-model="linkForm.description" :placeholder="t('adminContent.linkDialog.placeholders.description')" />
            </div>
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-link-tags">{{ t("adminContent.linkDialog.fields.tags") }}</Label>
              <Input id="content-link-tags" v-model="linkForm.tags" :placeholder="t('adminContent.linkDialog.placeholders.tags')" />
            </div>
          </div>
          <DialogFooter class="mt-4">
            <DialogClose as-child>
              <Button type="button" variant="outline" :disabled="linkSaving">{{ t("common.cancel") }}</Button>
            </DialogClose>
            <Button type="submit" :disabled="linkSaving">
              <LucideLoader2 v-if="linkSaving" class="size-4 animate-spin" />
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
          <div class="-mx-1 grid max-h-[60vh] gap-x-3 gap-y-3 overflow-y-auto px-1 py-1 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <div class="grid content-start gap-1.5">
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
            <div class="grid content-start gap-1.5">
              <Label for="content-item-sort-order">{{ t("adminContent.linkDialog.fields.sortOrder") }}</Label>
              <Input
                id="content-item-sort-order"
                v-model.number="itemForm.sortOrder"
                type="number"
                min="0"
                inputmode="numeric"
                class="tabular-nums"
                :placeholder="t('adminContent.linkDialog.placeholders.sortOrder')"
                aria-describedby="content-item-sort-order-hint"
              />
            </div>
            <p id="content-item-sort-order-hint" class="-mt-1.5 text-xs text-muted-foreground sm:col-span-2">{{ t("adminContent.linkDialog.fields.sortOrderHint") }}</p>
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-item-avatar">{{ t("adminContent.itemDialog.fields.avatarUrl") }}</Label>
              <div class="flex items-center gap-2">
                <Avatar class="size-9 shrink-0 border">
                  <AvatarImage :key="itemForm.avatar" :src="itemForm.avatar" alt="" />
                  <AvatarFallback class="text-muted-foreground"><LucideMessagesSquare class="size-4" /></AvatarFallback>
                </Avatar>
                <Input id="content-item-avatar" v-model="itemForm.avatar" class="min-w-0 flex-1" :placeholder="t('adminContent.itemDialog.placeholders.avatarUrl')" />
              </div>
            </div>
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-item-bg">{{ t("adminContent.itemDialog.fields.backgroundUrl") }}</Label>
              <Input id="content-item-bg" v-model="itemForm.bg" :placeholder="t('adminContent.itemDialog.placeholders.backgroundUrl')" />
            </div>
            <div class="grid content-start gap-1.5 sm:col-span-2">
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
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-item-group-info">{{ t("adminContent.itemDialog.fields.groupInfo") }}</Label>
              <Input id="content-item-group-info" v-model="itemForm.groupInfo" :placeholder="t('adminContent.itemDialog.placeholders.optional')" />
            </div>
            <div class="grid content-start gap-1.5 sm:col-span-2">
              <Label for="content-item-detail">{{ t("adminContent.itemDialog.fields.detail") }}</Label>
              <Input id="content-item-detail" v-model="itemForm.detail" :placeholder="t('adminContent.itemDialog.placeholders.optional')" />
            </div>
          </div>
          <DialogFooter class="mt-4">
            <DialogClose as-child>
              <Button type="button" variant="outline" :disabled="itemSaving">{{ t("common.cancel") }}</Button>
            </DialogClose>
            <Button type="submit" :disabled="itemSaving">
              <LucideLoader2 v-if="itemSaving" class="size-4 animate-spin" />
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
