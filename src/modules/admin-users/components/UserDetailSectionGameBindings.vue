<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGamepad2, LucidePencil, LucidePlus, LucideTrash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { AdminUserGameBinding } from "@/modules/admin-users/api/shared"
import { resolveServerLabel } from "@/modules/admin-users/constants"
import { countSharingSwitches } from "@/modules/admin-users/lib/user-stats"
import UserChip from "./UserChip.vue"
import UserDetailSection from "./UserDetailSection.vue"

/**
 * The user's bound game accounts, one line each: region, UID, whether it is
 * verified, how many sharing switches are on, and edit / unbind.
 */
const props = defineProps<{
  loading: boolean
  busy: boolean
  error: ErrorDescription | null
  gameBindings: AdminUserGameBinding[]
  /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
  deleteBinding: (server: AdminUserGameBinding["server"], gameUserId: string) => Promise<void>
}>()

const emit = defineEmits<{
  (e: "add"): void
  (e: "edit", binding: AdminUserGameBinding): void
  (e: "retry"): void
}>()

const { t } = useI18n()

const deleteDialogOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const pendingDelete = ref<{ server: AdminUserGameBinding["server"]; gameUserId: string } | null>(null)

function requestDelete(binding: AdminUserGameBinding) {
  pendingDelete.value = { server: binding.server, gameUserId: binding.gameUserId }
  deleteDialogOpen.value = true
}

function executeDelete() {
  const target = pendingDelete.value
  return target ? props.deleteBinding(target.server, target.gameUserId) : Promise.resolve()
}

const description = computed(() => props.gameBindings.length > 0
  ? t("adminUsers.detail.game.total", { count: props.gameBindings.length })
  : undefined)

function sharingText(binding: AdminUserGameBinding): string[] {
  const parts: string[] = []
  const suite = countSharingSwitches(binding.suite)
  const mysekai = countSharingSwitches(binding.mysekai)
  if (suite) parts.push(t("adminUsers.detail.game.sharingSuite", suite))
  if (mysekai) parts.push(t("adminUsers.detail.game.sharingMysekai", mysekai))
  return parts
}
</script>

<template>
  <UserDetailSection
    :title="t('adminUsers.detail.game.title')"
    :description="description"
    :loading="loading"
    :error="error"
    :error-title="t('adminUsers.detail.toast.loadGameBindingsFailedTitle')"
    :empty="gameBindings.length === 0"
    :empty-text="t('adminUsers.detail.game.empty')"
    :empty-icon="LucideGamepad2"
    data-testid="admin-user-game-bindings"
    @retry="emit('retry')"
  >
    <template #actions>
      <Button variant="outline" size="sm" :disabled="busy || loading" @click="emit('add')">
        <LucidePlus class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.game.add") }}
      </Button>
    </template>

    <ul class="divide-y divide-border/60">
      <li
        v-for="binding in gameBindings"
        :key="`${binding.server}-${binding.gameUserId}`"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
        :data-binding="`${binding.server}:${binding.gameUserId}`"
      >
        <span
          class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-semibold text-muted-foreground uppercase"
          aria-hidden="true"
        >
          {{ binding.server }}
        </span>
        <div class="min-w-0 flex-1 basis-40">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span class="text-sm font-medium">{{ resolveServerLabel(binding.server, t) }}</span>
            <span class="min-w-0 font-mono text-sm tabular-nums [overflow-wrap:anywhere]">{{ binding.gameUserId }}</span>
            <UserChip v-if="binding.verified !== undefined" :tone="binding.verified ? 'success' : 'warning'">
              {{ binding.verified ? t("adminUsers.common.verified") : t("adminUsers.common.unverified") }}
            </UserChip>
            <UserChip v-if="binding.isDefault" tone="primary">{{ t("gameAccountSelect.default") }}</UserChip>
          </div>
          <p v-if="sharingText(binding).length > 0" class="mt-0.5 flex flex-wrap gap-x-3 text-xs tabular-nums text-muted-foreground">
            <span v-for="part in sharingText(binding)" :key="part">{{ part }}</span>
          </p>
        </div>
        <div class="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground pointer-coarse:size-10"
            :disabled="busy"
            :title="t('adminUsers.detail.game.edit')"
            :aria-label="t('adminUsers.detail.game.edit')"
            @click="emit('edit', binding)"
          >
            <LucidePencil class="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
            :disabled="busy"
            :title="t('adminUsers.detail.game.unbind')"
            :aria-label="t('adminUsers.detail.game.unbind')"
            @click="requestDelete(binding)"
          >
            <LucideTrash2 class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </li>
    </ul>
  </UserDetailSection>

  <ConfirmDialog
    v-model:open="deleteDialogOpen"
    :title="t('adminUsers.detail.game.unbindDialogTitle')"
    :description="t('adminUsers.detail.game.unbindDialogDescription', { gameUserId: pendingDelete?.gameUserId ?? '' })"
    :cancel-label="t('adminUsers.common.cancel')"
    :confirm-label="t('adminUsers.detail.game.unbind')"
    destructive
    :on-confirm="executeDelete"
  />
</template>
