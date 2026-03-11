<script setup lang="ts">
import type { MysekaiDataPrivacySettings, SekaiRegion, SuiteDataPrivacySettings } from "@/types/store"
import type { SocialPlatform } from "@/types/social-platform"
import UserDetailDialogAuthorizedSocial from "@/modules/admin-users/components/UserDetailDialogAuthorizedSocial.vue"
import UserDetailDialogEmail from "@/modules/admin-users/components/UserDetailDialogEmail.vue"
import UserDetailDialogGameBinding from "@/modules/admin-users/components/UserDetailDialogGameBinding.vue"
import UserDetailDialogSocial from "@/modules/admin-users/components/UserDetailDialogSocial.vue"

interface Props {
  userName?: string
  hasSocial: boolean
  actionLoading: boolean
  emailDialogOpen: boolean
  editEmail: string
  gameBindingDialogOpen: boolean
  editGameIsEditMode: boolean
  editGameServer: SekaiRegion
  editGameUserId: string
  editGameSuite: SuiteDataPrivacySettings
  editGameMysekai: MysekaiDataPrivacySettings
  socialDialogOpen: boolean
  editSocialPlatform: SocialPlatform
  editSocialUserId: string
  editSocialVerified: boolean
  authSocialDialogOpen: boolean
  authSocialCreateMode: boolean
  editAuthSocialId: string
  editAuthSocialPlatform: SocialPlatform
  editAuthSocialUserId: string
  editAuthSocialComment: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (event: "update:emailDialogOpen", value: boolean): void
  (event: "update:editEmail", value: string): void
  (event: "update:gameBindingDialogOpen", value: boolean): void
  (event: "update:editGameServer", value: SekaiRegion): void
  (event: "update:editGameUserId", value: string): void
  (event: "update:editGameSuite", value: SuiteDataPrivacySettings): void
  (event: "update:editGameMysekai", value: MysekaiDataPrivacySettings): void
  (event: "update:socialDialogOpen", value: boolean): void
  (event: "update:editSocialPlatform", value: SocialPlatform): void
  (event: "update:editSocialUserId", value: string): void
  (event: "update:editSocialVerified", value: boolean): void
  (event: "update:authSocialDialogOpen", value: boolean): void
  (event: "update:editAuthSocialPlatform", value: SocialPlatform): void
  (event: "update:editAuthSocialUserId", value: string): void
  (event: "update:editAuthSocialComment", value: string): void
  (event: "saveEmail"): void
  (event: "saveGameBinding"): void
  (event: "saveSocial"): void
  (event: "saveAuthSocial"): void
}>()
</script>

<template>
  <UserDetailDialogEmail
    :open="props.emailDialogOpen"
    :user-name="props.userName"
    :email="props.editEmail"
    :action-loading="props.actionLoading"
    @update:open="emit('update:emailDialogOpen', $event)"
    @update:email="emit('update:editEmail', $event)"
    @save="emit('saveEmail')"
  />

  <UserDetailDialogGameBinding
    :open="props.gameBindingDialogOpen"
    :is-edit-mode="props.editGameIsEditMode"
    :user-name="props.userName"
    :action-loading="props.actionLoading"
    :server="props.editGameServer"
    :game-user-id="props.editGameUserId"
    :suite="props.editGameSuite"
    :mysekai="props.editGameMysekai"
    @update:open="emit('update:gameBindingDialogOpen', $event)"
    @update:server="emit('update:editGameServer', $event)"
    @update:game-user-id="emit('update:editGameUserId', $event)"
    @update:suite="emit('update:editGameSuite', $event)"
    @update:mysekai="emit('update:editGameMysekai', $event)"
    @save="emit('saveGameBinding')"
  />

  <UserDetailDialogSocial
    :open="props.socialDialogOpen"
    :user-name="props.userName"
    :has-social="props.hasSocial"
    :platform="props.editSocialPlatform"
    :user-id="props.editSocialUserId"
    :verified="props.editSocialVerified"
    :action-loading="props.actionLoading"
    @update:open="emit('update:socialDialogOpen', $event)"
    @update:platform="emit('update:editSocialPlatform', $event)"
    @update:user-id="emit('update:editSocialUserId', $event)"
    @update:verified="emit('update:editSocialVerified', $event)"
    @save="emit('saveSocial')"
  />

  <UserDetailDialogAuthorizedSocial
    :open="props.authSocialDialogOpen"
    :user-name="props.userName"
    :is-create-mode="props.authSocialCreateMode"
    :edit-id="props.editAuthSocialId"
    :platform="props.editAuthSocialPlatform"
    :user-id="props.editAuthSocialUserId"
    :comment="props.editAuthSocialComment"
    :action-loading="props.actionLoading"
    @update:open="emit('update:authSocialDialogOpen', $event)"
    @update:platform="emit('update:editAuthSocialPlatform', $event)"
    @update:user-id="emit('update:editAuthSocialUserId', $event)"
    @update:comment="emit('update:editAuthSocialComment', $event)"
    @save="emit('saveAuthSocial')"
  />
</template>
