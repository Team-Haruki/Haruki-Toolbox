// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: tools, botNeo, sekaiStation
export default {
  "tools": {
    "clientConfigGenerator": {
      "title": "Haruki Client 配置生成器",
      "lead": "只在瀏覽器本地生成，登入憑證不會上傳",
      "summary": {
        "modules": "啟用模組",
        "admins": "管理員",
        "scopes": "策略範圍",
        "allModules": "全部"
      },
      "sections": {
        "basics": {
          "title": "Bot 與監聽",
          "register": "沒有 Bot ID？去註冊"
        },
        "behaviour": {
          "title": "響應方式"
        },
        "modules": {
          "title": "模組與功能範圍"
        },
        "access": {
          "title": "權限名單"
        },
        "advanced": {
          "title": "進階選項",
          "description": "一般保持預設",
          "changed": "已修改 {count} 項"
        },
        "routing": {
          "title": "網路路由"
        },
        "security": {
          "title": "金鑰與本機安全"
        },
        "rateLimit": {
          "title": "全域性指令限流"
        },
        "birthday": {
          "title": "生日材料推送"
        }
      },
      "fields": {
        "host": {
          "label": "監聽地址",
          "placeholder": "127.0.0.1"
        },
        "port": {
          "label": "OneBot 埠",
          "invalid": "埠應為 1–65535 的整數"
        },
        "controlApiPort": {
          "label": "控制 API 埠",
          "invalid": "埠應為 0–65535 的整數"
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
          "help": "開啟後控制 API 需要 Bearer Token",
          "placeholder": "本機控制介面訪問令牌"
        },
        "serverEndpointOverride": {
          "label": "固定服務端端點",
          "placeholder": "群內如果沒有通知則留空"
        },
        "routingConfigURL": {
          "label": "動態路由配置 URL",
          "placeholder": "留空使用 client 內建 routing-v3.json 地址"
        },
        "enableDynamicRouting": {
          "label": "啟用動態路由",
          "help": "關閉後僅使用內建端點和 keyset 允許的端點"
        },
        "runMode": {
          "label": "執行模式",
          "placeholder": "選擇執行模式",
          "help": "黑名單：群黑名單以外的群都響應。白名單：只響應群白名單裡的群。"
        },
        "helpContent": {
          "label": "自定義幫助內容",
          "placeholder": "留空使用預設幫助內容"
        },
        "enableGroupCommandLimit": {
          "label": "啟用全域性指令限流",
          "help": "按所有群合計的成功呼叫計數，0 表示不限制"
        },
        "globalCommandHourlyLimit": {
          "label": "每小時上限"
        },
        "globalCommandDailyLimit": {
          "label": "每日上限"
        },
        "mysekaiBirthdayMonitorMode": {
          "label": "生日材料推送模式",
          "placeholder": "選擇名單模式"
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
          "label": "啟用模組"
        },
        "featurePolicyModes": {
          "label": "功能級策略模式",
          "hint": "讓個別功能使用和執行模式不同的名單模式"
        },
        "blacklists": {
          "label": "群黑名單"
        },
        "whitelists": {
          "label": "群白名單"
        },
        "userBlacklists": {
          "label": "使用者黑名單"
        },
        "botAdmins": {
          "label": "Bot 管理員 QQ",
          "help": "管理員可在群內使用 Haruki Client 控制命令"
        }
      },
      "toggles": {
        "enableHelp": {
          "label": "幫助命令"
        },
        "enableCN": {
          "label": "國服功能"
        },
        "enablePrivateMessage": {
          "label": "響應私聊指令",
          "description": "私聊不受群黑白名單限制，但仍受使用者黑名單和限流約束"
        },
        "enableReplyMessage": {
          "label": "引用回覆"
        },
        "sendBase64Image": {
          "label": "圖片轉 Base64",
          "description": "客戶端下載 Cloud 圖片後以 base64 傳送給 OneBot"
        },
        "mysekaiBirthdayMonitorNotifyEmpty": {
          "label": "生日空結果通知",
          "description": "烤森生日材料監聽無命中時也傳送通知"
        },
        "enableParamEcho": {
          "label": "參數錯誤回顯",
          "description": "Cloud 參數解析錯誤時允許回顯具體參數"
        },
        "strictConfigPermissions": {
          "label": "嚴格檢查配置權限",
          "help": "configs.yaml 能被同組或其他使用者讀取時拒絕啟動，需設為 0600"
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
        "reset": "重置",
        "viewOutput": "檢視檔案"
      },
      "resetDialog": {
        "title": "重置為預設配置？",
        "description": "已填寫的內容會全部清空，包括登入憑證"
      },
      "moduleSelector": {
        "allModules": "全部模組",
        "moduleOption": "模組：{value}",
        "placeholder": "選擇模組"
      },
      "policyEditor": {
        "scopePlaceholder": "選擇功能",
        "modePlaceholder": "選擇策略"
      },
      "accessEditor": {
        "scopePlaceholder": "選擇全域性、模組或功能",
        "globalGroup": "全域性",
        "moduleGroup": "模組",
        "featureGroup": "功能",
        "globalScope": "全域性：all",
        "moduleScope": "模組：{value}",
        "featureScope": "功能：{value}",
        "groupIdLabel": "群號",
        "userIdLabel": "使用者 QQ",
        "botAdminPlaceholder": "管理員 QQ"
      },
      "runMode": {
        "blacklist": "黑名單模式",
        "whitelist": "白名單模式"
      },
      "routingState": {
        "dynamic": "當前使用動態路由",
        "pinned": "當前固定服務端端點",
        "builtIn": "當前使用內建端點"
      },
      "output": {
        "title": "configs.yaml",
        "codeLabel": "configs.yaml 的內容",
        "missing": {
          "both": "缺少 Bot ID 和登入憑證，暫時無法連線",
          "botId": "缺少 Bot ID，暫時無法連線",
          "credential": "缺少登入憑證，暫時無法連線"
        }
      },
      "prefill": {
        "tag": "已從註冊結果帶入",
        "owner": "註冊 QQ {value}，不寫入 configs.yaml"
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
      "description": "裝進 Shadowrocket、Surge 等代理軟體，進遊戲時自動上傳資料",
      "tutorialAlert": {
        "action": "圖文教程",
        "nonZhWarning": "本教程僅有簡體中文版本"
      },
      "qxScriptWarning": "Quantumult X 不支援腳本上傳模式",
      "cnRestriction": "由於法規限制，本站不提供國服烤森（MySekai）資料上傳",
      "installButton": "快速安裝模組",
      "copyAction": "複製{label}",
      "copyLabel": {
        "uploadCode": "上傳碼",
        "moduleUrl": "模組 URL",
        "scriptUrl": "腳本 URL"
      },
      "steps": {
        "configure": {
          "title": "代理軟體與上傳方式"
        },
        "scope": {
          "title": "上傳範圍"
        },
        "code": {
          "title": "上傳碼"
        },
        "install": {
          "title": "安裝模組",
          "prerequisite": "需要先登入並綁定遊戲帳號",
          "after": "安裝後開啟遊戲並進入主頁一次，成功後首頁的帳號欄會顯示上傳時間"
        }
      },
      "sections": {
        "software": {
          "title": "選擇軟體",
          "placeholder": "請選擇軟體"
        },
        "endpoint": {
          "title": "伺服器線路",
          "description": "人在海外可選 CDN",
          "placeholder": "請選擇線路"
        },
        "mode": {
          "title": "選擇上傳資料方式",
          "placeholder": "請選擇上傳方式"
        },
        "chunk": {
          "title": "檔案分片大小",
          "description": "越大進遊戲越快，但部分代理軟體可能上傳失敗",
          "unit": "MB"
        },
        "notify": {
          "title": "上傳通知",
          "description": "裝好後也可以在代理軟體的模組參數裡開關",
          "descriptionQx": "Quantumult X 沒有模組參數，以後要改需在這裡改好後重新安裝模組"
        },
        "regions": {
          "title": "選擇區服"
        },
        "dataTypes": {
          "title": "選擇資料類型"
        }
      },
      "uploadCode": {
        "title": "上傳碼",
        "description": "洩露後請重新生成",
        "regenerate": "重新生成",
        "generate": "生成上傳碼",
        "loginRequired": "請先登入",
        "loginAction": "去登入",
        "regenerateDialog": {
          "title": "重新生成上傳碼？",
          "description": "舊的上傳碼會立即失效，已安裝的模組需要用新 URL 重新安裝才能繼續上傳",
          "confirm": "重新生成"
        }
      },
      "generatedUrls": {
        "title": "手動安裝",
        "description": "快速安裝打不開代理軟體時，把 URL 複製到代理軟體裡新增",
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
        "proxy": "更穩定，但同時只能裝一個工具箱模組。不確定就選這個。",
        "script": "可與其他 Bot 的模組同時使用，但偶爾不穩定。小火箭（Shadowrocket）請勿使用。"
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
          "label": "帳號資料（Suite）"
        },
        "mysekai": {
          "label": "烤森資料（MySekai）"
        },
        "mysekai_force": {
          "label": "烤森資料（每次進入都上傳）"
        },
        "mysekai_birthday_party": {
          "label": "烤森生日派對"
        }
      },
      "toast": {
        "loginRequired": "請先登入",
        "generateCodeSuccess": "上傳碼生成成功",
        "generateCodeFailedTitle": "生成上傳碼失敗",
        "generateCodeFailedFallback": "請先確認已登入，稍後重試",
        "copyEmpty": "複製內容為空",
        "clipboardUnsupported": "當前環境不支援剪貼簿操作",
        "copySuccess": "{label}已複製到剪貼簿",
        "copyFailed": "複製到剪貼簿失敗，請檢查瀏覽器權限設定",
        "qxScriptFallback": "Quantumult X 不支援腳本上傳模式，已切換為代理模式",
        "unsupportedClient": "不支援的客戶端",
        "installUnsupported": "當前環境不支援快速安裝",
        "installNeedsIos": "快速安裝需要在 iPhone / iPad 上開啟本頁；電腦上請複製模組 URL 手動新增"
      }
    },
    "uploadData": {
      "groupTitle": "Haruki遊樂園 QQ 群",
      "group1Label": "1 群",
      "group2Label": "2 群",
      "intro": {
        "title": "上傳資料",
        "description": "把遊戲帳號資料同步到工具箱，供卡牌、活動記錄、組卡等功能使用"
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
          "platform": "iPhone / iPad"
        },
        "proxy": {
          "name": "HarukiProxy",
          "platform": "Android / Windows"
        },
        "inherit": {
          "name": "引繼碼",
          "platform": "前兩種都用不了時"
        },
        "file": {
          "name": "檔案上傳",
          "platform": "已有資料檔案時"
        }
      },
      "help": {
        "title": "需要幫助？",
        "description": "使用問題到 QQ 群交流；Bug 或帳號問題請提交工單",
        "ticket": "提交工單"
      },
      "proxyTab": {
        "upgradeWarning": {
          "title": "舊版 HarukiProxy（v1/v2）已停止上傳",
          "deadline": "2026 年 11 月 1 日 0 點（北京時間）起已無法上傳。",
          "upgrade": "請更換到 v3 版本。"
        },
        "title": "HarukiProxy（Android / 電腦）",
        "description": "進遊戲時資料自動上傳到工具箱",
        "guideIndex": "教程索引",
        "stepTitles": {
          "install": "下載並安裝 HarukiProxy v3",
          "bind": "綁定遊戲帳號",
          "connect": "連線 Haruki 工具箱",
          "run": "開始抓包，進一次遊戲"
        },
        "steps": {
          "install": "按裝置下載，照對應的教程安裝",
          "bind": "帳號需要完成驗證",
          "connect": "在 HarukiProxy 設定裡點「連線 Haruki 工具箱」，在開啟的頁面裡登入並授權",
          "run": "在 HarukiProxy 裡選擇遊戲並開始抓包，再進入遊戲主頁一次。成功後首頁的帳號欄會顯示上傳時間。"
        },
        "devices": {
          "android": {
            "name": "Android 手機 / 平板",
            "note": "無 Root 用光速虛擬機器；免 Root 方式在較新的系統上可能已不可用",
            "download": "下載 APK"
          },
          "windows": {
            "name": "Windows 電腦",
            "note": "x64，配合 MuMu 模擬器或已連線的 Android 裝置",
            "download": "下載 Windows 版"
          },
          "mac": {
            "name": "Mac",
            "note": "Apple 晶片，macOS 12 及以上，配合 MuMu 模擬器 Pro",
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
        "limits": "HarukiProxy 不能抓取國服的 MySekai 資料",
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
        "noWritableAccount": "還沒有可以上傳的帳號：請先在「遊戲帳號管理」完成驗證，或請對方授權你代傳"
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
        "uploadForbiddenDescription": "授權可能已失效，已重新載入可上傳帳號列表",
        "operationForbiddenTitle": "提交被禁止",
        "operationForbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "uploadSuccessTitle": "上傳成功",
        "uploadFailedTitle": "上傳失敗",
        "uploadFailedFallback": "請檢查檔案和帳號後重試；多次失敗請提交工單",
        "inheritIdRequired": "請輸入引繼 ID",
        "inheritPasswordRequired": "請輸入引繼密碼",
        "inheritIdInvalidDescription": "引繼 ID 應為 16 位英文字母與數字的組合（區分大小寫）"
      },
      "fileTab": {
        "title": "手動上傳檔案",
        "description": "上傳 HarukiProxy 或 iOS 模組儲存的資料檔案，平時它們會自動上傳",
        "unavailableTitle": "無法使用",
        "loginRequiredTitle": "需要登入",
        "forbiddenTitle": "操作已被禁止",
        "forbiddenDescription": "由於相關法律法規限制，不允許進行此操作",
        "fields": {
          "file": "上傳檔案",
          "chooseFile": "選擇檔案",
          "noFile": "未選擇檔案",
          "dropActive": "鬆開滑鼠即可選中這個檔案",
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
        "targetsFailedDescription": "先顯示你本人的已驗證帳號；他人授權的帳號重新整理後才會出現",
        "accountNotWritable": "這個帳號還不能上傳：帳號未驗證，或對方沒有允許你代傳",
        "unavailableChip": "不可用",
        "someAccountsUnavailable": "灰色帳號未驗證，或對方沒有允許你代傳",
        "grantedTargetNotice": "這是他人授權給你的帳號，上傳會直接更新對方在工具箱中的資料",
        "dataTypeLimited": "該帳號僅允許上傳部分資料類型",
        "submit": "提交",
        "submitting": "提交中..."
      },
      "inheritTab": {
        "title": "引繼碼上傳資料",
        "steps": {
          "prep": {
            "title": "開始前"
          },
          "target": {
            "title": "選擇區服和資料"
          },
          "code": {
            "title": "填寫引繼碼",
            "description": "在遊戲的引繼設定裡獲取"
          },
          "newPassword": {
            "title": "新引繼碼的密碼"
          }
        },
        "submitHint": "只讀取帳號資訊，不會用掉引繼碼",
        "paste": {
          "label": "引繼資訊",
          "or": "或",
          "overrides": "以貼上的引繼資訊為準，單獨填寫的引繼 ID 和密碼不會被使用",
          "placeholder": "貼上遊戲內複製的整段引繼資訊（日服或國際服）",
          "invalid": "未能識別完整的引繼 ID 和密碼。請貼上遊戲內複製的整段文本（保留欄位名稱和換行）。"
        },
        "loginRequired": {
          "title": "請先登入 Haruki 工具箱",
          "description": "引繼碼上傳需要先登入本網站",
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
          "bind": "先在「遊戲帳號管理」綁定這個帳號，否則即使提示成功，資料也不會儲存。",
          "bindLink": "去綁定",
          "platformLink": "建議先在遊戲內綁定 Game Center（iOS）或 Google Play 遊戲（Android；日服也可綁 Apple / Google 帳號），引繼碼過期或用掉時帳號也不會丟",
          "mysekaiQQ": "上傳烤森資料需先在「HarukiBot 資料授權」驗證 QQ。",
          "mysekaiQQLink": "去驗證"
        },
        "newPassword": {
          "label": "新引繼碼密碼",
          "reuse": "沿用本次密碼",
          "random": "隨機生成",
          "randomHint": "12 位字母與數字組成的隨機密碼",
          "reuseBlocked": "引繼密碼需為 8–16 個半形字母或數字，且不含空格",
          "tooLong": "引繼密碼過長"
        },
        "alerts": {
          "notesTitle": "瞭解更多：引繼流程、儲存的內容和風險",
          "warning1": {
            "title": "執行引繼後，原裝置會被登出",
            "description": "之後用工具箱簽發的新引繼碼把帳號恢復到裝置"
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
          "created": "已開始讀取帳號資訊，進度顯示在下方",
          "awaiting_confirm": "帳號資訊已讀取，請核對並確認",
          "new_code": "新的引繼碼已簽發，請記下"
        },
        "resumeFailed": {
          "title": "有一次引繼可能正在進行，但暫時無法連線",
          "description": "{reason}連線恢復後會繼續顯示它的進度；也可以直接重新提交，工具箱會接回正在進行的引繼",
          "retry": "重試連線"
        },
        "codeValidity": {
          "valid": "你輸入的引繼碼沒有被使用，仍然有效",
          "used": "你輸入的引繼碼已被使用，不能再用",
          "unknown": "無法確定你輸入的引繼碼是否已被使用。請先不要在其他裝置上使用它，並檢視下方保險庫。"
        },
        "errorTitle": "引繼未完成",
        "issueFailedTitle": "未能簽發新引繼碼",
        "cancelledTitle": "已取消",
        "succeededTitle": "上傳完成",
        "succeededDescription": "帳號資料已儲存",
        "expired": "這次引繼的進度記錄已過期（只保留 1 小時）。新引繼碼仍可在下方保險庫中檢視。",
        "errors": {
          "inherit_invalid": "引繼碼無效、已使用或已過期。請在遊戲中重新生成引繼碼後再試。",
          "inherit_restricted": "遊戲目前不允許這個帳號引繼。沒有執行引繼，引繼碼仍然有效。",
          "transfer_restricted": "活動期間這個帳號的引繼次數已用完。沒有執行引繼，引繼碼仍然有效。",
          "confirm_timeout": "5 分鐘內沒有確認，已自動取消。沒有執行引繼，引繼碼仍然有效，可以重新提交。",
          "cancelled": "已取消，沒有執行引繼",
          "game_degraded": "遊戲伺服器暫時不穩定，沒有執行引繼，請稍後再試",
          "server_busy": "現在使用的人太多，沒有執行引繼，請稍後再試",
          "game_maintenance": "遊戲伺服器正在維護，請維護結束後再試",
          "game_unavailable": "暫時無法連線遊戲伺服器，請稍後再試",
          "game_error": "遊戲伺服器返回了錯誤，請稍後再試",
          "game_version_outdated": "遊戲剛更新了資料版本，工具箱還沒同步上，請稍後再試",
          "game_version_outdated_after_transfer": "遊戲剛更新了資料版本，工具箱還沒同步上，沒能獲取遊戲資料。新引繼碼（如已簽發）顯示在本頁，稍後可以用新引繼碼重新上傳。",
          "execute_uncertain": "執行引繼時網路中斷，無法確定引繼碼是否已被使用。請先不要在其他裝置上使用這組引繼碼，並檢視下方保險庫：如果裡面出現了這個帳號，說明引繼已完成，可以在那裡檢視或重新簽發引繼碼。",
          "login_failed": "引繼已完成，登入資訊已存入保險庫，但登入遊戲失敗。請稍後在下方保險庫中點「重新簽發」，獲取新的引繼碼。",
          "fetch_failed": "獲取遊戲資料失敗。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "mysekai_unavailable": "獲取烤森資料失敗，可能還沒有完成烤森教程。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "upload_failed": "資料儲存失敗。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "upload_forbidden": "這個遊戲帳號已被其他 Haruki 工具箱使用者綁定，無法上傳。新引繼碼（如已簽發）顯示在本頁，並已儲存在保險庫中。",
          "job_interrupted": "伺服器重啟，這次引繼中斷了",
          "internal_error": "伺服器出了點問題，這次引繼沒有完成"
        },
        "warnings": {
          "issue_code_failed": "沒能簽發新的引繼碼。登入資訊已存入保險庫，請馬上在下方保險庫中點「重新簽發」：這是你回到帳號的唯一方式。",
          "vault_db_unavailable": "資料庫暫時不可用，登入資訊已臨時儲存，稍後會自動轉存，不影響使用",
          "vault_store_failed": "登入資訊或新引繼碼沒能存入保險庫。請務必現在就記下本頁顯示的新引繼碼。",
          "game_version_outdated": "遊戲剛更新了資料版本，工具箱還沒同步上，所以這一步沒有成功"
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
          "description": "引繼碼尚未使用，現在取消不會有任何影響",
          "nickname": "暱稱",
          "rank": "等級",
          "userId": "遊戲 ID",
          "restriction": {
            "title": "活動期間的引繼限制",
            "active": "該帳號正處於活動期間的引繼限制中",
            "remaining": "剩餘可引繼次數：{count}",
            "consumes": "在工具箱執行引繼會用掉 1 次；用完後遊戲不再允許引繼",
            "endsAt": "限制結束時間：{time}",
            "worldBloom": "World Link 章節進行中",
            "none": "當前沒有引繼限制"
          },
          "warningTitle": "確認後，你的裝置將無法再登入這個帳號",
          "warningBody": "隨後本頁會顯示新的引繼碼，用它在裝置上把帳號引繼回來",
          "deadline": "請在 {time} 內確認，超時會自動取消（引繼碼仍然有效）",
          "password": "Haruki 工具箱登入密碼",
          "passwordHelp": "登入本網站時用的密碼，不是遊戲的引繼密碼，也不是 QQ 或 Google 的密碼",
          "forgotPassword": "忘記密碼？",
          "forgotPasswordNote": "如果忘記密碼並設定了新密碼，保險庫裡已儲存的內容將無法開啟，只能重置保險庫（這些內容會被刪除）",
          "pin": "保險庫 PIN",
          "pinHint": "你用 Google、Apple 或通行密鑰登入，沒有登入密碼，這裡用之前設定的保險庫 PIN",
          "pinCreate": "設定保險庫 PIN",
          "pinCreateHint": "你用 Google、Apple 或通行密鑰登入，沒有登入密碼，需要單獨設定一個 PIN",
          "pinCreateWhy": "以後檢視或重新簽發引繼碼時都要輸入，至少 8 個字元",
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
          "description": "現在就用它在裝置上把帳號引繼回來，或妥善記下",
          "inheritId": "引繼 ID",
          "password": "引繼密碼",
          "copy": "複製{label}",
          "copied": "{label}已複製",
          "copyFailed": "複製失敗，請手動抄寫",
          "expiresIn": "剩餘有效期 {time}",
          "expiresAt": "有效期至 {time}",
          "expired": "這組引繼碼已過期，請在保險庫中重新簽發",
          "singleUse": "24 小時內有效，只能使用一次",
          "savedToVault": "已加密儲存到下方保險庫，24 小時內可以再次檢視",
          "nextSteps": {
            "title": "接下來",
            "restore": "在裝置上用這組引繼碼把帳號引繼回來",
            "platformLink": "恢復後建議在遊戲內綁定 Game Center（iOS）或 Google Play 遊戲（Android；日服也可綁 Apple / Google 帳號），以後不用再依賴引繼碼",
            "cleanup": "確認恢復後，在下方保險庫點「我已在裝置上恢復」，刪除儲存的記錄"
          },
          "unsavedTitle": "立即記下這組引繼碼",
          "unsavedBody": "這組引繼碼沒能存入保險庫，離開本頁後就無法再檢視。請現在就抄下來或截圖儲存。",
          "ack": "我已記下",
          "acked": "已確認記下"
        }
      },
      "inheritVault": {
        "title": "引繼碼保險庫",
        "description": "新引繼碼儲存 24 小時，用於重新簽發的登入資訊儲存 7 天；檢視時需要輸入{secret}",
        "empty": "保險庫裡還沒有記錄",
        "notInitialized": "第一次確認引繼時會自動建立保險庫",
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
          "unreadable": "這條記錄在保險庫重置前儲存，已無法開啟",
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
          "description": "每次檢視都會通知你已驗證的信箱"
        },
        "reissue": {
          "title": "重新簽發引繼碼",
          "description": "用儲存的登入資訊簽發一組新引繼碼，之前的引繼碼會立即失效",
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
          "description": "會刪除保險庫裡的全部記錄（{records}），無法撤銷。只在想不起舊登入密碼或忘記保險庫 PIN 時使用。",
          "records": "{count} 條記錄",
          "password": "當前的 Haruki 工具箱登入密碼",
          "ack": "我明白全部記錄都會被刪除",
          "confirm": "重置並刪除全部記錄",
          "done": "保險庫已重置，刪除了 {count} 條記錄"
        },
        "passwordChanged": {
          "title": "請輸入修改前的舊登入密碼",
          "description": "保險庫仍用舊密碼上鎖，輸入一次後會改用現在的密碼",
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
        "invalid_request": "請求格式不正確，請重新整理頁面後重試",
        "invalid_server": "只支援日服和國際服",
        "invalid_upload_type": "不支援的資料類型",
        "inherit_id_invalid": "引繼 ID 格式不正確（應為 16 位字母或數字）",
        "inherit_password_invalid": "請輸入引繼密碼（最多 64 個字元）",
        "new_password_mode_invalid": "請選擇新引繼碼密碼的方式",
        "reuse_password_invalid": "這個密碼不能沿用（需為 8–16 個半形字元、不含空格），請改選「隨機生成」",
        "mysekai_requires_qq": "上傳烤森（MySekai）資料需要先在「HarukiBot 資料授權」綁定並驗證 QQ",
        "job_already_running": "你有一個正在進行的引繼，請先完成或取消它",
        "rate_limited": "提交太頻繁了（每小時最多 10 次），請稍後再試",
        "server_busy": "現在使用的人太多，請稍後再試",
        "game_degraded": "遊戲伺服器暫時不穩定，請稍後再試",
        "vault_unavailable": "引繼碼上傳暫時不可用，請稍後再試",
        "identity_unavailable": "暫時無法核對你的帳號資訊，請稍後再試",
        "store_unavailable": "服務暫時不可用，請稍後再試",
        "job_not_found": "這次引繼的記錄不存在或已過期",
        "job_not_awaiting_confirm": "這次引繼已不在等待確認（可能已確認、已取消或已超時），請檢視上方的進度",
        "cannot_cancel": "引繼已經開始執行，無法再取消",
        "unauthenticated": "登入已失效，請重新登入 Haruki 工具箱",
        "ws_ticket_invalid": "連線已斷開，正在重新連線…",
        "internal_error": "伺服器出了點問題，請稍後再試",
        "password_required": "請輸入 Haruki 工具箱登入密碼",
        "vault_pin_required": "請輸入保險庫 PIN",
        "vault_pin_invalid_format": "保險庫 PIN 至少 8 個字元，最多 128 個字元",
        "password_invalid": "登入密碼不正確。請輸入登入本網站時用的密碼，不是遊戲的引繼密碼。",
        "vault_pin_invalid": "保險庫 PIN 不正確，請再試一次",
        "previous_password_invalid": "舊登入密碼不正確，請再試一次。想不起來的話，只能重置保險庫。",
        "vault_password_changed": "你修改過登入密碼，需要再輸入一次修改前的舊密碼",
        "vault_not_initialized": "你還沒有使用過保險庫，第一次確認引繼時會自動建立",
        "unlock_rate_limited": "輸錯次數太多，為了保護你的帳號，請 15 分鐘後再試",
        "entry_not_found": "這條記錄不存在或已過期",
        "entry_stale": "這條記錄在保險庫重置前儲存，已無法開啟",
        "code_not_available": "這條記錄目前沒有可檢視的引繼碼（已超過 24 小時或未簽發），請點「重新簽發」",
        "no_previous_password": "沒有可沿用的舊引繼密碼，請改選「隨機生成」",
        "reset_confirmation_required": "請先勾選確認",
        "reissue_failed": "重新簽發引繼碼失敗，請稍後再試",
        "reissue_login_failed": "儲存的登入資訊已無法登入遊戲，可能已經失效",
        "reissue_rejected": "遊戲伺服器拒絕了這次請求，請稍後再試",
        "client_update_required": "頁面版本過舊，請重新整理頁面",
        "retryAfter": "{message}（{seconds} 秒後可重試）",
        "network": "無法連線到伺服器，請檢查網路後重試",
        "unknown": "請求失敗（HTTP {status}），請稍後再試"
      }
    },
    "pointCalculator": {
      "title": "控分計算",
      "description": "按要拿的活動 Pt 算出每局用多少加成、幾火、打到多少分",
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
        "invalid": "請輸入非負整數，可以帶 萬 / w / k 字尾"
      },
      "song": {
        "label": "歌曲",
        "region": "區服",
        "basicPoint": "基礎 Pt {value}",
        "missingBasicPoint": "這首歌暫時沒有基礎 Pt 資料，請換一首歌"
      },
      "conditions": {
        "title": "打法條件",
        "summary": "加成 {min}–{max}% · {boosts} · 最多 {games} 局",
        "bonusRange": "卡組加成範圍",
        "bonusRangeHelp": "填你的卡組能配出的加成範圍",
        "bonusMin": "加成下限",
        "bonusMax": "加成上限",
        "bonusRangeInvalid": "加成範圍需要是 0 到 {max} 之間的整數，且下限不能大於上限",
        "worldLink": "World Link 活動",
        "worldLinkHelp": "加成上限放寬到 {max}%",
        "boosts": "可用體力（火）",
        "boostsNone": "至少選一個體力檔位",
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
        "empty": "填上要拿的 Pt",
        "gapLabel": "要拿",
        "fromTo": "從 {current} 到 {target}，要拿",
        "singleNote": "一局放置就能打出來，共有 {count} 種單局打法",
        "singleScoreNote": "一局能打出來，但 {count} 種單局打法都要把分數控制在某個區間；下面優先給出放置就行的分局打法",
        "splitNote": "一局打不出 {gap} Pt（這些條件下單局能拿 {min}–{max}），已拆成幾局",
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
          "idleHint": "開局後不打音符，等歌曲結束",
          "each": "每局 +{value}",
          "after": "打完後 {value}"
        },
        "allSingle": "全部單局打法",
        "allSingleHint": "{count} 種，由易到難",
        "showAll": "顯示全部 {count} 種",
        "columns": {
          "bonus": "所需加成",
          "boost": "體力",
          "score": "分數"
        },
        "status": {
          "reached": "已經在目標上了，不用再打",
          "overshot": "已經超過目標 {gap} Pt。活動 Pt 不會減少，這個目標到不了了。",
          "tooClose": "只差 {gap} Pt，但這些條件下一局最少也會拿 {min} Pt，再打一局就超了",
          "tooCloseAction": "把加成下限降到 0%",
          "tooFar": "還差 {gap} Pt，超出了 {games} 局放置能湊出的範圍（最多 {reach} Pt）。先正常打歌，打到只差 {reach} Pt 以內再回來算。",
          "tooFarTarget": "也就是先打到 {value} Pt 左右。",
          "tooFarAction": "改成最多 {count} 局",
          "none": "這些條件下湊不出 {gap} Pt。放寬加成範圍、多選幾個體力檔位或增加局數再試。"
        }
      },
      "tips": {
        "boost": "開打前核對火數（Live Boost），差一檔 Pt 就不對",
        "beta": "測試中的功能，結果不保證準確，重要的數字先在遊戲核心對"
      }
    }
  },
  "botNeo": {
    "title": "HarukiBot NEO 註冊",
    "lead": "為自己的 Bot 領取接入 HarukiBot NEO 的憑據",
    "steps": {
      "label": "註冊步驟",
      "input": "填寫 QQ 號",
      "verify": "驗證信箱",
      "result": "儲存憑據"
    },
    "status": {
      "unknown": "無法確認註冊是否開放，仍可繼續嘗試",
      "recheck": "重新檢查"
    },
    "disabled": {
      "title": "註冊暫未開放",
      "recheck": "重新檢查"
    },
    "group": {
      "label": "NEO 分散式 QQ 群",
      "number": "群號"
    },
    "input": {
      "ownerLabel": "你本人的 QQ 號",
      "ownerPlaceholder": "例如 123456789",
      "ownerNote": "不要填 Bot 登入用的 QQ 號，否則無法加入 NEO 分散式 QQ 群",
      "mailHint": "驗證碼會發到 {mail}",
      "hintQqPlaceholder": "你的QQ號",
      "sendButton": "傳送驗證碼",
      "cooldownButton": "{seconds} 秒後可重試"
    },
    "verify": {
      "sentTo": "驗證碼已發到 {mail}，10 分鐘內有效",
      "codeFieldLabel": "郵件裡的驗證碼",
      "codeFieldPlaceholder": "6 位數字",
      "changeNumber": "換一個 QQ 號",
      "submit": "完成註冊",
      "resend": "重新發送",
      "resendCooldown": "{seconds} 秒後可重新發送"
    },
    "result": {
      "successTitle": "註冊成功",
      "botIdLabel": "Bot ID",
      "credentialLabel": "憑據",
      "copyAction": "複製{label}",
      "copyButton": "複製",
      "shownOnce": "憑據只顯示這一次，現在就複製儲存",
      "openGenerator": "生成 Client 配置",
      "registerAnotherButton": "註冊另一個",
      "leave": {
        "title": "憑據儲存好了嗎？",
        "description": "返回後憑據不再顯示，也無法重新獲取",
        "confirm": "已儲存，繼續"
      }
    },
    "toast": {
      "statusCheckFailed": "檢查註冊狀態失敗",
      "statusCheckFailedHint": "檢查網路後點「重新檢查」；多次失敗可能是服務暫時不可用",
      "sendFailedTitle": "傳送失敗",
      "sendFailedFallback": "驗證碼沒有發出去，請檢查 QQ 號後重試；多次失敗請稍後再試",
      "missingQQNumber": "請輸入 QQ 號",
      "invalidQQNumber": "請輸入有效的 QQ 號（5–12 位數字）",
      "rateLimitedTitle": "請求過於頻繁",
      "rateLimitedDescription": "請求次數過多，請在 {seconds} 秒後重試",
      "alreadyRegisteredTitle": "已註冊",
      "alreadyRegisteredDescription": "該 QQ 號已有註冊的 Bot",
      "registrationDisabledTitle": "註冊已關閉",
      "registrationDisabledDescription": "註冊功能當前已關閉",
      "codeSentTitle": "驗證碼已傳送",
      "codeSentDescription": "請前往 QQ {qq} 的信箱查收",
      "registerFailedTitle": "註冊失敗",
      "registerFailedFallback": "註冊沒有完成，請確認驗證碼無誤後重試；驗證碼過期請重新發送",
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
    "description": "國服協力房間號。",
    "viewOnSekaiStation": "在Sekai Station中檢視",
    "notConfigured": "協力車站暫不可用",
    "connection": {
      "connected": "已連線",
      "connecting": "連線中…",
      "disconnected": "已斷開",
      "failed": "連線不上伺服器",
      "failedHint": "會自動重試",
      "retryIn": "{n} 秒後重試",
      "retryNow": "立即重試",
      "reconnecting": "正在重新連線…",
      "online": "{n} 人線上"
    },
    "rooms": {
      "list": "房間列表",
      "empty": "現在沒有房間",
      "emptyFiltered": "沒有符合篩選條件的房間",
      "clearFilters": "清空篩選",
      "loading": "載入中…",
      "copyId": "複製房間號",
      "copyText": "複製房間號和留言",
      "openOriginal": "開啟原帖",
      "pin": "置頂",
      "unpin": "取消置頂",
      "copied": "已複製",
      "copyFailed": "複製失敗",
      "more": "更多操作",
      "idHint": "長按 1 秒遮蔽 10 分鐘",
      "block": "遮蔽 10 分鐘",
      "blocked": "已遮蔽 {id}，10 分鐘後恢復",
      "undo": "撤銷"
    },
    "settings": {
      "title": "篩選與顯示",
      "description": "篩選、已遮蔽的房間號和顯示選項",
      "done": "完成",
      "activeCount": "{n} 個篩選詞生效中",
      "filter": "篩選",
      "mode": "含任一詞的房間",
      "blacklist": "隱藏",
      "whitelist": "只顯示",
      "presetTags": "常用詞",
      "presetTagLabel": "{tag}（{name}）",
      "tagNames": {
        "shrimp": "蝦",
        "dragon": "龍",
        "pizza": "披薩"
      },
      "keyword": "關鍵詞",
      "keywordPlaceholder": "例如：長期",
      "keywordDuplicate": "已經新增過了",
      "add": "新增",
      "clear": "清空",
      "removeFilter": "移除篩選詞「{name}」",
      "display": "顯示",
      "expireTime": "房間保留多久",
      "durationSeconds": "{n} 秒",
      "durationMinutes": "{n} 分鐘",
      "fontSize": "字號",
      "lineHeight": "行距",
      "decrease": "減小",
      "increase": "增大"
    },
    "blocked": {
      "title": "已遮蔽的房間號",
      "count": "已遮蔽 {n}",
      "empty": "長按房間號 1 秒，遮蔽 10 分鐘",
      "minutesLeft": "剩 {n} 分鐘",
      "unblock": "取消遮蔽 {id}",
      "unblockOne": "解除",
      "unblockAll": "全部解除"
    }
  }
} as const
