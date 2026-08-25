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
        "qqGate": {
          "title": "Verified QQ binding required",
          "description": "Before adding a game account, bind and verify your QQ number in HarukiBot data authorization.",
          "action": "Go to QQ binding"
        },
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
        "description": "Temporarily grant another Toolbox user access to suite / mysekai / profile data from a verified account.",
        "receivedDescription": "View game account data granted to you by other Toolbox users.",
        "selectedAccount": "Selected account: {account}",
        "noSelectedAccount": "No account selected",
        "ownedTitle": "Data granted from this account",
        "receivedTitle": "Data granted to me",
        "emptyOwned": "No grants for this account",
        "emptyReceived": "No received grants",
        "fallback": "—",
        "yourUserId": "Your Toolbox user ID:",
        "dataType": {
          "suite": "Suite",
          "mysekai": "MySekai",
          "profile": "Profile"
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
          "profileHint": "Profile is live data: every view by the grantee sends a request to the game server through your account."
        },
        "table": {
          "owner": "Owner",
          "grantee": "Grantee",
          "dataType": "Data type",
          "expiresAt": "Expires at",
          "actions": "Actions"
        },
        "validation": {
          "verifiedOnly": "Only verified bound accounts can create data grants",
          "granteeRequired": "Enter a grantee user ID",
          "selfGrant": "You cannot grant access to yourself",
          "dataType": "Only suite, mysekai, and profile are supported",
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
      "openid": "Verify your identity and sign you in with your Haruki account",
      "profile": "See your display name",
      "email": "See your email address",
      "offlineAccess": "Maintain offline access and issue refresh tokens"
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
    }
  }
} as const
