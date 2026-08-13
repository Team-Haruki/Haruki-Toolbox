// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: tickets
export default {
  "tickets": {
    "common": {
      "dateFallback": "—"
    },
    "status": {
      "open": "已开启",
      "inProgress": "处理中",
      "pendingAdmin": "待管理员处理",
      "pendingUser": "待用户回复",
      "resolved": "已解决",
      "closed": "已关闭"
    },
    "userStatusHint": {
      "waitingAdmin": "我们已经收到你的工单，目前等待管理员处理。",
      "waitingUser": "管理员已回复，等待你补充信息或确认后续处理。",
      "resolved": "此工单已标记为已解决，如问题确认处理完毕可以关闭工单。",
      "closed": "此工单已关闭，如还有新问题请重新创建工单。"
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
      "empty": "暂无工单，点击上方按钮创建",
      "total": "共 {total} 个工单",
      "updatedAt": "更新",
      "toast": {
        "loadFailedTitle": "加载工单列表失败",
        "loadFailedFallback": "加载失败"
      }
    },
    "create": {
      "backButton": "返回工单列表",
      "title": "创建工单",
      "description": "把关键信息写清楚，管理员会更容易判断下一步。",
      "submit": "提交工单",
      "submitting": "提交中...",
      "fields": {
        "subject": "主题",
        "subjectPlaceholder": "请简要描述您的问题",
        "subjectHint": "例如：上传数据失败、无法绑定账号、OAuth 回调异常。",
        "category": "分类",
        "categoryHint": "选择最接近的分类即可，不确定可以选其他。",
        "priority": "优先级",
        "priorityHint": "紧急优先级请留给影响登录、数据或主要功能的问题。",
        "message": "描述",
        "messagePlaceholder": "请详细描述您遇到的问题…",
        "messageHint": "建议包含账号 ID、服务器、出现时间、操作步骤、错误提示或相关链接。"
      },
      "toast": {
        "subjectRequired": "请输入工单主题",
        "messageRequired": "请输入工单描述",
        "loginRequired": "请先登录",
        "createSuccess": "工单已创建",
        "createFailedTitle": "创建工单失败",
        "createFailedFallback": "创建失败"
      }
    },
    "detail": {
      "backButton": "返回工单列表",
      "prioritySuffix": "优先级",
      "createdAt": "创建于 {date}",
      "summary": {
        "category": "分类",
        "priority": "优先级",
        "createdAt": "创建时间",
        "updatedAt": "最近更新"
      },
      "adminSender": "管理员",
      "noMessages": "暂无消息",
      "inputPlaceholder": "补充说明或回复管理员…",
      "sendButton": "发送",
      "closedHint": "工单已关闭，无法发送消息",
      "closeButton": "关闭工单",
      "closeDialog": {
        "title": "确认关闭工单",
        "description": "关闭后将无法继续发送消息。确认关闭？",
        "cancel": "取消",
        "confirm": "确认关闭"
      },
      "notFound": "工单不存在或加载失败",
      "toast": {
        "loadFailedTitle": "加载工单详情失败",
        "loadFailedFallback": "加载失败",
        "sendFailedTitle": "发送失败",
        "sendFailedFallback": "发送失败",
        "closeSuccess": "工单已关闭",
        "closeFailedTitle": "关闭失败",
        "closeFailedFallback": "关闭失败"
      }
    },
    "adminList": {
      "pagination": {
        "prevPage": "上一页",
        "nextPage": "下一页"
      },
      "title": "工单管理",
      "description": "快速筛选待处理、未分配和高优先级工单。",
      "searchPlaceholder": "搜索工单…",
      "refreshButton": "刷新",
      "unassigned": "未分配",
      "empty": "暂无工单",
      "total": "共 {total} 个工单",
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
        "label": "工单邮件通知",
        "description": "开启后接收新工单和用户回复提醒",
        "manageButton": "管理接收者",
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
        "updatedAt": "最近更新"
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
      "notFound": "工单不存在或加载失败",
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
