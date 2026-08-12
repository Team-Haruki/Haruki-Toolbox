<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  LucideArrowLeft,
  LucideBan,
  LucideCalendar,
  LucideCheckCircle2,
  LucideHash,
  LucideMail,
  LucideShield,
  LucideShieldAlert,
  LucideTrash2,
  LucideUser,
  LucideUserX,
} from "lucide-vue-next"
import { useUserStore } from "@/shared/stores/user"
import {
  UserDetailDialogs,
  UserDetailTabActivity,
  UserDetailTabAuthorizedSocial,
  UserDetailTabGameBindings,
  UserDetailTabIOSCode,
  UserDetailTabInfo,
  UserDetailTabOAuth,
  UserDetailTabSocial,
} from "@/modules/admin-users/components"
import { useAdminUserDetail } from "@/modules/admin-users/composables/useAdminUserDetail"
import { formatDateTime, roleLabel } from "@/modules/admin-users/constants"

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
  activities,
  uploadLogs,
  activityLoading,
  oauthAuths,
  oauthLoading,
  gameBindings,
  gameBindingLoading,
  socialPlatform,
  socialLoading,
  authorizedSocials,
  authSocialLoading,
  iosUploadCode,
  emailDialogOpen,
  editEmail,
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
  onTabChange,
  openEmailEdit,
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
</script>
<template>
  <div class="w-full flex flex-col gap-4">
    <Button variant="ghost" size="sm" class="self-start" @click="goBack">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.backToList") }}
    </Button>

    <template v-if="loading">
      <Card>
        <CardContent class="flex items-center gap-4">
          <Skeleton class="size-14 shrink-0 rounded-full" />
          <div class="min-w-0 flex-1 flex flex-col gap-2">
            <Skeleton class="h-5 w-44 max-w-full" />
            <Skeleton class="h-4 w-72 max-w-full" />
          </div>
        </CardContent>
      </Card>
      <Skeleton class="h-9 w-full max-w-xl" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="user">
      <!-- Identity header: keeps the viewed user visible regardless of active tab -->
      <Card>
        <CardContent class="flex flex-wrap items-center gap-4">
          <Avatar class="size-14 border">
            <AvatarImage
              v-if="user.userData.avatarPath"
              :src="user.userData.avatarPath"
              :alt="user.userData.name"
            />
            <AvatarFallback class="text-lg font-semibold">
              {{ user.userData.name?.charAt(0)?.toUpperCase() || "?" }}
            </AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1 flex flex-col gap-1.5">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h2 class="max-w-full truncate text-lg font-semibold leading-tight">
                {{ user.userData.name }}
              </h2>
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  user.userData.role === 'super_admin'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : user.userData.role === 'admin'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                ]"
              >
                <LucideShieldAlert v-if="user.userData.role === 'super_admin'" class="w-3.5 h-3.5" />
                <LucideShield v-else-if="user.userData.role === 'admin'" class="w-3.5 h-3.5" />
                <LucideUser v-else class="w-3.5 h-3.5" />
                {{ roleLabel(user.userData.role, t) }}
              </span>
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  user.banned
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : user.deleted
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                ]"
              >
                <LucideBan v-if="user.banned" class="w-3.5 h-3.5" />
                <LucideTrash2 v-else-if="user.deleted" class="w-3.5 h-3.5" />
                <LucideCheckCircle2 v-else class="w-3.5 h-3.5" />
                {{
                  user.banned
                    ? t("adminUsers.status.banned")
                    : user.deleted
                      ? t("adminUsers.status.deleted")
                      : t("adminUsers.status.normal")
                }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span class="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums">
                <LucideHash class="h-3.5 w-3.5 shrink-0" />
                {{ user.userData.userId }}
              </span>
              <span class="inline-flex min-w-0 items-center gap-1.5">
                <LucideMail class="h-3.5 w-3.5 shrink-0" />
                <span class="truncate" :title="user.userData.emailInfo?.email || t('adminUsers.common.unbound')">
                  {{ user.userData.emailInfo?.email || t("adminUsers.common.unbound") }}
                </span>
              </span>
              <span
                v-if="user.createdAt"
                class="inline-flex items-center gap-1.5"
                :title="t('adminUsers.detail.info.registeredAt')"
              >
                <LucideCalendar class="h-3.5 w-3.5 shrink-0" />
                {{ formatDateTime(user.createdAt) }}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs default-value="info" @update:model-value="onTabChange">
        <div class="w-full overflow-x-auto pb-1 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
          <TabsList class="flex w-max">
            <TabsTrigger class="shrink-0" value="info">{{ t("adminUsers.detail.tabs.info") }}</TabsTrigger>
            <TabsTrigger class="shrink-0" value="activity">{{ t("adminUsers.detail.tabs.activity") }}</TabsTrigger>
            <TabsTrigger class="shrink-0" value="oauth">{{ t("adminUsers.detail.tabs.oauth") }}</TabsTrigger>
            <TabsTrigger class="shrink-0" value="game">{{ t("adminUsers.detail.tabs.game") }}</TabsTrigger>
            <TabsTrigger class="shrink-0" value="social">{{ t("adminUsers.detail.tabs.social") }}</TabsTrigger>
            <TabsTrigger class="shrink-0" value="auth-social">{{ t("adminUsers.detail.tabs.authSocial") }}</TabsTrigger>
            <TabsTrigger class="shrink-0" value="ios">{{ t("adminUsers.detail.tabs.ios") }}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info">
          <UserDetailTabInfo
            :user="user"
            :is-super-admin="userStore.isSuperAdmin"
            :action-loading="actionLoading"
            :busy="taskLoading"
            @open-email-edit="openEmailEdit"
            @role-change="handleRoleChange"
            @toggle-cn-mysekai="handleToggleCNMysekai"
            @unban="handleUnban"
            @ban="handleBan"
            @force-logout="handleForceLogout"
            @reset-password="handleResetPassword"
            @restore="handleRestore"
            @delete="handleDelete"
          />
        </TabsContent>

        <TabsContent value="activity">
          <UserDetailTabActivity
            :loading="activityLoading"
            :activities="activities"
            :upload-logs="uploadLogs"
          />
        </TabsContent>

        <TabsContent value="oauth">
          <UserDetailTabOAuth
            :loading="oauthLoading"
            :busy="taskLoading"
            :authorizations="oauthAuths"
            @revoke-all="handleRevokeOAuth"
          />
        </TabsContent>

        <TabsContent value="game">
          <UserDetailTabGameBindings
            :loading="gameBindingLoading"
            :busy="taskLoading"
            :game-bindings="gameBindings"
            @add="openAddGameBinding"
            @edit="openEditGameBinding"
            @delete="({ server, gameUserId }) => handleDeleteGameBinding(server, gameUserId)"
          />
        </TabsContent>

        <TabsContent value="social">
          <UserDetailTabSocial
            :loading="socialLoading"
            :busy="taskLoading"
            :social-platform="socialPlatform"
            @edit="openEditSocial"
            @delete="handleDeleteSocial"
          />
        </TabsContent>

        <TabsContent value="auth-social">
          <UserDetailTabAuthorizedSocial
            :loading="authSocialLoading"
            :busy="taskLoading"
            :authorized-socials="authorizedSocials"
            @add="openAddAuthSocial"
            @edit="openEditAuthSocial"
            @delete="handleDeleteAuthSocial"
          />
        </TabsContent>

        <TabsContent value="ios">
          <UserDetailTabIOSCode
            :upload-code="iosUploadCode"
            :busy="taskLoading"
            @regenerate="handleRegenerateIOS"
            @delete="handleDeleteIOS"
          />
        </TabsContent>
      </Tabs>
    </template>

    <template v-else>
      <Card>
        <CardContent>
          <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <LucideUserX class="h-8 w-8 text-muted-foreground/60" />
            <p class="text-sm text-muted-foreground">{{ t("adminUsers.detail.notFound") }}</p>
            <Button variant="outline" size="sm" @click="goBack">
              <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.backToList") }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </template>
    <UserDetailDialogs
      :user-name="user?.userData.name"
      :has-social="!!socialPlatform"
      :action-loading="actionLoading"
      :auth-social-create-mode="authSocialCreateMode"
      :edit-auth-social-id="editAuthSocialId"
      v-model:email-dialog-open="emailDialogOpen"
      v-model:edit-email="editEmail"
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
      @save-email="handleEmailUpdate"
      @save-game-binding="handleSaveGameBinding"
      @save-social="handleSaveSocial"
      @save-auth-social="handleSaveAuthSocial"
    />
  </div>
</template>
