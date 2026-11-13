// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: deckRecommend, eventPlanner
export default {
  "deckRecommend": {
    "description": "The best event deck from the cards you own",
    "title": "Deck recommendation",
    "select": {
      "loading": "Preparing data..."
    },
    "configActions": {
      "save": "Save config",
      "clear": "Clear config",
      "clearDialogTitle": "Clear saved config?",
      "clearDialogDescription": "Deletes the saved config and resets this page to defaults",
      "clearDialogCancel": "Cancel",
      "clearDialogConfirm": "Clear config"
    },
    "summaryBar": {
      "edit": "Edit config",
      "rerun": "Run again"
    },
    "form": {
      "account": "Account",
      "accountPlaceholder": "Select a bound account",
      "noAccount": "No game account is bound to the current Toolbox account.",
      "bindAccount": "Bind a game account",
      "dataRegion": "Data region",
      "mode": "Recommendation mode",
      "target": "Recommendation target",
      "liveType": "Live type",
      "algorithm": "Search algorithms",
      "algorithmHint": "The default follows the scenario: exact DFS (provably optimal) for score targets, DFS-GA for World Link and other complex cases, reinforcement learning for MySekai. Selecting several cross-checks results but takes longer.",
      "executionMode": "Execution mode",
      "executionModeLimitedHint": "Limited device memory: algorithms run one after another and take longer",
      "event": "Event",
      "eventPlaceholder": "Select an event",
      "eventSearchPlaceholder": "Search event name, #ID, type, pinyin, or romaji...",
      "eventEmpty": "No event found",
      "character": "Character",
      "characterPlaceholder": "Select a character",
      "bonusTargets": "Target bonuses",
      "bonusTargetsPlaceholder": "e.g. 100 120 130",
      "bonusTargetsInvalid": "Target bonuses must be positive integers separated by spaces or commas",
      "customBonusAttr": "Custom bonus attribute",
      "customBonusAttrNone": "Not specified",
      "customBonusCharacters": "Custom bonus characters",
      "customBonusCharactersPlaceholder": "e.g. 1 2 21",
      "customBonusSupportUnits": "VS support units",
      "customBonusSelectedCount": "{count} characters selected",
      "customBonusSupportUnitsEmpty": "Select a Virtual Singer character (21-26) first",
      "filterOtherUnit": "Filter other units",
      "customBonusHint": "Choose custom mixed-event bonus characters here. VS characters can also receive support unit assignments.",
      "customBonusInvalid": "Custom bonus conditions are not formatted correctly",
      "customBonusSupportUnitsTargetInvalid": "VS support unit characters must also be listed in custom bonus characters",
      "music": "Music",
      "musicPlaceholder": "Select a music",
      "musicSearchPlaceholder": "Search music name, #ID, kana, pinyin, or romaji...",
      "musicEmpty": "No music found",
      "difficultyPlaceholder": "Select difficulty"
    },
    "picker": {
      "musicDialogTitle": "Select Music",
      "eventDialogTitle": "Select Event",
      "cardDialogTitle": "Browse Cards",
      "browse": "Browse",
      "done": "Done",
      "filterAll": "All",
      "unitLabel": "Unit",
      "attrLabel": "Attribute",
      "rarityLabel": "Rarity",
      "cardSearchLabel": "Search cards",
      "browseCount": "{count} cards"
    },
    "layers": {
      "advanced": {
        "title": "Advanced Settings"
      },
      "expert": {
        "title": "Expert Settings",
        "description": "Skill strategy, support assumptions, data overrides, engine parameters and single-card training"
      }
    },
    "groups": {
      "accountTarget": "Account & Target",
      "musicAlgorithm": "Music & Algorithms"
    },
    "modes": {
      "event": "Event",
      "challenge": "Challenge",
      "bonus": "Bonus",
      "mysekai": "MySekai",
      "max": "Strongest"
    },
    "targets": {
      "score": "Score",
      "pt": "PT",
      "power": "Power",
      "skill": "Skill value",
      "bonus": "Event bonus"
    },
    "liveTypes": {
      "solo": "Solo Live",
      "multi": "Multi Live",
      "auto": "Auto Live",
      "challenge": "Challenge Live",
      "challengeAuto": "Challenge Auto Live",
      "mysekai": "MySekai Live"
    },
    "algorithms": {
      "dfsGa": "DFS-GA Hybrid Search",
      "dfs": "DFS Exact Search",
      "ga": "Genetic Algorithm",
      "rl": "Reinforcement Learning"
    },
    "algorithmsShort": {
      "dfsGa": "DFS-GA",
      "dfs": "DFS",
      "ga": "GA",
      "rl": "RL"
    },
    "executionModes": {
      "sequential": "Sequential",
      "parallel": "Parallel"
    },
    "skillStrategies": {
      "average": "Average",
      "max": "Maximum",
      "min": "Minimum",
      "specific": "Specific order"
    },
    "eventTypes": {
      "memoryEvent": "Memory Event",
      "marathon": "Marathon",
      "cheerfulCarnival": "Cheerful Carnival",
      "worldBloom": "World Link",
      "unknown": "Unknown type"
    },
    "eventAttrs": {
      "happy": "Happy",
      "cute": "Cute",
      "cool": "Cool",
      "pure": "Pure",
      "mysterious": "Mysterious"
    },
    "cardTags": {
      "attrs": {
        "happy": "Happy (Orange)",
        "cute": "Cute (Pink)",
        "cool": "Cool (Blue)",
        "pure": "Pure (Green)",
        "mysterious": "Mysterious (Purple)"
      }
    },
    "eventUnits": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "Nightcord at 25:00",
      "piapro": "Virtual Singer"
    },
    "options": {
      "eventCondition": {
        "title": "Event Conditions"
      },
      "bonus": {
        "title": "Bonus Conditions"
      },
      "eventSimulation": {
        "memoryEventHint": "All attributes get a 25% base bonus; native unit characters get 75% in total (human units exclude Virtual Singers; Virtual Singer counts all six). Master rank bonuses apply; featured-card bonuses do not.",
        "title": "Simulated Event",
        "description": "Recommend against a custom event type, attribute, and unit without relying on a published event",
        "unavailable": "Not available in this mode",
        "realEventDisabled": "Not used while the simulated event is on",
        "type": "Event type",
        "attr": "Attribute",
        "unit": "Unit",
        "worldBloomTurn": "Chapter",
        "worldBloomTurnOption": "Turn {turn}",
        "worldBloomCharacter": "Character",
        "invalid": "Complete simulated event parameters. World Link turn 1/2 requires a character whose unit can be resolved.",
        "customBonusUnit": "Custom bonus characters",
        "customBonusTitle": "Custom Bonus Characters",
        "customBonusSummary": "{count} characters selected; matching cards get +25%",
        "customBonusConfigure": "Configure custom bonus characters",
        "customBonusDescription": "Virtual Singer characters can also be given a support unit",
        "customBonusDone": "Done",
        "customBonusInvalid": "Select an attribute and at least one custom bonus character"
      },
      "multiLive": {
        "title": "Multi Live Parameters",
        "teammatePower": "Teammate power",
        "teammateScoreUp": "Teammate skill value",
        "followSelfPlaceholder": "Follow current deck",
        "scoreUpLowerBound": "Minimum skill value",
        "scoreUpLowerBoundPlaceholder": "No limit",
        "disabled": "Multi Live only",
        "invalid": "Multi-live parameters must be numbers greater than or equal to 0"
      },
      "filters": {
        "title": "Advanced Filters",
        "none": "No limit",
        "selectedCount": "{count} selected",
        "unit": "Unit filter",
        "attr": "Attribute filter",
        "character": "Character filter",
        "characterSelectPlaceholder": "Select filter characters",
        "characterMinHint": "Pick at least {count} characters so a full deck can be built",
        "areaItemLevel": "Area item level",
        "areaItemLevelDefault": "Use current data",
        "areaItemLevelOption": "Lv.{value}",
        "areaItemLevelPlaceholder": "Use current data",
        "characterRank": "Character Rank",
        "characterRankDefault": "Use current data",
        "characterRankOption": "Rank {value}",
        "mysekaiGateLevel": "MySekai gate level",
        "mysekaiGateLevelDefault": "Use current data",
        "mysekaiGateLevelOption": "Lv.{value}",
        "mysekaiFixtureBonusRate": "Fixture bonus",
        "mysekaiFixtureBonusRateDefault": "Use current data",
        "mysekaiFixtureBonusRateOption": "{value}%",
        "boost": "Live boost count",
        "boostOption": "{value}",
        "boostPlaceholder": "Applies the Live Boost Pt multiplier",
        "invalid": "Live boost count must be an integer from 0 to 10; override levels or bonuses must be valid in-range values"
      },
      "dataOverrides": {
        "title": "Temporary Data Overrides",
        "invalid": "Override levels or bonuses must be valid in-range values"
      },
      "runParameters": {
        "title": "Run Parameters",
        "invalid": "Live boost count must be an integer from 0 to 10"
      },
      "constraints": {
        "title": "Deck Constraints",
        "fixedGroup": "Forced members",
        "fixedGroupDescription": "One fixed card per character",
        "challengeFixedGroupDescription": "Only cards of the selected challenge character",
        "excludedGroup": "Exclusion rules",
        "fixedCards": "Fixed cards",
        "useCurrentDeck": "Use current main deck",
        "useCurrentDeckDescription": "Read live from the game first, falling back to your uploaded data",
        "fixedCharacters": "Fixed characters",
        "excludedCards": "Excluded cards",
        "cardSelectPlaceholder": "Search and select cards",
        "fixedCardSelectPlaceholder": "Select fixed cards",
        "excludedCardSelectPlaceholder": "Select excluded cards",
        "cardSearchPlaceholder": "Search card name, #ID, character, unit, attribute, rarity, or pinyin...",
        "cardEmpty": "No card found",
        "noSelectedCards": "No cards selected",
        "selectedCardsCount": "{count} cards selected",
        "selectedCardsLimitCount": "{count}/{max} cards selected",
        "removeCard": "Remove card",
        "characterSelectPlaceholder": "Select fixed characters",
        "characterNone": "No character specified",
        "noSelectedCharacters": "No characters selected",
        "selectedCharactersCount": "{count}/{max} characters selected",
        "removeCharacter": "Remove character",
        "characterListPlaceholder": "e.g. 1 2 21",
        "invalid": "Character IDs must be positive integers separated by spaces or commas",
        "challengeHint": "Challenge mode cannot fix characters",
        "currentDeckHint": "Forced members and exclusion rules are ignored"
      },
      "random": {
        "title": "Skills and Support",
        "skillGroup": "Skill strategy",
        "skillOrder": "Skill order",
        "specificSkillOrder": "Specific skill order",
        "specificSkillOrderPlaceholder": "e.g. 12345",
        "specificSkillOrderHint": "1-5 without repeats; 1 is the leader slot",
        "specificSkillOrderInvalid": "Specific skill order must contain 1-5 without duplicates, for example 12345",
        "skillReference": "BFes skill reference",
        "keepAfterTrainingState": "Keep dual-skill state",
        "keepAfterTrainingStateDescription": "Don't force a switch between pre- and post-training skills",
        "supportGroup": "World Link support",
        "supportMasterMax": "Support max Master Rank",
        "supportSkillMax": "Support max skill"
      },
      "areaItemOverride": {
        "title": "Area Item Overrides",
        "priorityHint": "Takes priority over the area item level in Advanced Settings",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable area items are available in the current data",
        "searchPlaceholder": "Search level...",
        "emptySearch": "No level found",
        "areaFallback": "Area #{id}",
        "itemFallback": "Item #{id}",
        "targetFallback": "Target #{id}",
        "kinds": {
          "character": "Character items",
          "unit": "Unit items",
          "attr": "Attribute items",
          "all": "All-character items"
        },
        "targets": {
          "all": "All characters",
          "multiUnit": "Mixed-unit teams",
          "allAndMultiUnit": "All characters · Mixed-unit teams"
        }
      },
      "characterRankOverride": {
        "title": "Character Rank Overrides",
        "priorityHint": "Takes priority over the unified Character Rank in Advanced Settings",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable character ranks are available in the current data",
        "searchPlaceholder": "Search rank...",
        "emptySearch": "No rank found",
        "maxRank": "Max Rank {value}"
      },
      "mysekaiGateOverride": {
        "title": "MySekai Gate Overrides",
        "priorityHint": "Takes priority over the unified MySekai gate level in Advanced Settings",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable MySekai gates are available in the current data",
        "searchPlaceholder": "Search level...",
        "emptySearch": "No level found",
        "maxLevel": "Max Lv.{value}"
      },
      "mysekaiFixtureBonusOverride": {
        "title": "Fixture Bonus Overrides",
        "priorityHint": "Takes priority over the unified fixture bonus in Advanced Settings",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable characters are available in the current data",
        "searchPlaceholder": "Search bonus...",
        "emptySearch": "No bonus found",
        "maxRate": "Max {value}"
      },
      "engine": {
        "title": "Deck Engine Parameters",
        "resultLimit": "Result count",
        "resultLimitPlaceholder": "Default 6",
        "timeoutMs": "Timeout (ms)",
        "timeoutMsPlaceholder": "Default 15000",
        "invalid": "Result count must be an integer from 1-50; timeout must be an integer from 1000-300000 ms"
      }
    },
    "training": {
      "title": "Card Training",
      "rarity": "Rarity",
      "disabled": "Disabled",
      "maxLevel": "Max level",
      "episodesRead": "Episodes",
      "maxMasterRank": "Max Master Rank",
      "maxSkillLevel": "Max skill",
      "mySekaiCanvas": "MySekai canvas",
      "rarities": {
        "rarity_1": "1 star",
        "rarity_2": "2 stars",
        "rarity_3": "3 stars",
        "rarity_4": "4 stars",
        "rarity_birthday": "Birthday"
      }
    },
    "singleCard": {
      "title": "Single-card Training Overrides",
      "description": "Takes priority over rarity defaults; fixed cards are added automatically",
      "card": "Card",
      "cardPlaceholder": "Select card",
      "cardSearchPlaceholder": "Search card name or ID...",
      "cardEmpty": "No card found",
      "add": "Add",
      "empty": "No single-card overrides yet",
      "selectedCount": "{count} single-card overrides added",
      "inherit": "Use rarity default",
      "level": "Level",
      "skillLevel": "Skill",
      "masterRank": "Master Rank",
      "levelOption": "Lv.{value}",
      "skillLevelOption": "Skill Lv.{value}",
      "masterRankOption": "Master Rank {value}",
      "numberSearchPlaceholder": "Search value...",
      "numberEmpty": "No value found",
      "episodes": "Episodes",
      "remove": "Remove single-card override",
      "episodeStates": {
        "inherit": "Use rarity default",
        "none": "Locked",
        "first": "First episode",
        "both": "Both episodes"
      }
    },
    "runner": {
      "ready": "Complete the required options to start recommendation",
      "run": "Run recommendation",
      "running": "Running...",
      "blocked": {
        "noAccount": "No game account is bound yet; bind one to run a recommendation",
        "selectAccount": "Select a game account first",
        "dataMissing": "The selected account has no uploaded game data. Upload it on the Upload data page first."
      },
      "phases": {
        "preparing-data": "Preparing game data…",
        "fetching-user-data": "Loading user data...",
        "initializing": "Starting the calculation…",
        "loading-data": "Loading recommendation data...",
        "recommending": "Running recommendation..."
      }
    },
    "result": {
      "title": "Recommendation Result",
      "idlePlaceholder": "Run a recommendation to see decks here",
      "actions": {
        "compare": "Compare",
        "compareTitle": "Deck Comparison",
        "compareBaseline": "Baseline",
        "copy": "Copy deck",
        "copied": "Deck info copied to clipboard",
        "copyFailed": "Copy failed — check the browser clipboard permission",
        "songRanking": "Song ranking"
      },
      "elapsed": "Deck engine total time {seconds} s",
      "totalElapsed": "Total time {seconds} s",
      "secondsUnit": "s",
      "dataElapsed": "Data fetch",
      "engineDataElapsed": "Deck engine data preparation",
      "sequentialRecommendElapsed": "Sequential recommendation (wall time)",
      "parallelRecommendElapsed": "Parallel recommendation (wall time)",
      "algorithmElapsed": "{algorithm} search: {seconds} s",
      "empty": "No recommendation result yet",
      "missingUserDataTitle": "No game data is available for deck building",
      "missingUserDataDescription": "The selected account has not uploaded Suite data. Every deck mode needs only Suite; MySekai mode needs no MySekai upload.",
      "uploadDataAction": "Upload data",
      "deckTitle": "Deck #{index}",
      "score": "score {score}",
      "totalPower": "Power {value}",
      "totalPowerLimitWarning": "This event caps total power at {value}",
      "eventCardBonusLimitWarning": "This event counts current-event card bonus for only {count} members",
      "eventSkillScoreUpLimitWarning": "This event caps card skill score bonus at {value}%",
      "summary": {
        "pt": "PT",
        "power": "Power",
        "totalBonus": "Total bonus",
        "effective": "Effective value",
        "bonusBreakdown": "Main {main}% + support {support}%"
      },
      "sections": {
        "basic": "Basic Info",
        "power": "Power Details",
        "cards": "Deck Info",
        "mainCards": "Main Deck Info",
        "supportCards": "Support Deck Info"
      },
      "power": {
        "total": "Total power",
        "base": "Base power",
        "areaItem": "Area item",
        "character": "Character rank",
        "honor": "Honor",
        "fixture": "MySekai fixture",
        "gate": "MySekai gate"
      },
      "eventBonus": "Event bonus {value}%",
      "bonusTag": "Bonus {value}%",
      "worldBloomEventBonus": "Event bonus main deck {main}% + support deck {support}% = {total}%",
      "liveScore": "Live score {value}",
      "liveScoreLabel": "Live score",
      "mysekaiEventPoint": "MySekai event Pt {value}",
      "multiLiveScoreUp": "Multi live effective value {value}%",
      "challengeScoreDelta": "Challenge score delta {value}",
      "challengeScoreDeltaLabel": "Challenge score delta",
      "unknownCard": "Unknown card",
      "cardTotalPower": "Power {value}",
      "cardTotalPowerShort": "Total power {value}",
      "cardBasePower": "Base {value}",
      "cardBasePowerShort": "Base power {value}",
      "cardLevel": "Lv.{value}",
      "masterRank": "Master Rank {value}",
      "skillLevel": "Skill Lv.{value}",
      "skillScoreUp": "Skill {value}%",
      "skillScoreUpShort": "Score bonus {value}%",
      "skillLifeRecovery": "Life recovery {value}",
      "skillLifeRecoveryShort": "Recovery {value}",
      "cardEventBonus": "Bonus {value}%",
      "cardEventBonusShort": "Event {value}%",
      "episodeFirst": "First episode",
      "episodesShort": "Episodes",
      "episodeSecond": "Second episode",
      "readState": {
        "read": "Read",
        "unread": "Unread"
      },
      "supportSkillLevel": "SLv.{value}",
      "columns": {
        "card": "Card",
        "power": "Power",
        "skillLevel": "Skill",
        "scoreUp": "Score up",
        "eventBonus": "Event bonus"
      },
      "canvasBonus": "Canvas bonus",
      "noCanvasBonus": "No canvas"
    },
    "errors": {
      "unknown": "Recommendation failed. Try again later; if it keeps failing, open a ticket.",
      "notEnoughCards": "Not enough cards: only {count} cards remain after filtering, but at least 5 are needed. Relax the rarity/attribute filters.",
      "currentDeckIncomplete": "The current team read from the game has fewer than 5 cards. Turn off “use current team”, or build a full team in the game and upload your data again.",
      "musicRequired": "Select a song and a difficulty first",
      "bonusTargetsRequired": "Enter at least one target bonus",
      "skillOrderRequired": "Fill in the complete skill order, or switch back to automatic skill order",
      "worldBloomConfigInvalid": "The World Link chapter or unit settings are incomplete. Pick the chapter character again.",
      "eventConditionRequired": "A simulated event needs both an event attribute and a unit",
      "algorithmRequired": "Select at least one search algorithm",
      "accountRequired": "Sign in and select a game account first",
      "masterNotReady": "Game data is not ready yet. Wait for the download to finish and try again.",
      "timeout": "The calculation timed out. Enable fewer algorithms or raise the engine timeout in advanced settings, then try again.",
      "engineFailed": "The deck engine hit an error. Reload the page and try again; if it keeps failing, open a ticket."
    },
    "toast": {
      "runSuccessTitle": "Recommendation complete",
      "runFailedTitle": "Recommendation failed",
      "configSavedTitle": "Config saved",
      "configSaveFailedTitle": "Failed to save config",
      "configClearedTitle": "Config cleared"
    },
    "attribution": {
      "originalPrefix": "The original deck recommendation algorithm comes from ",
      "originalMiddle": "'s ",
      "originalSuffix": ".",
      "optimizationPrefix": "Some algorithm optimizations used by this site come from ",
      "optimizationMiddle": "'s ",
      "neuraxmyName": "LunaCha",
      "enginePrefix": "For details about the deck recommendation engine used here, see the ",
      "aboutLink": "About",
      "engineSuffix": " page. Results are for reference only."
    }
  },
  "eventPlanner": {
    "title": "Event planner",
    "description": "A brush is one deck + song’s PT per hour; paint it onto the calendar to add up PT",
    "form": {
      "targetPoint": "Target PT",
      "targetPointPlaceholder": "e.g. 1000w, 120万, 1.5亿",
      "currentPoint": "Current PT",
      "currentPointPlaceholder": "e.g. 25k, empty means 0",
      "parsedValue": "Parsed as {value}",
      "invalidPoint": "Cannot parse this value; use a non-negative number, optionally with 万/w, k or 亿 suffix"
    },
    "summary": {
      "targetPoint": "Target PT",
      "currentPoint": "Current PT",
      "plannedPoint": "Planned PT",
      "remainingPoint": "Still missing",
      "dailyPoint": "Daily pace",
      "projectedPoint": "Projected total",
      "plannedHours": "{hours} h playing · {rest} h rest"
    },
    "progress": {
      "title": "Plan against the target",
      "targetMark": "Target",
      "short": "The plan is {remaining} PT short of the target",
      "over": "The plan lands at {projected} PT, {surplus} above the target",
      "exact": "The plan covers the target exactly",
      "legendCurrent": "Current PT",
      "legendPlanned": "Planned",
      "noTarget": "Enter a target PT to see progress",
      "pastNote": "Past hours don't count as planned PT (your current PT includes them)"
    },
    "brushes": {
      "title": "Hourly-Rate Brushes",
      "rest": "Rest",
      "eraser": "Eraser",
      "add": "New brush",
      "perHour": "{points}/h",
      "edit": "Edit brush",
      "delete": "Delete brush",
      "playsTitle": "Loops per hour",
      "boostShort": "Boost",
      "usedHours": "{hours} h painted",
      "usage": "{hours} h painted, {points} in all",
      "deleteConfirmTitle": "Delete the brush “{name}”?",
      "deleteConfirmDescription": "The {hours} hours painted with it will be cleared from the calendar",
      "boostTitle": "Boost fires spent per play",
      "boostOption": "{count} fire ×{multiplier}",
      "empty": "Click “New brush” to build a deck and pick a song"
    },
    "dialog": {
      "title": "New Hourly-Rate Brush",
      "description": "Build a deck, then pick a song from the PT ranking",
      "runDeck": "Build deck for event",
      "useSavedConfig": "Use the deck page's detailed settings",
      "savedConfigHint": "Follows the deck page's settings",
      "openDeckRecommend": "Open Deck recommendation to adjust",
      "running": "Building...",
      "deckTitle": "Recommended deck",
      "deckPower": "Power",
      "deckBonus": "Event bonus {value}%",
      "rankingTitle": "Song PT Ranking",
      "rankingHint": "Estimated for multi live without boost; rate = PT per play × plays per hour",
      "rankingLoading": "Ranking songs...",
      "searchPlaceholder": "Search by song name, alias, or ID...",
      "allDifficulties": "All difficulties",
      "columns": {
        "song": "Song",
        "difficulty": "Difficulty",
        "eventPoint": "PT / play",
        "playsPerHour": "Plays / h",
        "pointsPerHour": "PT / h"
      },
      "playsPerHour": "Plays per hour",
      "playsPerHourHint": "Estimated from song length + 30 s between plays; adjust to your pace",
      "externalSettingsHint": "Set loops per hour and boost on the brush list",
      "brushName": "Brush name",
      "brushColor": "Brush color",
      "pointsPerHour": "Brush rate",
      "save": "Save brush",
      "noDeck": "Build a deck to see the song ranking",
      "rankingEmpty": "No matching songs",
      "rankingAliasSearching": "Matching aliases...",
      "selectHint": "Click a row in the ranking to choose the song"
    },
    "calendar": {
      "title": "Event Calendar",
      "noEvent": "Select an event with start/aggregate times to show the calendar",
      "clear": "Clear plan",
      "clearConfirmTitle": "Clear the whole calendar?",
      "clearConfirmDescription": "Every painted hour is cleared; your brushes stay",
      "tool": "Current brush",
      "toolValue": "Brush: {name}",
      "dayPoints": "Day PT",
      "dayTotal": "Total by day end",
      "reachesTarget": "Target met",
      "hourLabel": "{hour}:00",
      "dragHint": "Drag to fill a block of days × hours; painting with the same brush again erases. Cell numbers are loops per hour.",
      "touchHint": "Press and hold, then drag to fill a block of days × hours; painting with the same brush again erases",
      "playsPerHour": "{count} loops/h"
    },
    "batch": {
      "title": "Batch fill",
      "fromDay": "From day",
      "toDay": "To day",
      "fromHour": "From hour",
      "toHour": "To hour",
      "brush": "Brush",
      "apply": "Fill",
      "hint": "Fills these hours (inclusive) on every chosen day; pick the eraser to clear them"
    },
    "errors": {
      "noResult": "No usable deck was found, so PT per play cannot be estimated. Make sure the account has uploaded data and check the filters on the deck page."
    }
  }
} as const
