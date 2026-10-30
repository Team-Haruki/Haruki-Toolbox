// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: tools, botNeo, sekaiStation
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
          "description": "填寫本地監聽埠、Bot ID、登入憑證和可選安全校驗參數。"
        },
        "routing": {
          "title": "網路路由",
          "description": "配置雲端 API 的動態主副節點或固定覆蓋端點。"
        },
        "runtime": {
          "title": "執行策略",
          "description": "控制私聊響應、幫助、國服功能、回覆引用和全域性指令限流。"
        },
        "modules": {
          "title": "模組與功能範圍",
          "description": "按 manifest 的 command_module 控制基礎模組，再按 cloud 當前 client_policy_scope 設定功能級策略。"
        },
        "access": {
          "title": "權限名單",
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
        "noiseServerPubkey": {
          "label": "Noise 服務端公鑰",
          "placeholder": "留空使用 client 內建預設公鑰"
        },
        "noiseServerKeyId": {
          "label": "Noise 公鑰 Key ID",
          "placeholder": "使用內建公鑰時留空"
        },
        "trustRootPubkey": {
          "label": "信任根 Ed25519 公鑰",
          "placeholder": "留空使用 client 內建根公鑰"
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
          "placeholder": "留空使用 client 內建 routing-v3.json 地址",
          "help": "用於生產/備用節點 failover。固定端點非空時不會生效。"
        },
        "enableDynamicRouting": {
          "label": "啟用動態路由",
          "description": "預設開啟；關閉後僅使用 client 內建端點和 keyset 允許的端點。"
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
        "mysekaiBirthdayMonitorMode": {
          "label": "生日材料推送模式",
          "placeholder": "選擇名單模式",
          "help": "只控制生日材料監聽推送，不影響普通指令的執行模式。"
        },
        "mysekaiBirthdayMonitorBlacklist": {
          "label": "生日推送群黑名單",
          "placeholder": "每行或用逗號填寫一個群號"
        },
        "mysekaiBirthdayMonitorWhitelist": {
          "label": "生日推送群白名單",
          "placeholder": "每行或用逗號填寫一個群號"
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
        "enablePrivateMessage": {
          "label": "響應私聊指令",
          "description": "私聊不受群黑白名單限制，但仍受使用者黑名單和限流約束。"
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
          "label": "參數錯誤回顯",
          "description": "Cloud 參數解析錯誤時允許回顯具體參數。"
        },
        "strictConfigPermissions": {
          "label": "嚴格檢查配置權限",
          "description": "若 configs.yaml 可被同組或其他使用者讀取則拒絕啟動；啟用後請設為 0600。"
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
        "builtIn": "當前使用內建端點",
        "dynamicDescription": "client 會讀取 routingConfigURL；留空時使用內建 EdgeOne routing-v3.json 地址。",
        "pinnedDescription": "serverEndpointOverride 非空時，client 會直接使用該端點，不再讀取動態路由配置。",
        "builtInDescription": "動態路由已關閉，client 只使用內建端點和 keyset 允許的端點。"
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
          "dynamicRouting": "新版 client 預設啟用動態路由；routingConfigURL 留空即可使用內建 routing-v3.json。",
          "accessToken": "controlApiAccessToken 不需要鑑權時保持關閉，YAML 會寫成 null。",
          "listSyntax": "名單可以逐行新增 scope 和群號/QQ，生成器會自動合併為 client 需要的 YAML。"
        }
      },
      "toast": {
        "reset": "已重置為預設配置",
        "copySuccess": "configs.yaml 已複製到剪貼簿",
        "copyFailed": "複製失敗，請檢查瀏覽器剪貼簿權限",
        "downloadSuccess": "configs.yaml 已開始下載"
      }
    },
    "iosModules": {
      "title": "iOS 模組（iPhone / iPad）",
      "description": "生成一個代理模組裝進 Shadowrocket、Surge 等代理軟體，之後進遊戲時資料會自動上傳。",
      "tutorialAlert": {
        "label": "圖文教程：",
        "linkText": "點選檢視",
        "nonZhWarning": "本教程僅有簡體中文版本"
      },
      "qxScriptWarning": "Quantumult X 不支援指令碼上傳模式",
      "cnRestriction": "由於相關法律法規限制，本站不提供國服的烤森（MySekai）功能的安裝。",
      "installButton": "快速安裝模組",
      "installHint": "點選後會自動開啟你選的代理軟體並匯入模組",
      "copyAction": "複製{label}",
      "copyLabel": {
        "uploadCode": "上傳碼",
        "moduleUrl": "模組 URL",
        "scriptUrl": "指令碼 URL"
      },
      "steps": {
        "configure": {
          "title": "配置",
          "description": "選擇代理軟體、伺服器線路與上傳方式。"
        },
        "scope": {
          "title": "範圍",
          "description": "選擇需要上傳資料的區服和資料類型。"
        },
        "install": {
          "title": "獲取與安裝",
          "prerequisite": "需要先登入並綁定遊戲帳號。",
          "description": "生成上傳碼後，可複製 URL 手動安裝或一鍵快速安裝。",
          "after": "安裝後開啟遊戲並進入主頁一次，上傳成功後首頁「我的帳號」會顯示上傳時間。"
        }
      },
      "sections": {
        "software": {
          "title": "選擇軟體",
          "description": "選擇需要安裝模組的代理工具",
          "placeholder": "請選擇軟體"
        },
        "endpoint": {
          "title": "伺服器線路",
          "description": "國內直連即可；人在海外可選 CDN。",
          "placeholder": "請選擇線路"
        },
        "mode": {
          "title": "選擇上傳資料方式",
          "description": "「指令碼上傳」可與其他 Bot 的模組同時使用，但偶爾不穩定；「代理上傳」更穩定，但同一時間只能裝一個工具箱模組。不確定選「代理上傳」。",
          "placeholder": "請選擇上傳方式"
        },
        "chunk": {
          "title": "檔案分片大小",
          "description": "一般保持預設即可。數值越大進遊戲越快，但部分代理軟體可能上傳失敗。",
          "unit": "MB"
        },
        "regions": {
          "title": "選擇區服",
          "description": "選擇需要上傳資料的遊戲伺服器（可多選）"
        },
        "dataTypes": {
          "title": "選擇資料類型",
          "description": "選擇需要上傳的資料類型（可多選）"
        }
      },
      "uploadCode": {
        "title": "上傳碼",
        "description": "模組用它來證明是你在上傳；洩露後請重新生成。",
        "regenerate": "重新生成",
        "generate": "生成上傳碼",
        "loginRequired": "請先登入",
        "regenerateDialog": {
          "title": "重新生成上傳碼？",
          "description": "舊的上傳碼會立即失效，已安裝的模組需要用新 URL 重新安裝才能繼續上傳。",
          "confirm": "重新生成"
        }
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
        "proxy": "代理上傳",
        "script": "指令碼上傳"
      },
      "region": {
        "jp": "日服",
        "en": "國際服",
        "tw": "台服",
        "kr": "韓服",
        "cn": "國服"
      },
      "dataTypes": {
        "suite": {
          "label": "帳號資料（Suite）",
          "description": "上傳你的遊戲帳號的完整資料"
        },
        "mysekai": {
          "label": "烤森資料（MySekai）",
          "description": "上傳你的遊戲帳號的烤森資料"
        },
        "mysekai_force": {
          "label": "烤森資料（每次進入都上傳）",
          "description": "不管遊戲裡有沒有變化，每次進入烤森都重新上傳一次。"
        },
        "mysekai_birthday_party": {
          "label": "烤森生日派對",
          "description": "上傳烤森生日派對雙葉地圖資料"
        }
      },
      "toast": {
        "loginRequired": "請先登入",
        "generateCodeSuccess": "上傳碼生成成功",
        "generateCodeFailedTitle": "生成上傳碼失敗",
        "generateCodeFailedFallback": "請先確認已登入，稍後重試。",
        "copyEmpty": "複製內容為空",
        "clipboardUnsupported": "當前環境不支援剪貼簿操作",
        "copySuccess": "{label}已複製到剪貼簿",
        "copyFailed": "複製到剪貼簿失敗，請檢查瀏覽器權限設定",
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
      "intro": {
        "title": "上傳資料",
        "description": "「上傳資料」是把你的遊戲帳號資料同步到工具箱，供卡牌、活動記錄、組卡等功能使用。推薦方式：iPhone/iPad 用「iOS 模組」，Android/Windows 用 HarukiProxy；兩者都不行時再用「引繼碼」。",
        "iosPlatform": "iPhone / iPad",
        "iosMethod": "iOS 模組（推薦）",
        "proxyPlatform": "Android / Windows",
        "proxyMethod": "HarukiProxy 教程",
        "fallbackPlatform": "兩者都不行時",
        "fallbackMethod": "引繼碼（備用）"
      },
      "tabs": {
        "ios": "iOS 模組（iPhone/iPad）",
        "proxy": "HarukiProxy（Android/電腦）",
        "inherit": "引繼碼（備用）",
        "file": "檔案上傳（高階）"
      },
      "proxyTab": {
        "title": "HarukiProxy（Android / 電腦）",
        "description": "在 Android 手機或電腦上執行 HarukiProxy，進遊戲時資料會自動上傳到工具箱。",
        "steps": {
          "install": "按教程在手機或電腦上安裝並配置 HarukiProxy。",
          "bind": "先在「遊戲帳號管理」綁定並驗證要上傳的遊戲帳號。",
          "run": "開啟 HarukiProxy 後進入遊戲主頁一次，首頁「我的帳號」會顯示上傳時間。"
        },
        "tutorialButton": "檢視 HarukiProxy 教程"
      },
      "region": {
        "jp": "日服",
        "en": "國際服",
        "tw": "台服",
        "kr": "韓服",
        "cn": "國服"
      },
      "dataTypes": {
        "suite": "帳號資料（Suite）",
        "mysekai": "烤森資料（MySekai）"
      },
      "disabledReason": {
        "loginRequired": "請先登入再使用此功能",
        "noBoundAccount": "您還沒有綁定任何帳號，請先綁定帳號",
        "noWritableAccount": "還沒有可以上傳的帳號。請先在「遊戲帳號管理」完成帳號驗證；如果是幫別人上傳，需要對方先授權你代傳。"
      },
      "uploadStatus": {
        "uploading": "正在上傳您的{dataType}資料...",
        "success": "上傳成功",
        "failed": "上傳失敗"
      },
      "toast": {
        "selectAccount": "請選擇一個可上傳的帳號",
        "selectFile": "請選擇一個檔案",
        "dataTypeNotWritable": "所選帳號沒有該資料類型的上傳權限",
        "uploadForbiddenTitle": "無權上傳到該帳號",
        "uploadForbiddenDescription": "授權可能已過期、被撤銷或綁定已變更，已重新載入可上傳帳號列表",
        "operationForbiddenTitle": "提交被禁止",
        "operationForbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "uploadSuccessTitle": "上傳成功",
        "uploadSuccessFileFallback": "檔案已上傳",
        "uploadSuccessInheritFallback": "引繼碼已提交，帳號資料已儲存",
        "uploadFailedTitle": "上傳失敗",
        "uploadFailedFallback": "上傳沒有成功，請檢查檔案和帳號後重試；多次失敗請提交工單。",
        "inheritIdRequired": "請輸入引繼 ID",
        "inheritPasswordRequired": "請輸入引繼密碼",
        "inheritIdInvalidDescription": "引繼 ID 應為 16 位英文字母與數字的組合（區分大小寫）"
      },
      "fileTab": {
        "title": "手動上傳檔案",
        "description": "上傳你用 HarukiProxy 或 iOS 模組儲存下來的資料檔案。不知道怎麼獲取檔案？看上方「其他上傳方式」。",
        "unavailableTitle": "無法使用",
        "forbiddenTitle": "操作已被禁止",
        "forbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "fields": {
          "file": "上傳檔案",
          "chooseFile": "選擇檔案",
          "noFile": "未選擇檔案",
          "fileHint": "選擇 HarukiProxy 或 iOS 模組儲存下來的資料檔案，檔案會原樣上傳。",
          "account": "選擇帳號（區服 / UID）",
          "accountPlaceholder": "請選擇可上傳的帳號",
          "dataType": "選擇資料類型",
          "dataTypePlaceholder": "請選擇資料類型"
        },
        "actions": {
          "goLogin": "去登入",
          "goBind": "去綁定帳號"
        },
        "refreshTargets": "重新整理帳號",
        "targetsLoading": "正在載入可上傳帳號...",
        "targetsFailedTitle": "無法獲取可上傳帳號列表",
        "targetsFailedDescription": "已暫時顯示你本人的已驗證帳號；他人授權的帳號需重新整理後才會出現。",
        "accountNotWritable": "這個帳號還不能上傳：帳號未驗證，或對方沒有允許你代傳。",
        "unavailableChip": "不可用",
        "someAccountsUnavailable": "灰色的帳號暫時不能上傳：帳號未驗證，或對方沒有允許你代傳。",
        "grantedTargetNotice": "這是他人授權給你的帳號，上傳會直接更新對方帳號在工具箱中的資料。",
        "dataTypeLimited": "該帳號僅允許上傳部分資料類型。",
        "submit": "提交",
        "submitting": "提交中..."
      },
      "inheritTab": {
        "jpSuspended": {
          "title": "日服引繼碼功能已臨時停用",
          "description": "請立即進入日服遊戲，重新生成新的引繼碼，使之前使用的引繼碼失效，並妥善儲存新引繼碼。暫停期間請勿向工具箱提交新引繼碼。"
        },
        "title": "引繼碼上傳資料",
        "description": "輸入遊戲裡的引繼 ID 和密碼，工具箱會代你登入一次並儲存帳號資料。",
        "fields": {
          "inheritId": "引繼 ID",
          "inheritIdPlaceholder": "請輸入引繼 ID",
          "inheritPassword": "引繼密碼",
          "inheritPasswordPlaceholder": "請輸入引繼密碼",
          "server": "選擇區服",
          "serverPlaceholder": "請選擇區服",
          "dataType": "選擇資料類型",
          "dataTypePlaceholder": "請選擇資料類型"
        },
        "alerts": {
          "notesTitle": "使用須知",
          "warning1": {
            "title": "使用前請了解",
            "description": "請妥善儲存你的引繼 ID 與密碼；工具箱伺服器不會儲存它們。"
          },
          "warning2": {
            "title": "風險說明",
            "text": "本功能會用你的引繼碼模擬遊戲客戶端登入一次。官方理論上可能將其視為異常登入，請自行評估風險；不放心請改用 HarukiProxy 或 iOS 模組。"
          },
          "reminder1": {
            "title": "提醒",
            "line1": "僅在您主動勾選後，引繼資訊才會短期儲存在當前瀏覽器本地。",
            "line2": "本地儲存將在 24 小時後自動過期，取消勾選會立即清除已儲存的資訊。"
          },
          "reminder2": {
            "title": "提醒",
            "text": "使用前請先登入工具箱並在「遊戲帳號管理」綁定要上傳的遊戲帳號。未綁定時，即使提示上傳成功，資料也不會儲存。",
            "bindLink": "去綁定"
          }
        },
        "remember": {
          "label": "在當前裝置短期記住引繼資訊",
          "description": "提交成功後記住 24 小時（僅儲存在當前瀏覽器）；取消勾選會立即清除。"
        },
        "confirmDialog": {
          "title": "確認上傳資料",
          "dataTypePrefix": "請再次確認您要上傳的資料類型：",
          "loginNotice": "你還沒有登入工具箱。未在工具箱綁定遊戲帳號時，即使提示上傳成功，資料也不會儲存；建議先登入並綁定。",
          "mysekaiNotice": "上傳烤森（MySekai）資料需要先登入工具箱，並在「HarukiBot 資料授權」裡綁定並驗證 QQ 號，否則 Bot 無法為你查詢烤森資料。",
          "cancel": "取消",
          "confirm": "確認上傳"
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
        "targetPtInvalid": "目標活動 Pt 需要是大於 0 的整數。",
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
        "missingBasicPoint": "這首歌暫時沒有基礎 Pt 資料，請換一首歌或換個難度。"
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
      "hint": "驗證碼將傳送至您的 QQ 信箱（{qq}{'@'}qq.com），有效期 10 分鐘。",
      "hintQqPlaceholder": "你的QQ號",
      "sendButton": "傳送驗證碼",
      "cooldownButton": "{seconds} 秒後可重試"
    },
    "verify": {
      "codeSentHint": "驗證碼已傳送至 {qq}{'@'}qq.com，請查收信箱。",
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
      "credentialLabel": "憑據",
      "copyAction": "複製{label}",
      "saveWarning": "憑據僅顯示一次，請立即複製並安全儲存，之後將無法再次獲取。",
      "configGeneratorTitle": "繼續生成 Client 配置",
      "configGeneratorDescription": "開啟配置生成器並自動填入 Bot ID 與憑據，後續只需補充埠、模組和名單配置。",
      "configGeneratorButton": "開啟配置生成器",
      "registerAnotherButton": "註冊另一個"
    },
    "toast": {
      "statusCheckFailed": "檢查註冊狀態失敗",
      "statusCheckFailedFallback": "請檢查網路後點選「重試」；多次失敗可能是服務暫時不可用。",
      "sendFailedTitle": "傳送失敗",
      "sendFailedFallback": "驗證碼沒有發出去，請檢查 QQ 號後重試；多次失敗請稍後再試。",
      "missingQQNumber": "請輸入 QQ 號",
      "invalidQQNumber": "請輸入有效的 QQ 號（5–12 位數字）",
      "rateLimitedTitle": "請求過於頻繁",
      "rateLimitedDescription": "請求次數過多，請在 {seconds} 秒後重試。",
      "alreadyRegisteredTitle": "已註冊",
      "alreadyRegisteredDescription": "該 QQ 號已有註冊的 Bot。",
      "registrationDisabledTitle": "註冊已關閉",
      "registrationDisabledDescription": "註冊功能當前已關閉。",
      "codeSentTitle": "驗證碼已傳送",
      "codeSentDescription": "請前往 QQ {qq} 的信箱查收。",
      "registerFailedTitle": "註冊失敗",
      "registerFailedFallback": "註冊沒有完成，請確認驗證碼無誤後重試；驗證碼過期請重新發送。",
      "missingVerificationCode": "請輸入驗證碼",
      "invalidVerificationCode": "驗證碼是 6 位數字，請檢查後重新輸入",
      "incompleteResponse": "返回資料不完整",
      "registerSuccessTitle": "註冊成功",
      "clipboardUnsupported": "當前環境不支援剪貼簿",
      "copySuccess": "{label} 已複製到剪貼簿",
      "copyFailed": "複製到剪貼簿失敗"
    }
  },
  "sekaiStation": {
    "title": "協力車站",
    "description": "即時彙總社交平台上發布的國服協力房間號。",
    "viewOnSekaiStation": "在Sekai Station中檢視",
    "notConfigured": "協力車站暫不可用",
    "connection": {
      "connected": "已連線",
      "connecting": "連線中…",
      "disconnected": "已斷開",
      "failed": "無法連線到伺服器",
      "retryIn": "{n} 秒後重試",
      "retryNow": "立即重試",
      "reconnecting": "正在重新連線…",
      "online": "{n} 人線上"
    },
    "rooms": {
      "list": "房間列表",
      "empty": "暫無房間",
      "emptyFiltered": "當前篩選條件下沒有房間",
      "loading": "載入中…",
      "copyId": "複製房間號",
      "copyText": "複製文本",
      "openOriginal": "開啟原帖",
      "pin": "置頂",
      "unpin": "取消置頂",
      "copied": "已複製",
      "copyFailed": "複製失敗",
      "more": "更多操作",
      "idHint": "點選複製 · 長按 1 秒遮蔽 10 分鐘",
      "block": "遮蔽 10 分鐘",
      "blocked": "已遮蔽 {id}，10 分鐘後恢復",
      "undo": "撤銷"
    },
    "settings": {
      "title": "篩選與顯示",
      "filter": "篩選",
      "mode": "模式",
      "blacklist": "黑名單",
      "blacklistDesc": "隱藏包含以下關鍵詞的房間",
      "whitelist": "白名單",
      "whitelistDesc": "只顯示包含以下關鍵詞的房間",
      "presetTags": "預設標籤",
      "keywordPlaceholder": "新增關鍵詞",
      "add": "新增",
      "clear": "清空",
      "removeFilter": "移除過濾詞“{name}”",
      "display": "顯示",
      "expireTime": "房間顯示時長",
      "durationSeconds": "{n} 秒",
      "durationMinutes": "{n} 分鐘",
      "fontSize": "字號",
      "lineHeight": "行距",
      "decrease": "減小",
      "increase": "增大"
    },
    "blocked": {
      "title": "臨時遮蔽",
      "hint": "10 分鐘後自動恢復",
      "empty": "長按房間號 1 秒即可遮蔽",
      "minutesLeft": "剩 {n} 分鐘",
      "unblock": "取消遮蔽 {id}",
      "unblockOne": "解除",
      "unblockAll": "全部解除"
    }
  }
} as const
