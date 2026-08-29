<script setup lang="ts">
import {Input} from "@/components/ui/input"
import {Switch} from "@/components/ui/switch"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import {
  Bot,
  Inbox,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Pencil,
  Plus,
  Save,
  Send,
  Shield,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-vue-next"
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
import type {SocialPlatform} from "@/modules/user-settings/composables/useIMAuthorizationSettings"

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

const platformIcons: Record<SocialPlatform, typeof MessageCircle> = {
  qq: MessageCircle,
  qqbot: Bot,
  discord: MessagesSquare,
  telegram: Send,
}

function getPlatformIcon(platform: SocialPlatform) {
  return platformIcons[platform] ?? MessageCircle
}
</script>

<template>
  <Card class="w-full">
    <CardHeader>
      <div class="flex items-center justify-between gap-2">
        <div>
          <CardTitle class="flex items-center gap-2">
            <Shield class="h-6 w-6" />
            {{ t("userSettings.imAuthorization.title") }}
          </CardTitle>
          <CardDescription>{{ t("userSettings.imAuthorization.description") }}</CardDescription>
        </div>
        <Button size="sm" class="shrink-0" @click="startAdd">
          <Plus class="h-4 w-4 mr-2" />
          {{ t("userSettings.imAuthorization.addButton") }}
        </Button>
      </div>
    </CardHeader>
    <CardContent>
      <ul v-if="tableData.length" class="flex flex-col gap-2">
        <li
          v-for="row in tableData"
          :key="`${row.platform}:${row.userId}:${row.id}`"
          class="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border bg-muted/20 p-3"
        >
          <div class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <component :is="getPlatformIcon(row.platform)" class="size-5" />
          </div>
          <div class="min-w-0 flex-1 basis-40">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold leading-tight">{{ getPlatformLabel(row.platform) }}</p>
              <span
                v-if="row.allowFastVerification"
                class="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                <Zap class="size-3" />
                {{ t("userSettings.imAuthorization.fastVerificationBadge") }}
              </span>
            </div>
            <p class="truncate text-sm text-muted-foreground" :title="row.userId">{{ row.userId }}</p>
            <p v-if="row.comment" class="truncate text-xs text-muted-foreground/80" :title="row.comment">
              {{ row.comment }}
            </p>
          </div>
          <div class="ml-auto flex shrink-0 items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              :title="t('userSettings.imAuthorization.actions.edit')"
              :aria-label="t('userSettings.imAuthorization.actions.edit')"
              @click="startEdit(row)"
            >
              <Pencil class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive hover:text-destructive"
              :title="t('userSettings.imAuthorization.actions.delete')"
              :aria-label="t('userSettings.imAuthorization.actions.delete')"
              @click="confirmDelete(row)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </li>
      </ul>

      <div
        v-else
        class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-10 text-center"
      >
        <Inbox class="h-8 w-8 text-muted-foreground/60" />
        <div class="space-y-1">
          <p class="text-sm font-medium">{{ t("userSettings.imAuthorization.emptyTitle") }}</p>
          <p class="text-sm text-muted-foreground">{{ t("userSettings.imAuthorization.emptyDescription") }}</p>
        </div>
        <Button size="sm" @click="startAdd">
          <Plus class="h-4 w-4 mr-2" />
          {{ t("userSettings.imAuthorization.addButton") }}
        </Button>
      </div>
    </CardContent>
  </Card>

  <Dialog v-model:open="showEditDialog">
    <DialogScrollContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {{ isCreateMode ? t("userSettings.imAuthorization.dialog.createTitle") : t("userSettings.imAuthorization.dialog.editTitle") }}
        </DialogTitle>
        <DialogDescription>
          {{ t("userSettings.imAuthorization.dialog.descriptionMain") }}<br>{{ t("userSettings.imAuthorization.dialog.descriptionHint") }}
        </DialogDescription>
      </DialogHeader>
      <div v-if="editTarget" class="flex flex-col gap-4 py-2">
        <div class="grid gap-1.5">
          <Label id="im-auth-platform-label" for="im-auth-platform">{{ t("userSettings.imAuthorization.fields.platform") }}</Label>
          <Select id="im-auth-platform" :key="locale" v-model="editTarget.platform">
            <SelectTrigger class="w-full" aria-labelledby="im-auth-platform-label">
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
        <div class="grid gap-1.5">
          <Label for="im-auth-account">{{ t("userSettings.imAuthorization.fields.account") }}</Label>
          <div class="relative w-full items-center">
            <Input id="im-auth-account" v-model="editTarget.userId" class="pl-10"/>
            <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
              <User class="size-4 text-muted-foreground" />
            </span>
          </div>
        </div>
        <div class="grid gap-1.5">
          <Label for="im-auth-remark">{{ t("userSettings.imAuthorization.fields.remark") }}</Label>
          <Input id="im-auth-remark" v-model="editTarget.comment"/>
        </div>
        <div class="flex items-start gap-3 rounded-lg border bg-muted/20 p-3">
          <Switch id="im-auth-fast-verification" v-model="editTarget.allowFastVerification" class="mt-0.5" />
          <div class="min-w-0 flex-1 space-y-1">
            <Label for="im-auth-fast-verification">{{ t("userSettings.imAuthorization.fields.allowFastVerification") }}</Label>
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
        <Button :disabled="isSaving" @click="handleEditSave">
          <Loader2 v-if="isSaving" class="h-4 w-4 mr-2 animate-spin" />
          <Save v-else class="h-4 w-4 mr-2" />
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
          <Loader2 v-if="isDeleting" class="h-4 w-4 mr-2 animate-spin" />
          <Trash2 v-else class="h-4 w-4 mr-2" />
          {{ isDeleting ? t("userSettings.imAuthorization.deleteDialog.deleting") : t("userSettings.imAuthorization.actions.delete") }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
