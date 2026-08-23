// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: deckRecommend, eventPlanner
export default {
  "deckRecommend": {
    "title": "組卡推薦",
    "description": "選擇賬號、資料區服、模式與歌曲引數，獲取（儘可能）最優活動卡組推薦。",
    "notice": {
      "testingPrefix": "該功能處於測試狀態，",
      "testingSuffix": "如果遇到任何問題請聯絡 Haruki Dev Team 進行反饋。"
    },
    "select": {
      "loading": "正在準備資料..."
    },
    "configActions": {
      "save": "儲存配置",
      "clear": "清除配置",
      "clearDialogTitle": "確認清除配置",
      "clearDialogDescription": "此操作會刪除已儲存的組卡推薦配置，並將當前頁面恢復為預設值。確定要繼續嗎？",
      "clearDialogCancel": "取消",
      "clearDialogConfirm": "確認清除"
    },
    "summaryBar": {
      "edit": "編輯配置",
      "rerun": "重新推薦"
    },
    "form": {
      "account": "賬號",
      "accountPlaceholder": "請選擇已繫結賬號",
      "noAccount": "當前賬號還沒有繫結遊戲賬號。",
      "dataRegion": "資料伺服器",
      "mode": "組卡模式",
      "target": "組卡目標",
      "liveType": "Live 型別",
      "algorithm": "搜尋演算法",
      "algorithmHint": "預設演算法會隨組卡場景自動選擇：分數目標使用 DFS 精確搜尋（可證明最優），World Bloom 等複雜場景使用 DFS-GA，烤森使用強化學習。手動勾選後將保持你的選擇；同時啟用多個演算法可交叉驗證結果，但整體耗時更長。",
      "executionMode": "執行方式",
      "event": "活動",
      "eventPlaceholder": "請選擇活動",
      "eventSearchPlaceholder": "搜尋活動名、#ID、型別、拼音或羅馬音...",
      "eventEmpty": "沒有找到活動。",
      "character": "角色",
      "characterPlaceholder": "請選擇角色",
      "bonusTargets": "目標加成",
      "bonusTargetsPlaceholder": "例如 100 120 130",
      "bonusTargetsHint": "可輸入多個整數目標，用空格或逗號分隔。",
      "bonusTargetsInvalid": "目標加成需要填寫正整數，可用空格或逗號分隔。",
      "customBonusAttr": "自定義加成屬性",
      "customBonusAttrNone": "不指定",
      "customBonusCharacters": "自定義加成角色",
      "customBonusCharactersPlaceholder": "例如 1 2 21",
      "customBonusSupportUnits": "VS 支援團體",
      "customBonusSupportUnitsPlaceholder": "例如 21:light_sound 25:school_refusal",
      "customBonusSelectedCount": "已選擇 {count} 個角色",
      "customBonusSupportUnitsEmpty": "選擇 21-26 號 Virtual Singer 角色後可指定支援團體。",
      "filterOtherUnit": "過濾其他團體",
      "customBonusHint": "可按角色選擇自定義混活加成；VS 角色可額外指定支援團體。",
      "customBonusInvalid": "自定義加成條件格式不正確。",
      "customBonusSupportUnitsTargetInvalid": "VS 支援團體的角色必須同時出現在自定義加成角色裡。",
      "music": "歌曲",
      "musicPlaceholder": "請選擇歌曲",
      "musicSearchPlaceholder": "搜尋歌曲名、#ID、假名、拼音或羅馬音...",
      "musicEmpty": "沒有找到歌曲。",
      "difficultyPlaceholder": "請選擇難度"
    },
    "picker": {
      "musicDialogTitle": "選擇歌曲",
      "eventDialogTitle": "選擇活動",
      "cardDialogTitle": "瀏覽卡牌",
      "browse": "瀏覽篩選",
      "done": "完成",
      "filterAll": "全部",
      "unitLabel": "團體",
      "attrLabel": "屬性",
      "rarityLabel": "稀有度",
      "cardSearchLabel": "搜尋卡牌",
      "browseCount": "共 {count} 張卡牌"
    },
    "layers": {
      "default": {
        "title": "預設配置",
        "description": "選擇賬號、活動、Live、歌曲與搜尋方式；預設協力隊友會跟隨當前卡組。"
      },
      "advanced": {
        "title": "進階配置",
        "description": "調整卡牌養成、過濾條件、協力引數和卡組固定規則。"
      },
      "expert": {
        "title": "專家配置",
        "description": "調整技能策略、支援假設、引擎超時與單卡精細覆蓋。"
      }
    },
    "groups": {
      "accountTarget": "賬號與目標",
      "musicAlgorithm": "歌曲與演算法"
    },
    "modes": {
      "event": "活動組卡",
      "challenge": "挑戰組卡",
      "bonus": "加成組卡",
      "mysekai": "烤森組卡",
      "max": "最強組卡"
    },
    "targets": {
      "score": "Live分數",
      "pt": "PT",
      "power": "綜合力",
      "skill": "技能實效",
      "bonus": "活動加成"
    },
    "liveTypes": {
      "solo": "單人Live",
      "multi": "多人Live",
      "auto": "自動Live",
      "challenge": "挑戰Live",
      "challengeAuto": "挑戰自動Live",
      "mysekai": "烤森Live"
    },
    "algorithms": {
      "dfsGa": "DFS-GA 混合搜尋演算法",
      "dfs": "DFS 精確搜尋演算法",
      "ga": "遺傳演算法",
      "rl": "強化學習"
    },
    "executionModes": {
      "sequential": "順序進行",
      "parallel": "同時進行"
    },
    "skillStrategies": {
      "average": "平均",
      "max": "最大",
      "min": "最小",
      "specific": "特定順序"
    },
    "eventTypes": {
      "marathon": "馬拉松",
      "cheerfulCarnival": "歡樂嘉年華",
      "worldBloom": "連線世界",
      "unknown": "未知型別"
    },
    "eventAttrs": {
      "happy": "快樂",
      "cute": "可愛",
      "cool": "帥氣",
      "pure": "純潔",
      "mysterious": "神秘"
    },
    "cardTags": {
      "attrs": {
        "happy": "快樂",
        "cute": "可愛",
        "cool": "帥氣",
        "pure": "純潔",
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
        "title": "活動條件",
        "description": "選擇已釋出活動，或開啟模擬活動自定義活動型別、屬性、團體與章節。"
      },
      "bonus": {
        "title": "加成條件",
        "description": "指定一個或多個目標加成，組卡會嘗試生成對應加成的單人 Live 卡組。"
      },
      "eventSimulation": {
        "title": "模擬活動",
        "description": "用自定義活動型別、屬性和團體進行推薦，不依賴已釋出活動。",
        "unavailable": "當前模式不使用活動資訊，模擬活動不可用。",
        "realEventDisabled": "已開啟模擬活動，真實活動選擇不會參與推薦。",
        "activeHint": "模擬活動會覆蓋真實活動 ID，推薦會按當前模擬條件計算。",
        "type": "活動型別",
        "attr": "屬性",
        "unit": "團體",
        "worldBloomTurn": "章節",
        "worldBloomTurnOption": "第 {turn} 輪",
        "worldBloomCharacter": "角色",
        "invalid": "請補全模擬活動引數。連線世界第 1/2 輪需要角色能推匯出團體。",
        "customBonusUnit": "自定義加成角色",
        "customBonusTitle": "自定義加成角色",
        "customBonusSummary": "已選擇 {count} 個加成角色，符合角色加成的卡會獲得 25% 加成。",
        "customBonusConfigure": "設定自定義加成角色",
        "customBonusDescription": "選擇參與模擬活動加成的角色；Virtual Singer 角色可指定 VS 支援團體，也可以過濾其他團體。",
        "customBonusDone": "完成",
        "customBonusInvalid": "請選擇屬性，並至少選擇一個自定義加成角色。"
      },
      "multiLive": {
        "title": "協力引數",
        "description": "用於多人 Live。隊友綜合力和隊友實效留空時，會按當前卡組近似隊友。",
        "teammatePower": "隊友綜合力",
        "teammateScoreUp": "隊友實效",
        "followSelfPlaceholder": "跟隨當前卡組",
        "scoreUpLowerBound": "最低實效",
        "scoreUpLowerBoundPlaceholder": "不限制",
        "disabled": "當前 Live 型別不會使用協力引數。",
        "invalid": "協力引數需要填寫大於等於 0 的數字。"
      },
      "filters": {
        "title": "高階過濾",
        "description": "按角色、團體或屬性限制可用卡牌。",
        "none": "不限制",
        "selectedCount": "已選 {count} 項",
        "unit": "團體過濾",
        "attr": "屬性過濾",
        "character": "角色過濾",
        "characterSelectPlaceholder": "選擇過濾角色",
        "characterMinHint": "角色過濾會限制候選卡池；啟用時至少選擇 {count} 個角色，才能組成完整卡組。",
        "characterMinInvalid": "角色過濾啟用時至少需要選擇 {count} 個角色。",
        "areaItemLevel": "區域道具等級",
        "areaItemLevelDefault": "沿用當前資料",
        "areaItemLevelOption": "Lv.{value}",
        "areaItemLevelPlaceholder": "沿用當前資料",
        "characterRank": "角色等級",
        "characterRankDefault": "沿用當前資料",
        "characterRankOption": "Rank {value}",
        "mysekaiGateLevel": "烤森門等級",
        "mysekaiGateLevelDefault": "沿用當前資料",
        "mysekaiGateLevelOption": "Lv.{value}",
        "mysekaiFixtureBonusRate": "玩偶加成",
        "mysekaiFixtureBonusRateDefault": "沿用當前資料",
        "mysekaiFixtureBonusRateOption": "{value}%",
        "boost": "體力消耗",
        "boostOption": "{value}",
        "boostPlaceholder": "按體力消耗倍率計算 Pt",
        "invalid": "體力消耗需要是 0-10 的整數；覆蓋等級或加成需要是有效範圍內的值。"
      },
      "dataOverrides": {
        "title": "臨時資料覆蓋",
        "description": "隻影響本次推薦傳給引擎的資料，不會寫回上傳資料。",
        "invalid": "覆蓋等級或加成需要是有效範圍內的值。"
      },
      "runParameters": {
        "title": "計算引數",
        "description": "調整本次推薦的基礎計算引數。",
        "invalid": "體力消耗需要是 0-10 的整數。"
      },
      "constraints": {
        "title": "卡組約束",
        "description": "指定必須上場或排除的卡牌；當前主隊、固定卡牌和固定角色互斥。",
        "fixedGroup": "固定上場",
        "fixedGroupDescription": "固定卡牌最多 5 張且同一角色只能選 1 張；固定角色最多 5 個。",
        "excludedGroup": "排除條件",
        "excludedGroupDescription": "從候選卡池裡排除任意數量的卡牌，不影響固定卡牌上限。",
        "fixedCards": "固定卡牌",
        "useCurrentDeck": "使用當前主隊",
        "useCurrentDeckDescription": "啟用後直接以 profile 當前主隊作為固定卡組。",
        "fixedCharacters": "固定角色",
        "excludedCards": "排除卡牌",
        "cardSelectPlaceholder": "搜尋並選擇卡牌",
        "fixedCardSelectPlaceholder": "選擇固定卡牌",
        "excludedCardSelectPlaceholder": "選擇排除卡牌",
        "cardSearchPlaceholder": "搜尋卡牌名、#ID、角色、團體、屬性、稀有度或拼音...",
        "cardEmpty": "沒有找到卡牌。",
        "noSelectedCards": "暫未選擇卡牌。",
        "selectedCardsCount": "已選擇 {count} 張卡牌",
        "selectedCardsLimitCount": "已選擇 {count}/{max} 張卡牌",
        "removeCard": "移除卡牌",
        "characterSelectPlaceholder": "選擇固定角色",
        "characterNone": "不指定角色",
        "noSelectedCharacters": "暫未選擇角色。",
        "selectedCharactersCount": "已選擇 {count}/{max} 個角色",
        "removeCharacter": "移除角色",
        "characterListPlaceholder": "例如 1 2 21",
        "invalid": "角色 ID 需要填寫正整數，可用空格或逗號分隔。",
        "challengeHint": "挑戰 Live 已經由角色選擇決定目標角色，不能再固定角色。",
        "currentDeckHint": "會優先讀取遊戲 profile 的當前主隊，失敗時回落到已上傳資料；使用當前主隊時固定上場和排除條件不會參與推薦。"
      },
      "random": {
        "title": "技能與支援",
        "description": "控制技能順序、BFes 技能吸取方式，以及連線世界支援卡養成假設。",
        "skillGroup": "技能策略",
        "skillGroupDescription": "調整技能觸發順序和 BFes 技能參考方式。",
        "skillOrder": "技能順序",
        "specificSkillOrder": "特定技能順序",
        "specificSkillOrderPlaceholder": "例如 12345",
        "specificSkillOrderHint": "填寫 1-5 的不重複順序，1 表示隊長位，常用於固定當前隊伍。",
        "specificSkillOrderInvalid": "特定技能順序必須包含 1-5 且不能重複，例如 12345。",
        "skillReference": "BFes 技能吸取",
        "keepAfterTrainingState": "雙技能狀態不變",
        "keepAfterTrainingStateDescription": "保留卡牌特訓前後的技能狀態，不強制切換。",
        "supportGroup": "連線世界支援",
        "supportGroupDescription": "僅影響連線世界支援卡組的養成假設。",
        "supportMasterMax": "支援卡滿突破",
        "supportMasterMaxDescription": "計算支援卡時按滿突破處理。",
        "supportSkillMax": "支援卡滿技能",
        "supportSkillMaxDescription": "計算支援卡時按滿技能處理。"
      },
      "areaItemOverride": {
        "title": "區域道具覆蓋",
        "description": "按單個區域道具臨時覆蓋等級，預設不覆蓋。",
        "priorityHint": "單個道具覆蓋優先於進階配置裡的區域道具等級。",
        "selectedCount": "已覆蓋 {count} 個",
        "clear": "清空覆蓋",
        "default": "不覆蓋",
        "empty": "當前資料還沒有可覆蓋的區域道具。",
        "searchPlaceholder": "搜尋等級...",
        "emptySearch": "沒有找到等級。",
        "areaFallback": "區域 #{id}",
        "itemFallback": "道具 #{id}",
        "targetFallback": "目標 #{id}",
        "kinds": {
          "character": "角色道具",
          "unit": "團體道具",
          "attr": "屬性道具"
        }
      },
      "characterRankOverride": {
        "title": "角色等級自定義",
        "description": "按單個角色臨時覆蓋角色等級，預設不覆蓋。",
        "priorityHint": "單角色覆蓋優先於進階配置裡的統一角色等級。",
        "selectedCount": "已覆蓋 {count} 個",
        "clear": "清空覆蓋",
        "default": "不覆蓋",
        "empty": "當前資料還沒有可覆蓋的角色等級。",
        "searchPlaceholder": "搜尋等級...",
        "emptySearch": "沒有找到等級。",
        "maxRank": "最高 Rank {value}"
      },
      "mysekaiGateOverride": {
        "title": "烤森門自定義",
        "description": "按單個烤森門臨時覆蓋等級，預設不覆蓋。",
        "priorityHint": "單門覆蓋優先於進階配置裡的統一烤森門等級。",
        "selectedCount": "已覆蓋 {count} 個",
        "clear": "清空覆蓋",
        "default": "不覆蓋",
        "empty": "當前資料還沒有可覆蓋的 MySekai 大門。",
        "searchPlaceholder": "搜尋等級...",
        "emptySearch": "沒有找到等級。",
        "maxLevel": "最高 Lv.{value}"
      },
      "mysekaiFixtureBonusOverride": {
        "title": "玩偶加成自定義",
        "description": "按單個角色臨時覆蓋烤森玩偶綜合力加成，預設不覆蓋。",
        "priorityHint": "單角色覆蓋優先於進階配置裡的統一玩偶加成。",
        "selectedCount": "已覆蓋 {count} 個",
        "clear": "清空覆蓋",
        "default": "不覆蓋",
        "empty": "當前資料還沒有可覆蓋的角色。",
        "searchPlaceholder": "搜尋加成...",
        "emptySearch": "沒有找到加成。",
        "maxRate": "最高 {value}"
      },
      "engine": {
        "title": "組卡引擎引數",
        "description": "只調整結果數量和超時時間；搜尋演算法內部引數保持自動配置。",
        "resultLimit": "結果數量",
        "resultLimitPlaceholder": "預設 6",
        "timeoutMs": "超時時間（ms）",
        "timeoutMsPlaceholder": "預設 15000",
        "invalid": "結果數量需要是 1-50 的整數；超時時間需要是 1000-300000 ms 的整數。"
      }
    },
    "training": {
      "title": "卡牌養成",
      "description": "按稀有度設定推薦時採用的預設養成狀態。",
      "rarity": "稀有度",
      "disabled": "停用",
      "maxLevel": "滿級",
      "episodesRead": "前後篇",
      "maxMasterRank": "滿突破",
      "maxSkillLevel": "滿技能",
      "mySekaiCanvas": "烤森畫布",
      "rarities": {
        "rarity_1": "一星",
        "rarity_2": "二星",
        "rarity_3": "三星",
        "rarity_4": "四星",
        "rarity_birthday": "生日"
      }
    },
    "singleCard": {
      "title": "單卡養成覆蓋",
      "description": "對指定卡牌單獨覆蓋等級、技能、突破、劇情和畫布設定；覆蓋會優先於按稀有度設定。固定卡牌會按當前通用養成配置自動加入這裡。",
      "card": "卡牌",
      "cardPlaceholder": "選擇卡牌",
      "cardSearchPlaceholder": "搜尋卡牌名或 ID...",
      "cardEmpty": "沒有找到卡牌。",
      "add": "新增",
      "empty": "暫未新增單卡覆蓋。",
      "selectedCount": "已新增 {count} 張單卡覆蓋",
      "inherit": "沿用通用配置",
      "level": "等級",
      "skillLevel": "技能",
      "masterRank": "突破",
      "levelOption": "Lv.{value}",
      "skillLevelOption": "技能 Lv.{value}",
      "masterRankOption": "突破 {value}",
      "numberSearchPlaceholder": "搜尋數值...",
      "numberEmpty": "沒有可選數值。",
      "episodes": "劇情",
      "remove": "移除單卡覆蓋",
      "episodeStates": {
        "inherit": "沿用通用配置",
        "none": "未解鎖",
        "first": "前篇",
        "both": "前後篇"
      }
    },
    "runner": {
      "ready": "選擇完整引數後即可開始推薦。",
      "run": "開始推薦",
      "running": "推薦中...",
      "phases": {
        "preparing-data": "正在準備 master 與 music metas...",
        "fetching-user-data": "正在讀取使用者資料...",
        "initializing": "正在初始化組卡引擎...",
        "loading-data": "正在載入推薦資料...",
        "recommending": "正在執行推薦..."
      }
    },
    "result": {
      "title": "推薦結果",
      "description": "推薦完成後會在這裡顯示卡組結果。",
      "idlePlaceholder": "完成上方配置後點擊「開始推薦」，推薦卡組會顯示在這裡。",
      "actions": {
        "compare": "對比",
        "compareTitle": "卡組對比",
        "compareBaseline": "基準",
        "copy": "複製卡組",
        "copied": "卡組資訊已複製到剪貼簿。",
        "copyFailed": "複製失敗，請檢查瀏覽器剪貼簿許可權。",
        "songRanking": "歌曲收益"
      },
      "elapsed": "組卡引擎合計用時 {ms} ms",
      "totalElapsed": "推薦總耗時 {ms} ms",
      "dataElapsed": "獲取資料",
      "engineDataElapsed": "組卡引擎資料準備",
      "sequentialRecommendElapsed": "順序執行推薦（實際等待）",
      "parallelRecommendElapsed": "並行執行推薦（實際等待）",
      "algorithmElapsed": "{algorithm} 搜尋：{ms} ms",
      "empty": "暫無推薦結果。",
      "missingUserDataTitle": "還沒有可用於組卡的遊戲資料",
      "missingUserDataDescription": "所選遊戲賬號尚未上傳所需資料。請先前往資料上傳頁上傳 Suite 資料；使用烤森模式時還需要上傳 MySekai 資料，然後再回來重試。",
      "uploadDataAction": "前往上傳資料",
      "deckTitle": "卡組 #{index}",
      "score": "Live分數 {score}",
      "totalPower": "綜合力 {value}",
      "totalPowerLimitWarning": "該活動的綜合力上限限制到了 {value}",
      "eventCardBonusLimitWarning": "該活動的當期活動加成僅計算 {count} 名成員。",
      "eventSkillScoreUpLimitWarning": "該活動的卡牌技能分數加成最高限制為 {value}%。",
      "summary": {
        "pt": "PT",
        "power": "綜合力",
        "totalBonus": "總加成",
        "effective": "實效值",
        "bonusBreakdown": "主隊 {main}% + 支援 {support}%"
      },
      "sections": {
        "basic": "基礎資訊",
        "power": "綜合力詳情",
        "cards": "卡組資訊",
        "mainCards": "主卡組資訊",
        "supportCards": "支援卡組資訊"
      },
      "power": {
        "total": "總綜合力",
        "base": "基礎綜合力",
        "areaItem": "區域道具",
        "character": "角色等級",
        "honor": "稱號",
        "fixture": "MySekai 玩偶",
        "gate": "MySekai 大門"
      },
      "eventBonus": "活動加成 {value}%",
      "bonusTag": "加成 {value}%",
      "worldBloomEventBonus": "活動加成 主卡組 {main}% + 支援卡組 {support}% = {total}%",
      "liveScore": "Live分數 {value}",
      "liveScoreLabel": "Live分數",
      "mysekaiEventPoint": "烤森活動 Pt {value}",
      "multiLiveScoreUp": "協力實效 {value}%",
      "challengeScoreDelta": "挑戰分差 {value}",
      "challengeScoreDeltaLabel": "挑戰分差",
      "unknownCard": "未知卡牌",
      "cardGroups": {
        "power": "綜合力",
        "training": "養成",
        "skillBonus": "技能與加成",
        "storyCanvas": "劇情與畫布"
      },
      "cardTotalPower": "綜合力 {value}",
      "cardTotalPowerShort": "總綜合力 {value}",
      "cardBasePower": "基礎 {value}",
      "cardBasePowerShort": "基礎綜合力 {value}",
      "cardLevel": "Lv.{value}",
      "masterRank": "突破 {value}",
      "skillLevel": "技能 Lv.{value}",
      "skillScoreUp": "技能 {value}%",
      "skillScoreUpShort": "分數加成{value}%",
      "skillLifeRecovery": "回覆 {value}",
      "skillLifeRecoveryShort": "回覆 {value}",
      "cardEventBonus": "加成 {value}%",
      "cardEventBonusShort": "活動 {value}%",
      "episodeFirst": "前篇",
      "episodesShort": "劇情",
      "episodeSecond": "後篇",
      "readState": {
        "read": "已讀",
        "unread": "未讀"
      },
      "supportSkillLevel": "SLv.{value}",
      "canvasBonus": "畫布加成",
      "noCanvasBonus": "無畫布"
    },
    "toast": {
      "runSuccessTitle": "推薦完成",
      "runFailedTitle": "推薦失敗",
      "configSavedTitle": "配置已儲存",
      "configSaveFailedTitle": "儲存配置失敗",
      "configClearedTitle": "配置已清除"
    },
    "attribution": {
      "originalPrefix": "組卡推薦原始演算法來自",
      "originalMiddle": "的",
      "originalSuffix": "。",
      "optimizationPrefix": "本網站採用的部分演算法最佳化來自",
      "optimizationMiddle": "的",
      "neuraxmyName": "ルナ茶",
      "enginePrefix": "本站採用的組卡推薦演算法引擎請前往",
      "aboutLink": "關於",
      "engineSuffix": "頁面獲取詳細資訊，計算結果僅供參考。"
    }
  },
  "eventPlanner": {
    "title": "活動規劃",
    "description": "用時速筆刷在活動日曆上安排每小時的打歌計劃，並即時對照目標 PT。",
    "sections": {
      "setup": {
        "title": "賬號與活動",
        "description": "選擇已繫結賬號、資料伺服器和活動；連線世界活動可選擇章節角色。"
      }
    },
    "form": {
      "targetPoint": "目標 PT",
      "targetPointPlaceholder": "例如 1000w、120萬、1.5億",
      "currentPoint": "當前 PT",
      "currentPointPlaceholder": "例如 25k，留空表示 0",
      "parsedValue": "解析為 {value}",
      "invalidPoint": "無法解析該數值，請使用非負數字，可帶 萬/w、k、億 字尾。"
    },
    "summary": {
      "targetPoint": "目標 PT",
      "currentPoint": "當前 PT",
      "plannedPoint": "已規劃 PT",
      "remainingPoint": "還差 PT",
      "dailyPoint": "日均需求",
      "plannedHours": "已規劃 {hours} 小時 · 休息 {rest} 小時",
      "reached": "當前規劃已覆蓋目標 PT！"
    },
    "brushes": {
      "title": "時速筆刷",
      "description": "選中筆刷後在日曆上單擊或拖動填充；對同一筆刷的格子再次塗抹即可擦除。",
      "rest": "休息",
      "eraser": "橡皮擦",
      "add": "新建筆刷",
      "perHour": "{points}/時",
      "edit": "編輯筆刷",
      "delete": "刪除筆刷",
      "playsUnit": "周/時",
      "playsTitle": "每小時週迴數",
      "boostTitle": "每局消耗的火數",
      "boostOption": "{count} 火 ×{multiplier}",
      "empty": "還沒有時速筆刷，點選「新建筆刷」組卡並選歌。"
    },
    "dialog": {
      "title": "新建時速筆刷",
      "description": "根據所選活動直接組卡，然後從歌曲 PT 排行中挑選要刷的歌。",
      "runDeck": "根據活動組卡",
      "useSavedConfig": "使用組卡頁面的詳細設定",
      "savedConfigHint": "組卡引數（演算法、隊友、區域道具/角色等級覆蓋、固定/排除卡、養成配置等）沿用組卡頁面儲存的設定；需要調整時在組卡頁面修改後回來重新組卡即可。",
      "openDeckRecommend": "開啟組卡頁面調整",
      "running": "組卡中...",
      "deckTitle": "推薦卡組",
      "deckPower": "綜合力",
      "deckBonus": "活動加成 {value}%",
      "rankingTitle": "歌曲 PT 排行",
      "rankingHint": "基於該卡組對全部歌曲的引擎測算（多人 Live、不含火力），時速 = 單局 PT × 每小時局數。",
      "rankingLoading": "正在測算歌曲排行...",
      "searchPlaceholder": "搜尋歌曲名 / 別名 / ID...",
      "allDifficulties": "全部難度",
      "columns": {
        "song": "歌曲",
        "difficulty": "難度",
        "eventPoint": "單局 PT",
        "playsPerHour": "局/時",
        "pointsPerHour": "時速"
      },
      "playsPerHour": "每小時局數",
      "playsPerHourHint": "預設按歌曲時長 + 30 秒間隔估算，可按實際情況調整。",
      "externalSettingsHint": "週迴數與火數在筆刷列表上直接調整，時速會隨之更新。",
      "brushName": "筆刷名稱",
      "brushColor": "筆刷顏色",
      "pointsPerHour": "筆刷時速",
      "save": "儲存筆刷",
      "noDeck": "先組卡後才能生成歌曲排行。",
      "rankingEmpty": "沒有匹配的歌曲。",
      "rankingAliasSearching": "正在匹配別名...",
      "selectHint": "點選排行中的歌曲選擇要刷的歌。"
    },
    "calendar": {
      "title": "活動日曆",
      "noEvent": "選擇帶有開始/結算時間的活動後顯示日曆。",
      "clear": "清空規劃",
      "hourLabel": "{hour} 時",
      "dragHint": "單擊填充一格，按住拖動可框選多天 × 多小時的時間段批次填充；用同一筆刷再次框選即為擦除。格內數字為每小時週迴數。",
      "playsPerHour": "{count} 周/時"
    },
    "batch": {
      "title": "批次填充",
      "fromDay": "開始日期",
      "toDay": "結束日期",
      "fromHour": "開始時刻",
      "toHour": "結束時刻",
      "brush": "筆刷",
      "apply": "填充",
      "hint": "將所選日期範圍內每天的該時間段（包含首尾小時）填充為所選筆刷；選擇擦除可批次清除。"
    },
    "toasts": {
      "remaining": "已規劃 {planned} PT，距目標還差 {remaining} PT",
      "reached": "已規劃 {planned} PT，目標已覆蓋！"
    },
    "errors": {
      "noResult": "組卡引擎沒有返回可用卡組，無法計算單局 PT。"
    }
  }
} as const
