import { ref } from "vue"
import type {
  AdminGameAccountBinding,
  AdminUserDetail,
  AuthorizedSocialPlatform,
  UserActivity,
  UserSocialPlatform,
} from "@/types/admin"
import type { SocialPlatform } from "@/types/social-platform"
import type { SekaiRegion } from "@/types/store"
import type { UserOAuthAuthorization } from "@/modules/admin-users/api/oauth"
import {
  normalizeMysekaiPermissions,
  normalizeSuitePermissions,
  type MysekaiPermissions,
  type SuitePermissions,
} from "@/lib/game-binding-permissions"

export type LazyTab = "activity" | "oauth" | "game" | "social" | "auth-social"

export const INITIAL_GAME_SERVER: SekaiRegion = "jp"
export const DEFAULT_SOCIAL_PLATFORM: SocialPlatform = "qq"

function createDefaultSuitePermissions(): SuitePermissions {
  return normalizeSuitePermissions(null)
}

function createDefaultMysekaiPermissions(): MysekaiPermissions {
  return normalizeMysekaiPermissions(null)
}

export function createAdminUserDetailState() {
  const refs = {
    loading: ref(true),
    actionLoading: ref(false),
    taskLoading: ref(false),
    user: ref<AdminUserDetail | null>(null),

    activities: ref<UserActivity[]>([]),
    activityLoading: ref(false),

    oauthAuths: ref<UserOAuthAuthorization[]>([]),
    oauthLoading: ref(false),

    gameBindings: ref<AdminGameAccountBinding[]>([]),
    gameBindingLoading: ref(false),

    socialPlatform: ref<UserSocialPlatform | null>(null),
    socialLoading: ref(false),

    authorizedSocials: ref<AuthorizedSocialPlatform[]>([]),
    authSocialLoading: ref(false),

    iosUploadCode: ref<string | null>(null),

    emailDialogOpen: ref(false),
    editEmail: ref(""),

    gameBindingDialogOpen: ref(false),
    editGameIsEditMode: ref(false),
    editGameServer: ref<SekaiRegion>(INITIAL_GAME_SERVER),
    editGameUserId: ref(""),
    editGameOriginalServer: ref<SekaiRegion>(INITIAL_GAME_SERVER),
    editGameOriginalUserId: ref(""),
    editGameSuite: ref(createDefaultSuitePermissions()),
    editGameMysekai: ref(createDefaultMysekaiPermissions()),

    socialDialogOpen: ref(false),
    editSocialPlatform: ref<SocialPlatform>(DEFAULT_SOCIAL_PLATFORM),
    editSocialUserId: ref(""),
    editSocialVerified: ref(false),

    authSocialDialogOpen: ref(false),
    authSocialCreateMode: ref(false),
    editAuthSocialId: ref(""),
    editAuthSocialPlatform: ref<SocialPlatform>(DEFAULT_SOCIAL_PLATFORM),
    editAuthSocialUserId: ref(""),
    editAuthSocialComment: ref(""),
  }

  const lazyTabLoaded = ref<Record<LazyTab, boolean>>({
    activity: false,
    oauth: false,
    game: false,
    social: false,
    "auth-social": false,
  })

  function markTabLoaded(tab: LazyTab) {
    lazyTabLoaded.value[tab] = true
  }

  function shouldLoadTab(tab: LazyTab) {
    return !lazyTabLoaded.value[tab]
  }

  function resetGameBindingEditor() {
    refs.editGameIsEditMode.value = false
    refs.editGameServer.value = INITIAL_GAME_SERVER
    refs.editGameUserId.value = ""
    refs.editGameOriginalServer.value = INITIAL_GAME_SERVER
    refs.editGameOriginalUserId.value = ""
    refs.editGameSuite.value = createDefaultSuitePermissions()
    refs.editGameMysekai.value = createDefaultMysekaiPermissions()
  }

  function resetLazyTabs() {
    lazyTabLoaded.value = {
      activity: false,
      oauth: false,
      game: false,
      social: false,
      "auth-social": false,
    }
  }

  function resetForUserChange() {
    refs.loading.value = true
    refs.user.value = null
    refs.activities.value = []
    refs.activityLoading.value = false
    refs.oauthAuths.value = []
    refs.oauthLoading.value = false
    refs.gameBindings.value = []
    refs.gameBindingLoading.value = false
    refs.socialPlatform.value = null
    refs.socialLoading.value = false
    refs.authorizedSocials.value = []
    refs.authSocialLoading.value = false
    refs.iosUploadCode.value = null

    refs.emailDialogOpen.value = false
    refs.editEmail.value = ""

    refs.gameBindingDialogOpen.value = false
    resetGameBindingEditor()

    refs.socialDialogOpen.value = false
    refs.editSocialPlatform.value = DEFAULT_SOCIAL_PLATFORM
    refs.editSocialUserId.value = ""
    refs.editSocialVerified.value = false

    refs.authSocialDialogOpen.value = false
    refs.authSocialCreateMode.value = false
    refs.editAuthSocialId.value = ""
    refs.editAuthSocialPlatform.value = DEFAULT_SOCIAL_PLATFORM
    refs.editAuthSocialUserId.value = ""
    refs.editAuthSocialComment.value = ""

    resetLazyTabs()
  }

  return {
    refs,
    markTabLoaded,
    shouldLoadTab,
    resetGameBindingEditor,
    resetLazyTabs,
    resetForUserChange,
  }
}

export type AdminUserDetailState = ReturnType<typeof createAdminUserDetailState>
