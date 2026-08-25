// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: admin, adminConfig, adminRisk, adminContent, adminOAuthClients, adminWebhooks, adminSponsors, adminStatistics, adminGameBindings, adminUsers
export default {
  "admin": {
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
        "dashboard": "平臺關鍵指標與上傳趨勢總覽。",
        "users": "檢視、搜尋與管理工具箱使用者。",
        "gameBindings": "查詢與調整使用者的遊戲賬號繫結。",
        "risk": "維護風控規則並處置風險事件。",
        "tickets": "處理使用者提交的工單與回覆。",
        "content": "維護友情連結與推薦群聊等站點內容。",
        "sponsors": "管理贊助者名單的展示。",
        "uploadLogs": "追蹤玩家資料上傳記錄與失敗原因。",
        "logs": "檢視系統執行日誌。",
        "oauthClients": "管理 OAuth 客戶端、金鑰與回撥。",
        "webhooks": "管理平臺 Webhook 推送。",
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
      "gameBindings": "遊戲繫結",
      "risk": "風控管理",
      "tickets": "工單管理",
      "pendingTickets": "{total} 個待管理員處理的工單"
    }
  },
  "adminConfig": {
    "publicApiKeys": {
      "title": "Public API Keys",
      "description": "管理公共 API 金鑰配置（僅超級管理員可操作）"
    },
    "runtime": {
      "title": "執行時配置",
      "description": "管理執行時配置項（修改後立即生效）",
      "saveDialogTitle": "應用執行時配置？",
      "saveDialogDescription": "此更改將立即生效並應用於整個系統。請在繼續前確認 JSON 內容正確。",
      "saveDialogConfirm": "應用"
    },
    "toast": {
      "loadApiKeysFailedTitle": "載入 Public API Keys 失敗",
      "loadRuntimeFailedTitle": "載入執行時配置失敗",
      "loadFailedFallback": "載入失敗",
      "apiKeysUpdated": "Public API Keys 更新成功",
      "runtimeUpdated": "執行時配置更新成功",
      "invalidJson": "JSON 格式無效",
      "invalidApiKeysSchema": "公共 API 金鑰必須是字串值組成的 JSON 物件",
      "invalidRuntimeSchema": "執行時配置必須是一個 JSON 物件",
      "saveFailedTitle": "儲存失敗",
      "saveFailedFallback": "儲存失敗"
    },
    "loadError": "載入配置失敗",
    "retry": "重試",
    "unsavedChanges": "有未儲存的更改"
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
    "events": {
      "pagination": {
        "prev": "上一頁",
        "next": "下一頁"
      },
      "title": "風控事件",
      "createButton": "建立事件",
      "createDialogTitle": "建立風控事件",
      "create": "建立",
      "resolveAction": "標記為已解決",
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
      "saveButton": "儲存規則",
      "superAdminOnly": "風控規則僅超級管理員可見。",
      "loadError": "載入風控規則失敗。",
      "retry": "重試"
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
  "adminContent": {
    "actions": {
      "edit": "編輯",
      "delete": "刪除"
    },
    "tabs": {
      "links": "友情連結管理",
      "groups": "推薦群聊管理"
    },
    "linksTab": {
      "title": "友情連結管理",
      "createButton": "新增友情連結",
      "table": {
        "sortOrder": "排序",
        "name": "名稱",
        "url": "URL",
        "tags": "標籤",
        "actions": "操作"
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
      "createGroupButton": "建立群聊分組",
      "createGroupDialog": {
        "title": "建立分組",
        "editTitle": "編輯分組",
        "groupNameLabel": "分組名稱",
        "groupNamePlaceholder": "分組名稱",
        "create": "儲存"
      },
      "addItemButton": "新增專案",
      "deleteGroupDialog": {
        "title": "確認刪除分組",
        "description": "確定刪除群聊分組 {group}？分組內的所有專案也會被刪除。",
        "cancel": "取消",
        "confirm": "確認"
      },
      "emptyItems": "暫無群聊專案",
      "emptyGroups": "暫無群聊分組"
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
      "createTitle": "新增專案",
      "editTitle": "編輯專案",
      "fields": {
        "name": "名稱",
        "avatarUrl": "頭像URL",
        "backgroundUrl": "背景圖URL",
        "groupInfo": "群組資訊",
        "detail": "詳情"
      },
      "placeholders": {
        "name": "專案名稱",
        "avatarUrl": "https://example.com/avatar.png",
        "backgroundUrl": "https://example.com/background.jpg",
        "optional": "可選"
      }
    },
    "toast": {
      "loadLinksFailedTitle": "載入友鏈失敗",
      "loadGroupsFailedTitle": "載入友鏈分組失敗",
      "actionFailedFallback": "操作失敗",
      "nameUrlRequired": "請填寫名稱和URL",
      "invalidLinkUrl": "請輸入有效的 http(s) 連結",
      "saveFailedTitle": "儲存失敗",
      "createFailedTitle": "建立失敗",
      "deleteFailedTitle": "刪除失敗",
      "linkUpdated": "友鏈已更新",
      "linkCreated": "友鏈已建立",
      "linkDeleted": "已刪除友鏈",
      "groupNameRequired": "請輸入分組名稱",
      "groupCreated": "分組已建立",
      "groupUpdated": "分組已更新",
      "groupDeleted": "分組已刪除",
      "itemNameRequired": "請填寫名稱",
      "itemUpdated": "專案已更新",
      "itemCreated": "專案已建立",
      "itemDeleted": "專案已刪除"
    }
  },
  "adminOAuthClients": {
    "title": "OAuth客戶端管理",
    "scope": {
      "userRead": "基礎資訊 (user:read)",
      "bindingsRead": "遊戲繫結 (bindings:read)",
      "gameDataRead": "遊戲資料 (game-data:read)",
      "gameDataWrite": "遊戲上傳 (game-data:write)",
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
      "nameLabel": "客戶端名稱",
      "namePlaceholder": "顯示名稱",
      "clientTypeLabel": "客戶端型別",
      "clientTypePlaceholder": "選擇型別",
      "clientTypeConfidential": "Confidential (含Secret)",
      "clientTypePublic": "Public (無Secret)",
      "scopesLabel": "授權範圍 (Scopes)",
      "redirectUrisLabel": "回撥URI (Redirect URIs)",
      "redirectUriPlaceholder": "https://example.com/callback",
      "addRedirectUri": "新增URI",
      "postLogoutRedirectUrisLabel": "登出回撥URI (Post-Logout Redirect URIs)",
      "postLogoutRedirectUrisHelp": "OIDC RP-Initiated Logout 後允許跳回的地址，精確匹配。僅登入類客戶端需要，可留空。",
      "postLogoutRedirectUriPlaceholder": "https://example.com/logged-out"
    },
    "table": {
      "clientId": "Client ID",
      "name": "名稱",
      "redirectUris": "回撥URI",
      "status": "狀態",
      "createdAt": "建立時間",
      "actions": "操作",
      "publicTag": "Public",
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
      "descriptionSuffix": "嗎？",
      "cancel": "取消",
      "confirm": "確認"
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
    "statsDialog": {
      "title": "客戶端統計",
      "from": "開始時間",
      "to": "結束時間",
      "bucket": "時間粒度",
      "hour": "按小時",
      "day": "按天",
      "apply": "應用篩選",
      "invalidTimeRange": "開始時間不能晚於結束時間",
      "totalAuthorizations": "總授權",
      "activeAuthorizations": "活躍授權",
      "last30Days": "近30天"
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
      "webhookSaved": "Webhook endpoint 已儲存",
      "webhookDeleted": "Webhook endpoint 已刪除",
      "copyFailedTitle": "複製失敗",
      "copyFailedSecretEmpty": "Secret 為空",
      "copyFailedClipboardUnsupported": "當前環境不支援剪貼簿操作",
      "copied": "已複製到剪貼簿",
      "validation": {
        "clientIdAndNameRequired": "客戶端ID和名稱不能為空",
        "nameRequired": "客戶端名稱不能為空",
        "redirectUriRequired": "請至少填寫一個回撥URI",
        "scopeRequired": "請至少選擇一個Scope",
        "oidcScopeRequiresOpenid": "profile / email 需要與 openid 一起登記"
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
      "readOnlyNoticeDescription": "你可以檢視 Webhook 設定和端點，但修改需要超級管理員許可權。"
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
      "empty": "暫無 webhook endpoint"
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
      "enabledLabel": "啟用當前 endpoint"
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
      "close": "關閉"
    },
    "subscribers": {
      "title": "{id} 的訂閱者",
      "description": "當全域性開關和該 endpoint 開關都開啟時，這些訂閱關係會接收到回撥。",
      "generatedAt": "生成時間：{date}",
      "userId": "使用者 ID",
      "server": "區服",
      "dataType": "資料型別",
      "createdAt": "建立時間",
      "empty": "當前 endpoint 暫無訂閱者"
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
    "title": "贊助者管理",
    "description": "維護贊助者名單展示資料，並控制手動資料是否允許被愛發電同步覆蓋。",
    "generatedAt": "生成時間：{date}",
    "common": {
      "fallback": "—",
      "anonymous": "匿名贊助者"
    },
    "contribution": {
      "amount": "¥{amount}",
      "month": "{count} 個月"
    },
    "actions": {
      "refresh": "重新整理名單",
      "syncAfdian": "從愛發電同步",
      "edit": "編輯資料"
    },
    "stats": {
      "total": "贊助者總數",
      "active": "正在贊助",
      "manualProfile": "手動保護資料"
    },
    "status": {
      "active": "正在贊助",
      "past": "曾經贊助"
    },
    "afdianSync": {
      "enabled": "允許更新",
      "disabled": "不從愛發電更新"
    },
    "list": {
      "title": "贊助者名單",
      "description": "列表按後端返回順序展示；可直接編輯公開資料或保護手動資料。"
    },
    "table": {
      "supporter": "贊助者",
      "tier": "贊助檔位",
      "status": "狀態",
      "source": "來源",
      "lastSupport": "最近贊助",
      "contribution": "贊助貢獻",
      "afdianSync": "愛發電更新",
      "actions": "操作",
      "empty": "暫無贊助者記錄"
    },
    "edit": {
      "title": "編輯贊助者資料",
      "name": "顯示名稱",
      "avatar": "頭像 URL",
      "avatarPlaceholder": "https://example.com/avatar.png",
      "planName": "贊助檔位",
      "source": "來源",
      "paidAt": "最近贊助時間",
      "planExpiresAt": "贊助到期時間",
      "message": "留言",
      "isActive": "標記為正在贊助",
      "afdianSyncDisabled": "不從愛發電更新這個資料",
      "afdianSyncHelp": "開啟後，手動編輯的暱稱、頭像、檔位和留言不會被後續愛發電同步覆蓋。",
      "manualProfileHint": "此處只儲存展示用資料和同步策略；愛發電 API key 與 webhook 配置仍應只存在後端。"
    },
    "toast": {
      "actionFailedFallback": "操作失敗",
      "loadFailedTitle": "載入贊助者失敗",
      "saveFailedTitle": "儲存贊助者失敗",
      "syncFailedTitle": "愛發電同步失敗",
      "saved": "贊助者資料已儲存",
      "synced": "已請求從愛發電同步",
      "afdianSyncDisabled": "已設為不從愛發電更新",
      "afdianSyncEnabled": "已允許從愛發電更新",
      "validation": {
        "nameRequired": "顯示名稱不能為空"
      }
    }
  },
  "adminStatistics": {
    "common": {
      "fallback": "—",
      "success": "成功",
      "failure": "失敗"
    },
    "dashboard": {
      "stat": {
        "totalUsers": "總使用者數",
        "superAdmin": "超級管理員",
        "totalBindings": "遊戲繫結",
        "totalUploads": "總上傳 (全部)"
      },
      "upload24h": {
        "total": "24h 上傳總量",
        "bannedUsers": "被封使用者"
      },
      "chart": {
        "title": "趨勢圖",
        "description": "註冊與上傳趨勢",
        "uploads": "上傳",
        "registrations": "註冊",
        "failures": "上傳失敗",
        "successRate": "成功率",
        "range7d": "近 7 天",
        "range30d": "近 30 天",
        "range90d": "近 90 天",
        "bucketDay": "按日",
        "bucketWeek": "按周",
        "bucketMonth": "按月",
        "empty": "暫無資料"
      },
      "toast": {
        "loadFailedTitle": "載入儀表盤失敗",
        "loadChartFailedTitle": "載入圖表失敗",
        "loadFailedFallback": "載入失敗"
      }
    },
    "systemLogs": {
      "pagination": {
        "prev": "上一頁",
        "next": "下一頁",
        "total": "共 {total} 條日誌"
      },
      "summary": {
        "total": "總日誌"
      },
      "searchPlaceholder": "搜尋日誌…",
      "exportButton": "匯出",
      "table": {
        "result": "結果",
        "action": "操作",
        "request": "方法",
        "user": "使用者",
        "time": "時間",
        "empty": "暫無日誌"
      },
      "detail": {
        "title": "日誌詳情",
        "result": "結果",
        "time": "時間",
        "action": "操作",
        "request": "請求",
        "user": "使用者",
        "detail": "詳情"
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
        "dataType": "資料型別",
        "server": "區服",
        "status": "上傳狀態",
        "sort": "排序",
        "sortPlaceholder": "排序方式",
        "allMethods": "全部方式",
        "allDataTypes": "全部型別",
        "allServers": "全部區服",
        "allStatuses": "全部狀態"
      },
      "actions": {
        "search": "查詢"
      },
      "timeRangeLabel": "時間範圍:",
      "table": {
        "status": "狀態",
        "user": "使用者",
        "server": "區服",
        "method": "方式",
        "dataType": "資料型別",
        "error": "錯誤資訊",
        "viewError": "檢視錯誤",
        "time": "時間",
        "empty": "暫無上傳日誌"
      },
      "errorDialog": {
        "title": "上傳失敗詳情",
        "description": "檢視這次上傳失敗時後端返回的錯誤資訊。",
        "close": "關閉"
      },
      "summary": {
        "totalUploads": "總上傳數",
        "successRate": "成功率"
      },
      "charts": {
        "successRateDistribution": "成功率分佈",
        "byMethod": "按上傳方式",
        "byDataType": "按資料型別",
        "total": "總計"
      },
      "method": {
        "manual": "手動上傳",
        "iosProxy": "iOS代理",
        "iosScript": "iOS指令碼",
        "harukiProxy": "HarukiProxy",
        "inherit": "繼承碼"
      },
      "dataType": {
        "suite": "Suite",
        "mysekai": "MySekai"
      },
      "sort": {
        "uploadTimeDesc": "上傳時間 ↓",
        "uploadTimeAsc": "上傳時間 ↑",
        "idDesc": "ID ↓",
        "idAsc": "ID ↑"
      },
      "toast": {
        "loadFailedTitle": "載入上傳日誌失敗",
        "loadFailedFallback": "載入失敗",
        "filterFailedTitle": "篩選失敗",
        "invalidTimeRange": "開始時間不能晚於結束時間"
      }
    }
  },
  "adminGameBindings": {
    "pagination": {
      "prevPage": "上一頁",
      "nextPage": "下一頁"
    },
    "common": {
      "cancel": "取消",
      "create": "建立"
    },
    "filters": {
      "title": "搜尋與篩選",
      "addButton": "新增繫結",
      "fuzzySearch": "模糊搜尋",
      "fuzzySearchPlaceholder": "遊戲ID / 使用者名稱 / 郵箱",
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
      "selectAll": "全選",
      "selectRow": "選擇該行",
      "selectedCount": "已選 {count} 條",
      "batchUnbind": "批次解綁",
      "openMenu": "開啟選單",
      "total": "共 {total} 條記錄",
      "empty": "暫無遊戲賬號繫結記錄",
      "columns": {
        "server": "區服",
        "gameId": "遊戲ID",
        "user": "所屬使用者",
        "actions": "操作"
      },
      "menu": {
        "edit": "編輯",
        "reassign": "轉移繫結",
        "unbind": "解綁"
      },
      "batchDialog": {
        "title": "確認批次解綁",
        "description": "將解綁選中的 {count} 條遊戲賬號繫結，此操作不可撤銷。",
        "cancel": "取消",
        "confirm": "確認解綁"
      }
    },
    "editDialog": {
      "createTitle": "新增遊戲繫結",
      "createDescription": "為使用者新增新的遊戲賬號繫結。",
      "editTitle": "編輯遊戲繫結",
      "editDescription": "修改遊戲賬號繫結的資料設定。",
      "toolboxUserId": "工具箱使用者ID",
      "toolboxUserIdPlaceholder": "輸入工具箱使用者ID",
      "server": "伺服器",
      "gameUserId": "遊戲使用者ID",
      "gameUserIdPlaceholder": "輸入遊戲內使用者ID",
      "suiteSettingsTitle": "Suite 資料設定",
      "mysekaiSettingsTitle": "MySekai 資料設定"
    },
    "reassignDialog": {
      "title": "轉移遊戲賬號",
      "description": "將 {server} 遊戲 ID {gameId} 從 {fromUser} 轉移到目標使用者。",
      "targetUserIdLabel": "目標使用者ID",
      "targetUserIdPlaceholder": "請輸入目標工具箱使用者ID",
      "confirm": "確認轉移"
    },
    "deleteDialog": {
      "title": "確認解綁",
      "description": "此操作將解除 {server} 遊戲賬號 {gameUserId} 的繫結關係。",
      "confirm": "確認解綁"
    },
    "toast": {
      "loadFailedTitle": "載入遊戲繫結失敗",
      "loadFailedFallback": "載入失敗",
      "unbound": "已解綁",
      "unbindFailedTitle": "解綁失敗",
      "reassigned": "已轉移",
      "reassignFailedTitle": "轉移失敗",
      "batchUnbindFailedTitle": "批次解綁失敗",
      "invalidSelectedRecords": "選中的記錄格式無效",
      "batchUnbound": "已批次解綁 {count} 條",
      "bindingUpdated": "繫結已更新",
      "bindingCreated": "繫結已建立",
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
      "deleted": "已刪除"
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
      "unbound": "未繫結",
      "openMenu": "開啟選單"
    },
    "management": {
      "title": "使用者管理",
      "filters": {
        "searchLabel": "搜尋",
        "searchPlaceholder": "搜尋使用者名稱、郵箱或 ID…",
        "roleLabel": "角色",
        "roleAll": "全部",
        "statusLabel": "賬號狀態",
        "statusAll": "全部",
        "allowCNLabel": "國服 MySekai 許可權",
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
        "createdToPlaceholder": "按結束時間過濾"
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
        "allowCNButton": "批次國服 MySekai 許可權",
        "allowCNTitle": "修改選中使用者的國服 MySekai 許可權",
        "allowCNPlaceholder": "修改許可權狀態",
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
          "email": "郵箱",
          "role": "角色",
          "allowCN": "國服 MySekai 許可權",
          "status": "賬號狀態",
          "createdAt": "註冊時間"
        },
        "empty": "暫無使用者資料",
        "loadError": "載入使用者列表失敗",
        "retry": "重試"
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
        "batchAllowCNSuccess": "已批次修改 {count} 個國服功能許可權",
        "batchAllowCNFailedTitle": "批次功能許可權失敗",
        "batchAllowCNFailedFallback": "批次功能許可權失敗"
      }
    },
    "detail": {
      "backToList": "返回使用者列表",
      "notFound": "使用者不存在或載入失敗",
      "tabs": {
        "info": "基本資訊",
        "activity": "活動記錄",
        "oauth": "OAuth 授權",
        "game": "遊戲繫結",
        "social": "社交平臺",
        "authSocial": "授權社交",
        "ios": "iOS 上傳碼"
      },
      "info": {
        "role": "角色",
        "accountStatus": "賬號狀態",
        "email": "郵箱",
        "registeredAt": "註冊時間",
        "comingSoon": "開發中...",
        "changeRole": "修改角色：",
        "allowCNFeature": "允許使用國服 MySekai 功能",
        "unban": "解封",
        "ban": "封禁",
        "banDialogTitle": "確認封禁",
        "banDialogDescription": "確定要封停用戶 {name} 嗎？",
        "forceLogout": "強制登出",
        "resetPassword": "重置密碼",
        "restore": "恢復",
        "delete": "刪除",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "此操作是軟刪除，可以恢復。確定要刪除使用者 {name} 嗎？",
        "deleteDialogConfirm": "確認刪除"
      },
      "activity": {
        "title": "活動記錄",
        "uploadLogsTitle": "上傳日誌",
        "uploadLogsDescription": "該使用者最近的上傳記錄，包括失敗時後端返回的錯誤詳情。",
        "columns": {
          "action": "操作",
          "result": "結果",
          "path": "路徑",
          "time": "時間"
        },
        "empty": "暫無活動記錄"
      },
      "oauth": {
        "title": "OAuth 授權",
        "revokeAll": "撤銷全部",
        "total": "共 {count} 個授權",
        "empty": "暫無 OAuth 授權",
        "revokeAllDialogTitle": "撤銷全部授權",
        "revokeAllDialogDescription": "此操作將撤銷該使用者的全部 OAuth 授權，並使其從所有已連線的第三方應用登出。是否繼續？"
      },
      "game": {
        "title": "遊戲賬號繫結",
        "add": "新增繫結",
        "columns": {
          "server": "伺服器",
          "gameId": "遊戲 ID"
        },
        "edit": "編輯遊戲繫結",
        "unbind": "解綁遊戲賬號",
        "empty": "暫無遊戲繫結",
        "unbindDialogTitle": "確認解綁",
        "unbindDialogDescription": "此操作將解綁遊戲賬號 {gameUserId}，之後可重新新增。"
      },
      "social": {
        "title": "社交平臺繫結",
        "add": "新增繫結",
        "empty": "暫無社交平臺繫結",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "確定要刪除此主社交平臺繫結嗎？之後可重新新增。"
      },
      "authSocial": {
        "title": "授權社交平臺",
        "add": "新增授權",
        "columns": {
          "platform": "平臺",
          "userId": "使用者 ID",
          "comment": "備註"
        },
        "empty": "暫無授權社交平臺",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "確定要刪除此授權社交平臺嗎？之後可重新新增。"
      },
      "ios": {
        "title": "iOS 上傳碼",
        "regenerate": "重新生成",
        "generate": "生成上傳碼",
        "empty": "暫無上傳碼",
        "deleteDialogTitle": "確認刪除",
        "deleteDialogDescription": "確定要刪除當前的 iOS 上傳碼嗎？之後可重新生成一個新的。"
      },
      "dialog": {
        "email": {
          "title": "修改郵箱",
          "description": "修改使用者 {name} 的郵箱地址。",
          "newEmail": "新郵箱地址",
          "placeholder": "請輸入郵箱地址",
          "confirm": "確認修改"
        },
        "gameBinding": {
          "title": "新增遊戲繫結",
          "description": "為使用者 {name} 新增或更新遊戲賬號繫結。",
          "server": "伺服器",
          "gameUserId": "遊戲使用者 ID",
          "gameUserIdPlaceholder": "輸入遊戲內使用者 ID",
          "suiteSettings": "Suite 資料設定",
          "mysekaiSettings": "MySekai 資料設定"
        },
        "social": {
          "addTitle": "新增社交平臺繫結",
          "editTitle": "編輯社交平臺繫結",
          "description": "管理使用者 {name} 的社交平臺主繫結資訊。",
          "platform": "平臺",
          "platformPlaceholder": "選擇平臺",
          "userId": "使用者 ID",
          "userIdPlaceholder": "平臺上的使用者 ID"
        },
        "authSocial": {
          "addTitle": "新增授權社交平臺",
          "editTitle": "編輯授權社交平臺",
          "description": "管理使用者 {name} 的授權社交平臺賬號。",
          "platform": "平臺",
          "platformPlaceholder": "選擇平臺",
          "userId": "使用者 ID",
          "userIdPlaceholder": "平臺上的使用者 ID",
          "comment": "備註",
          "commentPlaceholder": "備註（可選）"
        }
      },
      "toast": {
        "actionFailedFallback": "操作失敗",
        "loadUserFailedTitle": "載入使用者詳情失敗",
        "loadActivityFailedTitle": "載入活動記錄失敗",
        "loadOAuthFailedTitle": "載入 OAuth 授權失敗",
        "loadGameBindingsFailedTitle": "載入遊戲繫結失敗",
        "loadSocialFailedTitle": "載入社交平臺繫結失敗",
        "loadAuthSocialFailedTitle": "載入授權社交平臺失敗",
        "banFailedTitle": "封禁失敗",
        "banSuccess": "已封停用戶",
        "unbanFailedTitle": "解封失敗",
        "unbanSuccess": "已解封使用者",
        "forceLogoutFailedTitle": "強制登出失敗",
        "forceLogoutSuccess": "已強制登出",
        "deleteFailedTitle": "刪除失敗",
        "deleteSuccess": "已軟刪除使用者",
        "restoreFailedTitle": "恢復失敗",
        "restoreSuccess": "已恢復使用者",
        "resetPasswordFailedTitle": "重置密碼失敗",
        "resetPasswordSuccess": "已重置密碼",
        "updateRoleFailedTitle": "更新角色失敗",
        "updateRoleSuccess": "已更新角色為 {role}",
        "updateEmailFailedTitle": "更新郵箱失敗",
        "updateEmailSuccess": "郵箱已更新",
        "revokeOAuthFailedTitle": "撤銷失敗",
        "revokeOAuthSuccess": "已撤銷 OAuth 授權",
        "deleteGameBindingFailedTitle": "刪除失敗",
        "deleteGameBindingSuccess": "已刪除遊戲繫結",
        "toggleCNFailedTitle": "更新失敗",
        "cnEnabled": "已開啟國服 MySekai",
        "cnDisabled": "已關閉國服 MySekai",
        "saveGameBindingFailedTitle": "儲存失敗",
        "saveGameBindingSuccess": "遊戲繫結已儲存",
        "regenerateIOSFailedTitle": "生成失敗",
        "missingIOSCode": "介面未返回上傳碼",
        "regenerateIOSSuccess": "已重新生成 iOS 上傳碼",
        "deleteIOSFailedTitle": "刪除失敗",
        "deleteIOSSuccess": "已刪除 iOS 上傳碼",
        "deleteSocialFailedTitle": "刪除失敗",
        "deleteSocialSuccess": "已刪除社交平臺繫結",
        "saveSocialFailedTitle": "更新失敗",
        "saveSocialSuccess": "社交平臺資訊已更新",
        "deleteAuthSocialFailedTitle": "刪除失敗",
        "deleteAuthSocialSuccess": "已刪除授權社交平臺",
        "saveAuthSocialFailedTitle": "儲存失敗",
        "saveAuthSocialSuccess": "授權社交平臺已儲存"
      }
    }
  }
} as const
