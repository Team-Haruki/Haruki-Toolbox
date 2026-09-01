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
  "eventCatalog": {
    "sort": {
      "start": "开始时间",
      "id": "ID"
    },
    "filters": {
      "bonusCharacters": "加成角色"
    },
    "chips": {
      "search": "搜索：{value}",
      "type": "类型：{value}",
      "status": "状态：{value}",
      "unit": "团体：{value}",
      "attr": "加成属性：{value}",
      "characters": "加成角色：{value}",
      "year": "年份：{value}"
    },
    "hero": {
      "banner": "横幅",
      "logo": "Logo",
      "background": "背景"
    },
    "timeline": {
      "rankingAnnounce": "排名公布",
      "distributionStart": "奖励发放"
    },
    "bonus": {
      "rarityTable": "稀有度 × 突破等级加成",
      "rarity": "稀有度",
      "masterRank": "突破 {rank}"
    },
    "cards": {
      "cardBonus": "卡牌 {rate}",
      "leaderBonus": "队长 {rate}",
      "story": "有剧情"
    },
    "musics": {
      "title": "活动歌曲",
      "empty": "该活动暂无歌曲。"
    },
    "chapters": {
      "empty": "该活动暂无章节数据。",
      "supplemental": "追加章节"
    },
    "teams": {
      "title": "欢乐嘉年华队伍",
      "empty": "该活动暂无队伍数据。"
    },
    "gachas": {
      "title": "相关卡池",
      "empty": "没有找到相关卡池。",
      "count": "{count} 个卡池",
      "byPickup": "PICK UP 卡片包含本次活动卡片的卡池",
      "byPeriod": "举办期间与本次活动重叠（前后 3 天）的卡池"
    },
    "rewards": {
      "title": "排名奖励",
      "rangeCount": "{count} 个名次区间",
      "empty": "该活动暂无排名奖励数据。",
      "unavailable": "当前服务器的数据不包含奖励详情，仅显示名次区间。",
      "rank": "第 {rank} 名",
      "rankRange": "第 {from}–{to} 名",
      "border": "榜线",
      "resourceType": {
        "jewel": "水晶",
        "paid_jewel": "付费水晶",
        "coin": "金币",
        "virtual_coin": "虚拟币",
        "material": "素材",
        "boost_item": "体力道具",
        "stamp": "表情",
        "honor": "称号",
        "bonds_honor": "羁绊称号",
        "skill_practice_ticket": "技能练习券",
        "practice_ticket": "练习券",
        "gacha_ticket": "招募券",
        "live_point": "LIVE 点数",
        "costume_3d": "服装",
        "avatar_costume": "虚拟服装",
        "avatar_accessory": "虚拟饰品",
        "avatar_motion": "虚拟动作",
        "event_item": "活动道具",
        "mysekai_item": "My SEKAI 道具",
        "mysekai_fixture": "My SEKAI 家具",
        "custom_profile_collection_item": "档案收藏品",
        "penlight": "荧光棒",
        "music": "歌曲",
        "card": "卡牌"
      }
    },
    "story": {
      "title": "活动剧情",
      "episodeCount": "{count} 话",
      "episode": "第 {no} 话"
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
