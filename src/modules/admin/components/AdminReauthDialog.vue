<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue"
import { useI18n } from "vue-i18n"
import { LucideLoader2, LucideShieldCheck } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminReauthDialog } from "@/modules/admin/composables/useAdminReauthDialog"

const { t } = useI18n()
const { open, password, submitting, inlineError, setOpen, submit } = useAdminReauthDialog()

// The prompt opens from inside other dialogs (a ConfirmDialog whose action
// answered "reauthentication required"). While it is up those dialogs are
// hidden (see the global style below) so the admin sees one modal, and they
// come back as they were once the password check settles.
const REAUTH_OPEN_ATTRIBUTE = "data-admin-reauth-open"

watch(open, (isOpen) => {
  if (typeof document === "undefined") return
  if (isOpen) {
    document.body.setAttribute(REAUTH_OPEN_ATTRIBUTE, "")
  } else {
    document.body.removeAttribute(REAUTH_OPEN_ATTRIBUTE)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.removeAttribute(REAUTH_OPEN_ATTRIBUTE)
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="setOpen">
    <!--
      z-[60]: the prompt opens from inside other dialogs (e.g. a ConfirmDialog
      whose action answered "reauthentication required"). Its portal is
      anchored where AdminLayout mounted it, i.e. before those dialogs in the
      DOM, so at the shared z-50 it would sit under their overlay and clicks on
      the password field would land on that overlay and dismiss the prompt.
    -->
    <DialogContent class="admin-reauth-dialog z-[60] sm:max-w-md" overlay-class="z-[60]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <LucideShieldCheck class="h-4 w-4 shrink-0 text-primary" />
          {{ t("admin.reauth.title") }}
        </DialogTitle>
        <DialogDescription>{{ t("admin.reauth.description") }}</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" novalidate @submit.prevent="submit">
        <div class="space-y-2">
          <Label for="admin-reauth-password">{{ t("admin.reauth.passwordLabel") }}</Label>
          <Input
            id="admin-reauth-password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            :disabled="submitting"
            :aria-invalid="inlineError ? true : undefined"
            :aria-describedby="inlineError ? 'admin-reauth-error' : undefined"
          />
          <p v-if="inlineError" id="admin-reauth-error" role="alert" class="text-sm text-destructive">
            {{ inlineError }}
          </p>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="outline">{{ t("common.cancel") }}</Button>
          </DialogClose>
          <Button type="submit" :disabled="submitting">
            <LucideLoader2 v-if="submitting" class="mr-1 h-4 w-4 animate-spin" />
            {{ t("admin.reauth.submit") }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<style>
/* Only the password prompt is visible while it is open; the dialog that
   triggered it waits underneath (its overlay keeps the page dimmed). */
body[data-admin-reauth-open] [data-slot="alert-dialog-content"]:not(.admin-reauth-dialog),
body[data-admin-reauth-open] [data-slot="dialog-content"]:not(.admin-reauth-dialog) {
  visibility: hidden;
}
</style>
