<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import {
  LucideLoader2,
  LucideSave,
  LucideShieldCheck,
  LucideUserPlus,
} from "lucide-vue-next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Switch } from "@/components/ui/switch"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import FieldError from "@/shared/components/FieldError.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import SponsorDurationPanel from "@/modules/admin-sponsors/components/SponsorDurationPanel.vue"
import SponsorManualDurationDialog from "@/modules/admin-sponsors/components/SponsorManualDurationDialog.vue"
import SponsorStatsPanel from "@/modules/admin-sponsors/components/SponsorStatsPanel.vue"
import SponsorTable from "@/modules/admin-sponsors/components/SponsorTable.vue"
import ToolboxSponsorPanel from "@/modules/admin-sponsors/components/ToolboxSponsorPanel.vue"
import {
  SPONSOR_FIELD_IDS,
  useAdminSponsorManagement,
} from "@/modules/admin-sponsors/composables/useAdminSponsorManagement"
import { categoryBadgeVariant } from "@/modules/admin-sponsors/lib/manual-duration"
import type { AdminSponsorProfile } from "@/types/admin"

const { t } = useI18n()

const {
  loading,
  loadError,
  refreshing,
  saving,
  syncing,
  syncConfirmOpen,
  sponsors,
  generatedAt,
  total,
  editOpen,
  editingSponsor,
  form,
  editNameError,
  detail,
  detailLoading,
  detailError,
  manualDialogOpen,
  editingEntryId,
  manualForm,
  manualErrors,
  manualSaving,
  deletingEntry,
  afdianToggleConfirmOpen,
  afdianToggleTarget,
  createOpen,
  creating,
  createForm,
  createNameError,
  refreshSponsors,
  reloadSponsors,
  retryDetail,
  openEditDialog,
  updateEditName,
  saveSponsor,
  startNewManualEntry,
  startEditManualEntry,
  updateManualForm,
  closeManualDialog,
  saveManualEntry,
  deleteManualEntry,
  openCreateDialog,
  updateCreateName,
  createSponsor,
  isToggling,
  requestAfdianToggle,
  executeAfdianToggle,
  requestSyncFromAfdian,
  executeSyncFromAfdian,
  formatDate,
} = useAdminSponsorManagement()

// The values the backend accepts for `source`; anything else is refused.
const SOURCE_OPTIONS = ["afdian", "manual", "legacy", "imported"] as const

/** The stored value stays selectable even when it is not one of the known sources. */
const sourceOptions = computed(() => {
  const current = form.value.source
  const known: readonly string[] = SOURCE_OPTIONS
  return current && !known.includes(current) ? [...SOURCE_OPTIONS, current] : [...SOURCE_OPTIONS]
})

function sourceOptionLabel(source: string) {
  const known: readonly string[] = SOURCE_OPTIONS
  return known.includes(source) ? `${t(`adminSponsors.source.${source}`)} (${source})` : source
}

function fallbackName(sponsor: AdminSponsorProfile | null) {
  return sponsor?.name || t("adminSponsors.common.anonymous")
}

function fallbackInitial(sponsor: AdminSponsorProfile | null) {
  return fallbackName(sponsor).charAt(0).toUpperCase()
}

const afdianToggleText = computed(() => {
  const target = afdianToggleTarget.value
  const name = fallbackName(target?.sponsor ?? null)
  return target?.disabled
    ? {
        title: t("adminSponsors.afdianToggleDialog.disableTitle"),
        description: t("adminSponsors.afdianToggleDialog.disableDescription", { name }),
        confirm: t("adminSponsors.afdianToggleDialog.confirmDisable"),
      }
    : {
        title: t("adminSponsors.afdianToggleDialog.enableTitle"),
        description: t("adminSponsors.afdianToggleDialog.enableDescription", { name }),
        confirm: t("adminSponsors.afdianToggleDialog.confirmEnable"),
      }
})

function handleManualDialogOpen(open: boolean) {
  if (!open) closeManualDialog()
}
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <!-- Every figure here is counted over the whole list, not the rows on screen. -->
    <SponsorStatsPanel :sponsors="sponsors" :total="total" :loading="loading" :failed="!!loadError" />

    <SponsorTable
      :sponsors="sponsors"
      :loading="loading"
      :load-error="loadError"
      :refreshing="refreshing"
      :syncing="syncing"
      :generated-at="generatedAt"
      :is-toggling="isToggling"
      :format-date="formatDate"
      @refresh="refreshSponsors"
      @retry="reloadSponsors"
      @sync="requestSyncFromAfdian"
      @create="openCreateDialog"
      @edit="openEditDialog"
      @toggle="requestAfdianToggle"
    />

    <ToolboxSponsorPanel />

    <Dialog v-model:open="editOpen">
      <DialogScrollContent class="sm:max-w-[min(46rem,92vw)]">
        <DialogHeader>
          <DialogTitle>{{ t("adminSponsors.edit.title") }}</DialogTitle>
        </DialogHeader>

        <div class="@container flex flex-col gap-5 py-1">
          <!-- Who is being edited; the id never changes. -->
          <div class="flex items-center gap-3">
            <Avatar class="size-11 shrink-0 border">
              <AvatarImage :src="form.avatar" :alt="fallbackName(editingSponsor)" />
              <AvatarFallback class="text-sm font-semibold">{{ fallbackInitial(editingSponsor) }}</AvatarFallback>
            </Avatar>
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p class="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">{{ form.name || fallbackName(editingSponsor) }}</p>
                <Badge v-if="editingSponsor" :variant="categoryBadgeVariant(editingSponsor.category)" size="sm">
                  {{ t(`adminSponsors.category.${editingSponsor.category}`) }}
                </Badge>
                <Badge v-if="editingSponsor" :variant="editingSponsor.toolboxBound ? 'sky' : 'muted'" size="sm">
                  {{ t("adminSponsors.binding.title") }} · {{ t(editingSponsor.toolboxBound ? "adminSponsors.binding.bound" : "adminSponsors.binding.unbound") }}
                </Badge>
              </div>
              <p class="mt-0.5 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ editingSponsor?.id }}</p>
            </div>
          </div>

          <form id="admin-sponsor-edit-form" novalidate @submit.prevent="saveSponsor">
            <SettingsGroup :title="t('adminSponsors.edit.profileGroup')">
              <div class="grid gap-x-4 gap-y-3 px-4 py-3 @min-[34rem]:grid-cols-2">
                <div class="grid content-start gap-1.5">
                  <Label :for="SPONSOR_FIELD_IDS.editName">{{ t("adminSponsors.edit.name") }}</Label>
                  <Input
                    :id="SPONSOR_FIELD_IDS.editName"
                    class="bg-background"
                    :model-value="form.name"
                    :aria-invalid="!!editNameError || undefined"
                    :aria-describedby="editNameError ? `${SPONSOR_FIELD_IDS.editName}-error` : undefined"
                    @update:model-value="updateEditName(String($event ?? ''))"
                  />
                  <FieldError :id="`${SPONSOR_FIELD_IDS.editName}-error`" :message="editNameError" />
                </div>
                <div class="grid content-start gap-1.5">
                  <Label for="admin-sponsor-plan">{{ t("adminSponsors.edit.planName") }}</Label>
                  <Input id="admin-sponsor-plan" v-model="form.planName" class="bg-background" />
                </div>
                <div class="grid content-start gap-1.5 @min-[34rem]:col-span-2">
                  <Label for="admin-sponsor-avatar">{{ t("adminSponsors.edit.avatar") }}</Label>
                  <Input id="admin-sponsor-avatar" v-model="form.avatar" class="bg-background" inputmode="url" :placeholder="t('adminSponsors.edit.avatarPlaceholder')" />
                </div>
                <div class="grid content-start gap-1.5 [&_[data-slot=native-select-wrapper]]:w-full">
                  <Label for="admin-sponsor-source">{{ t("adminSponsors.edit.source") }}</Label>
                  <NativeSelect id="admin-sponsor-source" :model-value="form.source" class="w-full bg-background" @update:model-value="form.source = String($event ?? '')">
                    <NativeSelectOption v-if="!form.source" value="">{{ t("adminSponsors.common.fallback") }}</NativeSelectOption>
                    <NativeSelectOption v-for="source in sourceOptions" :key="source" :value="source">
                      {{ sourceOptionLabel(source) }}
                    </NativeSelectOption>
                  </NativeSelect>
                </div>
                <div class="grid content-start gap-1.5">
                  <Label for="admin-sponsor-paid-at">{{ t("adminSponsors.edit.paidAt") }}</Label>
                  <DateTimePicker24h
                    id="admin-sponsor-paid-at"
                    v-model="form.paidAt"
                    :placeholder="t('adminSponsors.edit.paidAtPlaceholder')"
                  />
                </div>
                <div class="grid content-start gap-1.5 @min-[34rem]:col-span-2">
                  <Label for="admin-sponsor-message">{{ t("adminSponsors.edit.message") }}</Label>
                  <textarea
                    id="admin-sponsor-message"
                    v-model="form.message"
                    rows="2"
                    class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <SettingsRow
                :icon="LucideShieldCheck"
                :tone="form.afdianSyncDisabled ? 'warning' : 'default'"
                :label="t('adminSponsors.edit.afdianSyncDisabled')"
                :help="t('adminSponsors.edit.afdianSyncHelp')"
                label-for="admin-sponsor-afdian-sync"
              >
                <Switch
                  id="admin-sponsor-afdian-sync"
                  :model-value="form.afdianSyncDisabled"
                  @update:model-value="form.afdianSyncDisabled = !!$event"
                />
              </SettingsRow>
              <p class="px-4 py-2.5 text-xs text-muted-foreground">{{ t("adminSponsors.edit.manualProfileHint") }}</p>
            </SettingsGroup>
          </form>

          <!-- Durations are managed here, outside the profile form; the manual
               entries open their own dialog with its own save. -->
          <SponsorDurationPanel
            :detail="detail"
            :loading="detailLoading"
            :load-error="detailError"
            :deleting="deletingEntry"
            :format-date="formatDate"
            :delete-entry="deleteManualEntry"
            @new="startNewManualEntry"
            @edit="startEditManualEntry"
            @retry="retryDetail"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="saving" @click="editOpen = false">
            {{ t("common.cancel") }}
          </Button>
          <Button type="submit" form="admin-sponsor-edit-form" :disabled="saving">
            <LucideLoader2 v-if="saving" class="size-4 animate-spin" />
            <LucideSave v-else class="size-4" />
            {{ t("adminSponsors.edit.saveProfile") }}
          </Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>

    <SponsorManualDurationDialog
      :open="manualDialogOpen"
      :form="manualForm"
      :errors="manualErrors"
      :editing="editingEntryId !== null"
      :saving="manualSaving"
      @update:open="handleManualDialogOpen"
      @update:form="updateManualForm"
      @save="saveManualEntry"
    />

    <Dialog v-model:open="createOpen">
      <DialogScrollContent class="sm:max-w-[min(32rem,92vw)]">
        <DialogHeader>
          <DialogTitle>{{ t("adminSponsors.create.title") }}</DialogTitle>
          <DialogDescription>{{ t("adminSponsors.create.description") }}</DialogDescription>
        </DialogHeader>
        <form id="admin-sponsor-create-form" class="grid gap-3 py-1" novalidate @submit.prevent="createSponsor">
          <div class="grid gap-1.5">
            <Label :for="SPONSOR_FIELD_IDS.createName">{{ t("adminSponsors.edit.name") }}</Label>
            <Input
              :id="SPONSOR_FIELD_IDS.createName"
              :model-value="createForm.name"
              :aria-invalid="!!createNameError || undefined"
              :aria-describedby="createNameError ? `${SPONSOR_FIELD_IDS.createName}-error` : undefined"
              @update:model-value="updateCreateName(String($event ?? ''))"
            />
            <FieldError :id="`${SPONSOR_FIELD_IDS.createName}-error`" :message="createNameError" />
          </div>
          <div class="grid gap-1.5">
            <Label for="admin-sponsor-create-plan">{{ t("adminSponsors.edit.planName") }}</Label>
            <Input id="admin-sponsor-create-plan" v-model="createForm.planName" />
          </div>
          <div class="grid gap-1.5">
            <Label for="admin-sponsor-create-avatar">{{ t("adminSponsors.edit.avatar") }}</Label>
            <Input id="admin-sponsor-create-avatar" v-model="createForm.avatar" inputmode="url" :placeholder="t('adminSponsors.edit.avatarPlaceholder')" />
          </div>
          <div class="grid gap-1.5">
            <Label for="admin-sponsor-create-message">{{ t("adminSponsors.edit.message") }}</Label>
            <Input id="admin-sponsor-create-message" v-model="createForm.message" />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" :disabled="creating" @click="createOpen = false">
            {{ t("common.cancel") }}
          </Button>
          <Button type="submit" form="admin-sponsor-create-form" :disabled="creating">
            <LucideLoader2 v-if="creating" class="size-4 animate-spin" />
            <LucideUserPlus v-else class="size-4" />
            {{ t("adminSponsors.create.submit") }}
          </Button>
        </DialogFooter>
      </DialogScrollContent>
    </Dialog>

    <ConfirmDialog
      v-model:open="syncConfirmOpen"
      :title="t('adminSponsors.syncDialog.title')"
      :description="t('adminSponsors.syncDialog.description')"
      :confirm-label="t('adminSponsors.actions.syncAfdian')"
      :on-confirm="executeSyncFromAfdian"
    />

    <ConfirmDialog
      v-model:open="afdianToggleConfirmOpen"
      :title="afdianToggleText.title"
      :description="afdianToggleText.description"
      :confirm-label="afdianToggleText.confirm"
      :on-confirm="executeAfdianToggle"
    />
  </div>
</template>
