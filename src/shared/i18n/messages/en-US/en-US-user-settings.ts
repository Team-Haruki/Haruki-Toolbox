// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: userSettings, oauth
export default {
  "userSettings": {
    "afdian": {
      "manualGranted": "An administrator has verified your sponsorship. No additional order is needed.",
      "accessBlocked": "An administrator has disabled your sponsor access. Contact an administrator to restore it.",
      "unlinkManualConfirm": "Unlinking Afdian preserves your manually granted sponsor access and saved frame choices.",
      "oauthTab": "OAuth2 authorization",
      "oauthDescription": "Authorize with Afdian to link your account and match your sponsorship history.",
      "methodOAuth": "Verified with OAuth2",
      "methodOrder": "Verified with an order number",
      "upgradeOAuth": "Confirm with OAuth2",
      "order": {
        "tab": "Order number",
        "label": "Afdian order number",
        "placeholder": "Paste the complete Afdian order number",
        "description": "Verify an Afdian order supporting Haruki. Past orders are accepted too.",
        "help": "Open your sponsorship in Afdian’s My Orders and copy its order number. Do not use an Alipay or WeChat transaction number, or share the order number with others.",
        "unavailable": "Order verification is not available yet. Please check back later.",
        "verifyEmail": "Verify your email address in account settings before verifying an order.",
        "submit": "Verify order and link",
        "invalid": "Copy the complete Afdian order number. It must contain digits only.",
        "verified": "Order verified. Supporter frames unlocked.",
        "rejected": "The order could not be verified, or its Afdian account is already linked to another Toolbox account. Check the order and try again.",
        "rateLimited": "Too many verification attempts. Please try again later.",
        "failed": "Could not verify the order right now. Please try again later."
      },
      "title": "Afdian account",
      "description": "Verify with OAuth2 or an order number to link your sponsorship history. Any past sponsorship unlocks supporter frames permanently.",
      "loading": "Loading…",
      "retry": "Retry",
      "loadFailed": "Could not load your binding. Please retry.",
      "actionFailed": "The action could not be completed. Please try again.",
      "bound": "Linked",
      "unbound": "Not linked",
      "permanent": "Frames permanently unlocked",
      "current": "Current supporter",
      "former": "Past supporter",
      "account": "Afdian user ID: {id}",
      "noSponsorship": "No sponsorship record matched yet. If you just sponsored, wait a few minutes and refresh.",
      "unavailable": "Afdian account linking is not available yet. Please check back later.",
      "bind": "Link with Afdian",
      "unlink": "Unlink account",
      "unlinked": "Afdian account unlinked",
      "refresh": "Refresh sponsorship",
      "unlinkConfirm": "The bot will temporarily use the default frame. Relink an Afdian account with sponsorship history to use supporter frames again. Your frame selections are kept.",
      "callbackTitle": "Afdian authorization",
      "callback_loading": "Confirming authorization and linking your account…",
      "callback_success": "Your Afdian account is linked. Sponsorship records are matched automatically.",
      "callback_failed": "Linking failed. Authorization may have expired, your session may have changed, or the Afdian account may already be linked. Return to settings and authorize again."
    },
    "frames": {
      "lockedOrderOnly": "Verify your sponsorship with an Afdian order number in account settings. You can browse all frames and previews first.",
      "enlarge": "Enlarge example",
      "previewOnly": "Preview only",
      "title": "Supporter frames",
      "back": "Account settings",
      "description": "Choose frames for your HarukiBot game profile images. Any past sponsorship grants permanent access. Set a frame for each verified game account.",
      "locked": "Verify sponsorship in settings using OAuth2 or an order number. You can browse all frames and previews first.",
      "accountTitle": "Apply to a game account",
      "accountDescription": "HarukiBot will use the saved frame when displaying this game account.",
      "account": "Game account",
      "unverified": "Unverified",
      "verifyFirst": "Verify that you own this game account before saving a frame.",
      "noAccounts": "No game accounts linked yet. Browse the previews, then link an account.",
      "manageAccounts": "Link and verify game accounts",
      "choose": "Choose a frame",
      "search": "Search frames",
      "default": "Default frame",
      "noResults": "No matching frames",
      "previewTitle": "Preview",
      "previewDescription": "See the frame rendered in an information panel and a game profile image.",
      "example": "Example",
      "panel": "Information panel",
      "profile": "Game profile",
      "previewAlt": "Example game profile with {name}",
      "sampleNotice": "Examples use a fictional name, ID and game data. Your images will show your own game profile. This does not change your frame in the game.",
      "save": "Save for this account",
      "saved": "Frame saved",
      "savedDescription": "Query HarukiBot again in about 15 seconds to see the update.",
      "saveFailed": "Could not save. Check your sponsorship and account verification, then retry.",
      "loadFailed": "Could not load frames. Please retry.",
      "unsaved": "Unsaved selection",
      "applied": "Matches saved settings"
    },
    "common": {
      "actionFailedTitle": "Action failed",
      "missingUserDescription": "Missing user information. Please sign in again.",
      "cancel": "Cancel"
    },
    "officialBotGuide": {
      "title": "Use the official QQ bot",
      "description": "If you use the official QQ bot (the Kanade bot), you also need a separate official-bot authorization: follow the guide to get your user ID (QID) from the bot, then add it under \"Allow other QQ accounts to query my data\" below.",
      "action": "View the official QQ bot authorization guide"
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
      "masterVersion": "Database version",
      "displayVersion": "Current",
      "fetchVersion": "Latest",
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
        "title": "Clear the game database cache?",
        "description": "This will clear the local game database and song-constant data for {region}. Related data must be downloaded again before use.",
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
        "fetching-master": "Downloading game database",
        "fetching-music-metas": "Downloading song-constant data",
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
      "title": "Change email, nickname or password",
      "description": "Use the button below to open the edit page; you will be brought back automatically when done.",
      "redirect": {
        "title": "Taking you to the sign-in service to {target}…",
        "description": "The change is made on the sign-in service's page; you will return to the toolbox automatically afterwards.",
        "destination": "Destination: {host}",
        "unreachableTitle": "The sign-in service cannot be opened right now",
        "unreachableDescription": "The sign-in service did not respond. Check your connection and retry; if it keeps failing the service may be temporarily unavailable.",
        "backToSettings": "Back to account settings",
        "targets": {
          "profile": "change your email or nickname",
          "password": "change your password",
          "mfa": "set up two-step verification",
          "oidc": "manage Google sign-in"
        }
      },
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
      "kratosManagedDescription": "Change email, nickname or password",
      "kratosManagedHint": "Use the button below to open the edit page; you will be brought back automatically when done.",
      "currentEmailLabel": "Current email",
      "currentNicknameLabel": "Current nickname",
      "unsetNickname": "Not set",
      "changeButton": "Manage email & nickname",
      "verifyButton": "Verify email"
    },
    "password": {
      "title": "Password settings",
      "description": "Manage your Haruki Toolbox account password",
      "kratosManagedDescription": "Change your sign-in password",
      "kratosManagedHint": "Use the button below to open the edit page; you will be brought back automatically when done.",
      "changeButton": "Change password"
    },
    "mfa": {
      "title": "Two-step verification",
      "description": "Two-step verification: authenticator app, passkeys and backup recovery codes",
      "hint": "Opens the setup page; you will be brought back automatically when done.",
      "manageButton": "Manage two-step verification"
    },
    "social": {
      "title": "Sign in with Google",
      "description": "Link or unlink your Google account so you can sign in with it.",
      "hint": "Opens the setup page; you will be brought back automatically when done.",
      "manageButton": "Manage Google sign-in"
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
        "loginAt": "Signed in",
        "lastVerified": "Last verified",
        "expiresAt": "Expires at",
        "securityLevel": {
          "label": "Security level",
          "normal": "Standard",
          "twoFactor": "Two-step verification"
        },
        "revokeOne": "Sign out this session",
        "revokeOthers": "Sign out other sessions",
        "revokeOneDialog": {
          "title": "Sign out this device?",
          "description": "This signs out \"{device}\" ({meta}). That device must sign in again; this device is not affected."
        },
        "revokeOthersDialog": {
          "title": "Sign out all other sessions?",
          "description": "This signs out {count} session(s) other than this device; they will all need to sign in again. If you suspect someone else signed in, change your password as well."
        },
        "sessionExpired": "Your sign-in has expired. Please sign in again.",
        "sessionExpiredDescription": "This session has expired or was signed out elsewhere. Sign in again to view and manage sessions.",
        "goLogin": "Sign in",
        "loadFailed": "Failed to load sessions.",
        "revokeFailed": "Failed to sign out this session.",
        "revokeOthersFailed": "Failed to sign out other sessions."
      }
    },
    "imBinding": {
      "title": "Bind my QQ (verify it's you)",
      "description": "Bind and verify your own QQ number so HarukiBot can confirm it is you querying your data.",
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
      "captchaHint": "To prevent abuse, complete the human verification first, then send the email code.",
      "actions": {
        "sendEmailCode": "Send email code",
        "generateCode": "Generate code"
      },
      "dialog": {
        "title": "Social platform verification",
        "qqDescription": "Enter the code from your email to complete binding.",
        "otherDescription": "Send the code below to HarukiBot in a private message on that platform, then come back and click Verify.",
        "qqCodePlaceholder": "Enter email verification code",
        "verifyButton": "Verify"
      },
      "toast": {
        "emailNotVerifiedTitle": "Email not verified",
        "emailNotVerifiedDescription": "Please verify your email before managing social platform bindings.",
        "sendFailedTitle": "Send failed",
        "sendFailedFallback": "The code was not sent. Check the QQ number and retry; if it keeps failing, try again later.",
        "completeCaptchaDescription": "Please complete the human verification first",
        "verificationCodeSentTitle": "Verification code sent",
        "verificationCodeSentDescription": "Please check QQ {account}'s mailbox",
        "generateFailedTitle": "Generation failed",
        "generateFailedFallback": "The code was not generated. Try again later.",
        "incompleteResponseDescription": "Incomplete response data; generate a new code",
        "codeGeneratedTitle": "Verification code generated",
        "missingQQAccountDescription": "Please enter QQ account first",
        "invalidQQAccountDescription": "QQ number must be digits only",
        "invalidQQBotAccountDescription": "The official QQ bot user ID (QID) has the wrong length; copy it in full from the bot's reply",
        "missingAccountDescription": "Please enter the account ID to bind",
        "verifyFailedTitle": "Verification failed",
        "verifyFailedFallback": "Verification did not pass. Check the code and retry; if it expired, send a new one.",
        "inputQQCodeDescription": "Please enter the code from email",
        "verifySuccessTitle": "Verification successful",
        "verifySuccessDefaultDescription": "Binding completed",
        "missingStatusTokenDescription": "Verification timed out. Please generate a new code.",
        "notVerifiedTitle": "Not verified",
        "notVerifiedDescription": "Verification is not completed yet",
        "notVerifiedFallbackDescription": "Please complete verification on the social platform and try again.",
        "unboundSuccessTitle": "Unbound",
        "unboundSuccessDescription": "This social account has been unbound from your account"
      }
    },
    "imAuthorization": {
      "title": "Allow other QQ accounts to query my data",
      "description": "Once added, these QQ numbers or bot users can look up your game data in HarukiBot.",
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
        "allowFastVerificationHint": "When enabled, this user can quickly pass account verification in HarukiBot",
        "qqbotAccountHint": "Official QQ bot user ID (QID): get it from the bot by following the guide and copy it in full from the reply."
      },
      "fastVerificationBadge": "Fast verification",
      "actions": {
        "edit": "Edit",
        "delete": "Delete"
      },
      "dialog": {
        "createTitle": "Add query authorization",
        "editTitle": "Edit query authorization",
        "createDescription": "Enter the QQ number or Discord account that may query your game data.",
        "editDescription": "Change the account, remark or fast-verification setting of this authorization.",
        "bindFirstHint": "Bind your own QQ above first."
      },
      "deleteDialog": {
        "title": "Confirm deletion",
        "description": "Delete {platform} {userId}? This action cannot be undone.",
        "deleting": "Deleting..."
      },
      "toast": {
        "saveFailedTitle": "Save failed",
        "saveFailedFallback": "The authorization was not saved. Check the account and retry; if it keeps failing, try again later.",
        "accountRequiredDescription": "Please enter account",
        "accountQQNumericDescription": "QQ number must be digits only",
        "accountQQBotLengthDescription": "The official QQ bot user ID (QID) has the wrong length; copy it in full from the bot's reply",
        "saveSuccessTitle": "Authorization saved",
        "saveSuccessDescription": "Social authorization info has been updated",
        "deleteSuccessTitle": "Authorization removed",
        "deleteSuccessDescription": "This social authorization has been removed",
        "deleteFailedTitle": "Delete failed",
        "deleteFailedFallback": "The authorization was not removed. Try again later."
      }
    },
    "oauthAuthorizations": {
      "title": "Authorized applications",
      "description": "Review and revoke third-party applications authorized to access your account data.",
      "refresh": "Refresh",
      "emptyTitle": "No authorized applications",
      "emptyDescription": "Third-party applications you authorize to access your account data will appear here.",
      "authorizedAtPrefix": "Authorized at",
      "revokeApp": "Revoke all access for this app",
      "devices": {
        "title": "Authorized devices ({count})",
        "unnamed": "Unnamed device",
        "revoke": "Revoke this device"
      },
      "clientType": {
        "bot": "Bot",
        "website": "Website"
      },
      "deviceDialog": {
        "title": "Revoke this device",
        "description": "Revoke the authorization of the device “{label}” for {clientName}? That device will no longer access your account; the app's other devices and browser authorizations stay as they are."
      },
      "dialog": {
        "title": "Revoke authorization",
        "description": "Revoke all access for {clientName}? The app will no longer access your data.",
        "revoke": "Revoke",
        "revoking": "Revoking...",
        "devicesNote": "This also revokes it on {count} device. | This also revokes it on {count} devices."
      },
      "toast": {
        "fetchFailedTitle": "Failed to load authorization list",
        "fetchFailedFallback": "Check your connection and retry; if it keeps failing the service may be temporarily unavailable.",
        "revokeSuccessTitle": "Authorization revoked",
        "revokeSuccessDescription": "Access for {clientName} has been revoked",
        "revokeFailedTitle": "Revoke failed",
        "revokeFailedFallback": "The authorization is still active. Try again later; if it keeps failing, refresh the list to check its state.",
        "deviceRevokeSuccessTitle": "Device revoked",
        "deviceRevokeSuccessDescription": "“{label}” can no longer access your account",
        "deviceNotFound": "This device's authorization no longer exists; the list was refreshed",
        "deviceRevokeFailedTitle": "Could not revoke the device",
        "deviceRevokeRetry": "The device could not be revoked right now. Try again later."
      }
    },
    "gameBinding": {
      "harukiBotGuide": {
        "title": "Use HarukiBot",
        "description": "To use your game account data with HarukiBot, go to HarukiBot Data Authorization to bind and verify your QQ account.",
        "action": "Bind QQ account"
      },
      "title": "Game account bindings",
      "description": "Manage Project SEKAI accounts bound to your Haruki Toolbox account",
      "alert": {
        "title": "Notice",
        "line1": "A game account on a given server can be bound by only one toolbox user.",
        "line2": "Bindings here are not synced to HarukiBot NEO; to query in the bot, bind separately in your group by following the bot's help."
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
        "verifyHint": "How verification works: you put a short code into your in-game profile signature, and the toolbox reads your public profile to confirm the account is yours. You can change the signature back afterwards.",
        "uidHint": "The number under your ID in the in-game Profile screen.",
        "basicInfoTitle": "Basic account info",
        "serverPlaceholder": "Select server",
        "verifyButton": "Verify",
        "fields": {
          "server": "Server",
          "userId": "Game UID",
          "verificationStatus": "Verification"
        },
        "suite": {
          "title": "Account data (Suite)",
          "description": "Sharing settings for account data (Suite): which bots may read the data you upload."
        },
        "mysekai": {
          "title": "MySekai data",
          "description": "Sharing settings for MySekai data: which bots may read the data you upload."
        }
      },
      "validation": {
        "uidRequired": "Enter your game UID",
        "uidChangedReverify": "The game UID changed; please verify again"
      },
      "deleteDialog": {
        "title": "Confirm deletion",
        "description": "Delete game UID {userId} on {server}? This action cannot be undone."
      },
      "verifyDialog": {
        "title": "Verification code generated",
        "description": "Follow the steps below to put the code into your in-game profile signature; the toolbox reads your public profile to confirm the account is yours.",
        "codeLabel": "Verification code",
        "copyButton": "Copy code",
        "steps": {
          "copy": "Click \"Copy code\" above.",
          "paste": "Open the game → Profile → edit the signature, paste the whole code (including the slashes) and save.",
          "returnHome": "Go back to the game's home screen and make sure the signature was saved.",
          "save": "Return here, close this window and click Save to finish verification."
        },
        "afterwards": "Once verified you can change the signature back.",
        "confirmButton": "Done, close this window"
      },
      "permissions": {
        "sharedHint": "Only needed if you use that bot.",
        "suite": {
          "allowPublicApi": {
            "title": "Allow public lookups by other sites/bots",
            "description": "When on, anyone who knows your UID can view your uploaded account data through the toolbox API."
          },
          "allowSakura": {
            "title": "Sync to SakuraBot (QQ group bot)",
            "description": "Sync account data to SakuraBot. Only needed if you use that bot."
          },
          "allow8823": {
            "title": "Sync to Kaosen Bot (QQ group bot)",
            "description": "Sync account data to Kaosen Bot. Only needed if you use that bot."
          },
          "allowResona": {
            "title": "Sync to ResonaBot (QQ group bot)",
            "description": "Sync account data to ResonaBot. Only needed if you use that bot."
          },
          "allowLuna": {
            "title": "Sync to LunaBot (QQ group bot)",
            "description": "Sync account data to LunaBot. Only needed if you use that bot."
          }
        },
        "mysekai": {
          "allowPublicApi": {
            "title": "Allow public lookups by other sites/bots",
            "description": "When on, anyone who knows your UID can view your uploaded MySekai data through the toolbox API."
          },
          "allowFixtureApi": {
            "title": "Join fixture sharing",
            "description": "When on, your UID appears in the MySekai fixture-sharing list and other players can visit your MySekai."
          },
          "allow8823": {
            "title": "Sync to Kaosen Bot (QQ group bot)",
            "description": "Sync MySekai data to Kaosen Bot. Only needed if you use that bot."
          },
          "allowResona": {
            "title": "Sync to ResonaBot (QQ group bot)",
            "description": "Sync MySekai data to ResonaBot. Only needed if you use that bot."
          },
          "allowLuna": {
            "title": "Sync to LunaBot (QQ group bot)",
            "description": "Sync MySekai data to LunaBot. Only needed if you use that bot."
          }
        }
      },
      "grants": {
        "title": "Game account data grants",
        "description": "Let another toolbox user view this account's data for a limited time, or upload data on your behalf.",
        "dataTypesExplainer": "Data types: account data (Suite) / MySekai data / profile.",
        "receivedDescription": "View game account data granted to you by other toolbox users.",
        "selectedAccount": "Selected account: {account}",
        "noSelectedAccount": "No account selected",
        "ownedTitle": "Data granted from this account",
        "receivedTitle": "Data granted to me",
        "receivedHint": "Received grants can only be used, not re-granted or edited; ask the owner for changes.",
        "receivedUseHint": "Available in the account selector on each feature page.",
        "ownerFallback": "Toolbox user {id}",
        "emptyOwned": "No grants for this account",
        "emptyReceived": "No received grants",
        "editingBadge": "Editing",
        "fallback": "—",
        "yourUserId": "Your toolbox user ID:",
        "dataType": {
          "suite": "Account data",
          "mysekai": "MySekai data",
          "profile": "Profile"
        },
        "permission": {
          "read": "Allow reading",
          "write": "Allow uploads (on my behalf)",
          "readOnly": "Read only",
          "writeOnly": "Write only",
          "readWrite": "Read & write"
        },
        "actions": {
          "refresh": "Refresh",
          "save": "Save grant",
          "saveChanges": "Save changes",
          "cancelEdit": "Cancel editing",
          "edit": "Edit grant",
          "revoke": "Revoke grant"
        },
        "form": {
          "title": "New grant",
          "editTitle": "Editing grant: {grantee} / {dataType}",
          "targetAccount": "Target account: {account} (everything the grantee reads or uploads is this account's data)",
          "lockedWhileEditing": "The grantee and data type cannot change while editing; to grant someone else or another type, cancel editing and add a new grant.",
          "granteeUserId": "Grantee toolbox user ID",
          "granteeUserIdPlaceholder": "For example 1234567890",
          "dataType": "Data type",
          "expiresAt": "Expires at",
          "expiresAtHelp": "Must be a future time. Permanent grants are not available.",
          "profileHint": "Profile is a live lookup: every view by the grantee fetches from the game server through your account.",
          "permissions": "Permissions",
          "writeHint": "\"Allow uploads\" lets the grantee upload and update this account's data. It does not include reading existing data, changing bindings or privacy settings, or re-granting.",
          "profileReadOnlyHint": "Profile grants are read-only.",
          "writeTargetNotice": "Uploads by the grantee will directly update {dataType} for {account}. Double-check the server and game account.",
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
        "revokeDialog": {
          "title": "Revoke data grant",
          "description": "This revokes {grantee}'s \"{dataType}\" grant ({permissions}) for {account}. They lose access immediately; you can grant it again later.",
          "confirm": "Revoke grant"
        },
        "validation": {
          "verifiedOnly": "Only verified bound accounts can create data grants",
          "granteeRequired": "Enter a grantee user ID",
          "selfGrant": "You cannot grant access to yourself",
          "dataType": "Only account data, MySekai data and profile are supported",
          "permissionRequired": "Tick at least one permission; use \"Revoke grant\" in the list to remove a grant",
          "profileReadOnly": "Profile does not support upload permission",
          "expiryRequired": "Pick an expiry time",
          "futureExpiry": "Expiry must be a future time"
        },
        "toast": {
          "loadFailedTitle": "Failed to load data grants",
          "saveFailedTitle": "Failed to save data grant",
          "saveFailedFallback": "The grant was not saved. Check the grantee user ID and expiry time and retry.",
          "deleteFailedTitle": "Failed to revoke data grant",
          "saved": "Data grant saved",
          "updated": "Data grant updated",
          "deleted": "Data grant revoked"
        }
      },
      "toast": {
        "setDefaultSuccessTitle": "Default account updated",
        "setDefaultSuccessDescription": "Feature pages will select this account by default",
        "setDefaultFailedTitle": "Failed to set default account",
        "setDefaultFailedFallback": "The default account was not changed. Try again later.",
        "deleteSuccessTitle": "Deleted",
        "deleteSuccessDescription": "Account binding has been removed",
        "deleteFailedTitle": "Delete failed",
        "saveSuccessTitle": "Saved",
        "saveSuccessDescription": "Account settings have been updated",
        "saveFailedTitle": "Save failed",
        "saveFailedFallback": "The account settings were not saved. Try again later; when adding an account, make sure the code is in your in-game signature.",
        "verifyBeforeCreateDescription": "Before adding a new account, click Verify to generate a code and complete setup in game.",
        "uidMustBeNumericDescription": "Game UID must be numeric only",
        "generateCodeFailedTitle": "Unable to generate verification code",
        "generateCodeFailedFallback": "Check the server and game UID and retry; if it keeps failing, try again later.",
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
      "offlineAccess": "Keep using the permissions above while you are offline",
      "unknown": "Other permission ({scope})"
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
      "invalidDescription": "This authorization link has expired or is incomplete. Go back to the app that started it and click \"Sign in\" again.",
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
      "groups": {
        "read": "Read",
        "write": "Upload / submit",
        "other": "Other"
      },
      "writeWarning": "This authorization includes upload or submit permissions: the app will be able to submit data as you. Only allow it if you trust this app.",
      "accountLine": "Authorizing as {name}",
      "switchAccount": "Switch account",
      "switchAccountHint": "Switching account signs you out and restarts this authorization from the app.",
      "switchAccountRejectDescription": "The user chose to switch account; start the sign-in again.",
      "subjectMismatchTitle": "This authorization request belongs to another account",
      "subjectMismatchDescription": "This authorization request was started by a different account. Start the sign-in again from the app, or switch to the account that started it.",
      "returnHint": "After authorizing you will be sent back to {app}.",
      "noScopesRequested": "This app did not request any additional scopes.",
      "revokeHint": "You can revoke it any time under Account settings → Authorized apps.",
      "reject": "Reject",
      "authorize": "Authorize",
      "authorizing": "Authorizing...",
      "rejectDescription": "You declined this authorization.",
      "invalidTitle": "Invalid authorization request",
      "invalidDescription": "This authorization link has expired or is incomplete. Go back to the app that started it and click \"Sign in\" again.",
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
      "invalidDescription": "This sign-out link has expired or is incomplete. Go back to the app that started it and try again.",
      "localDescription": "Confirming signs the current account out of this site.",
      "localSignedOutDescription": "You are not signed in right now.",
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
