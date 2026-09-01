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
  "eventCatalog": {},

  // ---------------------------------------------------------------------
  // gachaCatalog — owned by the gachas module (src/modules/gachas)
  // ---------------------------------------------------------------------
  "gachaCatalog": {},

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {}
} as const
