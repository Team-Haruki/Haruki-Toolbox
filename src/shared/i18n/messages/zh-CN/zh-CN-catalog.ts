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
