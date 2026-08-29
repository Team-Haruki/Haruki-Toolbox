<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bot,
  Save,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-vue-next"
import {
  MYSEKAI_PERMISSION_DESCRIPTION_KEYS,
  MYSEKAI_PERMISSION_CARD_OPTIONS,
  MYSEKAI_PERMISSION_TITLE_KEYS,
  SUITE_PERMISSION_DESCRIPTION_KEYS,
  SUITE_PERMISSION_CARD_OPTIONS,
  SUITE_PERMISSION_TITLE_KEYS,
  type MysekaiPermissionKey,
  type SuitePermissionKey,
} from "@/lib/game-binding-permission-meta"
import { isSekaiRegion } from "@/lib/sekai-region"
import { isVerifiedQQBinding } from "@/lib/social-platform"
import { useUserStore } from "@/shared/stores/user"
import GameBindingPermissionCard from "./GameBindingPermissionCard.vue"
import type { GameAccountBinding, SekaiRegion } from "@/types/store"

const props = defineProps<{
  open: boolean
  isCreating: boolean
  verificationTriggered: boolean
  isSaving: boolean
  isVerifying: boolean
  allowCNMysekai: boolean
  userIdInput: string
  editTarget: GameAccountBinding | null
  regionOptions: ReadonlyArray<{ value: SekaiRegion; label: string }>
}>()

const emit = defineEmits<{
  (e: "update:open", value: boolean): void
  (e: "update:userIdInput", value: string): void
  (e: "update:editTarget", value: GameAccountBinding | null): void
  (e: "verify"): void
  (e: "save"): void
}>()

const { t, locale } = useI18n()
const router = useRouter()
const userStore = useUserStore()

// Adding a game binding requires a verified QQ on the HarukiBot social
// binding; without it the create dialog shows only the guidance panel.
const qqGateActive = computed(() =>
  props.isCreating && !isVerifiedQQBinding(userStore.socialPlatformInfo),
)

function goToQQBinding() {
  emit("update:open", false)
  void router.push("/user/harukibot-authorization")
}

function cloneEditTarget(target: GameAccountBinding) {
  return {
    ...target,
    suite: target.suite ? { ...target.suite } : target.suite,
    mysekai: target.mysekai ? { ...target.mysekai } : target.mysekai,
  }
}

function updateEditTarget(mutator: (target: GameAccountBinding) => void) {
  if (!props.editTarget) return
  const next = cloneEditTarget(props.editTarget)
  mutator(next)
  emit("update:editTarget", next)
}

function handleServerChange(value: unknown) {
  if (!isSekaiRegion(value)) return
  updateEditTarget((target) => {
    target.server = value
  })
}

function updateSuitePermission(key: SuitePermissionKey, value: boolean) {
  updateEditTarget((target) => {
    if (!target.suite) return
    target.suite[key] = value
  })
}

function updateMysekaiPermission(key: MysekaiPermissionKey, value: boolean) {
  updateEditTarget((target) => {
    if (!target.mysekai) return
    target.mysekai[key] = value
  })
}

const showMysekaiSettings = computed(() => {
  return props.allowCNMysekai || props.editTarget?.server !== "cn"
})

const suitePermissionOptions = computed(() =>
  SUITE_PERMISSION_CARD_OPTIONS.map((option) => ({
    key: option.key,
    title: t(SUITE_PERMISSION_TITLE_KEYS[option.key]),
    description: t(SUITE_PERMISSION_DESCRIPTION_KEYS[option.key]),
  }))
)

const mysekaiPermissionOptions = computed(() =>
  MYSEKAI_PERMISSION_CARD_OPTIONS.map((option) => ({
    key: option.key,
    title: t(MYSEKAI_PERMISSION_TITLE_KEYS[option.key]),
    description: t(MYSEKAI_PERMISSION_DESCRIPTION_KEYS[option.key]),
  }))
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogScrollContent class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isCreating ? t("userSettings.gameBinding.editDialog.createTitle") : t("userSettings.gameBinding.editDialog.editTitle") }}
        </DialogTitle>
        <DialogDescription v-if="!qqGateActive">
          {{ t("userSettings.gameBinding.editDialog.subtitle") }}
        </DialogDescription>
      </DialogHeader>

      <!-- QQ prerequisite gate: no other settings until a verified QQ exists. -->
      <div
        v-if="qqGateActive"
        class="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/20 px-6 py-10 text-center"
      >
        <span class="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <ShieldAlert class="h-5 w-5" />
        </span>
        <h3 class="text-base font-semibold">
          {{ t("userSettings.gameBinding.editDialog.qqGate.title") }}
        </h3>
        <p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
          {{ t("userSettings.gameBinding.editDialog.qqGate.description") }}
        </p>
        <Button class="mt-1" @click="goToQQBinding">
          <Bot class="h-4 w-4 mr-2" />
          {{ t("userSettings.gameBinding.editDialog.qqGate.action") }}
        </Button>
      </div>

      <div v-else class="flex flex-col gap-6 py-2">
        <!-- Basic info -->
        <section class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {{ t("userSettings.gameBinding.editDialog.basicInfoTitle") }}
          </h3>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="grid gap-1.5">
              <Label id="binding-server-label" for="binding-server">{{ t("userSettings.gameBinding.editDialog.fields.server") }}</Label>
              <Select id="binding-server" :key="locale" :model-value="editTarget?.server" @update:model-value="handleServerChange">
                <SelectTrigger class="w-full" :disabled="!isCreating || editTarget?.verified" aria-labelledby="binding-server-label">
                  <SelectValue :placeholder="t('userSettings.gameBinding.editDialog.serverPlaceholder')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-1.5">
              <Label for="binding-user-id">{{ t("userSettings.gameBinding.editDialog.fields.userId") }}</Label>
              <Input
                id="binding-user-id"
                :model-value="userIdInput"
                :disabled="!isCreating || editTarget?.verified"
                class="w-full"
                type="text"
                inputmode="numeric"
                pattern="\\d*"
                @update:model-value="emit('update:userIdInput', String($event ?? ''))"
              />
            </div>
          </div>

          <!-- Verification tile -->
          <div class="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
            <VerificationStatusBadge
              :verified="editTarget?.verified === true"
              :verified-label="t('userSettings.gameBinding.status.verified')"
              :unverified-label="t('userSettings.gameBinding.status.unverified')"
            />
            <p v-if="isCreating && !verificationTriggered" class="min-w-0 flex-1 text-xs text-muted-foreground">
              {{ t("userSettings.gameBinding.editDialog.verifyHint") }}
            </p>
            <Button
              v-if="!editTarget?.verified"
              variant="outline"
              size="sm"
              class="ml-auto"
              :disabled="isVerifying || isSaving"
              @click="emit('verify')"
            >
              <ShieldCheck class="h-4 w-4 mr-2" />
              {{ t("userSettings.gameBinding.editDialog.verifyButton") }}
            </Button>
          </div>
        </section>

        <!-- Suite permissions -->
        <section class="space-y-3">
          <div class="space-y-0.5">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {{ t("userSettings.gameBinding.editDialog.suite.title") }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ t("userSettings.gameBinding.editDialog.suite.description") }}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <GameBindingPermissionCard
              v-for="option in suitePermissionOptions"
              :key="option.key"
              :model-value="editTarget?.suite?.[option.key]"
              :title="option.title"
              :description="option.description"
              @update:model-value="value => updateSuitePermission(option.key, value)"
            />
          </div>
        </section>

        <!-- Mysekai permissions -->
        <section v-if="showMysekaiSettings" class="space-y-3">
          <div class="space-y-0.5">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {{ t("userSettings.gameBinding.editDialog.mysekai.title") }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ t("userSettings.gameBinding.editDialog.mysekai.description") }}
            </p>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <GameBindingPermissionCard
              v-for="option in mysekaiPermissionOptions"
              :key="option.key"
              :model-value="editTarget?.mysekai?.[option.key]"
              :title="option.title"
              :description="option.description"
              @update:model-value="value => updateMysekaiPermission(option.key, value)"
            />
          </div>
        </section>
      </div>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">
            <X class="h-4 w-4 mr-2" />
            {{ t("userSettings.common.cancel") }}
          </Button>
        </DialogClose>
        <Button
          v-if="!qqGateActive"
          :disabled="isSaving || (isCreating && !verificationTriggered)"
          @click="emit('save')"
        >
          <Save class="h-4 w-4 mr-2" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
