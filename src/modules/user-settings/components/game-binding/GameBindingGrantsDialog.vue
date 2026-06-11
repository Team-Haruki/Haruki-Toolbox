<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LucidePencil,
  LucideRefreshCw,
  LucideTrash2,
} from "lucide-vue-next"
import { formatLocalizedDate } from "@/lib/date-time"
import {
  isGrantDataType,
} from "@/modules/user-settings/lib/game-account-grants"
import type {
  GameAccountBinding,
  GameAccountDataGrant,
  GameAccountGrantDataType,
  SekaiRegion,
} from "@/types"

const props = defineProps<{
  open: boolean
  loading: boolean
  saving: boolean
  deleting: boolean
  selectedAccount: GameAccountBinding | null
  selectedAccountGrants: GameAccountDataGrant[]
  receivedGrants: GameAccountDataGrant[]
  granteeUserId: string
  dataType: GameAccountGrantDataType
  expiresAtLocal: string
  regionLabels: Record<SekaiRegion, string>
}>()

const emit = defineEmits<{
  (event: "update:open", value: boolean): void
  (event: "update:grantee-user-id", value: string): void
  (event: "update:data-type", value: GameAccountGrantDataType): void
  (event: "update:expires-at-local", value: string): void
  (event: "refresh"): void
  (event: "save"): void
  (event: "edit", grant: GameAccountDataGrant): void
  (event: "revoke", grant: GameAccountDataGrant): void
}>()

const { t, locale } = useI18n()

const selectedAccountLabel = computed(() => {
  const account = props.selectedAccount
  if (!account) return t("userSettings.gameBinding.grants.noSelectedAccount")
  return `${props.regionLabels[account.server] ?? account.server} / ${account.userId}`
})

const hasSelectedAccount = computed(() => props.selectedAccount !== null)
const dialogDescription = computed(() =>
  hasSelectedAccount.value
    ? t("userSettings.gameBinding.grants.description")
    : t("userSettings.gameBinding.grants.receivedDescription")
)

function dataTypeLabel(value: GameAccountGrantDataType) {
  return value === "mysekai"
    ? t("userSettings.gameBinding.grants.dataType.mysekai")
    : t("userSettings.gameBinding.grants.dataType.suite")
}

function formatDate(value: string) {
  return formatLocalizedDate(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    t("userSettings.gameBinding.grants.fallback")
  )
}

function handleDataTypeChange(value: unknown) {
  if (isGrantDataType(value)) {
    emit("update:data-type", value)
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[min(96vw,72rem)] max-h-[86vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ t("userSettings.gameBinding.grants.title") }}</DialogTitle>
        <DialogDescription>{{ dialogDescription }}</DialogDescription>
      </DialogHeader>

      <div v-if="hasSelectedAccount" class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-sm text-muted-foreground">
          {{ t("userSettings.gameBinding.grants.selectedAccount", { account: selectedAccountLabel }) }}
        </div>
        <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('refresh')">
          <LucideRefreshCw class="h-4 w-4" />
          {{ t("userSettings.gameBinding.grants.actions.refresh") }}
        </Button>
      </div>
      <div v-else class="flex justify-end">
        <Button variant="outline" size="sm" :disabled="props.loading" @click="emit('refresh')">
          <LucideRefreshCw class="h-4 w-4" />
          {{ t("userSettings.gameBinding.grants.actions.refresh") }}
        </Button>
      </div>

      <div v-if="hasSelectedAccount" class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div class="rounded-md border p-4">
          <h3 class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.form.title") }}</h3>
          <div class="mt-4 space-y-3">
            <div class="space-y-1.5">
              <Label>{{ t("userSettings.gameBinding.grants.form.granteeUserId") }}</Label>
              <Input
                :model-value="props.granteeUserId"
                :placeholder="t('userSettings.gameBinding.grants.form.granteeUserIdPlaceholder')"
                @update:model-value="emit('update:grantee-user-id', String($event ?? ''))"
              />
            </div>
            <div class="space-y-1.5">
              <Label>{{ t("userSettings.gameBinding.grants.form.dataType") }}</Label>
              <Select :key="locale" :model-value="props.dataType" @update:model-value="handleDataTypeChange">
                <SelectTrigger class="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="suite">{{ dataTypeLabel("suite") }}</SelectItem>
                  <SelectItem value="mysekai">{{ dataTypeLabel("mysekai") }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1.5">
              <Label>{{ t("userSettings.gameBinding.grants.form.expiresAt") }}</Label>
              <Input
                type="datetime-local"
                :model-value="props.expiresAtLocal"
                @update:model-value="emit('update:expires-at-local', String($event ?? ''))"
              />
              <p class="text-xs text-muted-foreground">{{ t("userSettings.gameBinding.grants.form.expiresAtHelp") }}</p>
            </div>
            <Button class="w-full" :disabled="props.saving || !props.selectedAccount?.verified" @click="emit('save')">
              {{ t("userSettings.gameBinding.grants.actions.save") }}
            </Button>
          </div>
        </div>

        <div class="rounded-md border overflow-x-auto">
          <div class="border-b px-4 py-3">
            <h3 class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.ownedTitle") }}</h3>
          </div>
          <div v-if="props.loading" class="space-y-2 p-4">
            <Skeleton v-for="i in 2" :key="i" class="h-10 w-full" />
          </div>
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>{{ t("userSettings.gameBinding.grants.table.grantee") }}</TableHead>
                <TableHead>{{ t("userSettings.gameBinding.grants.table.dataType") }}</TableHead>
                <TableHead>{{ t("userSettings.gameBinding.grants.table.expiresAt") }}</TableHead>
                <TableHead>{{ t("userSettings.gameBinding.grants.table.actions") }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="grant in props.selectedAccountGrants" :key="grant.id">
                <TableCell class="font-mono text-xs">{{ grant.granteeUserId }}</TableCell>
                <TableCell>{{ dataTypeLabel(grant.dataType) }}</TableCell>
                <TableCell>{{ formatDate(grant.expiresAt) }}</TableCell>
                <TableCell>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" :disabled="props.saving" @click="emit('edit', grant)">
                      <LucidePencil class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      class="text-destructive"
                      :disabled="props.deleting"
                      @click="emit('revoke', grant)"
                    >
                      <LucideTrash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="props.selectedAccountGrants.length === 0">
                <TableCell :colspan="4" class="py-6 text-center text-muted-foreground">
                  {{ t("userSettings.gameBinding.grants.emptyOwned") }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      <div class="rounded-md border overflow-x-auto">
        <div class="border-b px-4 py-3">
          <h3 class="text-sm font-medium">{{ t("userSettings.gameBinding.grants.receivedTitle") }}</h3>
        </div>
        <div v-if="props.loading" class="space-y-2 p-4">
          <Skeleton v-for="i in 2" :key="i" class="h-10 w-full" />
        </div>
        <Table v-else>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t("userSettings.gameBinding.grants.table.owner") }}</TableHead>
              <TableHead>{{ t("userSettings.gameBinding.table.server") }}</TableHead>
              <TableHead>{{ t("userSettings.gameBinding.table.userId") }}</TableHead>
              <TableHead>{{ t("userSettings.gameBinding.grants.table.dataType") }}</TableHead>
              <TableHead>{{ t("userSettings.gameBinding.grants.table.expiresAt") }}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="grant in props.receivedGrants" :key="grant.id">
              <TableCell class="font-mono text-xs">{{ grant.ownerUserId }}</TableCell>
              <TableCell>{{ props.regionLabels[grant.server] ?? grant.server }}</TableCell>
              <TableCell class="font-mono text-xs">{{ grant.gameUserId }}</TableCell>
              <TableCell>{{ dataTypeLabel(grant.dataType) }}</TableCell>
              <TableCell>{{ formatDate(grant.expiresAt) }}</TableCell>
            </TableRow>
            <TableRow v-if="props.receivedGrants.length === 0">
              <TableCell :colspan="5" class="py-6 text-center text-muted-foreground">
                {{ t("userSettings.gameBinding.grants.emptyReceived") }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  </Dialog>
</template>
