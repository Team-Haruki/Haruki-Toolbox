// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: tools, botNeo, sekaiStation
export default {
  "tools": {
    "clientConfigGenerator": {
      "title": "Haruki Client Config Generator",
      "description": "Generate configs.yaml for the current Haruki Client schema, including dynamic routing, control API, modules, and access policies.",
      "summary": {
        "modules": "Modules",
        "admins": "Admins",
        "scopes": "Scopes"
      },
      "sections": {
        "identity": {
          "title": "Identity",
          "description": "Set local ports, Bot ID, credential, and optional trust-verification fields."
        },
        "routing": {
          "title": "Network routing",
          "description": "Configure dynamic primary/alternative cloud endpoints or pin a fixed endpoint."
        },
        "runtime": {
          "title": "Runtime policy",
          "description": "Control private-chat replies, help, CN features, reply quoting, and global command limits."
        },
        "modules": {
          "title": "Modules and feature scopes",
          "description": "Use manifest command_module for base module gating, then the current cloud client_policy_scope for feature-level policy."
        },
        "access": {
          "title": "Access lists",
          "description": "Enter group blacklists, group whitelists, user blacklists, and Bot admin QQ IDs by scope."
        }
      },
      "fields": {
        "host": {
          "label": "Listen host",
          "placeholder": "127.0.0.1"
        },
        "port": {
          "label": "OneBot port"
        },
        "controlApiPort": {
          "label": "Control API port"
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
          "description": "When enabled, the control API requires a Bearer token. Disabled writes null.",
          "placeholder": "Local control API token"
        },
        "serverEndpointOverride": {
          "label": "Pinned server endpoint",
          "placeholder": "Leave empty unless the group announces one",
          "help": "Only fill this when a group notice asks you to pin an endpoint."
        },
        "routingConfigURL": {
          "label": "Routing config URL",
          "placeholder": "Leave empty to use the built-in routing-v3.json URL",
          "help": "Used for production/alternative failover. Ignored when a pinned endpoint is set."
        },
        "enableDynamicRouting": {
          "label": "Enable dynamic routing",
          "description": "Enabled by default. Turn it off to use only the built-in endpoint and keyset-approved endpoints."
        },
        "runMode": {
          "label": "Run mode",
          "placeholder": "Select run mode"
        },
        "helpContent": {
          "label": "Custom help content",
          "placeholder": "Leave empty to use default help content"
        },
        "enableGroupCommandLimit": {
          "label": "Enable global command limit",
          "description": "Limit successful calls across all groups per hour/day. 0 means unlimited."
        },
        "globalCommandHourlyLimit": {
          "label": "Hourly limit"
        },
        "globalCommandDailyLimit": {
          "label": "Daily limit"
        },
        "mysekaiBirthdayMonitorMode": {
          "label": "Birthday material delivery mode",
          "placeholder": "Select list mode",
          "help": "Controls birthday material monitor deliveries only, independently of the command run mode."
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
          "label": "Enabled modules",
          "placeholder": "Select module",
          "help": "Choose command_module values from the dropdown. all enables every module. card/music/mysekai are cloud-side categories, not base module names here."
        },
        "featurePolicyModes": {
          "label": "Feature policy modes",
          "placeholder": "Select feature scope",
          "help": "Add rows only when a feature needs to override the global run mode. Leave this empty when no feature has a separate policy."
        },
        "blacklists": {
          "label": "Group blacklists",
          "placeholder": "all: 123456, 789012\nprofile: 345678"
        },
        "whitelists": {
          "label": "Group whitelists",
          "placeholder": "all: 123456, 789012\nmysekai: 345678"
        },
        "userBlacklists": {
          "label": "User blacklists",
          "placeholder": "all: 10001, 10002\nprofile: 10003"
        },
        "botAdmins": {
          "label": "Bot admin QQ IDs",
          "placeholder": "114514\n1919810",
          "help": "Admins can use Haruki Client control commands in groups."
        }
      },
      "toggles": {
        "enableHelp": {
          "label": "Help command",
          "description": "Allow built-in help replies."
        },
        "enableCN": {
          "label": "CN features",
          "description": "Enable CN-related features."
        },
        "enablePrivateMessage": {
          "label": "Reply to private chats",
          "description": "Private chats bypass group lists but still obey user blacklists and rate limits."
        },
        "enableReplyMessage": {
          "label": "Quote replies",
          "description": "Quote the original message in replies."
        },
        "sendBase64Image": {
          "label": "Base64 images",
          "description": "Fetch Cloud images on the client and send them to OneBot as base64."
        },
        "mysekaiBirthdayMonitorNotifyEmpty": {
          "label": "Birthday empty notice",
          "description": "Notify when a MySekai birthday material monitor has no matches."
        },
        "enableParamEcho": {
          "label": "Parameter echo",
          "description": "Allow Cloud parse errors to echo concrete parameters."
        },
        "strictConfigPermissions": {
          "label": "Enforce config permissions",
          "description": "Refuse to start when configs.yaml is group/world-readable. Set it to mode 0600 before enabling."
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
        "reset": "Reset"
      },
      "moduleSelector": {
        "allModules": "All modules",
        "moduleOption": "Module: {value}",
        "placeholder": "Select module"
      },
      "policyEditor": {
        "scopeLabel": "Feature scope",
        "scopePlaceholder": "Select feature",
        "modePlaceholder": "Select mode",
        "empty": "Leave this empty when no feature needs its own policy."
      },
      "accessEditor": {
        "scopeLabel": "Access scope",
        "scopePlaceholder": "Select global, module, or feature",
        "globalGroup": "Global",
        "moduleGroup": "Modules",
        "featureGroup": "Features",
        "globalScope": "Global: all",
        "moduleScope": "Module: {value}",
        "featureScope": "Feature: {value}",
        "groupIdLabel": "Group ID",
        "groupIdPlaceholder": "Group ID",
        "userIdLabel": "User QQ",
        "userIdPlaceholder": "User QQ",
        "botAdminPlaceholder": "Admin QQ",
        "blacklistsDescription": "Pick a global, module, or feature scope, then add groups to block.",
        "whitelistsDescription": "Pick a global, module, or feature scope, then add groups to allow.",
        "userBlacklistsDescription": "Pick a global, module, or feature scope, then add user QQ IDs to block."
      },
      "runMode": {
        "blacklist": "Blacklist mode",
        "whitelist": "Whitelist mode"
      },
      "routingState": {
        "dynamic": "Dynamic routing enabled",
        "pinned": "Server endpoint pinned",
        "builtIn": "Using built-in routing",
        "dynamicDescription": "The client reads routingConfigURL; when empty, it uses the built-in EdgeOne routing-v3.json URL.",
        "pinnedDescription": "When serverEndpointOverride is non-empty, the client uses that endpoint directly and does not read dynamic routing config.",
        "builtInDescription": "Dynamic routing is disabled, so the client uses only its built-in endpoint and keyset-approved endpoints."
      },
      "preview": {
        "title": "configs.yaml preview",
        "description": "The YAML updates live and can be copied into the Haruki Client working directory."
      },
      "prefill": {
        "title": "Filled from registration result",
        "description": "Bot ID and credential were filled into the config form. ownerId is only shown to confirm the registration source and is not written to configs.yaml.",
        "ownerId": "ownerId: {value}",
        "botId": "Bot ID: {value}",
        "credential": "Credential filled"
      },
      "notes": {
        "title": "Notes",
        "description": "This generator handles values locally in your browser and does not submit credentials.",
        "items": {
          "dynamicRouting": "The new client enables dynamic routing by default; leave routingConfigURL empty to use its built-in routing-v3.json.",
          "accessToken": "Keep controlApiAccessToken disabled when auth is not needed; YAML will write null.",
          "listSyntax": "Access lists can be added row by row; the generator merges scopes and IDs into client YAML."
        }
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
      "description": "Generate a proxy module for Shadowrocket, Surge and similar apps; afterwards your data uploads automatically whenever you open the game.",
      "tutorialAlert": {
        "label": "Illustrated guide:",
        "linkText": "open",
        "nonZhWarning": "Please note that this tutorial is only available in Simplified Chinese."
      },
      "qxScriptWarning": "Quantumult X does not support script upload mode",
      "cnRestriction": "Due to legal restrictions, CN MySekai module installation is not provided.",
      "installButton": "Quick Install Module",
      "installHint": "This opens the proxy app you chose and imports the module",
      "copyAction": "Copy {label}",
      "copyLabel": {
        "uploadCode": "upload code",
        "moduleUrl": "module URL",
        "scriptUrl": "script URL"
      },
      "steps": {
        "configure": {
          "title": "Configure",
          "description": "Choose the proxy app, server route, and upload mode."
        },
        "scope": {
          "title": "Scope",
          "description": "Choose the regions and data types to upload."
        },
        "install": {
          "title": "Get & Install",
          "prerequisite": "You need to be signed in with a bound game account first.",
          "description": "Generate an upload code, then copy the URLs or quick install the module.",
          "after": "After installing, open the game and reach the home screen once; once the upload succeeds, \"My account\" on the toolbox home page shows the upload time."
        }
      },
      "sections": {
        "software": {
          "title": "Select app",
          "description": "Choose the proxy app to install the module into",
          "placeholder": "Select app"
        },
        "endpoint": {
          "title": "Server route",
          "description": "Direct works in mainland China; outside it, CDN may be smoother.",
          "placeholder": "Select route"
        },
        "mode": {
          "title": "Select upload mode",
          "description": "\"Script upload\" can run alongside other bots' modules but is occasionally unstable; \"Proxy upload\" is more stable but only one toolbox module can be installed at a time. If unsure, pick \"Proxy upload\".",
          "placeholder": "Select upload mode"
        },
        "chunk": {
          "title": "Chunk size",
          "description": "The default is fine for most people. Larger values enter the game faster, but some proxy apps may fail to upload.",
          "unit": "MB"
        },
        "regions": {
          "title": "Select regions",
          "description": "Select game servers to upload data for (multi-select)"
        },
        "dataTypes": {
          "title": "Select data types",
          "description": "Select data types to upload (multi-select)"
        }
      },
      "uploadCode": {
        "title": "Upload Code",
        "description": "The module uses it to prove the upload is yours; regenerate it if it leaks.",
        "regenerate": "Regenerate",
        "generate": "Generate Upload Code",
        "loginRequired": "Sign in required",
        "regenerateDialog": {
          "title": "Regenerate the upload code?",
          "description": "The old code stops working immediately; any installed module must be reinstalled with the new URL to keep uploading.",
          "confirm": "Regenerate"
        }
      },
      "generatedUrls": {
        "title": "Generated URLs",
        "description": "Copy URLs for manual install, or use quick install below",
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
      "region": {
        "jp": "JP",
        "en": "Global",
        "tw": "TW",
        "kr": "KR",
        "cn": "CN"
      },
      "dataTypes": {
        "suite": {
          "label": "Account data (Suite)",
          "description": "Upload full data for your game account"
        },
        "mysekai": {
          "label": "MySekai data",
          "description": "Upload MySekai data for your game account"
        },
        "mysekai_force": {
          "label": "MySekai data (upload on every visit)",
          "description": "Re-upload every time you enter MySekai, whether or not anything changed in game."
        },
        "mysekai_birthday_party": {
          "label": "MySekai Birthday Party",
          "description": "Upload MySekai Birthday Party Futaba map data"
        }
      },
      "toast": {
        "loginRequired": "Please sign in first",
        "generateCodeSuccess": "Upload code generated",
        "generateCodeFailedTitle": "Failed to generate upload code",
        "generateCodeFailedFallback": "Make sure you are signed in, then try again later.",
        "copyEmpty": "Nothing to copy",
        "clipboardUnsupported": "Clipboard is not supported in this environment",
        "copySuccess": "{label} copied to clipboard",
        "copyFailed": "Failed to copy to clipboard. Check browser permissions.",
        "qxScriptFallback": "Quantumult X does not support script mode. Switched to proxy mode.",
        "unsupportedClient": "Unsupported client",
        "installUnsupported": "Quick install is not supported in this environment"
      }
    },
    "uploadData": {
      "groupNotice1": "Haruki Playground QQ Group 1: {groupId}",
      "groupNotice2": "Haruki Playground QQ Group 2: {groupId}",
      "groupTitle": "Haruki Playground QQ Groups",
      "group1Label": "Group 1",
      "group2Label": "Group 2",
      "intro": {
        "title": "Upload data",
        "description": "\"Upload data\" syncs your game account data to the toolbox for cards, event records, deck building and more. Recommended: the iOS module on iPhone/iPad, HarukiProxy on Android/Windows; use the transfer code only when neither works.",
        "iosPlatform": "iPhone / iPad",
        "iosMethod": "iOS module (recommended)",
        "proxyPlatform": "Android / Windows",
        "proxyMethod": "HarukiProxy guide",
        "fallbackPlatform": "When neither works",
        "fallbackMethod": "Transfer code (fallback)"
      },
      "tabs": {
        "ios": "iOS module (iPhone/iPad)",
        "proxy": "HarukiProxy (Android/PC)",
        "inherit": "Transfer code (fallback)",
        "file": "File upload (advanced)"
      },
      "proxyTab": {
        "title": "HarukiProxy (Android / PC)",
        "description": "Run HarukiProxy on an Android phone or a PC; your data uploads to the toolbox automatically when you open the game.",
        "steps": {
          "install": "Install and configure HarukiProxy on your phone or PC by following the guide.",
          "bind": "Bind and verify the game account to upload under Game account bindings first.",
          "run": "With HarukiProxy on, reach the game's home screen once; \"My account\" on the toolbox home page shows the upload time."
        },
        "tutorialButton": "Open the HarukiProxy guide"
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
        "noWritableAccount": "No account can be uploaded to yet. Verify your account under Game account bindings first; to upload for someone else, they must grant you upload access first."
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
        "uploadForbiddenDescription": "The grant may have expired, been revoked, or the binding changed. The list of upload targets was reloaded.",
        "operationForbiddenTitle": "Submission forbidden",
        "operationForbiddenDescription": "This action is not allowed due to legal restrictions",
        "uploadSuccessTitle": "Upload successful",
        "uploadSuccessFileFallback": "File uploaded",
        "uploadFailedTitle": "Upload failed",
        "uploadFailedFallback": "The upload did not go through. Check the file and account and retry; if it keeps failing, open a ticket.",
        "inheritIdRequired": "Enter the transfer ID",
        "inheritPasswordRequired": "Enter the transfer password",
        "inheritIdInvalidDescription": "The transfer ID must be 16 letters and digits (case-sensitive)"
      },
      "fileTab": {
        "title": "Manual file upload",
        "description": "Upload a data file saved by HarukiProxy or the iOS module. Not sure how to get one? See \"Other upload methods\" above.",
        "unavailableTitle": "Unavailable",
        "forbiddenTitle": "Operation forbidden",
        "forbiddenDescription": "This action is not allowed due to legal restrictions",
        "fields": {
          "file": "Upload file",
          "chooseFile": "Choose file",
          "noFile": "No file selected",
          "fileHint": "Pick a data file saved by HarukiProxy or the iOS module; it is uploaded as-is.",
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
        "targetsFailedDescription": "Showing your own verified accounts for now; accounts granted by others appear after a refresh.",
        "accountNotWritable": "This account cannot be uploaded to yet: it is unverified, or its owner has not allowed you to upload for them.",
        "unavailableChip": "Unavailable",
        "someAccountsUnavailable": "Greyed-out accounts cannot be uploaded to yet: unverified, or the owner has not allowed you to upload for them.",
        "grantedTargetNotice": "This account was granted to you by another user. Uploads directly update their data in the toolbox.",
        "dataTypeLimited": "Only some data types can be uploaded to this account.",
        "submit": "Submit",
        "submitting": "Submitting..."
      },
      "inheritTab": {
        "title": "Transfer-code data upload",
        "description": "Enter the transfer ID and transfer password from the game. The toolbox first shows you the account to check, runs the transfer only after you confirm, and right away issues you a new transfer code.",
        "loginRequired": {
          "title": "Sign in to Haruki Toolbox first",
          "description": "Transfer-code uploads need you to be signed in to this website. After the transfer, the new transfer code is kept encrypted in your transfer code vault, readable only by you.",
          "action": "Sign in"
        },
        "fields": {
          "inheritId": "Transfer ID",
          "inheritIdPlaceholder": "Enter transfer ID",
          "inheritPassword": "Transfer password",
          "inheritPasswordPlaceholder": "The transfer password you set in the game",
          "server": "Select region",
          "serverPlaceholder": "Select region",
          "dataType": "Select data type",
          "dataTypePlaceholder": "Select data type"
        },
        "prep": {
          "bind": "Bind this game account under Game account bindings first; otherwise the data is not saved, even if the upload reports success.",
          "bindLink": "Bind account",
          "platformLink": "We recommend linking the account to Game Center (iOS) or Google Play Games (Android) in the game's transfer menu first; JP can also link an Apple or Google account. Then the account is not lost if a transfer code expires or is used up.",
          "mysekaiQQ": "Uploading MySekai data requires binding and verifying a QQ account under HarukiBot data authorization.",
          "mysekaiQQLink": "Verify QQ"
        },
        "newPassword": {
          "label": "Password of the new transfer code",
          "reuse": "Keep this password",
          "reuseHint": "The new code uses the password you just entered, so it is easy to remember.",
          "random": "Generate a random one",
          "randomHint": "A random password of 12 letters and digits.",
          "reuseBlocked": "This password cannot be kept: it must be 8–16 half-width letters, digits or symbols without spaces. Choose \"Generate a random one\".",
          "reuseInvalid": "A kept password must be 8–16 half-width letters, digits or symbols without spaces; choose \"Generate a random one\" instead",
          "tooLong": "The transfer password is too long"
        },
        "alerts": {
          "notesTitle": "Learn more: how it works, what is stored, and the risk",
          "warning1": {
            "title": "After the transfer, your phone is signed out",
            "description": "You then restore the account to your phone with the new transfer code the toolbox issues. You see the account first, and nothing runs until you confirm."
          },
          "flow": {
            "title": "Steps",
            "step1": "First the account is only looked up (the code is not used); check the nickname and rank. JP transfer codes are valid for 24 hours and work once.",
            "step2": "Once the details look right, confirm with your Haruki Toolbox sign-in password (accounts that sign in with Google, Apple or a passkey use a vault PIN instead). Only then does the transfer run. Until then you can cancel and the code stays valid.",
            "step3": "Right after the transfer a new transfer code is issued and shown on this page, and stored encrypted in the transfer code vault below, where you can see it again for 24 hours.",
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
        "submitting": "Reading account info…"
      },
      "inheritJob": {
        "title": "Transfer progress",
        "summary": "{server} · {dataType}",
        "status": {
          "running": "Running",
          "awaiting_confirm": "Waiting for you",
          "succeeded": "Done",
          "failed": "Failed",
          "cancelled": "Cancelled"
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
          "cookies": "Get access cookies",
          "version": "Get game version",
          "inherit_check": "Look up the account (code not used)",
          "inherit_execute": "Execute transfer",
          "auth": "Sign in",
          "issue_code": "Issue transfer code",
          "suite": "Account data",
          "suite_followup": "Follow-up requests",
          "home_refresh": "Refresh home",
          "home_refresh_final": "Final refresh",
          "maintenance_check": "Check maintenance",
          "mysekai": "MySekai data",
          "mysekai_followup": "Follow-up requests"
        },
        "stepStatus": {
          "pending": "Pending",
          "running": "Running",
          "done": "Done",
          "failed": "Failed",
          "skipped": "Skipped",
          "warning": "Partly failed"
        },
        "consumesCode": "The transfer code is used from here on",
        "codeValidity": {
          "valid": "The code you entered was not used and is still valid.",
          "used": "The code you entered has been used and cannot be used again.",
          "unknown": "It is unclear whether the code you entered was used. Do not use it on another device for now, and check the vault below."
        },
        "errorTitle": "Transfer not completed",
        "issueFailedTitle": "No new transfer code was issued",
        "cancelledTitle": "Cancelled",
        "succeededTitle": "Upload complete",
        "succeededDescription": "The account data has been saved.",
        "expired": "The progress record of this transfer has expired (it is kept for 1 hour). The new code can still be viewed in the vault below.",
        "errors": {
          "inherit_invalid": "The transfer code is invalid, already used or expired. Generate a new code in the game and try again.",
          "inherit_restricted": "The game does not allow transfers for this account right now. Nothing was transferred and your code is still valid.",
          "transfer_restricted": "This account has no transfers left during the current event. Nothing was transferred and your code is still valid.",
          "confirm_timeout": "Not confirmed within 5 minutes, so it was cancelled. Nothing was transferred; your code is still valid and you can submit it again.",
          "cancelled": "Cancelled; nothing was transferred.",
          "game_degraded": "The game server is unstable at the moment; nothing was transferred. Please try again later.",
          "server_busy": "Too many people are using this right now; nothing was transferred. Please try again later.",
          "game_maintenance": "The game server is under maintenance. Please try again after it ends.",
          "game_unavailable": "The game server cannot be reached right now. Please try again later.",
          "game_error": "The game server returned an error. Please try again later.",
          "execute_uncertain": "The connection dropped during the transfer, so it is unclear whether your code was used. Do not use this code on another device for now, and check the vault below: if this account shows up there, the transfer went through and you can view or re-issue the code there.",
          "login_failed": "The transfer went through and the sign-in info is in the vault, but signing in to the game failed. Later, press \"Re-issue\" in the vault below to get a new transfer code.",
          "fetch_failed": "Fetching the game data failed. The new code (if one was issued) is shown on this page and kept in the vault.",
          "mysekai_unavailable": "Fetching MySekai data failed; the MySekai tutorial may not be finished. The new code (if one was issued) is shown on this page and kept in the vault.",
          "upload_failed": "Saving the data failed. The new code (if one was issued) is shown on this page and kept in the vault.",
          "upload_forbidden": "This game account is bound to another Haruki Toolbox user, so it cannot be uploaded. The new code (if one was issued) is shown on this page and kept in the vault.",
          "job_interrupted": "The server restarted and this transfer was interrupted.",
          "internal_error": "Something went wrong on the server and this transfer did not finish."
        },
        "warnings": {
          "issue_code_failed": "No new transfer code was issued. The sign-in info is in the vault: press \"Re-issue\" in the vault below now, it is your only way back into the account.",
          "vault_db_unavailable": "The database was unavailable; the sign-in info is stored temporarily and will be moved over automatically. Nothing changes for you.",
          "vault_store_failed": "The sign-in info or the new code could not be stored in the vault. Write down the new code shown on this page now."
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
          "description": "Check the account details. Your transfer code has not been used yet, so cancelling changes nothing.",
          "nickname": "Nickname",
          "rank": "Rank",
          "userId": "Game ID",
          "restriction": {
            "title": "Event transfer restriction",
            "active": "This account is under the event transfer restriction",
            "remaining": "Transfers left: {count}",
            "endsAt": "Restriction ends: {time}",
            "worldBloom": "A World Link chapter is running",
            "none": "No transfer restriction right now."
          },
          "warningTitle": "Once you confirm, your phone can no longer sign in to this account",
          "warningBody": "The account moves to the toolbox. This page then shows a new transfer code; use it to transfer the account back to your phone.",
          "deadline": "Confirm within {time}; after that it is cancelled (your code stays valid).",
          "password": "Haruki Toolbox sign-in password",
          "passwordHelp": "The password you sign in to this website with. Not the game's transfer password, and not your QQ or Google password.",
          "passwordWhy": "It locks the saved sign-in info so that only you can open it.",
          "passwordFirstUse": "It locks the saved sign-in info so that only you can open it. Your transfer code vault is created when you first confirm.",
          "forgotPassword": "Forgot your password?",
          "forgotPasswordNote": "If you forget your password and set a new one, what is saved in the vault can no longer be opened; the only way forward is resetting the vault, which deletes it.",
          "pin": "Vault PIN",
          "pinHint": "You sign in to this website with Google, Apple or a passkey and have no password, so you use the vault PIN you set earlier instead.",
          "pinCreate": "Set a vault PIN",
          "pinCreateHint": "You sign in to this website with Google, Apple or a passkey and have no password, so set a separate PIN.",
          "pinCreateWhy": "The PIN locks the saved sign-in info; you enter it whenever you view or re-issue a code. At least 8 characters.",
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
          "description": "Use it on your phone now to transfer the account back, or write it down somewhere safe.",
          "inheritId": "Transfer ID",
          "password": "Transfer password",
          "copy": "Copy {label}",
          "copied": "{label} copied",
          "copyFailed": "Copy failed; please write it down by hand",
          "expiresIn": "Valid for {time}",
          "expiresAt": "until {time}",
          "expired": "This code has expired; re-issue one from the vault.",
          "singleUse": "Valid for 24 hours and works once.",
          "savedToVault": "Stored encrypted in the vault below; you can view it again for 24 hours.",
          "nextSteps": {
            "title": "Next",
            "restore": "Transfer the account back to your phone with this code.",
            "platformLink": "Once it is back, we recommend linking it to Game Center (iOS) or Google Play Games (Android) in the game's transfer menu (JP can also link an Apple or Google account), so you no longer depend on transfer codes.",
            "cleanup": "After that, press \"I recovered it on my phone\" in the vault below to delete the saved record."
          },
          "unsavedTitle": "Write this code down now",
          "unsavedBody": "This code could not be stored in the vault and cannot be shown again once you leave this page. Copy it or take a screenshot now.",
          "ack": "I have written it down",
          "acked": "Written down"
        }
      },
      "inheritVault": {
        "title": "Transfer code vault",
        "description": "The new code (kept 24 hours) and the game sign-in info used to re-issue codes (kept 7 days) are stored here, encrypted. Viewing them asks you to verify ({secret}).",
        "empty": "Nothing is saved in the vault yet.",
        "notInitialized": "You have not used the vault yet; it is created when you first confirm a transfer.",
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
          "unreadable": "This record was saved before the vault was reset and can no longer be opened.",
          "pending": "Stored temporarily, moved over soon; works normally"
        },
        "actions": {
          "reveal": "Show code",
          "hide": "Hide",
          "reissue": "Re-issue",
          "destroy": "I recovered it on my phone",
          "reset": "Reset vault"
        },
        "reveal": {
          "title": "Show transfer code",
          "description": "Verify it is you to show this record's transfer code. Every view is emailed to your verified address."
        },
        "reissue": {
          "title": "Re-issue transfer code",
          "description": "The toolbox signs in to the game with the saved sign-in info and issues a new transfer code; the previous code stops working at once. This takes a few seconds.",
          "modeLabel": "Password of the new code",
          "reuse": "Keep the previous code's password",
          "random": "Generate a random one"
        },
        "destroy": {
          "title": "Delete this record?",
          "description": "Make sure you have transferred the account back to your phone. After deleting, this account's code can no longer be shown or re-issued.",
          "confirm": "Delete"
        },
        "reset": {
          "title": "Reset the vault?",
          "description": "This deletes all {count} record(s) in the vault and cannot be undone. Use it only if you cannot remember your previous sign-in password (for example after setting a new one because you forgot it) or forgot your vault PIN.",
          "password": "Current Haruki Toolbox sign-in password",
          "ack": "I understand that every record will be deleted",
          "confirm": "Reset and delete all records",
          "done": "Vault reset; {count} record(s) deleted"
        },
        "passwordChanged": {
          "title": "Enter your previous sign-in password",
          "description": "You changed your Haruki Toolbox sign-in password, but the vault is still locked with the old one. Enter the old password once and the vault switches to your current password.",
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
        "invalid_request": "The request was malformed; reload the page and try again.",
        "invalid_server": "Only JP and Global are supported.",
        "invalid_upload_type": "Unsupported data type.",
        "inherit_id_invalid": "The transfer ID must be 16 letters or digits.",
        "inherit_password_invalid": "Enter the transfer password (at most 64 characters).",
        "new_password_mode_invalid": "Choose how to set the new code's password.",
        "reuse_password_invalid": "This password cannot be kept (8–16 half-width characters, no spaces); choose \"Generate a random one\".",
        "mysekai_requires_qq": "Uploading MySekai data requires binding and verifying a QQ account under HarukiBot data authorization.",
        "job_already_running": "You already have a transfer in progress; finish or cancel it first.",
        "rate_limited": "Too many submissions (at most 10 per hour); please try again later.",
        "server_busy": "Too many people are using this right now; please try again later.",
        "game_degraded": "The game server is unstable at the moment; please try again later.",
        "vault_unavailable": "Transfer-code uploads are unavailable right now; please try again later.",
        "identity_unavailable": "Your account details cannot be checked right now; please try again later.",
        "store_unavailable": "The service is unavailable right now; please try again later.",
        "job_not_found": "The record of this transfer does not exist or has expired.",
        "job_not_awaiting_confirm": "This transfer is no longer waiting for confirmation (it may already be confirmed, cancelled or timed out); check the progress above.",
        "cannot_cancel": "The transfer has already started and can no longer be cancelled.",
        "unauthenticated": "Your session has ended; sign in to Haruki Toolbox again.",
        "ws_ticket_invalid": "The connection dropped; reconnecting…",
        "internal_error": "Something went wrong on the server; please try again later.",
        "password_required": "Enter your Haruki Toolbox sign-in password.",
        "vault_pin_required": "Enter your vault PIN.",
        "vault_pin_invalid_format": "The vault PIN must be 8 to 128 characters.",
        "password_invalid": "Wrong sign-in password. Enter the password you sign in to this website with, not the game's transfer password.",
        "vault_pin_invalid": "Wrong vault PIN; please try again.",
        "previous_password_invalid": "That is not the previous sign-in password; please try again. If you cannot remember it, the only way forward is resetting the vault.",
        "vault_password_changed": "You changed your sign-in password; enter the password you had before the change once.",
        "vault_not_initialized": "You have not used the vault yet; it is created when you first confirm a transfer.",
        "unlock_rate_limited": "Too many wrong attempts; to protect your account, please try again in 15 minutes.",
        "entry_not_found": "This record does not exist or has expired.",
        "entry_stale": "This record was saved before the vault was reset and can no longer be opened.",
        "code_not_available": "This record has no code to show right now (older than 24 hours or never issued); press \"Re-issue\".",
        "no_previous_password": "There is no previous transfer password to keep; choose \"Generate a random one\".",
        "reset_confirmation_required": "Tick the confirmation first.",
        "reissue_failed": "Re-issuing the transfer code failed; please try again later.",
        "reissue_login_failed": "The saved sign-in info no longer signs in to the game; it may have expired.",
        "reissue_rejected": "The game server refused the request; please try again later.",
        "client_update_required": "This page is out of date; please reload it.",
        "retryAfter": "Try again in {seconds} s.",
        "network": "Cannot reach the server; check your connection and try again.",
        "unknown": "The request failed (HTTP {status}); please try again later."
      }
    },
    "pointCalculator": {
      "title": "Event Pt Score Control Calculator",
      "description": "Calculate the event bonus and score ranges needed for a target event Pt value.",
      "tips": {
        "title": "Tip",
        "beta": "Beta",
        "boostConfig": "Before score control, make sure your Live Boost setting is correct to avoid missing the target.",
        "testingPrefix": "This feature is still being tested.",
        "testingSuffix": " If you run into any issue, please contact Haruki Dev Team.",
        "deckRecommend": "Score-control results include a Bonus deck button for quick deck recommendation."
      },
      "fields": {
        "region": "Data server",
        "music": "Music",
        "loadingMusic": "Preparing music...",
        "musicPlaceholder": "Select a music",
        "musicSearchPlaceholder": "Search music name, #ID, kana, pinyin, or romaji...",
        "musicEmpty": "No music found.",
        "targetPt": "Target event Pt",
        "targetPtPlaceholder": "Enter target event Pt",
        "targetPtInvalid": "Target event Pt must be a whole number greater than 0.",
        "maxResults": "Max results",
        "maxResultsPlaceholder": "Default 10",
        "bonusRange": "Custom bonus range",
        "bonusRangeHelp": "Only searches event bonuses within this range. Defaults to 100%-435%, accepts 0%-1000%.",
        "customBonusFloor": "Custom bonus floor",
        "customBonusFloorPlaceholder": "Default 100",
        "customBonusCap": "Custom bonus cap",
        "customBonusCapPlaceholder": "Default 435",
        "bonusRangeInvalid": "Bonus range must use integers from 0 to 1000, and the floor cannot be greater than the cap.",
        "boostIndex": "Live Boost",
        "boostIndexAll": "All Live Boost levels",
        "boostIndexOption": "{index} Live Boost ({rate}x)",
        "advanced": "Advanced options"
      },
      "actions": {
        "calculate": "Calculate",
        "buildDeck": "Bonus deck"
      },
      "meta": {
        "title": "Calculation data",
        "music": "Music: {value}",
        "basicPoint": "Basic Pt: {value}",
        "bonusRange": "Bonus range: {min}%-{max}%",
        "missingBasicPoint": "This song has no base Pt data yet. Pick another song or difficulty."
      },
      "result": {
        "title": "Calculation result",
        "placeholder": "Results will appear here after entering a target event Pt.",
        "summary": "{count} plan(s) found.",
        "empty": "No calculation result yet.",
        "deckBonus": "Required bonus {value}%",
        "boost": "{index} Live Boost / {rate}x",
        "scoreRangeLabel": "Playable score range",
        "noMatchTitle": "No matching plan found",
        "noMatchDescription": "Try adjusting target Pt, Live Boost, or the custom bonus cap."
      }
    }
  },
  "botNeo": {
    "title": "HarukiBot NEO Registration",
    "description": "Register a HarukiBot NEO instance and obtain your Bot credential",
    "disabled": {
      "title": "Registration unavailable",
      "description": "HarukiBot NEO registration is currently closed. Please try again later.",
      "retryButton": "Retry"
    },
    "input": {
      "warningTitle": "Warning",
      "warningDescription": "Please register with your personal QQ main account (not the QQ account used to connect HarukiBot NEO as a Bot), otherwise you will be denied access to the QQ group.",
      "warningGroup": "NEO Distributed QQ Group: 111612548",
      "qqLabel": "QQ number",
      "qqPlaceholder": "Enter your QQ number",
      "hint": "A 6-digit verification code will be sent to your QQ mailbox ({qq}{'@'}qq.com). The code is valid for 10 minutes.",
      "hintQqPlaceholder": "your QQ number",
      "sendButton": "Send verification code",
      "cooldownButton": "Retry in {seconds}s"
    },
    "verify": {
      "codeSentHint": "A verification code has been sent to {qq}{'@'}qq.com. Please check your mailbox.",
      "codeLabel": "Verification code",
      "codePlaceholder": "Enter 6-digit code",
      "backButton": "Back",
      "registerButton": "Register",
      "resendButton": "Resend code",
      "resendCooldown": "Resend in {seconds}s"
    },
    "result": {
      "successTitle": "Registration successful",
      "successDescription": "Your HarukiBot NEO instance has been created. Please save the credentials below.",
      "botIdLabel": "Bot ID",
      "credentialLabel": "Credential",
      "copyAction": "Copy {label}",
      "saveWarning": "The credential is shown only once. Please copy and save it securely — it cannot be retrieved again.",
      "configGeneratorTitle": "Continue to Client config",
      "configGeneratorDescription": "Open the config generator with the Bot ID and credential filled in. Then complete ports, modules, and access lists.",
      "configGeneratorButton": "Open config generator",
      "registerAnotherButton": "Register another"
    },
    "toast": {
      "statusCheckFailed": "Failed to check registration status",
      "statusCheckFailedFallback": "Check your connection and click Retry; if it keeps failing the service may be temporarily unavailable.",
      "sendFailedTitle": "Send failed",
      "sendFailedFallback": "The code was not sent. Check the QQ number and retry; if it keeps failing, try again later.",
      "missingQQNumber": "Enter your QQ number",
      "invalidQQNumber": "Please enter a valid QQ number (5–12 digits)",
      "rateLimitedTitle": "Rate limited",
      "rateLimitedDescription": "Too many requests. Please retry after {seconds} seconds.",
      "alreadyRegisteredTitle": "Already registered",
      "alreadyRegisteredDescription": "This QQ number already has a registered Bot.",
      "registrationDisabledTitle": "Registration disabled",
      "registrationDisabledDescription": "Registration is currently closed.",
      "codeSentTitle": "Verification code sent",
      "codeSentDescription": "Please check the mailbox of QQ {qq}.",
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
    "description": "Real-time CN-server Multi Live room numbers collected from social media.",
    "viewOnSekaiStation": "View on Sekai Station",
    "notConfigured": "Sekai Station is temporarily unavailable",
    "connection": {
      "connected": "Connected",
      "connecting": "Connecting…",
      "disconnected": "Disconnected",
      "failed": "Unable to reach the server",
      "retryIn": "Retrying in {n}s",
      "retryNow": "Retry now",
      "reconnecting": "Reconnecting…",
      "online": "{n} online"
    },
    "rooms": {
      "list": "Room list",
      "empty": "No rooms right now",
      "emptyFiltered": "No rooms match your filters",
      "loading": "Loading…",
      "copyId": "Copy room number",
      "copyText": "Copy text",
      "openOriginal": "Open original post",
      "pin": "Pin",
      "unpin": "Unpin",
      "copied": "Copied",
      "copyFailed": "Copy failed",
      "more": "More actions",
      "idHint": "Click to copy · hold 1 s to hide for 10 min",
      "block": "Hide for 10 min",
      "blocked": "Hid {id} for 10 minutes",
      "undo": "Undo"
    },
    "settings": {
      "title": "Filter & display",
      "filter": "Filter",
      "mode": "Mode",
      "blacklist": "Blacklist",
      "blacklistDesc": "Hide rooms containing these keywords",
      "whitelist": "Whitelist",
      "whitelistDesc": "Only show rooms containing these keywords",
      "presetTags": "Presets",
      "keywordPlaceholder": "Add keyword",
      "add": "Add",
      "clear": "Clear",
      "removeFilter": "Remove filter \"{name}\"",
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
      "title": "Hidden for now",
      "hint": "Shown again after 10 minutes",
      "empty": "Hold a room number for 1 s to hide it",
      "minutesLeft": "{n} min left",
      "unblock": "Unhide {id}",
      "unblockOne": "Unhide",
      "unblockAll": "Unhide all"
    }
  }
} as const
