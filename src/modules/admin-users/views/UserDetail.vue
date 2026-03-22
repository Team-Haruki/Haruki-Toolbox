<script setup lang="ts">
import { useRouter } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  LucideArrowLeft,
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

const props = defineProps<{ userId: string }>()
const router = useRouter()
const userStore = useUserStore()
const { t } = useI18n()

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
    <Button variant="ghost" size="sm" class="self-start" @click="router.push({ name: 'admin.users' })">
      <LucideArrowLeft class="w-4 h-4 mr-1" /> {{ t("adminUsers.detail.backToList") }}
    </Button>

    <template v-if="loading">
      <Skeleton class="h-40 w-full" />
      <Skeleton class="h-64 w-full" />
    </template>

    <template v-else-if="user">
      <Tabs default-value="info" @update:model-value="onTabChange">
        <TabsList class="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="info">{{ t("adminUsers.detail.tabs.info") }}</TabsTrigger>
          <TabsTrigger value="activity">{{ t("adminUsers.detail.tabs.activity") }}</TabsTrigger>
          <TabsTrigger value="oauth">{{ t("adminUsers.detail.tabs.oauth") }}</TabsTrigger>
          <TabsTrigger value="game">{{ t("adminUsers.detail.tabs.game") }}</TabsTrigger>
          <TabsTrigger value="social">{{ t("adminUsers.detail.tabs.social") }}</TabsTrigger>
          <TabsTrigger value="auth-social">{{ t("adminUsers.detail.tabs.authSocial") }}</TabsTrigger>
          <TabsTrigger value="ios">{{ t("adminUsers.detail.tabs.ios") }}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <UserDetailTabInfo
            :user="user"
            :is-super-admin="userStore.isSuperAdmin"
            :action-loading="actionLoading"
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
        <CardContent class="py-16 text-center text-muted-foreground">
          {{ t("adminUsers.detail.notFound") }}
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
