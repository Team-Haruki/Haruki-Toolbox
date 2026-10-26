<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import FieldError from "@/shared/components/FieldError.vue"
import { ADMIN_USER_EMAIL_FIELD_ID } from "@/modules/admin-users/composables/useAdminUserDetailPrimaryActions"

defineProps<{
    open: boolean
    userName?: string
    email: string
    /** Inline validation message from the last save attempt; cleared on typing. */
    emailError?: string
    actionLoading: boolean
}>()

const emit = defineEmits<{
    (e: "update:open", value: boolean): void
    (e: "update:email", value: string): void
    (e: "save"): void
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("adminUsers.detail.dialog.email.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("adminUsers.detail.dialog.email.description", { name: userName }) }}
        </DialogDescription>
      </DialogHeader>
      <form id="admin-user-email-form" class="flex flex-col gap-4 py-2" novalidate @submit.prevent="emit('save')">
        <div class="flex flex-col gap-1.5">
          <Label :for="ADMIN_USER_EMAIL_FIELD_ID">{{ t("adminUsers.detail.dialog.email.newEmail") }}</Label>
          <Input
            :id="ADMIN_USER_EMAIL_FIELD_ID"
            :model-value="email"
            :placeholder="t('adminUsers.detail.dialog.email.placeholder')"
            type="email"
            autocomplete="off"
            :aria-invalid="!!emailError || undefined"
            :aria-describedby="emailError ? `${ADMIN_USER_EMAIL_FIELD_ID}-error` : undefined"
            @update:model-value="emit('update:email', String($event ?? ''))"
          />
          <FieldError :id="`${ADMIN_USER_EMAIL_FIELD_ID}-error`" :message="emailError" />
        </div>
      </form>
      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">{{ t("adminUsers.common.cancel") }}</Button>
        <Button type="submit" form="admin-user-email-form" :disabled="!email.trim() || actionLoading">
          {{ t("adminUsers.detail.dialog.email.confirm") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
