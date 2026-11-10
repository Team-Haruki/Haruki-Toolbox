// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: admin, adminConfig, adminRisk, adminBotSecurity, adminContent, adminOAuthClients, adminWebhooks, adminSponsors, adminStatistics, adminGameBindings, adminUsers
export default {
  "admin": {
    "pagination": {
      "total": "共 {total} 條",
      "pageSize": "每頁顯示",
      "jumpToPage": "跳轉到頁",
      "firstPage": "第一頁",
      "prevPage": "上一頁",
      "nextPage": "下一頁",
      "lastPage": "最後一頁"
    },
    "filters": {
      "search": "查詢",
      "reset": "重置篩選"
    },
    "reauth": {
      "title": "驗證管理員密碼",
      "description": "敏感的管理操作需要再次確認你的帳號密碼。驗證通過後會自動繼續剛才的操作。",
      "passwordLabel": "當前密碼",
      "submit": "驗證並繼續",
      "passwordRequired": "請輸入密碼",
      "passwordMismatch": "密碼不正確，請重試", // NOSONAR -- translation key, not a credential
      "rejected": "無法通過密碼驗證此帳號",
      "invalidInput": "輸入無效，請重新輸入密碼",
      "failedTitle": "無法驗證密碼",
      "failedDescription": "驗證服務暫時不可用，請稍後重試",
      "sessionInvalid": "當前登入會話無效，請重新登入後再試"
    },
    "layout": {
      "superAdmin": "超級管理員"
    },
    "nav": {
      "groups": {
        "overview": "概覽",
        "usersRisk": "使用者與風控",
        "operations": "內容與運營",
        "system": "系統與整合"
      },
      "descriptions": {
        "dashboard": "平台關鍵指標與上傳趨勢總覽。",
        "users": "檢視、搜尋與管理工具箱使用者。",
        "gameBindings": "查詢與調整使用者的遊戲帳號綁定。",
        "risk": "維護風控規則並處置風險事件。",
        "botSecurity": "檢視 Haruki Cloud 上報的 Bot 客戶端安全告警並標記處理結果。",
        "tickets": "處理使用者提交的工單與回覆。",
        "content": "維護友情連結與推薦群聊等站點內容。",
        "sponsors": "管理贊助者名單的展示。",
        "uploadLogs": "追蹤玩家資料上傳記錄與失敗原因。",
        "logs": "檢視系統執行日誌。",
        "oauthClients": "管理 OAuth 客戶端、金鑰與回撥。",
        "webhooks": "管理平台 Webhook 推送。",
        "config": "調整系統級配置（僅超級管理員可見）。"
      },
      "dashboard": "儀表盤",
      "users": "使用者管理",
      "oauthClients": "OAuth客戶端",
      "webhooks": "Webhook 管理",
      "logs": "系統日誌",
      "uploadLogs": "上傳日誌",
      "content": "內容運營",
      "sponsors": "贊助者管理",
      "config": "系統配置",
      "gameBindings": "遊戲綁定",
      "risk": "風控管理",
      "botSecurity": "Bot 安全告警",
      "tickets": "工單管理",
      "pendingTickets": "{total} 個待管理員處理的工單"
    }
  },
  "adminConfig": {
    "status": {
      "title": "執行狀態",
      "deviceFlow": "裝置授權",
      "webhook": "Webhook 推送",
      "allowedKeys": "允許的資料鍵",
      "secrets": "金鑰",
      "secretsValue": "{configured} / {known} 已配置",
      "proxyVersion": "HarukiProxy 版本",
      "on": "已開啟",
      "off": "已關閉"
    },
    "allowedKeys": {
      "title": "公共 API 允許的資料鍵",
      "help": "公共介面、OAuth2 遊戲資料介面和本人帳號資料介面只返回這裡列出的頂層遊戲資料鍵，私有 API 不受限制。儲存後會清空遊戲資料快取。",
      "count": "{count} 個",
      "empty": "列表為空：還沒有允許任何資料鍵。",
      "addLabel": "新增資料鍵",
      "addPlaceholder": "userCards, userDecks",
      "addHint": "可以一次輸入多個，用逗號或空格分隔。",
      "add": "新增",
      "remove": "移除 {key}",
      "restore": "恢復 {key}",
      "addedMark": "新增",
      "removedMark": "將移除",
      "pending": "新增 {added} 個 · 移除 {removed} 個",
      "reset": "還原",
      "validation": {
        "empty": "請輸入要新增的資料鍵",
        "duplicate": "已在列表中：{keys}"
      },
      "loadFailed": "載入允許的資料鍵失敗",
      "saved": "允許的資料鍵已儲存"
    },
    "credentials": {
      "title": "憑據與連線",
      "note": "金鑰的值不會回傳，這裡只顯示是否已配置。要更換某一項，在下方執行時配置中寫入括號裡的欄位再儲存。",
      "configured": "已配置",
      "notConfigured": "未配置",
      "notSet": "未設定",
      "privateApiToken": "私有 API Token",
      "harukiProxySecret": "HarukiProxy 金鑰",
      "harukiProxyUnpackKey": "HarukiProxy 解包金鑰",
      "webhookJwtSecret": "Webhook JWT 金鑰",
      "privateApiUserAgent": "私有 API User-Agent",
      "harukiProxyUserAgent": "HarukiProxy User-Agent",
      "harukiProxyVersion": "HarukiProxy 版本"
    },
    "runtime": {
      "title": "執行時配置",
      "description": "以 JSON 直接編輯執行時配置，儲存後立即生效。沒有寫出的欄位保持不變。",
      "saveDialogTitle": "應用執行時配置？",
      "saveDialogDescription": "此更改將立即生效並應用於整個系統。請在繼續前確認 JSON 內容正確。",
      "saveDialogConfirm": "應用"
    },
    "runtimeSwitches": {
      "title": "執行時開關",
      "description": "切換後約 1 秒內生效，無需重啟後端。",
      "dirtyHint": "下方執行時配置有未儲存的修改，請先儲存或重新整理後再切換開關。",
      "oauth2DeviceFlow": {
        "label": "OAuth2 裝置授權",
        "description": "開啟後，開通了裝置碼授權類型的客戶端可以申請裝置碼，由使用者在 /device 頁批准。關閉後立即停止簽發裝置碼和受理批准；已簽發的令牌仍然有效，需要時按客戶端撤銷授權。後端沒有返回該項時顯示為關閉。",
        "enableTitle": "開啟 OAuth2 裝置授權？",
        "enableDescription": "開通了裝置碼授權類型的客戶端將可以申請裝置碼。此更改立即應用於整個系統。",
        "disableTitle": "關閉 OAuth2 裝置授權？",
        "disableDescription": "將立即停止簽發裝置碼和受理 /device 頁的批准。已簽發的令牌不受影響，需要時請按客戶端撤銷授權。",
        "confirmEnable": "開啟",
        "confirmDisable": "關閉"
      }
    },
    "toast": {
      "loadRuntimeFailedTitle": "載入執行時配置失敗",
      "runtimeUpdated": "執行時配置更新成功",
      "invalidJson": "JSON 格式無效",
      "invalidRuntimeSchema": "執行時配置必須是一個 JSON 物件",
      "saveFailedTitle": "儲存失敗",
      "saveFailedFallback": "儲存失敗",
      "deviceFlowEnabled": "OAuth2 裝置授權已開啟",
      "deviceFlowDisabled": "OAuth2 裝置授權已關閉",
      "switchNotApplied": "後端沒有應用該開關（可能尚不支援），當前仍顯示後端返回的值。"
    },
    "loadError": "載入配置失敗",
    "unsavedChanges": "有未儲存的更改",
    "editor": {
      "loading": "正在載入編輯器…",
      "loadFailedTitle": "程式碼編輯器載入失敗",
      "loadFailedDescription": "編輯器元件需要從 CDN 載入，可能被網路環境攔截。可以改用純文本編輯器繼續修改配置，或重新整理頁面重新載入。",
      "usePlainEditor": "改用純文本編輯器",
      "useCodeEditor": "切換回程式碼編輯器"
    }
  },
  "adminRisk": {
    "tabs": {
      "events": "風控事件",
      "rules": "風控規則"
    },
    "common": {
      "fallback": "—"
    },
    "severity": {
      "low": "低",
      "medium": "中",
      "high": "高",
      "critical": "嚴重"
    },
    "status": {
      "open": "待處理",
      "resolved": "已解決"
    },
    "range": {
      "last24h": "近 24 小時",
      "last7d": "近 7 天",
      "last30d": "近 30 天",
      "last90d": "近 90 天",
      "last365d": "近 1 年"
    },
    "filters": {
      "range": "時間範圍",
      "status": "狀態",
      "severity": "嚴重程度",
      "allStatuses": "全部狀態",
      "allSeverities": "全部嚴重程度",
      "severityOption": "嚴重程度：{severity}"
    },
    "stats": {
      "open": "待處理事件",
      "urgent": "待處理的嚴重 / 高",
      "urgentSplit": "嚴重 {critical} · 高 {high}",
      "resolved": "已解決事件",
      "resolutionRate": "解決率 {rate}",
      "total": "事件總數",
      "bySeverity": "待處理事件的嚴重程度",
      "bySeverityHint": "{range}內的全部待處理事件",
      "bySource": "本頁事件來源",
      "bySourceHint": "僅統計列表當前顯示的 {count} 條",
      "bySourceEmpty": "當前列表沒有事件",
      "bySourceFailed": "列表未能載入，沒有可統計的事件",
      "noSource": "未註明來源",
      "unavailable": "統計暫不可用"
    },
    "detail": {
      "title": "風控事件 #{id}",
      "noAction": "未記錄動作",
      "targetUser": "目標使用者",
      "actorUser": "觸發使用者",
      "ip": "IP",
      "resolvedAt": "解決時間",
      "resolvedBy": "處理人",
      "resolutionReason": "處理說明",
      "groups": {
        "event": "事件",
        "parties": "相關方",
        "resolution": "處理",
        "metadata": "附加資料"
      }
    },
    "events": {
      "title": "風控事件",
      "refresh": "重新整理",
      "details": "檢視詳情",
      "emptyHint": "{range}內沒有符合條件的事件，可以換一個時間範圍或篩選條件。",
      "userShort": "使用者 {userId}",
      "createButton": "建立事件",
      "createDialogTitle": "建立風控事件",
      "create": "建立",
      "resolveAction": "標記為已解決",
      "resolveDialog": {
        "title": "標記為已解決",
        "description": "確定要將事件「{action}」（ID {id}）標記為已解決嗎？它將不再顯示為待處理。",
        "confirm": "標記為已解決"
      },
      "empty": "暫無風控事件",
      "total": "共 {total} 個事件",
      "fields": {
        "severity": "嚴重程度",
        "source": "來源",
        "action": "動作",
        "reason": "原因",
        "targetUserIdOptional": "目標使用者ID（可選）"
      },
      "placeholders": {
        "source": "如: dashboard",
        "action": "如: suspicious_login",
        "reason": "描述風控原因…",
        "targetUserId": "使用者ID"
      },
      "sourceOptions": {
        "dashboard": "管理後台（dashboard）",
        "manual": "人工處理（manual）",
        "automated": "自動檢測（automated）",
        "other": "其他（other）"
      },
      "validation": {
        "actionRequired": "請填寫事件動作",
        "reasonRequired": "請填寫風控原因"
      },
      "table": {
        "severity": "嚴重程度",
        "action": "動作",
        "reason": "原因",
        "user": "使用者",
        "status": "狀態",
        "time": "時間",
        "actions": "操作"
      }
    },
    "rules": {
      "title": "風控規則",
      "description": "檢視和編輯風控規則配置（僅超級管理員可編輯）",
      "editorLabel": "規則 JSON",
      "editorHint": "每條規則包含 key（1–64 個字元）、description 和 config。儲存只會新增或更新列出的規則。",
      "formatButton": "整理格式",
      "revertButton": "還原",
      "state": {
        "saving": "儲存中…",
        "invalid": "JSON 有誤",
        "pending": "未儲存：新增 {added} · 修改 {changed}",
        "saved": "已儲存"
      },
      "saveButton": "儲存規則",
      "superAdminOnly": "風控規則僅超級管理員可見。",
      "loadError": "載入風控規則失敗。",
      "retry": "重試",
      "validation": {
        "invalidJson": "JSON 格式錯誤，請檢查括號、引號和逗號",
        "notArray": "規則內容必須是 JSON 陣列",
        "invalidRule": "第 {index} 條規則格式不正確：需要 key（1–64 個字元的字串），description 可選且須為字串，config 可選且須為物件",
        "duplicateKey": "第 {index} 條規則的 key「{key}」與前面的規則重複",
        "tooMany": "一次最多儲存 {max} 條規則"
      },
      "preview": {
        "title": "規則預覽",
        "count": "{count} 條",
        "invalid": "修正 JSON 後會在這裡顯示解析結果。",
        "empty": "規則陣列為空，沒有可儲存的內容。",
        "added": "新增",
        "changed": "已修改",
        "updatedAt": "更新於 {time}",
        "updatedBy": "更新於 {time} · 使用者 {user}",
        "omitted": "未列出的 {count} 條規則保持不變（儲存不會刪除規則）：{keys}",
        "enabled": "已啟用",
        "disabled": "已停用",
        "configKeys": "配置項：{keys}",
        "noConfig": "無配置項"
      }
    },
    "toast": {
      "loadEventsFailedTitle": "載入風控事件失敗",
      "loadRulesFailedTitle": "載入風控規則失敗",
      "loadFailedFallback": "載入失敗",
      "actionReasonRequired": "請填寫事件動作和原因",
      "createSuccess": "事件已建立",
      "createFailedTitle": "建立失敗",
      "createFailedFallback": "建立失敗",
      "resolveSuccess": "事件已解決",
      "actionFailedTitle": "操作失敗",
      "actionFailedFallback": "操作失敗",
      "saveFailedTitle": "儲存失敗",
      "saveFailedFallback": "儲存失敗",
      "rulesMustBeJsonArray": "規則內容必須是 JSON 陣列",
      "rulesUpdated": "風控規則已更新",
      "invalidJson": "JSON 格式錯誤"
    }
  },
  "adminBotSecurity": {
    "common": {
      "fallback": "—"
    },
    "kind": {
      "authFailed": "認證失敗",
      "replayDetected": "檢測到重放請求",
      "rateLimited": "觸發限流",
      "buildRejected": "客戶端構建被拒絕",
      "sessionRevoked": "會話已吊銷",
      "loginSourceChanged": "登入來源變化",
      "clientChanged": "客戶端變更",
      "policyUnavailable": "安全策略不可用"
    },
    "status": {
      "open": "待處理",
      "resolved": "已處理",
      "ignored": "已忽略"
    },
    "enforcement": {
      "enforced": "已攔截",
      "logOnly": "僅記錄",
      "enforcedHint": "Haruki Cloud 已攔截這次操作",
      "logOnlyHint": "Haruki Cloud 只記錄了這次操作，沒有攔截"
    },
    "window": {
      "seconds": "{count} 秒",
      "minutes": "{count} 分鐘",
      "hours": "{count} 小時",
      "days": "{count} 天"
    },
    "summary": {
      "open": "待處理",
      "last24h": "近 24 小時告警",
      "last7d": "近 7 天告警",
      "byKind": "待處理告警（按類型）",
      "noOpen": "暫無待處理的告警",
      "unavailable": "統計暫不可用",
      "filterByKind": "只看待處理的「{kind}」告警"
    },
    "overview": {
      "handled": "已處置",
      "handledSplit": "已處理 {resolved} · 已忽略 {ignored}",
      "openKinds": "涉及 {count} 種類型",
      "dailyAverage": "近 7 天日均 {count}",
      "anyStatus": "含已處置的告警",
      "byKindHint": "點選一行，只看該類型的待處理告警",
      "byStatus": "告警狀態",
      "byStatusHint": "全部告警",
      "byStatusTotal": "全部 {total} 條告警",
      "onThisPage": "本頁告警",
      "onThisPageHint": "僅統計列表當前顯示的 {count} 條",
      "onThisPageEmpty": "當前列表沒有告警",
      "onThisPageFailed": "列表未能載入，沒有可統計的告警",
      "timeline": "告警時間分佈",
      "timelineRange": "{from} 至 {to}",
      "timelineLabel": "本頁 {count} 條告警按告警時間的分佈",
      "enforcement": "攔截方式",
      "window": "統計視窗"
    },
    "filters": {
      "title": "篩選條件",
      "expand": "展開",
      "collapse": "收起",
      "status": "狀態",
      "kind": "類型",
      "botId": "Bot ID",
      "botIdPlaceholder": "精確匹配 Bot ID",
      "from": "開始時間",
      "fromPlaceholder": "不限",
      "to": "結束時間",
      "toPlaceholder": "不限",
      "allStatuses": "全部狀態",
      "allKinds": "全部類型",
      "changed": "已設 {count} 項"
    },
    "actions": {
      "search": "查詢",
      "refresh": "重新整理",
      "retry": "重試",
      "resolve": "標記已處理",
      "ignore": "忽略",
      "reopen": "重新開啟",
      "details": "檢視詳情"
    },
    "table": {
      "title": "告警列表",
      "alertTime": "告警時間",
      "kind": "類型",
      "bot": "Bot / 所有者 / 來源",
      "sourceIp": "來源 IP",
      "client": "客戶端版本 / 構建",
      "count": "次數 / 閾值",
      "status": "狀態",
      "handler": "處理人",
      "actions": "操作",
      "within": "{window}內",
      "ownerQq": "QQ {qq}",
      "botShort": "Bot {botId}",
      "sourceIpShort": "IP {ip}",
      "handledByShort": "處理人：{name}",
      "openMenu": "告警 #{id} 的操作",
      "empty": "沒有符合條件的告警",
      "loadError": "告警列表載入失敗"
    },
    "pagination": {
      "total": "共 {total} 條",
      "prev": "上一頁",
      "next": "下一頁"
    },
    "detail": {
      "title": "告警 #{id}",
      "description": "以下內容來自 Bot 客戶端或 Haruki Cloud，按原文顯示。",
      "receivedAt": "接收時間",
      "botId": "Bot ID",
      "ownerQq": "所有者 QQ",
      "node": "上報節點",
      "clientVersion": "客戶端版本",
      "buildId": "構建 ID",
      "reason": "原因",
      "note": "處理備註",
      "noNote": "暫無備註",
      "countValue": "{window}內 {count} 次，閾值 {threshold}",
      "handledAt": "處理時間",
      "handlerNameUnavailable": "（使用者名稱不可用，可能已刪除）",
      "groups": {
        "alert": "告警",
        "source": "Bot 與來源",
        "handling": "處理"
      }
    },
    "actionDialog": {
      "title": {
        "resolve": "標記告警為已處理",
        "ignore": "忽略告警",
        "reopen": "重新開啟告警"
      },
      "subject": "告警 #{id} · {kind}",
      "subjectWithBot": "告警 #{id} · {kind} · Bot {botId}",
      "noteLabel": "處理備註（可選）",
      "notePlaceholder": "記錄處理方式或判斷依據",
      "noteHint": "不修改則保留原備註。",
      "noteWillClear": "備註已清空，儲存後將刪除原備註。"
    },
    "toast": {
      "loadFailedTitle": "載入告警失敗",
      "loadFailedFallback": "請稍後重試",
      "loadSummaryFailedTitle": "載入告警統計失敗",
      "filterFailedTitle": "篩選條件有誤",
      "invalidTimeRange": "開始時間不能晚於結束時間",
      "updateFailedTitle": "更新告警失敗",
      "updateFailedFallback": "請稍後重試",
      "resolveSuccess": "告警已標記為已處理",
      "ignoreSuccess": "告警已忽略",
      "reopenSuccess": "告警已重新開啟"
    }
  },
  "adminContent": {
    "actions": {
      "edit": "編輯",
      "delete": "刪除"
    },
    "tabs": {
      "links": "友情連結管理",
      "groups": "推薦群聊管理"
    },
    "countShare": "{count} · {percent}",
    "stats": {
      "links": "友情連結",
      "tags": "連結標籤",
      "groups": "群聊分組",
      "items": "群聊項目",
      "untagged": "{count} 個未加標籤",
      "allTagged": "全部已加標籤",
      "topTag": "最常用：{tag}（{count}）",
      "emptyGroups": "{count} 個空分組",
      "noEmptyGroups": "沒有空分組",
      "largestGroup": "最多：{group}（{count}）"
    },
    "linksTab": {
      "title": "友情連結管理",
      "description": "按排序值從小到大展示，相同則按 ID。",
      "tagPanel": {
        "title": "標籤分佈",
        "description": "帶有每個標籤的連結數",
        "empty": "還沒有標籤",
        "more": "另有 {count} 個標籤未列出"
      },
      "createButton": "新增友情連結",
      "table": {
        "sortOrder": "排序",
        "name": "名稱",
        "tags": "標籤"
      },
      "deleteDialog": {
        "title": "確認刪除",
        "description": "確定刪除友鏈 {name}？",
        "cancel": "取消",
        "confirm": "確認"
      },
      "empty": "暫無友情連結"
    },
    "groupsTab": {
      "title": "推薦群聊管理",
      "summary": "排序 {order} · {count} 個項目",
      "hasLink": "已設定連結",
      "hasBackground": "已設定背景圖",
      "sizePanel": {
        "title": "各分組項目數",
        "description": "按分組的展示順序"
      },
      "createGroupButton": "建立群聊分組",
      "createGroupDialog": {
        "title": "建立分組",
        "editTitle": "編輯分組",
        "groupNameLabel": "分組名稱",
        "groupNamePlaceholder": "分組名稱",
        "create": "儲存"
      },
      "addItemButton": "新增項目",
      "deleteGroupDialog": {
        "title": "確認刪除分組",
        "description": "確定刪除群聊分組 {group}？分組內的所有項目也會被刪除。",
        "cancel": "取消",
        "confirm": "確認"
      },
      "deleteItemDialog": {
        "title": "確認刪除項目",
        "description": "確定刪除項目 {name}？此操作無法撤銷。",
        "confirm": "刪除"
      },
      "emptyItems": "暫無群聊項目",
      "emptyGroups": "暫無群聊分組"
    },
    "validation": {
      "nameRequired": "請填寫名稱",
      "urlRequired": "請填寫連結URL",
      "invalidUrl": "請輸入有效的 http(s) 連結",
      "groupNameRequired": "請輸入分組名稱"
    },
    "linkDialog": {
      "createTitle": "新增友情連結",
      "editTitle": "編輯友情連結",
      "fields": {
        "name": "名稱",
        "description": "描述",
        "avatarUrl": "頭像URL",
        "linkUrl": "連結URL",
        "tags": "標籤（逗號分隔）",
        "sortOrder": "排序值",
        "sortOrderHint": "數值越小越靠前，相同則按 ID 排序。"
      },
      "placeholders": {
        "name": "站點名稱",
        "description": "簡短描述",
        "avatarUrl": "https://example.com/avatar.png",
        "linkUrl": "https://example.com",
        "tags": "部落格, 技術",
        "sortOrder": "0"
      }
    },
    "itemDialog": {
      "createTitle": "新增項目",
      "editTitle": "編輯項目",
      "fields": {
        "name": "名稱",
        "avatarUrl": "頭像URL",
        "backgroundUrl": "背景圖URL",
        "groupInfo": "群組資訊",
        "detail": "詳情"
      },
      "placeholders": {
        "name": "項目名稱",
        "avatarUrl": "https://example.com/avatar.png",
        "backgroundUrl": "https://example.com/background.jpg",
        "optional": "可選"
      }
    },
    "toast": {
      "loadLinksFailedTitle": "載入友鏈失敗",
      "loadGroupsFailedTitle": "載入友鏈分組失敗",
      "actionFailedFallback": "操作失敗",
      "saveFailedTitle": "儲存失敗",
      "createFailedTitle": "建立失敗",
      "deleteFailedTitle": "刪除失敗",
      "linkUpdated": "友鏈已更新",
      "linkCreated": "友鏈已建立",
      "linkDeleted": "已刪除友鏈",
      "groupCreated": "分組已建立",
      "groupUpdated": "分組已更新",
      "groupDeleted": "分組已刪除",
      "itemUpdated": "項目已更新",
      "itemCreated": "項目已建立",
      "itemDeleted": "項目已刪除"
    }
  },
  "adminOAuthClients": {
    "title": "OAuth客戶端管理",
    "scope": {
      "userRead": "基礎資訊 (user:read)",
      "bindingsRead": "遊戲綁定 (bindings:read)",
      "gameDataRead": "遊戲資料 (game-data:read)",
      "gameDataWrite": "遊戲上傳 (game-data:write)",
      "stationRoomWrite": "提交車牌 Sekai Station (station:room:write)",
      "openid": "OIDC 登入 (openid)",
      "profile": "OIDC 暱稱 (profile)",
      "email": "OIDC 信箱 (email)",
      "offlineAccess": "離線訪問 / 重新整理令牌 (offline_access)"
    },
    "common": {
      "fallback": "—",
      "empty": "暫無統計資料"
    },
    "status": {
      "deleted": "已刪除",
      "enabled": "啟用",
      "disabled": "停用"
    },
    "createDialog": {
      "trigger": "建立客戶端",
      "title": "建立OAuth客戶端",
      "description": "建立一個新的 OAuth2 客戶端應用",
      "clientIdLabel": "客戶端ID (Client ID)",
      "clientIdPlaceholder": "英文字母/數字/槓/下劃線組合",
      "submit": "建立"
    },
    "editDialog": {
      "title": "編輯OAuth客戶端",
      "descriptionPrefix": "修改客戶端",
      "descriptionSuffix": "的設定。",
      "cancel": "取消"
    },
    "form": {
      "removeRedirectUri": "刪除此URI",
      "groups": {
        "basic": "基本資訊",
        "access": "授權方式與範圍",
        "redirects": "回撥地址"
      },
      "nameLabel": "客戶端名稱",
      "namePlaceholder": "顯示名稱",
      "clientTypeLabel": "客戶端類型",
      "clientTypePlaceholder": "選擇類型",
      "clientTypeConfidential": "Confidential (含Secret)",
      "clientTypePublic": "Public (無Secret)",
      "scopesLabel": "授權範圍 (Scopes)",
      "redirectUrisLabel": "回撥URI (Redirect URIs)",
      "redirectUriPlaceholder": "https://example.com/callback",
      "addRedirectUri": "新增URI",
      "postLogoutRedirectUrisLabel": "登出回撥URI (Post-Logout Redirect URIs)",
      "postLogoutRedirectUrisHelp": "OIDC RP-Initiated Logout 後允許跳回的地址，精確匹配。僅登入類客戶端需要，可留空。",
      "postLogoutRedirectUriPlaceholder": "https://example.com/logged-out",
      "grantTypesLabel": "授權類型 (Grant types)",
      "grantTypesHelp": "授權碼用於有瀏覽器回撥的應用；裝置碼用於沒有瀏覽器的程式（RFC 8628），由使用者在 /device 頁批准；重新整理令牌須與其中之一同時選擇，登記 offline_access 時必選。",
      "grantType": {
        "authorizationCode": "授權碼 (authorization_code)",
        "deviceCode": "裝置碼 (device_code)",
        "refreshToken": "重新整理令牌 (refresh_token)"
      },
      "redirectUrisOptionalHelp": "未選擇授權碼時不需要回調URI，僅裝置碼客戶端可以留空。",
      "writeScopeHint": "寫入權限：允許客戶端以使用者身份提交或上傳資料",
      "devicePolicy": {
        "title": "裝置碼策略",
        "firstParty": "官方客戶端",
        "firstPartyHelp": "在裝置授權頁上顯示「官方」徽章。",
        "firstPartyPublicHelp": "只對 Confidential 客戶端生效，Public 客戶端不顯示「官方」徽章。",
        "allowWrite": "允許經裝置碼申請 game-data:write",
        "allowWriteHelp": "僅限登記了 game-data:write 的 Public 客戶端。",
        "maxCodesPer10m": "每 10 分鐘裝置碼上限",
        "maxCodesPer10mHelp": "該客戶端每 10 分鐘最多可申請的裝置碼數量，範圍 {min}–{max}，預設 {default}。",
        "emailNeverGranted": "裝置碼授權永遠不會授予 email，登記了也只對授權碼生效。"
      }
    },
    "list": {
      "searchPlaceholder": "搜尋名稱或 Client ID",
      "allStatuses": "全部狀態",
      "count": "共 {count} 個客戶端",
      "refresh": "重新整理列表",
      "noMatch": "沒有符合篩選條件的客戶端",
      "resetFilters": "清除篩選",
      "copyClientId": "複製 Client ID",
      "redirectUriCount": "{count} 個回撥URI",
      "createdAt": "建立於 {date}",
      "noScopes": "未配置 Scope",
      "typePublic": "Public",
      "typeConfidential": "Confidential",
      "deviceBadge": "裝置碼",
      "deviceBadgeTitle": "已開通裝置碼授權類型",
      "title": "客戶端",
      "columns": {
        "client": "客戶端",
        "scopes": "Scope 與授權類型",
        "redirectUris": "回撥URI",
        "createdAt": "建立時間"
      },
      "moreRedirectUris": "還有 {count} 個",
      "noRedirectUris": "無回撥URI"
    },
    "overview": {
      "total": "客戶端總數",
      "enabled": "已啟用",
      "disabledCount": "停用 {count}",
      "deletedCount": "已刪除 {count}",
      "confidential": "Confidential 客戶端",
      "publicCount": "Public {count}",
      "device": "裝置碼客戶端",
      "shareOfClients": "佔全部客戶端的 {percent}",
      "partialNote": "客戶端超過一頁：除總數外，以上數字只統計已載入的 {loaded} 個（共 {total} 個）。",
      "scopesTitle": "Scope 分佈",
      "scopesHint": "登記了各 Scope 的客戶端數",
      "grantTypesTitle": "授權類型",
      "grantTypesHint": "可使用各授權類型的客戶端數"
    },
    "table": {
      "actions": "操作",
      "openMenu": "開啟選單",
      "empty": "暫無OAuth客戶端",
      "menu": {
        "edit": "編輯",
        "stats": "訪問統計",
        "webhooks": "Webhook endpoints",
        "disableClient": "停用客戶端",
        "enableClient": "啟用客戶端",
        "dangerZone": "危險操作",
        "rotateSecret": "輪換 Secret",
        "revokeAll": "撤銷全部授權",
        "restore": "恢復刪除",
        "deleteClient": "刪除客戶端"
      }
    },
    "deleteDialog": {
      "title": "確認刪除",
      "descriptionPrefix": "確定要刪除OAuth客戶端",
      "descriptionSuffix": "嗎？其所有令牌將立即失效，使用它的應用將無法再訪問。",
      "cancel": "取消",
      "confirm": "刪除"
    },
    "rotateDialog": {
      "title": "輪換客戶端金鑰",
      "description": "確定要輪換客戶端 {clientId} 的金鑰嗎？當前金鑰將立即失效，現有整合在更新前將無法使用。",
      "cancel": "取消",
      "confirm": "輪換"
    },
    "revokeDialog": {
      "title": "撤銷全部授權",
      "description": "確定要撤銷客戶端 {clientId} 的所有使用者授權嗎？所有使用者都需要重新授權，此操作無法撤銷。",
      "cancel": "取消",
      "confirm": "全部撤銷"
    },
    "disableDialog": {
      "title": "停用客戶端",
      "description": "確定要停用客戶端 {clientId} 嗎？停用後它將無法再發起授權，其現有的使用者授權和令牌也會被撤銷。",
      "confirm": "停用"
    },
    "statsDialog": {
      "title": "客戶端統計",
      "filters": "篩選範圍",
      "from": "開始時間",
      "to": "結束時間",
      "bucket": "時間粒度",
      "hour": "按小時",
      "day": "按天",
      "apply": "應用篩選",
      "invalidTimeRange": "開始時間不能晚於結束時間",
      "rangeLabel": "統計範圍：{range}",
      "authorizations": "使用者授權",
      "tokens": "令牌",
      "summary": {
        "authorizationTotal": "授權總數",
        "authorizationActive": "有效授權",
        "authorizationRevoked": "已撤銷授權",
        "authorizationCreatedInRange": "範圍內新增授權",
        "tokenTotal": "令牌總數",
        "tokenActive": "有效令牌",
        "tokenRevoked": "已撤銷令牌",
        "tokenIssuedInRange": "範圍內簽發令牌"
      },
      "trendTitle": "趨勢",
      "trendAuthorizations": "新增授權",
      "trendTokens": "簽發令牌",
      "trendEmpty": "所選範圍內沒有授權或令牌活動",
      "stateActive": "有效",
      "stateRevoked": "已撤銷",
      "authorizationStateHint": "全部使用者授權中仍然有效的比例",
      "tokenStateHint": "全部令牌中仍然有效的比例",
      "noAuthorizations": "還沒有使用者授權過此客戶端",
      "noTokens": "沒有令牌記錄",
      "trendHintHour": "每小時的新增授權與簽發令牌",
      "trendHintDay": "每天的新增授權與簽發令牌",
      "trendSummary": "範圍內共 {buckets} 個時間段，新增授權 {authorizations} 個，簽發令牌 {tokens} 個",
      "trendPeak": "最活躍的時間段：{time}，共 {count} 次",
      "trendView": "趨勢的展示方式",
      "trendViewChart": "圖表",
      "trendViewTable": "資料表",
      "trendBucket": "時間段",
      "trendTableNote": "只列出有資料的 {shown} 個時間段（共 {total} 個）",
      "audit": {
        "title": "管理操作",
        "description": "所選範圍內以此客戶端為目標的審計日誌條目",
        "loadFailed": "管理操作統計載入失敗。",
        "empty": "所選範圍內沒有針對此客戶端的管理操作",
        "total": "操作總數",
        "success": "成功",
        "failure": "失敗",
        "successRate": "成功率",
        "other": "其他操作 {count} 次",
        "action": {
          "create": "建立客戶端",
          "update": "修改設定",
          "activeUpdate": "啟用 / 停用",
          "rotateSecret": "輪換 Secret",
          "delete": "刪除客戶端",
          "restore": "恢復客戶端",
          "revoke": "撤銷全部授權",
          "statisticsQuery": "檢視統計",
          "authorizationsList": "檢視授權列表",
          "auditLogsQuery": "檢視審計日誌",
          "auditSummaryQuery": "檢視審計彙總",
          "webhookList": "檢視 Webhook",
          "webhookCreate": "建立 Webhook",
          "webhookUpdate": "修改 Webhook",
          "webhookDelete": "刪除 Webhook"
        }
      }
    },
    "secretDialog": {
      "title": "憑證生成成功",
      "description": "請注意：這是 Client Secret 唯一一次出現的時刻，系統不會儲存其明文。請務必立即複製並安全儲存；如遺失只能重新生成。",
      "copy": "複製",
      "confirmSaved": "我已妥善儲存"
    },
    "webhooks": {
      "title": "OAuth client Webhook",
      "description": "管理客戶端 {clientId} 的資料更新通知 endpoint。",
      "placeholderHint": "Callback URL 支援 {'{server}'}、{'{data_type}'}、{'{user_id}'} 佔位符。",
      "summary": "共 {total} 個 endpoint，已啟用 {enabled} 個",
      "actions": {
        "refresh": "重新整理",
        "create": "建立 endpoint",
        "cancel": "取消",
        "save": "儲存"
      },
      "bearer": {
        "configured": "已配置",
        "empty": "未配置"
      },
      "table": {
        "callbackUrl": "回撥地址",
        "bearer": "Bearer",
        "status": "狀態",
        "createdAt": "建立時間",
        "actions": "操作",
        "empty": "暫無 OAuth client webhook endpoint"
      },
      "form": {
        "createTitle": "建立 Webhook endpoint",
        "editTitle": "編輯 Webhook endpoint",
        "description": "Bearer 不會回顯；留空表示不設定或保持當前值。",
        "callbackUrl": "Callback URL",
        "callbackUrlPlaceholder": "https://example.com/oauth-webhook/{'{server}'}/{'{data_type}'}/{'{user_id}'}",
        "bearer": "Bearer token",
        "bearerPlaceholder": "可選",
        "bearerReplacePlaceholder": "留空保持當前 bearer",
        "bearerHelp": "儲存後前端只會顯示是否已配置，不會顯示明文。",
        "enabled": "啟用 endpoint",
        "enabledHelp": "停用後後端不會向該 endpoint 傳送回撥。",
        "clearBearer": "清除已配置 bearer",
        "clearBearerHelp": "開啟後儲存會刪除當前 bearer。"
      },
      "validation": {
        "callbackUrlRequired": "請填寫 Callback URL"
      },
      "deleteDialog": {
        "title": "刪除 Webhook 端點",
        "description": "確定要刪除 Webhook 端點 {callbackUrl} 嗎？該端點將停止接收回調，之後可重新建立。",
        "cancel": "取消",
        "confirm": "刪除"
      }
    },
    "toast": {
      "loadClientsFailedTitle": "載入OAuth客戶端失敗",
      "loadStatsFailedTitle": "載入統計失敗",
      "loadAuthorizationsFailedTitle": "載入OAuth客戶端授權列表失敗",
      "loadAuditLogsFailedTitle": "載入OAuth客戶端審計日誌失敗",
      "loadWebhooksFailedTitle": "載入 OAuth client webhook 失敗",
      "actionFailedFallback": "操作失敗",
      "createFailedTitle": "建立失敗",
      "saveFailedTitle": "儲存失敗",
      "saveWebhookFailedTitle": "儲存 webhook 失敗",
      "deleteFailedTitle": "刪除失敗",
      "deleteWebhookFailedTitle": "刪除 webhook 失敗",
      "actionFailedTitle": "操作失敗",
      "rotateFailedTitle": "輪換失敗",
      "restoreFailedTitle": "恢復失敗",
      "revokeFailedTitle": "撤銷失敗",
      "clientCreated": "OAuth客戶端已建立",
      "saved": "已儲存",
      "deleted": "已刪除",
      "disabled": "已停用",
      "enabled": "已啟用",
      "secretRotated": "已成功重新生成 Secret",
      "restored": "已恢復",
      "revokedAll": "已撤銷所有授權",
      "disabledRevocationIncompleteTitle": "客戶端已停用，但部分授權未能撤銷",
      "revokedPartiallyTitle": "授權僅部分撤銷",
      "revocationFailedSubjects": "有 {count} 個使用者標識（subject）撤銷失敗，可執行「撤銷全部授權」重試。",
      "revocationIncomplete": "部分授權未能撤銷，可執行「撤銷全部授權」重試。",
      "webhookSaved": "Webhook endpoint 已儲存",
      "webhookDeleted": "Webhook endpoint 已刪除",
      "copyFailedTitle": "複製失敗",
      "copyFailedSecretEmpty": "Secret 為空",
      "copyFailedClipboardUnsupported": "當前環境不支援剪貼簿操作",
      "copied": "已複製到剪貼簿",
      "validation": {
        "clientIdAndNameRequired": "客戶端ID和名稱不能為空",
        "clientIdRequired": "客戶端ID不能為空",
        "nameRequired": "客戶端名稱不能為空",
        "redirectUriRequired": "選擇了授權碼時請至少填寫一個回撥URI",
        "scopeRequired": "請至少選擇一個Scope",
        "oidcScopeRequiresOpenid": "profile / email 需要與 openid 一起登記",
        "grantTypeRequired": "請至少選擇授權碼或裝置碼（重新整理令牌不能單獨使用）",
        "postLogoutRequiresRedirectUris": "沒有回撥URI的客戶端不能登記登出回撥URI，請清空登出回撥URI",
        "offlineAccessRequiresRefreshToken": "登記 offline_access 時須同時選擇重新整理令牌",
        "deviceRequiresUserRead": "裝置碼客戶端須登記 user:read（裝置頁要顯示授權的帳號）",
        "deviceWriteRequiresPublicClient": "「允許經裝置碼申請 game-data:write」只適用於選擇了裝置碼並登記了 game-data:write 的 Public 客戶端",
        "invalidDevicePolicy": "每 10 分鐘裝置碼上限須為 1–600 之間的整數"
      },
      "apiErrors": {
        "publicClientHasNoSecret": "Public 客戶端沒有可輪換的 Secret。如需 Secret，請把客戶端類型改為 Confidential，儲存時會生成一次。",
        "unsupportedGrantType": "授權類型只能是授權碼、裝置碼和重新整理令牌"
      }
    }
  },
  "adminWebhooks": {
    "common": {
      "fallback": "—"
    },
    "status": {
      "enabled": "啟用",
      "disabled": "停用",
      "configured": "已配置",
      "notConfigured": "未配置"
    },
    "actions": {
      "refresh": "重新整理",
      "create": "建立 endpoint",
      "edit": "編輯",
      "delete": "刪除",
      "subscribers": "檢視訂閱者",
      "copyToken": "複製 Token",
      "cancel": "取消"
    },
    "settings": {
      "title": "Webhook 設定",
      "description": "管理全域性 webhook 開關和 JWT 金鑰配置。",
      "globalStatus": "全域性投遞狀態",
      "globalStatusHint": "只有全域性開關和 endpoint 開關都開啟時，才會真正傳送回撥。",
      "jwtSecretStatus": "JWT 金鑰狀態",
      "jwtSecretStatusHint": "只有配置好 JWT 金鑰後，後端才會返回可直接使用的 webhook token。",
      "secretAlertTitle": "JWT 金鑰尚未配置",
      "secretAlertDescription": "您仍然可以建立和編輯 endpoint，但在配置 JWT 金鑰之前，後端不會返回可用的 webhook token。",
      "enableSwitchLabel": "全域性啟用 webhook 投遞",
      "jwtSecretLabel": "Webhook JWT 金鑰",
      "jwtSecretPlaceholder": "留空表示保持當前金鑰不變",
      "jwtSecretHelp": "只有在您想替換當前金鑰時才需要填寫新值。",
      "readOnlyNoticeTitle": "只讀檢視",
      "readOnlyNoticeDescription": "你可以檢視 Webhook 設定和端點，但修改需要超級管理員權限。",
      "noChanges": "沒有需要儲存的更改",
      "disableDialog": {
        "title": "關閉全域性 webhook 投遞？",
        "description": "關閉後所有 endpoint 都不會再收到回撥，即使它們各自處於啟用狀態。已排隊的投遞將被丟棄。",
        "confirm": "關閉投遞"
      }
    },
    "list": {
      "title": "Webhook endpoints",
      "description": "檢視並管理已註冊的 webhook 回撥地址。",
      "generatedAt": "生成時間：{date}",
      "total": "共 {total} 個 endpoint"
    },
    "table": {
      "id": "ID",
      "callbackUrl": "回撥地址",
      "credential": "憑證",
      "status": "狀態",
      "subscriptions": "訂閱數",
      "createdAt": "建立時間",
      "actions": "操作",
      "empty": "暫無 webhook endpoint",
      "endpoint": "Endpoint",
      "bearerTitle": "回撥請求會附帶 Authorization: Bearer 頭"
    },
    "overview": {
      "total": "Endpoint 總數",
      "enabledDisabled": "啟用 {enabled} · 停用 {disabled}",
      "delivering": "正在投遞",
      "globalOn": "全域性投遞已啟用",
      "globalOff": "全域性投遞已關閉，不會發送任何回撥",
      "subscriptions": "訂閱總數",
      "endpointsWithSubscribers": "{count} 個 endpoint 有訂閱者",
      "jwtSecret": "JWT 金鑰",
      "withBearer": "{count} 個帶 Bearer",
      "rankTitle": "訂閱分佈",
      "rankHint": "訂閱數最多的 endpoint 及其佔全部訂閱的比例，按上方列表統計。",
      "rankEmpty": "還沒有任何訂閱",
      "rankRest": "其餘 endpoint 共 {count} 個訂閱"
    },
    "form": {
      "createTitle": "建立 webhook endpoint",
      "editTitle": "編輯 webhook endpoint",
      "description": "配置回撥地址、憑證、Bearer Token 和 endpoint 開關。",
      "idLabel": "Endpoint ID",
      "idPlaceholder": "可選，留空則自動生成",
      "idHelp": "如果留空，後端會自動生成下一個數字字串 ID。",
      "callbackUrlLabel": "回撥地址",
      "callbackUrlPlaceholder": "https://example.com/webhook",
      "credentialLabel": "憑證",
      "credentialPlaceholder": "可選，留空則自動生成",
      "credentialHelp": "如果留空，後端會自動生成隨機憑證。",
      "bearerLabel": "Bearer Token",
      "bearerPlaceholder": "可選，留空則不附帶 Authorization 頭",
      "bearerHelp": "填寫後，後端會在回撥請求中附帶 `Authorization: Bearer TOKEN`。",
      "clearBearerLabel": "清空 Bearer Token",
      "enabledLabel": "啟用當前 endpoint",
      "groups": {
        "endpoint": "Endpoint",
        "auth": "憑證與認證"
      }
    },
    "deleteDialog": {
      "title": "刪除 webhook endpoint",
      "description": "確認刪除 endpoint {id} 嗎？刪除後會一併移除它關聯的所有訂閱關係。",
      "confirm": "刪除 endpoint"
    },
    "tokenDialog": {
      "title": "Webhook Token",
      "description": "請儲存 endpoint {id} 當前可用的 webhook token。",
      "headerNameLabel": "請求頭名稱",
      "tokenLabel": "Webhook Token",
      "tokenHelp": "呼叫 webhook subscriber 介面時需要使用這個 token，請妥善保管。",
      "confirmSaved": "我已儲存"
    },
    "subscribers": {
      "title": "{id} 的訂閱者",
      "description": "當全域性開關和該 endpoint 開關都開啟時，這些訂閱關係會接收到回撥。",
      "generatedAt": "生成時間：{date}",
      "userId": "使用者 ID",
      "server": "區服",
      "dataType": "資料類型",
      "createdAt": "建立時間",
      "empty": "當前 endpoint 暫無訂閱者",
      "totalLabel": "訂閱數",
      "usersLabel": "訂閱使用者",
      "byServer": "按區服",
      "byDataType": "按資料類型"
    },
    "toast": {
      "loadFailedFallback": "操作失敗",
      "loadSettingsFailedTitle": "載入 webhook 設定失敗",
      "saveSettingsFailedTitle": "儲存 webhook 設定失敗",
      "loadEndpointsFailedTitle": "載入 webhook endpoint 失敗",
      "loadSubscribersFailedTitle": "載入訂閱者失敗",
      "createFailedTitle": "建立 endpoint 失敗",
      "saveFailedTitle": "儲存 endpoint 失敗",
      "deleteFailedTitle": "刪除 endpoint 失敗",
      "settingsSaved": "Webhook 設定已儲存",
      "created": "Webhook endpoint 已建立",
      "saved": "Webhook endpoint 已儲存",
      "deleted": "Webhook endpoint 已刪除",
      "savedWithoutToken": "Endpoint 已儲存，但由於 JWT 金鑰未配置，後端沒有返回 token。",
      "copyFailedTitle": "複製 Token 失敗",
      "copyFailedEmpty": "Token 為空",
      "copyFailedClipboardUnsupported": "當前環境不支援剪貼簿操作",
      "copied": "Token 已複製到剪貼簿",
      "validation": {
        "callbackRequired": "回撥地址不能為空",
        "callbackInvalid": "回撥地址必須是合法的 http 或 https URL",
        "idInvalid": "Endpoint ID 不能包含斜槓",
        "credentialInvalid": "憑證不能包含斜槓",
        "jwtSecretInvalid": "JWT 金鑰不能是空字串"
      }
    }
  },
  "adminSponsors": {
    "toolbox": {
      "title": "已認證工具箱使用者",
      "description": "管理訂單驗證和人工認證的贊助資格。曾經贊助過即可永久使用頭像框。",
      "add": "新增贊助使用者",
      "addDescription": "查詢已有工具箱帳號，確認贊助記錄後為其手動認證。",
      "search": "查詢使用者",
      "searchHint": "工具箱 ID、暱稱、信箱或愛發電 ID",
      "findUser": "查詢工具箱使用者",
      "loading": "正在載入使用者…",
      "empty": "沒有符合條件的認證使用者。",
      "noUser": "未找到可管理的使用者，請檢查 ID、暱稱或信箱。",
      "manage": "管理贊助資格",
      "select": "選擇使用者",
      "eligible": "已認證",
      "ineligible": "未啟用",
      "granted": "手動認證",
      "blocked": "撤銷資格",
      "automatic": "恢復自動驗證",
      "banned": "帳號已封禁",
      "oauth2": "OAuth2 驗證",
      "order": "訂單號驗證",
      "userId": "工具箱 ID：{id}",
      "afdianId": "愛發電 ID：{id}",
      "updated": "{actor} · {date}",
      "target": "為 {name}（{id}）設定贊助資格。",
      "access": "資格設定",
      "grantedHelp": "確認該使用者曾經贊助過，永久開放頭像框。不需要綁定愛發電，也不會新增贊助牆條目。",
      "blockedHelp": "停用該使用者的贊助頭像框，重新驗證訂單也不會恢復。保留原有訂單、綁定及頭像框選擇。",
      "automaticHelp": "清除人工設定，重新按已綁定帳號的歷史贊助記錄判斷資格。",
      "note": "操作備註（必填）",
      "noteHint": "填寫贊助來源、認證依據或調整原因，僅管理員可見。",
      "noteRequired": "請填寫操作備註，最多約 330 個漢字。",
      "save": "儲存資格",
      "saved": "贊助資格已更新",
      "loadFailed": "贊助使用者載入失敗，請重試。"
    },
    "binding": {
      "title": "工具箱綁定",
      "bound": "已綁定",
      "unbound": "未綁定"
    },
    "title": "贊助者管理",
    "description": "維護贊助者名單展示資料與贊助時長：愛發電時長由訂單自動計算，其他渠道的贊助在這裡手動錄入。",
    "generatedAt": "生成時間：{date}",
    "common": {
      "fallback": "—",
      "anonymous": "匿名贊助者"
    },
    "contribution": {
      "amount": "¥{amount}",
      "month": "愛發電 {count} 個月"
    },
    "actions": {
      "refresh": "重新整理名單",
      "syncAfdian": "從愛發電同步",
      "edit": "編輯資料",
      "create": "新增贊助者"
    },
    "stats": {
      "total": "贊助者總數",
      "active": "當前贊助",
      "bound": "已綁定工具箱",
      "amount": "記錄金額合計",
      "newRecords": "12 個月新增 {count}",
      "formerDetail": "曾經贊助 {count}",
      "boundShare": "佔全部贊助者 {percent}",
      "amountDetail": "{count} 位有金額記錄",
      "newRecordsTrend": "近 12 個月每月新增的贊助者記錄"
    },
    "breakdown": {
      "share": "{count} · {percent}",
      "empty": "暫無資料",
      "source": {
        "title": "來源",
        "description": "全部贊助者按記錄來源",
        "unknown": "未標註"
      },
      "plan": {
        "title": "贊助檔位",
        "description": "人數最多的 5 個檔位",
        "unnamed": "未設定檔位",
        "other": "其他 {count} 個檔位"
      },
      "expiry": {
        "title": "當前贊助到期",
        "description": "按實際到期時間距今天數",
        "within7": "7 天內",
        "within30": "8–30 天",
        "within90": "31–90 天",
        "later": "90 天以上",
        "none": "無到期時間"
      }
    },
    "source": {
      "afdian": "愛發電",
      "manual": "手動錄入",
      "legacy": "舊版資料",
      "imported": "匯入"
    },
    "filter": {
      "search": "搜尋贊助者",
      "searchPlaceholder": "名稱、ID、檔位或來源",
      "category": "按狀態篩選",
      "all": "全部",
      "noMatch": "沒有符合條件的贊助者",
      "clear": "清除篩選"
    },
    "category": {
      "current": "當前贊助",
      "former": "曾經贊助"
    },
    "afdianSync": {
      "enabled": "允許更新",
      "disabled": "不從愛發電更新"
    },
    "list": {
      "title": "贊助者名單",
      "description": "列表按後端返回順序展示；分類與到期時間由後端根據愛發電訂單和手動時長計算。",
      "total": "共 {total} 位",
      "filteredTotal": "{count} / {total} 位",
      "manualProfile": "{count} 位手動保護資料",
      "migrationPending": "{count} 位待拆分時長"
    },
    "table": {
      "supporter": "贊助者",
      "tier": "贊助檔位",
      "status": "狀態",
      "source": "來源",
      "lastSupport": "最近贊助",
      "effectiveExpiry": "實際到期時間",
      "contribution": "贊助貢獻",
      "amount": "記錄金額",
      "toolbox": "工具箱",
      "protect": "手動保護",
      "protectLabel": "不從愛發電更新 {name} 的資料",
      "expiresOn": "{date} 到期",
      "expiredOn": "{date} 已到期",
      "empty": "暫無贊助者記錄"
    },
    "edit": {
      "title": "編輯贊助者資料",
      "profileGroup": "展示資料",
      "name": "顯示名稱",
      "avatar": "頭像 URL",
      "avatarPlaceholder": "https://example.com/avatar.png",
      "planName": "贊助檔位",
      "source": "來源",
      "paidAt": "最近贊助時間",
      "paidAtPlaceholder": "未設定",
      "saveProfile": "儲存資料",
      "message": "留言",
      "afdianSyncDisabled": "不從愛發電更新這個資料",
      "afdianSyncHelp": "開啟後，手動編輯的暱稱、頭像、檔位和留言不會被後續愛發電同步覆蓋；愛發電訂單仍會計入時長。",
      "manualProfileHint": "此處只儲存展示用資料和同步策略；愛發電 API key 與 webhook 配置仍應只存在後端。"
    },
    "syncDialog": {
      "title": "從愛發電同步？",
      "description": "將向愛發電拉取最新訂單並更新所有未關閉同步的贊助者資料與時長。此操作會在後台執行，完成後列表自動重新整理。"
    },
    "afdianToggleDialog": {
      "disableTitle": "停止從愛發電更新？",
      "disableDescription": "{name} 的暱稱、頭像、檔位和留言將不再被愛發電同步覆蓋；愛發電訂單仍會計入時長。",
      "confirmDisable": "停止更新",
      "enableTitle": "恢復從愛發電更新？",
      "enableDescription": "下一次同步會用愛發電的資料覆蓋 {name} 手動編輯過的暱稱、頭像、檔位和留言。",
      "confirmEnable": "恢復更新"
    },
    "duration": {
      "title": "贊助時長",
      "migrationPending": "這位贊助者還保留著舊版的單一到期時間，完成一次愛發電同步後才會拆分為愛發電時長和手動時長，屆時才能錄入手動時長。",
      "afdianPart": "愛發電時長到期",
      "afdianMonths": "共 {count} 個月",
      "manualPart": "手動時長",
      "manualCount": "{count} 條記錄",
      "stackRule": "接在愛發電時長之後依次累加",
      "effective": "實際到期時間",
      "none": "無",
      "reported": "愛發電最近一次報告的方案到期時間：{date}",
      "amount": {
        "day": "{count} 天",
        "month": "{count} 個月"
      },
      "orders": {
        "title": "愛發電訂單（只讀）",
        "empty": "沒有愛發電訂單。",
        "paidAt": "時間",
        "plan": "方案",
        "kind": "時長",
        "amount": "實付",
        "customPlan": "自選方案",
        "months": "{count} 個月",
        "kinds": {
          "no_time": "不計時長",
          "ignored": "不計入"
        }
      },
      "manual": {
        "title": "手動時長",
        "add": "新增手動時長",
        "addDialogTitle": "新增手動時長",
        "editDialogTitle": "編輯手動時長",
        "empty": "還沒有手動時長。",
        "migrated": "遷移",
        "startsAt": "最早開始：{date}",
        "createdBy": "{user} 錄入於 {date}",
        "updatedBy": "{user} 修改於 {date}",
        "edit": "編輯",
        "delete": "刪除",
        "deleteTitle": "刪除這條手動時長？",
        "deleteDescription": "將刪除 {amount} 的手動時長，實際到期時間會隨之縮短。"
      },
      "form": {
        "amount": "數量",
        "unit": "單位",
        "units": {
          "month": "月（31 天）",
          "day": "天"
        },
        "startsAt": "最早開始時間",
        "startsAtPlaceholder": "現在",
        "startsAtHelp": "留空即為現在。實際從愛發電時長和之前的手動時長結束後才開始計算；只有贊助已中斷時才從這裡開始，此時不能晚於現在。",
        "note": "備註 / 原因",
        "notePlaceholder": "例如：微信轉賬 30 元"
      },
      "validation": {
        "amount": "數量必須是正整數（最多 1200 個月或 36600 天）",
        "note": "請填寫備註（最多 500 位元組）"
      }
    },
    "create": {
      "title": "新增贊助者",
      "description": "用於通過愛發電以外渠道贊助的人。建立後可以在資料裡新增手動時長。",
      "submit": "建立"
    },
    "toast": {
      "actionFailedFallback": "操作失敗",
      "loadFailedTitle": "載入贊助者失敗",
      "saveFailedTitle": "儲存贊助者失敗",
      "syncFailedTitle": "愛發電同步失敗",
      "saved": "贊助者資料已儲存",
      "created": "贊助者已建立",
      "synced": "已請求從愛發電同步",
      "afdianSyncDisabled": "已設為不從愛發電更新",
      "afdianSyncEnabled": "已允許從愛發電更新",
      "manualSaved": "手動時長已儲存",
      "manualSaveFailedTitle": "儲存手動時長失敗",
      "manualDeleted": "手動時長已刪除",
      "manualDeleteFailedTitle": "刪除手動時長失敗",
      "validation": {
        "nameRequired": "顯示名稱不能為空"
      }
    }
  },
  "adminStatistics": {
    "common": {
      "fallback": "—",
      "success": "成功",
      "failure": "失敗",
      "otherEntries": "另有 {kinds} 項，共 {count} 條"
    },
    "dashboard": {
      "generatedAt": "資料生成於 {time}",
      "refresh": "重新整理",
      "stat": {
        "totalUsers": "使用者總數",
        "bindingsPerUser": "人均綁定 {count} 個遊戲帳號",
        "newRegistrations": "24 小時新註冊",
        "vsPrevious24h": "較前 24 小時",
        "totalBindings": "遊戲帳號綁定",
        "verifiedBindings": "已驗證 {count} · {percent}",
        "totalUploads": "累計上傳",
        "uploadsPerUser": "人均 {count} 次",
        "uploadsWindow": "{hours} 小時上傳",
        "failedWindow": "{hours} 小時上傳失敗",
        "failureRate": "失敗率 {percent}",
        "staff": "管理團隊",
        "staffDetail": "超級管理員 {superAdmin} · 管理員 {admin}",
        "banned": "已封停使用者",
        "bannedShare": "佔全部使用者 {percent}"
      },
      "breakdown": {
        "byServer": "各區服綁定",
        "byServerHint": "全部遊戲帳號綁定",
        "byMethod": "上傳方式",
        "byDataType": "資料類型",
        "windowHint": "最近 {hours} 小時的上傳",
        "empty": "暫無資料"
      },
      "chart": {
        "title": "趨勢",
        "description": "上傳、上傳失敗和新註冊各佔一張圖，時間軸對齊；滑鼠移到任意一張圖上可同時檢視三項。",
        "uploads": "上傳",
        "registrations": "新註冊",
        "failures": "上傳失敗",
        "successRate": "成功率",
        "rangeLabel": "時間範圍",
        "bucketLabel": "時間粒度",
        "range7d": "近 7 天",
        "range14d": "近 14 天",
        "range30d": "近 30 天",
        "bucketDay": "按日",
        "bucketWeek": "按周",
        "bucketMonth": "按月",
        "tableTime": "時間",
        "empty": "暫無資料"
      },
      "trend": {
        "compare": {
          "day": "後 {n} 天對比前 {n} 天",
          "week": "後 {n} 周對比前 {n} 周",
          "month": "後 {n} 個月對比前 {n} 個月"
        },
        "dailyAverage": "日均",
        "peak": "峰值",
        "failureRate": "失敗率",
        "worstRate": "最高失敗率",
        "bestRate": "最低失敗率"
      },
      "hourly": {
        "title": "近 24 小時上傳",
        "description": "每小時的上傳次數，失敗的部分疊在柱頂；最右一柱是還沒過完的這一小時。",
        "successRate": "成功率",
        "peakHour": "峰值時段",
        "hourlyAverage": "每小時平均",
        "previousTotal": "前 24 小時",
        "succeeded": "上傳成功",
        "failed": "上傳失敗",
        "chartLabel": "近 24 小時每小時的上傳次數，可用左右方向鍵逐小時檢視",
        "readout": "{time}：成功 {success} 次，失敗 {failed} 次"
      },
      "matrix": {
        "title": "上傳方式 × 資料類型",
        "method": "上傳方式",
        "total": "合計"
      },
      "quality": {
        "title": "上傳質量",
        "description": "近 24 小時每種上傳方式的成功率與處理耗時。",
        "restrictedHint": "管理員看到的數字不含超級管理員和你本人的上傳，也不含未通過身份校驗的上傳。",
        "latencyP50": "處理耗時 P50",
        "latencyP50Hint": "一半的上傳快於此",
        "latencyP95": "處理耗時 P95",
        "latencyP95Hint": "95% 的上傳快於此",
        "activeAccounts": "活躍遊戲帳號",
        "activeAccountsHint": "成功上傳過的已驗證帳號",
        "v3Share": "HarukiProxy V3 佔比",
        "v2OnlyAccounts": "仍只用 V2 的帳號 {count} 個",
        "attempts": "次數",
        "failed": "失敗",
        "accounts": "活躍帳號",
        "empty": "近 24 小時沒有上傳"
      },
      "failureStage": {
        "title": "失敗階段",
        "description": "近 24 小時失敗的上傳停在哪一步",
        "empty": "近 24 小時沒有失敗的上傳",
        "buildContext": "建立上傳上下文",
        "accountPolicy": "帳號策略檢查",
        "decodePayload": "解析資料",
        "validatePayloadIdentity": "校驗資料歸屬",
        "preprocess": "預處理",
        "persist": "儲存資料",
        "validateResult": "校驗結果",
        "decrypt": "解密",
        "stale": "資料已過期",
        "retrieve": "拉取{type}資料",
        "unknown": "未記錄階段"
      },
      "toast": {
        "loadFailedTitle": "載入儀表盤失敗",
        "loadChartFailedTitle": "載入圖表失敗",
        "loadQualityFailedTitle": "載入上傳質量失敗",
        "loadFailedFallback": "載入失敗"
      }
    },
    "systemLogs": {
      "pagination": {
        "prev": "上一頁",
        "next": "下一頁",
        "total": "共 {total} 條日誌"
      },
      "overview": {
        "title": "概覽",
        "scope": "符合篩選條件的全部日誌"
      },
      "summary": {
        "total": "總日誌",
        "successRate": "成功率",
        "share": "佔 {share}",
        "actionKinds": "{count} 種操作",
        "topReason": "最多：{reason}",
        "failureRate": "失敗率 {rate}"
      },
      "breakdown": {
        "actions": "操作排行",
        "actionsHint": "範圍內出現最多的操作",
        "actorTypes": "操作者類型",
        "actorTypesHint": "這些日誌由誰觸發",
        "reasons": "失敗原因",
        "reasonsHint": "失敗日誌記錄的原因",
        "pageActors": "當前頁操作者",
        "pageActorsHint": "只統計下方表格顯示的 {count} 條",
        "empty": "暫無資料",
        "noFailures": "範圍內沒有失敗的日誌",
        "unknownReason": "未記錄原因"
      },
      "actorType": {
        "anonymous": "匿名",
        "user": "使用者",
        "admin": "管理員",
        "system": "系統",
        "unknown": "未知"
      },
      "filters": {
        "result": "結果",
        "allResults": "全部",
        "actorType": "操作者類型",
        "allActorTypes": "全部操作者",
        "range": "時間範圍"
      },
      "range": {
        "last24h": "最近 24 小時",
        "last7d": "最近 7 天",
        "last30d": "最近 30 天"
      },
      "searchActionPlaceholder": "按操作名搜尋…",
      "resetSearch": "清除搜尋",
      "refresh": "重新整理",
      "exportButton": "匯出",
      "table": {
        "result": "結果",
        "action": "操作",
        "actionAndRequest": "操作 / 請求",
        "actor": "操作者",
        "time": "時間",
        "empty": "暫無日誌",
        "emptyHint": "所選時間範圍內沒有日誌",
        "emptyFiltered": "沒有符合篩選條件的日誌，可以放寬條件或擴大時間範圍",
        "openDetail": "檢視詳情"
      },
      "detail": {
        "title": "日誌詳情",
        "result": "結果",
        "time": "時間",
        "action": "操作",
        "target": "對象",
        "request": "請求",
        "user": "使用者",
        "actorType": "操作者類型",
        "requestId": "請求 ID",
        "detail": "詳情",
        "copy": "複製詳情",
        "copied": "詳情已複製",
        "copyFailed": "複製失敗"
      },
      "toast": {
        "loadFailedTitle": "載入日誌失敗",
        "loadSummaryFailedTitle": "載入日誌摘要失敗",
        "loadDetailFailedTitle": "載入詳情失敗",
        "loadFailedFallback": "載入失敗",
        "exportSuccess": "匯出成功",
        "exportFailedTitle": "匯出失敗",
        "exportFailedFallback": "匯出失敗"
      }
    },
    "uploadLogs": {
      "pagination": {
        "prev": "上一頁",
        "next": "下一頁",
        "total": "共 {total} 條記錄"
      },
      "filters": {
        "title": "篩選條件",
        "expand": "展開",
        "collapse": "收起",
        "from": "開始時間",
        "fromPlaceholder": "選擇開始時間",
        "to": "結束時間",
        "toPlaceholder": "選擇結束時間",
        "gameUid": "遊戲UID",
        "gameUidPlaceholder": "多個UID用逗號分隔",
        "method": "上傳方式",
        "dataType": "資料類型",
        "server": "區服",
        "status": "上傳狀態",
        "sort": "排序",
        "sortPlaceholder": "排序方式",
        "allMethods": "全部方式",
        "allDataTypes": "全部類型",
        "allServers": "全部區服",
        "allStatuses": "全部狀態",
        "selectedMore": "{first} +{count}",
        "activeCount": "已選 {count} 項"
      },
      "overview": {
        "title": "概覽",
        "scope": "符合篩選條件的全部上傳"
      },
      "table": {
        "status": "狀態",
        "user": "使用者",
        "owner": "所屬使用者",
        "actor": "實際上傳者",
        "noOwner": "未關聯使用者",
        "server": "區服",
        "method": "方式",
        "dataType": "資料類型",
        "error": "錯誤資訊",
        "details": "詳情",
        "viewDetails": "檢視詳情",
        "viewError": "檢視錯誤",
        "time": "時間",
        "duration": "耗時",
        "methodAndDataType": "方式 / 類型",
        "empty": "暫無上傳日誌"
      },
      "actor": {
        "owner": "本人",
        "delegate": "代傳",
        "unknown": "無工具箱使用者"
      },
      "authMethod": {
        "browserSession": "瀏覽器會話",
        "oauth2": "OAuth2 應用",
        "iosUserCode": "iOS 使用者碼",
        "gameSessionProxy": "遊戲會話代理",
        "serviceToken": "服務令牌"
      },
      "authorizationSource": {
        "owner": "帳號所有者",
        "grant": "寫授權"
      },
      "detail": {
        "title": "上傳記錄詳情",
        "description": "所屬使用者為資料歸屬方，實際上傳者為發起本次上傳的工具箱使用者。",
        "gameUserId": "遊戲 UID",
        "authMethod": "身份方式",
        "authorizationSource": "授權來源",
        "grantId": "授權 ID",
        "grantIdHint": "審計快照，對應授權可能已不存在。",
        "actorKind": "上傳者關係",
        "oauthClientId": "OAuth 客戶端",
        "client": "客戶端 / 版本",
        "platform": "平台",
        "requestId": "請求 ID",
        "duration": "處理耗時",
        "requestSize": "請求大小",
        "claimedGameUserId": "載荷宣告 UID",
        "failureStage": "失敗階段",
        "errorCode": "錯誤碼"
      },
      "errorDialog": {
        "title": "上傳失敗詳情",
        "description": "檢視這次上傳失敗時後端返回的錯誤資訊。",
        "close": "關閉"
      },
      "summary": {
        "totalUploads": "總上傳數",
        "successRate": "成功率",
        "failureRate": "失敗率 {rate}",
        "activeAccounts": "活躍遊戲帳號",
        "activeAccountsHint": "有成功上傳的已驗證帳號",
        "latency": "處理耗時中位數",
        "latencyDetail": "P95 {p95} · {count} 個樣本",
        "latencyNoSamples": "沒有耗時記錄",
        "volume": {
          "hour": "每小時上傳量走勢",
          "day": "每日上傳量走勢"
        },
        "failureVolume": {
          "hour": "每小時失敗數走勢",
          "day": "每日失敗數走勢"
        },
        "peak": {
          "hour": "峰值 {count} 次/小時",
          "day": "峰值 {count} 次/天"
        }
      },
      "charts": {
        "byMethod": "按上傳方式",
        "byDataType": "按資料類型",
        "byServer": "按區服",
        "failureStages": "失敗階段",
        "noFailures": "範圍內沒有失敗的上傳",
        "unknownStage": "未記錄階段",
        "empty": "暫無資料"
      },
      "method": {
        "manual": "手動上傳",
        "iosProxy": "iOS代理",
        "iosScript": "iOS腳本",
        "harukiProxy": "HarukiProxy",
        "inherit": "引繼碼",
        "internal": "內部上傳",
        "oauth2": "OAuth2"
      },
      "dataType": {
        "suite": "Suite",
        "mysekai": "MySekai",
        "mysekaiBirthdayParty": "MySekai 生日派對"
      },
      "sort": {
        "uploadTimeDesc": "上傳時間 ↓",
        "uploadTimeAsc": "上傳時間 ↑",
        "idDesc": "ID ↓",
        "idAsc": "ID ↑"
      },
      "toast": {
        "loadFailedTitle": "載入上傳日誌失敗",
        "loadAnalyticsFailedTitle": "載入上傳統計失敗",
        "loadFailedFallback": "載入失敗",
        "filterFailedTitle": "篩選失敗",
        "invalidTimeRange": "開始時間不能晚於結束時間"
      }
    }
  },
  "adminGameBindings": {
    "common": {
      "cancel": "取消",
      "create": "建立"
    },
    "status": {
      "verified": "已驗證",
      "unverified": "未驗證"
    },
    "stats": {
      "total": "綁定總數",
      "verified": "已驗證",
      "verifiedShare": "佔全部綁定的 {share}",
      "unverified": "未驗證",
      "siteWide": "全站",
      "matching": "符合當前篩選",
      "matchingPage": "第 {page} / {pages} 頁",
      "byServer": "區服分佈",
      "byServerHint": "全站的全部綁定",
      "noBindings": "還沒有遊戲帳號綁定",
      "loadFailed": "全站統計載入失敗",
      "retry": "重試",
      "sharingTitle": "本頁共享設定",
      "sharingHint": "僅統計列表當前顯示的 {count} 條綁定",
      "sharingEmpty": "當前列表沒有綁定",
      "sharingFailed": "列表未能載入，沒有可統計的綁定",
      "sharing": {
        "suitePublicApi": "帳號資料 · 公開查詢",
        "suiteBots": "帳號資料 · 同步給 Bot",
        "mysekaiPublicApi": "烤森資料 · 公開查詢",
        "mysekaiFixtureApi": "烤森資料 · 家具互助",
        "mysekaiBots": "烤森資料 · 同步給 Bot"
      }
    },
    "filters": {
      "title": "搜尋與篩選",
      "verification": "驗證狀態",
      "allVerification": "全部",
      "addButton": "新增綁定",
      "fuzzySearch": "模糊搜尋",
      "fuzzySearchPlaceholder": "遊戲ID / 使用者名稱 / 信箱",
      "exactGameId": "精確遊戲ID",
      "exactGameIdPlaceholder": "遊戲使用者ID",
      "toolboxUserId": "工具箱使用者ID",
      "toolboxUserIdPlaceholder": "工具箱使用者ID",
      "server": "區服",
      "allServers": "全部區服",
      "sort": "排序",
      "sortPlaceholder": "排序方式",
      "searchButton": "查詢"
    },
    "sort": {
      "idDesc": "ID ↓",
      "idAsc": "ID ↑",
      "gameUserIdDesc": "遊戲ID ↓",
      "gameUserIdAsc": "遊戲ID ↑",
      "userIdDesc": "使用者ID ↓",
      "userIdAsc": "使用者ID ↑"
    },
    "table": {
      "title": "綁定列表",
      "selectRowOf": "選擇遊戲帳號 {gameUserId}",
      "sharing": {
        "suite": "帳號 {on}/{total}",
        "mysekai": "烤森 {on}/{total}",
        "publicApi": "已開啟公開查詢",
        "none": "無共享設定"
      },
      "role": {
        "admin": "管理員",
        "superAdmin": "超級管理員"
      },
      "selectAll": "全選",
      "selectRow": "選擇該行",
      "selectedCount": "已選 {count} 條",
      "batchUnbind": "批次解綁",
      "openMenu": "開啟選單",
      "total": "共 {total} 條記錄",
      "empty": "暫無遊戲帳號綁定記錄",
      "columns": {
        "server": "區服",
        "gameId": "遊戲ID",
        "account": "遊戲帳號",
        "verified": "驗證",
        "sharing": "已開啟的共享",
        "user": "所屬使用者",
        "actions": "操作"
      },
      "menu": {
        "edit": "編輯",
        "reassign": "轉移綁定",
        "unbind": "解綁"
      },
      "batchDialog": {
        "title": "確認批次解綁",
        "description": "將解綁選中的 {count} 條遊戲帳號綁定，此操作不可撤銷。",
        "cancel": "取消",
        "confirm": "確認解綁"
      }
    },
    "editDialog": {
      "createTitle": "新增遊戲綁定",
      "createDescription": "為使用者新增新的遊戲帳號綁定。",
      "editTitle": "編輯遊戲綁定",
      "editDescription": "修改遊戲帳號綁定的資料設定。",
      "toolboxUserId": "工具箱使用者ID",
      "toolboxUserIdPlaceholder": "輸入工具箱使用者ID",
      "server": "伺服器",
      "gameUserId": "遊戲使用者ID",
      "gameUserIdPlaceholder": "輸入遊戲內使用者ID",
      "suiteSettingsTitle": "Suite 資料設定",
      "mysekaiSettingsTitle": "MySekai 資料設定",
      "accountTitle": "遊戲帳號",
      "owner": "所屬使用者 ID {userId}",
      "identityLockedHint": "區服、遊戲 ID 和所屬使用者不能在這裡修改；要換綁到其他使用者請使用「轉移綁定」。",
      "botsHint": "把這類資料同步給對應的 QQ 群 Bot。",
      "permissionHelp": {
        "suite": {
          "allowPublicApi": "開啟後，任何知道這個 UID 的人都能通過工具箱介面檢視該使用者上傳的帳號資料。"
        },
        "mysekai": {
          "allowPublicApi": "開啟後，任何知道這個 UID 的人都能通過工具箱介面檢視該使用者上傳的烤森資料。",
          "allowFixtureApi": "開啟後，這個 UID 會出現在烤森家具互助列表，其他玩家可以來訪。"
        }
      }
    },
    "reassignDialog": {
      "title": "轉移遊戲帳號",
      "description": "將 {server} 遊戲 ID {gameId} 從 {fromUser} 轉移到目標使用者。",
      "targetUserIdLabel": "目標使用者ID",
      "targetUserIdPlaceholder": "請輸入目標工具箱使用者ID",
      "confirm": "確認轉移"
    },
    "deleteDialog": {
      "title": "確認解綁",
      "description": "此操作將解除 {server} 遊戲帳號 {gameUserId} 的綁定關係。",
      "confirm": "確認解綁"
    },
    "toast": {
      "loadFailedTitle": "載入遊戲綁定失敗",
      "loadFailedFallback": "載入失敗",
      "unbound": "已解綁",
      "unbindFailedTitle": "解綁失敗",
      "reassigned": "已轉移",
      "reassignFailedTitle": "轉移失敗",
      "batchUnbindFailedTitle": "批次解綁失敗",
      "invalidSelectedRecords": "選中的記錄格式無效",
      "batchUnbound": "已批次解綁 {count} 條",
      "bindingUpdated": "綁定已更新",
      "bindingCreated": "綁定已建立",
      "saveFailedTitle": "儲存失敗"
    }
  },
  "adminUsers": {
    "role": {
      "user": "使用者",
      "admin": "管理員",
      "superAdmin": "超級管理員"
    },
    "status": {
      "normal": "正常",
      "banned": "已封禁",
      "deleted": "已刪除（舊版）"
    },
    "common": {
      "actions": "操作",
      "allowed": "允許",
      "denied": "禁止",
      "verified": "已驗證",
      "unverified": "未驗證",
      "success": "成功",
      "failed": "失敗",
      "edit": "編輯",
      "save": "儲存",
      "cancel": "取消",
      "confirm": "確認",
      "unbound": "未綁定",
      "openMenu": "開啟選單",
      "fallback": "—",
      "delete": "刪除",
      "copyId": "複製使用者 ID",
      "idCopied": "使用者 ID 已複製",
      "copyFailed": "複製失敗"
    },
    "management": {
      "title": "使用者管理",
      "stats": {
        "totalUsers": "全站使用者",
        "newInDays": "近 {days} 天 +{count}",
        "trendLabel": "近 {days} 天每日註冊數",
        "staff": "管理團隊",
        "staffBreakdown": "超級管理員 {superAdmin} · 管理員 {admin}",
        "banned": "已封禁",
        "shareOfAll": "佔全站 {percent}",
        "filtered": "符合篩選",
        "listed": "列表中的使用者",
        "listScopeSuperAdmin": "不含你自己的帳號",
        "listScopeAdmin": "不含你自己和超級管理員",
        "loadFailed": "統計載入失敗",
        "retry": "重新載入統計"
      },
      "pageSummary": {
        "count": "本頁 {count} 人",
        "staff": "管理員 {count}",
        "banned": "已封禁 {count}",
        "allowCN": "允許國服 MySekai {count}"
      },
      "filters": {
        "searchLabel": "搜尋",
        "searchPlaceholder": "搜尋使用者名稱、信箱、使用者 ID 或社交帳號…",
        "roleLabel": "角色",
        "roleAll": "全部",
        "statusLabel": "帳號狀態",
        "statusAll": "全部",
        "allowCNLabel": "國服 MySekai 權限",
        "allowCNAll": "全部",
        "sortLabel": "排序",
        "sortIdDesc": "ID ↓",
        "sortIdAsc": "ID ↑",
        "sortNameDesc": "名稱 ↓",
        "sortNameAsc": "名稱 ↑",
        "sortCreatedAtDesc": "註冊時間 ↓",
        "sortCreatedAtAsc": "註冊時間 ↑",
        "createdFromLabel": "註冊時間起",
        "createdFromPlaceholder": "按起始時間過濾",
        "createdToLabel": "註冊時間止",
        "createdToPlaceholder": "按結束時間過濾",
        "allowCNShort": "國服 MySekai",
        "toggle": "篩選條件"
      },
      "batch": {
        "selectedCount": "已選 {count} 個使用者",
        "banButton": "批次封禁",
        "banDialogTitle": "確認批次封禁",
        "banDialogDescription": "確定要封禁選中的 {count} 個使用者嗎？此操作可以撤銷。",
        "banDialogConfirm": "確認封禁",
        "unbanButton": "批次解封",
        "forceLogoutButton": "批次登出",
        "roleButton": "批次角色",
        "roleTitle": "修改選中使用者的角色",
        "rolePlaceholder": "選擇目標角色",
        "roleConfirm": "確認修改",
        "allowCNButton": "批次國服 MySekai 權限",
        "allowCNTitle": "修改選中使用者的國服 MySekai 權限",
        "allowCNPlaceholder": "修改權限狀態",
        "allowCNEnable": "允許國服功能",
        "allowCNDisable": "禁止國服功能",
        "allowCNConfirm": "確認修改",
        "forceLogoutDialogTitle": "確認批次登出",
        "forceLogoutDialogDescription": "確定要強制登出選中的 {count} 個使用者嗎？他們的活躍會話將被登出。",
        "forceLogoutDialogConfirm": "確認登出",
        "roleDialogTitle": "確認變更角色",
        "roleDialogDescription": "確定要將選中的 {count} 個使用者的角色變更為 {role} 嗎？",
        "roleDialogConfirm": "確認變更"
      },
      "pagination": {
        "prevPage": "上一頁",
        "nextPage": "下一頁",
        "totalUsers": "共 {total} 個使用者",
        "pageSize": "每頁顯示",
        "jumpToPage": "跳轉到頁",
        "firstPage": "第一頁",
        "lastPage": "最後一頁"
      },
      "table": {
        "columns": {
          "username": "使用者名稱",
          "email": "信箱",
          "role": "角色",
          "allowCN": "國服 MySekai 權限",
          "status": "帳號狀態",
          "createdAt": "註冊時間",
          "user": "使用者"
        },
        "empty": "暫無使用者資料",
        "loadError": "載入使用者列表失敗",
        "retry": "重試",
        "emptyFiltered": "沒有符合當前篩選條件的使用者。",
        "selectPage": "全選本頁",
        "selectUser": "選擇 {name}",
        "viewDetail": "檢視詳情"
      },
      "toast": {
        "loadFailedTitle": "載入使用者列表失敗",
        "loadFailedFallback": "載入失敗",
        "batchBanSuccess": "已批次封禁 {count} 個使用者",
        "batchBanFailedTitle": "批次封禁失敗",
        "batchBanFailedFallback": "批次封禁失敗",
        "batchUnbanSuccess": "已批次解封 {count} 個使用者",
        "batchUnbanFailedTitle": "批次解封失敗",
        "batchUnbanFailedFallback": "批次解封失敗",
        "batchForceLogoutSuccess": "已批次強制登出 {count} 個使用者",
        "batchForceLogoutFailedTitle": "批次強制登出失敗",
        "batchForceLogoutFailedFallback": "批次強制登出失敗",
        "batchRoleSuccess": "已批次修改 {count} 個使用者的角色",
        "batchRoleFailedTitle": "批次修改角色失敗",
        "batchRoleFailedFallback": "批次修改角色失敗",
        "batchAllowCNSuccess": "已批次修改 {count} 個國服功能權限",
        "batchAllowCNFailedTitle": "批次功能權限失敗",
        "batchAllowCNFailedFallback": "批次功能權限失敗"
      }
    },
    "detail": {
      "backToList": "返回使用者列表",
      "notFound": "使用者不存在，可能已被刪除或連結有誤。",
      "header": {
        "userId": "使用者 ID",
        "banReason": "封禁原因"
      },
      "stats": {
        "gameBindings": "遊戲帳號",
        "verifiedCount": "已驗證 {count}",
        "authorizedSocials": "授權社交帳號",
        "mainSocial": "主綁定：{platform}",
        "noMainSocial": "未綁定主社交平台",
        "uploads": "近 {hours} 小時上傳",
        "uploadBreakdown": "成功 {success} · 失敗 {failure}",
        "uploadSuccessRate": "成功率 {percent}",
        "noUploads": "該時段內沒有上傳",
        "systemLogs": "近 {hours} 小時操作記錄",
        "lastAt": "最近 {time}",
        "noEvents": "該時段內沒有記錄"
      },
      "account": {
        "title": "帳號設定",
        "roleHelp": "新角色的權限立即生效。",
        "iosHelp": "使用者在 iOS 快捷指令中上傳資料時使用。"
      },
      "tabs": {
        "info": "基本資訊",
        "activity": "活動記錄",
        "oauth": "OAuth 授權",
        "game": "遊戲綁定",
        "social": "社交平台",
        "authSocial": "授權社交",
        "ios": "iOS 上傳碼"
      },
      "info": {
        "role": "角色",
        "accountStatus": "帳號狀態",
        "email": "信箱",
        "registeredAt": "註冊時間",
        "comingSoon": "開發中...",
        "changeRole": "修改角色：",
        "allowCNFeature": "允許使用國服 MySekai 功能",
        "unban": "解封",
        "ban": "封禁",
        "banDialogTitle": "確認封禁",
        "banDialogDescription": "確定要封停使用者 {name} 嗎？",
        "forceLogout": "強制登出",
        "resetPassword": "重置密碼",
        "restore": "恢復",
        "delete": "永久刪除",
        "deleteDialogTitle": "永久刪除帳號",
        "deleteDialogDescription": "將永久刪除使用者 {name}（{userId}）及其登入身份、社交和遊戲綁定、資料授權、上傳碼與引繼碼保險庫。此操作無法恢復；審計和上傳歷史會保留。",
        "deleteConfirmationLabel": "輸入使用者 ID {userId} 以確認",
        "deleteConfirmationMismatch": "輸入的使用者 ID 不匹配。",
        "deleteDialogConfirm": "永久刪除",
        "forceLogoutDialogTitle": "確認強制登出",
        "forceLogoutDialogDescription": "確定要強制登出使用者 {name} 嗎？該使用者的所有活躍會話都將被登出，需要重新登入。",
        "forceLogoutDialogConfirm": "確認登出",
        "resetPasswordDialogTitle": "確認重置密碼",
        "resetPasswordDialogDescription": "確定要重置使用者 {name} 的密碼嗎？當前密碼將立即失效，該使用者需要重新設定密碼後才能登入。",
        "resetPasswordDialogConfirm": "確認重置",
        "roleDialogTitle": "確認修改角色",
        "roleDialogDescription": "確定要將使用者 {name} 的角色修改為 {role} 嗎？新的權限將立即生效。",
        "roleDialogConfirm": "確認修改"
      },
      "activity": {
        "title": "活動記錄",
        "uploadLogsTitle": "上傳日誌",
        "uploadLogsDescription": "該使用者最近的上傳記錄，包括失敗時後端返回的錯誤詳情。",
        "viewAllUploads": "在上傳日誌中檢視全部",
        "columns": {
          "action": "操作",
          "result": "結果",
          "path": "路徑",
          "time": "時間"
        },
        "empty": "暫無活動記錄",
        "listedOf": "顯示最近 {listed} 條，共 {total} 條",
        "listedAll": "共 {total} 條",
        "showAll": "顯示全部 {count} 條",
        "showFewer": "收起",
        "byActor": "操作者 {actor}"
      },
      "oauth": {
        "title": "OAuth 授權",
        "revokeAll": "撤銷全部",
        "total": "共 {count} 個授權",
        "activeCount": "{count} 個有效",
        "device": "裝置：{name}",
        "empty": "暫無 OAuth 授權",
        "revokeAllDialogTitle": "撤銷全部授權",
        "revokeAllDialogDescription": "此操作將撤銷該使用者的全部 {count} 個 OAuth 授權，並使其從所有已連線的第三方應用登出。是否繼續？",
        "columns": {
          "client": "應用",
          "scopes": "權限範圍",
          "createdAt": "授權時間",
          "status": "狀態"
        },
        "status": {
          "active": "有效",
          "revoked": "已撤銷",
          "clientDisabled": "應用已停用"
        }
      },
      "game": {
        "title": "遊戲帳號綁定",
        "add": "新增綁定",
        "columns": {
          "server": "伺服器",
          "gameId": "遊戲 ID"
        },
        "edit": "編輯遊戲綁定",
        "unbind": "解綁遊戲帳號",
        "empty": "暫無遊戲綁定",
        "total": "共 {count} 個帳號",
        "sharingSuite": "Suite 共享 {on}/{total}",
        "sharingMysekai": "MySekai 共享 {on}/{total}",
        "unbindDialogTitle": "確認解綁",
        "unbindDialogDescription": "此操作將解綁遊戲帳號 {gameUserId}，之後可重新新增。"
      },
      "social": {
        "title": "社交平台綁定",
        "add": "新增綁定",
        "empty": "暫無社交平台綁定",
        "delete": "刪除社交平台綁定",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "確定要刪除此主社交平台綁定嗎？之後可重新新增。"
      },
      "authSocial": {
        "title": "授權社交平台",
        "add": "新增授權",
        "columns": {
          "platform": "平台",
          "userId": "使用者 ID",
          "comment": "備註"
        },
        "empty": "暫無授權社交平台",
        "total": "共 {count} 個帳號",
        "delete": "刪除授權社交平台",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "確定要刪除此授權社交平台嗎？之後可重新新增。"
      },
      "ios": {
        "title": "iOS 上傳碼",
        "regenerate": "重新生成",
        "generate": "生成上傳碼",
        "empty": "暫無上傳碼",
        "delete": "刪除上傳碼",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "確定要刪除當前的 iOS 上傳碼嗎？之後可重新生成一個新的。",
        "regenerateDialogTitle": "確認重新生成上傳碼",
        "regenerateDialogDescription": "確定要為使用者 {name} 重新生成 iOS 上傳碼嗎？當前上傳碼將立即失效，該使用者需要在快捷指令中更新為新的上傳碼。",
        "regenerateDialogConfirm": "重新生成"
      },
      "dialog": {
        "email": {
          "title": "修改信箱",
          "description": "修改使用者 {name} 的信箱地址。",
          "newEmail": "新信箱地址",
          "placeholder": "請輸入信箱地址",
          "invalid": "請輸入有效的信箱地址，例如 name@example.com",
          "confirm": "確認修改"
        },
        "gameBinding": {
          "title": "新增遊戲綁定",
          "description": "為使用者 {name} 新增或更新遊戲帳號綁定。",
          "server": "伺服器",
          "gameUserId": "遊戲使用者 ID",
          "gameUserIdPlaceholder": "輸入遊戲內使用者 ID",
          "suiteSettings": "Suite 資料設定",
          "mysekaiSettings": "MySekai 資料設定"
        },
        "social": {
          "addTitle": "新增社交平台綁定",
          "editTitle": "編輯社交平台綁定",
          "description": "管理使用者 {name} 的社交平台主綁定資訊。",
          "platform": "平台",
          "platformPlaceholder": "選擇平台",
          "userId": "使用者 ID",
          "userIdPlaceholder": "平台上的使用者 ID"
        },
        "authSocial": {
          "addTitle": "新增授權社交平台",
          "editTitle": "編輯授權社交平台",
          "description": "管理使用者 {name} 的授權社交平台帳號。",
          "platform": "平台",
          "platformPlaceholder": "選擇平台",
          "userId": "使用者 ID",
          "userIdPlaceholder": "平台上的使用者 ID",
          "comment": "備註",
          "commentPlaceholder": "備註（可選）"
        }
      },
      "toast": {
        "actionFailedFallback": "操作失敗",
        "loadUserFailedTitle": "載入使用者詳情失敗",
        "loadActivityFailedTitle": "載入活動記錄失敗",
        "loadOAuthFailedTitle": "載入 OAuth 授權失敗",
        "loadGameBindingsFailedTitle": "載入遊戲綁定失敗",
        "loadSocialFailedTitle": "載入社交平台綁定失敗",
        "loadAuthSocialFailedTitle": "載入授權社交平台失敗",
        "banFailedTitle": "封禁失敗",
        "banSuccess": "已封停使用者",
        "unbanFailedTitle": "解封失敗",
        "unbanSuccess": "已解封使用者",
        "forceLogoutFailedTitle": "強制登出失敗",
        "forceLogoutSuccess": "已強制登出",
        "deleteFailedTitle": "刪除失敗",
        "deleteSuccess": "帳號及其綁定已永久刪除",
        "restoreFailedTitle": "恢復失敗",
        "restoreSuccess": "已恢復使用者",
        "resetPasswordFailedTitle": "重置密碼失敗",
        "resetPasswordSuccess": "已重置密碼",
        "updateRoleFailedTitle": "更新角色失敗",
        "updateRoleSuccess": "已更新角色為 {role}",
        "updateEmailFailedTitle": "更新信箱失敗",
        "updateEmailSuccess": "信箱已更新",
        "revokeOAuthFailedTitle": "撤銷失敗",
        "revokeOAuthSuccess": "已撤銷 OAuth 授權",
        "deleteGameBindingFailedTitle": "刪除失敗",
        "deleteGameBindingSuccess": "已刪除遊戲綁定",
        "toggleCNFailedTitle": "更新失敗",
        "cnEnabled": "已開啟國服 MySekai",
        "cnDisabled": "已關閉國服 MySekai",
        "saveGameBindingFailedTitle": "儲存失敗",
        "saveGameBindingSuccess": "遊戲綁定已儲存",
        "regenerateIOSFailedTitle": "生成失敗",
        "missingIOSCode": "介面未返回上傳碼",
        "regenerateIOSSuccess": "已重新生成 iOS 上傳碼",
        "deleteIOSFailedTitle": "刪除失敗",
        "deleteIOSSuccess": "已刪除 iOS 上傳碼",
        "deleteSocialFailedTitle": "刪除失敗",
        "deleteSocialSuccess": "已刪除社交平台綁定",
        "saveSocialFailedTitle": "更新失敗",
        "saveSocialSuccess": "社交平台資訊已更新",
        "deleteAuthSocialFailedTitle": "刪除失敗",
        "deleteAuthSocialSuccess": "已刪除授權社交平台",
        "saveAuthSocialFailedTitle": "儲存失敗",
        "saveAuthSocialSuccess": "授權社交平台已儲存"
      }
    }
  }
} as const
