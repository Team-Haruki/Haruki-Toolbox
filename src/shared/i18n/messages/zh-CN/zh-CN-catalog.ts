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
      "search": "搜索：{query}",
      "level": "Lv.{range}",
      "notes": "物量 {value}",
      "character": "{name}（{scope}）",
      "append": "仅 APPEND"
    },
    "filters": {
      "levelAny": "不限",
      "appendOnly": "仅显示有 APPEND 谱面的歌曲",
      "mvType": "MV 类型",
      "scope": "关联方式",
      "scopeHint": "选择角色后可按箱曲 / Vocal 进一步筛选"
    },
    "detail": {
      "jacket": "封面",
      "sections": {
        "info": "基本信息"
      },
      "difficulties": {
        "empty": "暂无谱面信息。"
      },
      "player": {
        "seek": "播放进度",
        "error": "音频加载失败，请稍后重试。"
      },
      "unlock": {
        "title": "解锁条件"
      },
      "original": {
        "title": "原版 MV",
        "open": "在 {host} 打开"
      },
      "events": {
        "empty": "这首歌曲没有关联的活动。"
      }
    }
  }
} as const
