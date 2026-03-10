<script setup lang="ts">
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import { useI18n } from "vue-i18n"
import Turnstile from "@/shared/components/Turnstile.vue"
import { Loader2, UserPlus, Mail, X, User, Lock, Key, Send, ShieldCheck } from 'lucide-vue-next'
import {
  Dialog,
  DialogClose,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogScrollContent
} from "@/components/ui/dialog"
import { useRegisterForm } from "@/modules/auth/composables/useRegisterForm"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"

const {
  email,
  username,
  countdown,
  password,
  emailCode,
  isSending,
  isRegistering,
  sendCodeRef,
  registerTurnstileRef,
  isDialogOpen,
  onSendCodeTurnstileVerified,
  onSendCodeTurnstileInvalid,
  onRegisterTurnstileVerified,
  onRegisterTurnstileInvalid,
  handleConfirmSendCode,
  handleRegister,
} = useRegisterForm()
const { t } = useI18n()
</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl flex items-center justify-center gap-2">
          <UserPlus class="h-6 w-6" />
          {{ t("auth.register.title") }}
        </CardTitle>
        <CardDescription>{{ t("auth.register.description") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-6" @submit.prevent="handleRegister">

          <div class="grid gap-2">
            <Label for="username">{{ t("auth.register.usernameLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input
                  id="username"
                  class="pl-10"
                  v-model="username"
                  type="text"
                  :placeholder="t('auth.register.usernamePlaceholder')"
                  required
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="email">{{ t("auth.register.emailLabel") }}</Label>
            <div class="flex gap-2 items-center">
              <div class="relative w-full items-center">
                <Input
                    id="email"
                    v-model="email"
                    class="pl-10"
                    type="email"
                    :placeholder="t('auth.register.emailPlaceholder')"
                    required
                />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Mail class="size-4 text-muted-foreground" />
                </span>
              </div>
              <Dialog v-model:open="isDialogOpen">

                <DialogTrigger as-child>
                  <Button
                      :disabled="isSending || countdown > 0"
                  >
                    <Loader2 v-if="isSending" class="mr-2 h-4 w-4 animate-spin" />
                    <template v-if="isSending">{{ t("auth.register.sending") }}</template>
                    <template v-else-if="countdown > 0">{{ t("auth.register.countdown", { seconds: countdown }) }}</template>
                    <template v-else>
                      <Send class="h-4 w-4 mr-2" />
                      {{ t("auth.register.sendCode") }}
                    </template>
                  </Button>
                </DialogTrigger>
                <DialogScrollContent>
                  <DialogTitle class="flex items-center gap-2">
                    <ShieldCheck class="h-5 w-5" />
                    {{ t("auth.register.sendCodeDialog.title") }}
                  </DialogTitle>
                  <DialogDescription>{{ t("auth.register.sendCodeDialog.description") }}</DialogDescription>
                  <div class="mb-4">
                    <Turnstile
                      ref="sendCodeRef"
                      @verify="onSendCodeTurnstileVerified"
                      @invalid="onSendCodeTurnstileInvalid"
                    />
                  </div>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="secondary" type="button">
                          <X class="h-4 w-4 mr-2" />
                          {{ t("auth.common.cancel") }}
                        </Button>
                      </DialogClose>
                      <Button
                        type="button"
                        :disabled="isSending"
                        @click="handleConfirmSendCode"
                      >
                        <Loader2 v-if="isSending" class="mr-2 h-4 w-4 animate-spin" />
                        <Mail v-else class="h-4 w-4 mr-2" />
                        <span v-if="isSending">{{ t("auth.register.sending") }}</span>
                        <span v-else>{{ t("auth.register.sendCodeDialog.confirmSend") }}</span>
                      </Button>
                    </DialogFooter>
                </DialogScrollContent>
              </Dialog>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="emailCode">{{ t("auth.register.emailCodeLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input
                  id="emailCode"
                  class="pl-10"
                  v-model="emailCode"
                  type="text"
                  :placeholder="t('auth.register.emailCodePlaceholder')"
                  required
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Key class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="password">{{ t("auth.register.passwordLabel") }}</Label>
            <div class="relative w-full items-center">
              <Input
                  id="password"
                  class="pl-10"
                  v-model="password"
                  type="password"
                  :placeholder="t('auth.register.passwordPlaceholder')"
                  required
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Lock class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>
          <Turnstile
            class="md-2"
            ref="registerTurnstileRef"
            @verify="onRegisterTurnstileVerified"
            @invalid="onRegisterTurnstileInvalid"
          />
          <Button type="submit" class="w-full" :disabled="isRegistering">
            <Loader2 v-if="isRegistering" class="mr-2 h-4 w-4 animate-spin" />
            <UserPlus v-else class="h-4 w-4 mr-2" />
            {{ t("auth.register.submit") }}
          </Button>
          <div class="text-center text-sm">
            {{ t("auth.register.hasAccount") }}
            <router-link to="/user/login" class="underline underline-offset-4">
              {{ t("auth.register.goLogin") }}
            </router-link>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
