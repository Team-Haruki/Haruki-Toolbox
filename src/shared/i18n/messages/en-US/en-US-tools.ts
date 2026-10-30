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
        "uploadSuccessInheritFallback": "Transfer code submitted; account data saved",
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
        "jpSuspended": {"title": "JP transfer-code uploads are temporarily disabled", "description": "Please open the JP game immediately and generate a new transfer code to invalidate the previously used code. Keep the new code safe and do not submit it to Toolbox while this feature is suspended."},
        "title": "Transfer-code data upload",
        "description": "Enter the in-game transfer ID and password; the toolbox signs in once on your behalf and saves the account data.",
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
        "alerts": {
          "notesTitle": "Before you upload",
          "warning1": {
            "title": "Please read first",
            "description": "Keep your transfer ID and password safe; the toolbox server does not store them."
          },
          "warning2": {
            "title": "Risk",
            "text": "This feature signs in once by imitating the game client with your transfer code. The publisher could in theory treat that as an unusual login; judge the risk yourself, and prefer HarukiProxy or the iOS module if unsure."
          },
          "reminder1": {
            "title": "Reminder",
            "line1": "Transfer info is stored locally only when you explicitly opt in on this device.",
            "line2": "Local storage expires after 24 hours, and unchecking the option clears saved info immediately."
          },
          "reminder2": {
            "title": "Reminder",
            "text": "Sign in to the toolbox and bind the game account under Game account bindings first. Without a binding, the data is not saved even if the upload reports success.",
            "bindLink": "Bind account"
          }
        },
        "remember": {
          "label": "Temporarily remember transfer info on this device",
          "description": "Remembered for 24 hours after a successful submission (this browser only); unchecking clears it immediately."
        },
        "confirmDialog": {
          "title": "Confirm data upload",
          "dataTypePrefix": "Please confirm the data type you want to upload:",
          "loginNotice": "You are not signed in to the toolbox. Without a bound game account the data is not saved even if the upload reports success; sign in and bind first.",
          "mysekaiNotice": "Uploading MySekai data requires signing in to the toolbox and binding and verifying your QQ number under HarukiBot data authorization; otherwise the bot cannot look up MySekai data for you.",
          "cancel": "Cancel",
          "confirm": "Confirm upload"
        },
        "submit": "Submit",
        "submitting": "Submitting..."
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
