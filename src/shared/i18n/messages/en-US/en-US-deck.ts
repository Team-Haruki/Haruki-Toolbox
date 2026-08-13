// AUTO-GENERATED split of the former monolithic en-US locale file.
// Namespaces: deckRecommend, eventPlanner
export default {
  "deckRecommend": {
    "title": "Deck Recommendation",
    "description": "Choose account, data region, mode, and song parameters to get the best possible event deck recommendation.",
    "notice": {
      "testingPrefix": "This feature is still being tested.",
      "testingSuffix": " If you run into any issue, please contact Haruki Dev Team."
    },
    "select": {
      "loading": "Preparing data..."
    },
    "configActions": {
      "save": "Save config",
      "clear": "Clear config",
      "clearDialogTitle": "Clear saved config?",
      "clearDialogDescription": "This removes the saved deck recommendation config and resets the current page to defaults. Continue?",
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
      "dataRegion": "Data server",
      "mode": "Recommendation mode",
      "target": "Recommendation target",
      "liveType": "Live type",
      "algorithm": "Search algorithms",
      "algorithmHint": "The default algorithm follows the current scenario: exact DFS (provably optimal) for score targets, DFS-GA for World Bloom and other complex scenarios, and reinforcement learning for MySekai. Manual selections are kept; enabling multiple algorithms cross-checks results but takes longer overall.",
      "executionMode": "Execution mode",
      "event": "Event",
      "eventPlaceholder": "Select an event",
      "eventSearchPlaceholder": "Search event name, #ID, type, pinyin, or romaji...",
      "eventEmpty": "No event found.",
      "character": "Character",
      "characterPlaceholder": "Select a character",
      "bonusTargets": "Target bonuses",
      "bonusTargetsPlaceholder": "e.g. 100 120 130",
      "bonusTargetsHint": "Enter one or more integer targets separated by spaces or commas.",
      "bonusTargetsInvalid": "Target bonuses must be positive integers separated by spaces or commas.",
      "customBonusAttr": "Custom bonus attribute",
      "customBonusAttrNone": "Not specified",
      "customBonusCharacters": "Custom bonus characters",
      "customBonusCharactersPlaceholder": "e.g. 1 2 21",
      "customBonusSupportUnits": "VS support units",
      "customBonusSupportUnitsPlaceholder": "e.g. 21:light_sound 25:school_refusal",
      "customBonusSelectedCount": "{count} characters selected",
      "customBonusSupportUnitsEmpty": "Select Virtual Singer characters 21-26 to assign support units.",
      "filterOtherUnit": "Filter other units",
      "customBonusHint": "Choose custom mixed-event bonus characters here. VS characters can also receive support unit assignments.",
      "customBonusInvalid": "Custom bonus conditions are not formatted correctly.",
      "customBonusSupportUnitsTargetInvalid": "VS support unit characters must also be listed in custom bonus characters.",
      "music": "Music",
      "musicPlaceholder": "Select a music",
      "musicSearchPlaceholder": "Search music name, #ID, kana, pinyin, or romaji...",
      "musicEmpty": "No music found.",
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
      "default": {
        "title": "Default Settings",
        "description": "Choose account, event, live, music, and search mode. Multi-live teammates follow the current deck by default."
      },
      "advanced": {
        "title": "Advanced Settings",
        "description": "Tune card training, filters, multi-live parameters, and deck constraints."
      },
      "expert": {
        "title": "Expert Settings",
        "description": "Tune skill strategy, support assumptions, engine timeout, and precise single-card overrides."
      }
    },
    "groups": {
      "accountTarget": "Account & Target",
      "musicAlgorithm": "Music & Algorithms"
    },
    "modes": {
      "event": "Event deck",
      "challenge": "Challenge deck",
      "bonus": "Bonus deck",
      "mysekai": "MySekai deck",
      "max": "Strongest deck"
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
        "title": "Event Conditions",
        "description": "Select a published event, or enable simulated event to customize event type, attribute, unit, and chapter."
      },
      "bonus": {
        "title": "Bonus Conditions",
        "description": "Set one or more target bonuses and generate matching Solo Live decks."
      },
      "eventSimulation": {
        "title": "Simulated Event",
        "description": "Recommend against a custom event type, attribute, and unit without relying on a published event.",
        "unavailable": "The current mode does not use event data, so simulated events are unavailable.",
        "realEventDisabled": "Simulated event is enabled. The selected real event will not be used.",
        "activeHint": "The simulated event overrides the real event ID, and recommendation uses the current simulated conditions.",
        "type": "Event type",
        "attr": "Attribute",
        "unit": "Unit",
        "worldBloomTurn": "Chapter",
        "worldBloomTurnOption": "Turn {turn}",
        "worldBloomCharacter": "Character",
        "invalid": "Complete simulated event parameters. World Link turn 1/2 requires a character whose unit can be resolved.",
        "customBonusUnit": "Custom bonus characters",
        "customBonusTitle": "Custom Bonus Characters",
        "customBonusSummary": "{count} bonus characters selected. Matching character cards receive +25% bonus.",
        "customBonusConfigure": "Configure custom bonus characters",
        "customBonusDescription": "Choose characters that receive the simulated event bonus. Virtual Singer characters can be assigned VS support units, and other units can be filtered out.",
        "customBonusDone": "Done",
        "customBonusInvalid": "Select an attribute and at least one custom bonus character."
      },
      "multiLive": {
        "title": "Multi Live Parameters",
        "description": "Used by Multi Live. Leave teammate power and skill value empty to approximate teammates with the current deck.",
        "teammatePower": "Teammate power",
        "teammateScoreUp": "Teammate skill value",
        "followSelfPlaceholder": "Follow current deck",
        "scoreUpLowerBound": "Minimum skill value",
        "scoreUpLowerBoundPlaceholder": "No limit",
        "disabled": "The current live type does not use multi-live parameters.",
        "invalid": "Multi-live parameters must be numbers greater than or equal to 0."
      },
      "filters": {
        "title": "Advanced Filters",
        "description": "Limit available cards by characters, units, or attributes.",
        "none": "No limit",
        "selectedCount": "{count} selected",
        "unit": "Unit filter",
        "attr": "Attribute filter",
        "character": "Character filter",
        "characterSelectPlaceholder": "Select filter characters",
        "characterMinHint": "Character filter limits the candidate card pool. Select at least {count} characters when enabled so a full deck can be built.",
        "characterMinInvalid": "Select at least {count} characters when character filter is enabled.",
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
        "invalid": "Live boost count must be an integer from 0 to 10; override levels or bonuses must be valid in-range values."
      },
      "dataOverrides": {
        "title": "Temporary Data Overrides",
        "description": "Affects only the data sent to the engine for this recommendation and does not update uploaded data.",
        "invalid": "Override levels or bonuses must be valid in-range values."
      },
      "runParameters": {
        "title": "Run Parameters",
        "description": "Adjust base calculation parameters for this recommendation.",
        "invalid": "Live boost count must be an integer from 0 to 10."
      },
      "constraints": {
        "title": "Deck Constraints",
        "description": "Force or exclude cards. Current main deck, fixed cards, and fixed characters are mutually exclusive.",
        "fixedGroup": "Forced members",
        "fixedGroupDescription": "Fixed cards are capped at 5 with only 1 card per character; fixed characters are capped at 5.",
        "excludedGroup": "Exclusion rules",
        "excludedGroupDescription": "Remove any number of cards from the candidate pool without affecting the fixed-card limit.",
        "fixedCards": "Fixed cards",
        "useCurrentDeck": "Use current main deck",
        "useCurrentDeckDescription": "Use the current profile main deck as the fixed deck.",
        "fixedCharacters": "Fixed characters",
        "excludedCards": "Excluded cards",
        "cardSelectPlaceholder": "Search and select cards",
        "fixedCardSelectPlaceholder": "Select fixed cards",
        "excludedCardSelectPlaceholder": "Select excluded cards",
        "cardSearchPlaceholder": "Search card name, #ID, character, unit, attribute, rarity, or pinyin...",
        "cardEmpty": "No card found.",
        "noSelectedCards": "No cards selected.",
        "selectedCardsCount": "{count} cards selected",
        "selectedCardsLimitCount": "{count}/{max} cards selected",
        "removeCard": "Remove card",
        "characterSelectPlaceholder": "Select fixed characters",
        "characterNone": "No character specified",
        "noSelectedCharacters": "No characters selected.",
        "selectedCharactersCount": "{count}/{max} characters selected",
        "removeCharacter": "Remove character",
        "characterListPlaceholder": "e.g. 1 2 21",
        "invalid": "Character IDs must be positive integers separated by spaces or commas.",
        "challengeHint": "Challenge Live already uses the selected character, so fixed characters are unavailable.",
        "currentDeckHint": "Prefers the current main deck from the game profile and falls back to uploaded data. Forced members and exclusion rules are ignored while the current main deck is enabled."
      },
      "random": {
        "title": "Skills and Support",
        "description": "Control skill order, BFes skill reference strategy, and World Link support training assumptions.",
        "skillGroup": "Skill strategy",
        "skillGroupDescription": "Tune skill activation order and BFes skill reference behavior.",
        "skillOrder": "Skill order",
        "specificSkillOrder": "Specific skill order",
        "specificSkillOrderPlaceholder": "e.g. 12345",
        "specificSkillOrderHint": "Enter a non-repeating order using 1-5. 1 means the leader slot; useful with a fixed current deck.",
        "specificSkillOrderInvalid": "Specific skill order must contain 1-5 without duplicates, for example 12345.",
        "skillReference": "BFes skill reference",
        "keepAfterTrainingState": "Keep dual-skill state",
        "keepAfterTrainingStateDescription": "Preserve the pre/post-training skill state instead of forcing a switch.",
        "supportGroup": "World Link support",
        "supportGroupDescription": "Only affects training assumptions for the World Link support deck.",
        "supportMasterMax": "Support max Master Rank",
        "supportMasterMaxDescription": "Treat support cards as max Master Rank during calculation.",
        "supportSkillMax": "Support max skill",
        "supportSkillMaxDescription": "Treat support cards as max skill level during calculation."
      },
      "areaItemOverride": {
        "title": "Area Item Overrides",
        "description": "Temporarily override individual area item levels, defaults to no override.",
        "priorityHint": "Individual item overrides take priority over the area item level in Advanced Filters.",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable area items are available in the current data.",
        "searchPlaceholder": "Search level...",
        "emptySearch": "No level found.",
        "areaFallback": "Area #{id}",
        "itemFallback": "Item #{id}",
        "targetFallback": "Target #{id}",
        "kinds": {
          "character": "Character items",
          "unit": "Unit items",
          "attr": "Attribute items"
        }
      },
      "characterRankOverride": {
        "title": "Character Rank Overrides",
        "description": "Temporarily override character rank per character, defaults to no override.",
        "priorityHint": "Per-character overrides take priority over the unified Character Rank in Advanced Filters.",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable character ranks are available in the current data.",
        "searchPlaceholder": "Search rank...",
        "emptySearch": "No rank found.",
        "maxRank": "Max Rank {value}"
      },
      "mysekaiGateOverride": {
        "title": "MySekai Gate Overrides",
        "description": "Temporarily override individual MySekai gate levels, defaults to no override.",
        "priorityHint": "Per-gate overrides take priority over the unified MySekai gate level in Advanced Filters.",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable MySekai gates are available in the current data.",
        "searchPlaceholder": "Search level...",
        "emptySearch": "No level found.",
        "maxLevel": "Max Lv.{value}"
      },
      "mysekaiFixtureBonusOverride": {
        "title": "Fixture Bonus Overrides",
        "description": "Temporarily override MySekai fixture power bonus per character, defaults to no override.",
        "priorityHint": "Per-character overrides take priority over the unified fixture bonus in Advanced Filters.",
        "selectedCount": "{count} overridden",
        "clear": "Clear overrides",
        "default": "No override",
        "empty": "No overridable characters are available in the current data.",
        "searchPlaceholder": "Search bonus...",
        "emptySearch": "No bonus found.",
        "maxRate": "Max {value}"
      },
      "engine": {
        "title": "Deck Engine Parameters",
        "description": "Adjust only result count and timeout. Low-level search parameters stay automatically configured.",
        "resultLimit": "Result count",
        "resultLimitPlaceholder": "Default 6",
        "timeoutMs": "Timeout (ms)",
        "timeoutMsPlaceholder": "Default 15000",
        "invalid": "Result count must be an integer from 1-50; timeout must be an integer from 1000-300000 ms."
      }
    },
    "training": {
      "title": "Card Training",
      "description": "Set default training assumptions by card rarity.",
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
      "description": "Override level, skill, Master Rank, episodes, and canvas settings for specific cards. These settings take priority over rarity defaults. Fixed cards are automatically added here using the current rarity defaults.",
      "card": "Card",
      "cardPlaceholder": "Select card",
      "cardSearchPlaceholder": "Search card name or ID...",
      "cardEmpty": "No card found.",
      "add": "Add",
      "empty": "No single-card overrides yet.",
      "selectedCount": "{count} single-card overrides added",
      "inherit": "Use rarity default",
      "level": "Level",
      "skillLevel": "Skill",
      "masterRank": "Master Rank",
      "levelOption": "Lv.{value}",
      "skillLevelOption": "Skill Lv.{value}",
      "masterRankOption": "Master Rank {value}",
      "numberSearchPlaceholder": "Search value...",
      "numberEmpty": "No value found.",
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
      "ready": "Complete the required options to start recommendation.",
      "run": "Run recommendation",
      "running": "Running...",
      "phases": {
        "preparing-data": "Preparing master data and music metas...",
        "fetching-user-data": "Loading user data...",
        "initializing": "Initializing deck engine...",
        "loading-data": "Loading recommendation data...",
        "recommending": "Running recommendation..."
      }
    },
    "result": {
      "title": "Recommendation Result",
      "description": "Deck results will appear here after the recommendation finishes.",
      "idlePlaceholder": "Finish the configuration above and hit Start — recommended decks will appear here.",
      "actions": {
        "compare": "Compare",
        "compareTitle": "Deck Comparison",
        "compareBaseline": "Baseline",
        "copy": "Copy deck",
        "copied": "Deck info copied to clipboard.",
        "copyFailed": "Copy failed — check the browser clipboard permission.",
        "songRanking": "Song ranking"
      },
      "elapsed": "Deck engine total elapsed {ms} ms",
      "totalElapsed": "Recommendation total elapsed {ms} ms",
      "dataElapsed": "Data fetch",
      "engineDataElapsed": "Deck engine data preparation",
      "sequentialRecommendElapsed": "Sequential recommendation (wall time)",
      "parallelRecommendElapsed": "Parallel recommendation (wall time)",
      "algorithmElapsed": "{algorithm} search: {ms} ms",
      "empty": "No recommendation result yet.",
      "deckTitle": "Deck #{index}",
      "score": "score {score}",
      "totalPower": "Power {value}",
      "totalPowerLimitWarning": "This event caps total power at {value}",
      "eventCardBonusLimitWarning": "This event counts current-event card bonus for only {count} members.",
      "eventSkillScoreUpLimitWarning": "This event caps card skill score bonus at {value}%.",
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
      "cardGroups": {
        "power": "Power",
        "training": "Training",
        "skillBonus": "Skill & bonus",
        "storyCanvas": "Stories & canvas"
      },
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
      "canvasBonus": "Canvas bonus",
      "noCanvasBonus": "No canvas"
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
    "title": "Event Planner",
    "description": "Paint the event calendar with points-per-hour brushes and track the gap to your target PT in real time.",
    "sections": {
      "setup": {
        "title": "Account & Event",
        "description": "Pick a bound account, the data server and the event; World Link events can select a chapter character."
      }
    },
    "form": {
      "targetPoint": "Target PT",
      "targetPointPlaceholder": "e.g. 1000w, 120万, 1.5亿",
      "currentPoint": "Current PT",
      "currentPointPlaceholder": "e.g. 25k, empty means 0",
      "parsedValue": "Parsed as {value}",
      "invalidPoint": "Cannot parse this value; use a non-negative number, optionally with 万/w, k or 亿 suffix."
    },
    "summary": {
      "targetPoint": "Target PT",
      "currentPoint": "Current PT",
      "plannedPoint": "Planned PT",
      "remainingPoint": "Still missing",
      "dailyPoint": "Daily pace",
      "plannedHours": "{hours} h planned · {rest} h rest",
      "reached": "The plan already covers the target PT!"
    },
    "brushes": {
      "title": "Hourly-Rate Brushes",
      "description": "Select a brush and click or drag on the calendar to fill; painting over the same brush erases it.",
      "rest": "Rest",
      "eraser": "Eraser",
      "add": "New brush",
      "perHour": "{points}/h",
      "edit": "Edit brush",
      "delete": "Delete brush",
      "playsUnit": "loops/h",
      "playsTitle": "Loops per hour",
      "boostTitle": "Boost fires spent per play",
      "boostOption": "{count} fire ×{multiplier}",
      "empty": "No brushes yet — click \"New brush\" to build a deck and pick a song."
    },
    "dialog": {
      "title": "New Hourly-Rate Brush",
      "description": "Build a deck straight from the selected event, then pick a song from the PT ranking.",
      "runDeck": "Build deck for event",
      "useSavedConfig": "Use the deck page's detailed settings",
      "savedConfigHint": "Deck parameters (algorithms, teammates, area item / character rank overrides, fixed/excluded cards, training config, …) follow the deck recommend page's saved settings; tweak them there and rebuild here.",
      "openDeckRecommend": "Open deck recommend to adjust",
      "running": "Building...",
      "deckTitle": "Recommended deck",
      "deckPower": "Power",
      "deckBonus": "Event bonus {value}%",
      "rankingTitle": "Song PT Ranking",
      "rankingHint": "Engine estimate for every song with this deck (multi live, no boost); rate = PT per play × plays per hour.",
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
      "playsPerHourHint": "Estimated from song length + 30 s between plays; adjust to your pace.",
      "externalSettingsHint": "Loops per hour and boost are adjusted on the brush list; the rate follows.",
      "brushName": "Brush name",
      "brushColor": "Brush color",
      "pointsPerHour": "Brush rate",
      "save": "Save brush",
      "noDeck": "Build a deck first to generate the song ranking.",
      "rankingEmpty": "No matching songs.",
      "rankingAliasSearching": "Matching aliases...",
      "selectHint": "Click a row in the ranking to choose the song."
    },
    "calendar": {
      "title": "Event Calendar",
      "noEvent": "Select an event with start/aggregate times to show the calendar.",
      "clear": "Clear plan",
      "hourLabel": "{hour}:00",
      "dragHint": "Click to fill one cell, or drag to batch-fill a rectangle of days × hours; selecting with the same brush again erases. Cell numbers are loops per hour.",
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
      "hint": "Fills the selected daily hour range (inclusive) across the chosen days with the selected brush; pick the eraser to batch-clear."
    },
    "toasts": {
      "remaining": "{planned} PT planned — {remaining} PT still missing",
      "reached": "{planned} PT planned — target covered!"
    },
    "errors": {
      "noResult": "The recommend engine returned no usable deck, so PT per play cannot be computed."
    }
  }
} as const
