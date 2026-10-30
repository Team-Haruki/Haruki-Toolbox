<script setup lang="ts">
import { computed, ref, toRef, useTemplateRef, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { RouterLink, useRoute } from "vue-router"
import {
  Database,
  Dices,
  Globe,
  Info,
  Link2,
  Loader2,
  Lock,
  LogIn,
  LucideChevronDown,
  Repeat,
  ScanSearch,
  ServerCog,
  ShieldCheck,
  Smartphone,
  User,
} from "lucide-vue-next"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input, InputWithToggle } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import FieldError from "@/shared/components/FieldError.vue"
import { useUserStore } from "@/shared/stores/user"
import { toInheritApiError } from "@/modules/tools/api/inherit"
import type { InheritNewPasswordMode } from "@/modules/tools/lib/inherit-job"
import { describeInheritApiError } from "@/modules/tools/lib/inherit-messages"
import { INHERIT_FIELD_IDS, useInheritUploadForm } from "@/modules/tools/composables/useInheritUploadForm"
import { useInheritJob } from "@/modules/tools/composables/useInheritJob"
import { useInheritVault } from "@/modules/tools/composables/useInheritVault"
import InheritJobPanel from "@/modules/tools/components/inherit/InheritJobPanel.vue"
import InheritVaultPanel from "@/modules/tools/components/inherit/InheritVaultPanel.vue"

const props = defineProps<{
  /** MySekai uploads require a verified QQ binding; hidden otherwise. */
  canShowMySekaiDataType: boolean
}>()

const { t, locale } = useI18n()
const route = useRoute()
const userStore = useUserStore()
const currentUserId = () => (userStore.isLoggedIn ? userStore.userId : null)

const form = useInheritUploadForm(toRef(props, "canShowMySekaiDataType"))
const inheritJob = useInheritJob(currentUserId)
const vault = useInheritVault(currentUserId)
const vaultPanel = useTemplateRef<InstanceType<typeof InheritVaultPanel>>("vaultPanel")

const notesOpen = ref(false)
const loginRoute = computed(() => ({ name: "user.login", query: { redirect: route.fullPath } }))

const ERROR_IDS = {
  inheritId: "inherit-id-error",
  inheritPassword: "inherit-password-error",
} as const

const PASSWORD_MODES: { value: InheritNewPasswordMode; icon: typeof Repeat }[] = [
  { value: "reuse", icon: Repeat },
  { value: "random", icon: Dices },
]

function handleDataTypeChange(value: AcceptableValue) {
  if (value === "suite" || (value === "mysekai" && props.canShowMySekaiDataType)) {
    form.dataType.value = value
  }
}

function handleServerChange(value: AcceptableValue) {
  if (value === "jp" || value === "en") {
    form.server.value = value
  }
}

const FIELD_ERROR_CODES: Record<string, "inheritId" | "inheritPassword"> = {
  inherit_id_invalid: "inheritId",
  inherit_password_invalid: "inheritPassword",
  reuse_password_invalid: "inheritPassword",
}

async function submit() {
  if (inheritJob.creating.value || !form.validate()) return
  try {
    const started = await inheritJob.create(form.toCreateInput())
    form.clearSecrets()
    if (started.resumed) toast.info(t("tools.uploadData.inheritJob.toast.resumedRunning"))
  } catch (error) {
    const problem = toInheritApiError(error)
    const message = describeInheritApiError(t, problem)
    const field = FIELD_ERROR_CODES[problem.code]
    if (field) {
      form.fieldErrors[field] = message
      document.getElementById(INHERIT_FIELD_IDS[field])?.focus()
      return
    }
    toast.error(t("tools.uploadData.toast.uploadFailedTitle"), { description: message })
  }
}

function goToVault() {
  document.getElementById("inherit-vault")?.scrollIntoView({ behavior: "smooth", block: "start" })
}

function openVaultReset() {
  vaultPanel.value?.openReset()
}

// The vault gains an entry once the credential is stored, and its code
// changes when the new one is: keep its list in step with the job.
watch(
  () => [inheritJob.job.value?.vaultEntryId ?? "", inheritJob.job.value?.status ?? "", inheritJob.newCode.value?.inheritId ?? ""] as const,
  ([entryId, status, codeId], previous) => {
    if (!previous) return
    if (entryId !== previous[0] || status !== previous[1] || codeId !== previous[2]) void vault.refresh()
  },
)
</script>

<template>
  <template v-if="!userStore.isLoggedIn">
    <Card data-testid="inherit-login-required">
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <ServerCog class="h-6 w-6" />
          {{ t("tools.uploadData.inheritTab.title") }}
        </CardTitle>
        <CardDescription>{{ t("tools.uploadData.inheritTab.loginRequired.description") }}</CardDescription>
      </CardHeader>
      <CardFooter class="justify-end">
        <Button as-child>
          <RouterLink :to="loginRoute">
            <LogIn class="size-4" />
            {{ t("tools.uploadData.inheritTab.loginRequired.action") }}
          </RouterLink>
        </Button>
      </CardFooter>
    </Card>
  </template>

  <template v-else>
    <div v-if="inheritJob.resuming.value && !inheritJob.job.value" class="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
      <Loader2 class="size-4 animate-spin" />
    </div>

    <InheritJobPanel
      v-else-if="inheritJob.job.value"
      :job="inheritJob.job.value"
      :new-code="inheritJob.newCode.value"
      :code-acknowledged="inheritJob.codeAcknowledged.value"
      :connection-state="inheritJob.connectionState.value"
      :command-pending="inheritJob.commandPending.value"
      :expired="inheritJob.expired.value"
      :can-dismiss="inheritJob.canDismiss.value"
      :key-status="vault.keyStatus.value"
      :on-confirm="inheritJob.confirm"
      :on-cancel="inheritJob.cancel"
      @acknowledge="inheritJob.acknowledgeCode"
      @dismiss="inheritJob.dismiss"
      @refresh="inheritJob.refresh"
      @go-vault="goToVault"
      @reset-vault="openVaultReset"
    />

    <template v-else>
      <!-- The one prominent notice of this step; everything else is a short note or under "learn more". -->
      <Alert class="mb-2 border-amber-500/40 bg-amber-500/5 text-amber-900 dark:text-amber-100" data-testid="inherit-form-warning">
        <Smartphone class="h-5 w-5" />
        <AlertTitle>{{ t("tools.uploadData.inheritTab.alerts.warning1.title") }}</AlertTitle>
        <AlertDescription class="text-current">{{ t("tools.uploadData.inheritTab.alerts.warning1.description") }}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ServerCog class="h-6 w-6" />
            {{ t("tools.uploadData.inheritTab.title") }}
          </CardTitle>
          <CardDescription>{{ t("tools.uploadData.inheritTab.description") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <ul class="space-y-2 rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground" data-testid="inherit-prep-notes">
            <li class="flex items-start gap-2">
              <Link2 class="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span class="min-w-0">
                {{ t("tools.uploadData.inheritTab.prep.bind") }}
                <RouterLink :to="{ name: 'user.gameAccountBindings' }" class="ms-1 font-medium text-primary underline-offset-4 hover:underline">
                  {{ t("tools.uploadData.inheritTab.prep.bindLink") }}
                </RouterLink>
              </span>
            </li>
            <li class="flex items-start gap-2" data-testid="inherit-platform-link-tip">
              <ShieldCheck class="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span class="min-w-0">{{ t("tools.uploadData.inheritTab.prep.platformLink") }}</span>
            </li>
          </ul>
          <form id="upload-data-inherit-form" novalidate @submit.prevent="submit">
            <div class="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex min-w-0 flex-col space-y-1.5">
                <Label :for="INHERIT_FIELD_IDS.inheritId">{{ t("tools.uploadData.inheritTab.fields.inheritId") }}</Label>
                <div class="relative min-w-0 w-full items-center">
                  <Input
                    :id="INHERIT_FIELD_IDS.inheritId"
                    v-model="form.inheritId.value"
                    class="pl-10"
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
                    :placeholder="t('tools.uploadData.inheritTab.fields.inheritIdPlaceholder')"
                    :aria-invalid="form.fieldErrors.inheritId ? 'true' : undefined"
                    :aria-describedby="form.fieldErrors.inheritId ? ERROR_IDS.inheritId : undefined"
                    @update:model-value="form.clearFieldError('inheritId')"
                  />
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                    <User class="size-4 text-muted-foreground" />
                  </span>
                </div>
                <FieldError :id="ERROR_IDS.inheritId" :message="form.fieldErrors.inheritId" />
              </div>
              <div class="flex min-w-0 flex-col space-y-1.5">
                <Label :for="INHERIT_FIELD_IDS.inheritPassword">{{ t("tools.uploadData.inheritTab.fields.inheritPassword") }}</Label>
                <div class="relative min-w-0 w-full items-center">
                  <InputWithToggle
                    :id="INHERIT_FIELD_IDS.inheritPassword"
                    v-model="form.inheritPassword.value"
                    type="password"
                    class="w-full pl-10"
                    autocomplete="off"
                    :placeholder="t('tools.uploadData.inheritTab.fields.inheritPasswordPlaceholder')"
                    :aria-invalid="form.fieldErrors.inheritPassword ? 'true' : undefined"
                    :aria-describedby="form.fieldErrors.inheritPassword ? ERROR_IDS.inheritPassword : undefined"
                    @update:model-value="form.clearFieldError('inheritPassword')"
                  />
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
                    <Lock class="size-4 text-muted-foreground" />
                  </span>
                </div>
                <FieldError :id="ERROR_IDS.inheritPassword" :message="form.fieldErrors.inheritPassword" />
              </div>
              <div class="flex min-w-0 flex-col space-y-1.5">
                <Label for="inherit-server-select">{{ t("tools.uploadData.inheritTab.fields.server") }}</Label>
                <div class="relative min-w-0 w-full items-center">
                  <Select :key="locale" id="inherit-server-select" :model-value="form.server.value" @update:model-value="handleServerChange">
                    <SelectTrigger class="w-full pl-10">
                      <SelectValue :placeholder="t('tools.uploadData.inheritTab.fields.serverPlaceholder')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jp">{{ t("tools.uploadData.region.jp") }}</SelectItem>
                      <SelectItem value="en">{{ t("tools.uploadData.region.en") }}</SelectItem>
                    </SelectContent>
                  </Select>
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                    <Globe class="size-4 text-muted-foreground" />
                  </span>
                </div>
              </div>
              <div class="flex min-w-0 flex-col space-y-1.5">
                <Label for="inherit-data-type-select">{{ t("tools.uploadData.inheritTab.fields.dataType") }}</Label>
                <div class="relative min-w-0 w-full items-center">
                  <Select :key="locale" id="inherit-data-type-select" :model-value="form.dataType.value" @update:model-value="handleDataTypeChange">
                    <SelectTrigger class="w-full pl-10">
                      <SelectValue :placeholder="t('tools.uploadData.inheritTab.fields.dataTypePlaceholder')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suite">{{ t("tools.uploadData.dataTypes.suite") }}</SelectItem>
                      <SelectItem v-if="canShowMySekaiDataType" value="mysekai">
                        {{ t("tools.uploadData.dataTypes.mysekai") }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2 pointer-events-none">
                    <Database class="size-4 text-muted-foreground" />
                  </span>
                </div>
                <p v-if="!canShowMySekaiDataType" class="text-xs text-muted-foreground" data-testid="inherit-mysekai-qq-note">
                  {{ t("tools.uploadData.inheritTab.prep.mysekaiQQ") }}
                  <RouterLink :to="{ name: 'user.harukiBotAuthorization' }" class="ms-1 font-medium text-primary underline-offset-4 hover:underline">
                    {{ t("tools.uploadData.inheritTab.prep.mysekaiQQLink") }}
                  </RouterLink>
                </p>
              </div>

              <fieldset class="min-w-0 space-y-2 sm:col-span-2" data-testid="inherit-new-password-mode">
                <legend class="mb-1.5 text-sm font-medium">{{ t("tools.uploadData.inheritTab.newPassword.label") }}</legend>
                <div class="grid gap-2 sm:grid-cols-2">
                  <label
                    v-for="mode in PASSWORD_MODES"
                    :key="mode.value"
                    :class="[
                      'flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors',
                      form.newPasswordMode.value === mode.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                    ]"
                  >
                    <input
                      v-model="form.newPasswordMode.value"
                      type="radio"
                      name="inherit-new-password-mode"
                      :value="mode.value"
                      class="mt-1 accent-primary"
                      @change="form.clearFieldError('inheritPassword')"
                    >
                    <span class="min-w-0 space-y-0.5">
                      <span class="flex items-center gap-1.5 text-sm font-medium">
                        <component :is="mode.icon" class="size-4 text-muted-foreground" />
                        {{ t(`tools.uploadData.inheritTab.newPassword.${mode.value}`) }}
                      </span>
                      <span class="block text-xs text-muted-foreground">{{ t(`tools.uploadData.inheritTab.newPassword.${mode.value}Hint`) }}</span>
                    </span>
                  </label>
                </div>
                <p
                  v-if="form.newPasswordMode.value === 'reuse' && form.reuseBlocked.value"
                  class="text-xs text-amber-700 dark:text-amber-300"
                  data-testid="inherit-reuse-blocked"
                >
                  {{ t("tools.uploadData.inheritTab.newPassword.reuseBlocked") }}
                </p>
              </fieldset>
            </div>
          </form>
        </CardContent>
        <CardFooter class="flex items-center justify-end">
          <Button type="submit" form="upload-data-inherit-form" :disabled="inheritJob.creating.value">
            <Loader2 v-if="inheritJob.creating.value" class="mr-2 h-4 w-4 animate-spin" />
            <ScanSearch v-else class="mr-2 h-4 w-4" />
            {{ inheritJob.creating.value ? t("tools.uploadData.inheritTab.submitting") : t("tools.uploadData.inheritTab.submit") }}
          </Button>
        </CardFooter>
      </Card>

      <Collapsible v-model:open="notesOpen" class="mt-2 rounded-lg border bg-muted/20" data-testid="inherit-learn-more">
        <CollapsibleTrigger class="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium">
          <span class="flex items-center gap-2">
            <Info class="size-4 text-muted-foreground" />
            {{ t("tools.uploadData.inheritTab.alerts.notesTitle") }}
          </span>
          <LucideChevronDown :class="['size-4 text-muted-foreground transition-transform duration-200', notesOpen ? 'rotate-180' : '']" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div class="space-y-4 border-t px-4 py-3 text-sm text-muted-foreground">
            <div class="space-y-1">
              <p class="font-medium text-foreground">{{ t("tools.uploadData.inheritTab.alerts.flow.title") }}</p>
              <ol class="list-decimal space-y-1 ps-5">
                <li>{{ t("tools.uploadData.inheritTab.alerts.flow.step1") }}</li>
                <li>{{ t("tools.uploadData.inheritTab.alerts.flow.step2") }}</li>
                <li>{{ t("tools.uploadData.inheritTab.alerts.flow.step3") }}</li>
                <li>{{ t("tools.uploadData.inheritTab.alerts.flow.step4") }}</li>
              </ol>
            </div>
            <div class="space-y-1">
              <p class="font-medium text-foreground">{{ t("tools.uploadData.inheritTab.alerts.storage.title") }}</p>
              <p>{{ t("tools.uploadData.inheritTab.alerts.storage.text") }}</p>
            </div>
            <div class="space-y-1">
              <p class="font-medium text-foreground">{{ t("tools.uploadData.inheritTab.alerts.risk.title") }}</p>
              <p>{{ t("tools.uploadData.inheritTab.alerts.risk.text") }}</p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </template>

    <div class="mt-3">
      <InheritVaultPanel ref="vaultPanel" :vault="vault" />
    </div>
  </template>
</template>
