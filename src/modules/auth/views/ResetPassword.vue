<script setup lang="ts">
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import { useI18n } from "vue-i18n"
import {Loader2, Lock, Mail, Check, KeyRound} from "lucide-vue-next"
import { useResetPasswordForm } from "@/modules/auth/composables/useResetPasswordForm"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"

const {
  email,
  newPassword,
  confirmPassword,
  isSubmitting,
  handleSubmit,
} = useResetPasswordForm()
const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center justify-center gap-6 px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <KeyRound class="h-6 w-6" />
          {{ t("auth.resetPassword.title") }}
        </CardTitle>
        <CardDescription>{{ t("auth.resetPassword.description") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <Label for="email">{{ t("auth.resetPassword.emailLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input id="email" type="email" class="pl-10" v-model="email" readonly disabled/>
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Mail class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>

          <div>
            <Label for="new-password">{{ t("auth.resetPassword.newPasswordLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input
                  id="new-password"
                  class="pl-10"
                  type="password"
                  v-model="newPassword"
                  :placeholder="t('auth.resetPassword.newPasswordPlaceholder')"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Lock class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>

          <div>
            <Label for="confirm-password">{{ t("auth.resetPassword.confirmPasswordLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input
                  id="confirm-password"
                  class="pl-10"
                  type="password"
                  v-model="confirmPassword"
                  :placeholder="t('auth.resetPassword.confirmPasswordPlaceholder')"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Lock class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            <Check v-else class="mr-2 h-4 w-4" />
            {{ t("auth.resetPassword.submit") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
