<script setup lang="ts">
import {Input} from "@/components/ui/input"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {Trash2, Plus, Save, X, Shield} from "lucide-vue-next"
import { useI18n } from "vue-i18n"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogScrollContent
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
  AlertDialog,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import {useIMAuthorizationSettings} from "@/modules/user-settings/composables/useIMAuthorizationSettings"
import { useIMAuthorizationTable } from "@/modules/user-settings/composables/useIMAuthorizationTable"

const { t, locale } = useI18n()

const {
  showEditDialog,
  editTarget,
  isCreateMode,
  showDeleteDialog,
  deleteTarget,
  isSaving,
  isDeleting,
  tableData,
  getPlatformLabel,
  startEdit,
  startAdd,
  handleEditSave,
  confirmDelete,
  handleDelete,
} = useIMAuthorizationSettings()

const { columns, table, FlexRender } = useIMAuthorizationTable({
  tableData,
  getPlatformLabel,
  onEdit: startEdit,
  onDelete: confirmDelete,
})

</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <div class="flex items-center justify-between gap-2">
        <div>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-6 w-6" />
            {{ t("userSettings.imAuthorization.title") }}
          </CardTitle>
          <CardDescription>{{ t("userSettings.imAuthorization.description") }}</CardDescription>
        </div>
        <Button size="sm" @click="startAdd">
          <Plus class="h-4 w-4 mr-2" />
          {{ t("userSettings.imAuthorization.addButton") }}
        </Button>
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
                  {{ t("userSettings.imAuthorization.empty") }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </CardContent>
  </Card>

  <Dialog v-model:open="showEditDialog">
    <DialogScrollContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {{ isCreateMode ? t("userSettings.imAuthorization.dialog.createTitle") : t("userSettings.imAuthorization.dialog.editTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ t("userSettings.imAuthorization.dialog.descriptionMain") }}<br>{{ t("userSettings.imAuthorization.dialog.descriptionHint") }}
        </DialogDescription>
      </DialogHeader>
      <div v-if="editTarget" class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="platform" class="text-right">{{ t("userSettings.imAuthorization.fields.platform") }}</Label>
          <Select :key="locale" v-model="editTarget.platform">
            <SelectTrigger
                id="platform"
                class="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <SelectValue :placeholder="t('userSettings.imAuthorization.platformPlaceholder')"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="qq">{{ t("userSettings.imAuthorization.platforms.qq") }}</SelectItem>
              <SelectItem value="qqbot">{{ t("userSettings.imAuthorization.platforms.qqbot") }}</SelectItem>
              <!--
              <SelectItem value="discord">{{ t("userSettings.imAuthorization.platforms.discord") }}</SelectItem>
              <SelectItem value="telegram">{{ t("userSettings.imAuthorization.platforms.telegram") }}</SelectItem>
              -->
            </SelectContent>
          </Select>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="account" class="text-right">{{ t("userSettings.imAuthorization.fields.account") }}</Label>
          <Input id="account" v-model="editTarget.userId" class="col-span-3"/>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="remark" class="text-right">{{ t("userSettings.imAuthorization.fields.remark") }}</Label>
          <Input id="remark" v-model="editTarget.comment" class="col-span-3"/>
        </div>
        <div class="flex items-center space-x-4 rounded-lg border p-4">
          <Switch id="allowFastVerification" v-model="editTarget.allowFastVerification" />
          <div class="flex-1 space-y-1">
            <Label for="allowFastVerification">{{ t("userSettings.imAuthorization.fields.allowFastVerification") }}</Label>
            <p class="text-xs text-muted-foreground leading-snug">
              {{ t("userSettings.imAuthorization.fields.allowFastVerificationHint") }}
            </p>
          </div>
        </div>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">
            <X class="h-4 w-4 mr-2" />
            {{ t("userSettings.common.cancel") }}
          </Button>
        </DialogClose>
        <Button @click="handleEditSave" :disabled="isSaving">
          <Save class="h-4 w-4 mr-2" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>

  <AlertDialog v-model:open="showDeleteDialog">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("userSettings.imAuthorization.deleteDialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription class="break-all">
          {{ t("userSettings.imAuthorization.deleteDialog.description", {
            platform: deleteTarget ? getPlatformLabel(deleteTarget.platform) : "",
            userId: deleteTarget?.userId ?? "",
          }) }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          <X class="h-4 w-4 mr-2" />
          {{ t("userSettings.common.cancel") }}
        </AlertDialogCancel>
        <AlertDialogAction class="bg-destructive" :disabled="isDeleting" @click="handleDelete">
          <Trash2 class="h-4 w-4 mr-2" />
          {{ isDeleting ? t("userSettings.imAuthorization.deleteDialog.deleting") : t("userSettings.imAuthorization.actions.delete") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
