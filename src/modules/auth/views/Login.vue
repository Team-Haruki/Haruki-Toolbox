<script setup lang="ts">
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Button} from "@/components/ui/button"
import { useI18n } from "vue-i18n"
import { Loader2, LogIn, Mail, X, Lock, KeyRound } from 'lucide-vue-next'
import Turnstile from "@/shared/components/Turnstile.vue"

import { useLoginForm } from "@/modules/auth/composables/useLoginForm"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from "@/components/ui/card"
import {
  Dialog,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogDescription,
  DialogScrollContent
} from "@/components/ui/dialog"

const {
  email,
  password,
  resetEmail,
  loginTurnstileRef,
  resetTurnstileRef,
  isLoggingIn,
  isSendingResetEmail,
  onLoginTurnstileVerified,
  onLoginTurnstileInvalid,
  onResetTurnstileVerified,
  onResetTurnstileInvalid,
  handleResetPassword,
  handleLogin,
} = useLoginForm()
const { t } = useI18n()

</script>

<template>
  <div class="w-full flex-1 flex items-center justify-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl flex items-center justify-center gap-2">
          <LogIn class="h-6 w-6" />
          {{ t("auth.login.title") }}
        </CardTitle>
        <CardDescription>
          {{ t("auth.login.description") }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="handleLogin">
          <div class="grid gap-6">
          <div class="grid gap-2">
              <Label html-for="email">{{ t("auth.login.emailLabel") }}</Label>
              <div class="relative w-full items-center">
                <Input
                    id="email"
                    type="email"
                    class="pl-10"
                    :placeholder="t('auth.login.emailPlaceholder')"
                    required
                    v-model="email"
                />
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Mail class="size-4 text-muted-foreground" />
                </span>
              </div>
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label html-for="password">{{ t("auth.login.passwordLabel") }}</Label>
                <Dialog>
                  <DialogTrigger as-child>
                    <a href="javascript:void(0)" class="ml-auto text-sm underline-offset-4 hover:underline">
                      {{ t("auth.login.forgotPassword") }}
                    </a>
                  </DialogTrigger>
                  <DialogScrollContent class="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle class="flex items-center gap-2">
                        <KeyRound class="h-5 w-5" />
                        {{ t("auth.login.resetDialog.title") }}
                      </DialogTitle>
                      <DialogDescription>{{ t("auth.login.resetDialog.description") }}</DialogDescription>
                    </DialogHeader>
                    <div class="py-4">
                      <Label for="reset-email">{{ t("auth.login.emailLabel") }}</Label>
                      <div class="relative w-full items-center mt-2 mb-4">
                        <Input
                            id="reset-email"
                            type="email"
                            class="pl-10"
                            :placeholder="t('auth.login.emailPlaceholder')"
                            v-model="resetEmail"
                        />
                        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                          <Mail class="size-4 text-muted-foreground" />
                        </span>
                      </div>
                      <Turnstile
                        ref="resetTurnstileRef"
                        @verify="onResetTurnstileVerified"
                        @invalid="onResetTurnstileInvalid"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose as-child>
                        <Button variant="outline">
                          <X class="h-4 w-4 mr-2" />
                          {{ t("auth.common.cancel") }}
                        </Button>
                      </DialogClose>
                      <Button @click="handleResetPassword" :disabled="isSendingResetEmail">
                        <Loader2 v-if="isSendingResetEmail" class="mr-2 h-4 w-4 animate-spin" />
                        <Mail v-else class="h-4 w-4 mr-2" />
                        {{ t("auth.login.resetDialog.sendResetEmail") }}
                      </Button>
                    </DialogFooter>
                  </DialogScrollContent>
                </Dialog>
              </div>
              <div class="relative w-full items-center">
                <Input id="password" type="password" class="pl-10" :placeholder="t('auth.login.passwordPlaceholder')" required v-model="password"/>
                <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                  <Lock class="size-4 text-muted-foreground" />
                </span>
              </div>
              <Turnstile
                ref="loginTurnstileRef"
                @verify="onLoginTurnstileVerified"
                @invalid="onLoginTurnstileInvalid"
              />
            </div>
            <Button type="submit" class="w-full" :disabled="isLoggingIn">
              <Loader2 v-if="isLoggingIn" class="mr-2 h-4 w-4 animate-spin" />
              <LogIn v-else class="h-4 w-4 mr-2" />
              {{ t("auth.login.submit") }}
            </Button>
            <div class="text-center text-sm">
              {{ t("auth.login.noAccount") }}
              <router-link to="/user/register" class="underline underline-offset-4">
                {{ t("auth.login.registerLink") }}
              </router-link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
