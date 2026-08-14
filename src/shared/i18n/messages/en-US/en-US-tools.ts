// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: tools, botNeo
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
          "description": "Set local ports, Bot ID, credential, and optional crypto fields."
        },
        "routing": {
          "title": "Network routing",
          "description": "Configure dynamic primary/alternative cloud endpoints or pin a fixed endpoint."
        },
        "runtime": {
          "title": "Runtime policy",
          "description": "Control help, CN features, reply quoting, and global command limits."
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
        "authEncryptionKey": {
          "label": "Auth encryption key",
          "placeholder": "Optional 64-char hex AES-256 key"
        },
        "noiseServerPubkey": {
          "label": "Noise server public key",
          "placeholder": "Usually received from auth response"
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
          "placeholder": "Leave empty to use the built-in EdgeOne default",
          "help": "Used for production/alternative failover. Ignored when a pinned endpoint is set."
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
        "dynamicDescription": "When serverEndpointOverride is empty, the client reads routingConfigURL. If routingConfigURL is empty, it uses the built-in EdgeOne default.",
        "pinnedDescription": "When serverEndpointOverride is non-empty, the client uses that endpoint directly and does not read dynamic routing config."
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
          "dynamicRouting": "routingConfigURL is the new dynamic routing entry. Leave it empty for the default production config.",
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
      "title": "iOS Module Generator",
      "description": "Generate custom iOS proxy modules",
      "tutorialAlert": {
        "textBefore": "This tutorial can be viewed by ",
        "linkText": "clicking here",
        "textAfter": ".",
        "nonZhWarning": "Please note that this tutorial is only available in Simplified Chinese."
      },
      "qxScriptWarning": "Quantumult X does not support script upload mode",
      "cnRestriction": "Due to legal restrictions, CN MySekai module installation is not provided.",
      "installButton": "Quick Install Module",
      "installHint": "Clicking this will invoke the target app's install scheme",
      "copyLabel": {
        "uploadCode": "Upload code",
        "moduleUrl": "Module URL",
        "scriptUrl": "Script URL"
      },
      "steps": {
        "configure": {
          "title": "Configure",
          "description": "Choose the proxy app, toolbox endpoint, and upload mode."
        },
        "scope": {
          "title": "Scope",
          "description": "Choose the regions and data types to upload."
        },
        "install": {
          "title": "Get & Install",
          "description": "Generate an upload code, then copy the URLs or quick install the module."
        }
      },
      "sections": {
        "software": {
          "title": "Select app",
          "description": "Choose the proxy app to install the module into",
          "placeholder": "Select app"
        },
        "endpoint": {
          "title": "Select toolbox endpoint",
          "description": "Choose the toolbox backend endpoint\nDirect is recommended by default\nIf you're outside mainland China and direct access is unstable, CDN may help",
          "placeholder": "Select endpoint"
        },
        "mode": {
          "title": "Select upload mode",
          "description": "Script upload can coexist with other bots and avoids toolbox proxy downtime, but may be less stable\nIf script upload is unstable, switch to the redirect proxy method",
          "placeholder": "Select upload mode"
        },
        "chunk": {
          "title": "Chunk size",
          "description": "Larger chunks can improve in-game speed, but may be less stable in some clients\nDo not change this unless you know what it does",
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
        "description": "Used to validate access to module and script endpoints",
        "regenerate": "Regenerate",
        "generate": "Generate Upload Code",
        "loginRequired": "Sign in required"
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
        "proxy": "Redirect proxy",
        "script": "Script Upload"
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
          "label": "Suite",
          "description": "Upload full data for your game account"
        },
        "mysekai": {
          "label": "MySekai",
          "description": "Upload MySekai data for your game account"
        },
        "mysekai_force": {
          "label": "MySekai (force refresh)",
          "description": "Force refresh MySekai data on every launch"
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
        "generateCodeFailedFallback": "Unknown error",
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
      "tutorialNotice": {
        "title": "Other upload methods",
        "androidProxy": {
          "platform": "Android / Windows",
          "linkText": "HarukiProxy guide"
        },
        "iosModule": {
          "platform": "iOS / iPadOS",
          "linkText": "Use the iOS module"
        }
      },
      "tabs": {
        "file": "File upload",
        "inherit": "Transfer-code upload",
        "ios": "iOS module"
      },
      "region": {
        "jp": "JP",
        "en": "Global",
        "tw": "TW",
        "kr": "KR",
        "cn": "CN"
      },
      "dataTypes": {
        "suite": "Suite",
        "mysekai": "MySekai"
      },
      "disabledReason": {
        "loginRequired": "Please sign in to use this feature",
        "noBoundAccount": "No bound accounts found. Please bind an account first."
      },
      "uploadStatus": {
        "uploading": "Uploading your {dataType} data...",
        "success": "Upload successful",
        "failed": "Upload failed"
      },
      "toast": {
        "selectAccount": "Please select an account",
        "selectFile": "Please select a file",
        "operationForbiddenTitle": "Submission forbidden",
        "operationForbiddenDescription": "This action is not allowed due to legal restrictions",
        "uploadSuccessTitle": "Upload successful",
        "uploadSuccessFileFallback": "File uploaded",
        "uploadSuccessInheritFallback": "Transfer code uploaded",
        "uploadFailedTitle": "Upload failed",
        "uploadFailedFallback": "Upload failed",
        "inheritIncompleteTitle": "Please complete transfer-code info",
        "inheritIncompleteDescription": "Transfer ID and password are both required",
        "inheritIdInvalidTitle": "Invalid transfer ID",
        "inheritIdInvalidDescription": "Transfer ID must be 16 alphanumeric characters (case-sensitive)"
      },
      "fileTab": {
        "title": "Manual file upload",
        "description": "Upload captured data files manually",
        "unavailableTitle": "Unavailable",
        "forbiddenTitle": "Operation forbidden",
        "forbiddenDescription": "This action is not allowed due to legal restrictions",
        "fields": {
          "file": "Upload file",
          "account": "Select account (region / UID)",
          "accountPlaceholder": "Select a bound account",
          "dataType": "Select data type",
          "dataTypePlaceholder": "Select data type"
        },
        "submit": "Submit",
        "submitting": "Submitting..."
      },
      "inheritTab": {
        "title": "Transfer-code data upload",
        "description": "Submit your transfer code so backend can capture required data",
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
            "title": "Warning",
            "description": "Keep your transfer ID and password safe. Haruki Toolbox server does not store them."
          },
          "warning2": {
            "title": "Warning",
            "line1": "Although requests are optimized to resemble normal app traffic, you still bear the usage risk.",
            "line2": "If this risk is unacceptable to you, please do not use this feature."
          },
          "reminder1": {
            "title": "Reminder",
            "line1": "Transfer info is stored locally only when you explicitly opt in on this device.",
            "line2": "Local storage expires after 24 hours, and unchecking the option clears saved info immediately."
          },
          "reminder2": {
            "title": "Reminder",
            "line1": "This feature does not require signing in to Haruki Toolbox",
            "line2": "But if target game account is not bound in Haruki Toolbox",
            "line3": "Data will not be written to database even if upload appears successful",
            "line4": "Please bind your target game account first",
            "bindLink": "Bind game account"
          }
        },
        "remember": {
          "label": "Temporarily remember transfer info on this device",
          "description": "Stored only in this browser, expires after 24 hours, and is cleared immediately when unchecked."
        },
        "confirmDialog": {
          "title": "Confirm data upload",
          "dataTypePrefix": "Please confirm the data type you want to upload:",
          "mysekaiNotice": "To upload MySekai data, sign in to Haruki Toolbox first and make sure your QQ number is bound under HarukiBot data authorization.",
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
        "missingBasicPoint": "This music has no music metas basic Pt data."
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
      "credentialLabel": "Credential (JWT)",
      "saveWarning": "The credential is shown only once. Please copy and save it securely — it cannot be retrieved again.",
      "configGeneratorTitle": "Continue to Client config",
      "configGeneratorDescription": "Open the config generator with ownerId, Bot ID, and Credential prefilled. Then complete ports, modules, and access lists.",
      "configGeneratorButton": "Open config generator",
      "registerAnotherButton": "Register another"
    },
    "toast": {
      "statusCheckFailed": "Failed to check registration status",
      "sendFailedTitle": "Send failed",
      "invalidQQNumber": "Please enter a valid QQ number",
      "rateLimitedTitle": "Rate limited",
      "rateLimitedDescription": "Too many requests. Please retry after {seconds} seconds.",
      "alreadyRegisteredTitle": "Already registered",
      "alreadyRegisteredDescription": "This QQ number already has a registered Bot.",
      "registrationDisabledTitle": "Registration disabled",
      "registrationDisabledDescription": "Registration is currently closed.",
      "codeSentTitle": "Verification code sent",
      "codeSentDescription": "Please check the mailbox of QQ {qq}.",
      "registerFailedTitle": "Registration failed",
      "missingVerificationCode": "Please enter the verification code",
      "incompleteResponse": "Incomplete response data",
      "registerSuccessTitle": "Registration successful",
      "clipboardUnsupported": "Clipboard is not supported in this environment",
      "copySuccess": "{label} copied to clipboard",
      "copyFailed": "Failed to copy to clipboard"
    }
  }
} as const
