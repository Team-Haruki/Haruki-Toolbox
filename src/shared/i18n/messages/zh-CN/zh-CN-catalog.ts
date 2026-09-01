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
      "supply": "供给类型",
      "skillType": "技能类型"
    },
    "sort": {
      "release": "上线时间",
      "rarity": "稀有度",
      "id": "卡牌 ID",
      "power": "综合力"
    },
    "artMode": {
      "label": "卡面显示",
      "normal": "特训前",
      "trained": "特训后",
      "both": "两者"
    },
    "skillTypes": {
      "score_up": "分数提升",
      "judgment_up": "判定强化",
      "life_recovery": "体力回复",
      "score_up_condition_life": "体力条件分数提升",
      "score_up_keep": "持续型分数提升",
      "score_up_character_rank": "角色等级分数提升",
      "other_member_score_up_reference_rate": "参照队友分数提升",
      "score_up_unit_count": "同团人数分数提升"
    },
    "detail": {
      "viewCharacterCards": "该角色的全部卡牌",
      "art": {
        "normal": "特训前",
        "trained": "特训后"
      },
      "info": {
        "title": "卡牌信息",
        "character": "角色",
        "unit": "团体",
        "supportUnit": "支援团体",
        "attr": "属性",
        "rarity": "稀有度",
        "supply": "供给类型",
        "releaseAt": "上线时间",
        "gachaPhrase": "招募语音",
        "flavorText": "卡牌文案"
      },
      "power": {
        "title": "综合力",
        "hint": "基础综合力，不含区域道具、称号与角色等级加成。",
        "noData": "暂无综合力数据",
        "total": "总计",
        "perf": "演出",
        "tech": "技巧",
        "stam": "体力",
        "level": "等级",
        "trained": "特训",
        "episodes": "剧情",
        "canvas": "MySekai 画布",
        "masterRank": "突破"
      },
      "skill": {
        "title": "技能",
        "empty": "暂无技能数据",
        "beforeTraining": "特训前",
        "afterTraining": "特训后",
        "level": "技能等级",
        "value": "数值",
        "duration": "持续时间"
      },
      "episodes": {
        "title": "卡牌剧情",
        "empty": "暂无卡牌剧情",
        "count": "{count} 话",
        "powerBonus": "综合力 +{value}",
        "costs": "解锁消耗",
        "cost": "{resource} ×{quantity}",
        "material": "素材 #{id}",
        "partType": {
          "first_part": "前篇",
          "second_part": "后篇"
        }
      },
      "relatedEvents": {
        "title": "关联活动",
        "empty": "没有关联活动。",
        "cardBonus": "卡牌 +{value}%",
        "leaderBonus": "队长 +{value}%",
        "story": "有卡牌剧情"
      },
      "relatedGachas": {
        "title": "关联卡池",
        "empty": "没有关联卡池。"
      },
      "sameCharacter": {
        "title": "该角色的其他卡牌",
        "empty": "没有其他卡牌。",
        "count": "共 {count} 张"
      }
    }
  },

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
