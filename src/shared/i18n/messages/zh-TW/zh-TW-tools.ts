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
        "action": "圖文教程",
        "nonZhWarning": "本教程僅有簡體中文版本"
      },
      "qxScriptWarning": "Quantumult X 不支援腳本上傳模式",
      "cnRestriction": "由於相關法律法規限制，本站不提供國服的烤森（MySekai）功能的安裝。",
      "installButton": "快速安裝模組",
      "installHint": "點選後會自動開啟你選的代理軟體並匯入模組",
      "copyAction": "複製{label}",
      "copyLabel": {
        "uploadCode": "上傳碼",
        "moduleUrl": "模組 URL",
        "scriptUrl": "腳本 URL"
      },
      "steps": {
        "configure": {
          "title": "代理軟體與上傳方式",
          "description": "選你裝置上裝的代理軟體，再選資料怎麼上傳。"
        },
        "scope": {
          "title": "上傳範圍",
          "description": "選擇需要上傳資料的區服和資料類型。"
        },
        "code": {
          "title": "上傳碼"
        },
        "install": {
          "title": "安裝模組",
          "prerequisite": "需要先登入並綁定遊戲帳號。",
          "description": "一鍵快速安裝，或複製下面的 URL 到代理軟體裡手動安裝。",
          "after": "安裝後開啟遊戲並進入主頁一次，上傳成功後首頁的帳號欄會顯示上傳時間。"
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
          "description": "「腳本上傳」可與其他 Bot 的模組同時使用，但偶爾不穩定；「代理上傳」更穩定，但同一時間只能裝一個工具箱模組。不確定選「代理上傳」。",
          "placeholder": "請選擇上傳方式"
        },
        "chunk": {
          "title": "檔案分片大小",
          "description": "一般保持預設即可。數值越大進遊戲越快，但部分代理軟體可能上傳失敗。",
          "unit": "MB"
        },
        "notify": {
          "title": "上傳通知",
          "description": "每次上傳後手機彈出通知，告訴你上傳成功還是失敗。裝好後也可以在代理軟體的模組參數裡隨時開關。",
          "descriptionQx": "每次上傳後手機彈出通知，告訴你上傳成功還是失敗。Quantumult X 沒有模組參數，以後想改需要回到這裡改好後重新安裝模組。"
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
        "loginAction": "去登入",
        "regenerateDialog": {
          "title": "重新生成上傳碼？",
          "description": "舊的上傳碼會立即失效，已安裝的模組需要用新 URL 重新安裝才能繼續上傳。",
          "confirm": "重新生成"
        }
      },
      "generatedUrls": {
        "title": "手動安裝",
        "description": "快速安裝打不開代理軟體時，複製下面的 URL 到代理軟體裡新增。",
        "moduleUrl": "模組 URL",
        "scriptUrl": "腳本 URL"
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
        "script": "腳本上傳"
      },
      "modeHints": {
        "proxy": "更穩定，但同一時間只能裝一個工具箱模組。不確定就選這個。",
        "script": "可與其他 Bot 的模組同時使用，但偶爾不穩定。 小火箭（Shadowrocket）請勿使用腳本上傳，推薦選擇代理上傳。"
      },
      "advanced": {
        "title": "進階選項",
        "notifyOn": "上傳通知開",
        "notifyOff": "上傳通知關"
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
        "qxScriptFallback": "Quantumult X 不支援腳本上傳模式，已切換為代理模式",
        "unsupportedClient": "不支援的客戶端",
        "installUnsupported": "當前環境不支援快速安裝",
        "installNeedsIos": "快速安裝需要在 iPhone / iPad 上開啟本頁。電腦上請複製模組 URL，在代理軟體裡手動新增。"
      }
    },
    "uploadData": {
      "groupTitle": "Haruki遊樂園 QQ 群",
      "group1Label": "1 群",
      "group2Label": "2 群",
      "intro": {
        "title": "上傳資料",
        "description": "把遊戲帳號資料同步到工具箱，供卡牌、活動記錄、組卡等功能使用。先選一種適合你裝置的上傳方式。"
      },
      "methods": {
        "label": "選擇上傳方式",
        "tags": {
          "recommended": "推薦",
          "fallback": "備用",
          "advanced": "進階"
        },
        "ios": {
          "name": "iOS 模組",
          "platform": "iPhone / iPad",
          "note": "裝好模組後，進遊戲時自動上傳"
        },
        "proxy": {
          "name": "HarukiProxy",
          "platform": "Android / Windows",
          "note": "執行 HarukiProxy 後，進遊戲時自動上傳"
        },
        "inherit": {
          "name": "引繼碼",
          "platform": "前兩種都用不了時",
          "note": "輸入引繼碼，由工具箱代為讀取資料"
        },
        "file": {
          "name": "檔案上傳",
          "platform": "已有資料檔案時",
          "note": "手動上傳儲存下來的資料檔案"
        }
      },
      "help": {
        "title": "需要幫助？",
        "description": "使用上的問題可以到 QQ 群交流；遇到 Bug 或帳號問題請提交工單。",
        "ticket": "提交工單"
      },
      "proxyTab": {
        "upgradeWarning": {
          "title": "舊版 HarukiProxy（v1/v2）已停止上傳",
          "deadline": "舊版上傳功能已於 2026 年 11 月 1 日 0 點（北京時間）下線，現已無法上傳資料到工具箱。",
          "upgrade": "請更換到 v3 版本。"
        },
        "title": "HarukiProxy（Android / 電腦）",
        "description": "在 Android 手機或電腦上執行 HarukiProxy，進遊戲時資料會自動上傳到工具箱。",
        "guideIndex": "教程索引",
        "stepTitles": {
          "install": "下載並安裝 HarukiProxy v3",
          "bind": "綁定遊戲帳號",
          "connect": "連線 Haruki 工具箱",
          "run": "開始抓包，進一次遊戲"
        },
        "steps": {
          "install": "按你的裝置下載，再照對應的教程安裝。不確定選哪種方式，先看教程索引。",
          "bind": "先在「遊戲帳號管理」綁定並驗證要上傳的遊戲帳號。",
          "connect": "在 HarukiProxy 的設定裡點「連線 Haruki 工具箱」，在開啟的瀏覽器頁面裡登入並授權。",
          "run": "在 HarukiProxy 裡選擇遊戲並開始抓包，然後進入遊戲主頁一次。上傳成功後，首頁的帳號欄會顯示上傳時間。"
        },
        "devices": {
          "android": {
            "name": "Android 手機 / 平板",
            "note": "沒有 Root 可以用光速虛擬機器；免 Root 方式依賴系統自帶的證書，較新的系統可能已經用不了。",
            "download": "下載 APK"
          },
          "windows": {
            "name": "Windows 電腦",
            "note": "x64，配合 MuMu 模擬器或已連線的 Android 裝置使用。",
            "download": "下載 Windows 版"
          },
          "mac": {
            "name": "Mac",
            "note": "Apple 晶片，macOS 12 及以上，配合 MuMu 模擬器 Pro。流程與 Windows 版相同，另有安裝 adb 等三處不同，見「Mac 差異說明」。",
            "download": "下載 macOS 版"
          }
        },
        "guides": {
          "vphone": "光速虛擬機器教程",
          "noRoot": "免 Root 教程",
          "pc": "PC 教程",
          "macNotes": "Mac 差異說明"
        },
        "version": "當前版本：HarukiProxy {version}。",
        "changelog": "檢視更新記錄",
        "limits": "由於不可抗力，HarukiProxy 不能抓取國服的 MySekai 資料。",
        "bindAction": "遊戲帳號管理"
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
        "description": "上傳你用 HarukiProxy 或 iOS 模組儲存下來的資料檔案。一般不需要手動上傳：「iOS 模組」和「HarukiProxy」標籤頁裡的方式會自動上傳。",
        "unavailableTitle": "無法使用",
        "loginRequiredTitle": "需要登入",
        "forbiddenTitle": "操作已被禁止",
        "forbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "fields": {
          "file": "上傳檔案",
          "chooseFile": "選擇檔案",
          "noFile": "未選擇檔案",
          "dropHint": "也可以把檔案直接拖到這裡",
          "dropActive": "鬆開滑鼠即可選中這個檔案",
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
        "steps": {
          "prep": {
            "title": "開始前",
            "description": "先確認這兩件事，可以避免資料沒儲存或帳號丟失。"
          },
          "target": {
            "title": "選擇區服和資料",
            "description": "引繼碼屬於哪個區服，以及這次要上傳哪類資料。"
          },
          "code": {
            "title": "填寫引繼碼",
            "description": "在遊戲的引繼設定裡獲取。分別填寫，或貼上整段引繼資訊，二選一。"
          },
          "newPassword": {
            "title": "新引繼碼的密碼",
            "description": "執行引繼後會簽發一組新引繼碼，用來把帳號恢復到裝置。選它的密碼怎麼定。"
          }
        },
        "submitHint": "這一步只讀取帳號資訊供你核對，不會用掉引繼碼。",
        "paste": {
          "label": "引繼資訊",
          "or": "或",
          "overrides": "已貼上引繼資訊，將以它為準，單獨填寫的引繼 ID 和密碼不會被使用。",
          "placeholder": "在此貼上日服或國際服遊戲內複製的整段引繼資訊（包含引繼 ID 和密碼）",
          "invalid": "未能識別完整的引繼 ID 和密碼。請貼上遊戲內複製的整段文本（保留欄位名稱和換行）"
        },
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
          "reuseBlocked": "引繼密碼需為 8–16 個半形字母或數字，且不含空格",
          "tooLong": "引繼密碼過長"
        },
        "alerts": {
          "notesTitle": "瞭解更多：引繼流程、儲存的內容和風險",
          "warning1": {
            "title": "執行引繼後，原裝置會被登出",
            "description": "之後要用工具箱簽發的新引繼碼把帳號恢復到裝置。你會先看到帳號資訊，確認後才會執行。"
          },
          "flow": {
            "title": "流程",
            "step1": "先只讀取帳號資訊（不會使用引繼碼），請核對暱稱和等級。引繼碼 24 小時內有效，只能使用一次。",
            "step2": "核對無誤後，輸入 Haruki 工具箱登入密碼確認（用 Google、Apple 或通行密鑰登入的帳號改用保險庫 PIN），才會執行引繼。確認前隨時可以取消，引繼碼仍然有效。",
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
        "submitting": "正在讀取帳號資訊…",
        "toast": {
          "readFailedTitle": "無法讀取帳號資訊"
        }
      },
      "inheritJob": {
        "title": "引繼進度",
        "phases": {
          "label": "引繼進度概覽",
          "read": "讀取帳號",
          "confirm": "核對確認",
          "transfer": "執行引繼",
          "data": "儲存資料",
          "status": {
            "pending": "未開始",
            "running": "進行中",
            "done": "已完成",
            "failed": "失敗",
            "stopped": "已中止"
          }
        },
        "summary": "{server} · {dataType}",
        "status": {
          "running": "進行中",
          "awaiting_confirm": "等待確認",
          "succeeded": "已完成",
          "failed": "失敗",
          "cancelled": "已取消",
          "expired": "已過期"
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
          "cookies": "準備連線",
          "version": "獲取遊戲版本",
          "inherit_check": "查詢帳號（不使用引繼碼）",
          "inherit_execute": "執行引繼",
          "auth": "登入",
          "issue_code": "簽發引繼碼",
          "suite": "帳號資料",
          "suite_followup": "同步剩餘資料",
          "home_refresh": "同步主頁資料",
          "home_refresh_final": "完成同步",
          "maintenance_check": "確認遊戲可用",
          "mysekai": "烤森資料",
          "mysekai_followup": "同步剩餘烤森資料",
          "version_refresh": "重新獲取遊戲版本"
        },
        "stepStatus": {
          "pending": "等待中",
          "running": "進行中",
          "done": "完成",
          "failed": "失敗",
          "skipped": "跳過",
          "warning": "部分失敗",
          "unknown": "結果未知"
        },
        "consumesCode": "從這一步起會使用引繼碼",
        "unreached": {
          "show": "還有 {count} 步沒有執行，展開檢視",
          "hide": "收起沒有執行的 {count} 步"
        },
        "announce": {
          "created": "已開始讀取帳號資訊，進度顯示在下方。",
          "awaiting_confirm": "帳號資訊已讀取，請核對並確認。",
          "new_code": "新的引繼碼已簽發，請記下。"
        },
        "resumeFailed": {
          "title": "有一次引繼可能正在進行，但暫時無法連線",
          "description": "{reason}連線恢復後會繼續顯示它的進度；也可以直接重新提交，工具箱會接回正在進行的引繼。",
          "retry": "重試連線"
        },
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
          "game_version_outdated": "遊戲剛更新了資料版本，工具箱還沒同步上，請稍後再試。",
          "game_version_outdated_after_transfer": "遊戲剛更新了資料版本，工具箱還沒同步上，沒能獲取遊戲資料。新引繼碼（如已簽發）顯示在本頁，稍後可以用新引繼碼重新上傳。",
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
          "vault_store_failed": "登入資訊或新引繼碼沒能存入保險庫。請務必現在就記下本頁顯示的新引繼碼。",
          "game_version_outdated": "遊戲剛更新了資料版本，工具箱還沒同步上，所以這一步沒有成功。"
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
            "consumes": "在工具箱執行引繼會用掉 1 次；用完後遊戲不再允許引繼。",
            "endsAt": "限制結束時間：{time}",
            "worldBloom": "World Link 章節進行中",
            "none": "當前沒有引繼限制。"
          },
          "warningTitle": "確認後，你的裝置將無法再登入這個帳號",
          "warningBody": "帳號會轉移到工具箱。隨後本頁會顯示新的引繼碼，請用它在裝置上把帳號引繼回來。",
          "deadline": "請在 {time} 內確認，超時會自動取消（引繼碼仍然有效）。",
          "password": "Haruki 工具箱登入密碼",
          "passwordHelp": "登入本網站時用的密碼，不是遊戲的引繼密碼，也不是 QQ 或 Google 的密碼。",
          "passwordWhy": "用來給儲存的登入資訊上鎖，只有你能開啟。",
          "passwordFirstUse": "用來給儲存的登入資訊上鎖，只有你能開啟。第一次確認時會自動建立你的引繼碼保險庫。",
          "forgotPassword": "忘記密碼？",
          "forgotPasswordNote": "如果忘記密碼並設定了新密碼，保險庫裡已儲存的內容將無法開啟，只能重置保險庫（這些內容會被刪除）。",
          "pin": "保險庫 PIN",
          "pinHint": "你用 Google、Apple 或通行密鑰登入本網站，沒有登入密碼，所以這裡用你之前設定的保險庫 PIN 代替。",
          "pinCreate": "設定保險庫 PIN",
          "pinCreateHint": "你用 Google、Apple 或通行密鑰登入本網站，沒有登入密碼，所以需要單獨設定一個 PIN。",
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
          "description": "請現在就在裝置上用這組引繼碼把帳號引繼回來，或妥善記下。",
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
            "restore": "在裝置上用這組引繼碼把帳號引繼回來。",
            "platformLink": "恢復後，建議在遊戲內的引繼選單裡把帳號綁定到 Game Center（iOS）或 Google Play 遊戲（Android；日服還可以綁定 Apple 或 Google 帳號），以後就不用再依賴引繼碼。",
            "cleanup": "確認恢復後，在下方保險庫點「我已在裝置上恢復」，刪除儲存的記錄。"
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
          "destroy": "我已在裝置上恢復",
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
          "description": "請先確認你已經在裝置上把帳號引繼回來。刪除後，就無法再檢視或重新簽發這個帳號的引繼碼。",
          "confirm": "確認刪除"
        },
        "reset": {
          "title": "重置保險庫？",
          "description": "會刪除保險庫裡的全部記錄（{records}），無法撤銷。只在想不起舊登入密碼（例如忘記密碼後設置過新密碼）或忘記保險庫 PIN 時使用。",
          "records": "{count} 條記錄",
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
      "title": "控分計算",
      "description": "填要拿的活動 Pt，算出每一局用多少加成、幾火、打到多少分。一局打不出來的數會自動拆成幾局。",
      "entry": {
        "label": "要拿多少 Pt",
        "gapTab": "填差值",
        "rangeTab": "填當前和目標",
        "gap": "還差的活動 Pt",
        "gapPlaceholder": "例如 23154",
        "current": "當前活動 Pt",
        "currentPlaceholder": "例如 1234567",
        "target": "目標活動 Pt",
        "targetPlaceholder": "例如 1257721",
        "parsed": "按 {value} 計算",
        "invalid": "請輸入非負整數，可以帶 萬 / w / k 字尾。"
      },
      "song": {
        "label": "歌曲",
        "region": "區服",
        "basicPoint": "基礎 Pt {value}。基礎 Pt 越低，能湊出的數越細。",
        "missingBasicPoint": "這首歌暫時沒有基礎 Pt 資料，請換一首歌。"
      },
      "conditions": {
        "title": "打法條件",
        "summary": "加成 {min}–{max}% · {boosts} · 最多 {games} 局",
        "bonusRange": "卡組加成範圍",
        "bonusRangeHelp": "只用這個範圍內的活動加成來湊，填你的卡組能配出來的範圍。",
        "bonusMin": "加成下限",
        "bonusMax": "加成上限",
        "bonusRangeInvalid": "加成範圍需要是 0 到 {max} 之間的整數，且下限不能大於上限。",
        "worldLink": "World Link 活動",
        "worldLinkHelp": "加成上限放寬到 {max}%。",
        "boosts": "可用體力（火）",
        "boostsHelp": "只用選中的體力檔位；0 火不消耗體力。",
        "boostsNone": "至少選一個體力檔位。",
        "boostsAll": "全部體力檔位",
        "boostsSome": "{list} 火",
        "boostOption": "{index} 火",
        "selectAllBoosts": "全選",
        "maxGames": "最多拆成幾局",
        "maxGamesOption": "{count} 局"
      },
      "actions": {
        "buildDeck": "加成組卡",
        "retry": "重試"
      },
      "result": {
        "empty": "填上要拿的 Pt，這裡會給出打法。",
        "emptyHint": "可以直接填還差多少，也可以填當前和目標 Pt。數字大到一局打不出來也沒關係，會拆成幾局。",
        "gapLabel": "要拿",
        "fromTo": "從 {current} 到 {target}，要拿",
        "singleNote": "一局放置就能打出來，共有 {count} 種單局打法。",
        "singleScoreNote": "一局能打出來，但 {count} 種單局打法都要把分數控制在某個區間；下面優先給出放置就行的分局打法。",
        "splitNote": "一局打不出 {gap} Pt（這些條件下單局能拿 {min}–{max}），已拆成幾局。",
        "plansTitle": "推薦打法",
        "planTitle": "方案 {index}",
        "planTotals": "{games} 局 · {energy} 火 · {decks} 套卡組",
        "needsScore": "需要控制分數",
        "tags": {
          "fewestGames": "局數最少",
          "leastEnergy": "體力最省",
          "singleDeck": "只需一套卡組"
        },
        "step": {
          "times": "×{count}",
          "deck": "加成 {value}%",
          "boost": "{index} 火（{rate} 倍）",
          "idle": "放置即可",
          "idleDetail": "分數低於 {score}",
          "scoreDetail": "打到這個分數區間內停手",
          "each": "每局 +{value}",
          "after": "打完後 {value}"
        },
        "allSingle": "全部單局打法",
        "allSingleHint": "共 {count} 種，越靠前越好打。",
        "showAll": "顯示全部 {count} 種",
        "columns": {
          "bonus": "所需加成",
          "boost": "體力",
          "score": "分數"
        },
        "status": {
          "reached": "已經在目標上了，不用再打。",
          "overshot": "已經超過目標 {gap} Pt。活動 Pt 不會減少，這個目標到不了了。",
          "tooClose": "只差 {gap} Pt，但這些條件下一局最少也會拿 {min} Pt，再打一局就超了。",
          "tooCloseAction": "把加成下限降到 0%",
          "tooFar": "還差 {gap} Pt，超出了 {games} 局放置能湊出的範圍（最多 {reach} Pt）。先正常打歌，打到只差 {reach} Pt 以內再回來算。",
          "tooFarTarget": "也就是先打到 {value} Pt 左右。",
          "tooFarAction": "改成最多 {count} 局",
          "none": "這些條件下湊不出 {gap} Pt。放寬加成範圍、多選幾個體力檔位或增加局數再試。"
        }
      },
      "tips": {
        "boost": "開打前確認體力消耗（Live Boost）和方案裡寫的一致，差一檔 Pt 就不對。",
        "idle": "「放置即可」指整局分數低於 20,000：開局後不打音符，等歌曲結束。",
        "beta": "該功能仍在測試中，控分結果不保證準確；重要的數字請先核對活動加成和遊戲內資料。"
      }
    }
  },
  "botNeo": {
    "title": "HarukiBot NEO 註冊",
    "description": "註冊 HarukiBot NEO 實例並獲取 Bot 憑據",
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
      "successDescription": "您的 HarukiBot NEO 實例已建立，請儲存以下憑據資訊。",
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
      "presetTagLabel": "{tag}（{name}）",
      "tagNames": {
        "shrimp": "蝦",
        "dragon": "龍",
        "pizza": "披薩"
      },
      "keywordPlaceholder": "新增關鍵詞",
      "add": "新增",
      "clear": "清空",
      "removeFilter": "移除過濾詞「{name}」",
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
