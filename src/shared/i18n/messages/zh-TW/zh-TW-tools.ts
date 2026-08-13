// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: tools, botNeo
export default {
  "tools": {
    "clientConfigGenerator": {
      "title": "Haruki Client 配置生成器",
      "description": "按新版 Haruki Client 的 configs.yaml 欄位生成本地配置，包含動態路由、控制 API、模組與黑白名單策略。",
      "summary": {
        "modules": "啟用模組",
        "admins": "管理員",
        "scopes": "策略範圍"
      },
      "sections": {
        "identity": {
          "title": "基礎身份",
          "description": "填寫本地監聽埠、Bot ID、登入憑證和可選加密引數。"
        },
        "routing": {
          "title": "網路路由",
          "description": "配置雲端 API 的動態主副節點或固定覆蓋端點。"
        },
        "runtime": {
          "title": "執行策略",
          "description": "控制幫助、國服功能、回覆引用和全域性指令限流。"
        },
        "modules": {
          "title": "模組與功能範圍",
          "description": "按 manifest 的 command_module 控制基礎模組，再按 cloud 當前 client_policy_scope 設定功能級策略。"
        },
        "access": {
          "title": "許可權名單",
          "description": "按 scope 填寫群黑名單、群白名單、使用者黑名單和 Bot 管理員 QQ。"
        }
      },
      "fields": {
        "host": {
          "label": "監聽地址",
          "placeholder": "127.0.0.1"
        },
        "port": {
          "label": "OneBot 埠"
        },
        "controlApiPort": {
          "label": "控制 API 埠"
        },
        "botId": {
          "label": "Bot ID",
          "placeholder": "從註冊流程獲取"
        },
        "credential": {
          "label": "登入憑證",
          "placeholder": "貼上 Haruki Client credential"
        },
        "authEncryptionKey": {
          "label": "認證加密金鑰",
          "placeholder": "可留空，或填 64 位 hex AES-256 key"
        },
        "noiseServerPubkey": {
          "label": "Noise 服務端公鑰",
          "placeholder": "通常由認證響應自動獲取，可留空"
        },
        "controlApiAccessToken": {
          "label": "控制 API 訪問令牌",
          "description": "開啟後控制 API 需要 Bearer Token；關閉時寫入 null。",
          "placeholder": "本機控制介面訪問令牌"
        },
        "serverEndpointOverride": {
          "label": "固定服務端端點",
          "placeholder": "群內如果沒有通知則留空",
          "help": "僅在群內通知要求固定端點時填寫；沒有通知則留空。"
        },
        "routingConfigURL": {
          "label": "動態路由配置 URL",
          "placeholder": "留空使用 client 內建 EdgeOne 預設地址",
          "help": "用於生產/備用節點 failover。固定端點非空時不會生效。"
        },
        "runMode": {
          "label": "執行模式",
          "placeholder": "選擇執行模式"
        },
        "helpContent": {
          "label": "自定義幫助內容",
          "placeholder": "留空使用預設幫助內容"
        },
        "enableGroupCommandLimit": {
          "label": "啟用全域性指令限流",
          "description": "限制所有群合計的每小時/每日成功呼叫次數，0 表示不限制。"
        },
        "globalCommandHourlyLimit": {
          "label": "每小時上限"
        },
        "globalCommandDailyLimit": {
          "label": "每日上限"
        },
        "enableModules": {
          "label": "啟用模組",
          "placeholder": "選擇模組",
          "help": "通過下拉選擇 command_module；all 表示啟用全部模組。card/music/mysekai 等是雲端業務分類，不是這裡的基礎模組名。"
        },
        "featurePolicyModes": {
          "label": "功能級策略模式",
          "placeholder": "選擇功能 scope",
          "help": "只在某個功能需要覆蓋全域性執行模式時新增；沒有單獨策略時保持為空即可。"
        },
        "blacklists": {
          "label": "群黑名單",
          "placeholder": "all: 123456, 789012\nprofile: 345678"
        },
        "whitelists": {
          "label": "群白名單",
          "placeholder": "all: 123456, 789012\nmysekai: 345678"
        },
        "userBlacklists": {
          "label": "使用者黑名單",
          "placeholder": "all: 10001, 10002\nprofile: 10003"
        },
        "botAdmins": {
          "label": "Bot 管理員 QQ",
          "placeholder": "114514\n1919810",
          "help": "管理員可在群內使用 Haruki Client 控制命令。"
        }
      },
      "toggles": {
        "enableHelp": {
          "label": "幫助命令",
          "description": "允許內建幫助響應。"
        },
        "enableCN": {
          "label": "國服功能",
          "description": "啟用 CN 相關功能。"
        },
        "enableReplyMessage": {
          "label": "引用回覆",
          "description": "回覆結果時引用原訊息。"
        },
        "sendBase64Image": {
          "label": "圖片轉 Base64",
          "description": "客戶端下載 Cloud 圖片後以 base64 傳送給 OneBot。"
        },
        "mysekaiBirthdayMonitorNotifyEmpty": {
          "label": "生日空結果通知",
          "description": "烤森生日材料監聽無命中時也傳送通知。"
        },
        "enableParamEcho": {
          "label": "引數錯誤回顯",
          "description": "Cloud 引數解析錯誤時允許回顯具體引數。"
        }
      },
      "actions": {
        "addModule": "新增模組",
        "addFeaturePolicy": "新增策略",
        "addAccessRow": "新增",
        "addBotAdmin": "新增管理員",
        "removeRow": "刪除這一行",
        "copy": "複製 YAML",
        "download": "下載 configs.yaml",
        "reset": "重置"
      },
      "moduleSelector": {
        "allModules": "全部模組",
        "moduleOption": "模組：{value}",
        "placeholder": "選擇模組"
      },
      "policyEditor": {
        "scopeLabel": "功能 scope",
        "scopePlaceholder": "選擇功能",
        "modePlaceholder": "選擇策略",
        "empty": "沒有功能需要單獨策略時，這裡保持為空。"
      },
      "accessEditor": {
        "scopeLabel": "名單 scope",
        "scopePlaceholder": "選擇全域性、模組或功能",
        "globalGroup": "全域性",
        "moduleGroup": "模組",
        "featureGroup": "功能",
        "globalScope": "全域性：all",
        "moduleScope": "模組：{value}",
        "featureScope": "功能：{value}",
        "groupIdLabel": "群號",
        "groupIdPlaceholder": "群號",
        "userIdLabel": "使用者 QQ",
        "userIdPlaceholder": "使用者 QQ",
        "botAdminPlaceholder": "管理員 QQ",
        "blacklistsDescription": "選擇全域性、模組或功能範圍，再新增需要停用的群。",
        "whitelistsDescription": "選擇全域性、模組或功能範圍，再新增允許使用的群。",
        "userBlacklistsDescription": "選擇全域性、模組或功能範圍，再新增需要停用的使用者 QQ。"
      },
      "runMode": {
        "blacklist": "黑名單模式",
        "whitelist": "白名單模式"
      },
      "routingState": {
        "dynamic": "當前使用動態路由",
        "pinned": "當前固定服務端端點",
        "dynamicDescription": "serverEndpointOverride 為空時，client 會讀取 routingConfigURL；routingConfigURL 為空則使用內建 EdgeOne 預設地址。",
        "pinnedDescription": "serverEndpointOverride 非空時，client 會直接使用該端點，不再讀取動態路由配置。"
      },
      "preview": {
        "title": "configs.yaml 預覽",
        "description": "右側內容會隨表單即時更新，可直接複製到 Haruki Client 工作目錄。"
      },
      "prefill": {
        "title": "已從註冊結果帶入",
        "description": "Bot ID 與憑據已自動填入配置表單，ownerId 僅用於確認註冊來源，不會寫入 configs.yaml。",
        "ownerId": "ownerId：{value}",
        "botId": "Bot ID：{value}",
        "credential": "Credential 已填入"
      },
      "notes": {
        "title": "填寫說明",
        "description": "生成器只在瀏覽器本地處理內容，不會提交憑證。",
        "items": {
          "dynamicRouting": "routingConfigURL 是新版 client 的動態路由入口，留空即可走預設生產配置。",
          "accessToken": "controlApiAccessToken 不需要鑑權時保持關閉，YAML 會寫成 null。",
          "listSyntax": "名單可以逐行新增 scope 和群號/QQ，生成器會自動合併為 client 需要的 YAML。"
        }
      },
      "toast": {
        "reset": "已重置為預設配置",
        "copySuccess": "configs.yaml 已複製到剪貼簿",
        "copyFailed": "複製失敗，請檢查瀏覽器剪貼簿許可權",
        "downloadSuccess": "configs.yaml 已開始下載"
      }
    },
    "iosModules": {
      "title": "iOS模組生成器",
      "description": "生成自定義的iOS代理模組",
      "tutorialAlert": {
        "textBefore": "本文教程可以",
        "linkText": "點選這裡",
        "textAfter": "觀看",
        "nonZhWarning": "本教程僅有簡體中文版本"
      },
      "qxScriptWarning": "Quantumult X 不支援指令碼上傳模式",
      "cnRestriction": "由於相關法律法規限制，本站不提供國服的MySekai功能的安裝。",
      "installButton": "快速安裝模組",
      "installHint": "點選後將呼叫對應軟體的安裝協議",
      "copyLabel": {
        "uploadCode": "上傳碼",
        "moduleUrl": "模組URL",
        "scriptUrl": "指令碼URL"
      },
      "steps": {
        "configure": {
          "title": "配置",
          "description": "選擇代理軟體、服務端域名與上傳方式。"
        },
        "scope": {
          "title": "範圍",
          "description": "選擇需要上傳資料的區服和資料型別。"
        },
        "install": {
          "title": "獲取與安裝",
          "description": "生成上傳碼後，可複製 URL 手動安裝或一鍵快速安裝。"
        }
      },
      "sections": {
        "software": {
          "title": "選擇軟體",
          "description": "選擇需要安裝模組的代理工具",
          "placeholder": "請選擇軟體"
        },
        "endpoint": {
          "title": "選擇工具箱域名",
          "description": "選擇要使用的工具箱服務端域名\n預設情況下使用直連即可\n如果你人不在中國大陸使用困難的話，選擇CDN可能有改善",
          "placeholder": "請選擇域名"
        },
        "mode": {
          "title": "選擇上傳資料方式",
          "description": "指令碼上傳可以和其他Bot的模組共存，也不會受到工具箱服務端代理宕機的影響，但是不一定穩定\n如果使用指令碼上傳不穩定，可以切換為重定向代理法",
          "placeholder": "請選擇上傳方式"
        },
        "chunk": {
          "title": "檔案分片大小",
          "description": "分片大小越大，進遊戲速度越快，但是有可能軟體頂不住\n除非你瞭解這個東西是做什麼的，不然不需要更改",
          "unit": "MB"
        },
        "regions": {
          "title": "選擇區服",
          "description": "選擇需要上傳資料的遊戲伺服器（可多選）"
        },
        "dataTypes": {
          "title": "選擇資料型別",
          "description": "選擇需要上傳的資料型別（可多選）"
        }
      },
      "uploadCode": {
        "title": "上傳碼",
        "description": "用於驗證模組和指令碼的訪問許可權",
        "regenerate": "重新生成",
        "generate": "生成上傳碼",
        "loginRequired": "請先登入"
      },
      "generatedUrls": {
        "title": "生成的 URL",
        "description": "可以複製 URL 手動安裝，或點選下方按鈕快速安裝",
        "moduleUrl": "模組 URL",
        "scriptUrl": "指令碼 URL"
      },
      "software": {
        "surge": "Surge",
        "shadowrocket": "Shadowrocket",
        "loon": "Loon",
        "qx": "Quantumult X",
        "stash": "Stash"
      },
      "endpointOptions": {
        "direct": "Direct (直連)",
        "cdn": "CDN (加速)"
      },
      "modeOptions": {
        "proxy": "重定向代理法",
        "script": "指令碼上傳"
      },
      "region": {
        "jp": "日服",
        "en": "國際服",
        "tw": "臺服",
        "kr": "韓服",
        "cn": "國服"
      },
      "dataTypes": {
        "suite": {
          "label": "Suite",
          "description": "上傳你的遊戲賬號的完整資料"
        },
        "mysekai": {
          "label": "MySekai",
          "description": "上傳你的遊戲賬號的MySekai資料"
        },
        "mysekai_force": {
          "label": "MySekai (強制重新整理)",
          "description": "每次進入都強制重新整理MySekai資料"
        },
        "mysekai_birthday_party": {
          "label": "MySekai生日派對",
          "description": "上傳MySekai生日派對雙葉地圖資料"
        }
      },
      "toast": {
        "loginRequired": "請先登入",
        "generateCodeSuccess": "上傳碼生成成功",
        "generateCodeFailedTitle": "生成上傳碼失敗",
        "generateCodeFailedFallback": "未知錯誤",
        "copyEmpty": "複製內容為空",
        "clipboardUnsupported": "當前環境不支援剪貼簿操作",
        "copySuccess": "{label}已複製到剪貼簿",
        "copyFailed": "複製到剪貼簿失敗，請檢查瀏覽器許可權設定",
        "qxScriptFallback": "Quantumult X 不支援指令碼上傳模式，已切換為代理模式",
        "unsupportedClient": "不支援的客戶端",
        "installUnsupported": "當前環境不支援快速安裝"
      }
    },
    "uploadData": {
      "groupNotice1": "Haruki遊樂園QQ 1群: {groupId}",
      "groupNotice2": "Haruki遊樂園QQ 2群: {groupId}",
      "groupTitle": "Haruki遊樂園 QQ 群",
      "group1Label": "1 群",
      "group2Label": "2 群",
      "tutorialNotice": {
        "title": "其他上傳方式",
        "androidProxy": {
          "platform": "Android / Windows",
          "linkText": "HarukiProxy 教程"
        },
        "iosModule": {
          "platform": "iOS / iPadOS",
          "linkText": "使用 iOS 模組"
        }
      },
      "tabs": {
        "file": "檔案上傳",
        "inherit": "繼承碼上傳",
        "ios": "iOS模組"
      },
      "region": {
        "jp": "日服",
        "en": "國際服",
        "tw": "臺服",
        "kr": "韓服",
        "cn": "國服"
      },
      "dataTypes": {
        "suite": "Suite",
        "mysekai": "MySekai"
      },
      "disabledReason": {
        "loginRequired": "請先登入再使用此功能",
        "noBoundAccount": "您還沒有繫結任何賬號，請先繫結賬號"
      },
      "uploadStatus": {
        "uploading": "正在上傳您的{dataType}資料...",
        "success": "上傳成功",
        "failed": "上傳失敗"
      },
      "toast": {
        "selectAccount": "請選擇一個賬號",
        "selectFile": "請選擇一個檔案",
        "operationForbiddenTitle": "提交被禁止",
        "operationForbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "uploadSuccessTitle": "上傳成功",
        "uploadSuccessFileFallback": "檔案已上傳",
        "uploadSuccessInheritFallback": "繼承碼已上傳",
        "uploadFailedTitle": "上傳失敗",
        "uploadFailedFallback": "上傳失敗",
        "inheritIncompleteTitle": "請填寫完整的繼承資訊",
        "inheritIncompleteDescription": "繼承ID和繼承密碼均為必填項",
        "inheritIdInvalidTitle": "繼承ID格式不正確",
        "inheritIdInvalidDescription": "繼承ID應為16位英文字母與數字的組合（區分大小寫）"
      },
      "fileTab": {
        "title": "手動上傳檔案",
        "description": "此選項可以手動上傳你捕獲的資料",
        "unavailableTitle": "無法使用",
        "forbiddenTitle": "操作已被禁止",
        "forbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "fields": {
          "file": "上傳檔案",
          "account": "選擇賬號（區服 / UID）",
          "accountPlaceholder": "請選擇已繫結的賬號",
          "dataType": "選擇資料型別",
          "dataTypePlaceholder": "請選擇資料型別"
        },
        "submit": "提交",
        "submitting": "提交中..."
      },
      "inheritTab": {
        "title": "繼承碼上傳資料",
        "description": "此選項可以提交你的繼承碼到Haruki工具箱後端捕獲你需要的資料",
        "fields": {
          "inheritId": "繼承ID",
          "inheritIdPlaceholder": "請輸入繼承ID",
          "inheritPassword": "繼承密碼",
          "inheritPasswordPlaceholder": "請輸入繼承密碼",
          "server": "選擇區服",
          "serverPlaceholder": "請選擇區服",
          "dataType": "選擇資料型別",
          "dataTypePlaceholder": "請選擇資料型別"
        },
        "alerts": {
          "notesTitle": "使用須知",
          "warning1": {
            "title": "警告",
            "description": "請妥善儲存您的引繼ID與密碼！Haruki工具箱伺服器不會儲存您的引繼ID與密碼！"
          },
          "warning2": {
            "title": "警告",
            "line1": "儘管開發者已經盡最大可能將 API 請求最佳化得儘可能像一個正常 app 請求，使用風險仍然需要自負。",
            "line2": "如果你認為這個風險你負擔不起，請不要使用本功能。"
          },
          "reminder1": {
            "title": "提醒",
            "line1": "僅在您主動勾選後，引繼資訊才會短期儲存在當前瀏覽器本地。",
            "line2": "本地儲存將在 24 小時後自動過期，取消勾選會立即清除已儲存的資訊。"
          },
          "reminder2": {
            "title": "提醒",
            "line1": "使用該功能雖然不需要登入Haruki工具箱賬號",
            "line2": "但是如果你沒有在Haruki工具箱繫結你要獲取資料的遊戲賬號",
            "line3": "即使通知上傳成功，也不會寫入資料庫",
            "line4": "請務必先在Haruki工具箱繫結你要獲取資料的遊戲賬號",
            "bindLink": "繫結遊戲賬號"
          }
        },
        "remember": {
          "label": "在當前裝置短期記住引繼資訊",
          "description": "僅儲存在本地瀏覽器，24 小時後自動過期；取消勾選會立即清除。"
        },
        "submit": "提交",
        "submitting": "提交中..."
      }
    },
    "pointCalculator": {
      "title": "活動 Pt 控分計算器",
      "description": "根據目標活動 Pt 和歌曲基礎 Pt，反推所需活動加成與可打分數區間。",
      "tips": {
        "title": "小提示",
        "beta": "測試中",
        "boostConfig": "控分之前請務必確保您的體力消耗（Live Boost）配置正確，謹防控分失敗。",
        "testingPrefix": "該功能處於測試狀態，",
        "testingSuffix": "如果遇到任何問題請聯絡 Haruki Dev Team 進行反饋。",
        "deckRecommend": "控分結果會有“加成組卡”按鈕，方便快速跳轉組卡。"
      },
      "fields": {
        "region": "資料伺服器",
        "music": "歌曲",
        "loadingMusic": "正在準備歌曲...",
        "musicPlaceholder": "請選擇歌曲",
        "musicSearchPlaceholder": "搜尋歌曲名、#ID、假名、拼音或羅馬音...",
        "musicEmpty": "沒有找到歌曲。",
        "targetPt": "目標活動 Pt",
        "targetPtPlaceholder": "請輸入目標活動 Pt",
        "maxResults": "輸出結果上限",
        "maxResultsPlaceholder": "預設 10",
        "bonusRange": "自定義加成範圍",
        "bonusRangeHelp": "只搜尋該範圍內的活動加成，預設按 100% 到 435% 計算，可填寫 0% 到 1000%。",
        "customBonusFloor": "自定義加成下限",
        "customBonusFloorPlaceholder": "預設 100",
        "customBonusCap": "自定義加成上限",
        "customBonusCapPlaceholder": "預設 435",
        "bonusRangeInvalid": "加成範圍需要是 0 到 1000 之間的整數，且下限不能大於上限。",
        "boostIndex": "體力消耗（Live Boost）",
        "boostIndexAll": "全部檔位",
        "boostIndexOption": "{index} 火（{rate}倍）",
        "advanced": "進階選項"
      },
      "actions": {
        "calculate": "開始計算",
        "buildDeck": "加成組卡"
      },
      "meta": {
        "title": "計算資料",
        "music": "歌曲：{value}",
        "basicPoint": "基礎 Pt：{value}",
        "bonusRange": "加成範圍：{min}% ~ {max}%",
        "missingBasicPoint": "當前歌曲缺少 music metas 基礎 Pt，無法計算。"
      },
      "result": {
        "title": "計算結果",
        "placeholder": "輸入目標活動 Pt 後會在這裡顯示可用方案。",
        "summary": "共找到 {count} 組方案。",
        "empty": "還沒有計算結果。",
        "deckBonus": "所需加成 {value}%",
        "boost": "{index} 火 / {rate}倍",
        "scoreRangeLabel": "可打分數區間",
        "noMatchTitle": "未找到符合條件的方案",
        "noMatchDescription": "請嘗試調整目標 Pt、體力消耗（Live Boost）或自定義加成上限。"
      }
    }
  },
  "botNeo": {
    "title": "HarukiBot NEO 註冊",
    "description": "註冊 HarukiBot NEO 例項並獲取 Bot 憑據",
    "disabled": {
      "title": "註冊暫未開放",
      "description": "HarukiBot NEO 註冊功能當前已關閉，請稍後再試。",
      "retryButton": "重試"
    },
    "input": {
      "warningTitle": "注意",
      "warningDescription": "請使用你本人正在使用的QQ大號（不是接入 HarukiBot NEO 作為 Bot 的QQ號）註冊，否則將會被拒絕進入QQ群聊。",
      "warningGroup": "NEO 分散式QQ群: 111612548",
      "qqLabel": "QQ 號",
      "qqPlaceholder": "請輸入 QQ 號",
      "hint": "驗證碼將傳送至您的 QQ 郵箱（{qq}{'@'}qq.com），有效期 10 分鐘。",
      "sendButton": "傳送驗證碼",
      "cooldownButton": "{seconds} 秒後可重試"
    },
    "verify": {
      "codeSentHint": "驗證碼已傳送至 {qq}{'@'}qq.com，請查收郵箱。",
      "codeLabel": "驗證碼",
      "codePlaceholder": "請輸入 6 位驗證碼",
      "backButton": "返回",
      "registerButton": "註冊",
      "resendButton": "重新發送驗證碼",
      "resendCooldown": "{seconds} 秒後可重新發送"
    },
    "result": {
      "successTitle": "註冊成功",
      "successDescription": "您的 HarukiBot NEO 例項已建立，請儲存以下憑據資訊。",
      "botIdLabel": "Bot ID",
      "credentialLabel": "憑據（JWT）",
      "saveWarning": "憑據僅顯示一次，請立即複製並安全儲存，之後將無法再次獲取。",
      "configGeneratorTitle": "繼續生成 Client 配置",
      "configGeneratorDescription": "開啟配置生成器並自動帶入 ownerId、Bot ID 和 Credential，後續只需補充埠、模組和名單配置。",
      "configGeneratorButton": "開啟配置生成器",
      "registerAnotherButton": "註冊另一個"
    },
    "toast": {
      "statusCheckFailed": "檢查註冊狀態失敗",
      "sendFailedTitle": "傳送失敗",
      "invalidQQNumber": "請輸入有效的 QQ 號",
      "rateLimitedTitle": "請求過於頻繁",
      "rateLimitedDescription": "請求次數過多，請在 {seconds} 秒後重試。",
      "alreadyRegisteredTitle": "已註冊",
      "alreadyRegisteredDescription": "該 QQ 號已有註冊的 Bot。",
      "registrationDisabledTitle": "註冊已關閉",
      "registrationDisabledDescription": "註冊功能當前已關閉。",
      "codeSentTitle": "驗證碼已傳送",
      "codeSentDescription": "請前往 QQ {qq} 的郵箱查收。",
      "registerFailedTitle": "註冊失敗",
      "missingVerificationCode": "請輸入驗證碼",
      "incompleteResponse": "返回資料不完整",
      "registerSuccessTitle": "註冊成功",
      "clipboardUnsupported": "當前環境不支援剪貼簿",
      "copySuccess": "{label} 已複製到剪貼簿",
      "copyFailed": "複製到剪貼簿失敗"
    }
  }
} as const
