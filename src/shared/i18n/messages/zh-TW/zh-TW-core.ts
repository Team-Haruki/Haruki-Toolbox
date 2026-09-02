// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: app, common, turnstile, auth, sidebarUser, home, gameAccountSelect, cardBox, eventRecords, musicProgress, globalSearch, costumes, gachas, playerProfile, training, searchAlias, sekaiRegion, sekaiUnreleased, navigation, webLayout, route, musicLibrary, cards, events, homeSettings, core, catalog
export default {
  "app": {
    "name": "Haruki工具箱"
  },
  "common": {
    "save": "儲存",
    "reset": "重置",
    "cancel": "取消",
    "close": "關閉",
    "back": "返回",
    "tip": "提示",
    "actionFailed": "操作失敗",
    "postSuccessWarningTitle": "操作成功，但有後續異常",
    "postSuccessWarningDescription": "後續重新整理失敗，如頁面資料未更新請手動重新整理。",
    "guest": "未登入",
    "accountIndex": "賬號 {index}",
    "apiResponse": "API響應",
    "missingUpdatedData": "{context}缺少 updatedData"
  },
  "turnstile": {
    "loading": "正在載入驗證碼元件...",
    "loadFailed": "驗證碼元件載入失敗，請檢查網路後重試。",
    "retry": "重試載入"
  },
  "auth": {
    "common": {
      "cancel": "取消",
      "loadingFlow": "正在載入身份流程...",
      "restartFlow": "重新開始流程"
    },
    "toast": {
      "networkError": "網路錯誤，請檢查連線",
      "loginFailedTitle": "登入失敗",
      "accountBannedTitle": "賬號已被封禁",
      "permissionDenied": "許可權不足，請檢查賬號狀態",
      "tryLater": "請稍後再試",
      "logoutSuccessTitle": "登出成功",
      "invalidReturnToTitle": "登入流程已重置",
      "invalidReturnToDescription": "檢測到異常跳轉目標，已為您重新發起安全登入流程。"
    },
    "login": {
      "title": "登入到 Haruki 工具箱",
      "description": "使用您的郵箱和密碼登入",
      "emailLabel": "郵箱",
      "emailPlaceholder": "請輸入您的郵箱",
      "passwordLabel": "密碼",
      "passwordPlaceholder": "請輸入您的密碼",
      "forgotPassword": "忘記密碼？",
      "submit": "登入",
      "noAccount": "還沒有帳號？",
      "registerLink": "註冊",
      "resetDialog": {
        "title": "重置密碼",
        "description": "請輸入您的郵箱地址以重置密碼",
        "sendResetEmail": "傳送重置郵件"
      },
      "toast": {
        "enterEmail": "請輸入郵箱地址",
        "completeCaptcha": "請先完成人機驗證",
        "completeLoginCaptcha": "請先完成驗證碼驗證",
        "resetEmailSentTitle": "重置密碼郵件已傳送",
        "resetEmailSentDescription": "郵件已傳送到 {email}",
        "resetFailedTitle": "重置密碼失敗",
        "loginSuccessTitle": "登入成功",
        "loginSuccessDescription": "歡迎回到Haruki工具箱"
      }
    },
    "register": {
      "title": "註冊賬號",
      "description": "建立一個新的 Haruki 工具箱賬號",
      "usernameLabel": "使用者名稱",
      "usernamePlaceholder": "請輸入使用者名稱",
      "emailLabel": "郵箱",
      "emailCodeLabel": "郵箱驗證碼",
      "emailCodePlaceholder": "請輸入收到的驗證碼",
      "passwordLabel": "密碼",
      "passwordPlaceholder": "請輸入密碼",
      "sending": "傳送中...",
      "countdown": "{seconds} 秒後重試",
      "sendCode": "傳送驗證碼",
      "submit": "註冊",
      "hasAccount": "已有賬號？",
      "goLogin": "去登入",
      "sendCodeDialog": {
        "title": "傳送郵件前人機驗證",
        "description": "請完成人機驗證以傳送您的註冊郵件",
        "confirmSend": "確認傳送"
      },
      "toast": {
        "invalidEmail": "請輸入有效的郵箱地址",
        "completeCaptcha": "請先完成人機驗證",
        "completeRegisterCaptcha": "請先完成驗證碼驗證",
        "codeSentTitle": "郵件已傳送",
        "codeSentDescription": "郵件已傳送到 {email}",
        "sendCodeFailedTitle": "傳送驗證碼失敗",
        "sendCodeFailedDescription": "傳送失敗",
        "registerFailedTitle": "註冊失敗",
        "registerFailedDescription": "註冊失敗",
        "incompleteInfo": "請完整填寫註冊資訊",
        "passwordMinLength": "密碼長度至少為{min}位", // NOSONAR -- translation key, not a credential
        "emailVerificationRequired": "請先為當前郵箱傳送驗證碼",
        "registerSuccessTitle": "註冊成功",
        "registerSuccessDescription": "歡迎來到Haruki工具箱"
      }
    },
    "resetPassword": {
      "title": "重置密碼",
      "description": "重置您的Haruki工具箱賬號的密碼",
      "emailLabel": "郵箱",
      "newPasswordLabel": "新密碼",
      "newPasswordPlaceholder": "請輸入新密碼",
      "confirmPasswordLabel": "確認密碼",
      "confirmPasswordPlaceholder": "請再次輸入新密碼",
      "submit": "確認重置",
      "toast": {
        "invalidLink": "重置連結無效，請重新發起找回密碼流程",
        "incompleteInfo": "請輸入完整資訊",
        "passwordMismatch": "兩次密碼輸入不一致", // NOSONAR -- translation key, not a credential
        "passwordMinLength": "密碼長度至少為{min}位", // NOSONAR -- translation key, not a credential
        "resetSuccessTitle": "密碼重置成功",
        "resetSuccessDescription": "請重新登入",
        "resetFailedTitle": "重置失敗",
        "resetFailedDescription": "重置失敗"
      }
    },
    "verification": {
      "title": "驗證郵箱",
      "description": "完成身份驗證流程以啟用當前郵箱地址。",
      "submit": "提交驗證"
    },
    "error": {
      "title": "身份流程異常",
      "description": "身份服務返回了錯誤資訊，請根據提示重新發起登入或註冊流程。",
      "retry": "重新載入",
      "backToLogin": "返回登入",
      "missingIdDescription": "缺少錯誤 ID，無法查詢身份服務的具體錯誤資訊。",
      "loadFailedDescription": "載入身份錯誤詳情失敗，請稍後重試。",
      "fallbackDescription": "身份流程發生異常，請重新開始流程。",
      "errorIdLabel": "錯誤 ID",
      "statusCodeLabel": "狀態碼",
      "detailsLabel": "詳細資訊"
    }
  },
  "sidebarUser": {
    "guestInitial": "未",
    "guestName": "未登入",
    "accountSettings": "帳號設定",
    "identitySettings": "使用者身份設定",
    "gameAccountManagement": "遊戲賬號管理",
    "harukiBotAuthorization": "HarukiBot資料授權",
    "oauthAuthorizations": "OAuth 授權管理",
    "logout": "登出",
    "register": "註冊",
    "login": "登入",
    "copyToolboxId": "複製 Toolbox 使用者 ID",
    "toolboxIdCopied": "已複製 Toolbox 使用者 ID",
    "copyFailed": "複製失敗"
  },
  "home": {
    "title": "歡迎使用 Haruki 工具箱",
    "description": "請選擇您需要的功能",
    "aboutBanner": {
      "badge": "關於 & 贊助",
      "title": "您的幫助是我們繼續下去的動力",
      "desc": "點選檢視關於 Project Haruki 以及如何贊助開發者團隊"
    },
    "accountAndSettings": "賬號與設定",
    "register": "註冊",
    "login": "登入",
    "accountSettings": "賬號設定",
    "gameAccountManagement": "遊戲賬號管理",
    "moreLinks": "更多",
    "accountCard": {
      "title": "我的賬號",
      "dataUpdatedAt": "資料上傳於 {time}",
      "noUploadData": "該賬號還沒有上傳過資料",
      "guestDescription": "登入後繫結遊戲賬號，即可上傳資料、檢視檔案與個性化功能。"
    },
    "externalLinks": "站外連結",
    "harukiBotDocs": "HarukiBot NEO幫助文件",
    "harukiGithub": "Haruki GitHub",
    "legalLinks": "法律與合規",
    "privacyPolicy": "隱私政策",
    "termsOfService": "服務條款",
    "currentEvent": {
      "title": "當前活動（{region}）",
      "optInHint": "載入 Sekai 主資料後可展示當前進行中的活動。",
      "load": "載入當前活動",
      "none": "當前沒有進行中的活動。",
      "error": "活動資訊載入失敗。",
      "ended": "已結束",
      "remainingDays": "剩餘 {days} 天 {hours} 小時",
      "remainingHours": "剩餘 {hours} 小時 {minutes} 分",
      "remainingMinutes": "剩餘 {minutes} 分鐘",
      "badge": "進行中",
      "links": {
        "rankBorder": "榜線",
        "deckRecommend": "組卡",
        "detail": "詳情"
      }
    }
  },
  "gameAccountSelect": {
    "placeholder": "選擇遊戲賬號",
    "verified": "已驗證",
    "default": "預設",
    "none": "你還沒有繫結任何遊戲賬號。",
    "manage": "管理繫結",
    "grantedBadge": "授權",
    "groups": {
      "own": "我的繫結賬號",
      "granted": "他人授權的賬號"
    }
  },
  "cardBox": {
    "title": "我的卡牌",
    "description": "檢視賬號的卡牌收集進度",
    "entryLink": "我的卡牌",
    "noAccountHint": "繫結並選擇一個遊戲賬號後即可檢視我的卡牌。",
    "dataAsOf": "資料更新於 {time}",
    "refresh": "重新整理",
    "loadError": "卡牌資料載入失敗",
    "retry": "重試",
    "unknownCharacter": "未知角色",
    "empty": "當前篩選條件下沒有卡牌。",
    "total": "共 {total} 張",
    "summary": "已收集 {owned}/{total} · {percent}%",
    "nav": {
      "label": "角色導航"
    },
    "sections": {
      "collapseAll": "全部摺疊",
      "expandAll": "全部展開"
    },
    "sort": {
      "id": "ID",
      "rarity": "稀有度",
      "level": "等級",
      "masterRank": "突破"
    },
    "group": {
      "label": "分組",
      "character": "按角色",
      "attr": "按屬性",
      "all": "全部卡牌"
    },
    "ownership": {
      "label": "顯示",
      "all": "全部",
      "owned": "僅已擁有",
      "missing": "僅未擁有"
    },
    "filter": {
      "attrs": "屬性",
      "rarity": "稀有度"
    },
    "stats": {
      "title": "收集統計",
      "byUnit": "按團體",
      "byAttr": "按屬性",
      "byRarity": "按星級",
      "rarities": {
        "rarity_1": "1星",
        "rarity_2": "2星",
        "rarity_3": "3星",
        "rarity_4": "4星",
        "rarity_birthday": "生日"
      },
      "ownedOfTotal": "{owned}/{total}",
      "percent": "{percent}%"
    },
    "badge": {
      "level": "Lv.{level}"
    }
  },
  "eventRecords": {
    "title": "活動記錄",
    "description": "檢視賬號的活動參與記錄",
    "idle": "請選擇一個遊戲賬號以檢視活動記錄。",
    "loading": "正在載入賬號快照與活動資料...",
    "missingUserData": "當前賬號尚未上傳遊戲資料，請先前往上傳資料頁面完成上傳。",
    "missingGrantedData": "該賬號的所有者還沒有上傳遊戲資料，暫時無法檢視。",
    "uploadData": "前往上傳資料",
    "noData": "該賬號的快照中暫無活動記錄。",
    "loadFailed": "活動記錄載入失敗。",
    "retry": "重試",
    "refresh": "重新整理",
    "dataAsOf": "資料快照時間：{time}",
    "summary": {
      "participated": "參與活動數",
      "bestPoint": "最高活動 PT",
      "averagePoint": "平均活動 PT"
    },
    "filters": {
      "lastYear": "近一年",
      "all": "全部",
      "custom": "自定義",
      "from": "開始時間",
      "to": "結束時間",
      "type": "活動型別"
    },
    "trend": {
      "title": "活動 PT 趨勢",
      "empty": "記錄不足，暫時無法繪製趨勢圖。",
      "point": "活動 PT",
      "rank": "活動排名",
      "showAll": "檢視全部",
      "zoomHint": "拖動或縮放下方選區以檢視指定範圍的活動"
    },
    "table": {
      "title": "活動歷史",
      "event": "活動",
      "type": "型別",
      "point": "活動 PT",
      "rank": "排名",
      "rankFromHonor": "缺少具體排名資料，檔位由活動牌子推斷"
    },
    "worldLink": {
      "chapterLabel": "第 {no} 章",
      "finale": "終章"
    }
  },
  "musicProgress": {
    "title": "打歌進度",
    "description": "檢視賬號的打歌進度與可獲取獎勵",
    "rewards": {
      "title": "可獲取資源",
      "hint": "統計尚未領取的歌曲成就獎勵（評分達標 + 各難度連擊里程碑）。",
      "unavailable": "當前資料快照不包含成就領取記錄（userMusicAchievements），無法統計可獲取資源。",
      "jewel": "水晶",
      "coin": "金幣",
      "shard": "碎片",
      "scoreRank": "評分獎勵",
      "allClaimed": "已全部領取"
    },
    "dataAsOf": "資料快照時間：{time}",
    "refresh": "重新整理",
    "retry": "重試",
    "noAccount": "請選擇或繫結遊戲賬號以檢視打歌進度。",
    "loading": "正在載入賬號快照與樂曲資料...",
    "missingUserData": "當前賬號尚未上傳遊戲資料，請先前往上傳資料頁面完成上傳。",
    "missingGrantedData": "該賬號的所有者還沒有上傳遊戲資料，暫時無法檢視。",
    "uploadData": "前往上傳資料",
    "noResults": "該資料快照中暫無歌曲遊玩記錄，所有歌曲將顯示為未遊玩。",
    "suiteError": "載入賬號快照資料失敗。",
    "masterError": "載入樂曲資料失敗：{message}",
    "downloading": "正在下載 Masterdata（{progress}%）...",
    "overallTitle": "全難度概覽",
    "levelsTitle": "按定數統計",
    "noSongs": "所選伺服器在該難度下暫無歌曲。",
    "level": "Lv.{level}",
    "levelUnknown": "Lv.?",
    "songCount": "{count} 首",
    "summary": {
      "total": "曲目數",
      "cleared": "已通關",
      "fullCombo": "Full Combo",
      "allPerfect": "All Perfect"
    },
    "legend": {
      "allPerfect": "All Perfect",
      "fullCombo": "Full Combo（非 AP）",
      "clear": "Clear（非 FC）",
      "unplayed": "未遊玩"
    },
    "status": {
      "allPerfect": "AP",
      "fullCombo": "FC",
      "clear": "CLEAR",
      "unplayed": "—"
    }
  },
  "globalSearch": {
    "title": "快速搜尋",
    "description": "在本地 Master 資料中搜索歌曲、卡牌與活動",
    "placeholder": "搜尋歌曲、卡牌、活動…",
    "typeToSearch": "輸入關鍵詞以搜尋歌曲、卡牌與活動",
    "error": "Master 資料載入失敗",
    "retry": "重試",
    "empty": "沒有找到匹配的結果",
    "groups": {
      "music": "歌曲",
      "card": "卡牌",
      "event": "活動"
    },
    "footerRegion": "資料區服：{region}",
    "footerHint": "{shortcut} 開啟或關閉搜尋"
  },
  "costumes": {
    "dressup": {
      "title": "服裝搭配",
      "description": "自由組合角色的服裝、頭飾與髮型並進行 3D 預覽",
      "region": "區服",
      "character": "角色",
      "characterPlaceholder": "選擇角色",
      "body": "服裝",
      "head": "頭飾",
      "hair": "髮型",
      "partPlaceholder": "選擇部件",
      "searchPlaceholder": "搜尋名稱或 ID...",
      "empty": "沒有找到匹配項。",
      "hairLockedHint": "該頭飾固定髮型，髮型選項不生效。",
      "reset": "恢復預設",
      "rotateLeft": "向左轉",
      "rotateRight": "向右轉",
      "resetView": "回正",
      "zoomIn": "放大",
      "zoomOut": "縮小",
      "copyLink": "複製連結",
      "linkCopied": "連結已複製",
      "colorCount": "{count} 色",
      "linkCopyFailed": "複製失敗，請手動複製位址列。",
      "loadError": "服裝資料載入失敗。",
      "roleLoadError": "該角色的 3D 部件清單載入失敗。",
      "retry": "重試"
    },
    "viewer": {
      "loadError": "3D 模型載入失敗。",
      "retry": "重試",
      "idle": "請選擇要預覽的服裝。"
    }
  },
  "gachas": {
    "common": {
      "region": "區服",
      "loadError": "卡池資料載入失敗",
      "retry": "重試",
      "dateFallback": "待定"
    },
    "type": {
      "ceil": "井卡池",
      "normal": "普通卡池",
      "beginner": "新手卡池",
      "sunormal": "付費特典卡池",
      "subeginner": "新手特典卡池",
      "return": "迴歸卡池",
      "unknown": "其他"
    },
    "status": {
      "ongoing": "進行中",
      "ended": "已結束"
    },
    "list": {
      "title": "卡池圖鑑",
      "description": "瀏覽 Project Sekai 卡池及出率資訊",
      "searchPlaceholder": "按名稱或 ID 搜尋…",
      "typeLabel": "型別",
      "allTypes": "全部型別",
      "statusLabel": "狀態",
      "allStatuses": "全部狀態",
      "yearLabel": "年份",
      "allYears": "全部年份",
      "cardLabel": "包含卡牌",
      "allCards": "全部卡牌",
      "cardSearchPlaceholder": "搜尋卡牌名或 ID...",
      "cardEmpty": "沒有找到卡牌。",
      "removeCardFilter": "移除該卡牌篩選",
      "sortLabel": "排序",
      "filtersTitle": "篩選",
      "resetFilters": "重置篩選",
      "total": "共 {total} 個卡池",
      "empty": "沒有符合當前篩選條件的卡池"
    },
    "sort": {
      "startDesc": "最新優先",
      "startAsc": "最早優先",
      "idAsc": "ID 升序"
    },
    "detail": {
      "back": "返回卡池一覽",
      "notFound": "未找到卡池 #{gachaId}",
      "pickups": "PICK UP 成員",
      "poolCards": "卡池全部卡牌",
      "rates": "提供機率",
      "rarity": "稀有度",
      "cardCount": "卡牌數",
      "baseRate": "基礎機率",
      "guaranteedRate": "保底機率",
      "guaranteedNote": "十連的第 10 抽保底出現 {rarity} 及以上成員。",
      "behaviors": "招募方式",
      "behaviorType": "型別",
      "spinCount": "抽數",
      "cost": "消耗",
      "executeLimit": "次數限制",
      "colorfulPass": "彩色通行證",
      "ceilItem": "兌換貼紙",
      "summary": "招募說明",
      "description": "注意事項"
    },
    "rarity": {
      "rarity_1": "★1",
      "rarity_2": "★2",
      "rarity_3": "★3",
      "rarity_4": "★4",
      "rarity_birthday": "生日"
    },
    "behaviorType": {
      "normal": "普通招募",
      "over_rarity_3_once": "★3 以上保底一次",
      "over_rarity_4_once": "★4 保底一次",
      "once_a_day": "每日一次",
      "once_a_week": "每週一次"
    },
    "costResource": {
      "jewel": "水晶",
      "paid_jewel": "付費水晶",
      "gacha_ticket": "招募券"
    }
  },
  "playerProfile": {
    "title": "我的檔案",
    "description": "檢視賬號的遊戲檔案",
    "source": {
      "realtime": "即時資料",
      "snapshot": "快照資料"
    },
    "noAccountHint": "請先繫結並選擇一個遊戲賬號以檢視檔案。",
    "loadError": "檔案資料載入失敗。",
    "retry": "重試",
    "refresh": "重新整理",
    "dataAsOf": "資料更新於 {time}",
    "unknownCharacter": "未知角色",
    "stats": {
      "title": "遊玩統計"
    },
    "snapshotNote": "資料來自快照 · {time}",
    "unitAverage": "各團均值",
    "header": {
      "title": "基本資訊",
      "rank": "Lv.{rank}",
      "gameId": "遊戲ID",
      "copy": "複製遊戲ID",
      "copied": "遊戲ID已複製",
      "copyFailed": "複製失敗"
    },
    "deck": {
      "title": "當前卡組",
      "empty": "暫無卡組資料"
    },
    "badge": {
      "level": "Lv.{level}"
    },
    "music": {
      "title": "歌曲通關統計"
    },
    "multiLive": {
      "title": "多人 Live",
      "mvp": "MVP 次數",
      "superStar": "SuperStar 次數"
    },
    "characters": {
      "title": "角色等級",
      "rank": "Rank {rank}",
      "empty": "暫無角色資料"
    },
    "challenge": {
      "title": "挑戰Live",
      "summary": "最高分數：{name} · {score}",
      "empty": "暫無挑戰Live記錄"
    },
    "links": {
      "eventRecords": "活動記錄",
      "characterMissions": "角色任務",
      "challengeDetail": "挑戰資訊"
    },
    "collection": {
      "title": "角色卡牌收集",
      "summary": "已收集 {owned}/{total} · {percent}%",
      "empty": "暫無卡牌資料"
    }
  },
  "training": {
    "layout": {
      "title": "角色養成",
      "description": "檢視遊戲賬號的養成進度",
      "dataAsOf": "資料時間：{time}"
    },
    "tabs": {
      "challenge": "挑戰資訊",
      "power": "加成資訊",
      "area": "區域道具",
      "bonds": "牽絆",
      "leader": "隊長次數",
      "missions": "角色任務"
    },
    "challenge": {
      "title": "挑戰資訊",
      "description": "檢視賬號角色的挑戰等級與最高分",
      "noAccountHint": "繫結並選擇遊戲賬號後檢視挑戰資訊。",
      "loadError": "挑戰資料載入失敗。",
      "retry": "重試",
      "refresh": "重新整理",
      "unknownCharacter": "未知角色",
      "summary": "最高:{name} · {score}",
      "charactersWithData": "已挑戰角色:{count} / {total}",
      "empty": "暫無挑戰演出記錄",
      "sortByCharacter": "按角色",
      "sortByScore": "按分數",
      "scoreLabel": "分數",
      "stageLabel": "挑戰等級",
      "unclaimedLabel": "可領取獎勵",
      "jewel": "水晶 ×{count}",
      "shard": "水晶碎片 ×{count}",
      "allClaimed": "獎勵已全部領取"
    },
    "power": {
      "title": "加成資訊",
      "description": "檢視賬號的各項加成資訊",
      "noAccountHint": "繫結並選擇遊戲賬號後檢視加成資訊。",
      "loadError": "加成資料載入失敗。",
      "retry": "重試",
      "refresh": "重新整理",
      "unknownCharacter": "未知角色",
      "charactersTitle": "角色綜合力加成",
      "unitsTitle": "組合加成",
      "attrsTitle": "屬性加成",
      "rankBonus": "角色等級",
      "areaItemBonus": "區域道具",
      "fixtureBonus": "MYSEKAI 傢俱",
      "gateBonus": "MYSEKAI 大門",
      "units": {
        "light_sound": "Leo/need",
        "idol": "MORE MORE JUMP!",
        "street": "Vivid BAD SQUAD",
        "theme_park": "Wonderlands×Showtime",
        "school_refusal": "25時,在Nightcord。",
        "piapro": "VIRTUAL SINGER"
      },
      "attrs": {
        "cute": "可愛",
        "cool": "帥氣",
        "pure": "純潔",
        "happy": "快樂",
        "mysterious": "神秘"
      }
    },
    "bonds": {
      "title": "牽絆",
      "description": "檢視賬號的角色牽絆資訊",
      "noAccountHint": "繫結並選擇遊戲賬號後檢視牽絆資訊。",
      "loadError": "牽絆資料載入失敗。",
      "retry": "重試",
      "refresh": "重新整理",
      "unknownCharacter": "未知角色",
      "filterLabel": "角色",
      "filterAll": "全部角色",
      "count": "共 {count} 對",
      "level": "牽絆 Lv.{level}",
      "charaRank": "Rank {rank}",
      "needExp": "距下一級還需 {exp} 經驗",
      "maxLevel": "已滿級",
      "notOwned": "尚未解鎖",
      "empty": "暫無牽絆資料",
      "showRewards": "檢視各等級獎勵",
      "rewardsTitle": "各等級獎勵(已達成的置灰)",
      "rewards": {
        "jewel": "水晶 ×{count}",
        "material": "{name} ×{count}",
        "materialFallback": "材料 ×{count}",
        "bondsHonor": "牽絆牌匾 Lv.{level}",
        "bondsHonorWord": "牌匾文字",
        "stamp": "表情貼紙",
        "boostItem": "體力道具 ×{count}",
        "cutInVoice": "牽絆語音",
        "other": "其他獎勵"
      }
    },
    "area": {
      "title": "區域道具",
      "description": "檢視賬號區域道具的等級進度以及升級所需材料",
      "refresh": "重新整理",
      "retry": "重試",
      "loadError": "區域道具資料載入失敗",
      "noAccountHint": "繫結並選擇遊戲賬號後即可檢視區域道具",
      "empty": "當前篩選條件下沒有區域道具",
      "filters": {
        "unit": "團體",
        "attr": "屬性",
        "character": "角色",
        "tree": "樹",
        "flower": "花",
        "all": "全部"
      },
      "level": "Lv.{level}",
      "bonus": "+{bonus}%",
      "maxed": "已達當前可升級的最高等級",
      "notInShop": "商店暫未開放",
      "canUpgrade": "可升級",
      "nextLevel": "下一級",
      "nextBonus": "下級加成",
      "showAll": "全部等級"
    },
    "leader": {
      "title": "隊長次數",
      "description": "檢視賬號角色的隊長次數累計進度",
      "refresh": "重新整理",
      "retry": "重試",
      "loadError": "隊長統計資料載入失敗",
      "noAccountHint": "繫結並選擇遊戲賬號後即可檢視隊長統計",
      "limit": "任務上限 {count}",
      "sortByTotal": "按次數",
      "sortByCharacter": "按角色",
      "normalLabel": "通常",
      "exLevel": "EX Lv.{level}",
      "unknownCharacter": "未知角色"
    },
    "missions": {
      "title": "角色任務",
      "description": "檢視賬號角色任務進度與角色等級預估",
      "refresh": "重新整理",
      "retry": "重試",
      "loadError": "角色任務資料載入失敗",
      "noAccountHint": "繫結並選擇遊戲賬號後即可檢視角色任務",
      "empty": "暫無角色任務資料",
      "character": "角色",
      "unknownCharacter": "角色{id}",
      "rank": "Lv.{rank}",
      "currentExp": "當前經驗",
      "pendingExp": "待領取經驗",
      "projected": "領取後預計",
      "projectedValue": "Lv.{level}（經驗 {exp}）",
      "basicGroup": "基礎任務",
      "achievementGroup": "成就任務",
      "exRound": "EX 第 {round} 輪",
      "types": {
        "play_live": "隊長次數",
        "play_live_ex": "隊長次數(EX)",
        "waiting_room": "休息室次數",
        "waiting_room_ex": "休息室次數(EX)",
        "collect_costume_3d": "服裝",
        "collect_stamp": "表情",
        "read_area_talk": "區域對話",
        "read_card_episode_first": "卡面劇情前篇",
        "read_card_episode_second": "卡面劇情後篇",
        "collect_another_vocal": "Another Vocal",
        "area_item_level_up_character": "單人傢俱升級次數",
        "area_item_level_up_unit": "團傢俱升級次數",
        "area_item_level_up_reality_world": "屬性道具（樹&花）升級次數",
        "collect_member": "卡面",
        "skill_level_up_rare": "技能等級升級次數（★4&生日卡）",
        "skill_level_up_standard": "技能等級升級次數（★1~★3）",
        "master_rank_up_rare": "專精等級升級次數（★4&生日卡）",
        "master_rank_up_standard": "專精等級升級次數（★1~★3）",
        "collect_character_archive_voice": "臺詞",
        "collect_mysekai_fixture": "MySekai傢俱數量",
        "collect_mysekai_canvas": "MySekai畫布數量",
        "read_mysekai_fixture_unique_character_talk": "MySekai對話"
      }
    }
  },
  "searchAlias": {
    "badge": "別名"
  },
  "sekaiRegion": {
    "followAccount": "跟隨當前賬號",
    "labels": {
      "jp": "日服",
      "en": "國際服",
      "tw": "臺服",
      "kr": "韓服",
      "cn": "國服"
    }
  },
  "sekaiUnreleased": {
    "badge": "未上線"
  },
  "navigation": {
    "groups": {
      "recommendAndAbout": "推薦與關於",
      "friendshipRecommendation": "友情推薦",
      "eventRankingTools": "活動衝榜工具",
      "projectSekai": "Project SEKAI工具",
      "accountManagement": "賬號與管理",
      "harukiBot": "HarukiBot相關",
      "sekaiCatalog": "Sekai 圖鑑",
      "sekaiPlayer": "我的遊戲資料"
    },
    "items": {
      "friendGroups": "推薦群聊",
      "friendLinks": "友情連結",
      "sponsors": "贊助者名單",
      "deckRecommend": "組卡推薦",
      "eventPlanner": "活動規劃",
      "rankBorder": "榜線查詢",
      "about": "關於",
      "ptCalculator": "控分計算",
      "uploadData": "資料上傳",
      "botNeoRegistration": "HarukiBot NEO 註冊",
      "musicLibrary": "歌曲一覽",
      "cards": "卡牌一覽",
      "events": "活動圖鑑",
      "cardBox": "我的卡牌",
      "eventRecords": "活動記錄",
      "musicProgress": "打歌進度",
      "gachas": "卡池圖鑑",
      "costumes": "服裝搭配",
      "playerProfile": "我的檔案",
      "training": "角色養成"
    },
    "notFound": {
      "title": "頁面不存在",
      "description": "你訪問的地址不存在或已被移動，請檢查連結是否正確。",
      "backHome": "返回首頁",
      "backPrevious": "返回上一頁"
    }
  },
  "webLayout": {
    "nav": {
      "home": "首頁",
      "harukiBotGroup": "HarukiBot相關",
      "admin": "管理後臺",
      "myTickets": "我的工單",
      "pendingTicketReplies": "{total} 個工單等待你回覆",
      "settings": "設定"
    },
    "footer": {
      "copyright": "Seiunx Network & Haruki Dev Team. 保留所有權利。",
      "privacyPolicy": "隱私政策",
      "termsOfService": "服務條款",
      "legalLinks": "法律條款",
      "unofficialNotice": "Haruki 工具箱與 SEGA / Colorful Palette 不存在隸屬、授權、背書或官方合作關係。",
      "assetCopyright": "相關遊戲資產版權歸 SEGA / Colorful Palette 所有。",
      "appVersion": "應用版本",
      "version": "版本",
      "gitCommit": "Git 提交",
      "buildTime": "構建時間"
    }
  },
  "route": {
    "home": "主頁",
    "notFound": "頁面不存在",
    "settings": "設定",
    "privacy": "隱私政策",
    "tos": "服務條款",
    "about": "關於",
    "friendGroups": "推薦群聊",
    "friendLinks": "友情連結",
    "sponsors": "贊助者名單",
    "deckRecommend": "組卡推薦",
    "rankBorder": "榜線查詢",
    "rankBorderDetail": "榜線詳情",
    "ptCalculator": "活動Pt計算器",
    "clientConfigGenerator": "Client 配置生成器",
    "uploadData": "上傳資料",
    "botNeoRegistration": "HarukiBot NEO 註冊",
    "login": "登入",
    "register": "註冊賬號",
    "resetPassword": "重置密碼",
    "error": "身份錯誤",
    "userSettings": "賬號設定",
    "userIdentitySettings": "使用者身份設定",
    "userIdentityProfileSettings": "使用者資料設定",
    "userIdentityPasswordSettings": "修改密碼",
    "userIdentityMfaSettings": "多因素認證",
    "userIdentitySocialSettings": "社交登入設定",
    "userIdentitySessionSettings": "身份會話管理",
    "gameAccountBindings": "繫結遊戲賬號",
    "harukiBotAuthorization": "HarukiBot資料授權",
    "oauthAuthorizations": "OAuth 授權管理",
    "oauthLogin": "繼續登入授權",
    "oauthConsent": "授權第三方應用",
    "oauthLogout": "登出確認",
    "tickets": {
      "mine": "我的工單",
      "create": "建立工單",
      "detail": "工單詳情"
    },
    "musicLibrary": {
      "list": "曲庫",
      "detail": "歌曲詳情",
      "progress": "打歌進度"
    },
    "cards": {
      "list": "卡牌一覽",
      "detail": "卡牌詳情",
      "box": "我的卡牌"
    },
    "events": {
      "list": "活動圖鑑",
      "detail": "活動詳情",
      "records": "活動記錄"
    },
    "gachas": {
      "list": "卡池圖鑑",
      "detail": "卡池詳情"
    },
    "costumes": {
      "dressup": "服裝搭配"
    },
    "playerProfile": {
      "me": "我的檔案"
    },
    "training": {
      "challenge": "挑戰資訊",
      "power": "加成資訊",
      "area": "區域道具",
      "bonds": "牽絆",
      "leader": "隊長次數",
      "missions": "角色任務"
    },
    "eventPlanner": {
      "planner": "活動規劃"
    },
    "admin": {
      "layout": "管理後臺",
      "dashboard": "儀表盤",
      "users": "使用者管理",
      "userDetail": "使用者詳情",
      "oauthClients": "OAuth客戶端管理",
      "webhooks": "Webhook 管理",
      "logs": "系統日誌",
      "uploadLogs": "上傳日誌",
      "content": "內容運營",
      "sponsors": "贊助者管理",
      "config": "系統配置",
      "gameBindings": "遊戲繫結管理",
      "risk": "風控管理",
      "tickets": "工單管理"
    }
  },
  "musicLibrary": {
    "eventBox": {
      "short": "{name} {count}箱",
      "title": "{name}的第{count}箱活動曲"
    },
    "list": {
      "title": "曲庫",
      "description": "瀏覽 PJSK 曲庫：支援搜尋，並按難度、等級、物量、團體與年份篩選。",
      "filters": {
        "region": "伺服器",
        "search": "搜尋",
        "searchPlaceholder": "按標題或別名搜尋...",
        "title": "篩選",
        "difficulty": "難度",
        "difficultyAll": "全部難度",
        "level": "等級範圍",
        "levelMin": "最低",
        "levelMax": "最高",
        "noteCount": "物量",
        "noteCountMode": {
          "exact": "精確",
          "range": "範圍"
        },
        "noteCountExactPlaceholder": "如 886",
        "noteCountMin": "最少",
        "noteCountMax": "最多",
        "tag": "標籤",
        "character": "角色",
        "characterAll": "全部角色",
        "characterScope": {
          "any": "全部相關",
          "box": "箱曲",
          "vocal": "Vocal",
          "anotherVocal": "Another Vocal"
        },
        "year": "年份",
        "yearAll": "全部年份",
        "sort": "排序方式",
        "sortDirection": {
          "asc": "升序",
          "desc": "降序"
        },
        "reset": "重置篩選"
      },
      "sort": {
        "publishedAt": "釋出時間",
        "level": "難度等級",
        "noteCount": "物量",
        "title": "標題"
      },
      "results": {
        "count": "共 {count} 首",
        "empty": "沒有符合當前篩選條件的歌曲。",
        "aliasSearching": "正在匹配別名..."
      },
      "downloading": "正在下載 Master 資料... {progress}%",
      "loadError": "曲庫資料載入失敗：{message}",
      "unknownDate": "未知"
    },
    "difficulty": {
      "easy": "EASY",
      "normal": "NORMAL",
      "hard": "HARD",
      "expert": "EXPERT",
      "master": "MASTER",
      "append": "APPEND"
    },
    "tags": {
      "vocaloid": "虛擬歌手",
      "light_music_club": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands x Showtime",
      "school_refusal": "25時，Nightcord見。",
      "other": "其他",
      "event_box": "箱曲",
      "world_link": "WL曲"
    },
    "categories": {
      "mv": "3D MV",
      "mv_2d": "2D MV",
      "image": "靜態畫面",
      "original": "原版 MV"
    },
    "vocalTypes": {
      "original_song": "原曲",
      "sekai": "SEKAI 版",
      "virtual_singer": "虛擬歌手版",
      "another_vocal": "Another Vocal",
      "instrumental": "伴奏",
      "april_fool_2022": "2022 愚人節版"
    },
    "detail": {
      "back": "返回曲庫",
      "notFound": "所選伺服器上不存在這首歌曲。",
      "loadError": "曲目資料載入失敗：{message}",
      "unknownCharacter": "未知",
      "aliases": {
        "title": "歌曲別名",
        "showMore": "還有 {count} 個",
        "showLess": "收起"
      },
      "info": {
        "composer": "作曲",
        "lyricist": "作詞",
        "arranger": "編曲",
        "publishedAt": "釋出時間",
        "duration": "時長",
        "bpm": "BPM",
        "id": "ID"
      },
      "difficultiesTitle": "難度資訊",
      "table": {
        "difficulty": "難度",
        "level": "等級",
        "noteCount": "物量"
      },
      "vocalsTitle": "Vocal 版本",
      "vocalsEmpty": "暫無 Vocal 版本。",
      "play": "播放",
      "pause": "暫停",
      "chartPreview": {
        "title": "譜面預覽",
        "modeDynamic": "動態",
        "modeStatic": "靜態",
        "loadError": "譜面載入失敗。",
        "retry": "重試",
        "seek": "播放進度",
        "speed": "流速",
        "zoomFit": "適應高度",
        "zoom": "縮放比例",
        "silent": "未找到音訊資源，將靜默播放。"
      },
      "eventsTitle": "關聯活動"
    }
  },
  "cards": {
    "common": {
      "region": "區服",
      "loadError": "卡牌資料載入失敗",
      "retry": "重試"
    },
    "list": {
      "title": "卡牌一覽",
      "description": "按角色、團體、屬性、稀有度、供給型別瀏覽卡牌",
      "searchPlaceholder": "搜尋卡牌稱號…",
      "sortLabel": "排序",
      "total": "共 {total} 張卡牌",
      "empty": "沒有符合當前篩選條件的卡牌"
    },
    "filter": {
      "title": "篩選",
      "characters": "角色",
      "units": "團體",
      "attrs": "屬性",
      "rarity": "稀有度",
      "supply": "供給型別",
      "year": "年份",
      "yearAll": "全部年份",
      "clear": "清除篩選"
    },
    "sort": {
      "releaseDesc": "最新優先",
      "rarityDesc": "稀有度",
      "idAsc": "卡牌 ID"
    },
    "unit": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "25時，Nightcord見。",
      "piapro": "VIRTUAL SINGER"
    },
    "attr": {
      "cute": "可愛",
      "cool": "帥氣",
      "pure": "純潔",
      "happy": "快樂",
      "mysterious": "神秘"
    },
    "rarity": {
      "rarity_1": "1★",
      "rarity_2": "2★",
      "rarity_3": "3★",
      "rarity_4": "4★",
      "rarity_birthday": "生日"
    },
    "supply": {
      "normal": "普通常駐",
      "birthday": "生日限定",
      "term_limited": "期間限定",
      "colorful_festival_limited": "Colorful Fes 限定",
      "bloom_festival_limited": "Bloom Fes 限定",
      "unit_event_limited": "WL活動限定",
      "collaboration_limited": "聯動限定"
    },
    "detail": {
      "back": "返回圖鑑",
      "notFound": "在當前區服資料中找不到卡牌 #{cardId}",
      "artNormal": "特訓前",
      "artTrained": "特訓後",
      "artLoadFailed": "卡面載入失敗",
      "info": "卡牌資訊",
      "character": "角色",
      "unit": "團體",
      "supportUnit": "支援團體",
      "attr": "屬性",
      "rarity": "稀有度",
      "supply": "供給型別",
      "releaseAt": "上線時間",
      "gachaPhrase": "招募語音",
      "skill": "技能",
      "skillLevel": "等級",
      "skillValue": "數值",
      "skillDuration": "持續時間",
      "skillBeforeTraining": "特訓前",
      "skillAfterTraining": "特訓後",
      "noSkill": "暫無技能資料",
      "relatedEvents": "關聯活動",
      "relatedEventsEmpty": "沒有關聯活動。",
      "relatedGachas": "關聯卡池",
      "relatedGachasEmpty": "沒有關聯卡池。",
      "costumes": "卡牌服裝",
      "costumeDressup": "服裝搭配",
      "costumePreviewHint": "點選服裝縮圖檢視 3D 預覽。",
      "costumeSlot": {
        "body": "服裝",
        "hair": "髮型",
        "head": "頭飾"
      },
      "sameCharacter": "該角色的其他卡牌"
    }
  },
  "events": {
    "common": {
      "dateFallback": "—",
      "idLabel": "ID {id}"
    },
    "type": {
      "marathon": "馬拉松",
      "cheerful_carnival": "歡樂嘉年華",
      "world_bloom": "連線世界",
      "unknown": "未知型別"
    },
    "status": {
      "ongoing": "進行中",
      "ended": "已結束"
    },
    "attr": {
      "cute": "可愛",
      "cool": "帥氣",
      "pure": "純潔",
      "happy": "快樂",
      "mysterious": "神秘"
    },
    "list": {
      "title": "活動圖鑑",
      "description": "瀏覽 Project SEKAI 活動、加成資訊與活動卡片。",
      "regionLabel": "伺服器",
      "searchLabel": "搜尋",
      "searchPlaceholder": "按活動名或 ID 搜尋",
      "typeLabel": "活動型別",
      "attrLabel": "加成屬性",
      "yearLabel": "年份",
      "allTypes": "全部型別",
      "allAttrs": "全部屬性",
      "allYears": "全部年份",
      "filtersTitle": "篩選",
      "resultsCount": "共 {count} 個活動",
      "resetFilters": "重置篩選",
      "loadFailed": "活動資料載入失敗。",
      "retry": "重試",
      "empty": "沒有符合當前篩選條件的活動。"
    },
    "detail": {
      "back": "返回活動圖鑑",
      "loadFailed": "活動資料載入失敗。",
      "retry": "重試",
      "notFound": "當前伺服器上未找到該活動。",
      "timelineTitle": "時間線",
      "timeline": {
        "start": "開始",
        "aggregate": "結算",
        "closed": "關閉"
      },
      "countdownToStart": "距開始",
      "countdownToAggregate": "距結算",
      "countdownValue": "{days}天 {hours}小時 {minutes}分 {seconds}秒",
      "bonusTitle": "活動加成",
      "bonusEmpty": "該活動暫無加成資料。",
      "bonusAttrOnly": "所有{attr}卡片",
      "chaptersTitle": "World Link 章節",
      "chapterLabel": "第 {no} 章",
      "chapterFinale": "終章",
      "cardsTitle": "活動卡片",
      "cardsEmpty": "該活動暫無卡片。",
      "links": {
        "rankBorder": "檢視榜線",
        "deckRecommend": "活動組卡"
      }
    }
  },
  "homeSettings": {
    "title": "Haruki工具箱設定",
    "description": "配置Haruki工具箱伺服器端點、遊戲資源端點、外觀、語言和效能偏好",
    "trigger": "設定",
    "tabs": {
      "preferences": "偏好設定",
      "app": "應用",
      "sekaiData": "Master資料",
      "userData": "使用者資料"
    },
    "resetDialog": {
      "title": "重置偏好設定？",
      "description": "這會將工具箱伺服器端點、遊戲資源端點、外觀、語言、低特效模式和隱私偏好恢復為預設值。",
      "confirm": "確認重置"
    },
    "endpoint": {
      "label": "工具箱伺服器端點",
      "help": "選擇伺服器連線方式，預設使用直連。若在海外連線困難，可嘗試 CDN。",
      "placeholder": "請選擇端點",
      "direct": "直連",
      "cdn": "CDN",
      "unavailable": "當前環境未配置可用端點。",
      "checking": "測速中",
      "unknown": "未測速",
      "failed": "無法連線",
      "latencyMs": "{ms} ms",
      "refreshLatency": "重新測速"
    },
    "assetEndpoint": {
      "label": "遊戲資源端點",
      "help": "用於載入卡牌縮圖等遊戲資源。首次進入網站會自動選擇延遲最低的站點，開啟設定時會重新測速。",
      "placeholder": "請選擇遊戲資源端點",
      "china": "國內加速海外CDN",
      "global": "海外最佳化CDN",
      "chinaCdn": "國內CDN",
      "checking": "測速中",
      "unknown": "未測速",
      "failed": "無法連線",
      "latencyMs": "{ms} ms"
    },
    "theme": {
      "label": "外觀主題",
      "help": "選擇您偏好的介面主題",
      "placeholder": "請選擇主題",
      "light": "淺色",
      "dark": "深色",
      "system": "跟隨系統"
    },
    "locale": {
      "label": "介面語言",
      "help": "語言切換後會立即生效",
      "placeholder": "請選擇語言",
      "zhCN": "简体中文",
      "enUS": "English",
      "zhTW": "繁體中文"
    },
    "visualEffects": {
      "label": "低特效模式",
      "help": "開啟後會關閉毛玻璃、強陰影等較耗效能的視覺效果，適合移動裝置或低功耗場景。"
    },
    "privacy": {
      "hideGameUserIdLabel": "隱藏遊戲 UID",
      "hideGameUserIdHelp": "開啟後，組卡、上傳資料等賬號選擇器會保留 UID 前 2 位和後 4 位，中間用星號隱藏。"
    },
    "unreleased": {
      "showLabel": "展示未上線內容",
      "showHelp": "開啟後，卡牌、活動、曲庫、卡池等圖鑑會顯示當前區服尚未上線的內容。",
      "blurLabel": "未上線內容防劇透模糊",
      "blurHelp": "展示未上線內容時，對其卡面、封面等圖片做模糊處理，避免劇透。"
    },
    "appUpdate": {
      "title": "應用更新",
      "description": "檢查 Haruki 工具箱的版本更新。",
      "current": "已是最新",
      "available": "有新版本",
      "remoteVersion": "遠端版本",
      "remoteCommit": "遠端 Git 提交",
      "remoteBuildTime": "遠端構建時間",
      "checkedAt": "最近檢查：{time}",
      "lastError": "最近一次檢查失敗，請稍後重試。",
      "check": "檢查更新",
      "checking": "檢查中...",
      "update": "更新應用",
      "updating": "更新中..."
    },
    "userData": {
      "description": "管理已綁定遊戲賬號的 suite、mysekai 與 profile 本地資料快取，供站內各項功能共用。suite/mysekai 重新整理會先檢查遠端上傳時間，profile 會直接拉取最新資料。",
      "account": "賬號",
      "accountPlaceholder": "請選擇已繫結賬號",
      "noAccount": "當前賬號還沒有繫結遊戲賬號。",
      "dataType": "資料型別",
      "types": {
        "suite": "Suite",
        "mysekai": "MySekai",
        "profile": "Profile"
      },
      "cacheUpdatedAt": "本地快取",
      "remoteUploadTime": "上傳時間",
      "lastCheck": "最近檢查",
      "never": "無快取",
      "cacheHit": "已是最新",
      "cacheUpdated": "已更新",
      "notChecked": "未檢查",
      "refresh": "重新整理使用者資料",
      "refreshing": "重新整理中...",
      "clear": "清理使用者資料快取",
      "clearDialog": {
        "title": "清理使用者資料快取？",
        "description": "這會清理當前工具箱賬號在本瀏覽器儲存的使用者資料快取，之後需要重新檢查或下載。",
        "confirm": "確認清理"
      },
      "logoutCleanupHint": "退出登入時會自動清理當前工具箱賬號在本瀏覽器儲存的使用者資料快取。",
      "toast": {
        "alreadyCurrent": "使用者資料已是最新",
        "refreshed": "使用者資料已重新整理",
        "refreshFailed": "使用者資料重新整理失敗",
        "cleared": "使用者資料快取已清理",
        "clearFailed": "使用者資料快取清理失敗"
      }
    },
    "toast": {
      "reset": "設定已重置為預設值"
    },
    "sections": {
      "preferences": "外觀、語言、網路與隱私偏好，修改後立即生效。",
      "sekaiData": "管理各區服 Master 資料本地快取與後臺更新任務，供選擇器、推薦和其他功能複用。"
    },
    "groups": {
      "appearance": "外觀",
      "network": "網路",
      "privacy": "隱私與內容"
    }
  },
  "core": {
    "auth": {
      "sessionExpiredTitle": "會話已過期",
      "sessionExpiredDescription": "請重新登入",
      "accountBannedTitle": "賬號已被封禁",
      "permissionDeniedTitle": "許可權不足",
      "loginRequiredTitle": "請先登入",
      "loginRequiredDescription": "該頁面需要登入後訪問",
      "requireAdminDescription": "需要管理員許可權",
      "requireSuperAdminDescription": "需要超級管理員許可權",
      "apiRequestFailedTitle": "API請求失敗",
      "apiRequestFailedDescription": "狀態碼: {status}，資訊: {message}"
    },
    "sync": {
      "successTitle": "同步設定成功",
      "successDescription": "已成功同步當前賬號的雲端設定",
      "failedTitle": "同步設定不可用",
      "failedDescription": "雲端設定同步失敗，請稍後重試。",
      "missingUpdatedDataDescription": "雲端設定返回資料不完整（缺少 updatedData）。",
      "unexpectedStatusDescription": "雲端設定請求返回了異常狀態（{status}）。"
    },
    "suitePrefetch": {
      "progressTitle": "正在獲取賬號資料",
      "progressDescription": "已完成 {completed}/{total} 個繫結賬號",
      "successTitle": "賬號資料獲取完成",
      "successDescription": "已更新 {updated}/{total} 個繫結賬號的抓包資料快取",
      "partialTitle": "部分賬號資料獲取失敗",
      "partialDescription": "{failed}/{total} 個賬號獲取失敗，進入相關頁面時會自動重試。",
      "failedDescription": "獲取繫結賬號資料失敗，進入相關頁面時會自動重試。"
    },
    "unsupportedBrowser": {
      "title": "不受支援的瀏覽器",
      "description": "您正在嘗試使用不受支援的瀏覽器訪問Haruki工具箱",
      "suggestion": "請改用Chrome、Safari、Firefox等瀏覽器再使用Haruki工具箱"
    },
    "pwa": {
      "updateAvailableTitle": "發現新版本",
      "updateAvailableDescription": "新的應用版本已經準備好，可以立即更新。",
      "updateAvailableDescriptionWithVersion": "新版本 {version} 已經準備好，可以立即更新。",
      "updateAction": "更新應用",
      "applyingTitle": "正在更新應用",
      "applyingDescription": "更新完成後頁面會自動重新整理。",
      "currentTitle": "應用已是最新",
      "currentDescription": "當前應用版本已是最新。",
      "checkFailedTitle": "檢查更新失敗",
      "checkFailedDescription": "無法讀取遠端構建資訊，請稍後重試。",
      "offlineReadyTitle": "離線快取已準備好",
      "offlineReadyDescription": "應用外殼已快取，之後可更快開啟。",
      "devTitle": "開發模式",
      "devDescription": "開發模式下不會註冊 PWA 更新流程。"
    }
  },
  "catalog": {
    "region": {
      "label": "伺服器"
    },
    "search": {
      "label": "搜尋",
      "clear": "清除搜尋"
    },
    "filters": {
      "title": "篩選",
      "reset": "重置篩選",
      "clearAll": "清除全部"
    },
    "results": {
      "count": "共 {count} 項",
      "empty": "沒有符合當前篩選條件的內容",
      "emptyHint": "試試放寬篩選條件，或切換伺服器。",
      "loadError": "資料載入失敗",
      "retry": "重試",
      "downloading": "正在下載 Master 資料… {progress}%"
    },
    "sort": {
      "label": "排序",
      "asc": "升序",
      "desc": "降序"
    },
    "view": {
      "label": "檢視",
      "grid": "網格",
      "list": "列表"
    },
    "pagination": {
      "label": "分頁",
      "first": "第一頁",
      "prev": "上一頁",
      "next": "下一頁",
      "last": "最後一頁",
      "page": "第 {page} 頁",
      "pageOf": "{page} / {total}",
      "pageSize": "每頁數量",
      "perPage": "每頁 {size}",
      "jump": "跳轉到頁碼",
      "summary": "共 {total} 項 · 第 {page} / {pages} 頁"
    },
    "status": {
      "upcoming": "即將開始",
      "ongoing": "進行中",
      "ended": "已結束",
      "upcomingHidden": "即將開始的內容已被隱藏。開啟「顯示未上線內容」後即可檢視。",
      "showUnreleased": "顯示未上線內容",
      "endsIn": "剩餘 {time}",
      "startsIn": "{time} 後開始"
    },
    "countdown": {
      "toStart": "距開始",
      "toEnd": "距結束",
      "toAggregate": "距結算",
      "reached": "已到達",
      "days": "{days}天",
      "hours": "{hours}小時",
      "minutes": "{minutes}分",
      "seconds": "{seconds}秒"
    },
    "detail": {
      "backToList": "返回{list}",
      "breadcrumb": "頁面路徑",
      "notFound": "在當前伺服器的資料中找不到該條目。",
      "loadError": "詳情資料載入失敗",
      "assetName": "資源名",
      "period": "期間",
      "viewAllCount": "檢視全部 ({count})",
      "zoom": "點選放大檢視",
      "showMore": "展開",
      "showLess": "收起",
      "tryOtherRegion": "該條目可能存在於其他伺服器，可切換後重試。"
    },
    "lightbox": {
      "description": "圖片預覽",
      "zoomIn": "放大",
      "zoomOut": "縮小",
      "openInNewTab": "新標籤頁開啟",
      "items": "圖片"
    },
    "character": {
      "label": "角色",
      "toggleUnit": "切換 {unit} 全員"
    },
    "unit": {
      "label": "團體"
    },
    "attr": {
      "label": "屬性"
    },
    "rarity": {
      "label": "稀有度"
    },
    "year": {
      "label": "年份",
      "all": "全部年份"
    },
    "type": {
      "label": "類型"
    },
    "statusFilter": {
      "label": "狀態"
    }
  }
} as const
