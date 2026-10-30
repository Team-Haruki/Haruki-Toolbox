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
        "description": "Enter the in-game transfer ID and password. The toolbox first shows you the account to confirm, executes the transfer only after you confirm, and right away issues you a new transfer code.",
        "loginRequired": {
          "title": "Sign in to the toolbox first",
          "description": "Transfer-code uploads need a Haruki Toolbox account: after the transfer, the account credential and the new transfer code are kept encrypted in your vault, readable only by you.",
          "action": "Sign in"
        },
        "fields": {
          "inheritId": "Transfer ID",
          "inheritIdPlaceholder": "Enter transfer ID",
          "inheritPassword": "Transfer password",
          "inheritPasswordPlaceholder": "Enter transfer password",
          "server": "Select region",
          "serverPlaceholder": "Select region",
          "dataType": "Select data type",
          "dataTypePlaceholder": "Select data type"
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
          "notesTitle": "How it works and what to know",
          "warning1": {
            "title": "After the transfer, your phone can no longer sign in",
            "description": "JP transfer codes are valid for 24 hours and work once. Once the toolbox executes the transfer, the device that generated the code can no longer sign in to the account; the new transfer code the toolbox issues is your way back, so be sure to write it down."
          },
          "warning2": {
            "title": "Risk",
            "text": "This feature signs in by imitating the game client with your transfer code. The publisher could in theory treat that as an unusual login; judge the risk yourself, and prefer HarukiProxy or the iOS module if unsure."
          },
          "flow": {
            "title": "Steps",
            "step1": "First the account is only looked up (the code is not used); check the nickname and rank.",
            "step2": "The transfer runs only after you confirm with your Toolbox password (or vault PIN). Until then you can cancel and the code stays valid.",
            "step3": "Right after the transfer a new transfer code is issued and shown on this page, and stored encrypted in your vault, where you can see it again for 24 hours.",
            "step4": "Finally the game data is fetched and saved. Even if this step fails, the new code is kept."
          },
          "storage": {
            "title": "What we store",
            "text": "The code you enter is only used while the job runs and is not stored. After the transfer, the account's login credential (at most 7 days) and the newly issued code (24 hours) are stored encrypted with a key that only your Toolbox password or vault PIN opens; staff cannot read them. You can destroy them at any time in the vault below."
          },
          "reminder2": {
            "title": "Reminder",
            "text": "Bind the game account under Game account bindings first. Without a binding, the data is not saved even if the upload reports success.",
            "bindLink": "Bind account"
          }
        },
        "submit": "Look up account",
        "submitting": "Submitting..."
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
          "bootstrap": "Prepare connection",
          "preview": "Read account info",
          "awaiting_confirm": "Wait for your confirmation",
          "execute": "Execute transfer",
          "vault_store_credential": "Store the account credential in the vault",
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
          "auth": "Authenticate",
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
          "unknown": "It is unclear whether the code you entered was used. Do not retry it on another device, and check the vault below for a stored credential."
        },
        "errorTitle": "Transfer not completed",
        "issueFailedTitle": "No new transfer code was issued",
        "cancelledTitle": "Cancelled",
        "succeededTitle": "Upload complete",
        "succeededDescription": "The account data has been saved.",
        "expired": "This job's record has expired (job records are kept for 1 hour). The new code can still be viewed in the vault below.",
        "errors": {
          "inherit_invalid": "The transfer code is invalid, already used or expired. Generate a new code in the game and try again.",
          "inherit_restricted": "The game does not allow transfers for this account right now.",
          "transfer_restricted": "This account has no transfers left during the current event; nothing was executed.",
          "confirm_timeout": "Not confirmed within 5 minutes; the job was cancelled and nothing was executed.",
          "cancelled": "Cancelled; nothing was executed.",
          "game_degraded": "The game server is unstable at the moment; nothing was executed. Please try again later.",
          "server_busy": "Too many transfers are running; nothing was executed. Please try again later.",
          "game_maintenance": "The game server is under maintenance.",
          "game_unavailable": "The game server cannot be reached right now.",
          "game_error": "The game server returned an error.",
          "execute_uncertain": "The connection dropped while executing the transfer, so the code may have been used. Do not retry it on another device, and check the vault below for a stored credential.",
          "login_failed": "The account credential is in the vault, but signing in failed. Re-issue a transfer code from the vault below later.",
          "fetch_failed": "Fetching the game data failed. The new code (if one was issued) is shown on this page and kept in the vault.",
          "mysekai_unavailable": "Fetching MySekai data failed; the MySekai tutorial may not be finished. The new code (if one was issued) is shown on this page and kept in the vault.",
          "upload_failed": "Saving the data failed. The new code (if one was issued) is shown on this page and kept in the vault.",
          "upload_forbidden": "This game account is bound to another Toolbox user, so it cannot be uploaded. The new code (if one was issued) is shown on this page and kept in the vault.",
          "job_interrupted": "The service restarted and the job was interrupted.",
          "internal_error": "Internal server error."
        },
        "warnings": {
          "issue_code_failed": "No new transfer code was issued. The account credential is in the vault: re-issue a code from the vault below now, it is your only way back into the account.",
          "vault_db_unavailable": "The database was unavailable; the credential is stored temporarily and will be moved over automatically.",
          "vault_store_failed": "The credential or the new code could not be stored in the vault. Write down the new code shown on this page now."
        },
        "actions": {
          "startNew": "Start a new upload",
          "refresh": "Refresh status",
          "goVault": "Go to the vault"
        },
        "ackRequired": "Confirm that you have written down the new code first",
        "toast": {
          "succeeded": "Transfer upload complete; the account data has been saved",
          "cancelled": "Cancelled; the code was not used"
        },
        "confirm": {
          "title": "Confirm the account to transfer",
          "description": "Check the account details. Your transfer code has not been used yet.",
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
          "warningTitle": "Your phone will no longer be able to sign in",
          "warningBody": "Once you confirm, the toolbox executes the transfer: the account moves off your phone and the original device can no longer sign in to it. The toolbox then issues a new transfer code and shows it on this page; use it to transfer the account back to your phone.",
          "deadline": "{time} left to confirm; after that the job is cancelled (your code stays valid).",
          "password": "Toolbox password",
          "passwordHint": "Used to encrypt the stored credential and new code so that only you can open them.",
          "passwordFirstUse": "This is your first use of the vault; your Toolbox password will protect it.",
          "pin": "Vault PIN",
          "pinHint": "Your Toolbox account has no password (Google, Apple or passkey sign-in); enter your vault PIN.",
          "pinCreate": "Set a vault PIN",
          "pinCreateHint": "Your Toolbox account has no password, so choose a vault PIN (8–128 characters). It cannot be recovered: if you forget it, the only way forward is resetting the vault, which destroys its records.",
          "pinRepeat": "Repeat the PIN",
          "pinMismatch": "The PINs do not match",
          "pinFormat": "The PIN must be 8–128 characters",
          "passwordRequired": "Enter your Toolbox password",
          "previousPassword": "Previous password",
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
          "singleUse": "The new code is valid for 24 hours and works once. Your phone can no longer sign in; this code is your way back.",
          "savedToVault": "Stored encrypted in your vault; you can view it again in the vault below for 24 hours.",
          "unsavedTitle": "Write this code down now",
          "unsavedBody": "This code could not be stored in the vault and cannot be shown again once you leave this page. Copy it or take a screenshot now.",
          "ack": "I have written it down",
          "acked": "Written down"
        }
      },
      "inheritVault": {
        "title": "Transfer vault",
        "description": "When you upload with a transfer code, the toolbox keeps the account credential (7 days) and the newly issued code (24 hours) here, encrypted so that only your Toolbox password or vault PIN opens them. Every view or re-issue is logged and emailed to you.",
        "empty": "The vault is empty.",
        "notInitialized": "You have not used the vault yet; it is created when you first confirm a transfer.",
        "loadFailed": "Could not load the vault",
        "refresh": "Refresh",
        "entry": {
          "title": "{server} · {uid}",
          "createdAt": "Transferred {time}",
          "credential": "Credential",
          "code": "Transfer code",
          "expiresIn": "{time} left",
          "expired": "Expired",
          "noCode": "No usable code",
          "currentCode": "Current transfer code",
          "unreadable": "This record belongs to a vault that was reset and cannot be read.",
          "pending": "Parked until the database is back"
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
          "description": "Enter your secret to open the vault. Every view is logged and emailed to your verified address."
        },
        "reissue": {
          "title": "Re-issue transfer code",
          "description": "The toolbox signs in with the stored credential and issues a new transfer code; the previous code stops working at once. This takes a few seconds.",
          "modeLabel": "Password of the new code",
          "reuse": "Keep the previous code's password",
          "random": "Generate a random one"
        },
        "destroy": {
          "title": "Destroy this record?",
          "description": "Confirm that you have transferred the account back to your phone. The record becomes unreadable at once and is deleted within minutes; its code can no longer be shown or re-issued.",
          "confirm": "Destroy"
        },
        "reset": {
          "title": "Reset vault",
          "description": "Resetting discards your vault key and destroys all {count} record(s). This cannot be undone. Use it only if you forgot the previous password (for example after resetting your Toolbox password through account recovery) or your vault PIN.",
          "password": "Current Toolbox password",
          "ack": "I understand that every record will be destroyed",
          "confirm": "Reset and destroy all records",
          "done": "Vault reset; {count} record(s) destroyed"
        },
        "passwordChanged": {
          "title": "Your previous password is needed",
          "description": "Your Toolbox password changed after the vault was created. Enter the password you had before; from then on the vault is protected by the new one.",
          "forgot": "Forgot the previous password (for example after an account recovery)? The only way forward is resetting the vault, which destroys its records.",
          "resetAction": "Reset vault"
        },
        "unlock": {
          "password": "Toolbox password",
          "pin": "Vault PIN",
          "submit": "Unlock"
        },
        "toast": {
          "destroyed": "Record destroyed",
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
        "job_already_running": "You already have a transfer job running; finish or cancel it first.",
        "rate_limited": "Too many submissions (at most 10 per hour); please try again later.",
        "server_busy": "Too many transfers are running; please try again later.",
        "game_degraded": "The game server is unstable at the moment; please try again later.",
        "vault_unavailable": "Transfer uploads are unavailable right now; please try again later.",
        "identity_unavailable": "Your identity cannot be verified right now; please try again later.",
        "store_unavailable": "The service is unavailable right now; please try again later.",
        "job_not_found": "The job does not exist or has expired.",
        "job_not_awaiting_confirm": "The job is not waiting for confirmation (it may already be confirmed, cancelled or timed out).",
        "cannot_cancel": "The transfer is already running and can no longer be cancelled.",
        "unauthenticated": "Sign in to the toolbox first.",
        "ws_ticket_invalid": "The live connection ticket expired; reconnecting.",
        "internal_error": "Internal server error; please try again later.",
        "password_required": "Enter your Toolbox password.",
        "vault_pin_required": "Enter your vault PIN.",
        "vault_pin_invalid_format": "The vault PIN must be 8–128 characters.",
        "password_invalid": "Wrong Toolbox password.",
        "vault_pin_invalid": "Wrong vault PIN.",
        "previous_password_invalid": "The previous password does not open the vault; try again, or reset the vault.",
        "vault_password_changed": "Your Toolbox password changed after the vault was created; enter the previous password.",
        "vault_not_initialized": "The vault has not been created yet.",
        "unlock_rate_limited": "Too many attempts; try again in 15 minutes.",
        "entry_not_found": "The record does not exist or has expired.",
        "entry_stale": "This record belongs to a vault that was reset and cannot be read.",
        "code_not_available": "This record has no usable code (expired or never issued); re-issue one.",
        "no_previous_password": "There is no previous password to keep; choose \"Generate a random one\".",
        "reset_confirmation_required": "Confirm the vault reset.",
        "reissue_failed": "Re-issuing the transfer code failed; please try again later.",
        "reissue_login_failed": "Signing in with the stored credential failed; it may no longer be valid.",
        "reissue_rejected": "The game server refused the request.",
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
