// Namespaces: catalog, cardCatalog, eventCatalog, gachaCatalog, musicCatalog
// Lazy bundle for the Sekai catalog pages (/cards, /events, /gachas, /music).
// Enum labels (units, attributes, rarities, event/gacha types, difficulties)
// stay in the core bundle because other features render them too.
export default {
  "catalog": {
    "region": {
      "label": "Server"
    },
    "search": {
      "label": "Search",
      "placeholder": "Search…",
      "clear": "Clear search"
    },
    "filters": {
      "title": "Filters",
      "reset": "Reset filters",
      "active": "{count} active"
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
      "ended": "Ended"
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
      "id": "ID",
      "assetName": "Asset name",
      "releaseAt": "Release time",
      "period": "Period",
      "viewAll": "View all",
      "viewAllCount": "View all ({count})",
      "zoom": "Click to enlarge",
      "showMore": "Show more",
      "showLess": "Show less",
      "unknown": "Unknown"
    },
    "lightbox": {
      "description": "Image preview",
      "zoomIn": "Zoom in",
      "zoomOut": "Zoom out",
      "openInNewTab": "Open in new tab"
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
  },

  // ---------------------------------------------------------------------
  // cardCatalog — owned by the cards module (src/modules/cards)
  // ---------------------------------------------------------------------
  "cardCatalog": {
  },

  // ---------------------------------------------------------------------
  // eventCatalog — owned by the events module (src/modules/events)
  // ---------------------------------------------------------------------
  "eventCatalog": {
  },

  // ---------------------------------------------------------------------
  // gachaCatalog — owned by the gachas module (src/modules/gachas)
  // ---------------------------------------------------------------------
  "gachaCatalog": {
  },

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {
  }
} as const
