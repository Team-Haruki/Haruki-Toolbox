<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGlobe, LucidePencil, LucidePlus, LucideTrash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { UserSocialPlatform } from "@/types/admin"
import { getSocialPlatforms, isSocialPlatform } from "@/modules/admin-users/constants"
import UserChip from "./UserChip.vue"
import UserDetailSection from "./UserDetailSection.vue"

/** The user's main social binding: at most one account, with edit and delete. */
defineProps<{
  loading: boolean
  busy: boolean
  error: ErrorDescription | null
  socialPlatform: UserSocialPlatform | null
  /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
  deleteSocial: () => Promise<void>
}>()

const emit = defineEmits<{
  (e: "edit"): void
  (e: "retry"): void
}>()

const { t } = useI18n()
const socialPlatforms = computed(() => getSocialPlatforms(t))
const deleteDialogOpen = ref(false)

function platformMeta(platform: string) {
  return isSocialPlatform(platform) ? socialPlatforms.value[platform] : undefined
}
</script>

<template>
  <UserDetailSection
    :title="t('adminUsers.detail.social.title')"
    :loading="loading"
    :error="error"
    :error-title="t('adminUsers.detail.toast.loadSocialFailedTitle')"
    :empty="!socialPlatform"
    :empty-text="t('adminUsers.detail.social.empty')"
    :empty-icon="LucideGlobe"
    :skeleton-rows="1"
    data-testid="admin-user-social"
    @retry="emit('retry')"
  >
    <template #empty-action>
      <Button variant="outline" size="sm" class="mt-1" :disabled="busy" @click="emit('edit')">
        <LucidePlus class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.social.add") }}
      </Button>
    </template>

    <div v-if="socialPlatform" class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
      <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden="true">
        <component :is="platformMeta(socialPlatform.platform)?.icon || LucideGlobe" class="size-4" />
      </span>
      <div class="min-w-0 flex-1 basis-40">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span class="text-sm font-medium [overflow-wrap:anywhere]">
            {{ platformMeta(socialPlatform.platform)?.label || socialPlatform.platform }}
          </span>
          <UserChip :tone="socialPlatform.verified ? 'success' : 'warning'">
            {{ socialPlatform.verified ? t("adminUsers.common.verified") : t("adminUsers.common.unverified") }}
          </UserChip>
        </div>
        <p class="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">{{ socialPlatform.userId }}</p>
      </div>
      <div class="ml-auto flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          class="size-8 text-muted-foreground pointer-coarse:size-10"
          :disabled="busy"
          :title="t('adminUsers.detail.dialog.social.editTitle')"
          :aria-label="t('adminUsers.detail.dialog.social.editTitle')"
          @click="emit('edit')"
        >
          <LucidePencil class="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
          :disabled="busy"
          :title="t('adminUsers.detail.social.delete')"
          :aria-label="t('adminUsers.detail.social.delete')"
          @click="deleteDialogOpen = true"
        >
          <LucideTrash2 class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </UserDetailSection>

  <ConfirmDialog
    v-model:open="deleteDialogOpen"
    :title="t('adminUsers.detail.social.deleteDialogTitle')"
    :description="t('adminUsers.detail.social.deleteDialogDescription')"
    :cancel-label="t('adminUsers.common.cancel')"
    :confirm-label="t('adminUsers.common.delete')"
    destructive
    :on-confirm="deleteSocial"
  />
</template>
