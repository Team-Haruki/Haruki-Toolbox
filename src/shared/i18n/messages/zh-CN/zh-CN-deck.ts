// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: deckRecommend, eventPlanner
export default {
  "deckRecommend": {
    "title": "组卡推荐",
    "description": "选择账号、数据区服、模式与歌曲参数，获取（尽可能）最优活动卡组推荐。",
    "notice": {
      "testingPrefix": "该功能处于测试状态，",
      "testingSuffix": "如果遇到任何问题请联系 Haruki Dev Team 进行反馈。"
    },
    "select": {
      "loading": "正在准备数据..."
    },
    "configActions": {
      "save": "保存配置",
      "clear": "清除配置",
      "clearDialogTitle": "确认清除配置",
      "clearDialogDescription": "此操作会删除已保存的组卡推荐配置，并将当前页面恢复为默认值。确定要继续吗？",
      "clearDialogCancel": "取消",
      "clearDialogConfirm": "确认清除"
    },
    "summaryBar": {
      "edit": "编辑配置",
      "rerun": "重新推荐"
    },
    "form": {
      "account": "账号",
      "accountPlaceholder": "请选择已绑定账号",
      "noAccount": "当前账号还没有绑定游戏账号。",
      "dataRegion": "数据服务器",
      "mode": "组卡模式",
      "target": "组卡目标",
      "liveType": "Live 类型",
      "algorithm": "搜索算法",
      "algorithmHint": "默认算法会随组卡场景自动选择：分数目标使用 DFS 精确搜索（可证明最优），World Bloom 等复杂场景使用 DFS-GA，烤森使用强化学习。手动勾选后将保持你的选择；同时启用多个算法可交叉验证结果，但整体耗时更长。",
      "executionMode": "执行方式",
      "event": "活动",
      "eventPlaceholder": "请选择活动",
      "eventSearchPlaceholder": "搜索活动名、#ID、类型、拼音或罗马音...",
      "eventEmpty": "没有找到活动。",
      "character": "角色",
      "characterPlaceholder": "请选择角色",
      "bonusTargets": "目标加成",
      "bonusTargetsPlaceholder": "例如 100 120 130",
      "bonusTargetsHint": "可输入多个整数目标，用空格或逗号分隔。",
      "bonusTargetsInvalid": "目标加成需要填写正整数，可用空格或逗号分隔。",
      "customBonusAttr": "自定义加成属性",
      "customBonusAttrNone": "不指定",
      "customBonusCharacters": "自定义加成角色",
      "customBonusCharactersPlaceholder": "例如 1 2 21",
      "customBonusSupportUnits": "VS 支援团体",
      "customBonusSupportUnitsPlaceholder": "例如 21:light_sound 25:school_refusal",
      "customBonusSelectedCount": "已选择 {count} 个角色",
      "customBonusSupportUnitsEmpty": "选择 21-26 号 Virtual Singer 角色后可指定支援团体。",
      "filterOtherUnit": "过滤其他团体",
      "customBonusHint": "可按角色选择自定义混活加成；VS 角色可额外指定支援团体。",
      "customBonusInvalid": "自定义加成条件格式不正确。",
      "customBonusSupportUnitsTargetInvalid": "VS 支援团体的角色必须同时出现在自定义加成角色里。",
      "music": "歌曲",
      "musicPlaceholder": "请选择歌曲",
      "musicSearchPlaceholder": "搜索歌曲名、#ID、假名、拼音或罗马音...",
      "musicEmpty": "没有找到歌曲。",
      "difficultyPlaceholder": "请选择难度"
    },
    "picker": {
      "musicDialogTitle": "选择歌曲",
      "eventDialogTitle": "选择活动",
      "cardDialogTitle": "浏览卡牌",
      "browse": "浏览筛选",
      "done": "完成",
      "filterAll": "全部",
      "unitLabel": "团体",
      "attrLabel": "属性",
      "rarityLabel": "稀有度",
      "cardSearchLabel": "搜索卡牌",
      "browseCount": "共 {count} 张卡牌"
    },
    "layers": {
      "default": {
        "title": "默认配置",
        "description": "选择账号、活动、Live、歌曲与搜索方式；默认协力队友会跟随当前卡组。"
      },
      "advanced": {
        "title": "进阶配置",
        "description": "调整卡牌养成、过滤条件、协力参数和卡组固定规则。"
      },
      "expert": {
        "title": "专家配置",
        "description": "调整技能策略、支援假设、引擎超时与单卡精细覆盖。"
      }
    },
    "groups": {
      "accountTarget": "账号与目标",
      "musicAlgorithm": "歌曲与算法"
    },
    "modes": {
      "event": "活动组卡",
      "challenge": "挑战组卡",
      "bonus": "加成组卡",
      "mysekai": "烤森组卡",
      "max": "最强组卡"
    },
    "targets": {
      "score": "Live分数",
      "pt": "PT",
      "power": "综合力",
      "skill": "技能实效",
      "bonus": "活动加成"
    },
    "liveTypes": {
      "solo": "单人Live",
      "multi": "多人Live",
      "auto": "自动Live",
      "challenge": "挑战Live",
      "challengeAuto": "挑战自动Live",
      "mysekai": "烤森Live"
    },
    "algorithms": {
      "dfsGa": "DFS-GA 混合搜索算法",
      "dfs": "DFS 精确搜索算法",
      "ga": "遗传算法",
      "rl": "强化学习"
    },
    "executionModes": {
      "sequential": "顺序进行",
      "parallel": "同时进行"
    },
    "skillStrategies": {
      "average": "平均",
      "max": "最大",
      "min": "最小",
      "specific": "特定顺序"
    },
    "eventTypes": {
      "marathon": "马拉松",
      "cheerfulCarnival": "欢乐嘉年华",
      "worldBloom": "连接世界",
      "unknown": "未知类型"
    },
    "eventAttrs": {
      "happy": "快乐",
      "cute": "可爱",
      "cool": "帅气",
      "pure": "纯洁",
      "mysterious": "神秘"
    },
    "cardTags": {
      "attrs": {
        "happy": "快乐",
        "cute": "可爱",
        "cool": "帅气",
        "pure": "纯洁",
        "mysterious": "神秘"
      }
    },
    "eventUnits": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "25時、ナイトコードで。",
      "piapro": "Virtual Singer"
    },
    "options": {
      "eventCondition": {
        "title": "活动条件",
        "description": "选择已发布活动，或开启模拟活动自定义活动类型、属性、团体与章节。"
      },
      "bonus": {
        "title": "加成条件",
        "description": "指定一个或多个目标加成，组卡会尝试生成对应加成的单人 Live 卡组。"
      },
      "eventSimulation": {
        "title": "模拟活动",
        "description": "用自定义活动类型、属性和团体进行推荐，不依赖已发布活动。",
        "unavailable": "当前模式不使用活动信息，模拟活动不可用。",
        "realEventDisabled": "已开启模拟活动，真实活动选择不会参与推荐。",
        "activeHint": "模拟活动会覆盖真实活动 ID，推荐会按当前模拟条件计算。",
        "type": "活动类型",
        "attr": "属性",
        "unit": "团体",
        "worldBloomTurn": "章节",
        "worldBloomTurnOption": "第 {turn} 轮",
        "worldBloomCharacter": "角色",
        "invalid": "请补全模拟活动参数。连接世界第 1/2 轮需要角色能推导出团体。",
        "customBonusUnit": "自定义加成角色",
        "customBonusTitle": "自定义加成角色",
        "customBonusSummary": "已选择 {count} 个加成角色，符合角色加成的卡会获得 25% 加成。",
        "customBonusConfigure": "设置自定义加成角色",
        "customBonusDescription": "选择参与模拟活动加成的角色；Virtual Singer 角色可指定 VS 支援团体，也可以过滤其他团体。",
        "customBonusDone": "完成",
        "customBonusInvalid": "请选择属性，并至少选择一个自定义加成角色。"
      },
      "multiLive": {
        "title": "协力参数",
        "description": "用于多人 Live。队友综合力和队友实效留空时，会按当前卡组近似队友。",
        "teammatePower": "队友综合力",
        "teammateScoreUp": "队友实效",
        "followSelfPlaceholder": "跟随当前卡组",
        "scoreUpLowerBound": "最低实效",
        "scoreUpLowerBoundPlaceholder": "不限制",
        "disabled": "当前 Live 类型不会使用协力参数。",
        "invalid": "协力参数需要填写大于等于 0 的数字。"
      },
      "filters": {
        "title": "高级过滤",
        "description": "按角色、团体或属性限制可用卡牌。",
        "none": "不限制",
        "selectedCount": "已选 {count} 项",
        "unit": "团体过滤",
        "attr": "属性过滤",
        "character": "角色过滤",
        "characterSelectPlaceholder": "选择过滤角色",
        "characterMinHint": "角色过滤会限制候选卡池；启用时至少选择 {count} 个角色，才能组成完整卡组。",
        "characterMinInvalid": "角色过滤启用时至少需要选择 {count} 个角色。",
        "areaItemLevel": "区域道具等级",
        "areaItemLevelDefault": "沿用当前数据",
        "areaItemLevelOption": "Lv.{value}",
        "areaItemLevelPlaceholder": "沿用当前数据",
        "characterRank": "角色等级",
        "characterRankDefault": "沿用当前数据",
        "characterRankOption": "Rank {value}",
        "mysekaiGateLevel": "烤森门等级",
        "mysekaiGateLevelDefault": "沿用当前数据",
        "mysekaiGateLevelOption": "Lv.{value}",
        "mysekaiFixtureBonusRate": "玩偶加成",
        "mysekaiFixtureBonusRateDefault": "沿用当前数据",
        "mysekaiFixtureBonusRateOption": "{value}%",
        "boost": "体力消耗",
        "boostOption": "{value}",
        "boostPlaceholder": "按体力消耗倍率计算 Pt",
        "invalid": "体力消耗需要是 0-10 的整数；覆盖等级或加成需要是有效范围内的值。"
      },
      "dataOverrides": {
        "title": "临时数据覆盖",
        "description": "只影响本次推荐传给引擎的数据，不会写回上传数据。",
        "invalid": "覆盖等级或加成需要是有效范围内的值。"
      },
      "runParameters": {
        "title": "计算参数",
        "description": "调整本次推荐的基础计算参数。",
        "invalid": "体力消耗需要是 0-10 的整数。"
      },
      "constraints": {
        "title": "卡组约束",
        "description": "指定必须上场或排除的卡牌；当前主队、固定卡牌和固定角色互斥。",
        "fixedGroup": "固定上场",
        "fixedGroupDescription": "固定卡牌最多 5 张且同一角色只能选 1 张；固定角色最多 5 个。",
        "excludedGroup": "排除条件",
        "excludedGroupDescription": "从候选卡池里排除任意数量的卡牌，不影响固定卡牌上限。",
        "fixedCards": "固定卡牌",
        "useCurrentDeck": "使用当前主队",
        "useCurrentDeckDescription": "启用后直接以 profile 当前主队作为固定卡组。",
        "fixedCharacters": "固定角色",
        "excludedCards": "排除卡牌",
        "cardSelectPlaceholder": "搜索并选择卡牌",
        "fixedCardSelectPlaceholder": "选择固定卡牌",
        "excludedCardSelectPlaceholder": "选择排除卡牌",
        "cardSearchPlaceholder": "搜索卡牌名、#ID、角色、团体、属性、稀有度或拼音...",
        "cardEmpty": "没有找到卡牌。",
        "noSelectedCards": "暂未选择卡牌。",
        "selectedCardsCount": "已选择 {count} 张卡牌",
        "selectedCardsLimitCount": "已选择 {count}/{max} 张卡牌",
        "removeCard": "移除卡牌",
        "characterSelectPlaceholder": "选择固定角色",
        "characterNone": "不指定角色",
        "noSelectedCharacters": "暂未选择角色。",
        "selectedCharactersCount": "已选择 {count}/{max} 个角色",
        "removeCharacter": "移除角色",
        "characterListPlaceholder": "例如 1 2 21",
        "invalid": "角色 ID 需要填写正整数，可用空格或逗号分隔。",
        "challengeHint": "挑战 Live 已经由角色选择决定目标角色，不能再固定角色。",
        "currentDeckHint": "会优先读取游戏 profile 的当前主队，失败时回落到已上传数据；使用当前主队时固定上场和排除条件不会参与推荐。"
      },
      "random": {
        "title": "技能与支援",
        "description": "控制技能顺序、BFes 技能吸取方式，以及连接世界支援卡养成假设。",
        "skillGroup": "技能策略",
        "skillGroupDescription": "调整技能触发顺序和 BFes 技能参考方式。",
        "skillOrder": "技能顺序",
        "specificSkillOrder": "特定技能顺序",
        "specificSkillOrderPlaceholder": "例如 12345",
        "specificSkillOrderHint": "填写 1-5 的不重复顺序，1 表示队长位，常用于固定当前队伍。",
        "specificSkillOrderInvalid": "特定技能顺序必须包含 1-5 且不能重复，例如 12345。",
        "skillReference": "BFes 技能吸取",
        "keepAfterTrainingState": "双技能状态不变",
        "keepAfterTrainingStateDescription": "保留卡牌特训前后的技能状态，不强制切换。",
        "supportGroup": "连接世界支援",
        "supportGroupDescription": "仅影响连接世界支援卡组的养成假设。",
        "supportMasterMax": "支援卡满突破",
        "supportMasterMaxDescription": "计算支援卡时按满突破处理。",
        "supportSkillMax": "支援卡满技能",
        "supportSkillMaxDescription": "计算支援卡时按满技能处理。"
      },
      "areaItemOverride": {
        "title": "区域道具覆盖",
        "description": "按单个区域道具临时覆盖等级，默认不覆盖。",
        "priorityHint": "单个道具覆盖优先于进阶配置里的区域道具等级。",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的区域道具。",
        "searchPlaceholder": "搜索等级...",
        "emptySearch": "没有找到等级。",
        "areaFallback": "区域 #{id}",
        "itemFallback": "道具 #{id}",
        "targetFallback": "目标 #{id}",
        "kinds": {
          "character": "角色道具",
          "unit": "团体道具",
          "attr": "属性道具"
        }
      },
      "characterRankOverride": {
        "title": "角色等级自定义",
        "description": "按单个角色临时覆盖角色等级，默认不覆盖。",
        "priorityHint": "单角色覆盖优先于进阶配置里的统一角色等级。",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的角色等级。",
        "searchPlaceholder": "搜索等级...",
        "emptySearch": "没有找到等级。",
        "maxRank": "最高 Rank {value}"
      },
      "mysekaiGateOverride": {
        "title": "烤森门自定义",
        "description": "按单个烤森门临时覆盖等级，默认不覆盖。",
        "priorityHint": "单门覆盖优先于进阶配置里的统一烤森门等级。",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的 MySekai 大门。",
        "searchPlaceholder": "搜索等级...",
        "emptySearch": "没有找到等级。",
        "maxLevel": "最高 Lv.{value}"
      },
      "mysekaiFixtureBonusOverride": {
        "title": "玩偶加成自定义",
        "description": "按单个角色临时覆盖烤森玩偶综合力加成，默认不覆盖。",
        "priorityHint": "单角色覆盖优先于进阶配置里的统一玩偶加成。",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的角色。",
        "searchPlaceholder": "搜索加成...",
        "emptySearch": "没有找到加成。",
        "maxRate": "最高 {value}"
      },
      "engine": {
        "title": "组卡引擎参数",
        "description": "只调整结果数量和超时时间；搜索算法内部参数保持自动配置。",
        "resultLimit": "结果数量",
        "resultLimitPlaceholder": "默认 6",
        "timeoutMs": "超时时间（ms）",
        "timeoutMsPlaceholder": "默认 15000",
        "invalid": "结果数量需要是 1-50 的整数；超时时间需要是 1000-300000 ms 的整数。"
      }
    },
    "training": {
      "title": "卡牌养成",
      "description": "按稀有度设置推荐时采用的默认养成状态。",
      "rarity": "稀有度",
      "disabled": "禁用",
      "maxLevel": "满级",
      "episodesRead": "前后篇",
      "maxMasterRank": "满突破",
      "maxSkillLevel": "满技能",
      "mySekaiCanvas": "烤森画布",
      "rarities": {
        "rarity_1": "一星",
        "rarity_2": "二星",
        "rarity_3": "三星",
        "rarity_4": "四星",
        "rarity_birthday": "生日"
      }
    },
    "singleCard": {
      "title": "单卡养成覆盖",
      "description": "对指定卡牌单独覆盖等级、技能、突破、剧情和画布设置；覆盖会优先于按稀有度设置。固定卡牌会按当前通用养成配置自动加入这里。",
      "card": "卡牌",
      "cardPlaceholder": "选择卡牌",
      "cardSearchPlaceholder": "搜索卡牌名或 ID...",
      "cardEmpty": "没有找到卡牌。",
      "add": "添加",
      "empty": "暂未添加单卡覆盖。",
      "selectedCount": "已添加 {count} 张单卡覆盖",
      "inherit": "沿用通用配置",
      "level": "等级",
      "skillLevel": "技能",
      "masterRank": "突破",
      "levelOption": "Lv.{value}",
      "skillLevelOption": "技能 Lv.{value}",
      "masterRankOption": "突破 {value}",
      "numberSearchPlaceholder": "搜索数值...",
      "numberEmpty": "没有可选数值。",
      "episodes": "剧情",
      "remove": "移除单卡覆盖",
      "episodeStates": {
        "inherit": "沿用通用配置",
        "none": "未解锁",
        "first": "前篇",
        "both": "前后篇"
      }
    },
    "runner": {
      "ready": "选择完整参数后即可开始推荐。",
      "run": "开始推荐",
      "running": "推荐中...",
      "phases": {
        "preparing-data": "正在准备 master 与 music metas...",
        "fetching-user-data": "正在读取用户数据...",
        "initializing": "正在初始化组卡引擎...",
        "loading-data": "正在加载推荐数据...",
        "recommending": "正在执行推荐..."
      }
    },
    "result": {
      "title": "推荐结果",
      "description": "推荐完成后会在这里显示卡组结果。",
      "idlePlaceholder": "完成上方配置后点击「开始推荐」，推荐卡组会显示在这里。",
      "actions": {
        "compare": "对比",
        "compareTitle": "卡组对比",
        "compareBaseline": "基准",
        "copy": "复制卡组",
        "copied": "卡组信息已复制到剪贴板。",
        "copyFailed": "复制失败，请检查浏览器剪贴板权限。",
        "songRanking": "歌曲收益"
      },
      "elapsed": "组卡引擎合计用时 {ms} ms",
      "totalElapsed": "推荐总耗时 {ms} ms",
      "dataElapsed": "获取数据",
      "engineDataElapsed": "组卡引擎数据准备",
      "sequentialRecommendElapsed": "顺序执行推荐（实际等待）",
      "parallelRecommendElapsed": "并行执行推荐（实际等待）",
      "algorithmElapsed": "{algorithm} 搜索：{ms} ms",
      "empty": "暂无推荐结果。",
      "deckTitle": "卡组 #{index}",
      "score": "Live分数 {score}",
      "totalPower": "综合力 {value}",
      "totalPowerLimitWarning": "该活动的综合力上限限制到了 {value}",
      "eventCardBonusLimitWarning": "该活动的当期活动加成仅计算 {count} 名成员。",
      "eventSkillScoreUpLimitWarning": "该活动的卡牌技能分数加成最高限制为 {value}%。",
      "summary": {
        "pt": "PT",
        "power": "综合力",
        "totalBonus": "总加成",
        "effective": "实效值",
        "bonusBreakdown": "主队 {main}% + 支援 {support}%"
      },
      "sections": {
        "basic": "基础信息",
        "power": "综合力详情",
        "cards": "卡组信息",
        "mainCards": "主卡组信息",
        "supportCards": "支援卡组信息"
      },
      "power": {
        "total": "总综合力",
        "base": "基础综合力",
        "areaItem": "区域道具",
        "character": "角色等级",
        "honor": "称号",
        "fixture": "MySekai 玩偶",
        "gate": "MySekai 大门"
      },
      "eventBonus": "活动加成 {value}%",
      "bonusTag": "加成 {value}%",
      "worldBloomEventBonus": "活动加成 主卡组 {main}% + 支援卡组 {support}% = {total}%",
      "liveScore": "Live分数 {value}",
      "liveScoreLabel": "Live分数",
      "mysekaiEventPoint": "烤森活动 Pt {value}",
      "multiLiveScoreUp": "协力实效 {value}%",
      "challengeScoreDelta": "挑战分差 {value}",
      "challengeScoreDeltaLabel": "挑战分差",
      "unknownCard": "未知卡牌",
      "cardGroups": {
        "power": "综合力",
        "training": "养成",
        "skillBonus": "技能与加成",
        "storyCanvas": "剧情与画布"
      },
      "cardTotalPower": "综合力 {value}",
      "cardTotalPowerShort": "总综合力 {value}",
      "cardBasePower": "基础 {value}",
      "cardBasePowerShort": "基础综合力 {value}",
      "cardLevel": "Lv.{value}",
      "masterRank": "突破 {value}",
      "skillLevel": "技能 Lv.{value}",
      "skillScoreUp": "技能 {value}%",
      "skillScoreUpShort": "分数加成{value}%",
      "skillLifeRecovery": "回复 {value}",
      "skillLifeRecoveryShort": "回复 {value}",
      "cardEventBonus": "加成 {value}%",
      "cardEventBonusShort": "活动 {value}%",
      "episodeFirst": "前篇",
      "episodesShort": "剧情",
      "episodeSecond": "后篇",
      "readState": {
        "read": "已读",
        "unread": "未读"
      },
      "supportSkillLevel": "SLv.{value}",
      "canvasBonus": "画布加成",
      "noCanvasBonus": "无画布"
    },
    "toast": {
      "runSuccessTitle": "推荐完成",
      "runFailedTitle": "推荐失败",
      "configSavedTitle": "配置已保存",
      "configSaveFailedTitle": "保存配置失败",
      "configClearedTitle": "配置已清除"
    },
    "attribution": {
      "originalPrefix": "组卡推荐原始算法来自",
      "originalMiddle": "的",
      "originalSuffix": "。",
      "optimizationPrefix": "本网站采用的部分算法优化来自",
      "optimizationMiddle": "的",
      "neuraxmyName": "ルナ茶",
      "enginePrefix": "本站采用的组卡推荐算法引擎请前往",
      "aboutLink": "关于",
      "engineSuffix": "页面获取详细信息，计算结果仅供参考。"
    }
  },
  "eventPlanner": {
    "title": "活动规划",
    "description": "用时速笔刷在活动日历上安排每小时的打歌计划，并实时对照目标 PT。",
    "sections": {
      "setup": {
        "title": "账号与活动",
        "description": "选择已绑定账号、数据服务器和活动；连接世界活动可选择章节角色。"
      }
    },
    "form": {
      "targetPoint": "目标 PT",
      "targetPointPlaceholder": "例如 1000w、120万、1.5亿",
      "currentPoint": "当前 PT",
      "currentPointPlaceholder": "例如 25k，留空表示 0",
      "parsedValue": "解析为 {value}",
      "invalidPoint": "无法解析该数值，请使用非负数字，可带 万/w、k、亿 后缀。"
    },
    "summary": {
      "targetPoint": "目标 PT",
      "currentPoint": "当前 PT",
      "plannedPoint": "已规划 PT",
      "remainingPoint": "还差 PT",
      "dailyPoint": "日均需求",
      "plannedHours": "已规划 {hours} 小时 · 休息 {rest} 小时",
      "reached": "当前规划已覆盖目标 PT！"
    },
    "brushes": {
      "title": "时速笔刷",
      "description": "选中笔刷后在日历上单击或拖动填充；对同一笔刷的格子再次涂抹即可擦除。",
      "rest": "休息",
      "eraser": "橡皮擦",
      "add": "新建笔刷",
      "perHour": "{points}/时",
      "edit": "编辑笔刷",
      "delete": "删除笔刷",
      "playsUnit": "周/时",
      "playsTitle": "每小时周回数",
      "boostTitle": "每局消耗的火数",
      "boostOption": "{count} 火 ×{multiplier}",
      "empty": "还没有时速笔刷，点击「新建笔刷」组卡并选歌。"
    },
    "dialog": {
      "title": "新建时速笔刷",
      "description": "根据所选活动直接组卡，然后从歌曲 PT 排行中挑选要刷的歌。",
      "runDeck": "根据活动组卡",
      "useSavedConfig": "使用组卡页面的详细设定",
      "savedConfigHint": "组卡参数（算法、队友、区域道具/角色等级覆盖、固定/排除卡、养成配置等）沿用组卡页面保存的设定；需要调整时在组卡页面修改后回来重新组卡即可。",
      "openDeckRecommend": "打开组卡页面调整",
      "running": "组卡中...",
      "deckTitle": "推荐卡组",
      "deckPower": "综合力",
      "deckBonus": "活动加成 {value}%",
      "rankingTitle": "歌曲 PT 排行",
      "rankingHint": "基于该卡组对全部歌曲的引擎测算（多人 Live、不含火力），时速 = 单局 PT × 每小时局数。",
      "rankingLoading": "正在测算歌曲排行...",
      "searchPlaceholder": "搜索歌曲名 / 别名 / ID...",
      "allDifficulties": "全部难度",
      "columns": {
        "song": "歌曲",
        "difficulty": "难度",
        "eventPoint": "单局 PT",
        "playsPerHour": "局/时",
        "pointsPerHour": "时速"
      },
      "playsPerHour": "每小时局数",
      "playsPerHourHint": "默认按歌曲时长 + 30 秒间隔估算，可按实际情况调整。",
      "externalSettingsHint": "周回数与火数在笔刷列表上直接调整，时速会随之更新。",
      "brushName": "笔刷名称",
      "brushColor": "笔刷颜色",
      "pointsPerHour": "笔刷时速",
      "save": "保存笔刷",
      "noDeck": "先组卡后才能生成歌曲排行。",
      "rankingEmpty": "没有匹配的歌曲。",
      "rankingAliasSearching": "正在匹配别名...",
      "selectHint": "点击排行中的歌曲选择要刷的歌。"
    },
    "calendar": {
      "title": "活动日历",
      "noEvent": "选择带有开始/结算时间的活动后显示日历。",
      "clear": "清空规划",
      "hourLabel": "{hour} 时",
      "dragHint": "单击填充一格，按住拖动可框选多天 × 多小时的时间段批量填充；用同一笔刷再次框选即为擦除。格内数字为每小时周回数。",
      "playsPerHour": "{count} 周/时"
    },
    "batch": {
      "title": "批量填充",
      "fromDay": "开始日期",
      "toDay": "结束日期",
      "fromHour": "开始时刻",
      "toHour": "结束时刻",
      "brush": "笔刷",
      "apply": "填充",
      "hint": "将所选日期范围内每天的该时间段（包含首尾小时）填充为所选笔刷；选择擦除可批量清除。"
    },
    "toasts": {
      "remaining": "已规划 {planned} PT，距目标还差 {remaining} PT",
      "reached": "已规划 {planned} PT，目标已覆盖！"
    },
    "errors": {
      "noResult": "组卡引擎没有返回可用卡组，无法计算单局 PT。"
    }
  }
} as const
