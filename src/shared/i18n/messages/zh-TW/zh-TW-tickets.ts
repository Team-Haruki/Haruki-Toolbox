// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: tickets
export default {
  "tickets": {
    "common": {
      "dateFallback": "—"
    },
    "status": {
      "open": "已開啟",
      "inProgress": "處理中",
      "pendingAdmin": "待管理員處理",
      "pendingUser": "待使用者回覆",
      "resolved": "已解決",
      "closed": "已關閉"
    },
    "userStatusHint": {
      "waitingAdmin": "我們已經收到你的工單，目前等待管理員處理。",
      "waitingUser": "管理員已回覆，等待你補充資訊或確認後續處理。",
      "resolved": "此工單已標記為已解決，如問題確認處理完畢可以關閉工單。",
      "closed": "此工單已關閉，如還有新問題請重新建立工單。"
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
      "account": "賬號問題",
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
      "description": "檢視處理進度，並在需要時補充說明。",
      "createButton": "建立工單",
      "empty": "暫無工單，點選上方按鈕建立",
      "total": "共 {total} 個工單",
      "updatedAt": "更新",
      "toast": {
        "loadFailedTitle": "載入工單列表失敗",
        "loadFailedFallback": "載入失敗"
      }
    },
    "create": {
      "backButton": "返回工單列表",
      "title": "建立工單",
      "description": "把關鍵資訊寫清楚，管理員會更容易判斷下一步。",
      "submit": "提交工單",
      "submitting": "提交中...",
      "fields": {
        "subject": "主題",
        "subjectPlaceholder": "請簡要描述您的問題",
        "subjectHint": "例如：上傳資料失敗、無法繫結賬號、OAuth 回撥異常。",
        "category": "分類",
        "categoryHint": "選擇最接近的分類即可，不確定可以選其他。",
        "priority": "優先順序",
        "priorityHint": "緊急優先順序請留給影響登入、資料或主要功能的問題。",
        "message": "描述",
        "messagePlaceholder": "請詳細描述您遇到的問題…",
        "messageHint": "建議包含賬號 ID、伺服器、出現時間、操作步驟、錯誤提示或相關連結。"
      },
      "toast": {
        "subjectRequired": "請輸入工單主題",
        "messageRequired": "請輸入工單描述",
        "loginRequired": "請先登入",
        "createSuccess": "工單已建立",
        "createFailedTitle": "建立工單失敗",
        "createFailedFallback": "建立失敗"
      }
    },
    "detail": {
      "backButton": "返回工單列表",
      "prioritySuffix": "優先順序",
      "createdAt": "創建於 {date}",
      "summary": {
        "category": "分類",
        "priority": "優先順序",
        "createdAt": "建立時間",
        "updatedAt": "最近更新"
      },
      "adminSender": "管理員",
      "noMessages": "暫無訊息",
      "inputPlaceholder": "補充說明或回覆管理員…",
      "sendButton": "傳送",
      "closedHint": "工單已關閉，無法傳送訊息",
      "closeButton": "關閉工單",
      "closeDialog": {
        "title": "確認關閉工單",
        "description": "關閉後將無法繼續傳送訊息。確認關閉？",
        "cancel": "取消",
        "confirm": "確認關閉"
      },
      "notFound": "工單不存在或載入失敗",
      "toast": {
        "loadFailedTitle": "載入工單詳情失敗",
        "loadFailedFallback": "載入失敗",
        "sendFailedTitle": "傳送失敗",
        "sendFailedFallback": "傳送失敗",
        "closeSuccess": "工單已關閉",
        "closeFailedTitle": "關閉失敗",
        "closeFailedFallback": "關閉失敗"
      }
    },
    "adminList": {
      "pagination": {
        "prevPage": "上一頁",
        "nextPage": "下一頁"
      },
      "title": "工單管理",
      "description": "快速篩選待處理、未分配和高優先順序工單。",
      "searchPlaceholder": "搜尋工單…",
      "refreshButton": "重新整理",
      "unassigned": "未分配",
      "empty": "暫無工單",
      "total": "共 {total} 個工單",
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
        "label": "工單郵件通知",
        "description": "開啟後接收新工單和使用者回覆提醒",
        "manageButton": "管理接收者",
        "manageDialogTitle": "工單通知接收者",
        "manageDialogDescription": "選擇哪些管理員會收到使用者建立工單和使用者回覆工單的郵件提醒。使用者只會收到管理員公開回復提醒。",
        "manageDialogSummary": "當前顯示 {total} 個管理員賬號",
        "manageRefresh": "重新整理",
        "manageLoading": "正在載入接收者…",
        "manageEmpty": "暫無可管理的管理員賬號",
        "manageBannedHint": "賬號已封禁，當前不會接收通知",
        "manageTable": {
          "name": "管理員",
          "role": "角色",
          "email": "郵箱",
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
      "createdAt": "創建於 {date}",
      "summary": {
        "category": "分類",
        "priority": "優先順序",
        "creator": "建立者",
        "assignee": "處理人",
        "createdAt": "建立時間",
        "updatedAt": "最近更新"
      },
      "actionsTitle": "處理操作",
      "actionsDescription": "更新工單狀態或分配處理人。",
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
      "messagesDescription": "公開回復會傳送給使用者，內部備註僅管理員可見。",
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
      "notFound": "工單不存在或載入失敗",
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
