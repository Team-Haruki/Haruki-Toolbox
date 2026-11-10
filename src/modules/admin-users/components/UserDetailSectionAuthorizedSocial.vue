<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideGlobe, LucidePencil, LucidePlus, LucideTrash2 } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import type { ErrorDescription } from "@/lib/error-utils"
import type { AuthorizedSocialPlatform } from "@/types/admin"
import { getSocialPlatforms, isSocialPlatform } from "@/modules/admin-users/constants"
import UserDetailSection from "./UserDetailSection.vue"

/**
 * The social accounts the user has authorized, one line each: platform,
 * account ID, the note under it, and edit / delete.
 */
const props = defineProps<{
  loading: boolean
  busy: boolean
  error: ErrorDescription | null
  authorizedSocials: AuthorizedSocialPlatform[]
  /** Confirmed in a dialog; rejects on failure so the dialog stays open with the error. */
  deleteSocial: (platformId: AuthorizedSocialPlatform["id"]) => Promise<void>
}>()

const emit = defineEmits<{
  (e: "add"): void
  (e: "edit", social: AuthorizedSocialPlatform): void
  (e: "retry"): void
}>()

const { t } = useI18n()
const socialPlatforms = computed(() => getSocialPlatforms(t))

const deleteDialogOpen = ref(false)
// Kept after the dialog closes so its text does not change mid fade-out.
const pendingDelete = ref<AuthorizedSocialPlatform | null>(null)

function platformMeta(platform: string) {
  return isSocialPlatform(platform) ? socialPlatforms.value[platform] : undefined
}

function requestDelete(social: AuthorizedSocialPlatform) {
  pendingDelete.value = social
  deleteDialogOpen.value = true
}

function executeDelete() {
  const target = pendingDelete.value
  return target ? props.deleteSocial(target.id) : Promise.resolve()
}

const description = computed(() => props.authorizedSocials.length > 0
  ? t("adminUsers.detail.authSocial.total", { count: props.authorizedSocials.length })
  : undefined)
</script>

<template>
  <UserDetailSection
    :title="t('adminUsers.detail.authSocial.title')"
    :description="description"
    :loading="loading"
    :error="error"
    :error-title="t('adminUsers.detail.toast.loadAuthSocialFailedTitle')"
    :empty="authorizedSocials.length === 0"
    :empty-text="t('adminUsers.detail.authSocial.empty')"
    :empty-icon="LucideGlobe"
    data-testid="admin-user-authorized-socials"
    @retry="emit('retry')"
  >
    <template #actions>
      <Button variant="outline" size="sm" :disabled="busy || loading" @click="emit('add')">
        <LucidePlus class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.authSocial.add") }}
      </Button>
    </template>

    <ul class="divide-y divide-border/60">
      <li
        v-for="social in authorizedSocials"
        :key="social.id"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5"
      >
        <span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground" aria-hidden="true">
          <component :is="platformMeta(social.platform)?.icon || LucideGlobe" class="size-4" />
        </span>
        <div class="min-w-0 flex-1 basis-40">
          <div class="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span class="text-sm font-medium [overflow-wrap:anywhere]">{{ platformMeta(social.platform)?.label || social.platform }}</span>
            <span class="min-w-0 font-mono text-sm tabular-nums [overflow-wrap:anywhere]">{{ social.userId }}</span>
          </div>
          <p v-if="social.comment" class="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{{ social.comment }}</p>
        </div>
        <div class="ml-auto flex shrink-0 items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-muted-foreground pointer-coarse:size-10"
            :disabled="busy"
            :title="t('adminUsers.detail.dialog.authSocial.editTitle')"
            :aria-label="t('adminUsers.detail.dialog.authSocial.editTitle')"
            @click="emit('edit', social)"
          >
            <LucidePencil class="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="size-8 text-destructive hover:text-destructive pointer-coarse:size-10"
            :disabled="busy"
            :title="t('adminUsers.detail.authSocial.delete')"
            :aria-label="t('adminUsers.detail.authSocial.delete')"
            @click="requestDelete(social)"
          >
            <LucideTrash2 class="size-4" aria-hidden="true" />
          </Button>
        </div>
      </li>
    </ul>
  </UserDetailSection>

  <ConfirmDialog
    v-model:open="deleteDialogOpen"
    :title="t('adminUsers.detail.authSocial.deleteDialogTitle')"
    :description="t('adminUsers.detail.authSocial.deleteDialogDescription')"
    :cancel-label="t('adminUsers.common.cancel')"
    :confirm-label="t('adminUsers.common.delete')"
    destructive
    :on-confirm="executeDelete"
  />
</template>
