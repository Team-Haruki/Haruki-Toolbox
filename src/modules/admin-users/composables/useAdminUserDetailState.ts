import { ref } from "vue"
import type {
  AdminUserDetail,
  AuthorizedSocialPlatform,
  UploadLog,
  UserActivity,
  UserSocialPlatform,
} from "@/types/admin"
import type { SocialPlatform } from "@/types/social-platform"
import type { SekaiRegion } from "@/types/store"
import type { ErrorDescription } from "@/lib/error-utils"
import type { UserOAuthAuthorization } from "@/modules/admin-users/api/oauth"
import type { AdminUserGameBinding } from "@/modules/admin-users/api/shared"
import {
  normalizeMysekaiPermissions,
  normalizeSuitePermissions,
  type MysekaiPermissions,
  type SuitePermissions,
} from "@/lib/game-binding-permissions"

/** The blocks of the detail page that load from their own endpoint. */
export type DetailSection = "activity" | "oauth" | "game" | "social" | "auth-social"

/** What the activity response says about the lists it returned. */
export interface UserActivityScope {
  from: string
  to: string
  systemLogTotal: number
  uploadLogTotal: number
}

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
    // A 404 is "no such user"; anything else is a retryable load failure shown inline.
    userNotFound: ref(false),
    userLoadError: ref<ErrorDescription | null>(null),

    // Every section loads right after the user: its flag starts true so the
    // section shows its skeleton, never an "empty" state, before the answer.
    activities: ref<UserActivity[]>([]),
    uploadLogs: ref<UploadLog[]>([]),
    activityScope: ref<UserActivityScope | null>(null),
    activityLoading: ref(true),
    activityError: ref<ErrorDescription | null>(null),

    oauthAuths: ref<UserOAuthAuthorization[]>([]),
    oauthLoading: ref(true),
    oauthError: ref<ErrorDescription | null>(null),

    gameBindings: ref<AdminUserGameBinding[]>([]),
    gameBindingLoading: ref(true),
    gameBindingError: ref<ErrorDescription | null>(null),

    socialPlatform: ref<UserSocialPlatform | null>(null),
    socialLoading: ref(true),
    socialError: ref<ErrorDescription | null>(null),

    authorizedSocials: ref<AuthorizedSocialPlatform[]>([]),
    authSocialLoading: ref(true),
    authSocialError: ref<ErrorDescription | null>(null),

    iosUploadCode: ref<string | null>(null),

    emailDialogOpen: ref(false),
    editEmail: ref(""),
    editEmailError: ref(""),

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

  // True once a section's endpoint has answered: its list is then the truth,
  // and the stat tiles count it instead of the copy in the detail payload.
  const sectionLoaded = ref<Record<DetailSection, boolean>>({
    activity: false,
    oauth: false,
    game: false,
    social: false,
    "auth-social": false,
  })

  function markSectionLoaded(section: DetailSection) {
    sectionLoaded.value[section] = true
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

  function resetSections() {
    sectionLoaded.value = {
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
    refs.userNotFound.value = false
    refs.userLoadError.value = null
    refs.editEmailError.value = ""
    refs.activities.value = []
    refs.uploadLogs.value = []
    refs.activityScope.value = null
    refs.activityLoading.value = true
    refs.activityError.value = null
    refs.oauthAuths.value = []
    refs.oauthLoading.value = true
    refs.oauthError.value = null
    refs.gameBindings.value = []
    refs.gameBindingLoading.value = true
    refs.gameBindingError.value = null
    refs.socialPlatform.value = null
    refs.socialLoading.value = true
    refs.socialError.value = null
    refs.authorizedSocials.value = []
    refs.authSocialLoading.value = true
    refs.authSocialError.value = null
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

    resetSections()
  }

  return {
    refs,
    sectionLoaded,
    markSectionLoaded,
    resetGameBindingEditor,
    resetSections,
    resetForUserChange,
  }
}

export type AdminUserDetailState = ReturnType<typeof createAdminUserDetailState>
