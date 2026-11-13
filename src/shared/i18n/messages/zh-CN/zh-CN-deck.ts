// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: deckRecommend, eventPlanner
export default {
  "deckRecommend": {
    "description": "用你的卡牌算活动最优卡组",
    "title": "组卡推荐",
    "select": {
      "loading": "正在准备数据..."
    },
    "configActions": {
      "save": "保存配置",
      "clear": "清除配置",
      "clearDialogTitle": "确认清除配置",
      "clearDialogDescription": "删除已保存的配置，并把本页恢复为默认值",
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
      "bindAccount": "前往绑定游戏账号",
      "dataRegion": "数据区服",
      "mode": "组卡模式",
      "target": "组卡目标",
      "liveType": "Live 类型",
      "algorithm": "搜索算法",
      "algorithmHint": "默认按场景选择：分数目标用 DFS（精确最优），连接世界等复杂场景用 DFS-GA，烤森用强化学习。多选可交叉验证结果，但更耗时。",
      "executionMode": "执行方式",
      "executionModeLimitedHint": "设备内存有限，多个算法将逐个运行，耗时更长",
      "event": "活动",
      "eventPlaceholder": "请选择活动",
      "eventSearchPlaceholder": "搜索活动名、#ID、类型、拼音或罗马音...",
      "eventEmpty": "没有找到活动",
      "character": "角色",
      "characterPlaceholder": "请选择角色",
      "bonusTargets": "目标加成",
      "bonusTargetsPlaceholder": "例如 100 120 130",
      "bonusTargetsInvalid": "目标加成需要填写正整数，可用空格或逗号分隔",
      "customBonusAttr": "自定义加成属性",
      "customBonusAttrNone": "不指定",
      "customBonusCharacters": "自定义加成角色",
      "customBonusCharactersPlaceholder": "例如 1 2 21",
      "customBonusSupportUnits": "VS 支援团体",
      "customBonusSelectedCount": "已选择 {count} 个角色",
      "customBonusSupportUnitsEmpty": "先选择 Virtual Singer 角色（21-26）",
      "filterOtherUnit": "过滤其他团体",
      "customBonusHint": "可按角色选择自定义混活加成；VS 角色可额外指定支援团体",
      "customBonusInvalid": "自定义加成条件格式不正确",
      "customBonusSupportUnitsTargetInvalid": "VS 支援团体的角色必须同时出现在自定义加成角色里",
      "music": "歌曲",
      "musicPlaceholder": "请选择歌曲",
      "musicSearchPlaceholder": "搜索歌曲名、#ID、假名、拼音或罗马音...",
      "musicEmpty": "没有找到歌曲",
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
      "advanced": {
        "title": "进阶配置"
      },
      "expert": {
        "title": "专家配置",
        "description": "技能策略、支援假设、数据覆盖、引擎参数与单卡养成"
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
    "algorithmsShort": {
      "dfsGa": "DFS-GA",
      "dfs": "DFS",
      "ga": "遗传",
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
      "memoryEvent": "总集篇",
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
      "school_refusal": "25时，Nightcord见。",
      "piapro": "Virtual Singer"
    },
    "options": {
      "eventCondition": {
        "title": "活动条件"
      },
      "bonus": {
        "title": "加成条件"
      },
      "eventSimulation": {
        "memoryEventHint": "五属性基础加成 25%，本团原生角色合计 75%（人类团不含虚拟歌手，Virtual Singer 按六位计算）；含精通加成，不含当期卡加成",
        "title": "模拟活动",
        "description": "用自定义活动类型、属性和团体进行推荐，不依赖已发布活动",
        "unavailable": "当前模式不支持模拟活动",
        "realEventDisabled": "模拟活动开启时不使用此活动",
        "type": "活动类型",
        "attr": "属性",
        "unit": "团体",
        "worldBloomTurn": "章节",
        "worldBloomTurnOption": "第 {turn} 轮",
        "worldBloomCharacter": "角色",
        "invalid": "请补全模拟活动参数。连接世界第 1/2 轮需要角色能推导出团体。",
        "customBonusUnit": "自定义加成角色",
        "customBonusTitle": "自定义加成角色",
        "customBonusSummary": "已选 {count} 个角色，匹配的卡 +25% 加成",
        "customBonusConfigure": "设置自定义加成角色",
        "customBonusDescription": "Virtual Singer 角色可另外指定支援团体",
        "customBonusDone": "完成",
        "customBonusInvalid": "请选择属性，并至少选择一个自定义加成角色"
      },
      "multiLive": {
        "title": "协力参数",
        "teammatePower": "队友综合力",
        "teammateScoreUp": "队友实效",
        "followSelfPlaceholder": "跟随当前卡组",
        "scoreUpLowerBound": "最低实效",
        "scoreUpLowerBoundPlaceholder": "不限制",
        "disabled": "仅多人 Live 使用",
        "invalid": "协力参数需要填写大于等于 0 的数字"
      },
      "filters": {
        "title": "高级过滤",
        "none": "不限制",
        "selectedCount": "已选 {count} 项",
        "unit": "团体过滤",
        "attr": "属性过滤",
        "character": "角色过滤",
        "characterSelectPlaceholder": "选择过滤角色",
        "characterMinHint": "至少选 {count} 个角色，才能组成完整卡组",
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
        "invalid": "体力消耗需要是 0-10 的整数；覆盖等级或加成需要是有效范围内的值"
      },
      "dataOverrides": {
        "title": "临时数据覆盖",
        "invalid": "覆盖等级或加成需要是有效范围内的值"
      },
      "runParameters": {
        "title": "计算参数",
        "invalid": "体力消耗需要是 0-10 的整数"
      },
      "constraints": {
        "title": "卡组约束",
        "fixedGroup": "固定上场",
        "fixedGroupDescription": "固定卡牌每个角色限 1 张",
        "challengeFixedGroupDescription": "仅限所选挑战角色的卡牌",
        "excludedGroup": "排除条件",
        "fixedCards": "固定卡牌",
        "useCurrentDeck": "使用当前主队",
        "useCurrentDeckDescription": "优先实时读取游戏内队伍，读取不到时用上传数据",
        "fixedCharacters": "固定角色",
        "excludedCards": "排除卡牌",
        "cardSelectPlaceholder": "搜索并选择卡牌",
        "fixedCardSelectPlaceholder": "选择固定卡牌",
        "excludedCardSelectPlaceholder": "选择排除卡牌",
        "cardSearchPlaceholder": "搜索卡牌名、#ID、角色、团体、属性、稀有度或拼音...",
        "cardEmpty": "没有找到卡牌",
        "noSelectedCards": "暂未选择卡牌",
        "selectedCardsCount": "已选择 {count} 张卡牌",
        "selectedCardsLimitCount": "已选择 {count}/{max} 张卡牌",
        "removeCard": "移除卡牌",
        "characterSelectPlaceholder": "选择固定角色",
        "characterNone": "不指定角色",
        "noSelectedCharacters": "暂未选择角色",
        "selectedCharactersCount": "已选择 {count}/{max} 个角色",
        "removeCharacter": "移除角色",
        "characterListPlaceholder": "例如 1 2 21",
        "invalid": "角色 ID 需要填写正整数，可用空格或逗号分隔",
        "challengeHint": "挑战组卡不能固定角色",
        "currentDeckHint": "此时固定上场和排除条件不生效"
      },
      "random": {
        "title": "技能与支援",
        "skillGroup": "技能策略",
        "skillOrder": "技能顺序",
        "specificSkillOrder": "特定技能顺序",
        "specificSkillOrderPlaceholder": "例如 12345",
        "specificSkillOrderHint": "1-5 不重复，1 为队长位",
        "specificSkillOrderInvalid": "特定技能顺序必须包含 1-5 且不能重复，例如 12345",
        "skillReference": "BFes 技能吸取",
        "keepAfterTrainingState": "双技能状态不变",
        "keepAfterTrainingStateDescription": "不强制切换特训前后的技能",
        "supportGroup": "连接世界支援",
        "supportMasterMax": "支援卡满突破",
        "supportSkillMax": "支援卡满技能"
      },
      "areaItemOverride": {
        "title": "区域道具覆盖",
        "priorityHint": "优先于进阶配置里的区域道具等级",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的区域道具",
        "searchPlaceholder": "搜索等级...",
        "emptySearch": "没有找到等级",
        "areaFallback": "区域 #{id}",
        "itemFallback": "道具 #{id}",
        "targetFallback": "目标 #{id}",
        "kinds": {
          "character": "角色道具",
          "unit": "团体道具",
          "attr": "属性道具",
          "all": "全角色道具"
        },
        "targets": {
          "all": "全角色",
          "multiUnit": "多团体编成",
          "allAndMultiUnit": "全角色 · 多团体编成"
        }
      },
      "characterRankOverride": {
        "title": "角色等级自定义",
        "priorityHint": "优先于进阶配置里的统一角色等级",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的角色等级",
        "searchPlaceholder": "搜索等级...",
        "emptySearch": "没有找到等级",
        "maxRank": "最高 Rank {value}"
      },
      "mysekaiGateOverride": {
        "title": "烤森门自定义",
        "priorityHint": "优先于进阶配置里的统一烤森门等级",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的烤森大门",
        "searchPlaceholder": "搜索等级...",
        "emptySearch": "没有找到等级",
        "maxLevel": "最高 Lv.{value}"
      },
      "mysekaiFixtureBonusOverride": {
        "title": "玩偶加成自定义",
        "priorityHint": "优先于进阶配置里的统一玩偶加成",
        "selectedCount": "已覆盖 {count} 个",
        "clear": "清空覆盖",
        "default": "不覆盖",
        "empty": "当前数据还没有可覆盖的角色",
        "searchPlaceholder": "搜索加成...",
        "emptySearch": "没有找到加成",
        "maxRate": "最高 {value}"
      },
      "engine": {
        "title": "组卡引擎参数",
        "resultLimit": "结果数量",
        "resultLimitPlaceholder": "默认 6",
        "timeoutMs": "超时时间（ms）",
        "timeoutMsPlaceholder": "默认 15000",
        "invalid": "结果数量需要是 1-50 的整数；超时时间需要是 1000-300000 ms 的整数"
      }
    },
    "training": {
      "title": "卡牌养成",
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
      "description": "优先于按稀有度的养成设置；固定卡牌会自动加入",
      "card": "卡牌",
      "cardPlaceholder": "选择卡牌",
      "cardSearchPlaceholder": "搜索卡牌名或 ID...",
      "cardEmpty": "没有找到卡牌",
      "add": "添加",
      "empty": "暂未添加单卡覆盖",
      "selectedCount": "已添加 {count} 张单卡覆盖",
      "inherit": "沿用通用配置",
      "level": "等级",
      "skillLevel": "技能",
      "masterRank": "突破",
      "levelOption": "Lv.{value}",
      "skillLevelOption": "技能 Lv.{value}",
      "masterRankOption": "突破 {value}",
      "numberSearchPlaceholder": "搜索数值...",
      "numberEmpty": "没有可选数值",
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
      "ready": "选择完整参数后即可开始推荐",
      "run": "开始推荐",
      "running": "推荐中...",
      "blocked": {
        "noAccount": "还没有绑定游戏账号，绑定后才能开始推荐",
        "selectAccount": "请先选择一个游戏账号",
        "dataMissing": "所选账号还没有上传游戏数据，请先前往上传数据页上传"
      },
      "phases": {
        "preparing-data": "正在准备游戏数据…",
        "fetching-user-data": "正在读取用户数据...",
        "initializing": "正在启动计算…",
        "loading-data": "正在加载推荐数据...",
        "recommending": "正在执行推荐..."
      }
    },
    "result": {
      "title": "推荐结果",
      "idlePlaceholder": "点击「开始推荐」查看推荐卡组",
      "actions": {
        "compare": "对比",
        "compareTitle": "卡组对比",
        "compareBaseline": "基准",
        "copy": "复制卡组",
        "copied": "卡组信息已复制到剪贴板",
        "copyFailed": "复制失败，请检查浏览器剪贴板权限",
        "songRanking": "歌曲收益"
      },
      "elapsed": "组卡引擎合计用时 {seconds} 秒",
      "totalElapsed": "推荐总用时 {seconds} 秒",
      "secondsUnit": "秒",
      "dataElapsed": "获取数据",
      "engineDataElapsed": "组卡引擎数据准备",
      "sequentialRecommendElapsed": "顺序执行推荐（实际等待）",
      "parallelRecommendElapsed": "并行执行推荐（实际等待）",
      "algorithmElapsed": "{algorithm} 搜索：{seconds} 秒",
      "empty": "暂无推荐结果",
      "missingUserDataTitle": "还没有可用于组卡的游戏数据",
      "missingUserDataDescription": "所选账号还未上传 Suite 数据。所有组卡模式都只需要 Suite，烤森组卡也无需上传 MySekai。",
      "uploadDataAction": "前往上传数据",
      "deckTitle": "卡组 #{index}",
      "score": "Live分数 {score}",
      "totalPower": "综合力 {value}",
      "totalPowerLimitWarning": "该活动的综合力上限限制到了 {value}",
      "eventCardBonusLimitWarning": "该活动的当期活动加成仅计算 {count} 名成员",
      "eventSkillScoreUpLimitWarning": "该活动的卡牌技能分数加成最高限制为 {value}%",
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
        "fixture": "烤森玩偶",
        "gate": "烤森大门"
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
      "columns": {
        "card": "卡牌",
        "power": "综合力",
        "skillLevel": "技能",
        "scoreUp": "分数加成",
        "eventBonus": "活动加成"
      },
      "canvasBonus": "画布加成",
      "noCanvasBonus": "无画布"
    },
    "errors": {
      "unknown": "推荐失败，请稍后重试；如果持续失败，请提交工单反馈",
      "notEnoughCards": "卡牌不足：当前筛选后只剩 {count} 张卡，至少需要 5 张，请放宽稀有度/属性筛选",
      "currentDeckIncomplete": "读取到的当前队伍不足 5 张卡，请关闭「使用当前队伍」或在游戏里编成完整队伍后重新上传数据",
      "musicRequired": "请先选择歌曲和难度",
      "bonusTargetsRequired": "请至少填写一个目标加成",
      "skillOrderRequired": "请填写完整的技能顺序，或改用自动技能顺序",
      "worldBloomConfigInvalid": "连接世界活动的章节或团体设置不完整，请重新选择章节角色",
      "eventConditionRequired": "模拟活动需要同时指定活动属性和团体",
      "algorithmRequired": "请至少勾选一个搜索算法",
      "accountRequired": "请先登录并选择一个游戏账号",
      "masterNotReady": "游戏数据还没有准备好，请等待数据下载完成后重试",
      "timeout": "计算超时，请减少启用的算法或在高级设置里延长引擎超时后重试",
      "engineFailed": "组卡引擎运行出错，请刷新页面后重试；如果持续失败，请提交工单反馈"
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
    "description": "笔刷 = 一套卡组+歌曲的时速，涂到日历上累计 PT",
    "form": {
      "targetPoint": "目标 PT",
      "targetPointPlaceholder": "例如 1000w、120万、1.5亿",
      "currentPoint": "当前 PT",
      "currentPointPlaceholder": "例如 25k，留空表示 0",
      "parsedValue": "解析为 {value}",
      "invalidPoint": "无法解析该数值，请使用非负数字，可带 万/w、k、亿 后缀"
    },
    "summary": {
      "targetPoint": "目标 PT",
      "currentPoint": "当前 PT",
      "plannedPoint": "已规划 PT",
      "remainingPoint": "还差 PT",
      "dailyPoint": "日均需求",
      "projectedPoint": "规划后预计",
      "plannedHours": "打歌 {hours} 小时 · 休息 {rest} 小时"
    },
    "progress": {
      "title": "规划进度",
      "targetMark": "目标",
      "short": "按现在的规划还差 {remaining} PT",
      "over": "规划完成后预计 {projected} PT，比目标多 {surplus}",
      "exact": "规划刚好覆盖目标",
      "legendCurrent": "当前 PT",
      "legendPlanned": "已规划",
      "noTarget": "填写目标 PT 后显示进度",
      "pastNote": "已过去的小时不计入已规划 PT（当前 PT 已包含）"
    },
    "brushes": {
      "title": "时速笔刷",
      "rest": "休息",
      "eraser": "橡皮擦",
      "add": "新建笔刷",
      "perHour": "{points}/时",
      "edit": "编辑笔刷",
      "delete": "删除笔刷",
      "playsTitle": "每小时周回",
      "boostShort": "火",
      "usedHours": "已涂 {hours} 小时",
      "usage": "已涂 {hours} 小时，共 {points}",
      "deleteConfirmTitle": "删除笔刷「{name}」？",
      "deleteConfirmDescription": "日历上用它涂的 {hours} 小时会一起清掉",
      "boostTitle": "每局消耗的火数",
      "boostOption": "{count} 火 ×{multiplier}",
      "empty": "点击「新建笔刷」组卡并选歌"
    },
    "dialog": {
      "title": "新建时速笔刷",
      "description": "组卡后从歌曲 PT 排行中选歌",
      "runDeck": "根据活动组卡",
      "useSavedConfig": "使用组卡页面的详细设定",
      "savedConfigHint": "沿用组卡页的设定",
      "openDeckRecommend": "打开组卡页面调整",
      "running": "组卡中...",
      "deckTitle": "推荐卡组",
      "deckPower": "综合力",
      "deckBonus": "活动加成 {value}%",
      "rankingTitle": "歌曲 PT 排行",
      "rankingHint": "按多人 Live、不含火力估算；时速 = 单局 PT × 每小时局数",
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
      "playsPerHourHint": "默认按歌曲时长 + 30 秒间隔估算，可按实际情况调整",
      "externalSettingsHint": "周回数和火数在笔刷列表里调整",
      "brushName": "笔刷名称",
      "brushColor": "笔刷颜色",
      "pointsPerHour": "笔刷时速",
      "save": "保存笔刷",
      "noDeck": "组卡后显示歌曲排行",
      "rankingEmpty": "没有匹配的歌曲",
      "rankingAliasSearching": "正在匹配别名...",
      "selectHint": "点击排行中的歌曲选择要刷的歌"
    },
    "calendar": {
      "title": "活动日历",
      "noEvent": "选择带有开始/结算时间的活动后显示日历",
      "clear": "清空规划",
      "clearConfirmTitle": "清空整个日历？",
      "clearConfirmDescription": "所有涂过的小时都会清掉，笔刷会保留",
      "tool": "当前画笔",
      "toolValue": "画笔：{name}",
      "dayPoints": "当日 PT",
      "dayTotal": "日终累计",
      "reachesTarget": "达标",
      "hourLabel": "{hour} 时",
      "dragHint": "拖动可框选多天 × 多小时；用同一笔刷再涂即擦除。格内数字为每小时周回数。",
      "touchHint": "长按后拖动可框选多天 × 多小时；用同一笔刷再涂即擦除",
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
      "hint": "每天的该时段（含首尾小时）都会填充；选橡皮擦可批量清除"
    },
    "errors": {
      "noResult": "没有算出可用卡组，无法估算单局 PT。请确认该账号已上传数据，并在组卡页检查过滤条件。"
    }
  }
} as const
