// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: tools, botNeo, sekaiStation
export default {
  "tools": {
    "clientConfigGenerator": {
      "title": "Haruki Client config generator",
      "lead": "Built in your browser; the credential is never uploaded",
      "summary": {
        "modules": "Modules",
        "admins": "Admins",
        "scopes": "Scopes",
        "allModules": "All"
      },
      "sections": {
        "basics": {
          "title": "Bot and listener",
          "register": "No Bot ID? Register"
        },
        "behaviour": {
          "title": "Replies"
        },
        "modules": {
          "title": "Modules and feature scopes"
        },
        "access": {
          "title": "Access lists"
        },
        "advanced": {
          "title": "Advanced options",
          "description": "Usually left at the defaults",
          "changed": "{count} changed"
        },
        "routing": {
          "title": "Network routing"
        },
        "security": {
          "title": "Keys and local security"
        },
        "rateLimit": {
          "title": "Global command limit"
        },
        "birthday": {
          "title": "Birthday material delivery"
        }
      },
      "fields": {
        "host": {
          "label": "Listen host",
          "placeholder": "127.0.0.1"
        },
        "port": {
          "label": "OneBot port",
          "invalid": "Enter a whole number from 1 to 65535"
        },
        "controlApiPort": {
          "label": "Control API port",
          "invalid": "Enter a whole number from 0 to 65535"
        },
        "botId": {
          "label": "Bot ID",
          "placeholder": "From registration flow"
        },
        "credential": {
          "label": "Credential",
          "placeholder": "Paste Haruki Client credential"
        },
        "noiseServerPubkey": {
          "label": "Noise server public key",
          "placeholder": "Leave empty to use the built-in public key"
        },
        "noiseServerKeyId": {
          "label": "Noise public key ID",
          "placeholder": "Leave empty when using the built-in key"
        },
        "trustRootPubkey": {
          "label": "Trust-root Ed25519 public key",
          "placeholder": "Leave empty to use the built-in root key"
        },
        "controlApiAccessToken": {
          "label": "Control API access token",
          "help": "When on, the control API requires a Bearer token",
          "placeholder": "Local control API token"
        },
        "serverEndpointOverride": {
          "label": "Pinned server endpoint",
          "placeholder": "Leave empty unless the group announces one"
        },
        "routingConfigURL": {
          "label": "Routing config URL",
          "placeholder": "Leave empty to use the built-in routing-v3.json URL"
        },
        "enableDynamicRouting": {
          "label": "Enable dynamic routing",
          "help": "Off: only the built-in endpoint and keyset-approved endpoints are used"
        },
        "runMode": {
          "label": "Run mode",
          "placeholder": "Select run mode",
          "help": "Blacklist: answer everywhere except groups on the group blacklist. Whitelist: answer only in groups on the group whitelist."
        },
        "helpContent": {
          "label": "Custom help content",
          "placeholder": "Leave empty to use default help content"
        },
        "enableGroupCommandLimit": {
          "label": "Enable global command limit",
          "help": "Counts successful calls across all groups. 0 means unlimited."
        },
        "globalCommandHourlyLimit": {
          "label": "Hourly limit"
        },
        "globalCommandDailyLimit": {
          "label": "Daily limit"
        },
        "mysekaiBirthdayMonitorMode": {
          "label": "Birthday material delivery mode",
          "placeholder": "Select list mode"
        },
        "mysekaiBirthdayMonitorBlacklist": {
          "label": "Birthday delivery group blacklist",
          "placeholder": "One group ID per line or comma-separated"
        },
        "mysekaiBirthdayMonitorWhitelist": {
          "label": "Birthday delivery group whitelist",
          "placeholder": "One group ID per line or comma-separated"
        },
        "enableModules": {
          "label": "Enabled modules"
        },
        "featurePolicyModes": {
          "label": "Feature policy modes",
          "hint": "Give single features a different list mode than the run mode"
        },
        "blacklists": {
          "label": "Group blacklists"
        },
        "whitelists": {
          "label": "Group whitelists"
        },
        "userBlacklists": {
          "label": "User blacklists"
        },
        "botAdmins": {
          "label": "Bot admin QQ IDs",
          "help": "Admins can use Haruki Client control commands in groups"
        }
      },
      "toggles": {
        "enableHelp": {
          "label": "Help command"
        },
        "enableCN": {
          "label": "CN features"
        },
        "enablePrivateMessage": {
          "label": "Reply to private chats",
          "description": "Private chats bypass group lists but still obey user blacklists and rate limits"
        },
        "enableReplyMessage": {
          "label": "Quote replies"
        },
        "sendBase64Image": {
          "label": "Base64 images",
          "description": "Fetch Cloud images on the client and send them to OneBot as base64"
        },
        "mysekaiBirthdayMonitorNotifyEmpty": {
          "label": "Birthday empty notice",
          "description": "Notify when a MySekai birthday material monitor has no matches"
        },
        "enableParamEcho": {
          "label": "Parameter echo",
          "description": "Allow Cloud parse errors to echo concrete parameters"
        },
        "strictConfigPermissions": {
          "label": "Enforce config permissions",
          "help": "Refuses to start when configs.yaml is group/world-readable. Needs mode 0600."
        }
      },
      "actions": {
        "addModule": "Add module",
        "addFeaturePolicy": "Add policy",
        "addAccessRow": "Add",
        "addBotAdmin": "Add admin",
        "removeRow": "Remove row",
        "copy": "Copy YAML",
        "download": "Download configs.yaml",
        "reset": "Reset",
        "viewOutput": "View file"
      },
      "resetDialog": {
        "title": "Reset to the default config?",
        "description": "Everything you entered is cleared, including the credential"
      },
      "moduleSelector": {
        "allModules": "All modules",
        "moduleOption": "Module: {value}",
        "placeholder": "Select module"
      },
      "policyEditor": {
        "scopePlaceholder": "Select feature",
        "modePlaceholder": "Select mode"
      },
      "accessEditor": {
        "scopePlaceholder": "Select global, module, or feature",
        "globalGroup": "Global",
        "moduleGroup": "Modules",
        "featureGroup": "Features",
        "globalScope": "Global: all",
        "moduleScope": "Module: {value}",
        "featureScope": "Feature: {value}",
        "groupIdLabel": "Group ID",
        "userIdLabel": "User QQ",
        "botAdminPlaceholder": "Admin QQ"
      },
      "runMode": {
        "blacklist": "Blacklist mode",
        "whitelist": "Whitelist mode"
      },
      "routingState": {
        "dynamic": "Dynamic routing enabled",
        "pinned": "Server endpoint pinned",
        "builtIn": "Using built-in routing"
      },
      "output": {
        "title": "configs.yaml",
        "codeLabel": "Contents of configs.yaml",
        "missing": {
          "both": "Bot ID and credential missing; can't connect yet",
          "botId": "Bot ID missing; can't connect yet",
          "credential": "Credential missing; can't connect yet"
        }
      },
      "prefill": {
        "tag": "Filled from registration",
        "owner": "Registered with QQ {value}; not written to configs.yaml"
      },
      "toast": {
        "reset": "Reset to defaults",
        "copySuccess": "configs.yaml copied to clipboard",
        "copyFailed": "Copy failed. Check browser clipboard permission.",
        "downloadSuccess": "configs.yaml download started"
      }
    },
    "iosModules": {
      "title": "iOS module (iPhone / iPad)",
      "description": "Install it in Shadowrocket, Surge or a similar app; your data uploads whenever you open the game",
      "tutorialAlert": {
        "action": "Illustrated guide",
        "nonZhWarning": "Please note that this tutorial is only available in Simplified Chinese"
      },
      "qxScriptWarning": "Quantumult X does not support script upload mode",
      "cnRestriction": "Due to legal restrictions, CN MySekai uploads are not provided",
      "installButton": "Quick Install Module",
      "copyAction": "Copy {label}",
      "copyLabel": {
        "uploadCode": "upload code",
        "moduleUrl": "module URL",
        "scriptUrl": "script URL"
      },
      "steps": {
        "configure": {
          "title": "Proxy app and upload mode"
        },
        "scope": {
          "title": "What to upload"
        },
        "code": {
          "title": "Upload code"
        },
        "install": {
          "title": "Install the module",
          "prerequisite": "You need to be signed in with a bound game account first",
          "after": "After installing, open the game and reach the home screen once; once it worked, the account bar on the Toolbox home page shows the upload time"
        }
      },
      "sections": {
        "software": {
          "title": "Select app",
          "placeholder": "Select app"
        },
        "endpoint": {
          "title": "Server route",
          "description": "Outside mainland China, CDN may be smoother",
          "placeholder": "Select route"
        },
        "mode": {
          "title": "Select upload mode",
          "placeholder": "Select upload mode"
        },
        "chunk": {
          "title": "Chunk size",
          "description": "Larger enters the game faster, but some proxy apps may fail to upload",
          "unit": "MB"
        },
        "notify": {
          "title": "Upload notifications",
          "description": "You can also switch it later in the module's arguments in the proxy app",
          "descriptionQx": "Quantumult X has no module arguments: to change it later, change it here and reinstall the module"
        },
        "regions": {
          "title": "Select regions"
        },
        "dataTypes": {
          "title": "Select data types"
        }
      },
      "uploadCode": {
        "title": "Upload Code",
        "description": "Regenerate it if it leaks",
        "regenerate": "Regenerate",
        "generate": "Generate Upload Code",
        "loginRequired": "Sign in required",
        "loginAction": "Sign in",
        "regenerateDialog": {
          "title": "Regenerate the upload code?",
          "description": "The old code stops working immediately; any installed module must be reinstalled with the new URL to keep uploading",
          "confirm": "Regenerate"
        }
      },
      "generatedUrls": {
        "title": "Manual install",
        "description": "If quick install does not open your proxy app, add these URLs in the app by hand",
        "moduleUrl": "Module URL",
        "scriptUrl": "Script URL"
      },
      "software": {
        "surge": "Surge",
        "shadowrocket": "Shadowrocket",
        "loon": "Loon",
        "qx": "Quantumult X",
        "stash": "Stash"
      },
      "endpointOptions": {
        "direct": "Direct",
        "cdn": "CDN"
      },
      "modeOptions": {
        "proxy": "Proxy upload",
        "script": "Script upload"
      },
      "modeHints": {
        "proxy": "More stable, but only one Toolbox module at a time. Pick this if unsure.",
        "script": "Runs alongside other bots' modules, but is occasionally unstable. Do not use it with Shadowrocket."
      },
      "advanced": {
        "title": "Advanced options",
        "notifyOn": "Notifications on",
        "notifyOff": "Notifications off"
      },
      "region": {
        "jp": "JP",
        "en": "Global",
        "tw": "TW",
        "kr": "KR",
        "cn": "CN"
      },
      "dataTypes": {
        "suite": {
          "label": "Account data (Suite)"
        },
        "mysekai": {
          "label": "MySekai data"
        },
        "mysekai_force": {
          "label": "MySekai data (upload on every visit)"
        },
        "mysekai_birthday_party": {
          "label": "MySekai Birthday Party"
        }
      },
      "toast": {
        "loginRequired": "Please sign in first",
        "generateCodeSuccess": "Upload code generated",
        "generateCodeFailedTitle": "Failed to generate upload code",
        "generateCodeFailedFallback": "Make sure you are signed in, then try again later",
        "copyEmpty": "Nothing to copy",
        "clipboardUnsupported": "Clipboard is not supported in this environment",
        "copySuccess": "{label} copied to clipboard",
        "copyFailed": "Failed to copy to clipboard. Check browser permissions.",
        "qxScriptFallback": "Quantumult X does not support script mode. Switched to proxy mode.",
        "unsupportedClient": "Unsupported client",
        "installUnsupported": "Quick install is not supported in this environment",
        "installNeedsIos": "Quick install needs this page open on an iPhone or iPad; on a computer, copy the module URL and add it by hand"
      }
    },
    "uploadData": {
      "groupTitle": "Haruki Playground QQ Groups",
      "group1Label": "Group 1",
      "group2Label": "Group 2",
      "intro": {
        "title": "Upload data",
        "description": "Sync your game account data to the Toolbox for the card, event record and deck tools"
      },
      "methods": {
        "label": "Choose an upload method",
        "tags": {
          "recommended": "Recommended",
          "fallback": "Fallback",
          "advanced": "Advanced"
        },
        "ios": {
          "name": "iOS module",
          "platform": "iPhone / iPad"
        },
        "proxy": {
          "name": "HarukiProxy",
          "platform": "Android / Windows"
        },
        "inherit": {
          "name": "Transfer code",
          "platform": "When neither of those works"
        },
        "file": {
          "name": "File upload",
          "platform": "When you already have a data file"
        }
      },
      "help": {
        "title": "Need help?",
        "description": "Usage questions go to the QQ groups; bugs and account problems to a ticket",
        "ticket": "Open a ticket"
      },
      "proxyTab": {
        "upgradeWarning": {
          "title": "HarukiProxy v1/v2 no longer upload",
          "deadline": "They stopped uploading on 1 Nov 2026 at 00:00 (UTC+8).",
          "upgrade": "Please update to v3."
        },
        "title": "HarukiProxy (Android / PC)",
        "description": "Your data uploads to the Toolbox whenever you open the game",
        "guideIndex": "Guide index",
        "stepTitles": {
          "install": "Download and install HarukiProxy v3",
          "bind": "Bind your game account",
          "connect": "Connect Haruki Toolbox",
          "run": "Start capturing, then open the game once"
        },
        "steps": {
          "install": "Download the build for your device and follow its guide",
          "bind": "The account must be verified",
          "connect": "In HarukiProxy's settings, choose “Connect Haruki Toolbox”, then sign in and authorize in the page it opens",
          "run": "Pick the game in HarukiProxy and start capturing, then reach the game's home screen once. Once it worked, the account bar on the Toolbox home page shows the upload time."
        },
        "devices": {
          "android": {
            "name": "Android phone / tablet",
            "note": "Without root, use VPhoneOS; the no-root method may no longer work on newer Android versions",
            "download": "Download APK"
          },
          "windows": {
            "name": "Windows PC",
            "note": "x64, with MuMu Player or a connected Android device",
            "download": "Download for Windows"
          },
          "mac": {
            "name": "Mac",
            "note": "Apple silicon, macOS 12 or later, with MuMu Player Pro",
            "download": "Download for macOS"
          }
        },
        "guides": {
          "vphone": "VPhoneOS guide",
          "noRoot": "No-root guide",
          "pc": "PC guide",
          "macNotes": "What differs on Mac"
        },
        "version": "Current version: HarukiProxy {version}.",
        "changelog": "See the changelog",
        "limits": "HarukiProxy cannot capture MySekai data from the CN server",
        "bindAction": "Game account management"
      },
      "region": {
        "jp": "JP",
        "en": "Global",
        "tw": "TW",
        "kr": "KR",
        "cn": "CN"
      },
      "dataTypes": {
        "suite": "Account data (Suite)",
        "mysekai": "MySekai data"
      },
      "disabledReason": {
        "loginRequired": "Please sign in to use this feature",
        "noBoundAccount": "No bound accounts found. Please bind an account first.",
        "noWritableAccount": "No account can be uploaded to yet: verify yours under Game account bindings, or ask the owner to grant you upload access"
      },
      "uploadStatus": {
        "uploading": "Uploading your {dataType} data...",
        "success": "Upload successful",
        "failed": "Upload failed"
      },
      "toast": {
        "selectAccount": "Please select an account you can upload to",
        "selectFile": "Please select a file",
        "dataTypeNotWritable": "The selected account has no upload permission for this data type",
        "uploadForbiddenTitle": "Not allowed to upload to this account",
        "uploadForbiddenDescription": "The grant may no longer be valid; the list of upload targets was reloaded",
        "operationForbiddenTitle": "Submission forbidden",
        "operationForbiddenDescription": "This action is not allowed due to legal restrictions",
        "uploadSuccessTitle": "Upload successful",
        "uploadFailedTitle": "Upload failed",
        "uploadFailedFallback": "Check the file and account and retry; if it keeps failing, open a ticket",
        "inheritIdRequired": "Enter the transfer ID",
        "inheritPasswordRequired": "Enter the transfer password",
        "inheritIdInvalidDescription": "The transfer ID must be 16 letters and digits (case-sensitive)"
      },
      "fileTab": {
        "title": "Manual file upload",
        "description": "Upload a data file saved by HarukiProxy or the iOS module; normally they upload on their own",
        "unavailableTitle": "Unavailable",
        "loginRequiredTitle": "Sign in required",
        "forbiddenTitle": "Operation forbidden",
        "forbiddenDescription": "This action is not allowed due to legal restrictions",
        "fields": {
          "file": "Upload file",
          "chooseFile": "Choose file",
          "noFile": "No file selected",
          "dropActive": "Release to pick this file",
          "account": "Select account (region / UID)",
          "accountPlaceholder": "Select an account you can upload to",
          "dataType": "Select data type",
          "dataTypePlaceholder": "Select data type"
        },
        "actions": {
          "goLogin": "Sign in",
          "goBind": "Bind an account"
        },
        "refreshTargets": "Refresh accounts",
        "targetsLoading": "Loading upload targets...",
        "targetsFailedTitle": "Could not load upload targets",
        "targetsFailedDescription": "Showing your own verified accounts; accounts granted by others appear after a refresh",
        "accountNotWritable": "This account cannot be uploaded to yet: it is unverified, or its owner has not allowed you to upload for them",
        "unavailableChip": "Unavailable",
        "someAccountsUnavailable": "Greyed-out accounts are unverified, or their owner has not allowed you to upload",
        "grantedTargetNotice": "This account was granted to you by another user; uploads update their data in the Toolbox",
        "dataTypeLimited": "Only some data types can be uploaded to this account",
        "submit": "Submit",
        "submitting": "Submitting..."
      },
      "inheritTab": {
        "title": "Transfer-code data upload",
        "steps": {
          "prep": {
            "title": "Before you start"
          },
          "target": {
            "title": "Choose the server and data"
          },
          "code": {
            "title": "Enter the transfer code",
            "description": "Find it in the game's transfer settings"
          },
          "newPassword": {
            "title": "Password for the new transfer code"
          }
        },
        "submitHint": "Only reads the account; the transfer code is not used",
        "paste": {
          "label": "Transfer information",
          "or": "or",
          "overrides": "The pasted information is used; the separate transfer ID and password are ignored",
          "placeholder": "Paste the full transfer information copied in game (JP or Global)",
          "invalid": "Could not identify a complete transfer ID and password. Paste the full text copied from the game, keeping its field labels and line breaks."
        },
        "loginRequired": {
          "title": "Sign in to Haruki Toolbox first",
          "description": "Transfer-code uploads need you to be signed in to this website",
          "action": "Sign in"
        },
        "fields": {
          "inheritId": "Transfer ID",
          "inheritIdPlaceholder": "Enter transfer ID",
          "inheritPassword": "Transfer password",
          "inheritPasswordPlaceholder": "Transfer password from the game",
          "server": "Select region",
          "serverPlaceholder": "Select region",
          "dataType": "Select data type",
          "dataTypePlaceholder": "Select data type"
        },
        "prep": {
          "bind": "Bind this game account under Game account bindings first; otherwise the data is not saved, even if the upload reports success.",
          "bindLink": "Bind account",
          "platformLink": "Link the account to Game Center (iOS) or Google Play Games (Android) in game first (JP can also link Apple or Google), so it is not lost if a transfer code expires or is used up",
          "mysekaiQQ": "Uploading MySekai data needs a verified QQ under HarukiBot data authorization.",
          "mysekaiQQLink": "Verify QQ"
        },
        "newPassword": {
          "label": "Password of the new transfer code",
          "reuse": "Keep this password",
          "random": "Generate a random one",
          "randomHint": "A random password of 12 letters and digits",
          "reuseBlocked": "The transfer password must be 8–16 half-width letters or digits without spaces",
          "tooLong": "The transfer password is too long"
        },
        "alerts": {
          "notesTitle": "Learn more: how it works, what is stored, and the risk",
          "warning1": {
            "title": "After the transfer, your device is signed out",
            "description": "You then restore the account to your device with the new transfer code the Toolbox issues"
          },
          "flow": {
            "title": "Steps",
            "step1": "First the account is only looked up (the code is not used); check the nickname and rank. Transfer codes are valid for 24 hours and work once.",
            "step2": "Once the details look right, confirm with your Haruki Toolbox sign-in password (accounts that sign in with Google, Apple or a passkey use a vault PIN instead). Only then does the transfer run. Until then you can cancel and the code stays valid.",
            "step3": "Right after the transfer a new transfer code is issued and shown on this page, and stored encrypted in the transfer-code vault below, where you can see it again for 24 hours.",
            "step4": "Finally the game data is fetched and saved. Even if this step fails, the new code is kept."
          },
          "storage": {
            "title": "What we store",
            "text": "The code you enter is only used for this transfer and is not stored. After the transfer, the game account's sign-in info (at most 7 days, used to re-issue codes) and the new code (24 hours) are stored encrypted; only your Haruki Toolbox sign-in password or vault PIN opens them, and staff cannot read them. You can delete them at any time in the vault below."
          },
          "risk": {
            "title": "Risk",
            "text": "This feature signs in by imitating the game client with your transfer code. The publisher could in theory treat that as an unusual login; judge the risk yourself, and prefer HarukiProxy or the iOS module if unsure."
          }
        },
        "submit": "Look up account",
        "submitting": "Reading account info…",
        "toast": {
          "readFailedTitle": "Could not read the account"
        }
      },
      "inheritJob": {
        "title": "Transfer progress",
        "phases": {
          "label": "Transfer progress overview",
          "read": "Read account",
          "confirm": "Your confirmation",
          "transfer": "Transfer",
          "data": "Save data",
          "status": {
            "pending": "not started",
            "running": "in progress",
            "done": "done",
            "failed": "failed",
            "stopped": "stopped"
          }
        },
        "summary": "{server} · {dataType}",
        "status": {
          "running": "Running",
          "awaiting_confirm": "Waiting for you",
          "succeeded": "Done",
          "failed": "Failed",
          "cancelled": "Cancelled",
          "expired": "Expired"
        },
        "connection": {
          "connecting": "Connecting",
          "live": "Live",
          "reconnecting": "Reconnecting",
          "polling": "Refreshing",
          "closed": "Ended"
        },
        "steps": {
          "bootstrap": "Connect to the game server",
          "preview": "Read account info",
          "awaiting_confirm": "Wait for your confirmation",
          "execute": "Execute transfer",
          "vault_store_credential": "Store the sign-in info in the vault",
          "login": "Sign in to the game",
          "issue_new_code": "Issue a new transfer code",
          "vault_store_code": "Store the new code in the vault",
          "fetch_suite": "Fetch account data",
          "fetch_mysekai": "Fetch MySekai data",
          "upload": "Save data",
          "done": "Done"
        },
        "substeps": {
          "cookies": "Preparing the connection",
          "version": "Get game version",
          "inherit_check": "Look up the account (code not used)",
          "inherit_execute": "Execute transfer",
          "auth": "Sign in",
          "issue_code": "Issue transfer code",
          "suite": "Account data",
          "suite_followup": "Syncing remaining data",
          "home_refresh": "Syncing the home screen",
          "home_refresh_final": "Finishing the sync",
          "maintenance_check": "Checking the game is available",
          "mysekai": "MySekai data",
          "mysekai_followup": "Syncing remaining MySekai data",
          "version_refresh": "Refresh game version"
        },
        "stepStatus": {
          "pending": "Pending",
          "running": "Running",
          "done": "Done",
          "failed": "Failed",
          "skipped": "Skipped",
          "warning": "Partly failed",
          "unknown": "Outcome unknown"
        },
        "consumesCode": "The transfer code is used from here on",
        "unreached": {
          "show": "{count} more step did not run; show it | {count} more steps did not run; show them",
          "hide": "Hide the {count} step that did not run | Hide the {count} steps that did not run"
        },
        "announce": {
          "created": "Reading the account; progress is shown below",
          "awaiting_confirm": "Account details loaded; check them and confirm",
          "new_code": "Your new transfer code is ready; write it down"
        },
        "resumeFailed": {
          "title": "A transfer may be in progress, but it cannot be reached right now",
          "description": "{reason} Its progress shows again once the connection is back; you can also submit again and the Toolbox reattaches to the running transfer",
          "retry": "Retry"
        },
        "codeValidity": {
          "valid": "The code you entered was not used and is still valid",
          "used": "The code you entered has been used and cannot be used again",
          "unknown": "It is unclear whether the code you entered was used. Do not use it on another device for now, and check the vault below."
        },
        "errorTitle": "Transfer not completed",
        "issueFailedTitle": "No new transfer code was issued",
        "cancelledTitle": "Cancelled",
        "succeededTitle": "Upload complete",
        "succeededDescription": "The account data has been saved",
        "expired": "The progress record of this transfer has expired (it is kept for 1 hour). The new code can still be viewed in the vault below.",
        "errors": {
          "inherit_invalid": "The transfer code is invalid, already used or expired. Generate a new code in the game and try again.",
          "inherit_restricted": "The game does not allow transfers for this account right now. Nothing was transferred and your code is still valid.",
          "transfer_restricted": "This account has no transfers left during the current event. Nothing was transferred and your code is still valid.",
          "confirm_timeout": "Not confirmed within 5 minutes, so it was cancelled. Nothing was transferred; your code is still valid and you can submit it again.",
          "cancelled": "Cancelled; nothing was transferred",
          "game_degraded": "The game server is unstable at the moment; nothing was transferred. Please try again later.",
          "server_busy": "Too many people are using this right now; nothing was transferred. Please try again later.",
          "game_maintenance": "The game server is under maintenance. Please try again after it ends.",
          "game_unavailable": "The game server cannot be reached right now. Please try again later.",
          "game_error": "The game server returned an error. Please try again later.",
          "game_version_outdated": "The game just updated its data version and Toolbox has not caught up yet. Please try again later.",
          "game_version_outdated_after_transfer": "The game just updated its data version and Toolbox has not caught up yet, so the game data could not be fetched. The new code (if one was issued) is shown on this page; you can upload again later with it.",
          "execute_uncertain": "The connection dropped during the transfer, so it is unclear whether your code was used. Do not use this code on another device for now, and check the vault below: if this account shows up there, the transfer went through and you can view or re-issue the code there.",
          "login_failed": "The transfer went through and the sign-in info is in the vault, but signing in to the game failed. Later, press “Re-issue” in the vault below to get a new transfer code.",
          "fetch_failed": "Fetching the game data failed. The new code (if one was issued) is shown on this page and kept in the vault.",
          "mysekai_unavailable": "Fetching MySekai data failed; the MySekai tutorial may not be finished. The new code (if one was issued) is shown on this page and kept in the vault.",
          "upload_failed": "Saving the data failed. The new code (if one was issued) is shown on this page and kept in the vault.",
          "upload_forbidden": "This game account is bound to another Haruki Toolbox user, so it cannot be uploaded. The new code (if one was issued) is shown on this page and kept in the vault.",
          "job_interrupted": "The server restarted and this transfer was interrupted",
          "internal_error": "Something went wrong on the server and this transfer did not finish"
        },
        "warnings": {
          "issue_code_failed": "No new transfer code was issued. The sign-in info is in the vault: press “Re-issue” in the vault below now: it is your only way back into the account.",
          "vault_db_unavailable": "The database was unavailable; the sign-in info is stored temporarily and will be moved over automatically. Nothing changes for you.",
          "vault_store_failed": "The sign-in info or the new code could not be stored in the vault. Write down the new code shown on this page now.",
          "game_version_outdated": "The game just updated its data version and Toolbox has not caught up yet, so this step did not succeed"
        },
        "actions": {
          "startNew": "Start a new upload",
          "refresh": "Refresh status",
          "goVault": "Go to the vault"
        },
        "ackRequired": "Confirm that you have written down the new code first",
        "toast": {
          "succeeded": "Transfer upload complete; the account data has been saved",
          "cancelled": "Cancelled; your code was not used",
          "resumedRunning": "You already have a transfer in progress; it has been resumed"
        },
        "confirm": {
          "title": "Confirm the account to transfer",
          "description": "Your transfer code has not been used yet, so cancelling now changes nothing",
          "nickname": "Nickname",
          "rank": "Rank",
          "userId": "Game ID",
          "restriction": {
            "title": "Event transfer restriction",
            "active": "This account is under the event transfer restriction",
            "remaining": "Transfers left: {count}",
            "consumes": "Transferring here uses 1 of them; at 0 the game refuses to transfer",
            "endsAt": "Restriction ends: {time}",
            "worldBloom": "A World Link chapter is running",
            "none": "No transfer restriction right now"
          },
          "warningTitle": "Once you confirm, your device can no longer sign in to this account",
          "warningBody": "This page then shows a new transfer code; use it to transfer the account back to your device",
          "deadline": "Confirm within {time}; after that it is cancelled (your code stays valid)",
          "password": "Haruki Toolbox sign-in password",
          "passwordHelp": "The password you sign in to this website with. Not the game's transfer password, and not your QQ or Google password.",
          "forgotPassword": "Forgot your password?",
          "forgotPasswordNote": "If you forget your password and set a new one, what is saved in the vault can no longer be opened; the only way forward is resetting the vault, which deletes it",
          "pin": "Vault PIN",
          "pinHint": "You sign in with Google, Apple or a passkey and have no password, so use the vault PIN you set earlier",
          "pinCreate": "Set a vault PIN",
          "pinCreateHint": "You sign in with Google, Apple or a passkey and have no password, so set a separate PIN",
          "pinCreateWhy": "You enter it whenever you view or re-issue a code; at least 8 characters",
          "pinCreateWarning": "The PIN cannot be recovered. If you forget it, the only way forward is resetting the vault, which deletes what is saved.",
          "pinRepeat": "Enter the PIN again",
          "pinMismatch": "The PINs do not match; enter them again",
          "pinFormat": "The PIN must be 8 to 128 characters",
          "forgotPin": "Forgot your PIN? It cannot be recovered; the only way forward is resetting the vault (what is saved is deleted).",
          "passwordRequired": "Enter your Haruki Toolbox sign-in password",
          "previousPassword": "Previous sign-in password",
          "previousPasswordRequired": "Enter the sign-in password you had before the change",
          "submit": "Confirm and transfer",
          "submitting": "Verifying…",
          "cancel": "Cancel, do not transfer",
          "cancelling": "Cancelling…"
        },
        "newCode": {
          "title": "Your new transfer code",
          "description": "Use it on your device now to transfer the account back, or write it down somewhere safe",
          "inheritId": "Transfer ID",
          "password": "Transfer password",
          "copy": "Copy {label}",
          "copied": "{label} copied",
          "copyFailed": "Copy failed; please write it down by hand",
          "expiresIn": "Valid for {time}",
          "expiresAt": "Valid until {time}",
          "expired": "This code has expired; re-issue one from the vault",
          "singleUse": "Valid for 24 hours and works once",
          "savedToVault": "Stored encrypted in the vault below; you can view it again for 24 hours",
          "nextSteps": {
            "title": "Next",
            "restore": "Transfer the account back to your device with this code",
            "platformLink": "Once it is back, link it to Game Center (iOS) or Google Play Games (Android) in game (JP can also link Apple or Google), so you no longer depend on transfer codes",
            "cleanup": "After that, press “I recovered it on my device” in the vault below to delete the saved record"
          },
          "unsavedTitle": "Write this code down now",
          "unsavedBody": "This code could not be stored in the vault and cannot be shown again once you leave this page. Copy it or take a screenshot now.",
          "ack": "I have written it down",
          "acked": "Written down"
        }
      },
      "inheritVault": {
        "title": "Transfer code vault",
        "description": "New codes are kept 24 hours and the sign-in info for re-issuing 7 days; viewing asks for your {secret}",
        "empty": "Nothing is saved in the vault yet",
        "notInitialized": "The vault is created when you first confirm a transfer",
        "loadFailed": "Could not load the vault",
        "refresh": "Refresh",
        "entry": {
          "title": "{server} · {uid}",
          "createdAt": "Transferred {time}",
          "credential": "Sign-in info",
          "code": "Transfer code",
          "expiresIn": "{time} left",
          "expired": "Expired",
          "noCode": "No code to show",
          "currentCode": "Current transfer code",
          "unreadable": "This record was saved before the vault was reset and can no longer be opened",
          "pending": "Stored temporarily, moved over soon; works normally"
        },
        "actions": {
          "reveal": "Show code",
          "hide": "Hide",
          "reissue": "Re-issue",
          "destroy": "I recovered it on my device",
          "reset": "Reset vault"
        },
        "reveal": {
          "title": "Show transfer code",
          "description": "Every view is emailed to your verified address"
        },
        "reissue": {
          "title": "Re-issue transfer code",
          "description": "Issues a new code with the saved sign-in info; the previous code stops working at once",
          "modeLabel": "Password of the new code",
          "reuse": "Keep the previous code's password",
          "random": "Generate a random one"
        },
        "destroy": {
          "title": "Delete this record?",
          "description": "Make sure you have transferred the account back to your device. After deleting, this account's code can no longer be shown or re-issued.",
          "confirm": "Delete"
        },
        "reset": {
          "title": "Reset the vault?",
          "description": "This deletes every record in the vault ({records}) and cannot be undone. Use it only if you cannot remember your previous sign-in password or forgot your vault PIN.",
          "records": "no records | 1 record | {count} records",
          "password": "Current Haruki Toolbox sign-in password",
          "ack": "I understand that every record will be deleted",
          "confirm": "Reset and delete all records",
          "done": "Vault reset; no records deleted | Vault reset; 1 record deleted | Vault reset; {count} records deleted"
        },
        "passwordChanged": {
          "title": "Enter your previous sign-in password",
          "description": "The vault is still locked with your old password; enter it once and it switches to your current one",
          "forgot": "Cannot remember the old password? The only way forward is resetting the vault, which deletes what is saved in it.",
          "resetAction": "Reset vault"
        },
        "unlock": {
          "submit": "Show code"
        },
        "toast": {
          "destroyed": "Record deleted",
          "reissued": "New transfer code issued"
        }
      },
      "inheritErrors": {
        "invalid_request": "The request was malformed; reload the page and try again",
        "invalid_server": "Only JP and Global are supported",
        "invalid_upload_type": "Unsupported data type",
        "inherit_id_invalid": "The transfer ID must be 16 letters or digits",
        "inherit_password_invalid": "Enter the transfer password (at most 64 characters)",
        "new_password_mode_invalid": "Choose how to set the new code's password",
        "reuse_password_invalid": "This password cannot be kept (8–16 half-width characters, no spaces); choose “Generate a random one”",
        "mysekai_requires_qq": "Uploading MySekai data requires binding and verifying a QQ account under HarukiBot data authorization",
        "job_already_running": "You already have a transfer in progress; finish or cancel it first",
        "rate_limited": "Too many submissions (at most 10 per hour); please try again later",
        "server_busy": "Too many people are using this right now; please try again later",
        "game_degraded": "The game server is unstable at the moment; please try again later",
        "vault_unavailable": "Transfer-code uploads are unavailable right now; please try again later",
        "identity_unavailable": "Your account details cannot be checked right now; please try again later",
        "store_unavailable": "The service is unavailable right now; please try again later",
        "job_not_found": "The record of this transfer does not exist or has expired",
        "job_not_awaiting_confirm": "This transfer is no longer waiting for confirmation (it may already be confirmed, cancelled or timed out); check the progress above",
        "cannot_cancel": "The transfer has already started and can no longer be cancelled",
        "unauthenticated": "Your session has ended; sign in to Haruki Toolbox again",
        "ws_ticket_invalid": "The connection dropped; reconnecting…",
        "internal_error": "Something went wrong on the server; please try again later",
        "password_required": "Enter your Haruki Toolbox sign-in password",
        "vault_pin_required": "Enter your vault PIN",
        "vault_pin_invalid_format": "The vault PIN must be 8 to 128 characters",
        "password_invalid": "Wrong sign-in password. Enter the password you sign in to this website with, not the game's transfer password.",
        "vault_pin_invalid": "Wrong vault PIN; please try again",
        "previous_password_invalid": "That is not the previous sign-in password; please try again. If you cannot remember it, the only way forward is resetting the vault.",
        "vault_password_changed": "You changed your sign-in password; enter the password you had before the change once",
        "vault_not_initialized": "You have not used the vault yet; it is created when you first confirm a transfer",
        "unlock_rate_limited": "Too many wrong attempts; to protect your account, please try again in 15 minutes",
        "entry_not_found": "This record does not exist or has expired",
        "entry_stale": "This record was saved before the vault was reset and can no longer be opened",
        "code_not_available": "This record has no code to show right now (older than 24 hours or never issued); press “Re-issue”",
        "no_previous_password": "There is no previous transfer password to keep; choose “Generate a random one”",
        "reset_confirmation_required": "Tick the confirmation first",
        "reissue_failed": "Re-issuing the transfer code failed; please try again later",
        "reissue_login_failed": "The saved sign-in info no longer signs in to the game; it may have expired",
        "reissue_rejected": "The game server refused the request; please try again later",
        "client_update_required": "This page is out of date; please reload it",
        "retryAfter": "{message} (retry in {seconds} s)",
        "network": "Cannot reach the server; check your connection and try again",
        "unknown": "The request failed (HTTP {status}); please try again later"
      }
    },
    "pointCalculator": {
      "title": "Score control",
      "description": "Get the deck bonus, Live Boost and score for each game from the event pt you need",
      "entry": {
        "label": "How much pt",
        "gapTab": "Gap",
        "rangeTab": "Current and target",
        "gap": "Event pt still needed",
        "gapPlaceholder": "e.g. 23154",
        "current": "Current event pt",
        "currentPlaceholder": "e.g. 1234567",
        "target": "Target event pt",
        "targetPlaceholder": "e.g. 1257721",
        "parsed": "Using {value}",
        "invalid": "Enter a non-negative whole number; the suffixes 万 / w / k are accepted"
      },
      "song": {
        "label": "Song",
        "region": "Region",
        "basicPoint": "Basic pt {value}",
        "missingBasicPoint": "This song has no basic pt data yet. Pick another song."
      },
      "conditions": {
        "title": "Conditions",
        "summary": "Bonus {min}–{max}% · {boosts} · up to {games} games",
        "bonusRange": "Deck bonus range",
        "bonusRangeHelp": "Set it to what your decks can reach",
        "bonusMin": "Lowest bonus",
        "bonusMax": "Highest bonus",
        "bonusRangeInvalid": "The range must be whole numbers from 0 to {max}, lowest first",
        "worldLink": "World Link event",
        "worldLinkHelp": "Raises the highest bonus to {max}%",
        "boosts": "Live Boost to use",
        "boostsNone": "Select at least one boost level",
        "boostsAll": "any boost",
        "boostsSome": "boost {list}",
        "boostOption": "Boost {index}",
        "selectAllBoosts": "Select all",
        "maxGames": "Most games to split into",
        "maxGamesOption": "{count} games"
      },
      "actions": {
        "buildDeck": "Build deck",
        "retry": "Retry"
      },
      "result": {
        "empty": "Enter the pt you need",
        "gapLabel": "To earn",
        "fromTo": "From {current} to {target}, to earn",
        "singleNote": "One game with no playing can do it; there are {count} single-game options",
        "singleScoreNote": "One game can do it, but all {count} single-game options need a precise score. Plans that need no playing come first.",
        "splitNote": "No single game earns {gap} pt (one game earns {min}–{max} under these conditions), so it is split across several",
        "plansTitle": "Suggested plans",
        "planTitle": "Plan {index}",
        "planTotals": "{games} games · {energy} boost · {decks} decks",
        "needsScore": "Needs a precise score",
        "tags": {
          "fewestGames": "Fewest games",
          "leastEnergy": "Least boost",
          "singleDeck": "One deck"
        },
        "step": {
          "times": "×{count}",
          "deck": "Bonus {value}%",
          "boost": "Boost {index} (×{rate})",
          "idle": "No playing needed",
          "idleDetail": "score under {score}",
          "idleHint": "Start the song, hit nothing, and let it finish",
          "each": "+{value} each",
          "after": "{value} after"
        },
        "allSingle": "Every single-game option",
        "allSingleHint": "{count}, easiest first",
        "showAll": "Show all {count}",
        "columns": {
          "bonus": "Bonus needed",
          "boost": "Boost",
          "score": "Score"
        },
        "status": {
          "reached": "Already on the target. Nothing left to play.",
          "overshot": "Already {gap} pt past the target. Event pt never goes down, so this target is out of reach.",
          "tooClose": "Only {gap} pt to go, but one game earns at least {min} pt under these conditions, so another game overshoots",
          "tooCloseAction": "Lower the bonus floor to 0%",
          "tooFar": "{gap} pt to go is more than {games} idle games can cover (at most {reach} pt). Play normally until you are within {reach} pt, then come back.",
          "tooFarTarget": " That is, play up to about {value} pt first.",
          "tooFarAction": "Allow up to {count} games",
          "none": "Nothing adds up to {gap} pt under these conditions. Widen the bonus range, allow more boost levels or more games."
        }
      },
      "tips": {
        "boost": "Check the Live Boost before each game; one level off and the pt is wrong",
        "beta": "Still in testing and not guaranteed; check important numbers in game first"
      }
    }
  },
  "botNeo": {
    "title": "HarukiBot NEO registration",
    "lead": "Get the credential that connects your own bot to HarukiBot NEO",
    "steps": {
      "label": "Registration steps",
      "input": "QQ number",
      "verify": "Email code",
      "result": "Credential"
    },
    "status": {
      "unknown": "Couldn't confirm registration is open; trying still works",
      "recheck": "Check again"
    },
    "disabled": {
      "title": "Registration unavailable",
      "recheck": "Check again"
    },
    "group": {
      "label": "NEO distributed QQ group",
      "number": "Group number"
    },
    "input": {
      "ownerLabel": "Your own QQ number",
      "ownerPlaceholder": "For example 123456789",
      "ownerNote": "Not the QQ account your bot signs in with, or you can't join the NEO distributed QQ group",
      "mailHint": "The code goes to {mail}",
      "hintQqPlaceholder": "your QQ number",
      "sendButton": "Send verification code",
      "cooldownButton": "Retry in {seconds}s"
    },
    "verify": {
      "sentTo": "Code sent to {mail}, valid for 10 minutes",
      "codeFieldLabel": "Code from the email",
      "codeFieldPlaceholder": "6 digits",
      "changeNumber": "Change QQ number",
      "submit": "Finish registration",
      "resend": "Resend",
      "resendCooldown": "Resend in {seconds}s"
    },
    "result": {
      "successTitle": "Registration successful",
      "botIdLabel": "Bot ID",
      "credentialLabel": "Credential",
      "copyAction": "Copy {label}",
      "copyButton": "Copy",
      "shownOnce": "The credential is shown only this once. Copy and save it now.",
      "openGenerator": "Generate Client config",
      "registerAnotherButton": "Register another",
      "leave": {
        "title": "Have you saved the credential?",
        "description": "Once you go back it is hidden and can't be retrieved",
        "confirm": "Saved, continue"
      }
    },
    "toast": {
      "statusCheckFailed": "Failed to check registration status",
      "statusCheckFailedHint": "Check your connection, then Check again; if it keeps failing the service may be temporarily unavailable",
      "sendFailedTitle": "Send failed",
      "sendFailedFallback": "The code was not sent. Check the QQ number and retry; if it keeps failing, try again later.",
      "missingQQNumber": "Enter your QQ number",
      "invalidQQNumber": "Please enter a valid QQ number (5–12 digits)",
      "rateLimitedTitle": "Rate limited",
      "rateLimitedDescription": "Too many requests. Please retry after {seconds} seconds.",
      "alreadyRegisteredTitle": "Already registered",
      "alreadyRegisteredDescription": "This QQ number already has a registered Bot",
      "registrationDisabledTitle": "Registration disabled",
      "registrationDisabledDescription": "Registration is currently closed",
      "codeSentTitle": "Verification code sent",
      "codeSentDescription": "Please check the mailbox of QQ {qq}",
      "registerFailedTitle": "Registration failed",
      "registerFailedFallback": "Registration did not complete. Check the code and retry; if it expired, send a new one.",
      "missingVerificationCode": "Please enter the verification code",
      "invalidVerificationCode": "The code is 6 digits; check it and enter it again",
      "incompleteResponse": "Incomplete response data",
      "registerSuccessTitle": "Registration successful",
      "clipboardUnsupported": "Clipboard is not supported in this environment",
      "copySuccess": "{label} copied to clipboard",
      "copyFailed": "Failed to copy to clipboard"
    }
  },
  "sekaiStation": {
    "title": "Sekai Station",
    "description": "Live CN-server Multi Live room numbers.",
    "viewOnSekaiStation": "View on Sekai Station",
    "notConfigured": "Sekai Station is temporarily unavailable",
    "connection": {
      "connected": "Connected",
      "connecting": "Connecting…",
      "disconnected": "Disconnected",
      "failed": "Can't reach the server",
      "failedHint": "Retrying automatically",
      "retryIn": "Retrying in {n}s",
      "retryNow": "Retry now",
      "reconnecting": "Reconnecting…",
      "online": "{n} online"
    },
    "rooms": {
      "list": "Room list",
      "empty": "No rooms right now",
      "emptyFiltered": "No rooms match your filter",
      "clearFilters": "Clear filter",
      "loading": "Loading…",
      "copyId": "Copy room number",
      "copyText": "Copy number and message",
      "openOriginal": "Open original post",
      "pin": "Pin",
      "unpin": "Unpin",
      "copied": "Copied",
      "copyFailed": "Copy failed",
      "more": "More actions",
      "idHint": "Hold 1 s to hide for 10 min",
      "block": "Hide for 10 min",
      "blocked": "Hid {id} for 10 minutes",
      "undo": "Undo"
    },
    "settings": {
      "title": "Filter & display",
      "description": "Filter, hidden room numbers and display options",
      "done": "Done",
      "activeCount": "{n} filter terms on",
      "filter": "Filter",
      "mode": "Rooms with any of these",
      "blacklist": "Hide",
      "whitelist": "Show only",
      "presetTags": "Common terms",
      "presetTagLabel": "{tag} ({name})",
      "tagNames": {
        "shrimp": "shrimp",
        "dragon": "dragon",
        "pizza": "pizza"
      },
      "keyword": "Keywords",
      "keywordPlaceholder": "e.g. long-term",
      "keywordDuplicate": "Already in the list",
      "add": "Add",
      "clear": "Clear",
      "removeFilter": "Remove filter “{name}”",
      "display": "Display",
      "expireTime": "Keep rooms for",
      "durationSeconds": "{n} s",
      "durationMinutes": "{n} min",
      "fontSize": "Font size",
      "lineHeight": "Line height",
      "decrease": "Decrease",
      "increase": "Increase"
    },
    "blocked": {
      "title": "Hidden room numbers",
      "count": "{n} hidden",
      "empty": "Hold a room number for 1 s to hide it for 10 min",
      "minutesLeft": "{n} min left",
      "unblock": "Unhide {id}",
      "unblockOne": "Unhide",
      "unblockAll": "Unhide all"
    }
  }
} as const
