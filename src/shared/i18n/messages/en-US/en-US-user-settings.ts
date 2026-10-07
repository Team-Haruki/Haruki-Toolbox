// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: userSettings, oauth
export default {
  "userSettings": {
    "common": {
      "actionFailedTitle": "Action failed",
      "missingUserDescription": "Missing user information. Please sign in again.",
      "cancel": "Cancel"
    },
    "sections": {
      "accountTitle": "Account settings",
      "accountDescription": "Identity and login security settings for your account.",
      "harukiBotTitle": "HarukiBot data authorization",
      "harukiBotDescription": "Manage social platform bindings and authorizations that let HarukiBot query your game data.",
      "oauthTitle": "OAuth authorization management",
      "oauthDescription": "Manage third-party applications that access your account data via OAuth."
    },
    "sekaiData": {
      "region": "Region",
      "masterVersion": "Master version",
      "displayVersion": "Display version",
      "fetchVersion": "Fetch version",
      "localVersion": "Local version",
      "remoteVersion": "Remote version",
      "updatedAt": "Updated at",
      "fileCount": "{count} files",
      "progress": "Status",
      "actions": "Actions",
      "never": "Never",
      "regionCacheTitle": "Region caches",
      "summary": {
        "readyRegions": "Ready regions",
        "cachedFiles": "Cached files",
        "activeTasks": "Active tasks"
      },
      "refreshMasterData": "Update",
      "clear": "Clear",
      "clearDialog": {
        "title": "Clear Master data cache?",
        "description": "This will clear local Master data and music metas caches for {region}. Related data must be downloaded again before use.",
        "confirm": "Clear cache"
      },
      "queueTitle": "Update queue",
      "queueEmpty": "No update tasks.",
      "queueDetails": {
        "cacheHit": "Cache is already current; no new files were downloaded.",
        "updated": "New cache data was downloaded and written.",
        "completed": "Task completed.",
        "failed": "Task failed.",
        "fileProgress": "Processing {file} ({current}/{total}).",
        "file": "Processing {file}.",
        "phase": "Current phase: {phase}."
      },
      "status": {
        "idle": "Idle",
        "loading": "Loading",
        "ready": "Ready",
        "clearing": "Clearing",
        "error": "Failed"
      },
      "phases": {
        "queued": "Queued",
        "checking": "Checking version",
        "fetching-master": "Fetching master",
        "fetching-music-metas": "Fetching music metas",
        "writing-cache": "Writing cache",
        "ready": "Ready",
        "clearing": "Clearing cache"
      },
      "queueStatus": {
        "queued": "Queued",
        "running": "Running",
        "done": "Done",
        "error": "Failed"
      }
    },
    "kratosFlow": {
      "title": "Identity settings",
      "description": "Use this page to update your email, password, and profile traits.",
      "toast": {
        "savedTitle": "Settings updated",
        "profileSavedDescription": "Email or nickname updated successfully",
        "passwordSavedDescription": "Password settings updated successfully",
        "mfaSavedDescription": "Multi-factor authentication settings updated successfully",
        "socialSavedDescription": "Social sign-in settings updated successfully",
        "genericSavedDescription": "Identity settings updated successfully"
      },
      "groups": {
        "profile": "Profile",
        "password": "Password",
        "oidc": "Social login",
        "passkey": "Passkeys",
        "webauthn": "Security keys",
        "totp": "Authenticator app",
        "lookupSecret": "Recovery codes"
      }
    },
    "profileCard": {
      "title": "Profile",
      "description": "Avatar, nickname and email binding."
    },
    "securityCard": {
      "title": "Security & sign-in",
      "description": "Password, multi-factor auth, social sign-in and sessions."
    },
    "account": {
      "title": "Avatar settings",
      "description": "Manage your Haruki Toolbox avatar",
      "changeAvatar": "Change avatar",
      "uploading": "Uploading...",
      "autoUploadHint": "After selecting an avatar image, it is cropped to square and compressed before upload.",
      "toast": {
        "previewFailedTitle": "Preview failed",
        "previewFailedDescription": "Failed to read avatar file. Please try again.",
        "invalidAvatarTypeTitle": "Unsupported avatar format",
        "invalidAvatarTypeDescription": "Please choose an image file.",
        "avatarTooLargeTitle": "Avatar file too large",
        "avatarTooLargeDescription": "Please choose an image smaller than {sizeMb} MB.",
        "savedTitle": "Avatar updated",
        "savedDescription": "Avatar uploaded successfully",
        "saveFailedTitle": "Avatar upload failed",
        "saveFailedDescription": "Avatar upload failed. Please try again later."
      }
    },
    "email": {
      "unbound": "Unbound",
      "title": "Email settings",
      "description": "Manage your email binding",
      "kratosManagedDescription": "Email updates and verification are handled by the identity center.",
      "kratosManagedHint": "Email and nickname updates are handled in the identity center flow. Return here after completing it.",
      "currentEmailLabel": "Current email",
      "currentNicknameLabel": "Current nickname",
      "unsetNickname": "Not set",
      "changeButton": "Manage email & nickname",
      "verifyButton": "Verify email",
      "dialog": {
        "title": "Change email",
        "description": "Enter a new email, complete CAPTCHA, and send verification code.",
        "newEmailPlaceholder": "New email address",
        "codePlaceholder": "Email verification code",
        "countdown": "{seconds}s",
        "sendCodeButton": "Send code",
        "confirmButton": "Confirm change"
      },
      "toast": {
        "invalidNewEmailTitle": "Please enter a valid new email",
        "invalidNewEmailDescription": "Please check the email format and try again",
        "completeCaptchaTitle": "Please complete CAPTCHA first",
        "completeCaptchaDescription": "Complete CAPTCHA below before sending email",
        "codeSentTitle": "Verification code sent",
        "codeSentDescription": "Sent to {email}. Please check your inbox.",
        "sendCodeFailedTitle": "Failed to send verification code",
        "sendCodeFailedDescription": "Failed to send verification code",
        "inputCodeTitle": "Please enter verification code",
        "inputCodeDescription": "Please enter the code received by email",
        "changeSuccessTitle": "Email changed successfully",
        "changeSuccessDescription": "Please sign in again to apply changes",
        "changeFailedTitle": "Failed to change email",
        "changeFailedDescription": "Failed to change email"
      }
    },
    "password": {
      "title": "Password settings",
      "description": "Manage your Haruki Toolbox account password",
      "kratosManagedDescription": "Password updates are handled by the identity center.",
      "kratosManagedHint": "Use the button below to continue in the identity settings flow, then return to the toolbox when finished.",
      "changeButton": "Change password",
      "dialog": {
        "title": "Change password",
        "description": "Enter your current password and a new password",
        "oldPasswordLabel": "Current password",
        "oldPasswordPlaceholder": "Enter current password",
        "newPasswordLabel": "New password",
        "newPasswordPlaceholder": "Enter new password",
        "confirmPasswordLabel": "Confirm password",
        "confirmPasswordPlaceholder": "Enter new password again",
        "submit": "Submit"
      },
      "toast": {
        "validateFailedTitle": "Validation failed",
        "oldPasswordRequired": "Please enter current password",
        "newPasswordRequired": "Please enter new password",
        "passwordMismatch": "The two new passwords do not match",
        "passwordMinLength": "New password must be at least 8 characters",
        "changeSuccessTitle": "Password changed successfully",
        "changeSuccessDescription": "Please sign in again",
        "changeFailedTitle": "Failed to change password",
        "changeFailedDescription": "Failed to change password"
      }
    },
    "mfa": {
      "title": "Multi-factor authentication",
      "description": "Manage TOTP, WebAuthn, and recovery codes.",
      "hint": "Use this page to enroll or update MFA methods for stronger account security.",
      "manageButton": "Manage MFA"
    },
    "social": {
      "title": "Social login",
      "description": "Manage Google and other OIDC identity providers.",
      "hint": "Use this page to link or unlink social providers from your account.",
      "manageButton": "Manage social providers"
    },
    "sessions": {
      "title": "Session management",
      "description": "Review active sign-ins and revoke sessions you do not trust.",
      "hint": "You can sign out specific devices or sign out all other sessions at once.",
      "manageButton": "Manage sessions",
      "page": {
        "title": "Session management",
        "description": "Manage active sessions for your current identity.",
        "refresh": "Refresh",
        "currentSession": "Current session",
        "currentTag": "Current",
        "otherSessions": "Other active sessions",
        "empty": "No other active sessions.",
        "unknownDevice": "Unknown device",
        "issuedAt": "Issued at",
        "authenticatedAt": "Authenticated at",
        "expiresAt": "Expires at",
        "aal": "AAL",
        "revokeOne": "Revoke session",
        "revokeOthers": "Sign out other sessions",
        "loadFailed": "Failed to load sessions.",
        "revokeFailed": "Failed to revoke this session.",
        "revokeOthersFailed": "Failed to revoke other sessions."
      }
    },
    "imBinding": {
      "title": "Social platform binding",
      "description": "Manage social platform accounts bound to your Haruki Toolbox account",
      "fields": {
        "platform": "Platform",
        "account": "Account",
        "verificationStatus": "Verification status"
      },
      "status": {
        "verified": "Verified",
        "unverified": "Unverified"
      },
      "unbindButton": "Unbind",
      "unbindDialog": {
        "title": "Confirm unbind?",
        "description": "After unbinding, you can no longer use this social account in HarukiBot to query uploaded data.",
        "confirm": "Confirm"
      },
      "selectPlatformLabel": "Select platform",
      "selectPlatformPlaceholder": "Select platform",
      "accountPlaceholder": "Enter account ID",
      "emailVerifyRequiredHint": "Please verify your email before managing social platform bindings.",
      "captchaHint": "To prevent abuse, complete CAPTCHA below before sending email code.",
      "actions": {
        "sendEmailCode": "Send email code",
        "generateCode": "Generate code"
      },
      "dialog": {
        "title": "Social platform verification",
        "qqDescription": "Enter the code from your email to complete binding.",
        "otherDescription": "Use the code below on the target platform, then click Verify to refresh status.",
        "qqCodePlaceholder": "Enter email verification code",
        "verifyButton": "Verify"
      },
      "toast": {
        "emailNotVerifiedTitle": "Email not verified",
        "emailNotVerifiedDescription": "Please verify your email before managing social platform bindings.",
        "sendFailedTitle": "Send failed",
        "completeCaptchaDescription": "Please complete CAPTCHA verification first",
        "verificationCodeSentTitle": "Verification code sent",
        "verificationCodeSentDescription": "Please check QQ {account}'s mailbox",
        "generateFailedTitle": "Generation failed",
        "incompleteResponseDescription": "Incomplete response data",
        "codeGeneratedTitle": "Verification code generated",
        "missingQQAccountDescription": "Please enter QQ account first",
        "invalidQQAccountDescription": "QQ number must be digits only",
        "invalidQQBotAccountDescription": "The QQ official-bot OpenID looks too short; please copy the full ID",
        "missingAccountDescription": "Please enter the account ID to bind",
        "verifyFailedTitle": "Verification failed",
        "inputQQCodeDescription": "Please enter the code from email",
        "verifySuccessTitle": "Verification successful",
        "verifySuccessDefaultDescription": "Binding completed",
        "missingStatusTokenDescription": "Missing status token. Please generate a new verification code.",
        "notVerifiedTitle": "Not verified",
        "notVerifiedDescription": "Verification is not completed yet",
        "notVerifiedFallbackDescription": "Please complete verification on the social platform and try again.",
        "unboundSuccessTitle": "Unbound",
        "unboundSuccessDescription": "This social account has been unbound from your account"
      }
    },
    "imAuthorization": {
      "title": "Authorized social queries",
      "description": "Manage social platforms authorized to query your game account information",
      "addButton": "Add authorization",
      "emptyTitle": "No authorized platforms yet",
      "emptyDescription": "Once you add an authorization, that platform account can look up your game account data.",
      "platformPlaceholder": "Select social platform",
      "platforms": {
        "qq": "QQ",
        "qqbot": "QQ Official Bot",
        "discord": "Discord",
        "telegram": "Telegram"
      },
      "fields": {
        "platform": "Platform",
        "account": "Account",
        "remark": "Remark",
        "allowFastVerification": "Allow Fast Verification",
        "allowFastVerificationHint": "When enabled, this user can quickly pass account verification in HarukiBot"
      },
      "fastVerificationBadge": "Fast verification",
      "actions": {
        "edit": "Edit",
        "delete": "Delete"
      },
      "dialog": {
        "createTitle": "Add social authorization",
        "editTitle": "Edit social authorization",
        "descriptionMain": "Modify social accounts authorized to query information",
        "descriptionHint": "You need to finish account binding settings before using this feature"
      },
      "deleteDialog": {
        "title": "Confirm deletion",
        "description": "Delete {platform} {userId}? This action cannot be undone.",
        "deleting": "Deleting..."
      },
      "toast": {
        "saveFailedTitle": "Save failed",
        "accountRequiredDescription": "Please enter account",
        "accountQQNumericDescription": "QQ number must be digits only",
        "accountQQBotLengthDescription": "The QQ official-bot OpenID looks too short; please copy the full ID",
        "saveSuccessTitle": "Authorization saved",
        "saveSuccessDescription": "Social authorization info has been updated",
        "deleteSuccessTitle": "Authorization removed",
        "deleteSuccessDescription": "This social authorization has been removed",
        "deleteFailedTitle": "Delete failed"
      }
    },
    "oauthAuthorizations": {
      "title": "Authorized applications",
      "description": "Review and revoke third-party applications authorized to access your account data.",
      "refresh": "Refresh",
      "emptyTitle": "No authorized applications",
      "emptyDescription": "Third-party applications you authorize to access your account data will appear here.",
      "authorizedAtPrefix": "Authorized at",
      "clientType": {
        "bot": "Bot",
        "website": "Website"
      },
      "dialog": {
        "title": "Revoke authorization",
        "description": "Revoke all access for {clientName}? The app will no longer access your data.",
        "revoke": "Revoke",
        "revoking": "Revoking..."
      },
      "toast": {
        "fetchFailedTitle": "Failed to load authorization list",
        "fetchFailedFallback": "Load failed",
        "revokeSuccessTitle": "Authorization revoked",
        "revokeSuccessDescription": "Access for {clientName} has been revoked",
        "revokeFailedTitle": "Revoke failed",
        "revokeFailedFallback": "Revoke failed"
      }
    },
    "gameBinding": {
      "title": "Game account bindings",
      "description": "Manage Project SEKAI accounts bound to your Haruki Toolbox account",
      "alert": {
        "title": "Notice",
        "line1Server": "same server",
        "line1Middle": " and ",
        "line1GameId": "same game ID",
        "line1After": " can only be bound to one Haruki Toolbox account.",
        "line2": "Account binding information in Haruki Toolbox is not shared with HarukiBot NEO. To query data on HarukiBot NEO, please first bind the corresponding game account on the Bot by following the Bot usage guide."
      },
      "addButton": "Bind new account",
      "empty": "No data",
      "region": {
        "jp": "JP",
        "en": "Global",
        "tw": "TW",
        "kr": "KR",
        "cn": "CN"
      },
      "table": {
        "server": "Server",
        "userId": "Game UID",
        "verificationStatus": "Verification",
        "actions": "Actions"
      },
      "status": {
        "verified": "Verified",
        "unverified": "Unverified",
        "default": "Default"
      },
      "actions": {
        "edit": "Edit",
        "grants": "Data grants",
        "receivedGrants": "Received grants",
        "delete": "Delete",
        "setDefault": "Set as default account"
      },
      "editDialog": {
        "createTitle": "Add account",
        "editTitle": "Edit account",
        "subtitle": "Bind your game account and configure data permissions.",
        "verifyHint": "Verification is required before the binding can be saved.",
        "basicInfoTitle": "Basic account info",
        "serverPlaceholder": "Select server",
        "verifyButton": "Verify",
        "fields": {
          "server": "Server",
          "userId": "Game UID",
          "verificationStatus": "Verification"
        },
        "suite": {
          "title": "Suite data settings",
          "description": "Manage Suite data settings for this uploaded game account"
        },
        "mysekai": {
          "title": "MySekai data settings",
          "description": "Manage MySekai data settings for this uploaded game account"
        }
      },
      "deleteDialog": {
        "title": "Confirm deletion",
        "description": "Delete game UID {userId} on {server}? This action cannot be undone."
      },
      "verifyDialog": {
        "title": "Verification code generated",
        "description": "Enter the verification code below in your in-game profile signature",
        "copyHint": "Click the code below to copy it to clipboard",
        "confirmButton": "Done, close this window",
        "notice": {
          "keepFullCode": "Please enter the full code in signature, including slash characters",
          "returnHome": "After entering the code in game, return to the home page to ensure it is saved before adding account",
          "saveAfterClose": "After entering the code, close this window and click Save to verify the account"
        }
      },
      "permissions": {
        "suite": {
          "allowPublicApi": {
            "title": "Allow public API access",
            "description": "Allow Suite data to be accessed through Haruki Toolbox public API"
          },
          "allowSakura": {
            "title": "Allow upload to SakuraBot",
            "description": "Allow Suite data to be uploaded to SakuraBot"
          },
          "allow8823": {
            "title": "Allow upload to Kaosen Bot",
            "description": "Allow Suite data to be uploaded to Kaosen Bot"
          },
          "allowResona": {
            "title": "Allow upload to ResonaBot",
            "description": "Allow Suite data to be uploaded to ResonaBot"
          },
          "allowLuna": {
            "title": "Allow upload to LunaBot",
            "description": "Allow Suite data to be uploaded to LunaBot"
          }
        },
        "mysekai": {
          "allowPublicApi": {
            "title": "Allow public API access",
            "description": "Allow MySekai data to be accessed through Haruki Toolbox public API"
          },
          "allowFixtureApi": {
            "title": "Allow fixture sharing API",
            "description": "Allow MySekai account UID to appear in fixture sharing API"
          },
          "allow8823": {
            "title": "Allow upload to Kaosen Bot",
            "description": "Allow MySekai data to be uploaded to Kaosen Bot"
          },
          "allowResona": {
            "title": "Allow upload to ResonaBot",
            "description": "Allow MySekai data to be uploaded to ResonaBot"
          },
          "allowLuna": {
            "title": "Allow upload to LunaBot",
            "description": "Allow MySekai data to be uploaded to LunaBot"
          }
        }
      },
      "grants": {
        "title": "Game account data grants",
        "description": "Temporarily let another Toolbox user read suite / mysekai / profile data from a verified account, or upload suite / mysekai data on its behalf.",
        "receivedDescription": "View game account data granted to you by other Toolbox users.",
        "selectedAccount": "Selected account: {account}",
        "noSelectedAccount": "No account selected",
        "ownedTitle": "Data granted from this account",
        "receivedTitle": "Data granted to me",
        "receivedHint": "Received grants can only be used, not re-granted or edited; ask the owner for changes.",
        "emptyOwned": "No grants for this account",
        "emptyReceived": "No received grants",
        "fallback": "—",
        "yourUserId": "Your Toolbox user ID:",
        "dataType": {
          "suite": "Suite",
          "mysekai": "MySekai",
          "profile": "Profile"
        },
        "permission": {
          "read": "Read",
          "write": "Write (upload on my behalf)",
          "readOnly": "Read only",
          "writeOnly": "Write only",
          "readWrite": "Read & write"
        },
        "actions": {
          "refresh": "Refresh",
          "save": "Save grant"
        },
        "form": {
          "title": "Create or update grant",
          "granteeUserId": "Grantee Toolbox user ID",
          "granteeUserIdPlaceholder": "For example 1234567890",
          "dataType": "Data type",
          "expiresAt": "Expires at",
          "expiresAtHelp": "Must be a future time. Permanent grants are not available.",
          "profileHint": "Profile is live data: every view by the grantee sends a request to the game server through your account.",
          "permissions": "Permissions",
          "writeHint": "Write lets the grantee upload and update this game account's data. It does not allow reading existing data, changing bindings or privacy settings, or re-granting.",
          "profileReadOnlyHint": "Profile grants are read-only.",
          "writeTargetNotice": "Uploads by the grantee will directly update {dataType} data for {account}. Double-check the region and game account.",
          "writeOnlyNotice": "Read is unchecked: the grantee can upload but cannot view this account's existing data."
        },
        "table": {
          "owner": "Owner",
          "grantee": "Grantee",
          "dataType": "Data type",
          "permissions": "Permissions",
          "expiresAt": "Expires at",
          "actions": "Actions"
        },
        "validation": {
          "verifiedOnly": "Only verified bound accounts can create data grants",
          "granteeRequired": "Enter a grantee user ID",
          "selfGrant": "You cannot grant access to yourself",
          "dataType": "Only suite, mysekai, and profile are supported",
          "permissionRequired": "Select at least one permission; use the delete button to revoke a grant",
          "profileReadOnly": "Profile does not support write permission",
          "futureExpiry": "Expiry must be a future time"
        },
        "toast": {
          "loadFailedTitle": "Failed to load data grants",
          "saveFailedTitle": "Failed to save data grant",
          "deleteFailedTitle": "Failed to revoke data grant",
          "saved": "Data grant saved",
          "deleted": "Data grant revoked"
        }
      },
      "toast": {
        "setDefaultSuccessTitle": "Default account updated",
        "setDefaultSuccessDescription": "Feature pages will select this account by default",
        "setDefaultFailedTitle": "Failed to set default account",
        "deleteSuccessTitle": "Deleted",
        "deleteSuccessDescription": "Account binding has been removed",
        "deleteFailedTitle": "Delete failed",
        "saveSuccessTitle": "Saved",
        "saveSuccessDescription": "Account settings have been updated",
        "saveFailedTitle": "Save failed",
        "verifyBeforeCreateDescription": "Before adding a new account, click Verify to generate a code and complete setup in game.",
        "uidMustBeNumericDescription": "Game UID must be numeric only",
        "generateCodeFailedTitle": "Unable to generate verification code",
        "selectServerAndUidDescription": "Select server and enter game UID first",
        "missingCodeDescription": "Verification code was not returned",
        "copySuccessTitle": "Copied",
        "copySuccessDescription": "Verification code copied. Please fill it in game.",
        "copyFailedTitle": "Copy failed",
        "clipboardUnsupportedDescription": "Clipboard is not supported in this environment. Please copy the code manually.",
        "copyFallbackDescription": "Please select and copy the verification code manually"
      }
    }
  },
  "oauth": {
    "scope": {
      "userRead": "Read profile",
      "bindingsRead": "Read linked accounts",
      "gameDataRead": "Read game data",
      "gameDataWrite": "Upload game data",
      "stationRoomWrite": "Submit room numbers (Sekai Station)",
      "openid": "Verify your identity and sign you in with your Haruki account",
      "profile": "See your display name",
      "email": "See your email address",
      "offlineAccess": "Maintain offline access and issue refresh tokens"
    },
    "scopeDescription": {
      "gameDataRead": "Read data of game accounts you own or were granted read access to. Does not include uploading.",
      "gameDataWrite": "Upload data for game accounts you own or were granted write access to. Does not include reading existing data.",
      "stationRoomWrite": "Submit room numbers to Sekai Station on your behalf.",
      "offlineAccess": "The app can keep using the permissions above while you are away, until you revoke it in settings."
    },
    "login": {
      "unknownApp": "Unknown app",
      "title": "Sign in to continue",
      "signInDescriptionPrefix": "To continue to ",
      "signInDescriptionSuffix": ", sign in to your Haruki Toolbox account.",
      "readyDescriptionPrefix": "You're signed in. Continue to ",
      "readyDescriptionSuffix": " to proceed with authorization.",
      "continuingTitle": "Continuing sign in",
      "continuingDescriptionPrefix": "Preparing the next authorization step for ",
      "continuingDescriptionSuffix": ".",
      "signInButton": "Sign in",
      "continueButton": "Continue",
      "cancel": "Cancel",
      "rejectDescription": "The authorization request was cancelled before login.",
      "invalidTitle": "Invalid sign-in request",
      "invalidDescription": "A required or valid login challenge was not provided. Please restart authorization from the client application.",
      "backHome": "Back to home",
      "toast": {
        "failedTitle": "Unable to continue sign-in",
        "missingRedirect": "Redirect URL was not returned",
        "retry": "Unable to continue sign-in. Please try again."
      }
    },
    "consent": {
      "unknownApp": "Unknown app",
      "title": "Authorization request",
      "descriptionPrefix": "",
      "descriptionSuffix": " requests access to your Haruki Toolbox account",
      "continuingDescriptionPrefix": "Preparing authorization for ",
      "continuingDescriptionSuffix": ".",
      "scopeIntro": "This app will be able to:",
      "noScopesRequested": "This app did not request any additional scopes.",
      "revokeHint": "After authorization, you can revoke it any time on the OAuth authorization management page.",
      "reject": "Reject",
      "authorize": "Authorize",
      "authorizing": "Authorizing...",
      "rejectDescription": "The resource owner denied the authorization request.",
      "invalidTitle": "Invalid authorization request",
      "invalidDescription": "Required or valid authorization parameters are missing. Please restart authorization from the client application.",
      "backHome": "Back to home",
      "toast": {
        "failedTitle": "Authorization failed",
        "missingRedirect": "Redirect URL was not returned",
        "retry": "Unable to complete authorization. Please try again."
      }
    },
    "logout": {
      "loadingTitle": "Loading sign-out request",
      "title": "Sign out",
      "descriptionPrefix": "",
      "descriptionSuffix": " is asking to sign you out of Haruki Toolbox.",
      "genericDescription": "A third-party app is asking to sign you out of Haruki Toolbox.",
      "confirmHint": "Confirming ends your session on this site and on connected third-party apps.",
      "cancel": "Cancel",
      "confirm": "Sign out",
      "loggingOut": "Signing out...",
      "invalidTitle": "Invalid sign-out request",
      "invalidDescription": "The logout challenge is missing or no longer valid.",
      "backHome": "Back to home",
      "toast": {
        "failedTitle": "Sign-out failed",
        "missingRedirect": "Redirect URL was not returned",
        "retry": "Unable to complete sign-out. Please try again."
      }
    },
    "device": {
      "framed": {
        "title": "Open this page in a new window",
        "description": "To protect your account, the device authorization page cannot be shown inside another page.",
        "open": "Open in a new window"
      },
      "signedOut": {
        "title": "Sign in to authorize a device",
        "description": "You need to sign in to your Haruki Toolbox account before entering a device code. You will come back here afterwards, with the code kept in the field.",
        "signIn": "Sign in"
      },
      "unavailable": {
        "title": "Device sign-in is not available yet",
        "description": "Device authorization is currently unavailable. Please try again later."
      },
      "inAppBrowser": {
        "title": "Open this page in your system browser",
        "description": "You are using an in-app browser, which may not share your sign-in with the system browser. Copy the page address, open it in your system browser, then type the code shown on your device.",
        "copy": "Copy page address",
        "copied": "Page address copied",
        "copyFailed": "Could not copy. Please copy the address manually."
      },
      "entry": {
        "title": "Authorize a device",
        "description": "Enter the code shown on your device or program, then check the request before you decide.",
        "codeLabel": "Device code",
        "codeHint": "Looks like BCDF-GHJK. Not case-sensitive; the hyphen is optional.",
        "submit": "Continue",
        "submitting": "Checking..."
      },
      "review": {
        "title": "Device authorization request",
        "description": "{client} is asking to access Haruki Toolbox as you",
        "clientId": "Client ID",
        "badge": {
          "official": "Official",
          "public": "Public app",
          "verified": "Verified client"
        },
        "publicHint": "Anyone can start a request in this app's name. Only continue if you started it on your own device just now.",
        "scopesTitle": "This app will be able to:",
        "noScopes": "This app requested no additional permissions.",
        "risk": {
          "identity": "Identity",
          "offline": "Offline",
          "read": "Read",
          "write": "Write"
        },
        "writeWarning": "This authorization includes write access: the app will be able to submit data as you. Only allow it if you trust this app.",
        "deviceLabelTitle": "App's own description",
        "deviceLabelHint": "Provided by the device and not verified",
        "deviceLabelEmpty": "The device gave no description",
        "requestedAt": "Requested at",
        "remaining": "Time left",
        "account": "Signed in as",
        "switchAccount": "Switch account",
        "phishingWarning": "Only continue if you started this yourself just now. Never enter a code someone else sent you.",
        "confirmCode": "Check that your device shows {code}",
        "labelTitle": "Device name (optional)",
        "labelHint": "Tells your devices apart in Authorized apps, up to 64 characters. Leave empty to use the app's own description.",
        "acknowledge": "I confirm that I started this myself just now, on my own device or program",
        "approve": "Allow",
        "approving": "Authorizing...",
        "deny": "Deny",
        "notMe": "I didn't start this",
        "outcomeUnknown": "We could not confirm whether the authorization went through. Check your device first; if it does not show success, you can select Allow again."
      },
      "result": {
        "approvedTitle": "Authorized",
        "approved": "Go back to your device. It should show “Authorized as {name}”. If this wasn't you, revoke it in Authorized apps right away.",
        "unconfirmedTitle": "Authorization not confirmed",
        "unconfirmed": "The authorization may have gone through. Check your device; if it does not show success, get a new code on the device.",
        "deniedTitle": "Authorization denied",
        "expiredTitle": "Code expired",
        "failedTitle": "Authorization failed",
        "errorTitle": "Cannot continue",
        "retryOnDevice": "Get a new code on your device.",
        "newCode": "Enter a new code",
        "authorizedApps": "View authorized apps"
      },
      "rateLimited": "Too many attempts. Try again in {seconds} s.",
      "error": {
        "feature_disabled": "Device sign-in is not available yet",
        "unsupported_media_type": "The request format is not supported. Reload the page and try again.",
        "origin_rejected": "This request origin is not allowed. Open this page from the Haruki Toolbox site.",
        "invalid_request": "The request is invalid. Check your input and try again.",
        "malformed_code": "That doesn't look like a device code. Check the code shown on your device.",
        "invalid_code": "The code is invalid, expired or already used by another account. Get a new code on your device.",
        "rate_limited": "Too many attempts. Please try again later.",
        "code_expired": "The code has expired. Get a new code on your device.",
        "already_handled": "This code has already been handled.",
        "flow_conflict": "The request changed. Select Continue again.",
        "session_changed": "Your sign-in session changed. Select Continue again.",
        "ack_required": "Tick the confirmation box first.",
        "client_unavailable": "This app is currently unavailable.",
        "approval_failed": "The authorization could not be completed. Please try again.",
        "temporarily_unavailable": "The service is temporarily unavailable. Please try again later.",
        "unknown": "Network or unknown error. Please try again later."
      }
    }
  }
} as const
