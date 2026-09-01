// Namespaces: cardCatalog, eventCatalog, gachaCatalog, musicCatalog
// Lazy bundle for the Sekai catalog pages (/cards, /events, /gachas, /music).
// Shared shell strings live in the core bundle under `catalog.*`; enum labels
// (units, attributes, rarities, event/gacha types, difficulties) stay in core too.
export default {
  // ---------------------------------------------------------------------
  // cardCatalog — owned by the cards module (src/modules/cards)
  // ---------------------------------------------------------------------
  "cardCatalog": {},

  // ---------------------------------------------------------------------
  // eventCatalog — owned by the events module (src/modules/events)
  // ---------------------------------------------------------------------
  "eventCatalog": {},

  // ---------------------------------------------------------------------
  // gachaCatalog — owned by the gachas module (src/modules/gachas)
  // ---------------------------------------------------------------------
  "gachaCatalog": {
    "type": {
      "gift": "Gift gacha"
    },
    "list": {
      "pickupCharacters": "Pickup characters",
      "sort": {
        "start": "Start date",
        "id": "ID"
      },
      "chips": {
        "search": "Search: {query}",
        "year": "{year}",
        "card": "Card: {name}",
        "cardId": "Card #{id}"
      }
    },
    "detail": {
      "pickupCards": "Pickup characters' cards",
      "lightbox": {
        "banner": "Banner",
        "logo": "Logo"
      }
    },
    "pickups": {
      "empty": "This gacha has no pickup members",
      "wishHint": "Up to {count} wish cards can be selected in this gacha"
    },
    "rates": {
      "description": "Rate per rarity for a single pull, one column per lottery type in the gacha data",
      "bar": "Rarity rate distribution",
      "perCard": "Per card",
      "empty": "No rate data available",
      "wishNote": "This gacha supports wishes: up to {count} cards can be selected, and selected cards get their own wish rate.",
      "lottery": {
        "normal": "Normal",
        "categorized_wish": "Wish",
        "rate_choice_first": "Wish (1st)",
        "rate_choice_second": "Wish (2nd)"
      }
    },
    "simulator": {
      "title": "Pull simulator",
      "description": "Local random simulation using the rates in the gacha data, for fun only",
      "pullSingle": "Pull ×1",
      "pullTen": "Pull ×10",
      "free": "Free",
      "pulls": "{count} pulls",
      "spent": "Spent",
      "lastBatch": "Latest results",
      "new": "NEW",
      "guaranteed": "Guaranteed",
      "reset": "Reset",
      "idle": "Press Pull ×1 or Pull ×10 to start.",
      "unavailable": "This gacha has no lottery data to simulate.",
      "disclaimer": "This fan-made simulator is unofficial: results come from a local random number generator and do not reflect actual in-game pulls."
    },
    "pool": {
      "summary": "{count} cards",
      "filtered": "{count} cards",
      "search": "Search card, character or ID…",
      "empty": "No cards to show for this gacha",
      "pickup": "PICK UP",
      "wish": "Wish"
    },
    "behaviors": {
      "summary": "{count} pull options",
      "empty": "No pull options in this gacha",
      "free": "Free",
      "unlimited": "Unlimited"
    },
    "ceil": {
      "title": "Sticker & exchange",
      "empty": "This gacha has no exchange sticker",
      "convertAt": "Converts to the generic sticker from {time}",
      "exchange": "Sticker exchange",
      "exchangeEmpty": "No exchange data for this gacha on the current server",
      "rewardsUnavailable": "Reward details are not available on the current server; only box ids are shown.",
      "reward": "Reward",
      "cost": "Stickers",
      "limit": "Limit",
      "unlimited": "Unlimited",
      "rewardBox": "Reward box #{id}",
      "substitute": "Substitute: {cost}",
      "label": {
        "limited": "Limited",
        "fes": "Fes"
      },
      "resource": {
        "card": "Card",
        "material": "Material",
        "gacha_ceil_item": "Sticker",
        "jewel": "Crystals",
        "honor": "Title"
      }
    },
    "related": {
      "title": "Related events",
      "empty": "No related events found",
      "pickup": "{count} shared pickup cards",
      "period": "Same period"
    },
    "information": {
      "title": "Summary & notes",
      "empty": "This gacha has no information text"
    }
  },

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {}
} as const
