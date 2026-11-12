// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: tickets
export default {
  "tickets": {
    "common": {
      "dateFallback": "—",
      "unknownValue": "未知"
    },
    "systemMessage": {
      "statusChanged": "状态已更新为「{status}」"
    },
    "status": {
      "open": "已开启",
      "inProgress": "处理中",
      "pendingAdmin": "待管理员处理",
      "pendingUser": "待用户回复",
      "resolved": "已解决",
      "closed": "已关闭"
    },
    "userStatus": {
      "all": "全部",
      "open": "待处理",
      "pendingAdmin": "处理中",
      "pendingUser": "等你回复",
      "resolved": "已解决",
      "closed": "已关闭"
    },
    "userStatusHint": {
      "waitingAdmin": "我们已经收到你的工单，目前等待管理员处理。",
      "waitingAdminAssigned": "已有管理员接手你的工单，回复会显示在下方的沟通记录里。",
      "waitingUser": "管理员已回复，等待你补充信息或确认后续处理。",
      "resolved": "此工单已标记为已解决。问题还在的话直接回复即可，确认处理完毕可以关闭工单。",
      "closed": "此工单已关闭，如还有新问题请重新创建工单。"
    },
    "time": {
      "justNow": "刚刚"
    },
    "priority": {
      "low": "低",
      "normal": "普通",
      "medium": "中",
      "high": "高",
      "urgent": "紧急"
    },
    "category": {
      "upload": "上传问题",
      "account": "账号问题",
      "bug": "Bug反馈",
      "feature": "功能建议",
      "other": "其他"
    },
    "filters": {
      "allStatus": "全部状态",
      "allPriorities": "全部优先级"
    },
    "list": {
      "title": "我的工单",
      "description": "查看处理进度，并在需要时补充说明。",
      "createButton": "创建工单",
      "filterLabel": "按状态筛选",
      "waitingCount": "{count} 个工单等你回复",
      "refresh": "刷新",
      "loading": "正在加载工单…",
      "empty": "还没有工单",
      "emptyDescription": "遇到 Bug、账号问题或有建议时，可以创建工单联系管理员。",
      "emptyFiltered": "没有「{status}」的工单",
      "showAll": "查看全部工单",
      "total": "共 {total} 个工单",
      "columns": {
        "ticket": "工单",
        "status": "状态"
      },
      "updatedAt": "最近更新",
      "priorityTag": "{priority}优先级",
      "assigned": "已有管理员跟进",
      "createdOn": "创建于 {date}",
      "closedOn": "关闭于 {date}",
      "pagination": {
        "label": "工单分页",
        "page": "第 {page} / {total} 页",
        "prevPage": "上一页",
        "nextPage": "下一页"
      },
      "toast": {
        "loadFailedTitle": "加载工单列表失败",
        "loadFailedFallback": "请检查网络后重试；多次失败可能是服务暂时不可用，请稍后再试。"
      }
    },
    "create": {
      "backButton": "返回工单列表",
      "title": "创建工单",
      "description": "工单用于反馈 Bug、处理工具箱账号相关的问题和提出建议，不提供使用教程指导。把关键信息写清楚，管理员会更容易判断下一步。",
      "submit": "提交工单",
      "submitting": "提交中...",
      "typeTitle": "问题类型",
      "contentTitle": "问题内容",
      "count": "{count} / {max}",
      "fields": {
        "subject": "主题",
        "subjectPlaceholder": "一句话说明遇到的问题",
        "subjectHint": "例如：上传数据失败、无法绑定账号、无法授权第三方应用。",
        "category": "分类",
        "categoryHint": "选择最接近的分类即可，不确定可以选其他。",
        "priority": "优先级",
        "priorityHint": "紧急优先级请留给影响登录、数据或主要功能的问题。",
        "message": "描述",
        "messagePlaceholder": "详细描述遇到的问题…"
      },
      "guide": {
        "upload": "建议写明区服、上传方式（模块、抓包或引继码）、出现时间和页面上的错误提示。",
        "account": "建议写明受影响的账号 ID、区服、出现时间和页面上的错误提示。",
        "bug": "建议写明操作步骤、预期结果和实际结果，以及使用的设备和浏览器。",
        "feature": "建议说明使用场景，以及现在是怎么做的、哪里不方便。",
        "other": "建议写明出现时间、操作步骤、错误提示或相关链接。"
      },
      "tips": {
        "title": "提交之前",
        "usage": "使用方法和教程类问题请到{link}提问。",
        "usageLink": "推荐群聊",
        "secrets": "不要在工单里填写密码、引继码等敏感信息，管理员不会向你索要。",
        "oneIssue": "一个工单只说一个问题，方便跟进和回复。",
        "followUp": "提交后可以在工单里继续补充；管理员回复后，侧边栏的「我的工单」会出现提醒。"
      },
      "toast": {
        "subjectRequired": "请输入工单主题",
        "messageRequired": "请输入工单描述",
        "subjectTooLong": "主题最多 {max} 个字符",
        "messageTooLong": "描述最多 {max} 个字符",
        "loginRequired": "请先登录",
        "createSuccess": "工单已创建",
        "createFailedTitle": "创建工单失败",
        "createFailedFallback": "工单未创建，请检查主题和描述后重试；多次失败请稍后再试。"
      }
    },
    "detail": {
      "backButton": "返回工单列表",
      "prioritySuffix": "优先级",
      "createdAt": "创建于 {date}",
      "infoTitle": "工单信息",
      "summary": {
        "category": "分类",
        "priority": "优先级",
        "createdAt": "创建时间",
        "updatedAt": "最近更新",
        "closedAt": "关闭时间",
        "ticketId": "工单编号"
      },
      "copyId": "复制工单编号",
      "idCopied": "已复制工单编号",
      "copyFailed": "复制失败",
      "threadTitle": "沟通记录",
      "messageCount": "{count} 条消息",
      "showEarlier": "显示更早的 {count} 条消息",
      "refresh": "刷新",
      "selfSender": "你",
      "adminSender": "管理员",
      "noMessages": "暂无消息",
      "replyLabel": "回复",
      "inputPlaceholder": "回复管理员…",
      "composeHint": "Enter 发送，Shift+Enter 换行",
      "reopenHint": "回复后工单会重新打开，由管理员继续处理。",
      "replyTooLong": "回复最多 {max} 个字符",
      "sentState": "已发送",
      "sendButton": "发送",
      "closedHint": "工单已关闭，无法继续回复。",
      "newTicket": "创建新工单",
      "closeButton": "关闭工单",
      "closeDialog": {
        "title": "确认关闭工单",
        "description": "关闭后将无法继续发送消息。确认关闭？",
        "cancel": "取消",
        "confirm": "确认关闭"
      },
      "notFound": "工单不存在",
      "notFoundDescription": "这个工单可能已被删除，或不属于当前登录的账号。",
      "toast": {
        "loadFailedTitle": "加载工单详情失败",
        "loadFailedFallback": "请检查网络后重试；多次失败可能是服务暂时不可用，请稍后再试。",
        "sendFailedTitle": "发送失败",
        "sendFailedFallback": "消息没有发出去，内容已保留，请检查网络后重新点击发送。",
        "closeSuccess": "工单已关闭",
        "closeFailedTitle": "关闭失败",
        "closeFailedFallback": "工单没有关闭，请稍后重试；如果工单已处理完毕也可以直接留着。"
      }
    },
    "adminList": {
      "title": "工单管理",
      "description": "快速筛选待处理、未分配和高优先级工单。",
      "searchPlaceholder": "搜索工单…",
      "refreshButton": "刷新",
      "unassigned": "未分配",
      "empty": "暂无工单",
      "emptyFiltered": "没有符合筛选条件的工单",
      "total": "共 {total} 个工单",
      "stats": {
        "label": "工单统计",
        "labelCount": "{label} {count}",
        "openDetail": "新提交、尚未处理",
        "mine": "分配给我",
        "totalDetail": "未结 {active} · 已结 {done}",
        "byStatus": "按状态",
        "byPriority": "按优先级",
        "byCategory": "按分类",
        "scopeAll": "全部 {total} 个工单",
        "scopeAllUnknown": "全部工单",
        "scopePage": "仅本页显示的 {count} 个工单",
        "share": "{count} · {percent}%",
        "empty": "暂无数据",
        "loadFailed": "统计数据加载失败",
        "partialFailed": "统计数据没有全部加载出来。"
      },
      "quickFilters": {
        "all": "全部工单",
        "pendingAdmin": "待管理员处理",
        "pendingUser": "待用户回复",
        "unassigned": "未分配",
        "mine": "我的工单",
        "highOrUrgent": "高优先级"
      },
      "table": {
        "subject": "主题",
        "people": "创建者 / 处理人",
        "category": "分类",
        "status": "状态",
        "priority": "优先级",
        "creator": "创建者",
        "assignee": "处理人",
        "lastMessage": "最近动态",
        "updatedAt": "更新时间"
      },
      "lastMessage": {
        "admin": "管理员",
        "user": "用户",
        "system": "系统",
        "internal": "内部",
        "none": "暂无动态"
      },
      "notifications": {
        "title": "通知",
        "label": "工单邮件通知",
        "description": "开启后接收新工单和用户回复提醒",
        "manageButton": "管理接收者",
        "manageHelp": "选择哪些管理员接收工单邮件提醒",
        "manageDialogTitle": "工单通知接收者",
        "manageDialogDescription": "选择哪些管理员会收到用户创建工单和用户回复工单的邮件提醒。用户只会收到管理员公开回复提醒。",
        "manageDialogSummary": "当前显示 {total} 个管理员账号",
        "manageRefresh": "刷新",
        "manageLoading": "正在加载接收者…",
        "manageEmpty": "暂无可管理的管理员账号",
        "manageBannedHint": "账号已封禁，当前不会接收通知",
        "manageTable": {
          "name": "管理员",
          "role": "角色",
          "email": "邮箱",
          "enabled": "接收通知"
        },
        "loadFailedTitle": "加载通知设置失败",
        "loadFailedFallback": "加载失败",
        "saveFailedTitle": "保存通知设置失败",
        "saveFailedFallback": "保存失败",
        "enabledToast": "已开启工单邮件通知",
        "disabledToast": "已关闭工单邮件通知",
        "manageLoadFailedTitle": "加载通知接收者失败",
        "manageLoadFailedFallback": "加载失败",
        "manageSaveFailedTitle": "保存接收者设置失败",
        "manageSaveFailedFallback": "保存失败",
        "manageEnabledToast": "已开启 {name} 的工单邮件通知",
        "manageDisabledToast": "已关闭 {name} 的工单邮件通知"
      },
      "toast": {
        "loadFailedTitle": "加载工单列表失败",
        "loadFailedFallback": "加载失败"
      }
    },
    "adminDetail": {
      "backButton": "返回工单列表",
      "prioritySuffix": "优先级",
      "creator": "用户: {creator}",
      "unknownUser": "未知",
      "createdAt": "创建于 {date}",
      "summary": {
        "category": "分类",
        "priority": "优先级",
        "creator": "创建者",
        "assignee": "处理人",
        "createdAt": "创建时间",
        "updatedAt": "最近更新",
        "lastMessageAt": "最近消息",
        "closedAt": "关闭时间"
      },
      "viewUser": "查看 {name} 的用户资料",
      "stats": {
        "label": "会话概况",
        "userMessages": "用户消息",
        "adminReplies": "公开回复",
        "internalNotes": "内部备注 {count}",
        "firstResponse": "首次响应用时",
        "firstResponseNone": "尚未回复",
        "firstResponseDetail": "从创建到首条公开回复",
        "waitingAdmin": "用户已等待",
        "waitingAdminDetail": "自用户最后一条消息起",
        "waitingUser": "等待用户回复",
        "waitingUserDetail": "自最后一条公开回复起",
        "closedAfter": "处理时长",
        "closedAfterDetail": "从创建到关闭",
        "waitingNone": "当前等待"
      },
      "duration": {
        "days": "{days} 天 {hours} 小时",
        "hours": "{hours} 小时 {minutes} 分",
        "minutes": "{minutes} 分钟",
        "moment": "不到 1 分钟"
      },
      "system": {
        "statusChanged": "状态由「{from}」变更为「{to}」",
        "assigneeChanged": "处理人由 {from} 变更为 {to}",
        "assigned": "已分配给 {to}",
        "assigneeCleared": "已取消分配（原处理人 {from}）"
      },
      "actionsTitle": "处理操作",
      "actionsDescription": "更新工单状态或分配处理人。",
      "statusChangeLabel": "变更状态",
      "assigneeLabel": "处理人",
      "assigneePlaceholder": "选择处理人",
      "assigneeLoading": "正在加载处理人列表…",
      "assigneeLoadFailedHint": "处理人列表加载失败",
      "retryLoadAssignees": "重试",
      "unassigned": "未分配",
      "assignButton": "分配",
      "adminSender": "管理员",
      "userSender": "用户",
      "systemSender": "系统",
      "internalTag": "内部备注",
      "messagesTitle": "沟通记录",
      "messagesDescription": "公开回复会发送给用户，内部备注仅管理员可见。",
      "noMessages": "暂无消息",
      "compose": {
        "replyTitle": "回复用户",
        "internalTitle": "内部备注"
      },
      "internalInputPlaceholder": "输入内部备注（仅管理员可见）…",
      "replyInputPlaceholder": "输入回复…",
      "noteButton": "备注",
      "sendButton": "发送",
      "internalSwitchLabel": "内部备注（仅管理员可见）",
      "notFound": "工单不存在，可能已被删除或链接有误。",
      "toast": {
        "loadFailedTitle": "加载工单详情失败",
        "loadFailedFallback": "加载失败",
        "sendFailedTitle": "发送失败",
        "sendFailedFallback": "发送失败",
        "statusUpdated": "状态已更新为 {status}",
        "updateStatusFailedTitle": "更新状态失败",
        "updateStatusFailedFallback": "更新失败",
        "assigned": "已分配处理人",
        "unassigned": "已取消分配",
        "assignFailedTitle": "分配失败",
        "assignFailedFallback": "分配失败",
        "loadAssigneesFailedTitle": "加载处理人列表失败",
        "loadAssigneesFailedFallback": "无法加载可分配的管理员列表"
      }
    }
  }
} as const
