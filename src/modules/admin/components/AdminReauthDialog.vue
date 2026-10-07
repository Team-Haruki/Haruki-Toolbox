<script setup lang="ts">
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
</script>

<template>
  <Dialog :open="open" @update:open="setOpen">
    <DialogContent class="sm:max-w-md">
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
