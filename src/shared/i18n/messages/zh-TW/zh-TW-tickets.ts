// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: tickets
export default {
  "tickets": {
    "common": {
      "dateFallback": "—",
      "unknownValue": "未知"
    },
    "systemMessage": {
      "statusChanged": "狀態已更新為「{status}」"
    },
    "status": {
      "open": "已開啟",
      "inProgress": "處理中",
      "pendingAdmin": "待管理員處理",
      "pendingUser": "待使用者回覆",
      "resolved": "已解決",
      "closed": "已關閉"
    },
    "userStatus": {
      "all": "全部",
      "open": "待處理",
      "pendingAdmin": "處理中",
      "pendingUser": "等你回覆",
      "resolved": "已解決",
      "closed": "已關閉"
    },
    "userStatusHint": {
      "waitingAdmin": "已收到，等待管理員處理",
      "waitingAdminAssigned": "管理員已接手，回覆會顯示在溝通記錄裡",
      "waitingUser": "管理員已回覆，請補充資訊或確認",
      "resolved": "確認處理完畢可以關閉工單",
      "closed": "有新問題請新建工單"
    },
    "time": {
      "justNow": "剛剛"
    },
    "priority": {
      "low": "低",
      "normal": "普通",
      "medium": "中",
      "high": "高",
      "urgent": "緊急"
    },
    "category": {
      "upload": "上傳問題",
      "account": "帳號問題",
      "bug": "Bug反饋",
      "feature": "功能建議",
      "other": "其他"
    },
    "filters": {
      "allStatus": "全部狀態",
      "allPriorities": "全部優先順序"
    },
    "list": {
      "title": "我的工單",
      "createButton": "建立工單",
      "filterLabel": "按狀態篩選",
      "waitingCount": "{count} 個工單等你回覆",
      "refresh": "重新整理",
      "loading": "正在載入工單…",
      "empty": "還沒有工單",
      "emptyFiltered": "沒有「{status}」的工單",
      "showAll": "檢視全部工單",
      "total": "共 {total} 個工單",
      "columns": {
        "ticket": "工單",
        "status": "狀態"
      },
      "updatedAt": "最近更新",
      "priorityTag": "{priority}優先順序",
      "assigned": "已有管理員跟進",
      "createdOn": "建立於 {date}",
      "closedOn": "關閉於 {date}",
      "pagination": {
        "label": "工單分頁",
        "page": "第 {page} / {total} 頁",
        "prevPage": "上一頁",
        "nextPage": "下一頁"
      },
      "toast": {
        "loadFailedTitle": "載入工單列表失敗",
        "loadFailedFallback": "請檢查網路後重試"
      }
    },
    "create": {
      "backButton": "返回工單列表",
      "title": "建立工單",
      "submit": "提交工單",
      "submitting": "提交中...",
      "typeTitle": "問題類型",
      "contentTitle": "問題內容",
      "count": "{count} / {max}",
      "fields": {
        "subject": "主題",
        "subjectPlaceholder": "一句話說明問題，如：上傳資料失敗",
        "category": "分類",
        "priority": "優先順序",
        "priorityHint": "緊急僅用於影響登入、資料或主要功能的問題",
        "message": "描述",
        "messagePlaceholder": "詳細描述遇到的問題…"
      },
      "guide": {
        "upload": "寫明區服、上傳方式（模組、抓包或引繼碼）、出現時間和錯誤提示",
        "account": "寫明受影響的帳號 ID、區服、出現時間和錯誤提示",
        "bug": "寫明操作步驟、預期和實際結果，以及裝置和瀏覽器",
        "feature": "說明使用場景，以及現在哪裡不方便",
        "other": "寫明出現時間、操作步驟、錯誤提示或相關連結"
      },
      "tips": {
        "title": "提交之前",
        "usage": "使用方法和教程類問題請到{link}提問",
        "usageLink": "推薦群聊",
        "secrets": "不要填寫密碼、引繼碼等敏感資訊，管理員不會索要"
      },
      "toast": {
        "subjectRequired": "請輸入工單主題",
        "messageRequired": "請輸入工單描述",
        "subjectTooLong": "主題最多 {max} 個字元",
        "messageTooLong": "描述最多 {max} 個字元",
        "loginRequired": "請先登入",
        "createSuccess": "工單已建立",
        "createFailedTitle": "建立工單失敗",
        "createFailedFallback": "工單未建立，請稍後重試"
      }
    },
    "detail": {
      "backButton": "返回工單列表",
      "prioritySuffix": "優先順序",
      "createdAt": "建立於 {date}",
      "infoTitle": "工單資訊",
      "summary": {
        "category": "分類",
        "priority": "優先順序",
        "createdAt": "建立時間",
        "updatedAt": "最近更新",
        "closedAt": "關閉時間",
        "ticketId": "工單編號"
      },
      "copyId": "複製工單編號",
      "idCopied": "已複製工單編號",
      "copyFailed": "複製失敗",
      "threadTitle": "溝通記錄",
      "messageCount": "{count} 條訊息",
      "showEarlier": "顯示更早的 {count} 條訊息",
      "refresh": "重新整理",
      "selfSender": "你",
      "adminSender": "管理員",
      "noMessages": "暫無訊息",
      "replyLabel": "回覆",
      "inputPlaceholder": "回覆管理員…",
      "composeHint": "Enter 傳送，Shift+Enter 換行",
      "reopenHint": "回覆後工單會重新開啟",
      "replyTooLong": "回覆最多 {max} 個字元",
      "sentState": "已傳送",
      "sendButton": "傳送",
      "closedHint": "工單已關閉，無法繼續回覆",
      "newTicket": "建立新工單",
      "closeButton": "關閉工單",
      "closeDialog": {
        "title": "確認關閉工單",
        "description": "關閉後無法繼續回覆",
        "cancel": "取消",
        "confirm": "確認關閉"
      },
      "notFound": "工單不存在",
      "notFoundDescription": "可能已被刪除，或不屬於當前帳號",
      "toast": {
        "loadFailedTitle": "載入工單詳情失敗",
        "loadFailedFallback": "請檢查網路後重試",
        "sendFailedTitle": "傳送失敗",
        "sendFailedFallback": "訊息未發出，內容已保留，請重試",
        "closeSuccess": "工單已關閉",
        "closeFailedTitle": "關閉失敗",
        "closeFailedFallback": "工單未關閉，請稍後重試"
      }
    },
    "adminList": {
      "title": "工單管理",
      "description": "快速篩選待處理、未分配和高優先順序工單",
      "searchPlaceholder": "搜尋工單…",
      "refreshButton": "重新整理",
      "unassigned": "未分配",
      "empty": "暫無工單",
      "emptyFiltered": "沒有符合篩選條件的工單",
      "total": "共 {total} 個工單",
      "stats": {
        "label": "工單統計",
        "labelCount": "{label} {count}",
        "openDetail": "新提交、尚未處理",
        "mine": "分配給我",
        "totalDetail": "未結 {active} · 已結 {done}",
        "byStatus": "按狀態",
        "byPriority": "按優先順序",
        "byCategory": "按分類",
        "scopeAll": "全部 {total} 個工單",
        "scopeAllUnknown": "全部工單",
        "scopePage": "僅本頁顯示的 {count} 個工單",
        "share": "{count} · {percent}%",
        "empty": "暫無資料",
        "loadFailed": "統計資料載入失敗",
        "partialFailed": "統計資料沒有全部加載出來"
      },
      "quickFilters": {
        "all": "全部工單",
        "pendingAdmin": "待管理員處理",
        "pendingUser": "待使用者回覆",
        "unassigned": "未分配",
        "mine": "我的工單",
        "highOrUrgent": "高優先順序"
      },
      "table": {
        "subject": "主題",
        "people": "建立者 / 處理人",
        "category": "分類",
        "status": "狀態",
        "priority": "優先順序",
        "creator": "建立者",
        "assignee": "處理人",
        "lastMessage": "最近動態",
        "updatedAt": "更新時間"
      },
      "lastMessage": {
        "admin": "管理員",
        "user": "使用者",
        "system": "系統",
        "internal": "內部",
        "none": "暫無動態"
      },
      "notifications": {
        "title": "通知",
        "label": "工單郵件通知",
        "description": "開啟後接收新工單和使用者回覆提醒",
        "manageButton": "管理接收者",
        "manageHelp": "選擇哪些管理員接收工單郵件提醒",
        "manageDialogTitle": "工單通知接收者",
        "manageDialogDescription": "選擇哪些管理員會收到使用者建立工單和使用者回覆工單的郵件提醒。使用者只會收到管理員公開回復提醒。",
        "manageDialogSummary": "當前顯示 {total} 個管理員帳號",
        "manageRefresh": "重新整理",
        "manageLoading": "正在載入接收者…",
        "manageEmpty": "暫無可管理的管理員帳號",
        "manageBannedHint": "帳號已封禁，當前不會接收通知",
        "manageTable": {
          "name": "管理員",
          "role": "角色",
          "email": "信箱",
          "enabled": "接收通知"
        },
        "loadFailedTitle": "載入通知設定失敗",
        "loadFailedFallback": "載入失敗",
        "saveFailedTitle": "儲存通知設定失敗",
        "saveFailedFallback": "儲存失敗",
        "enabledToast": "已開啟工單郵件通知",
        "disabledToast": "已關閉工單郵件通知",
        "manageLoadFailedTitle": "載入通知接收者失敗",
        "manageLoadFailedFallback": "載入失敗",
        "manageSaveFailedTitle": "儲存接收者設定失敗",
        "manageSaveFailedFallback": "儲存失敗",
        "manageEnabledToast": "已開啟 {name} 的工單郵件通知",
        "manageDisabledToast": "已關閉 {name} 的工單郵件通知"
      },
      "toast": {
        "loadFailedTitle": "載入工單列表失敗",
        "loadFailedFallback": "載入失敗"
      }
    },
    "adminDetail": {
      "backButton": "返回工單列表",
      "prioritySuffix": "優先順序",
      "creator": "使用者: {creator}",
      "unknownUser": "未知",
      "createdAt": "建立於 {date}",
      "summary": {
        "category": "分類",
        "priority": "優先順序",
        "creator": "建立者",
        "assignee": "處理人",
        "createdAt": "建立時間",
        "updatedAt": "最近更新",
        "lastMessageAt": "最近訊息",
        "closedAt": "關閉時間"
      },
      "viewUser": "檢視 {name} 的使用者資料",
      "stats": {
        "label": "會話概況",
        "userMessages": "使用者訊息",
        "adminReplies": "公開回復",
        "internalNotes": "內部備註 {count}",
        "firstResponse": "首次響應用時",
        "firstResponseNone": "尚未回覆",
        "firstResponseDetail": "從建立到首條公開回復",
        "waitingAdmin": "使用者已等待",
        "waitingAdminDetail": "自使用者最後一條訊息起",
        "waitingUser": "等待使用者回覆",
        "waitingUserDetail": "自最後一條公開回復起",
        "closedAfter": "處理時長",
        "closedAfterDetail": "從建立到關閉",
        "waitingNone": "當前等待"
      },
      "duration": {
        "days": "{days} 天 {hours} 小時",
        "hours": "{hours} 小時 {minutes} 分",
        "minutes": "{minutes} 分鐘",
        "moment": "不到 1 分鐘"
      },
      "system": {
        "statusChanged": "狀態由「{from}」變更為「{to}」",
        "assigneeChanged": "處理人由 {from} 變更為 {to}",
        "assigned": "已分配給 {to}",
        "assigneeCleared": "已取消分配（原處理人 {from}）"
      },
      "actionsTitle": "處理操作",
      "actionsDescription": "更新工單狀態或分配處理人",
      "statusChangeLabel": "變更狀態",
      "assigneeLabel": "處理人",
      "assigneePlaceholder": "選擇處理人",
      "assigneeLoading": "正在載入處理人列表…",
      "assigneeLoadFailedHint": "處理人列表載入失敗",
      "retryLoadAssignees": "重試",
      "unassigned": "未分配",
      "assignButton": "分配",
      "adminSender": "管理員",
      "userSender": "使用者",
      "systemSender": "系統",
      "internalTag": "內部備註",
      "messagesTitle": "溝通記錄",
      "messagesDescription": "公開回復會傳送給使用者，內部備註僅管理員可見",
      "noMessages": "暫無訊息",
      "compose": {
        "replyTitle": "回覆使用者",
        "internalTitle": "內部備註"
      },
      "internalInputPlaceholder": "輸入內部備註（僅管理員可見）…",
      "replyInputPlaceholder": "輸入回覆…",
      "noteButton": "備註",
      "sendButton": "傳送",
      "internalSwitchLabel": "內部備註（僅管理員可見）",
      "notFound": "工單不存在，可能已被刪除或連結有誤",
      "toast": {
        "loadFailedTitle": "載入工單詳情失敗",
        "loadFailedFallback": "載入失敗",
        "sendFailedTitle": "傳送失敗",
        "sendFailedFallback": "傳送失敗",
        "statusUpdated": "狀態已更新為 {status}",
        "updateStatusFailedTitle": "更新狀態失敗",
        "updateStatusFailedFallback": "更新失敗",
        "assigned": "已分配處理人",
        "unassigned": "已取消分配",
        "assignFailedTitle": "分配失敗",
        "assignFailedFallback": "分配失敗",
        "loadAssigneesFailedTitle": "載入處理人列表失敗",
        "loadAssigneesFailedFallback": "無法載入可分配的管理員列表"
      }
    }
  }
} as const
