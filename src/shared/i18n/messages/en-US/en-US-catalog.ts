// Namespaces: cardCatalog, eventCatalog, gachaCatalog, musicCatalog
// Lazy bundle for the Sekai catalog pages (/cards, /events, /gachas, /music).
// Shared shell strings live in the core bundle under `catalog.*`; enum labels
// (units, attributes, rarities, event/gacha types, difficulties) stay in core too.
export default {
  // ---------------------------------------------------------------------
  // cardCatalog — owned by the cards module (src/modules/cards)
  // ---------------------------------------------------------------------
  "cardCatalog": {
    "filters": {
      "supply": "Supply type",
      "skillType": "Skill type"
    },
    "sort": {
      "release": "Release date",
      "rarity": "Rarity",
      "id": "Card ID",
      "power": "Power"
    },
    "artMode": {
      "label": "Artwork",
      "normal": "Normal",
      "trained": "Trained",
      "both": "Both"
    },
    "skillTypes": {
      "score_up": "Score up",
      "judgment_up": "Judgment up",
      "life_recovery": "Life recovery",
      "score_up_condition_life": "Life-conditional score up",
      "score_up_keep": "Sustained score up",
      "score_up_character_rank": "Character-rank score up",
      "other_member_score_up_reference_rate": "Teammate-referencing score up",
      "score_up_unit_count": "Unit-count score up"
    },
    "detail": {
      "viewCharacterCards": "All cards of this character",
      "art": {
        "normal": "Normal",
        "trained": "Trained"
      },
      "info": {
        "title": "Card info",
        "character": "Character",
        "unit": "Unit",
        "supportUnit": "Support unit",
        "attr": "Attribute",
        "rarity": "Rarity",
        "supply": "Supply type",
        "releaseAt": "Released",
        "gachaPhrase": "Gacha phrase",
        "flavorText": "Flavor text"
      },
      "power": {
        "title": "Power",
        "hint": "Base power, without area items, titles or character-rank bonuses.",
        "noData": "No power data",
        "total": "Total",
        "perf": "Performance",
        "tech": "Technique",
        "stam": "Stamina",
        "level": "Level",
        "trained": "Special training",
        "episodes": "Side story",
        "canvas": "MySekai canvas",
        "masterRank": "Master rank"
      },
      "skill": {
        "title": "Skill",
        "empty": "No skill data",
        "beforeTraining": "Before training",
        "afterTraining": "After training",
        "level": "Skill level",
        "value": "Value",
        "duration": "Duration"
      },
      "episodes": {
        "title": "Side stories",
        "empty": "No side stories",
        "count": "{count} episodes",
        "powerBonus": "Power +{value}",
        "costs": "Unlock cost",
        "cost": "{resource} ×{quantity}",
        "material": "Material #{id}",
        "partType": {
          "first_part": "Part 1",
          "second_part": "Part 2"
        }
      },
      "relatedEvents": {
        "title": "Related events",
        "empty": "No related events.",
        "cardBonus": "Card +{value}%",
        "leaderBonus": "Leader +{value}%",
        "story": "Card story"
      },
      "relatedGachas": {
        "title": "Related gachas",
        "empty": "No related gachas."
      },
      "sameCharacter": {
        "title": "More cards of this character",
        "empty": "No other cards.",
        "count": "{count} cards"
      }
    }
  },

  // ---------------------------------------------------------------------
  // eventCatalog — owned by the events module (src/modules/events)
  // ---------------------------------------------------------------------
  "eventCatalog": {
    "sort": {
      "start": "Start time",
      "id": "ID"
    },
    "filters": {
      "bonusCharacters": "Bonus characters"
    },
    "chips": {
      "search": "Search: {value}",
      "type": "Type: {value}",
      "status": "Status: {value}",
      "unit": "Unit: {value}",
      "attr": "Bonus attribute: {value}",
      "characters": "Bonus characters: {value}",
      "year": "Year: {value}"
    },
    "hero": {
      "banner": "Banner",
      "logo": "Logo",
      "background": "Background"
    },
    "timeline": {
      "rankingAnnounce": "Ranking announced",
      "distributionStart": "Rewards distributed"
    },
    "bonus": {
      "rarityTable": "Rarity × master rank bonus",
      "rarity": "Rarity",
      "masterRank": "MR {rank}"
    },
    "cards": {
      "cardBonus": "Card {rate}",
      "leaderBonus": "Leader {rate}",
      "story": "Has story"
    },
    "musics": {
      "title": "Event songs",
      "empty": "No songs for this event."
    },
    "chapters": {
      "empty": "No chapter data for this event.",
      "supplemental": "Supplemental"
    },
    "teams": {
      "title": "Cheerful Carnival teams",
      "empty": "No team data for this event."
    },
    "gachas": {
      "title": "Related gachas",
      "empty": "No related gachas found.",
      "count": "{count} gachas",
      "byPickup": "Gachas whose pickup cards include an event card",
      "byPeriod": "Gachas whose run overlaps the event period (±3 days)"
    },
    "rewards": {
      "title": "Ranking rewards",
      "rangeCount": "{count} rank ranges",
      "empty": "No ranking reward data for this event.",
      "unavailable": "Reward details are unavailable on this server; only the rank ranges are shown.",
      "rank": "Rank {rank}",
      "rankRange": "Rank {from}–{to}",
      "border": "Border",
      "resourceType": {
        "jewel": "Crystals",
        "paid_jewel": "Paid crystals",
        "coin": "Coins",
        "virtual_coin": "Virtual coins",
        "material": "Material",
        "boost_item": "Energy item",
        "stamp": "Stamp",
        "honor": "Title",
        "bonds_honor": "Bond title",
        "skill_practice_ticket": "Skill practice ticket",
        "practice_ticket": "Practice ticket",
        "gacha_ticket": "Gacha ticket",
        "live_point": "Live points",
        "costume_3d": "Costume",
        "avatar_costume": "Virtual costume",
        "avatar_accessory": "Virtual accessory",
        "avatar_motion": "Virtual motion",
        "event_item": "Event item",
        "mysekai_item": "My SEKAI item",
        "mysekai_fixture": "My SEKAI fixture",
        "custom_profile_collection_item": "Profile collection item",
        "penlight": "Penlight",
        "music": "Song",
        "card": "Card"
      }
    },
    "story": {
      "title": "Event story",
      "episodeCount": "{count} episodes",
      "episode": "Episode {no}"
    }
  },

  // ---------------------------------------------------------------------
  // gachaCatalog — owned by the gachas module (src/modules/gachas)
  // ---------------------------------------------------------------------
  "gachaCatalog": {},

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {}
} as const
