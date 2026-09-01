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
  "gachaCatalog": {},

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {
    "chips": {
      "search": "Search: {query}",
      "level": "Lv.{range}",
      "notes": "Notes {value}",
      "character": "{name} ({scope})",
      "append": "APPEND only"
    },
    "filters": {
      "levelAny": "Any",
      "appendOnly": "Only songs with an APPEND chart",
      "mvType": "MV type",
      "scope": "Relation",
      "scopeHint": "Pick a character to narrow down by box song / vocal"
    },
    "detail": {
      "jacket": "Jacket",
      "sections": {
        "info": "Overview"
      },
      "difficulties": {
        "empty": "No chart data."
      },
      "player": {
        "seek": "Playback position",
        "error": "Audio failed to load. Try again later."
      },
      "unlock": {
        "title": "Unlock condition"
      },
      "original": {
        "title": "Original MV",
        "open": "Open on {host}"
      },
      "events": {
        "empty": "This song is not linked to any event."
      }
    }
  }
} as const
