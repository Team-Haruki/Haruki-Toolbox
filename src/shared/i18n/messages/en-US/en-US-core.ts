// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: app, common, turnstile, auth, sidebarUser, home, gameAccountSelect, cardBox, eventRecords, musicProgress, globalSearch, costumes, gachas, playerProfile, training, searchAlias, sekaiRegion, sekaiUnreleased, navigation, webLayout, route, musicLibrary, cards, events, homeSettings, core, catalog
export default {
  "app": {
    "name": "Haruki Toolbox"
  },
  "common": {
    "save": "Save",
    "reset": "Reset",
    "cancel": "Cancel",
    "close": "Close",
    "back": "Back",
    "tip": "Tip",
    "actionFailed": "Operation failed",
    "postSuccessWarningTitle": "Operation succeeded with warnings",
    "postSuccessWarningDescription": "Follow-up refresh failed. Please reload the page if data looks outdated.",
    "guest": "Guest",
    "accountIndex": "Account {index}",
    "apiResponse": "API response",
    "missingUpdatedData": "{context} is missing updatedData"
  },
  "turnstile": {
    "loading": "Loading CAPTCHA widget...",
    "loadFailed": "Failed to load CAPTCHA widget. Please check your connection and try again.",
    "retry": "Retry loading"
  },
  "auth": {
    "common": {
      "cancel": "Cancel",
      "loadingFlow": "Loading identity flow...",
      "restartFlow": "Restart flow"
    },
    "toast": {
      "networkError": "Network error, please check your connection",
      "loginFailedTitle": "Sign-in failed",
      "accountBannedTitle": "Account banned",
      "permissionDenied": "Permission denied, please check account status",
      "tryLater": "Please try again later",
      "logoutSuccessTitle": "Signed out",
      "invalidReturnToTitle": "Sign-in flow restarted",
      "invalidReturnToDescription": "An unexpected return target was detected. A safe sign-in flow has been started."
    },
    "login": {
      "title": "Sign in to Haruki Toolbox",
      "description": "Use your email and password to sign in",
      "emailLabel": "Email",
      "emailPlaceholder": "Enter your email",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter your password",
      "forgotPassword": "Forgot password?",
      "submit": "Sign in",
      "noAccount": "No account yet?",
      "registerLink": "Register",
      "resetDialog": {
        "title": "Reset password",
        "description": "Enter your email address to reset your password",
        "sendResetEmail": "Send reset email"
      },
      "toast": {
        "enterEmail": "Please enter your email",
        "completeCaptcha": "Please complete CAPTCHA first",
        "completeLoginCaptcha": "Please complete CAPTCHA verification first",
        "resetEmailSentTitle": "Reset email sent",
        "resetEmailSentDescription": "Email has been sent to {email}",
        "resetFailedTitle": "Reset password failed",
        "loginSuccessTitle": "Sign-in successful",
        "loginSuccessDescription": "Welcome back to Haruki Toolbox"
      }
    },
    "register": {
      "title": "Register account",
      "description": "Create a new Haruki Toolbox account",
      "usernameLabel": "Username",
      "usernamePlaceholder": "Enter username",
      "emailLabel": "Email",
      "emailCodeLabel": "Email verification code",
      "emailCodePlaceholder": "Enter the code from your email",
      "passwordLabel": "Password",
      "passwordPlaceholder": "Enter password",
      "sending": "Sending...",
      "countdown": "Retry in {seconds}s",
      "sendCode": "Send code",
      "submit": "Register",
      "hasAccount": "Already have an account?",
      "goLogin": "Sign in",
      "sendCodeDialog": {
        "title": "Complete CAPTCHA before sending email",
        "description": "Please complete CAPTCHA to send your verification email",
        "confirmSend": "Confirm send"
      },
      "toast": {
        "invalidEmail": "Please enter a valid email address",
        "completeCaptcha": "Please complete CAPTCHA first",
        "completeRegisterCaptcha": "Please complete CAPTCHA verification first",
        "codeSentTitle": "Email sent",
        "codeSentDescription": "Email has been sent to {email}",
        "sendCodeFailedTitle": "Failed to send verification code",
        "sendCodeFailedDescription": "Send failed",
        "registerFailedTitle": "Registration failed",
        "registerFailedDescription": "Registration failed",
        "incompleteInfo": "Please complete all registration fields",
        "passwordMinLength": "Password must be at least {min} characters",
        "emailVerificationRequired": "Please send a verification code for the current email address",
        "registerSuccessTitle": "Registration successful",
        "registerSuccessDescription": "Welcome to Haruki Toolbox"
      }
    },
    "resetPassword": {
      "title": "Reset password",
      "description": "Reset your Haruki Toolbox account password",
      "emailLabel": "Email",
      "newPasswordLabel": "New password",
      "newPasswordPlaceholder": "Enter new password",
      "confirmPasswordLabel": "Confirm password",
      "confirmPasswordPlaceholder": "Enter new password again",
      "submit": "Confirm reset",
      "toast": {
        "invalidLink": "Reset link is invalid. Please request password recovery again.",
        "incompleteInfo": "Please complete all required fields",
        "passwordMismatch": "Passwords do not match",
        "passwordMinLength": "Password must be at least {min} characters",
        "resetSuccessTitle": "Password reset successful",
        "resetSuccessDescription": "Please sign in again",
        "resetFailedTitle": "Reset failed",
        "resetFailedDescription": "Reset failed"
      }
    },
    "verification": {
      "title": "Verify email",
      "description": "Complete the identity verification flow to activate your current email address.",
      "submit": "Submit verification"
    },
    "error": {
      "title": "Identity flow error",
      "description": "The identity service returned an error. Review details below and restart the flow.",
      "retry": "Reload",
      "backToLogin": "Back to sign in",
      "missingIdDescription": "Missing error ID. Unable to query detailed identity error information.",
      "loadFailedDescription": "Failed to load identity error details. Please try again later.",
      "fallbackDescription": "The identity flow failed. Please restart the flow.",
      "errorIdLabel": "Error ID",
      "statusCodeLabel": "Status code",
      "detailsLabel": "Details"
    }
  },
  "sidebarUser": {
    "guestInitial": "?",
    "guestName": "Not signed in",
    "accountSettings": "Account settings",
    "identitySettings": "Identity settings",
    "gameAccountManagement": "Game account management",
    "harukiBotAuthorization": "HarukiBot data authorization",
    "oauthAuthorizations": "OAuth authorizations",
    "logout": "Sign out",
    "register": "Register",
    "login": "Sign in",
    "copyToolboxId": "Copy Toolbox user ID",
    "toolboxIdCopied": "Toolbox user ID copied",
    "copyFailed": "Copy failed"
  },
  "home": {
    "title": "Welcome to Haruki Toolbox",
    "description": "Choose the feature you need",
    "aboutBanner": {
      "badge": "About & Support",
      "title": "Your support is our motivation to keep going",
      "desc": "Click to view about Project Haruki and how to sponsor our dev team"
    },
    "accountAndSettings": "Account & Settings",
    "register": "Register",
    "login": "Sign in",
    "accountSettings": "Account settings",
    "gameAccountManagement": "Game account management",
    "moreLinks": "More",
    "accountCard": {
      "title": "My account",
      "dataUpdatedAt": "Data uploaded at {time}",
      "noUploadData": "This account has not uploaded any data yet",
      "guestDescription": "Sign in and bind a game account to upload data, view your profile and unlock personalized features."
    },
    "externalLinks": "External links",
    "harukiBotDocs": "HarukiBot NEO docs",
    "harukiGithub": "Haruki GitHub",
    "legalLinks": "Legal",
    "privacyPolicy": "Privacy Policy",
    "termsOfService": "Terms of Service",
    "currentEvent": {
      "title": "Current event ({region})",
      "optInHint": "Load Sekai master data to show the ongoing event.",
      "load": "Load current event",
      "none": "No event is currently running.",
      "error": "Failed to load event info.",
      "ended": "Ended",
      "remainingDays": "{days}d {hours}h remaining",
      "remainingHours": "{hours}h {minutes}m remaining",
      "remainingMinutes": "{minutes}m remaining",
      "badge": "Live now",
      "links": {
        "rankBorder": "Border lines",
        "deckRecommend": "Deck",
        "detail": "Details"
      }
    }
  },
  "gameAccountSelect": {
    "placeholder": "Select a game account",
    "verified": "Verified",
    "default": "Default",
    "none": "No game account is bound to your profile yet.",
    "manage": "Manage bindings",
    "grantedBadge": "Granted",
    "groups": {
      "own": "My bound accounts",
      "granted": "Granted to me"
    }
  },
  "cardBox": {
    "title": "My Cards",
    "description": "View your game account's card collection progress",
    "entryLink": "My Cards",
    "noAccountHint": "Bind and select a game account to view your cards.",
    "dataAsOf": "Data as of {time}",
    "refresh": "Refresh",
    "loadError": "Failed to load your card collection data",
    "retry": "Retry",
    "unknownCharacter": "Unknown character",
    "empty": "No cards match the current view.",
    "total": "{total} cards",
    "summary": "{owned}/{total} collected · {percent}%",
    "nav": {
      "label": "Jump to character"
    },
    "sections": {
      "collapseAll": "Collapse all",
      "expandAll": "Expand all"
    },
    "sort": {
      "id": "ID",
      "rarity": "Rarity",
      "level": "Level",
      "masterRank": "Master rank"
    },
    "group": {
      "label": "Group by",
      "character": "By character",
      "attr": "By attribute",
      "all": "All cards"
    },
    "ownership": {
      "label": "Show",
      "all": "All",
      "owned": "Owned",
      "missing": "Missing"
    },
    "filter": {
      "attrs": "Attribute",
      "rarity": "Rarity"
    },
    "stats": {
      "title": "Collection stats",
      "byUnit": "By unit",
      "byAttr": "By attribute",
      "byRarity": "By rarity",
      "rarities": {
        "rarity_1": "1 star",
        "rarity_2": "2 stars",
        "rarity_3": "3 stars",
        "rarity_4": "4 stars",
        "rarity_birthday": "Birthday"
      },
      "ownedOfTotal": "{owned}/{total}",
      "percent": "{percent}%"
    },
    "badge": {
      "level": "Lv.{level}"
    }
  },
  "eventRecords": {
    "title": "Event Records",
    "description": "View your game account's event participation records",
    "idle": "Select a game account to view your event records.",
    "loading": "Loading account snapshot and event data...",
    "missingUserData": "No game data has been uploaded for this account yet. Upload it first to view event records.",
    "missingGrantedData": "The account owner has not uploaded game data yet, so there is nothing to view for now.",
    "uploadData": "Upload game data",
    "noData": "No event records found in this account's snapshot.",
    "loadFailed": "Failed to load event records.",
    "retry": "Retry",
    "refresh": "Refresh",
    "dataAsOf": "Data as of {time}",
    "summary": {
      "participated": "Events participated",
      "bestPoint": "Best event PT",
      "averagePoint": "Average event PT"
    },
    "filters": {
      "lastYear": "Past year",
      "all": "All",
      "custom": "Custom",
      "from": "From",
      "to": "To",
      "type": "Event type"
    },
    "trend": {
      "title": "Event PT trend",
      "empty": "Not enough records to draw a trend yet.",
      "point": "Event PT",
      "rank": "Event rank",
      "showAll": "Show all",
      "zoomHint": "Drag or resize the selection below to focus on a range of events"
    },
    "table": {
      "title": "Event history",
      "event": "Event",
      "type": "Type",
      "point": "Event PT",
      "rank": "Rank",
      "rankFromHonor": "No exact rank data; tier derived from the event honor"
    },
    "worldLink": {
      "chapterLabel": "Chapter {no}",
      "finale": "Finale"
    }
  },
  "musicProgress": {
    "title": "Music progress",
    "description": "View your game account's music play progress and claimable rewards",
    "rewards": {
      "title": "Obtainable rewards",
      "hint": "Unclaimed song achievement rewards (score ranks + per-difficulty combo milestones).",
      "unavailable": "This snapshot has no achievement claim data (userMusicAchievements), so obtainable rewards cannot be computed.",
      "jewel": "Crystals",
      "coin": "Coins",
      "shard": "Shards",
      "scoreRank": "Score rank",
      "allClaimed": "All claimed"
    },
    "dataAsOf": "Data as of {time}",
    "refresh": "Refresh",
    "retry": "Retry",
    "noAccount": "Select or bind a game account to view your play progress.",
    "loading": "Loading account snapshot and music data...",
    "missingUserData": "No game data has been uploaded for this account yet. Upload it first to view music progress.",
    "missingGrantedData": "The account owner has not uploaded game data yet, so there is nothing to view for now.",
    "uploadData": "Upload game data",
    "noResults": "This snapshot contains no music play results yet; all songs are shown as unplayed.",
    "suiteError": "Failed to load the account snapshot data.",
    "masterError": "Failed to load music data: {message}",
    "downloading": "Downloading masterdata ({progress}%)...",
    "overallTitle": "All difficulties",
    "levelsTitle": "Progress by level",
    "noSongs": "No songs exist for this difficulty on the selected server.",
    "level": "Lv.{level}",
    "levelUnknown": "Lv.?",
    "songCount": "{count} songs",
    "songFilter": {
      "label": "Show",
      "all": "All",
      "notAllPerfect": "Not AP",
      "notFullCombo": "Not FC",
      "notCleared": "Not cleared"
    },
    "sections": {
      "collapseAll": "Collapse all",
      "expandAll": "Expand all"
    },
    "matchCount": "{count} / {total} songs",
    "noMatches": "No songs match in this level.",
    "rewardsRemaining": "Remaining: {list}",
    "detailSummary": "{total} songs · {cleared} cleared · {fullCombo} FC · {allPerfect} AP",
    "summary": {
      "total": "Songs",
      "cleared": "Cleared",
      "fullCombo": "Full combo",
      "allPerfect": "All perfect"
    },
    "legend": {
      "allPerfect": "All perfect",
      "fullCombo": "Full combo (no AP)",
      "clear": "Clear (no FC)",
      "unplayed": "Unplayed"
    },
    "status": {
      "allPerfect": "AP",
      "fullCombo": "FC",
      "clear": "CLEAR",
      "unplayed": "—"
    }
  },
  "globalSearch": {
    "title": "Quick search",
    "description": "Search music, cards, and events from local masterdata",
    "placeholder": "Search music, cards, events...",
    "typeToSearch": "Type to search music, cards, and events",
    "error": "Failed to load masterdata",
    "retry": "Retry",
    "empty": "No results found",
    "groups": {
      "music": "Music",
      "card": "Cards",
      "event": "Events"
    },
    "footerRegion": "Data region: {region}",
    "footerHint": "{shortcut} to toggle search"
  },
  "costumes": {
    "dressup": {
      "title": "Costume Dressup",
      "description": "Mix and match character costumes, accessories and hairstyles in 3D",
      "region": "Server",
      "character": "Character",
      "characterPlaceholder": "Select a character",
      "body": "Costume",
      "head": "Accessory",
      "hair": "Hairstyle",
      "partPlaceholder": "Select a part",
      "searchPlaceholder": "Search by name or ID...",
      "empty": "No matches found.",
      "hairLockedHint": "This accessory has a fixed hairstyle, so the hairstyle slot has no effect.",
      "reset": "Reset to defaults",
      "rotateLeft": "Turn left",
      "rotateRight": "Turn right",
      "resetView": "Face front",
      "zoomIn": "Zoom in",
      "zoomOut": "Zoom out",
      "copyLink": "Copy link",
      "linkCopied": "Link copied",
      "colorCount": "{count} colors",
      "linkCopyFailed": "Could not copy. Copy the address bar instead.",
      "loadError": "Failed to load costume data.",
      "roleLoadError": "Failed to load the character's 3D part list.",
      "retry": "Retry"
    },
    "viewer": {
      "loadError": "Failed to load the 3D model.",
      "retry": "Retry",
      "idle": "Select a costume to preview."
    }
  },
  "gachas": {
    "common": {
      "region": "Region",
      "loadError": "Failed to load gacha data",
      "retry": "Retry",
      "dateFallback": "TBA"
    },
    "type": {
      "ceil": "Spark Gacha",
      "normal": "Regular",
      "beginner": "Beginner",
      "sunormal": "Bonus Paid Gacha",
      "subeginner": "Bonus Beginner Gacha",
      "return": "Comeback",
      "unknown": "Other"
    },
    "status": {
      "ongoing": "Ongoing",
      "ended": "Ended"
    },
    "list": {
      "title": "Gacha catalog",
      "description": "Browse Project Sekai gacha banners and rates",
      "searchPlaceholder": "Search by name or ID...",
      "typeLabel": "Type",
      "allTypes": "All types",
      "statusLabel": "Status",
      "allStatuses": "All statuses",
      "yearLabel": "Year",
      "allYears": "All years",
      "cardLabel": "Featuring card",
      "allCards": "All cards",
      "cardSearchPlaceholder": "Search by card name or ID...",
      "cardEmpty": "No cards found.",
      "removeCardFilter": "Remove card filter",
      "sortLabel": "Sort",
      "filtersTitle": "Filters",
      "resetFilters": "Reset filters",
      "total": "{total} gachas",
      "empty": "No gachas match the current filters"
    },
    "sort": {
      "startDesc": "Newest first",
      "startAsc": "Oldest first",
      "idAsc": "ID ascending"
    },
    "detail": {
      "back": "Back to gachas",
      "notFound": "Gacha #{gachaId} was not found",
      "pickups": "Pickup members",
      "poolCards": "All cards in pool",
      "rates": "Rates",
      "rarity": "Rarity",
      "cardCount": "Cards",
      "baseRate": "Base rate",
      "guaranteedRate": "Guaranteed slot",
      "guaranteedNote": "The 10th pull of a 10-pull guarantees a {rarity} or higher member.",
      "behaviors": "Pull options",
      "behaviorType": "Type",
      "spinCount": "Pulls",
      "cost": "Cost",
      "executeLimit": "Limit",
      "colorfulPass": "Colorful Pass",
      "ceilItem": "Exchange sticker",
      "summary": "Summary",
      "description": "Details"
    },
    "rarity": {
      "rarity_1": "★1",
      "rarity_2": "★2",
      "rarity_3": "★3",
      "rarity_4": "★4",
      "rarity_birthday": "Birthday"
    },
    "behaviorType": {
      "normal": "Normal pull",
      "over_rarity_3_once": "★3+ guaranteed once",
      "over_rarity_4_once": "★4 guaranteed once",
      "once_a_day": "Once a day",
      "once_a_week": "Once a week"
    },
    "costResource": {
      "jewel": "Crystals",
      "paid_jewel": "Paid crystals",
      "gacha_ticket": "Gacha ticket"
    }
  },
  "playerProfile": {
    "title": "My Profile",
    "description": "View your game account's profile",
    "source": {
      "realtime": "Live data",
      "snapshot": "Snapshot"
    },
    "noAccountHint": "Bind and select a game account to view your profile.",
    "loadError": "Failed to load profile data.",
    "retry": "Retry",
    "refresh": "Refresh",
    "dataAsOf": "Data as of {time}",
    "unknownCharacter": "Unknown character",
    "stats": {
      "title": "Play stats"
    },
    "snapshotNote": "From snapshot · {time}",
    "unitAverage": "Unit averages",
    "header": {
      "title": "Basic Info",
      "rank": "Lv.{rank}",
      "gameId": "Game ID",
      "copy": "Copy game ID",
      "copied": "Game ID copied",
      "copyFailed": "Copy failed"
    },
    "deck": {
      "title": "Current Deck",
      "empty": "No active deck data"
    },
    "badge": {
      "level": "Lv.{level}"
    },
    "music": {
      "title": "Music Clear Stats"
    },
    "multiLive": {
      "title": "Multi Live",
      "mvp": "MVP count",
      "superStar": "Super Star count"
    },
    "characters": {
      "title": "Character Levels",
      "rank": "Rank {rank}",
      "empty": "No character data"
    },
    "challenge": {
      "title": "Challenge Live",
      "summary": "Best score: {name} · {score}",
      "empty": "No challenge live records yet"
    },
    "links": {
      "eventRecords": "Event records",
      "characterMissions": "Character missions",
      "challengeDetail": "Challenge details"
    },
    "collection": {
      "title": "Card Collection by Character",
      "summary": "{owned}/{total} collected · {percent}%",
      "empty": "No card data yet"
    }
  },
  "training": {
    "layout": {
      "title": "Character training",
      "description": "View your game account's training progress",
      "dataAsOf": "Data as of {time}"
    },
    "tabs": {
      "challenge": "Challenge Live",
      "power": "Power bonuses",
      "area": "Area items",
      "bonds": "Bonds",
      "leader": "Leader counts",
      "missions": "Missions"
    },
    "challenge": {
      "title": "Challenge Live",
      "description": "Challenge Live ranks and best scores per character",
      "noAccountHint": "Bind and select a game account to view challenge live info.",
      "loadError": "Failed to load challenge live data.",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "summary": "Best: {name} · {score}",
      "charactersWithData": "Characters played: {count} / {total}",
      "empty": "No challenge live records yet",
      "sortByCharacter": "By character",
      "sortByScore": "By score",
      "scoreLabel": "Score",
      "stageLabel": "Challenge Stage",
      "unclaimedLabel": "Claimable rewards",
      "jewel": "Crystals ×{count}",
      "shard": "Crystal shards ×{count}",
      "allClaimed": "All rewards claimed"
    },
    "power": {
      "title": "Power bonuses",
      "description": "The account's power bonus breakdown",
      "noAccountHint": "Bind and select a game account to view power bonuses.",
      "loadError": "Failed to load power bonus data.",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "charactersTitle": "Character Bonuses",
      "unitsTitle": "Unit Bonuses",
      "attrsTitle": "Attribute Bonuses",
      "rankBonus": "Rank",
      "areaItemBonus": "Area item",
      "fixtureBonus": "MYSEKAI fixtures",
      "gateBonus": "MYSEKAI gate",
      "units": {
        "light_sound": "Leo/need",
        "idol": "MORE MORE JUMP!",
        "street": "Vivid BAD SQUAD",
        "theme_park": "Wonderlands×Showtime",
        "school_refusal": "Nightcord at 25:00",
        "piapro": "VIRTUAL SINGER"
      },
      "attrs": {
        "cute": "Cute",
        "cool": "Cool",
        "pure": "Pure",
        "happy": "Happy",
        "mysterious": "Mysterious"
      }
    },
    "bonds": {
      "title": "Bonds",
      "description": "The account's character bonds",
      "noAccountHint": "Bind and select a game account to view bonds.",
      "loadError": "Failed to load bond data.",
      "retry": "Retry",
      "refresh": "Refresh",
      "unknownCharacter": "Unknown character",
      "filterLabel": "Character",
      "filterAll": "All characters",
      "count": "{count} pairs",
      "level": "Bond Lv.{level}",
      "charaRank": "Rank {rank}",
      "needExp": "{exp} EXP to next level",
      "maxLevel": "MAX level",
      "notOwned": "Not unlocked",
      "empty": "No bond data yet",
      "showRewards": "Show level rewards",
      "rewardsTitle": "Rewards by level (reached levels dimmed)",
      "rewards": {
        "jewel": "Crystals ×{count}",
        "material": "{name} ×{count}",
        "materialFallback": "Material ×{count}",
        "bondsHonor": "Bonds plaque Lv.{level}",
        "bondsHonorWord": "Plaque words",
        "stamp": "Stamp",
        "boostItem": "Boost item ×{count}",
        "cutInVoice": "Cut-in voice",
        "other": "Reward"
      }
    },
    "area": {
      "title": "Area Items",
      "description": "Area item level progress and upgrade materials",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load area item data",
      "noAccountHint": "Bind and select a game account to view area items",
      "empty": "No area items match the current filters",
      "filters": {
        "unit": "Unit",
        "attr": "Attribute",
        "character": "Character",
        "tree": "Tree",
        "flower": "Flower",
        "all": "All"
      },
      "level": "Lv.{level}",
      "bonus": "+{bonus}%",
      "maxed": "All released levels reached",
      "notInShop": "Not available in the shop yet",
      "canUpgrade": "Ready to upgrade",
      "nextLevel": "Next level",
      "nextBonus": "Next bonus",
      "showAll": "All levels"
    },
    "leader": {
      "title": "Leader counts",
      "description": "Cumulative leader play counts per character",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load leader statistics",
      "noAccountHint": "Bind and select a game account to view leader statistics",
      "limit": "Mission cap {count}",
      "sortByTotal": "By count",
      "sortByCharacter": "By character",
      "normalLabel": "Normal",
      "exLevel": "EX Lv.{level}",
      "unknownCharacter": "Unknown character"
    },
    "missions": {
      "title": "Character Missions",
      "description": "Character mission progress and projected character levels",
      "refresh": "Refresh",
      "retry": "Retry",
      "loadError": "Failed to load character mission data",
      "noAccountHint": "Bind and select a game account to view character missions",
      "empty": "No character mission data",
      "character": "Character",
      "unknownCharacter": "Character {id}",
      "rank": "Lv.{rank}",
      "currentExp": "Current EXP",
      "pendingExp": "Pending EXP",
      "projected": "After claiming",
      "projectedValue": "Lv.{level} ({exp} EXP)",
      "basicGroup": "Collection missions",
      "achievementGroup": "Achievement missions",
      "exRound": "EX round {round}",
      "types": {
        "play_live": "Leader plays",
        "play_live_ex": "Leader plays (EX)",
        "waiting_room": "Waiting room",
        "waiting_room_ex": "Waiting room (EX)",
        "collect_costume_3d": "Costumes",
        "collect_stamp": "Stamps",
        "read_area_talk": "Area conversations",
        "read_card_episode_first": "Card episodes (part 1)",
        "read_card_episode_second": "Card episodes (part 2)",
        "collect_another_vocal": "Another Vocal",
        "area_item_level_up_character": "Character item upgrades",
        "area_item_level_up_unit": "Unit item upgrades",
        "area_item_level_up_reality_world": "Attribute item (tree & flower) upgrades",
        "collect_member": "Cards",
        "skill_level_up_rare": "Skill level ups (4★ & birthday)",
        "skill_level_up_standard": "Skill level ups (1★-3★)",
        "master_rank_up_rare": "Master rank ups (4★ & birthday)",
        "master_rank_up_standard": "Master rank ups (1★-3★)",
        "collect_character_archive_voice": "Voice lines",
        "collect_mysekai_fixture": "MySekai furniture",
        "collect_mysekai_canvas": "MySekai canvases",
        "read_mysekai_fixture_unique_character_talk": "MySekai conversations"
      }
    }
  },
  "searchAlias": {
    "badge": "Alias"
  },
  "sekaiRegion": {
    "followAccount": "Follow current account",
    "labels": {
      "jp": "JP",
      "en": "Global",
      "tw": "TW",
      "kr": "KR",
      "cn": "CN"
    }
  },
  "sekaiUnreleased": {
    "badge": "Unreleased"
  },
  "navigation": {
    "groups": {
      "recommendAndAbout": "Recommended & About",
      "friendshipRecommendation": "Friend recommendations",
      "eventRankingTools": "Event Ranking Tools",
      "projectSekai": "Project SEKAI Tools",
      "accountManagement": "Account & Management",
      "harukiBot": "HarukiBot",
      "sekaiCatalog": "Sekai catalog",
      "sekaiPlayer": "My game data"
    },
    "items": {
      "friendGroups": "Recommended groups",
      "friendLinks": "Friend links",
      "sponsors": "Sponsors",
      "deckRecommend": "Deck recommend",
      "eventPlanner": "Event planner",
      "rankBorder": "Rank border",
      "about": "About",
      "ptCalculator": "Score control",
      "uploadData": "Data upload",
      "botNeoRegistration": "HarukiBot NEO registration",
      "musicLibrary": "Music catalog",
      "cards": "Card catalog",
      "events": "Event catalog",
      "cardBox": "My Cards",
      "eventRecords": "Event records",
      "musicProgress": "Music progress",
      "gachas": "Gacha catalog",
      "costumes": "Costume dressup",
      "playerProfile": "My profile",
      "training": "Character training"
    },
    "notFound": {
      "title": "Page not found",
      "description": "The address you visited doesn't exist or has been moved. Please check that the link is correct.",
      "backHome": "Back to home",
      "backPrevious": "Go back"
    }
  },
  "webLayout": {
    "nav": {
      "home": "Home",
      "harukiBotGroup": "HarukiBot",
      "admin": "Admin",
      "myTickets": "My tickets",
      "pendingTicketReplies": "{total} tickets awaiting your reply",
      "settings": "Settings"
    },
    "footer": {
      "copyright": "Seiunx Network & Haruki Dev Team. All rights reserved.",
      "privacyPolicy": "Privacy Policy",
      "termsOfService": "Terms of Service",
      "legalLinks": "Legal links",
      "unofficialNotice": "Haruki Toolbox is not affiliated with, authorized by, endorsed by, or officially partnered with SEGA / Colorful Palette.",
      "assetCopyright": "Related game assets are copyright SEGA / Colorful Palette.",
      "appVersion": "App version",
      "version": "Version",
      "gitCommit": "Git commit",
      "buildTime": "Build time"
    }
  },
  "route": {
    "home": "Home",
    "notFound": "Page not found",
    "settings": "Settings",
    "privacy": "Privacy Policy",
    "tos": "Terms of Service",
    "about": "About",
    "friendGroups": "Recommended groups",
    "friendLinks": "Friend links",
    "sponsors": "Sponsors",
    "deckRecommend": "Deck recommend",
    "rankBorder": "Rank border",
    "rankBorderDetail": "Rank border detail",
    "ptCalculator": "Event Pt calculator",
    "clientConfigGenerator": "Client config generator",
    "uploadData": "Upload data",
    "botNeoRegistration": "HarukiBot NEO registration",
    "login": "Sign in",
    "register": "Register",
    "resetPassword": "Reset password",
    "error": "Identity error",
    "userSettings": "Account settings",
    "userIdentitySettings": "Identity settings",
    "userIdentityProfileSettings": "Profile settings",
    "userIdentityPasswordSettings": "Change password",
    "userIdentityMfaSettings": "MFA settings",
    "userIdentitySocialSettings": "Social login settings",
    "userIdentitySessionSettings": "Identity sessions",
    "gameAccountBindings": "Game account bindings",
    "harukiBotAuthorization": "HarukiBot data authorization",
    "oauthAuthorizations": "OAuth authorization management",
    "oauthLogin": "Continue sign in",
    "oauthConsent": "Authorize app",
    "oauthLogout": "Confirm sign out",
    "tickets": {
      "mine": "My tickets",
      "create": "Create ticket",
      "detail": "Ticket detail"
    },
    "musicLibrary": {
      "list": "Music library",
      "detail": "Music detail",
      "progress": "Music progress"
    },
    "cards": {
      "list": "Card catalog",
      "detail": "Card detail",
      "box": "My Cards"
    },
    "events": {
      "list": "Event catalog",
      "detail": "Event detail",
      "records": "Event records"
    },
    "gachas": {
      "list": "Gacha catalog",
      "detail": "Gacha detail"
    },
    "costumes": {
      "dressup": "Costume Dressup"
    },
    "playerProfile": {
      "me": "My profile"
    },
    "training": {
      "challenge": "Challenge Live details",
      "power": "Power bonuses",
      "area": "Area items",
      "bonds": "Bonds",
      "leader": "Leader counts",
      "missions": "Character missions"
    },
    "eventPlanner": {
      "planner": "Event planner"
    },
    "admin": {
      "layout": "Admin",
      "dashboard": "Dashboard",
      "users": "User management",
      "userDetail": "User detail",
      "oauthClients": "OAuth client management",
      "webhooks": "Webhook management",
      "logs": "System logs",
      "uploadLogs": "Upload logs",
      "content": "Content management",
      "sponsors": "Sponsor management",
      "config": "System config",
      "gameBindings": "Game binding management",
      "risk": "Risk management",
      "tickets": "Ticket management"
    }
  },
  "musicLibrary": {
    "eventBox": {
      "short": "{name} · Box {count}",
      "title": "Event song from {name}'s box #{count}"
    },
    "list": {
      "title": "Music library",
      "description": "Browse the PJSK music catalog: search, filter by difficulty, level, note count, unit and year.",
      "filters": {
        "region": "Server",
        "search": "Search",
        "searchPlaceholder": "Search by title or alias...",
        "title": "Filters",
        "difficulty": "Difficulty",
        "difficultyAll": "All difficulties",
        "level": "Level range",
        "levelMin": "Min",
        "levelMax": "Max",
        "noteCount": "Note count",
        "noteCountMode": {
          "exact": "Exact",
          "range": "Range"
        },
        "noteCountExactPlaceholder": "e.g. 886",
        "noteCountMin": "Min",
        "noteCountMax": "Max",
        "tag": "Tags",
        "character": "Character",
        "characterAll": "All characters",
        "characterScope": {
          "any": "Any relation",
          "box": "Box songs",
          "vocal": "Vocal",
          "anotherVocal": "Another Vocal"
        },
        "year": "Year",
        "yearAll": "All years",
        "sort": "Sort by",
        "sortDirection": {
          "asc": "Ascending",
          "desc": "Descending"
        },
        "reset": "Reset filters"
      },
      "sort": {
        "publishedAt": "Release date",
        "level": "Level",
        "noteCount": "Note count",
        "title": "Title"
      },
      "results": {
        "count": "{count} songs",
        "empty": "No songs match the current filters.",
        "aliasSearching": "Matching aliases..."
      },
      "downloading": "Downloading master data... {progress}%",
      "loadError": "Failed to load music data: {message}",
      "unknownDate": "Unknown"
    },
    "difficulty": {
      "easy": "EASY",
      "normal": "NORMAL",
      "hard": "HARD",
      "expert": "EXPERT",
      "master": "MASTER",
      "append": "APPEND"
    },
    "tags": {
      "vocaloid": "VIRTUAL SINGER",
      "light_music_club": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands x Showtime",
      "school_refusal": "Nightcord at 25:00",
      "other": "Other",
      "event_box": "Box song",
      "world_link": "World Link"
    },
    "categories": {
      "mv": "3D MV",
      "mv_2d": "2D MV",
      "image": "Image",
      "original": "Original MV"
    },
    "vocalTypes": {
      "original_song": "Original",
      "sekai": "SEKAI ver.",
      "virtual_singer": "VIRTUAL SINGER ver.",
      "another_vocal": "Another Vocal",
      "instrumental": "Instrumental",
      "april_fool_2022": "April Fools 2022"
    },
    "detail": {
      "back": "Back to list",
      "notFound": "This song does not exist on the selected server.",
      "loadError": "Failed to load music data: {message}",
      "unknownCharacter": "Unknown",
      "aliases": {
        "title": "Aliases",
        "showMore": "{count} more",
        "showLess": "Show less"
      },
      "info": {
        "composer": "Composer",
        "lyricist": "Lyricist",
        "arranger": "Arranger",
        "publishedAt": "Released",
        "duration": "Duration",
        "bpm": "BPM",
        "id": "ID"
      },
      "difficultiesTitle": "Difficulties",
      "table": {
        "difficulty": "Difficulty",
        "level": "Level",
        "noteCount": "Notes"
      },
      "vocalsTitle": "Vocal versions",
      "vocalsEmpty": "No vocal versions available.",
      "play": "Play",
      "pause": "Pause",
      "chartPreview": {
        "title": "Chart Preview",
        "modeDynamic": "Dynamic",
        "modeStatic": "Static",
        "loadError": "Failed to load the chart.",
        "retry": "Retry",
        "seek": "Playback position",
        "speed": "Note speed",
        "zoomFit": "Fit height",
        "zoom": "Zoom level",
        "silent": "No audio found — the preview plays silently."
      },
      "eventsTitle": "Related events"
    }
  },
  "cards": {
    "common": {
      "region": "Server",
      "loadError": "Failed to load card data",
      "retry": "Retry"
    },
    "list": {
      "title": "Card catalog",
      "description": "Browse cards by character, unit, attribute, rarity and supply type",
      "searchPlaceholder": "Search card title…",
      "sortLabel": "Sort",
      "total": "{total} cards",
      "empty": "No cards match the current filters"
    },
    "filter": {
      "title": "Filters",
      "characters": "Characters",
      "units": "Unit",
      "attrs": "Attribute",
      "rarity": "Rarity",
      "supply": "Supply",
      "year": "Year",
      "yearAll": "All years",
      "clear": "Clear filters"
    },
    "sort": {
      "releaseDesc": "Newest first",
      "rarityDesc": "Rarity",
      "idAsc": "Card ID"
    },
    "unit": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "Nightcord at 25:00",
      "piapro": "VIRTUAL SINGER"
    },
    "attr": {
      "cute": "Cute",
      "cool": "Cool",
      "pure": "Pure",
      "happy": "Happy",
      "mysterious": "Mysterious"
    },
    "rarity": {
      "rarity_1": "1★",
      "rarity_2": "2★",
      "rarity_3": "3★",
      "rarity_4": "4★",
      "rarity_birthday": "Birthday"
    },
    "supply": {
      "normal": "Permanent",
      "birthday": "Birthday limited",
      "term_limited": "Limited",
      "colorful_festival_limited": "Colorful Fes limited",
      "bloom_festival_limited": "Bloom Fes limited",
      "unit_event_limited": "WL event limited",
      "collaboration_limited": "Collab limited"
    },
    "detail": {
      "back": "Back to catalog",
      "notFound": "Card #{cardId} was not found in this server's data",
      "artNormal": "Before training",
      "artTrained": "After training",
      "artLoadFailed": "Failed to load card art",
      "info": "Card info",
      "character": "Character",
      "unit": "Unit",
      "supportUnit": "Support unit",
      "attr": "Attribute",
      "rarity": "Rarity",
      "supply": "Supply type",
      "releaseAt": "Released",
      "gachaPhrase": "Gacha phrase",
      "skill": "Skill",
      "skillLevel": "Level",
      "skillValue": "Value",
      "skillDuration": "Duration",
      "skillBeforeTraining": "Before training",
      "skillAfterTraining": "After training",
      "noSkill": "No skill data",
      "relatedEvents": "Related events",
      "relatedEventsEmpty": "No related events.",
      "relatedGachas": "Related gachas",
      "relatedGachasEmpty": "No related gachas.",
      "costumes": "Costumes",
      "costumeDressup": "Costume dressup",
      "costumePreviewHint": "Click a costume thumbnail for a 3D preview.",
      "costumeSlot": {
        "body": "Outfit",
        "hair": "Hairstyle",
        "head": "Headwear"
      },
      "sameCharacter": "More cards of this character"
    }
  },
  "events": {
    "common": {
      "dateFallback": "—",
      "idLabel": "ID {id}"
    },
    "type": {
      "marathon": "Marathon",
      "cheerful_carnival": "Cheerful Carnival",
      "world_bloom": "World Link",
      "unknown": "Unknown type"
    },
    "status": {
      "ongoing": "Ongoing",
      "ended": "Ended"
    },
    "attr": {
      "cute": "Cute",
      "cool": "Cool",
      "pure": "Pure",
      "happy": "Happy",
      "mysterious": "Mysterious"
    },
    "list": {
      "title": "Event catalog",
      "description": "Browse Project SEKAI events, bonuses, and event cards.",
      "regionLabel": "Server",
      "searchLabel": "Search",
      "searchPlaceholder": "Search by event name or ID",
      "typeLabel": "Event type",
      "attrLabel": "Bonus attribute",
      "yearLabel": "Year",
      "allTypes": "All types",
      "allAttrs": "All attributes",
      "allYears": "All years",
      "filtersTitle": "Filters",
      "resultsCount": "{count} events",
      "resetFilters": "Reset filters",
      "loadFailed": "Failed to load event data.",
      "retry": "Retry",
      "empty": "No events match the current filters."
    },
    "detail": {
      "back": "Back to event catalog",
      "loadFailed": "Failed to load event data.",
      "retry": "Retry",
      "notFound": "Event not found on the selected server.",
      "timelineTitle": "Timeline",
      "timeline": {
        "start": "Starts",
        "aggregate": "Aggregates",
        "closed": "Closes"
      },
      "countdownToStart": "Starts in",
      "countdownToAggregate": "Aggregates in",
      "countdownValue": "{days}d {hours}h {minutes}m {seconds}s",
      "bonusTitle": "Event bonus",
      "bonusEmpty": "No bonus data for this event.",
      "bonusAttrOnly": "All {attr} cards",
      "chaptersTitle": "World Link chapters",
      "chapterLabel": "Chapter {no}",
      "chapterFinale": "Finale",
      "cardsTitle": "Event cards",
      "cardsEmpty": "No cards for this event.",
      "links": {
        "rankBorder": "View rank border",
        "deckRecommend": "Event deck recommend"
      }
    }
  },
  "homeSettings": {
    "title": "Haruki Toolbox Settings",
    "description": "Configure Toolbox server endpoint, game asset endpoint, appearance, language, and performance preferences",
    "trigger": "Settings",
    "tabs": {
      "preferences": "Preferences",
      "app": "App",
      "sekaiData": "Master data",
      "userData": "User data"
    },
    "resetDialog": {
      "title": "Reset preferences?",
      "description": "This restores Toolbox server endpoint, game asset endpoint, appearance, language, low effects mode, and privacy preferences to their defaults.",
      "confirm": "Reset preferences"
    },
    "endpoint": {
      "label": "Toolbox server endpoint",
      "help": "Direct is default. If international access is unstable, try CDN.",
      "placeholder": "Select endpoint",
      "direct": "Direct",
      "cdn": "CDN",
      "unavailable": "No available endpoints are configured in this environment.",
      "checking": "Checking",
      "unknown": "Not checked",
      "failed": "Unreachable",
      "latencyMs": "{ms} ms",
      "refreshLatency": "Re-test latency"
    },
    "assetEndpoint": {
      "label": "Game asset endpoint",
      "help": "Used for game assets such as card thumbnails. The first visit picks the lower-latency endpoint, and opening settings re-checks both.",
      "placeholder": "Select game asset endpoint",
      "china": "China-accelerated overseas CDN",
      "global": "Overseas-optimized CDN",
      "chinaCdn": "China domestic CDN",
      "checking": "Checking",
      "unknown": "Not checked",
      "failed": "Unreachable",
      "latencyMs": "{ms} ms"
    },
    "theme": {
      "label": "Appearance",
      "help": "Choose your preferred theme",
      "placeholder": "Select theme",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "locale": {
      "label": "Language",
      "help": "Language changes apply immediately",
      "placeholder": "Select language",
      "zhCN": "简体中文",
      "enUS": "English",
      "zhTW": "繁體中文"
    },
    "visualEffects": {
      "label": "Low effects mode",
      "help": "Turns off glass blur, heavy shadows, and other costly visual effects. Useful on mobile or low-power devices."
    },
    "privacy": {
      "hideGameUserIdLabel": "Hide game UID",
      "hideGameUserIdHelp": "When enabled, account selectors for deck recommendation and uploads keep the first 2 and last 4 UID digits, replacing the middle with asterisks."
    },
    "unreleased": {
      "showLabel": "Show unreleased content",
      "showHelp": "When enabled, catalogs (cards, events, music, gachas) include content not yet released on the current server.",
      "blurLabel": "Spoiler blur for unreleased content",
      "blurHelp": "When unreleased content is shown, blur its card art, covers, and banners to avoid spoilers."
    },
    "appUpdate": {
      "title": "App update",
      "description": "Check for Haruki Toolbox version updates.",
      "current": "Current",
      "available": "Update available",
      "remoteVersion": "Remote version",
      "remoteCommit": "Remote Git commit",
      "remoteBuildTime": "Remote build time",
      "checkedAt": "Last checked: {time}",
      "lastError": "The last update check failed. Please try again later.",
      "check": "Check for updates",
      "checking": "Checking...",
      "update": "Update app",
      "updating": "Updating..."
    },
    "userData": {
      "description": "Manage the local suite, mysekai, and profile caches for your bound game accounts, shared by features across the site. Suite/mysekai refresh checks remote upload time first; profile refresh fetches the latest profile directly.",
      "account": "Account",
      "accountPlaceholder": "Select a bound account",
      "noAccount": "No game account is bound to the current Toolbox account.",
      "dataType": "Data type",
      "types": {
        "suite": "Suite",
        "mysekai": "MySekai",
        "profile": "Profile"
      },
      "cacheUpdatedAt": "Local cache",
      "remoteUploadTime": "Upload time",
      "lastCheck": "Last check",
      "never": "No cache",
      "cacheHit": "Current",
      "cacheUpdated": "Updated",
      "notChecked": "Not checked",
      "refresh": "Refresh user data",
      "refreshing": "Refreshing...",
      "clear": "Clear user data cache",
      "clearDialog": {
        "title": "Clear user data cache?",
        "description": "This clears user data cached in this browser for the current Toolbox account. Data will need to be checked or downloaded again.",
        "confirm": "Clear cache"
      },
      "logoutCleanupHint": "Signing out automatically clears user data cached in this browser for the current Toolbox account.",
      "toast": {
        "alreadyCurrent": "User data is already current",
        "refreshed": "User data refreshed",
        "refreshFailed": "Failed to refresh user data",
        "cleared": "User data cache cleared",
        "clearFailed": "Failed to clear user data cache"
      }
    },
    "toast": {
      "reset": "Settings reset to defaults"
    },
    "sections": {
      "preferences": "Appearance, language, network, and privacy preferences. Changes apply immediately.",
      "sekaiData": "Manage per-region master data caches and background update jobs shared by pickers, recommendations, and other features."
    },
    "groups": {
      "appearance": "Appearance",
      "network": "Network",
      "privacy": "Privacy & content"
    }
  },
  "core": {
    "auth": {
      "sessionExpiredTitle": "Session expired",
      "sessionExpiredDescription": "Please sign in again",
      "accountBannedTitle": "Account banned",
      "permissionDeniedTitle": "Permission denied",
      "loginRequiredTitle": "Sign in required",
      "loginRequiredDescription": "You need to sign in to access this page",
      "requireAdminDescription": "Admin permission required",
      "requireSuperAdminDescription": "Super admin permission required",
      "apiRequestFailedTitle": "API request failed",
      "apiRequestFailedDescription": "Status: {status}, message: {message}"
    },
    "sync": {
      "successTitle": "Settings synced",
      "successDescription": "Cloud settings are synced for current account",
      "failedTitle": "Settings sync unavailable",
      "failedDescription": "Cloud settings could not be synced. Try again later.",
      "missingUpdatedDataDescription": "Cloud settings response is incomplete (missing updatedData).",
      "unexpectedStatusDescription": "Cloud settings request returned an unexpected status ({status})."
    },
    "suitePrefetch": {
      "progressTitle": "Fetching account data",
      "progressDescription": "{completed}/{total} bound accounts done",
      "successTitle": "Account data fetched",
      "successDescription": "Downloaded new suite data for {updated}/{total} bound accounts",
      "partialTitle": "Some account data failed to fetch",
      "partialDescription": "{failed}/{total} accounts failed. They will retry automatically on the related pages.",
      "failedDescription": "Failed to fetch bound account data. It will retry automatically on the related pages."
    },
    "unsupportedBrowser": {
      "title": "Unsupported browser",
      "description": "You are trying to access Haruki Toolbox from an unsupported browser.",
      "suggestion": "Please use Chrome, Safari, Firefox, or another supported browser."
    },
    "pwa": {
      "updateAvailableTitle": "New version available",
      "updateAvailableDescription": "A new app build is ready. You can update now.",
      "updateAvailableDescriptionWithVersion": "New version {version} is ready to install.",
      "updateAction": "Update app",
      "applyingTitle": "Updating app",
      "applyingDescription": "The page will refresh after the update is applied.",
      "currentTitle": "App is up to date",
      "currentDescription": "The current app version is up to date.",
      "checkFailedTitle": "Update check failed",
      "checkFailedDescription": "Remote build information could not be loaded. Please try again later.",
      "offlineReadyTitle": "Offline cache ready",
      "offlineReadyDescription": "The app shell is cached and can open faster next time.",
      "devTitle": "Development mode",
      "devDescription": "PWA updates are not registered in development mode."
    }
  },
  "catalog": {
    "region": {
      "label": "Server"
    },
    "search": {
      "label": "Search",
      "clear": "Clear search"
    },
    "filters": {
      "title": "Filters",
      "reset": "Reset filters",
      "clearAll": "Clear all",
    },
    "results": {
      "count": "{count} results",
      "empty": "Nothing matches the current filters.",
      "emptyHint": "Try loosening the filters or switching server.",
      "loadError": "Failed to load data",
      "retry": "Retry",
      "downloading": "Downloading master data… {progress}%"
    },
    "sort": {
      "label": "Sort",
      "asc": "Ascending",
      "desc": "Descending"
    },
    "view": {
      "label": "View",
      "grid": "Grid",
      "list": "List"
    },
    "pagination": {
      "label": "Pagination",
      "first": "First page",
      "prev": "Previous page",
      "next": "Next page",
      "last": "Last page",
      "page": "Page {page}",
      "pageOf": "{page} / {total}",
      "pageSize": "Items per page",
      "perPage": "{size} / page",
      "jump": "Jump to page",
      "summary": "{total} items · page {page} of {pages}"
    },
    "status": {
      "upcoming": "Upcoming",
      "ongoing": "Ongoing",
      "ended": "Ended",
      "upcomingHidden": "Upcoming content is hidden. Enable “show unreleased content” to see it.",
      "showUnreleased": "Show unreleased content",
      "endsIn": "{time} left",
      "startsIn": "Starts in {time}"
    },
    "countdown": {
      "toStart": "Starts in",
      "toEnd": "Ends in",
      "toAggregate": "Aggregates in",
      "reached": "Reached",
      "days": "{days}d",
      "hours": "{hours}h",
      "minutes": "{minutes}m",
      "seconds": "{seconds}s"
    },
    "detail": {
      "backToList": "Back to {list}",
      "breadcrumb": "Breadcrumb",
      "notFound": "This entry does not exist in the selected server's data.",
      "loadError": "Failed to load details",
      "assetName": "Asset name",
      "period": "Period",
      "viewAllCount": "View all ({count})",
      "zoom": "Click to enlarge",
      "showMore": "Show more",
      "showLess": "Show less",
      "tryOtherRegion": "This entry may exist on another server; switch and retry."
    },
    "lightbox": {
      "description": "Image preview",
      "zoomIn": "Zoom in",
      "zoomOut": "Zoom out",
      "openInNewTab": "Open in new tab",
      "items": "Images"
    },
    "character": {
      "label": "Characters",
      "toggleUnit": "Toggle all members of {unit}"
    },
    "unit": {
      "label": "Units"
    },
    "attr": {
      "label": "Attributes"
    },
    "rarity": {
      "label": "Rarity"
    },
    "year": {
      "label": "Year",
      "all": "All years"
    },
    "type": {
      "label": "Type"
    },
    "statusFilter": {
      "label": "Status"
    }
  }
} as const
