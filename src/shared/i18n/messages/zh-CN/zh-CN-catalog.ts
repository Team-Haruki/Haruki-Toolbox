// Namespaces: cardCatalog, eventCatalog, gachaCatalog, musicCatalog, storyPlayer
// Lazy bundle for the Sekai catalog pages (/cards, /events, /gachas, /music)
// and the story player (/story).
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
    "skillFilters": {
      "score_up": "分卡",
      "score_up_perfect": "P分",
      "judgment_up": "判卡",
      "life_recovery": "奶卡",
      "score_up_condition_life": "血分",
      "score_up_keep": "判分",
      "sub_unit_score_up": "团分",
      "score_up_unit_count": "混团分",
      "other_member_score_up_reference_rate": "参照分"
    },
    "skillTypes": {
      "score_up": "分数提升",
      "judgment_up": "判定强化",
      "life_recovery": "体力回复",
      "score_up_condition_life": "体力条件分数提升",
      "score_up_keep": "持续型分数提升",
      "score_up_character_rank": "角色等级分数提升",
      "other_member_score_up_reference_rate": "参照队友分数提升",
      "score_up_unit_count": "异团人数分数提升"
    },
    "detail": {
      "viewCharacterCards": "该角色的全部卡牌",
      "playStory": "播放剧情",
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
        "hint": "不含区域道具、称号与角色等级加成",
        "noData": "暂无综合力数据",
        "level": "等级",
        "trained": "特训",
        "episodes": "剧情",
        "canvas": "烤森（MySekai）画布",
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
        "play": "播放",
        "partType": {
          "first_part": "前篇",
          "second_part": "后篇"
        }
      },
      "relatedEvents": {
        "title": "关联活动",
        "empty": "没有关联活动",
        "cardBonus": "卡牌 +{value}%",
        "leaderBonus": "队长 +{value}%",
        "story": "有卡牌剧情"
      },
      "relatedGachas": {
        "title": "关联卡池",
        "empty": "没有关联卡池"
      },
      "sameCharacter": {
        "title": "该角色的其他卡牌",
        "empty": "没有其他卡牌",
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
      "logo": "标志",
      "background": "背景"
    },
    "timeline": {
      "rankingAnnounce": "排名公布",
      "distributionStart": "奖励发放"
    },
    "bonus": {
      "rarityTable": "稀有度 × 突破等级加成",
      "rarity": "稀有度",
      "masterRank": "突破 {rank}",
      "attrAndCharacters": "以下角色的{attr}卡牌",
      "charactersOnly": "以下角色的全部卡牌"
    },
    "cards": {
      "cardBonus": "卡牌 {rate}",
      "leaderBonus": "队长 {rate}",
      "story": "有剧情"
    },
    "musics": {
      "title": "活动歌曲",
      "empty": "该活动暂无歌曲"
    },
    "chapters": {
      "empty": "该活动暂无章节数据",
      "supplemental": "追加章节"
    },
    "teams": {
      "title": "欢乐嘉年华队伍",
      "empty": "该活动暂无队伍数据"
    },
    "gachas": {
      "title": "相关卡池",
      "empty": "没有找到相关卡池",
      "count": "{count} 个卡池",
      "showMore": "还有 {count} 个",
      "showLess": "收起",
      "byPickup": "PICK UP 含本活动卡牌的卡池",
      "byPeriod": "与活动期间重叠（前后 3 天）的卡池"
    },
    "rewards": {
      "title": "排名奖励",
      "rangeCount": "{count} 个名次区间",
      "empty": "该活动暂无排名奖励数据",
      "unavailable": "该区服暂无奖励明细，仅显示名次区间",
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
        "player_frame": "头像框",
        "honor_background": "称号背景",
        "honor_word": "称号文字",
        "virtual_item": "虚拟道具",
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
      "episode": "第 {no} 话",
      "play": "播放"
    }
  },

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
      "period": "开放时间",
      "startAt": "开始",
      "endAt": "结束",
      "lightbox": {
        "banner": "横幅",
        "logo": "标志"
      }
    },
    "pickups": {
      "empty": "该卡池没有 PICK UP 成员"
    },
    "rates": {
      "bar": "稀有度概率分布",
      "perCard": "单卡概率",
      "empty": "暂无提供概率数据",
      "wishNote": "可许愿最多 {count} 张卡牌，许愿卡牌另有独立概率",
      "lottery": {
        "normal": "普通抽选",
        "categorized_wish": "许愿抽选",
        "rate_choice_first": "许愿抽选（第 1 张）",
        "rate_choice_second": "许愿抽选（第 2 张）"
      }
    },
    "simulator": {
      "title": "招募模拟器",
      "pullSingle": "单抽",
      "pullTen": "十连",
      "free": "免费",
      "pulls": "已招募 {count} 抽",
      "spent": "消耗",
      "lastBatch": "本次结果",
      "new": "NEW",
      "guaranteed": "保底",
      "reset": "重置",
      "unavailable": "该卡池没有可供模拟的抽选数据",
      "disclaimer": "非官方模拟，结果不代表游戏内的实际抽取"
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
      "exchangeEmpty": "该区服暂无这个卡池的交换所数据",
      "rewardsUnavailable": "该区服暂无奖励明细，仅显示奖励箱编号",
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
        "honor_background": "称号背景",
        "honor_word": "称号文字",
        "virtual_item": "虚拟道具",
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
  "musicCatalog": {
    "chips": {
      "search": "搜索：{query}",
      "level": "Lv.{range}",
      "notes": "物量 {value}",
      "character": "{name}（{scope}）",
      "append": "仅 APPEND"
    },
    "filters": {
      "chartGroup": "谱面",
      "songGroup": "歌曲",
      "levelAny": "不限",
      "appendOnly": "仅显示有 APPEND 谱面的歌曲",
      "mvType": "MV 类型",
      "scope": "关联方式",
      "aliasUnavailable": "别名搜索暂不可用"
    },
    "detail": {
      "jacket": "封面",
      "sections": {
        "info": "基本信息"
      },
      "difficulties": {
        "empty": "暂无谱面信息"
      },
      "player": {
        "seek": "播放进度",
        "error": "音频加载失败，请稍后重试"
      },
      "unlock": {
        "title": "解锁条件"
      },
      "original": {
        "title": "原版 MV",
        "open": "在 {host} 打开"
      },
      "events": {
        "empty": "这首歌曲没有关联的活动"
      }
    }
  },

  // ---------------------------------------------------------------------
  // storyPlayer — owned by the story module (src/modules/story)
  // ---------------------------------------------------------------------
  "storyPlayer": {
    "description": "在线阅读游戏剧情，画面与语音来自日服",
    "beta": {
      "title": "测试中",
      "body": "遇到问题或与游戏内不符，可在{tickets}反馈",
      "tickets": "工单",
      "ticketsLogin": "登录后提交工单"
    },
    "title": "剧情播放",
    "textLang": "文本语言",
    "voice": "播放语音",
    "volume": "音量",
    "voiceVolume": "语音音量",
    "bgmVolume": "BGM 音量",
    "langAutoResolved": "跟随工具箱语言 · {lang}",
    "langAuto": "跟随工具箱语言",
    "lang": {
      "ja": "日本語",
      "zhHans": "简体中文",
      "zhHant": "繁體中文",
      "en": "English",
      "ko": "한국어",
      "zhHansAi": "简体中文（AI 翻译）"
    },
    "aiPending": "这一话的 AI 翻译还在生成，稍后再来",
    "aiNotice": "AI 翻译，可能与官方译文有出入",
    "aiFailed": "AI 翻译暂不可用，已显示日文原文",
    "resume": {
      "lastWatched": "上次看到：{title} · {episode}",
      "continue": "继续播放",
      "dismiss": "忽略"
    },
    "errors": {
      "notFound": "找不到这一话剧情",
      "unreleased": "这一话尚未上线，在设置里打开「展示未上线内容」即可观看",
      "missing": "日服素材里还没有这一话的剧本",
      "failed": "剧情加载失败",
      "catalog": "剧情目录加载失败，刷新页面重试",
      "engine": "播放器加载失败：{detail}"
    },
    "stage": {
      "loading": "加载中",
      "start": "点击开始播放",
      "pickBeside": "请在左侧选择要播放的剧情",
      "pickBelow": "请在下方选择要播放的剧情",
      "models": "角色",
      "preloading": "下载素材",
      "preloadFailed": "{n} 个文件下载失败",
      "retry": "重试",
      "continue": "仍然播放",
      "credit": "Developed by Deseer × 星雲希凪 (From Haruki Dev Team). Powered by Haruki Toolbox.",
      "tabBrowser": "剧情",
      "tabLog": "台词",
      "fullscreen": "全屏",
      "exitFullscreen": "退出全屏",
      "showUi": "显示",
      "keyboard": "剧情舞台：按空格或回车继续",
      "rotateHint": "点「全屏」横屏观看，轻点此处继续"
    },
    "browser": {
      "tabs": {
        "unit": "主线",
        "event": "活动",
        "card": "卡面",
        "special": "特别",
        "area": "区域"
      },
      "all": "全部",
      "rail": "剧情选择",
      "toggle": "收起 / 展开",
      "searchTitle": "搜索标题",
      "searchTitleUnit": "搜索标题 / 团体",
      "searchTitleChar": "搜索标题 / 角色",
      "loading": "加载剧情目录…",
      "empty": "没有匹配的剧情",
      "episode": "第 {no} 话",
      "firstPart": "前篇",
      "secondPart": "后篇",
      "chapter": "{unit} 第{no}章",
      "jpOnly": "日文"
    },
    "menu": {
      "fullscreen": "全屏",
      "auto": "自动",
      "mute": "静音",
      "fast": "快进",
      "hide": "隐藏",
      "log": "记录"
    },
    "log": {
      "search": "搜索台词 / 角色",
      "matches": "{count} 条匹配"
    }
  }
} as const
