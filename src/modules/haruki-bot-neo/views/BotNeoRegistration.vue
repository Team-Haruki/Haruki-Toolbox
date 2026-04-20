<script setup lang="ts">
import { onMounted } from "vue"
import { useI18n } from "vue-i18n"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert"
import {
  Bot,
  Loader2,
  Send,
  ShieldCheck,
  User,
  Key,
  Copy,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
} from "lucide-vue-next"
import { useBotNeoRegistration } from "@/modules/haruki-bot-neo/composables/useBotNeoRegistration"

const { t } = useI18n()
const {
  statusLoading,
  registrationEnabled,
  step,
  qqNumber,
  verificationCode,
  sending,
  registering,
  result,
  isCooldown,
  cooldownSeconds,
  checkStatus,
  handleSendCode,
  handleRegister,
  handleCopy,
  handleReset,
  handleBackToInput,
} = useBotNeoRegistration()

onMounted(() => {
  checkStatus()
})
</script>

<template>
  <div class="w-full flex-1 flex flex-col items-center px-0 py-4">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Bot class="h-6 w-6" />
          {{ t("botNeo.title") }}
        </CardTitle>
        <CardDescription>{{ t("botNeo.description") }}</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Loading status -->
        <div v-if="statusLoading" class="flex items-center justify-center py-8">
          <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
        </div>

        <!-- Registration disabled -->
        <template v-else-if="registrationEnabled === false">
          <Alert variant="destructive">
            <AlertTriangle class="h-4 w-4" />
            <AlertTitle>{{ t("botNeo.disabled.title") }}</AlertTitle>
            <AlertDescription>{{ t("botNeo.disabled.description") }}</AlertDescription>
          </Alert>
          <Button class="w-full" variant="outline" @click="checkStatus">
            <RotateCcw class="mr-2 h-4 w-4" />
            {{ t("botNeo.disabled.retryButton") }}
          </Button>
        </template>

        <!-- Step 1: Input QQ number -->
        <template v-else-if="step === 'input'">
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">{{ t("botNeo.input.qqLabel") }}</label>
            <div class="relative w-full items-center">
              <Input
                v-model="qqNumber"
                :placeholder="t('botNeo.input.qqPlaceholder')"
                class="pl-10"
                inputmode="numeric"
                @keydown.enter="handleSendCode"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <User class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>

          <p class="text-xs text-muted-foreground">
            {{ t("botNeo.input.hint") }}
          </p>

          <Button
            class="w-full"
            :disabled="sending || isCooldown || !qqNumber.trim()"
            @click="handleSendCode"
          >
            <Loader2 v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
            <template v-else>
              <Send class="mr-2 h-4 w-4" />
              <span v-if="isCooldown">
                {{ t("botNeo.input.cooldownButton", { seconds: cooldownSeconds }) }}
              </span>
              <span v-else>{{ t("botNeo.input.sendButton") }}</span>
            </template>
          </Button>
        </template>

        <!-- Step 2: Enter verification code -->
        <template v-else-if="step === 'verify'">
          <div
            class="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:border-blue-700/60 dark:bg-blue-900/20 dark:text-blue-300"
          >
            {{ t("botNeo.verify.codeSentHint", { qq: qqNumber.trim() }) }}
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">{{ t("botNeo.verify.codeLabel") }}</label>
            <div class="relative w-full items-center">
              <Input
                v-model="verificationCode"
                :placeholder="t('botNeo.verify.codePlaceholder')"
                class="pl-10"
                maxlength="6"
                inputmode="numeric"
                @keydown.enter="handleRegister"
              />
              <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                <Key class="size-4 text-muted-foreground" />
              </span>
            </div>
          </div>

          <div class="flex gap-2">
            <Button
              variant="outline"
              class="flex-1"
              @click="handleBackToInput"
            >
              <ArrowLeft class="mr-2 h-4 w-4" />
              {{ t("botNeo.verify.backButton") }}
            </Button>
            <Button
              class="flex-1"
              :disabled="registering || isCooldown || !verificationCode.trim()"
              @click="handleRegister"
            >
              <Loader2 v-if="registering" class="mr-2 h-4 w-4 animate-spin" />
              <template v-else>
                <ShieldCheck class="mr-2 h-4 w-4" />
                {{ t("botNeo.verify.registerButton") }}
              </template>
            </Button>
          </div>

          <Button
            variant="ghost"
            class="w-full"
            :disabled="sending || isCooldown"
            @click="handleSendCode"
          >
            <Loader2 v-if="sending" class="mr-2 h-4 w-4 animate-spin" />
            <template v-else>
              <span v-if="isCooldown">
                {{ t("botNeo.verify.resendCooldown", { seconds: cooldownSeconds }) }}
              </span>
              <span v-else>{{ t("botNeo.verify.resendButton") }}</span>
            </template>
          </Button>
        </template>

        <!-- Step 3: Registration result -->
        <template v-else-if="step === 'result' && result">
          <Alert>
            <CheckCircle class="h-4 w-4" />
            <AlertTitle>{{ t("botNeo.result.successTitle") }}</AlertTitle>
            <AlertDescription>{{ t("botNeo.result.successDescription") }}</AlertDescription>
          </Alert>

          <div class="space-y-3">
            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">{{ t("botNeo.result.botIdLabel") }}</span>
              <div class="flex items-center gap-2">
                <code class="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                  {{ result.bot_id }}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  @click="handleCopy(result!.bot_id, 'Bot ID')"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">{{ t("botNeo.result.credentialLabel") }}</span>
              <div class="flex items-start gap-2">
                <code class="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono break-all max-h-32 overflow-y-auto">
                  {{ result.credential }}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  class="flex-shrink-0"
                  @click="handleCopy(result!.credential, 'Credential')"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div
            class="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-300"
          >
            {{ t("botNeo.result.saveWarning") }}
          </div>

          <Button variant="outline" class="w-full" @click="handleReset">
            <RotateCcw class="mr-2 h-4 w-4" />
            {{ t("botNeo.result.registerAnotherButton") }}
          </Button>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
