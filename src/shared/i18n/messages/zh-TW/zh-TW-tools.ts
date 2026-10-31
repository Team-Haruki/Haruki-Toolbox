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
        "proxyMethod": "HarukiProxy（下載 / 教程）",
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
        "upgradeWarning": {
          "title": "舊版 HarukiProxy 上傳停用提醒",
          "deadline": "舊版 HarukiProxy（v1/v2）自北京時間 2026/11/01 00:00:00（UTC+8）起將無法上傳資料到工具箱。",
          "upgrade": "請務必及時更換到 v3 版本。",
          "release": "本公告發布時的最新版本：HarukiProxy {version}",
          "windowsDownload": "Windows x64 下載（暫無教程）",
          "androidDownload": "Android arm64 下載（有光速虛擬機器教程）",
          "feedback": "v3 版本可能仍然存在一些 bug。如果遇到問題，請及時反饋，以便修復。"
        },
        "title": "HarukiProxy（Android / 電腦）",
        "description": "在 Android 手機或電腦上執行 HarukiProxy，進遊戲時資料會自動上傳到工具箱。",
        "steps": {
          "install": "下載並安裝 v3 版本；Android 使用者可參考下方光速虛擬機器教程。",
          "bind": "先在「遊戲帳號管理」綁定並驗證要上傳的遊戲帳號。",
          "run": "開啟 HarukiProxy 後進入遊戲主頁一次，首頁「我的帳號」會顯示上傳時間。"
        },
        "tutorialButton": "檢視 Android v3 光速虛擬機器教程"
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
        "title": "引繼碼上傳資料",
        "description": "輸入遊戲裡的引繼 ID 和引繼密碼。工具箱會先讀取帳號資訊讓你核對，你確認後才會執行引繼，並馬上為你簽發新的引繼碼。",
        "loginRequired": {
          "title": "請先登入 Haruki 工具箱",
          "description": "引繼碼上傳需要先登入本網站。引繼後，新引繼碼會加密儲存在你的引繼碼保險庫中，只有你本人能檢視。",
          "action": "去登入"
        },
        "fields": {
          "inheritId": "引繼 ID",
          "inheritIdPlaceholder": "請輸入引繼 ID",
          "inheritPassword": "引繼密碼",
          "inheritPasswordPlaceholder": "在遊戲中設定的引繼密碼",
          "server": "選擇區服",
          "serverPlaceholder": "請選擇區服",
          "dataType": "選擇資料類型",
          "dataTypePlaceholder": "請選擇資料類型"
        },
        "prep": {
          "bind": "先在「遊戲帳號管理」綁定這個遊戲帳號，否則即使提示上傳成功，資料也不會儲存。",
          "bindLink": "去綁定",
          "platformLink": "建議先在遊戲內的引繼選單裡把帳號綁定到 Game Center（iOS）或 Google Play 遊戲（Android），日服還可以綁定 Apple 帳號或 Google 帳號。這樣即使引繼碼過期或用掉，帳號也不會丟。",
          "mysekaiQQ": "上傳烤森資料需要先在「HarukiBot 資料授權」綁定並驗證 QQ。",
          "mysekaiQQLink": "去驗證"
        },
        "newPassword": {
          "label": "新引繼碼密碼",
          "reuse": "沿用本次密碼",
          "reuseHint": "新引繼碼使用你剛輸入的密碼，方便記憶。",
          "random": "隨機生成",
          "randomHint": "生成 12 位字母與數字組成的隨機密碼。",
          "reuseBlocked": "這個密碼不能沿用：需為 8–16 個半形字母、數字或符號，且不含空格。請選擇「隨機生成」。",
          "reuseInvalid": "沿用的密碼需為 8–16 個半形字母、數字或符號（不含空格），請改選「隨機生成」",
          "tooLong": "引繼密碼過長"
        },
        "alerts": {
          "notesTitle": "瞭解更多：引繼流程、儲存的內容和風險",
          "warning1": {
            "title": "執行引繼後，原手機會被登出",
            "description": "之後要用工具箱簽發的新引繼碼把帳號恢復到手機。你會先看到帳號資訊，確認後才會執行。"
          },
          "flow": {
            "title": "流程",
            "step1": "先只讀取帳號資訊（不會使用引繼碼），請核對暱稱和等級。日服引繼碼 24 小時內有效，只能使用一次。",
            "step2": "核對無誤後，輸入 Haruki 工具箱登入密碼確認（用 Google、Apple 或通行金鑰登入的帳號改用保險庫 PIN），才會執行引繼。確認前隨時可以取消，引繼碼仍然有效。",
            "step3": "執行後立即簽發新的引繼碼並顯示在本頁，同時加密儲存到下方的引繼碼保險庫，24 小時內可以再次檢視。",
            "step4": "最後獲取並儲存遊戲資料。即使這一步失敗，新引繼碼也會保留。"
          },
          "storage": {
            "title": "我們儲存什麼",
            "text": "你輸入的引繼碼只在本次引繼中使用，不會儲存。引繼後，遊戲帳號的登入資訊（最多 7 天，用於重新簽發引繼碼）和新引繼碼（24 小時）會加密儲存，只有用你的 Haruki 工具箱登入密碼或保險庫 PIN 才能開啟，管理員也看不到。你可以隨時在下方保險庫中刪除。"
          },
          "risk": {
            "title": "風險說明",
            "text": "本功能會用你的引繼碼模擬遊戲客戶端登入。官方理論上可能將其視為異常登入，請自行評估風險；不放心請改用 HarukiProxy 或 iOS 模組。"
          }
        },
        "submit": "讀取帳號資訊",
        "submitting": "正在讀取帳號資訊…"
      },
      "inheritJob": {
        "title": "引繼進度",
        "summary": "{server} · {dataType}",
        "status": {
          "running": "進行中",
          "awaiting_confirm": "等待確認",
          "succeeded": "已完成",
          "failed": "失敗",
          "cancelled": "已取消"
        },
        "connection": {
          "connecting": "正在連線",
          "live": "即時更新",
          "reconnecting": "正在重連",
          "polling": "定時重新整理",
          "closed": "已結束"
        },
        "steps": {
          "bootstrap": "連線遊戲伺服器",
          "preview": "讀取帳號資訊",
          "awaiting_confirm": "等待你確認",
          "execute": "執行引繼",
          "vault_store_credential": "把登入資訊存入保險庫",
          "login": "登入遊戲",
          "issue_new_code": "簽發新引繼碼",
          "vault_store_code": "把新引繼碼存入保險庫",
          "fetch_suite": "獲取帳號資料",
          "fetch_mysekai": "獲取烤森資料",
          "upload": "儲存資料",
          "done": "完成"
        },
        "substeps": {
          "cookies": "獲取訪問憑證",
          "version": "獲取遊戲版本",
          "inherit_check": "查詢帳號（不使用引繼碼）",
          "inherit_execute": "執行引繼",
          "auth": "登入",
          "issue_code": "簽發引繼碼",
          "suite": "帳號資料",
          "suite_followup": "後續請求",
          "home_refresh": "重新整理主頁",
          "home_refresh_final": "最終重新整理",
          "maintenance_check": "檢查維護狀態",
          "mysekai": "烤森資料",
          "mysekai_followup": "後續請求"
        },
        "stepStatus": {
          "pending": "等待中",
          "running": "進行中",
          "done": "完成",
          "failed": "失敗",
          "skipped": "跳過",
          "warning": "部分失敗"
        },
        "consumesCode": "從這一步起會使用引繼碼",
        "codeValidity": {
          "valid": "你輸入的引繼碼沒有被使用，仍然有效。",
          "used": "你輸入的引繼碼已被使用，不能再用。",
          "unknown": "無法確定你輸入的引繼碼是否已被使用。請先不要在其他裝置上使用它，並檢視下方保險庫。"
        },
        "errorTitle": "引繼未完成",
        "issueFailedTitle": "未能簽發新引繼碼",
        "cancelledTitle": "已取消",
        "succeededTitle": "上傳完成",
        "succeededDescription": "帳號資料已儲存。",
        "expired": "這次引繼的進度記錄已過期（只保留 1 小時）。新引繼碼仍可在下方保險庫中檢視。",
        "errors": {
          "inherit_invalid": "引繼碼無效、已使用或已過期。請在遊戲中重新生成引繼碼後再試。",
          "inherit_restricted": "遊戲目前不允許這個帳號引繼。沒有執行引繼，引繼碼仍然有效。",
          "transfer_restricted": "活動期間這個帳號的引繼次數已用完。沒有執行引繼，引繼碼仍然有效。",
          "confirm_timeout": "5 分鐘內沒有確認，已自動取消。沒有執行引繼，引繼碼仍然有效，可以重新提交。",
          "cancelled": "已取消，沒有執行引繼。",
          "game_degraded": "遊戲伺服器暫時不穩定，沒有執行引繼，請稍後再試。",
          "server_busy": "現在使用的人太多，沒有執行引繼，請稍後再試。",
          "game_maintenance": "遊戲伺服器正在維護，請維護結束後再試。",
          "game_unavailable": "暫時無法連線遊戲伺服器，請稍後再試。",
          "game_error": "遊戲伺服器返回了錯誤，請稍後再試。",
          "execute_uncertain": "執行引繼時網路中斷，無法確定引繼碼是否已被使用。請先不要在其他裝置上使用這組引繼碼，並檢視下方保險庫：如果裡面出現了這個帳號，說明引繼已完成，可以在那裡檢視或重新簽發引繼碼。",
          "login_failed": "引繼已完成，登入資訊已存入保險庫，但登入遊戲失敗。請稍後在下方保險庫中點「重新簽發」，獲取新的引繼碼。",
          "fetch_failed": "獲取遊戲資料失敗。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "mysekai_unavailable": "獲取烤森資料失敗，可能還沒有完成烤森教程。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "upload_failed": "資料儲存失敗。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "upload_forbidden": "這個遊戲帳號已被其他 Haruki 工具箱使用者綁定，無法上傳。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "job_interrupted": "伺服器重啟，這次引繼中斷了。",
          "internal_error": "伺服器出了點問題，這次引繼沒有完成。"
        },
        "warnings": {
          "issue_code_failed": "沒能簽發新的引繼碼。登入資訊已存入保險庫，請馬上在下方保險庫中點「重新簽發」：這是你回到帳號的唯一方式。",
          "vault_db_unavailable": "資料庫暫時不可用，登入資訊已臨時儲存，稍後會自動轉存，不影響使用。",
          "vault_store_failed": "登入資訊或新引繼碼沒能存入保險庫。請務必現在就記下本頁顯示的新引繼碼。"
        },
        "actions": {
          "startNew": "開始新的上傳",
          "refresh": "重新整理狀態",
          "goVault": "前往保險庫"
        },
        "ackRequired": "請先確認你已記下新引繼碼",
        "toast": {
          "succeeded": "引繼上傳完成，帳號資料已儲存",
          "cancelled": "已取消，引繼碼沒有被使用",
          "resumedRunning": "你有一個正在進行的引繼，已為你恢復"
        },
        "confirm": {
          "title": "確認要引繼的帳號",
          "description": "請核對帳號資訊。現在還沒有使用你的引繼碼，取消也不會有任何影響。",
          "nickname": "暱稱",
          "rank": "等級",
          "userId": "遊戲 ID",
          "restriction": {
            "title": "活動期間的引繼限制",
            "active": "該帳號正處於活動期間的引繼限制中",
            "remaining": "剩餘可引繼次數：{count}",
            "endsAt": "限制結束時間：{time}",
            "worldBloom": "World Link 章節進行中",
            "none": "當前沒有引繼限制。"
          },
          "warningTitle": "確認後，你的手機將無法再登入這個帳號",
          "warningBody": "帳號會轉移到工具箱。隨後本頁會顯示新的引繼碼，請用它在手機上把帳號引繼回來。",
          "deadline": "請在 {time} 內確認，超時會自動取消（引繼碼仍然有效）。",
          "password": "Haruki 工具箱登入密碼",
          "passwordHelp": "登入本網站時用的密碼，不是遊戲的引繼密碼，也不是 QQ 或 Google 的密碼。",
          "passwordWhy": "用來給儲存的登入資訊上鎖，只有你能開啟。",
          "passwordFirstUse": "用來給儲存的登入資訊上鎖，只有你能開啟。第一次確認時會自動建立你的引繼碼保險庫。",
          "forgotPassword": "忘記密碼？",
          "forgotPasswordNote": "如果忘記密碼並設定了新密碼，保險庫裡已儲存的內容將無法開啟，只能重置保險庫（這些內容會被刪除）。",
          "pin": "保險庫 PIN",
          "pinHint": "你用 Google、Apple 或通行金鑰登入本網站，沒有登入密碼，所以這裡用你之前設定的保險庫 PIN 代替。",
          "pinCreate": "設定保險庫 PIN",
          "pinCreateHint": "你用 Google、Apple 或通行金鑰登入本網站，沒有登入密碼，所以需要單獨設定一個 PIN。",
          "pinCreateWhy": "PIN 用來給儲存的登入資訊上鎖，以後檢視或重新簽發引繼碼時都要輸入。至少 8 個字元。",
          "pinCreateWarning": "PIN 無法找回。忘記後只能重置保險庫，已儲存的內容會被刪除。",
          "pinRepeat": "再輸入一次 PIN",
          "pinMismatch": "兩次輸入的 PIN 不一致，請重新輸入",
          "pinFormat": "PIN 至少 8 個字元，最多 128 個字元",
          "forgotPin": "忘記 PIN？PIN 無法找回，只能重置保險庫（已儲存的內容會被刪除）。",
          "passwordRequired": "請輸入 Haruki 工具箱登入密碼",
          "previousPassword": "修改前的舊登入密碼",
          "previousPasswordRequired": "請輸入修改前的舊登入密碼",
          "submit": "確認並執行引繼",
          "submitting": "正在驗證…",
          "cancel": "取消，不執行引繼",
          "cancelling": "正在取消…"
        },
        "newCode": {
          "title": "你的新引繼碼",
          "description": "請現在就在手機上用這組引繼碼把帳號引繼回來，或妥善記下。",
          "inheritId": "引繼 ID",
          "password": "引繼密碼",
          "copy": "複製{label}",
          "copied": "{label}已複製",
          "copyFailed": "複製失敗，請手動抄寫",
          "expiresIn": "剩餘有效期 {time}",
          "expiresAt": "有效期至 {time}",
          "expired": "這組引繼碼已過期，請在保險庫中重新簽發。",
          "singleUse": "24 小時內有效，只能使用一次。",
          "savedToVault": "已加密儲存到下方保險庫，24 小時內可以再次檢視。",
          "nextSteps": {
            "title": "接下來",
            "restore": "在手機上用這組引繼碼把帳號引繼回來。",
            "platformLink": "恢復後，建議在遊戲內的引繼選單裡把帳號綁定到 Game Center（iOS）或 Google Play 遊戲（Android；日服還可以綁定 Apple 或 Google 帳號），以後就不用再依賴引繼碼。",
            "cleanup": "確認恢復後，在下方保險庫點「我已在手機上恢復」，刪除儲存的記錄。"
          },
          "unsavedTitle": "立即記下這組引繼碼",
          "unsavedBody": "這組引繼碼沒能存入保險庫，離開本頁後就無法再檢視。請現在就抄下來或截圖儲存。",
          "ack": "我已記下",
          "acked": "已確認記下"
        }
      },
      "inheritVault": {
        "title": "引繼碼保險庫",
        "description": "新引繼碼（儲存 24 小時）和用於重新簽發的遊戲登入資訊（儲存 7 天）加密儲存在這裡。檢視時需要驗證身份（{secret}）。",
        "empty": "保險庫裡還沒有記錄。",
        "notInitialized": "你還沒有使用過保險庫，第一次確認引繼時會自動建立。",
        "loadFailed": "無法載入保險庫",
        "refresh": "重新整理",
        "entry": {
          "title": "{server} · {uid}",
          "createdAt": "引繼於 {time}",
          "credential": "登入資訊",
          "code": "引繼碼",
          "expiresIn": "剩餘 {time}",
          "expired": "已過期",
          "noCode": "無可檢視的引繼碼",
          "currentCode": "當前引繼碼",
          "unreadable": "這條記錄在保險庫重置前儲存，已無法開啟。",
          "pending": "暫存中，稍後自動轉存，可正常使用"
        },
        "actions": {
          "reveal": "檢視引繼碼",
          "hide": "隱藏",
          "reissue": "重新簽發",
          "destroy": "我已在手機上恢復",
          "reset": "重置保險庫"
        },
        "reveal": {
          "title": "檢視引繼碼",
          "description": "驗證身份後顯示這條記錄的引繼碼。每次檢視都會向你已驗證的信箱傳送通知。"
        },
        "reissue": {
          "title": "重新簽發引繼碼",
          "description": "工具箱會用儲存的登入資訊登入遊戲，簽發一組新的引繼碼，之前的引繼碼會立即失效。需要幾秒鐘。",
          "modeLabel": "新引繼碼密碼",
          "reuse": "沿用上一個引繼碼的密碼",
          "random": "隨機生成"
        },
        "destroy": {
          "title": "刪除這條記錄？",
          "description": "請先確認你已經在手機上把帳號引繼回來。刪除後，就無法再檢視或重新簽發這個帳號的引繼碼。",
          "confirm": "確認刪除"
        },
        "reset": {
          "title": "重置保險庫？",
          "description": "會刪除保險庫裡全部 {count} 條記錄，無法撤銷。只在想不起舊登入密碼（例如忘記密碼後設置過新密碼）或忘記保險庫 PIN 時使用。",
          "password": "當前的 Haruki 工具箱登入密碼",
          "ack": "我明白全部記錄都會被刪除",
          "confirm": "重置並刪除全部記錄",
          "done": "保險庫已重置，刪除了 {count} 條記錄"
        },
        "passwordChanged": {
          "title": "請輸入修改前的舊登入密碼",
          "description": "你修改過 Haruki 工具箱登入密碼，但保險庫還是用舊密碼上鎖的。輸入一次舊密碼後，保險庫會改用現在的密碼。",
          "forgot": "想不起舊密碼？只能重置保險庫，裡面已儲存的內容會被刪除。",
          "resetAction": "重置保險庫"
        },
        "unlock": {
          "submit": "顯示引繼碼"
        },
        "toast": {
          "destroyed": "記錄已刪除",
          "reissued": "已簽發新的引繼碼"
        }
      },
      "inheritErrors": {
        "invalid_request": "請求格式不正確，請重新整理頁面後重試。",
        "invalid_server": "只支援日服和國際服。",
        "invalid_upload_type": "不支援的資料類型。",
        "inherit_id_invalid": "引繼 ID 格式不正確（應為 16 位字母或數字）。",
        "inherit_password_invalid": "請輸入引繼密碼（最多 64 個字元）。",
        "new_password_mode_invalid": "請選擇新引繼碼密碼的方式。",
        "reuse_password_invalid": "這個密碼不能沿用（需為 8–16 個半形字元、不含空格），請改選「隨機生成」。",
        "mysekai_requires_qq": "上傳烤森（MySekai）資料需要先在「HarukiBot 資料授權」綁定並驗證 QQ。",
        "job_already_running": "你有一個正在進行的引繼，請先完成或取消它。",
        "rate_limited": "提交太頻繁了（每小時最多 10 次），請稍後再試。",
        "server_busy": "現在使用的人太多，請稍後再試。",
        "game_degraded": "遊戲伺服器暫時不穩定，請稍後再試。",
        "vault_unavailable": "引繼碼上傳暫時不可用，請稍後再試。",
        "identity_unavailable": "暫時無法核對你的帳號資訊，請稍後再試。",
        "store_unavailable": "服務暫時不可用，請稍後再試。",
        "job_not_found": "這次引繼的記錄不存在或已過期。",
        "job_not_awaiting_confirm": "這次引繼已不在等待確認（可能已確認、已取消或已超時），請檢視上方的進度。",
        "cannot_cancel": "引繼已經開始執行，無法再取消。",
        "unauthenticated": "登入已失效，請重新登入 Haruki 工具箱。",
        "ws_ticket_invalid": "連線已斷開，正在重新連線…",
        "internal_error": "伺服器出了點問題，請稍後再試。",
        "password_required": "請輸入 Haruki 工具箱登入密碼。",
        "vault_pin_required": "請輸入保險庫 PIN。",
        "vault_pin_invalid_format": "保險庫 PIN 至少 8 個字元，最多 128 個字元。",
        "password_invalid": "登入密碼不正確。請輸入登入本網站時用的密碼，不是遊戲的引繼密碼。",
        "vault_pin_invalid": "保險庫 PIN 不正確，請再試一次。",
        "previous_password_invalid": "舊登入密碼不正確，請再試一次。想不起來的話，只能重置保險庫。",
        "vault_password_changed": "你修改過登入密碼，需要再輸入一次修改前的舊密碼。",
        "vault_not_initialized": "你還沒有使用過保險庫，第一次確認引繼時會自動建立。",
        "unlock_rate_limited": "輸錯次數太多，為了保護你的帳號，請 15 分鐘後再試。",
        "entry_not_found": "這條記錄不存在或已過期。",
        "entry_stale": "這條記錄在保險庫重置前儲存，已無法開啟。",
        "code_not_available": "這條記錄目前沒有可檢視的引繼碼（已超過 24 小時或未簽發），請點「重新簽發」。",
        "no_previous_password": "沒有可沿用的舊引繼密碼，請改選「隨機生成」。",
        "reset_confirmation_required": "請先勾選確認。",
        "reissue_failed": "重新簽發引繼碼失敗，請稍後再試。",
        "reissue_login_failed": "儲存的登入資訊已無法登入遊戲，可能已經失效。",
        "reissue_rejected": "遊戲伺服器拒絕了這次請求，請稍後再試。",
        "client_update_required": "頁面版本過舊，請重新整理頁面。",
        "retryAfter": "請在 {seconds} 秒後重試。",
        "network": "無法連線到伺服器，請檢查網路後重試。",
        "unknown": "請求失敗（HTTP {status}），請稍後再試。"
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
