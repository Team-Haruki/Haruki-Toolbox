<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import VerificationStatusBadge from "@/modules/user-settings/components/VerificationStatusBadge.vue"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Save,
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
      </DialogHeader>
      <div class="grid gap-6 py-4">
        <Card class="p-4">
          <h3 class="font-semibold mb-1">{{ t("userSettings.gameBinding.editDialog.basicInfoTitle") }}</h3>
          <div class="grid gap-3">
            <div class="flex items-center gap-4">
              <Label class="w-24">{{ t("userSettings.gameBinding.editDialog.fields.server") }}</Label>
              <div class="flex-1">
                <Select :key="locale" :model-value="editTarget?.server" @update:model-value="handleServerChange">
                  <SelectTrigger class="w-full" :disabled="!isCreating || editTarget?.verified">
                    <SelectValue :placeholder="t('userSettings.gameBinding.editDialog.serverPlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{{ t("userSettings.gameBinding.editDialog.fields.server") }}</SelectLabel>
                      <SelectItem v-for="opt in regionOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <Label class="w-24">{{ t("userSettings.gameBinding.editDialog.fields.userId") }}</Label>
              <Input
                :model-value="userIdInput"
                :disabled="!isCreating || editTarget?.verified"
                class="flex-1"
                type="text"
                pattern="\\d*"
                @update:model-value="emit('update:userIdInput', String($event ?? ''))"
              />
            </div>
            <div class="flex items-center gap-4">
              <Label class="w-24">{{ t("userSettings.gameBinding.editDialog.fields.verificationStatus") }}</Label>
              <div class="flex-1 flex flex-wrap items-center gap-2">
                <VerificationStatusBadge
                  :verified="editTarget?.verified === true"
                  :verified-label="t('userSettings.gameBinding.status.verified')"
                  :unverified-label="t('userSettings.gameBinding.status.unverified')"
                />
                <Button v-if="!editTarget?.verified" variant="outline" :disabled="isVerifying || isSaving" @click="emit('verify')">
                  <ShieldCheck class="h-4 w-4 mr-2" />
                  {{ t("userSettings.gameBinding.editDialog.verifyButton") }}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t("userSettings.gameBinding.editDialog.suite.title") }}</CardTitle>
            <CardDescription>{{ t("userSettings.gameBinding.editDialog.suite.description") }}</CardDescription>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <GameBindingPermissionCard
              v-for="option in suitePermissionOptions"
              :key="option.key"
              :model-value="editTarget?.suite?.[option.key]"
              :title="option.title"
              :description="option.description"
              @update:model-value="value => updateSuitePermission(option.key, value)"
            />
          </CardContent>
        </Card>

        <template v-if="showMysekaiSettings">
          <Card>
            <CardHeader>
              <CardTitle>{{ t("userSettings.gameBinding.editDialog.mysekai.title") }}</CardTitle>
              <CardDescription>{{ t("userSettings.gameBinding.editDialog.mysekai.description") }}</CardDescription>
            </CardHeader>
            <CardContent class="grid gap-4 sm:grid-cols-2">
              <GameBindingPermissionCard
                v-for="option in mysekaiPermissionOptions"
                :key="option.key"
                :model-value="editTarget?.mysekai?.[option.key]"
                :title="option.title"
                :description="option.description"
                @update:model-value="value => updateMysekaiPermission(option.key, value)"
              />
            </CardContent>
          </Card>
        </template>
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline">
            <X class="h-4 w-4 mr-2" />
            {{ t("userSettings.common.cancel") }}
          </Button>
        </DialogClose>
        <Button @click="emit('save')" :disabled="isSaving || (isCreating && !verificationTriggered)">
          <Save class="h-4 w-4 mr-2" />
          {{ t("common.save") }}
        </Button>
      </DialogFooter>
    </DialogScrollContent>
  </Dialog>
</template>
