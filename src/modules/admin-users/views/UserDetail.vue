<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import { LucideArrowLeft, LucideUserX } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useUserStore } from "@/shared/stores/user"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import {
  UserDetailDialogs,
  UserDetailHeader,
  UserDetailSectionAccount,
  UserDetailSectionActivity,
  UserDetailSectionAuthorizedSocial,
  UserDetailSectionGameBindings,
  UserDetailSectionOAuth,
  UserDetailSectionSocial,
  UserDetailStats,
} from "@/modules/admin-users/components"
import type { UserDetailHeaderActions } from "@/modules/admin-users/components/UserDetailHeader.vue"
import type { UserDetailAccountActions } from "@/modules/admin-users/components/UserDetailSectionAccount.vue"
import { useAdminUserDetail } from "@/modules/admin-users/composables/useAdminUserDetail"
import {
  mergeUserDetailCounts,
  readUserActivityWindow,
  readUserDetailCounts,
} from "@/modules/admin-users/lib/user-stats"

const props = defineProps<{ userId: string }>()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

function goBack() {
  // Prefer history back so the list's filters/page (kept in its URL) are restored;
  // fall back to the list route when the detail was opened directly (no history).
  if (window.history.state?.back) {
    router.back()
  } else {
    void router.push({ name: "admin.users" })
  }
}

const {
  loading,
  actionLoading,
  taskLoading,
  user,
  userNotFound,
  userLoadError,
  sectionLoaded,
  activities,
  uploadLogs,
  activityScope,
  activityLoading,
  activityError,
  oauthAuths,
  oauthLoading,
  oauthError,
  gameBindings,
  gameBindingLoading,
  gameBindingError,
  socialPlatform,
  socialLoading,
  socialError,
  authorizedSocials,
  authSocialLoading,
  authSocialError,
  iosUploadCode,
  emailDialogOpen,
  editEmail,
  editEmailError,
  gameBindingDialogOpen,
  editGameIsEditMode,
  editGameServer,
  editGameUserId,
  editGameSuite,
  editGameMysekai,
  socialDialogOpen,
  editSocialPlatform,
  editSocialUserId,
  editSocialVerified,
  authSocialDialogOpen,
  authSocialCreateMode,
  editAuthSocialId,
  editAuthSocialPlatform,
  editAuthSocialUserId,
  editAuthSocialComment,
  reloadUser,
  reloadActivity,
  reloadOAuth,
  reloadGameBindings,
  reloadSocial,
  reloadAuthorizedSocials,
  openEmailEdit,
  updateEditEmail,
  openAddGameBinding,
  openEditGameBinding,
  openEditSocial,
  openAddAuthSocial,
  openEditAuthSocial,
  handleBan,
  handleUnban,
  handleForceLogout,
  handleDelete,
  handleRestore,
  handleResetPassword,
  handleRoleChange,
  handleEmailUpdate,
  handleRevokeOAuth,
  handleDeleteGameBinding,
  handleToggleCNMysekai,
  handleSaveGameBinding,
  handleDeleteSocial,
  handleSaveSocial,
  handleDeleteAuthSocial,
  handleSaveAuthSocial,
  handleRegenerateIOS,
  handleDeleteIOS,
} = useAdminUserDetail(() => props.userId)

// Confirmed in ConfirmDialogs; the handlers rethrow so a failure stays in the
// dialog instead of dropping the admin back with a toast.
const headerActions: UserDetailHeaderActions = {
  ban: handleBan,
  delete: async (confirmUserId) => {
    await handleDelete(confirmUserId)
    await router.push({ name: "admin.users" })
  },
  forceLogout: handleForceLogout,
  resetPassword: handleResetPassword,
}
const accountActions: UserDetailAccountActions = {
  changeRole: handleRoleChange,
  regenerateIOS: handleRegenerateIOS,
  deleteIOS: handleDeleteIOS,
}

// The tiles start from what the detail response lists and follow the section
// lists once those have loaded, so adding a binding here moves the count.
const counts = computed(() => mergeUserDetailCounts(readUserDetailCounts(user.value), {
  gameBindings: sectionLoaded.value.game ? gameBindings.value : null,
  authorizedSocials: sectionLoaded.value["auth-social"] ? authorizedSocials.value : null,
  socialPlatform: sectionLoaded.value.social ? socialPlatform.value : undefined,
}))
const activityWindow = computed(() => readUserActivityWindow(user.value))
</script>

<template>
  <div class="@container flex w-full flex-col gap-4">
    <Button variant="ghost" size="sm" class="-ml-2 self-start text-muted-foreground" @click="goBack">
      <LucideArrowLeft class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.backToList") }}
    </Button>

    <!-- Only the first load of a user replaces the page: a refresh after an
         action keeps everything on screen. -->
    <template v-if="loading && !user">
      <div class="rounded-xl border bg-card">
        <div class="flex items-center gap-3 px-4 py-4">
          <Skeleton class="size-14 shrink-0 rounded-full" />
          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton class="h-5 w-44 max-w-full" />
            <Skeleton class="h-4 w-28 max-w-full" />
          </div>
        </div>
        <div class="border-t border-border/60 px-4 py-3">
          <Skeleton class="h-9 w-full max-w-xl" />
        </div>
      </div>
      <Skeleton class="h-20 w-full rounded-xl" />
      <Skeleton class="h-64 w-full rounded-xl" />
    </template>

    <template v-else-if="user">
      <UserDetailHeader
        :user="user"
        :action-loading="actionLoading"
        :actions="headerActions"
        @open-email-edit="openEmailEdit"
        @unban="handleUnban"
        @restore="handleRestore"
      />

      <UserDetailStats :counts="counts" :activity="activityWindow" />

      <!-- Two columns once the page is wide enough for two lists side by side. -->
      <div class="grid items-start gap-4 @min-[52rem]:grid-cols-2">
        <div class="flex min-w-0 flex-col gap-4">
          <UserDetailSectionAccount
            :user="user"
            :is-super-admin="userStore.isSuperAdmin"
            :action-loading="actionLoading"
            :busy="taskLoading"
            :upload-code="iosUploadCode"
            :actions="accountActions"
            @toggle-cn-mysekai="handleToggleCNMysekai"
          />
          <UserDetailSectionSocial
            :loading="socialLoading"
            :busy="taskLoading"
            :error="socialError"
            :social-platform="socialPlatform"
            :delete-social="handleDeleteSocial"
            @edit="openEditSocial"
            @retry="reloadSocial"
          />
          <UserDetailSectionAuthorizedSocial
            :loading="authSocialLoading"
            :busy="taskLoading"
            :error="authSocialError"
            :authorized-socials="authorizedSocials"
            :delete-social="handleDeleteAuthSocial"
            @add="openAddAuthSocial"
            @edit="openEditAuthSocial"
            @retry="reloadAuthorizedSocials"
          />
        </div>
        <div class="flex min-w-0 flex-col gap-4">
          <UserDetailSectionGameBindings
            :loading="gameBindingLoading"
            :busy="taskLoading"
            :error="gameBindingError"
            :game-bindings="gameBindings"
            :delete-binding="handleDeleteGameBinding"
            @add="openAddGameBinding"
            @edit="openEditGameBinding"
            @retry="reloadGameBindings"
          />
          <UserDetailSectionOAuth
            :loading="oauthLoading"
            :busy="taskLoading"
            :error="oauthError"
            :authorizations="oauthAuths"
            :revoke-all="handleRevokeOAuth"
            @retry="reloadOAuth"
          />
        </div>
      </div>

      <UserDetailSectionActivity
        :user-id="user.userData.userId"
        :loading="activityLoading"
        :error="activityError"
        :activities="activities"
        :upload-logs="uploadLogs"
        :scope="activityScope"
        :game-bindings="gameBindings"
        @retry="reloadActivity"
      />
    </template>

    <!-- A failed load is retryable; a 404 is a different state with a different next step. -->
    <div v-else-if="userLoadError && !userNotFound" class="rounded-xl border bg-card">
      <LoadErrorState
        :title="t('adminUsers.detail.toast.loadUserFailedTitle')"
        :description="userLoadError.message"
        :detail="userLoadError.detail"
        :retrying="loading"
        @retry="reloadUser"
      />
    </div>

    <div v-else class="flex flex-col items-center justify-center gap-3 rounded-xl border bg-card px-4 py-12 text-center">
      <LucideUserX class="size-8 text-muted-foreground/60" aria-hidden="true" />
      <p class="text-sm text-muted-foreground">{{ t("adminUsers.detail.notFound") }}</p>
      <Button variant="outline" size="sm" @click="goBack">
        <LucideArrowLeft class="size-4" aria-hidden="true" /> {{ t("adminUsers.detail.backToList") }}
      </Button>
    </div>

    <UserDetailDialogs
      :user-name="user?.userData.name"
      :has-social="!!socialPlatform"
      :action-loading="actionLoading"
      :auth-social-create-mode="authSocialCreateMode"
      :edit-auth-social-id="editAuthSocialId"
      v-model:email-dialog-open="emailDialogOpen"
      :edit-email="editEmail"
      :edit-email-error="editEmailError"
      v-model:game-binding-dialog-open="gameBindingDialogOpen"
      :edit-game-is-edit-mode="editGameIsEditMode"
      v-model:edit-game-server="editGameServer"
      v-model:edit-game-user-id="editGameUserId"
      v-model:edit-game-suite="editGameSuite"
      v-model:edit-game-mysekai="editGameMysekai"
      v-model:social-dialog-open="socialDialogOpen"
      v-model:edit-social-platform="editSocialPlatform"
      v-model:edit-social-user-id="editSocialUserId"
      v-model:edit-social-verified="editSocialVerified"
      v-model:auth-social-dialog-open="authSocialDialogOpen"
      v-model:edit-auth-social-platform="editAuthSocialPlatform"
      v-model:edit-auth-social-user-id="editAuthSocialUserId"
      v-model:edit-auth-social-comment="editAuthSocialComment"
      @update:edit-email="updateEditEmail"
      @save-email="handleEmailUpdate"
      @save-game-binding="handleSaveGameBinding"
      @save-social="handleSaveSocial"
      @save-auth-social="handleSaveAuthSocial"
    />
  </div>
</template>
