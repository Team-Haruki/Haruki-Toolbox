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
      "gift": "赠送卡池"
    },
    "list": {
      "pickupCharacters": "PICK UP 角色",
      "sort": {
        "start": "开始时间",
        "id": "ID"
      },
      "chips": {
        "search": "搜索：{query}",
        "year": "{year} 年",
        "card": "卡牌：{name}",
        "cardId": "卡牌 #{id}"
      }
    },
    "detail": {
      "pickupCards": "查看 PICK UP 角色卡牌",
      "lightbox": {
        "banner": "横幅",
        "logo": "Logo"
      }
    },
    "pickups": {
      "empty": "该卡池没有 PICK UP 成员",
      "wishHint": "本卡池可选择最多 {count} 张许愿卡牌"
    },
    "rates": {
      "description": "单次招募中各稀有度的提供概率，按卡池数据中的抽选类型分列",
      "bar": "稀有度概率分布",
      "perCard": "单卡概率",
      "empty": "暂无提供概率数据",
      "wishNote": "本卡池支持许愿：可选择最多 {count} 张卡牌，被选中的卡牌拥有独立的许愿概率。",
      "lottery": {
        "normal": "普通抽选",
        "categorized_wish": "许愿抽选",
        "rate_choice_first": "许愿抽选（第 1 张）",
        "rate_choice_second": "许愿抽选（第 2 张）"
      }
    },
    "simulator": {
      "title": "招募模拟器",
      "description": "按卡池数据中的提供概率在本地随机模拟，仅供娱乐",
      "pullSingle": "单抽",
      "pullTen": "十连",
      "free": "免费",
      "pulls": "已招募 {count} 抽",
      "spent": "消耗",
      "lastBatch": "本次结果",
      "new": "NEW",
      "guaranteed": "保底",
      "reset": "重置",
      "idle": "点击「单抽」或「十连」开始模拟。",
      "unavailable": "该卡池没有可供模拟的抽选数据。",
      "disclaimer": "本模拟器为玩家自制的非官方工具，结果由本地随机数生成，不代表游戏内的实际抽取结果。"
    },
    "pool": {
      "summary": "{count} 张卡牌",
      "filtered": "共 {count} 张卡牌",
      "search": "搜索卡牌名、角色或 ID…",
      "empty": "该卡池没有可展示的卡牌",
      "pickup": "PICK UP",
      "wish": "许愿"
    },
    "behaviors": {
      "summary": "{count} 种招募方式",
      "empty": "该卡池没有招募方式数据",
      "free": "免费",
      "unlimited": "不限"
    },
    "ceil": {
      "title": "兑换贴纸与交换所",
      "empty": "该卡池没有兑换贴纸",
      "convertAt": "{time} 起转换为通用贴纸",
      "exchange": "贴纸交换所",
      "exchangeEmpty": "当前服务器没有该卡池的交换所数据",
      "rewardsUnavailable": "当前服务器未提供奖励详情，仅显示奖励箱编号。",
      "reward": "奖励",
      "cost": "所需贴纸",
      "limit": "限购",
      "unlimited": "不限",
      "rewardBox": "奖励箱 #{id}",
      "substitute": "可替代：{cost}",
      "label": {
        "limited": "限定",
        "fes": "Fes"
      },
      "resource": {
        "card": "卡牌",
        "material": "素材",
        "gacha_ceil_item": "贴纸",
        "jewel": "水晶",
        "honor": "称号"
      }
    },
    "related": {
      "title": "关联活动",
      "empty": "未找到关联活动",
      "pickup": "共享 {count} 张 PICK UP 卡牌",
      "period": "同期开催"
    },
    "information": {
      "title": "招募说明与注意事项",
      "empty": "该卡池没有说明文本"
    }
  },

  // ---------------------------------------------------------------------
  // musicCatalog — owned by the music-library module (src/modules/music-library)
  // ---------------------------------------------------------------------
  "musicCatalog": {}
} as const
