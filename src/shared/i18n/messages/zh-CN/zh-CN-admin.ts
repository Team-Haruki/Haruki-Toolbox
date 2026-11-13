// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: admin, adminConfig, adminRisk, adminBotSecurity, adminContent, adminOAuthClients, adminWebhooks, adminSponsors, adminStatistics, adminGameBindings, adminUsers
export default {
  "admin": {
    "pagination": {
      "total": "共 {total} 条",
      "pageSize": "每页显示",
      "jumpToPage": "跳转到页",
      "firstPage": "第一页",
      "prevPage": "上一页",
      "nextPage": "下一页",
      "lastPage": "最后一页"
    },
    "filters": {
      "search": "查询",
      "reset": "重置筛选"
    },
    "reauth": {
      "title": "验证管理员密码",
      "description": "敏感的管理操作需要再次确认你的账号密码。验证通过后会自动继续刚才的操作。",
      "passwordLabel": "当前密码",
      "submit": "验证并继续",
      "passwordRequired": "请输入密码",
      "passwordMismatch": "密码不正确，请重试", // NOSONAR -- translation key, not a credential
      "rejected": "无法通过密码验证此账号",
      "invalidInput": "输入无效，请重新输入密码",
      "failedTitle": "无法验证密码",
      "failedDescription": "验证服务暂时不可用，请稍后重试",
      "sessionInvalid": "当前登录会话无效，请重新登录后再试"
    },
    "layout": {
      "superAdmin": "超级管理员"
    },
    "nav": {
      "groups": {
        "overview": "概览",
        "usersRisk": "用户与风控",
        "operations": "内容与运营",
        "system": "系统与集成"
      },
      "descriptions": {
        "dashboard": "平台关键指标与上传趋势总览",
        "users": "查看、搜索与管理工具箱用户",
        "gameBindings": "查询与调整用户的游戏账号绑定",
        "risk": "维护风控规则并处置风险事件",
        "botSecurity": "查看 Haruki Cloud 上报的 Bot 客户端安全告警并标记处理结果",
        "tickets": "处理用户提交的工单与回复",
        "content": "维护友情链接与推荐群聊等站点内容",
        "sponsors": "管理赞助者名单的展示",
        "uploadLogs": "追踪玩家数据上传记录与失败原因",
        "logs": "查看系统运行日志",
        "oauthClients": "管理 OAuth 客户端、密钥与回调",
        "webhooks": "管理平台 Webhook 推送",
        "config": "调整系统级配置（仅超级管理员可见）"
      },
      "dashboard": "仪表盘",
      "users": "用户管理",
      "oauthClients": "OAuth客户端",
      "webhooks": "Webhook 管理",
      "logs": "系统日志",
      "uploadLogs": "上传日志",
      "content": "内容运营",
      "sponsors": "赞助者管理",
      "config": "系统配置",
      "gameBindings": "游戏绑定",
      "risk": "风控管理",
      "botSecurity": "Bot 安全告警",
      "tickets": "工单管理",
      "pendingTickets": "{total} 个待管理员处理的工单"
    }
  },
  "adminConfig": {
    "status": {
      "title": "运行状态",
      "deviceFlow": "设备授权",
      "webhook": "Webhook 推送",
      "allowedKeys": "允许的数据键",
      "secrets": "密钥",
      "secretsValue": "{configured} / {known} 已配置",
      "proxyVersion": "HarukiProxy 版本",
      "on": "已开启",
      "off": "已关闭"
    },
    "allowedKeys": {
      "title": "公共 API 允许的数据键",
      "help": "公共接口、OAuth2 游戏数据接口和本人账号数据接口只返回这里列出的顶层游戏数据键，私有 API 不受限制。保存后会清空游戏数据缓存。",
      "count": "{count} 个",
      "empty": "列表为空：还没有允许任何数据键",
      "addLabel": "添加数据键",
      "addPlaceholder": "userCards, userDecks",
      "addHint": "可以一次输入多个，用逗号或空格分隔",
      "add": "添加",
      "remove": "移除 {key}",
      "restore": "恢复 {key}",
      "addedMark": "新增",
      "removedMark": "将移除",
      "pending": "新增 {added} 个 · 移除 {removed} 个",
      "reset": "还原",
      "validation": {
        "empty": "请输入要添加的数据键",
        "duplicate": "已在列表中：{keys}"
      },
      "loadFailed": "加载允许的数据键失败",
      "saved": "允许的数据键已保存"
    },
    "credentials": {
      "title": "凭据与连接",
      "note": "密钥的值不会回传，这里只显示是否已配置。要更换某一项，在下方运行时配置中写入括号里的字段再保存。",
      "configured": "已配置",
      "notConfigured": "未配置",
      "notSet": "未设置",
      "privateApiToken": "私有 API Token",
      "harukiProxySecret": "HarukiProxy 密钥",
      "harukiProxyUnpackKey": "HarukiProxy 解包密钥",
      "webhookJwtSecret": "Webhook JWT 密钥",
      "privateApiUserAgent": "私有 API User-Agent",
      "harukiProxyUserAgent": "HarukiProxy User-Agent",
      "harukiProxyVersion": "HarukiProxy 版本"
    },
    "runtime": {
      "title": "运行时配置",
      "description": "以 JSON 直接编辑运行时配置，保存后立即生效。没有写出的字段保持不变。",
      "saveDialogTitle": "应用运行时配置？",
      "saveDialogDescription": "此更改将立即生效并应用于整个系统。请在继续前确认 JSON 内容正确。",
      "saveDialogConfirm": "应用"
    },
    "runtimeSwitches": {
      "title": "运行时开关",
      "description": "切换后约 1 秒内生效，无需重启后端",
      "dirtyHint": "下方运行时配置有未保存的修改，请先保存或刷新后再切换开关",
      "oauth2DeviceFlow": {
        "label": "OAuth2 设备授权",
        "description": "开启后，开通了设备码授权类型的客户端可以申请设备码，由用户在 /device 页批准。关闭后立即停止签发设备码和受理批准；已签发的令牌仍然有效，需要时按客户端撤销授权。后端没有返回该项时显示为关闭。",
        "enableTitle": "开启 OAuth2 设备授权？",
        "enableDescription": "开通了设备码授权类型的客户端将可以申请设备码。此更改立即应用于整个系统。",
        "disableTitle": "关闭 OAuth2 设备授权？",
        "disableDescription": "将立即停止签发设备码和受理 /device 页的批准。已签发的令牌不受影响，需要时请按客户端撤销授权。",
        "confirmEnable": "开启",
        "confirmDisable": "关闭"
      }
    },
    "toast": {
      "loadRuntimeFailedTitle": "加载运行时配置失败",
      "runtimeUpdated": "运行时配置更新成功",
      "invalidJson": "JSON 格式无效",
      "invalidRuntimeSchema": "运行时配置必须是一个 JSON 对象",
      "saveFailedTitle": "保存失败",
      "saveFailedFallback": "保存失败",
      "deviceFlowEnabled": "OAuth2 设备授权已开启",
      "deviceFlowDisabled": "OAuth2 设备授权已关闭",
      "switchNotApplied": "后端没有应用该开关（可能尚不支持），当前仍显示后端返回的值"
    },
    "loadError": "加载配置失败",
    "unsavedChanges": "有未保存的更改",
    "editor": {
      "loading": "正在加载编辑器…",
      "loadFailedTitle": "代码编辑器加载失败",
      "loadFailedDescription": "编辑器组件需要从 CDN 加载，可能被网络环境拦截。可以改用纯文本编辑器继续修改配置，或刷新页面重新加载。",
      "usePlainEditor": "改用纯文本编辑器",
      "useCodeEditor": "切换回代码编辑器"
    }
  },
  "adminRisk": {
    "tabs": {
      "events": "风控事件",
      "rules": "风控规则"
    },
    "common": {
      "fallback": "—"
    },
    "severity": {
      "low": "低",
      "medium": "中",
      "high": "高",
      "critical": "严重"
    },
    "status": {
      "open": "待处理",
      "resolved": "已解决"
    },
    "range": {
      "last24h": "近 24 小时",
      "last7d": "近 7 天",
      "last30d": "近 30 天",
      "last90d": "近 90 天",
      "last365d": "近 1 年"
    },
    "filters": {
      "range": "时间范围",
      "status": "状态",
      "severity": "严重程度",
      "allStatuses": "全部状态",
      "allSeverities": "全部严重程度",
      "severityOption": "严重程度：{severity}"
    },
    "stats": {
      "open": "待处理事件",
      "urgent": "待处理的严重 / 高",
      "urgentSplit": "严重 {critical} · 高 {high}",
      "resolved": "已解决事件",
      "resolutionRate": "解决率 {rate}",
      "total": "事件总数",
      "bySeverity": "待处理事件的严重程度",
      "bySeverityHint": "{range}内的全部待处理事件",
      "bySource": "本页事件来源",
      "bySourceHint": "仅统计列表当前显示的 {count} 条",
      "bySourceEmpty": "当前列表没有事件",
      "bySourceFailed": "列表未能加载，没有可统计的事件",
      "noSource": "未注明来源",
      "unavailable": "统计暂不可用"
    },
    "detail": {
      "title": "风控事件 #{id}",
      "noAction": "未记录动作",
      "targetUser": "目标用户",
      "actorUser": "触发用户",
      "ip": "IP",
      "resolvedAt": "解决时间",
      "resolvedBy": "处理人",
      "resolutionReason": "处理说明",
      "groups": {
        "event": "事件",
        "parties": "相关方",
        "resolution": "处理",
        "metadata": "附加数据"
      }
    },
    "events": {
      "title": "风控事件",
      "refresh": "刷新",
      "details": "查看详情",
      "emptyHint": "{range}内没有符合条件的事件，可以换一个时间范围或筛选条件",
      "userShort": "用户 {userId}",
      "createButton": "创建事件",
      "createDialogTitle": "创建风控事件",
      "create": "创建",
      "resolveAction": "标记为已解决",
      "resolveDialog": {
        "title": "标记为已解决",
        "description": "确定要将事件「{action}」（ID {id}）标记为已解决吗？它将不再显示为待处理。",
        "confirm": "标记为已解决"
      },
      "empty": "暂无风控事件",
      "total": "共 {total} 个事件",
      "fields": {
        "severity": "严重程度",
        "source": "来源",
        "action": "动作",
        "reason": "原因",
        "targetUserIdOptional": "目标用户ID（可选）"
      },
      "placeholders": {
        "source": "如: dashboard",
        "action": "如: suspicious_login",
        "reason": "描述风控原因…",
        "targetUserId": "用户ID"
      },
      "sourceOptions": {
        "dashboard": "管理后台（dashboard）",
        "manual": "人工处理（manual）",
        "automated": "自动检测（automated）",
        "other": "其他（other）"
      },
      "validation": {
        "actionRequired": "请填写事件动作",
        "reasonRequired": "请填写风控原因"
      },
      "table": {
        "severity": "严重程度",
        "action": "动作",
        "reason": "原因",
        "user": "用户",
        "status": "状态",
        "time": "时间",
        "actions": "操作"
      }
    },
    "rules": {
      "title": "风控规则",
      "description": "查看和编辑风控规则配置（仅超级管理员可编辑）",
      "editorLabel": "规则 JSON",
      "editorHint": "每条规则包含 key（1–64 个字符）、description 和 config。保存只会新增或更新列出的规则。",
      "formatButton": "整理格式",
      "revertButton": "还原",
      "state": {
        "saving": "保存中…",
        "invalid": "JSON 有误",
        "pending": "未保存：新增 {added} · 修改 {changed}",
        "saved": "已保存"
      },
      "saveButton": "保存规则",
      "superAdminOnly": "风控规则仅超级管理员可见",
      "loadError": "加载风控规则失败",
      "retry": "重试",
      "validation": {
        "invalidJson": "JSON 格式错误，请检查括号、引号和逗号",
        "notArray": "规则内容必须是 JSON 数组",
        "invalidRule": "第 {index} 条规则格式不正确：需要 key（1–64 个字符的字符串），description 可选且须为字符串，config 可选且须为对象",
        "duplicateKey": "第 {index} 条规则的 key「{key}」与前面的规则重复",
        "tooMany": "一次最多保存 {max} 条规则"
      },
      "preview": {
        "title": "规则预览",
        "count": "{count} 条",
        "invalid": "修正 JSON 后会在这里显示解析结果",
        "empty": "规则数组为空，没有可保存的内容",
        "added": "新增",
        "changed": "已修改",
        "updatedAt": "更新于 {time}",
        "updatedBy": "更新于 {time} · 用户 {user}",
        "omitted": "未列出的 {count} 条规则保持不变（保存不会删除规则）：{keys}",
        "enabled": "已启用",
        "disabled": "已停用",
        "configKeys": "配置项：{keys}",
        "noConfig": "无配置项"
      }
    },
    "toast": {
      "loadEventsFailedTitle": "加载风控事件失败",
      "loadRulesFailedTitle": "加载风控规则失败",
      "loadFailedFallback": "加载失败",
      "actionReasonRequired": "请填写事件动作和原因",
      "createSuccess": "事件已创建",
      "createFailedTitle": "创建失败",
      "createFailedFallback": "创建失败",
      "resolveSuccess": "事件已解决",
      "actionFailedTitle": "操作失败",
      "actionFailedFallback": "操作失败",
      "saveFailedTitle": "保存失败",
      "saveFailedFallback": "保存失败",
      "rulesMustBeJsonArray": "规则内容必须是 JSON 数组",
      "rulesUpdated": "风控规则已更新",
      "invalidJson": "JSON 格式错误"
    }
  },
  "adminBotSecurity": {
    "common": {
      "fallback": "—"
    },
    "kind": {
      "authFailed": "认证失败",
      "replayDetected": "检测到重放请求",
      "rateLimited": "触发限流",
      "buildRejected": "客户端构建被拒绝",
      "sessionRevoked": "会话已吊销",
      "loginSourceChanged": "登录来源变化",
      "clientChanged": "客户端变更",
      "policyUnavailable": "安全策略不可用"
    },
    "status": {
      "open": "待处理",
      "resolved": "已处理",
      "ignored": "已忽略"
    },
    "enforcement": {
      "enforced": "已拦截",
      "logOnly": "仅记录",
      "enforcedHint": "Haruki Cloud 已拦截这次操作",
      "logOnlyHint": "Haruki Cloud 只记录了这次操作，没有拦截"
    },
    "window": {
      "seconds": "{count} 秒",
      "minutes": "{count} 分钟",
      "hours": "{count} 小时",
      "days": "{count} 天"
    },
    "summary": {
      "open": "待处理",
      "last24h": "近 24 小时告警",
      "last7d": "近 7 天告警",
      "byKind": "待处理告警（按类型）",
      "noOpen": "暂无待处理的告警",
      "unavailable": "统计暂不可用",
      "filterByKind": "只看待处理的「{kind}」告警"
    },
    "overview": {
      "handled": "已处置",
      "handledSplit": "已处理 {resolved} · 已忽略 {ignored}",
      "openKinds": "涉及 {count} 种类型",
      "dailyAverage": "近 7 天日均 {count}",
      "anyStatus": "含已处置的告警",
      "byKindHint": "点击一行，只看该类型的待处理告警",
      "byStatus": "告警状态",
      "byStatusHint": "全部告警",
      "byStatusTotal": "全部 {total} 条告警",
      "onThisPage": "本页告警",
      "onThisPageHint": "仅统计列表当前显示的 {count} 条",
      "onThisPageEmpty": "当前列表没有告警",
      "onThisPageFailed": "列表未能加载，没有可统计的告警",
      "timeline": "告警时间分布",
      "timelineRange": "{from} 至 {to}",
      "timelineLabel": "本页 {count} 条告警按告警时间的分布",
      "enforcement": "拦截方式",
      "window": "统计窗口"
    },
    "filters": {
      "title": "筛选条件",
      "expand": "展开",
      "collapse": "收起",
      "status": "状态",
      "kind": "类型",
      "botId": "Bot ID",
      "botIdPlaceholder": "精确匹配 Bot ID",
      "from": "开始时间",
      "fromPlaceholder": "不限",
      "to": "结束时间",
      "toPlaceholder": "不限",
      "allStatuses": "全部状态",
      "allKinds": "全部类型",
      "changed": "已设 {count} 项"
    },
    "actions": {
      "search": "查询",
      "refresh": "刷新",
      "retry": "重试",
      "resolve": "标记已处理",
      "ignore": "忽略",
      "reopen": "重新打开",
      "details": "查看详情"
    },
    "table": {
      "title": "告警列表",
      "alertTime": "告警时间",
      "kind": "类型",
      "bot": "Bot / 所有者 / 来源",
      "sourceIp": "来源 IP",
      "client": "客户端版本 / 构建",
      "count": "次数 / 阈值",
      "status": "状态",
      "handler": "处理人",
      "actions": "操作",
      "within": "{window}内",
      "ownerQq": "QQ {qq}",
      "botShort": "Bot {botId}",
      "sourceIpShort": "IP {ip}",
      "handledByShort": "处理人：{name}",
      "openMenu": "告警 #{id} 的操作",
      "empty": "没有符合条件的告警",
      "loadError": "告警列表加载失败"
    },
    "pagination": {
      "total": "共 {total} 条",
      "prev": "上一页",
      "next": "下一页"
    },
    "detail": {
      "title": "告警 #{id}",
      "description": "以下内容来自 Bot 客户端或 Haruki Cloud，按原文显示",
      "receivedAt": "接收时间",
      "botId": "Bot ID",
      "ownerQq": "所有者 QQ",
      "node": "上报节点",
      "clientVersion": "客户端版本",
      "buildId": "构建 ID",
      "reason": "原因",
      "note": "处理备注",
      "noNote": "暂无备注",
      "countValue": "{window}内 {count} 次，阈值 {threshold}",
      "handledAt": "处理时间",
      "handlerNameUnavailable": "（用户名不可用，可能已删除）",
      "groups": {
        "alert": "告警",
        "source": "Bot 与来源",
        "handling": "处理"
      }
    },
    "actionDialog": {
      "title": {
        "resolve": "标记告警为已处理",
        "ignore": "忽略告警",
        "reopen": "重新打开告警"
      },
      "subject": "告警 #{id} · {kind}",
      "subjectWithBot": "告警 #{id} · {kind} · Bot {botId}",
      "noteLabel": "处理备注（可选）",
      "notePlaceholder": "记录处理方式或判断依据",
      "noteHint": "不修改则保留原备注",
      "noteWillClear": "备注已清空，保存后将删除原备注"
    },
    "toast": {
      "loadFailedTitle": "加载告警失败",
      "loadFailedFallback": "请稍后重试",
      "loadSummaryFailedTitle": "加载告警统计失败",
      "filterFailedTitle": "筛选条件有误",
      "invalidTimeRange": "开始时间不能晚于结束时间",
      "updateFailedTitle": "更新告警失败",
      "updateFailedFallback": "请稍后重试",
      "resolveSuccess": "告警已标记为已处理",
      "ignoreSuccess": "告警已忽略",
      "reopenSuccess": "告警已重新打开"
    }
  },
  "adminContent": {
    "actions": {
      "edit": "编辑",
      "delete": "删除"
    },
    "tabs": {
      "links": "友情链接管理",
      "groups": "推荐群聊管理"
    },
    "countShare": "{count} · {percent}",
    "stats": {
      "links": "友情链接",
      "tags": "链接标签",
      "groups": "群聊分组",
      "items": "群聊项目",
      "untagged": "{count} 个未加标签",
      "allTagged": "全部已加标签",
      "topTag": "最常用：{tag}（{count}）",
      "emptyGroups": "{count} 个空分组",
      "noEmptyGroups": "没有空分组",
      "largestGroup": "最多：{group}（{count}）"
    },
    "linksTab": {
      "title": "友情链接管理",
      "description": "按排序值从小到大展示，相同则按 ID",
      "tagPanel": {
        "title": "标签分布",
        "description": "带有每个标签的链接数",
        "empty": "还没有标签",
        "more": "另有 {count} 个标签未列出"
      },
      "createButton": "添加友情链接",
      "table": {
        "sortOrder": "排序",
        "name": "名称",
        "tags": "标签"
      },
      "deleteDialog": {
        "title": "确认删除",
        "description": "确定删除友链 {name}？",
        "cancel": "取消",
        "confirm": "确认"
      },
      "empty": "暂无友情链接"
    },
    "groupsTab": {
      "title": "推荐群聊管理",
      "summary": "排序 {order} · {count} 个项目",
      "hasLink": "已设置链接",
      "hasBackground": "已设置背景图",
      "sizePanel": {
        "title": "各分组项目数",
        "description": "按分组的展示顺序"
      },
      "createGroupButton": "创建群聊分组",
      "createGroupDialog": {
        "title": "创建分组",
        "editTitle": "编辑分组",
        "groupNameLabel": "分组名称",
        "groupNamePlaceholder": "分组名称",
        "create": "保存"
      },
      "addItemButton": "添加项目",
      "deleteGroupDialog": {
        "title": "确认删除分组",
        "description": "确定删除群聊分组 {group}？分组内的所有项目也会被删除。",
        "cancel": "取消",
        "confirm": "确认"
      },
      "deleteItemDialog": {
        "title": "确认删除项目",
        "description": "确定删除项目 {name}？此操作无法撤销。",
        "confirm": "删除"
      },
      "emptyItems": "暂无群聊项目",
      "emptyGroups": "暂无群聊分组"
    },
    "validation": {
      "nameRequired": "请填写名称",
      "urlRequired": "请填写链接URL",
      "invalidUrl": "请输入有效的 http(s) 链接",
      "groupNameRequired": "请输入分组名称"
    },
    "linkDialog": {
      "createTitle": "添加友情链接",
      "editTitle": "编辑友情链接",
      "fields": {
        "name": "名称",
        "description": "描述",
        "avatarUrl": "头像URL",
        "linkUrl": "链接URL",
        "tags": "标签（逗号分隔）",
        "sortOrder": "排序值",
        "sortOrderHint": "数值越小越靠前，相同则按 ID 排序"
      },
      "placeholders": {
        "name": "站点名称",
        "description": "简短描述",
        "avatarUrl": "https://example.com/avatar.png",
        "linkUrl": "https://example.com",
        "tags": "博客, 技术",
        "sortOrder": "0"
      }
    },
    "itemDialog": {
      "createTitle": "添加项目",
      "editTitle": "编辑项目",
      "fields": {
        "name": "名称",
        "avatarUrl": "头像URL",
        "backgroundUrl": "背景图URL",
        "groupInfo": "群组信息",
        "detail": "详情"
      },
      "placeholders": {
        "name": "项目名称",
        "avatarUrl": "https://example.com/avatar.png",
        "backgroundUrl": "https://example.com/background.jpg",
        "optional": "可选"
      }
    },
    "toast": {
      "loadLinksFailedTitle": "加载友链失败",
      "loadGroupsFailedTitle": "加载友链分组失败",
      "actionFailedFallback": "操作失败",
      "saveFailedTitle": "保存失败",
      "createFailedTitle": "创建失败",
      "deleteFailedTitle": "删除失败",
      "linkUpdated": "友链已更新",
      "linkCreated": "友链已创建",
      "linkDeleted": "已删除友链",
      "groupCreated": "分组已创建",
      "groupUpdated": "分组已更新",
      "groupDeleted": "分组已删除",
      "itemUpdated": "项目已更新",
      "itemCreated": "项目已创建",
      "itemDeleted": "项目已删除"
    }
  },
  "adminOAuthClients": {
    "title": "OAuth客户端管理",
    "scope": {
      "userRead": "基础信息 (user:read)",
      "bindingsRead": "游戏绑定 (bindings:read)",
      "gameDataRead": "游戏数据 (game-data:read)",
      "gameDataWrite": "游戏上传 (game-data:write)",
      "stationRoomWrite": "提交车牌 Sekai Station (station:room:write)",
      "openid": "OIDC 登录 (openid)",
      "profile": "OIDC 昵称 (profile)",
      "email": "OIDC 邮箱 (email)",
      "offlineAccess": "离线访问 / 刷新令牌 (offline_access)"
    },
    "common": {
      "fallback": "—",
      "empty": "暂无统计数据"
    },
    "status": {
      "deleted": "已删除",
      "enabled": "启用",
      "disabled": "禁用"
    },
    "createDialog": {
      "trigger": "创建客户端",
      "title": "创建OAuth客户端",
      "description": "创建一个新的 OAuth2 客户端应用",
      "clientIdLabel": "客户端ID (Client ID)",
      "clientIdPlaceholder": "英文字母/数字/杠/下划线组合",
      "submit": "创建"
    },
    "editDialog": {
      "title": "编辑OAuth客户端",
      "descriptionPrefix": "修改客户端",
      "descriptionSuffix": "的设置。",
      "cancel": "取消"
    },
    "form": {
      "removeRedirectUri": "删除此URI",
      "groups": {
        "basic": "基本信息",
        "access": "授权方式与范围",
        "redirects": "回调地址"
      },
      "nameLabel": "客户端名称",
      "namePlaceholder": "显示名称",
      "clientTypeLabel": "客户端类型",
      "clientTypePlaceholder": "选择类型",
      "clientTypeConfidential": "Confidential (含Secret)",
      "clientTypePublic": "Public (无Secret)",
      "scopesLabel": "授权范围 (Scopes)",
      "redirectUrisLabel": "回调URI (Redirect URIs)",
      "redirectUriPlaceholder": "https://example.com/callback",
      "addRedirectUri": "添加URI",
      "postLogoutRedirectUrisLabel": "登出回调URI (Post-Logout Redirect URIs)",
      "postLogoutRedirectUrisHelp": "OIDC RP-Initiated Logout 后允许跳回的地址，精确匹配。仅登录类客户端需要，可留空。",
      "postLogoutRedirectUriPlaceholder": "https://example.com/logged-out",
      "grantTypesLabel": "授权类型 (Grant types)",
      "grantTypesHelp": "授权码用于有浏览器回调的应用；设备码用于没有浏览器的程序（RFC 8628），由用户在 /device 页批准；刷新令牌须与其中之一同时选择，登记 offline_access 时必选",
      "grantType": {
        "authorizationCode": "授权码 (authorization_code)",
        "deviceCode": "设备码 (device_code)",
        "refreshToken": "刷新令牌 (refresh_token)"
      },
      "redirectUrisOptionalHelp": "未选择授权码时不需要回调URI，仅设备码客户端可以留空",
      "writeScopeHint": "写入权限：允许客户端以用户身份提交或上传数据",
      "devicePolicy": {
        "title": "设备码策略",
        "firstParty": "官方客户端",
        "firstPartyHelp": "在设备授权页上显示「官方」徽章",
        "firstPartyPublicHelp": "只对 Confidential 客户端生效，Public 客户端不显示「官方」徽章",
        "allowWrite": "允许经设备码申请 game-data:write",
        "allowWriteHelp": "仅限登记了 game-data:write 的 Public 客户端",
        "maxCodesPer10m": "每 10 分钟设备码上限",
        "maxCodesPer10mHelp": "该客户端每 10 分钟最多可申请的设备码数量，范围 {min}–{max}，默认 {default}",
        "emailNeverGranted": "设备码授权永远不会授予 email，登记了也只对授权码生效"
      }
    },
    "list": {
      "searchPlaceholder": "搜索名称或 Client ID",
      "allStatuses": "全部状态",
      "count": "共 {count} 个客户端",
      "refresh": "刷新列表",
      "noMatch": "没有符合筛选条件的客户端",
      "resetFilters": "清除筛选",
      "copyClientId": "复制 Client ID",
      "redirectUriCount": "{count} 个回调URI",
      "createdAt": "创建于 {date}",
      "noScopes": "未配置 Scope",
      "typePublic": "Public",
      "typeConfidential": "Confidential",
      "deviceBadge": "设备码",
      "deviceBadgeTitle": "已开通设备码授权类型",
      "title": "客户端",
      "columns": {
        "client": "客户端",
        "scopes": "Scope 与授权类型",
        "redirectUris": "回调URI",
        "createdAt": "创建时间"
      },
      "moreRedirectUris": "还有 {count} 个",
      "noRedirectUris": "无回调URI"
    },
    "overview": {
      "total": "客户端总数",
      "enabled": "已启用",
      "disabledCount": "禁用 {count}",
      "deletedCount": "已删除 {count}",
      "confidential": "Confidential 客户端",
      "publicCount": "Public {count}",
      "device": "设备码客户端",
      "shareOfClients": "占全部客户端的 {percent}",
      "partialNote": "客户端超过一页：除总数外，以上数字只统计已加载的 {loaded} 个（共 {total} 个）",
      "scopesTitle": "Scope 分布",
      "scopesHint": "登记了各 Scope 的客户端数",
      "grantTypesTitle": "授权类型",
      "grantTypesHint": "可使用各授权类型的客户端数"
    },
    "table": {
      "actions": "操作",
      "openMenu": "打开菜单",
      "empty": "暂无OAuth客户端",
      "menu": {
        "edit": "编辑",
        "stats": "访问统计",
        "webhooks": "Webhook endpoints",
        "disableClient": "禁用客户端",
        "enableClient": "启用客户端",
        "dangerZone": "危险操作",
        "rotateSecret": "轮换 Secret",
        "revokeAll": "撤销全部授权",
        "restore": "恢复删除",
        "deleteClient": "删除客户端"
      }
    },
    "deleteDialog": {
      "title": "确认删除",
      "descriptionPrefix": "确定要删除OAuth客户端",
      "descriptionSuffix": "吗？其所有令牌将立即失效，使用它的应用将无法再访问。",
      "cancel": "取消",
      "confirm": "删除"
    },
    "rotateDialog": {
      "title": "轮换客户端密钥",
      "description": "确定要轮换客户端 {clientId} 的密钥吗？当前密钥将立即失效，现有集成在更新前将无法使用。",
      "cancel": "取消",
      "confirm": "轮换"
    },
    "revokeDialog": {
      "title": "撤销全部授权",
      "description": "确定要撤销客户端 {clientId} 的所有用户授权吗？所有用户都需要重新授权，此操作无法撤销。",
      "cancel": "取消",
      "confirm": "全部撤销"
    },
    "disableDialog": {
      "title": "禁用客户端",
      "description": "确定要禁用客户端 {clientId} 吗？禁用后它将无法再发起授权，其现有的用户授权和令牌也会被撤销。",
      "confirm": "禁用"
    },
    "statsDialog": {
      "title": "客户端统计",
      "filters": "筛选范围",
      "from": "开始时间",
      "to": "结束时间",
      "bucket": "时间粒度",
      "hour": "按小时",
      "day": "按天",
      "apply": "应用筛选",
      "invalidTimeRange": "开始时间不能晚于结束时间",
      "rangeLabel": "统计范围：{range}",
      "authorizations": "用户授权",
      "tokens": "令牌",
      "summary": {
        "authorizationTotal": "授权总数",
        "authorizationActive": "有效授权",
        "authorizationRevoked": "已撤销授权",
        "authorizationCreatedInRange": "范围内新增授权",
        "tokenTotal": "令牌总数",
        "tokenActive": "有效令牌",
        "tokenRevoked": "已撤销令牌",
        "tokenIssuedInRange": "范围内签发令牌"
      },
      "trendTitle": "趋势",
      "trendAuthorizations": "新增授权",
      "trendTokens": "签发令牌",
      "trendEmpty": "所选范围内没有授权或令牌活动",
      "stateActive": "有效",
      "stateRevoked": "已撤销",
      "authorizationStateHint": "全部用户授权中仍然有效的比例",
      "tokenStateHint": "全部令牌中仍然有效的比例",
      "noAuthorizations": "还没有用户授权过此客户端",
      "noTokens": "没有令牌记录",
      "trendHintHour": "每小时的新增授权与签发令牌",
      "trendHintDay": "每天的新增授权与签发令牌",
      "trendSummary": "范围内共 {buckets} 个时间段，新增授权 {authorizations} 个，签发令牌 {tokens} 个",
      "trendPeak": "最活跃的时间段：{time}，共 {count} 次",
      "trendView": "趋势的展示方式",
      "trendViewChart": "图表",
      "trendViewTable": "数据表",
      "trendBucket": "时间段",
      "trendTableNote": "只列出有数据的 {shown} 个时间段（共 {total} 个）",
      "audit": {
        "title": "管理操作",
        "description": "所选范围内以此客户端为目标的审计日志条目",
        "loadFailed": "管理操作统计加载失败",
        "empty": "所选范围内没有针对此客户端的管理操作",
        "total": "操作总数",
        "success": "成功",
        "failure": "失败",
        "successRate": "成功率",
        "other": "其他操作 {count} 次",
        "action": {
          "create": "创建客户端",
          "update": "修改设置",
          "activeUpdate": "启用 / 禁用",
          "rotateSecret": "轮换 Secret",
          "delete": "删除客户端",
          "restore": "恢复客户端",
          "revoke": "撤销全部授权",
          "statisticsQuery": "查看统计",
          "authorizationsList": "查看授权列表",
          "auditLogsQuery": "查看审计日志",
          "auditSummaryQuery": "查看审计汇总",
          "webhookList": "查看 Webhook",
          "webhookCreate": "创建 Webhook",
          "webhookUpdate": "修改 Webhook",
          "webhookDelete": "删除 Webhook"
        }
      }
    },
    "secretDialog": {
      "title": "凭证生成成功",
      "description": "请注意：这是 Client Secret 唯一一次出现的时刻，系统不会保存其明文。请务必立即复制并安全保存；如遗失只能重新生成。",
      "copy": "复制",
      "confirmSaved": "我已妥善保存"
    },
    "webhooks": {
      "title": "OAuth client Webhook",
      "description": "管理客户端 {clientId} 的数据更新通知 endpoint",
      "placeholderHint": "Callback URL 支持 {'{server}'}、{'{data_type}'}、{'{user_id}'} 占位符",
      "summary": "共 {total} 个 endpoint，已启用 {enabled} 个",
      "actions": {
        "refresh": "刷新",
        "create": "创建 endpoint",
        "cancel": "取消",
        "save": "保存"
      },
      "bearer": {
        "configured": "已配置",
        "empty": "未配置"
      },
      "table": {
        "callbackUrl": "回调地址",
        "bearer": "Bearer",
        "status": "状态",
        "createdAt": "创建时间",
        "actions": "操作",
        "empty": "暂无 OAuth client webhook endpoint"
      },
      "form": {
        "createTitle": "创建 Webhook endpoint",
        "editTitle": "编辑 Webhook endpoint",
        "description": "Bearer 不会回显；留空表示不设置或保持当前值",
        "callbackUrl": "Callback URL",
        "callbackUrlPlaceholder": "https://example.com/oauth-webhook/{'{server}'}/{'{data_type}'}/{'{user_id}'}",
        "bearer": "Bearer token",
        "bearerPlaceholder": "可选",
        "bearerReplacePlaceholder": "留空保持当前 bearer",
        "bearerHelp": "保存后前端只会显示是否已配置，不会显示明文",
        "enabled": "启用 endpoint",
        "enabledHelp": "禁用后后端不会向该 endpoint 发送回调",
        "clearBearer": "清除已配置 bearer",
        "clearBearerHelp": "开启后保存会删除当前 bearer"
      },
      "validation": {
        "callbackUrlRequired": "请填写 Callback URL"
      },
      "deleteDialog": {
        "title": "删除 Webhook 端点",
        "description": "确定要删除 Webhook 端点 {callbackUrl} 吗？该端点将停止接收回调，之后可重新创建。",
        "cancel": "取消",
        "confirm": "删除"
      }
    },
    "toast": {
      "loadClientsFailedTitle": "加载OAuth客户端失败",
      "loadStatsFailedTitle": "加载统计失败",
      "loadAuthorizationsFailedTitle": "加载OAuth客户端授权列表失败",
      "loadAuditLogsFailedTitle": "加载OAuth客户端审计日志失败",
      "loadWebhooksFailedTitle": "加载 OAuth client webhook 失败",
      "actionFailedFallback": "操作失败",
      "createFailedTitle": "创建失败",
      "saveFailedTitle": "保存失败",
      "saveWebhookFailedTitle": "保存 webhook 失败",
      "deleteFailedTitle": "删除失败",
      "deleteWebhookFailedTitle": "删除 webhook 失败",
      "actionFailedTitle": "操作失败",
      "rotateFailedTitle": "轮换失败",
      "restoreFailedTitle": "恢复失败",
      "revokeFailedTitle": "撤销失败",
      "clientCreated": "OAuth客户端已创建",
      "saved": "已保存",
      "deleted": "已删除",
      "disabled": "已禁用",
      "enabled": "已启用",
      "secretRotated": "已成功重新生成 Secret",
      "restored": "已恢复",
      "revokedAll": "已撤销所有授权",
      "disabledRevocationIncompleteTitle": "客户端已禁用，但部分授权未能撤销",
      "revokedPartiallyTitle": "授权仅部分撤销",
      "revocationFailedSubjects": "有 {count} 个用户标识（subject）撤销失败，可执行「撤销全部授权」重试",
      "revocationIncomplete": "部分授权未能撤销，可执行「撤销全部授权」重试",
      "webhookSaved": "Webhook endpoint 已保存",
      "webhookDeleted": "Webhook endpoint 已删除",
      "copyFailedTitle": "复制失败",
      "copyFailedSecretEmpty": "Secret 为空",
      "copyFailedClipboardUnsupported": "当前环境不支持剪贴板操作",
      "copied": "已复制到剪贴板",
      "validation": {
        "clientIdAndNameRequired": "客户端ID和名称不能为空",
        "clientIdRequired": "客户端ID不能为空",
        "nameRequired": "客户端名称不能为空",
        "redirectUriRequired": "选择了授权码时请至少填写一个回调URI",
        "scopeRequired": "请至少选择一个Scope",
        "oidcScopeRequiresOpenid": "profile / email 需要与 openid 一起登记",
        "grantTypeRequired": "请至少选择授权码或设备码（刷新令牌不能单独使用）",
        "postLogoutRequiresRedirectUris": "没有回调URI的客户端不能登记登出回调URI，请清空登出回调URI",
        "offlineAccessRequiresRefreshToken": "登记 offline_access 时须同时选择刷新令牌",
        "deviceRequiresUserRead": "设备码客户端须登记 user:read（设备页要显示授权的账号）",
        "deviceWriteRequiresPublicClient": "「允许经设备码申请 game-data:write」只适用于选择了设备码并登记了 game-data:write 的 Public 客户端",
        "invalidDevicePolicy": "每 10 分钟设备码上限须为 1–600 之间的整数"
      },
      "apiErrors": {
        "publicClientHasNoSecret": "Public 客户端没有可轮换的 Secret。如需 Secret，请把客户端类型改为 Confidential，保存时会生成一次。",
        "unsupportedGrantType": "授权类型只能是授权码、设备码和刷新令牌"
      }
    }
  },
  "adminWebhooks": {
    "common": {
      "fallback": "—"
    },
    "status": {
      "enabled": "启用",
      "disabled": "禁用",
      "configured": "已配置",
      "notConfigured": "未配置"
    },
    "actions": {
      "refresh": "刷新",
      "create": "创建 endpoint",
      "edit": "编辑",
      "delete": "删除",
      "subscribers": "查看订阅者",
      "copyToken": "复制 Token",
      "cancel": "取消"
    },
    "settings": {
      "title": "Webhook 设置",
      "description": "管理全局 webhook 开关和 JWT 密钥配置",
      "globalStatus": "全局投递状态",
      "globalStatusHint": "只有全局开关和 endpoint 开关都开启时，才会真正发送回调",
      "jwtSecretStatus": "JWT 密钥状态",
      "jwtSecretStatusHint": "只有配置好 JWT 密钥后，后端才会返回可直接使用的 webhook token",
      "secretAlertTitle": "JWT 密钥尚未配置",
      "secretAlertDescription": "您仍然可以创建和编辑 endpoint，但在配置 JWT 密钥之前，后端不会返回可用的 webhook token",
      "enableSwitchLabel": "全局启用 webhook 投递",
      "jwtSecretLabel": "Webhook JWT 密钥",
      "jwtSecretPlaceholder": "留空表示保持当前密钥不变",
      "jwtSecretHelp": "只有在您想替换当前密钥时才需要填写新值",
      "readOnlyNoticeTitle": "只读视图",
      "readOnlyNoticeDescription": "你可以查看 Webhook 设置和端点，但修改需要超级管理员权限",
      "noChanges": "没有需要保存的更改",
      "disableDialog": {
        "title": "关闭全局 webhook 投递？",
        "description": "关闭后所有 endpoint 都不会再收到回调，即使它们各自处于启用状态。已排队的投递将被丢弃。",
        "confirm": "关闭投递"
      }
    },
    "list": {
      "title": "Webhook endpoints",
      "description": "查看并管理已注册的 webhook 回调地址",
      "generatedAt": "生成时间：{date}",
      "total": "共 {total} 个 endpoint"
    },
    "table": {
      "id": "ID",
      "callbackUrl": "回调地址",
      "credential": "凭证",
      "status": "状态",
      "subscriptions": "订阅数",
      "createdAt": "创建时间",
      "actions": "操作",
      "empty": "暂无 webhook endpoint",
      "endpoint": "Endpoint",
      "bearerTitle": "回调请求会附带 Authorization: Bearer 头"
    },
    "overview": {
      "total": "Endpoint 总数",
      "enabledDisabled": "启用 {enabled} · 禁用 {disabled}",
      "delivering": "正在投递",
      "globalOn": "全局投递已启用",
      "globalOff": "全局投递已关闭，不会发送任何回调",
      "subscriptions": "订阅总数",
      "endpointsWithSubscribers": "{count} 个 endpoint 有订阅者",
      "jwtSecret": "JWT 密钥",
      "withBearer": "{count} 个带 Bearer",
      "rankTitle": "订阅分布",
      "rankHint": "订阅数最多的 endpoint 及其占全部订阅的比例，按上方列表统计",
      "rankEmpty": "还没有任何订阅",
      "rankRest": "其余 endpoint 共 {count} 个订阅"
    },
    "form": {
      "createTitle": "创建 webhook endpoint",
      "editTitle": "编辑 webhook endpoint",
      "description": "配置回调地址、凭证、Bearer Token 和 endpoint 开关",
      "idLabel": "Endpoint ID",
      "idPlaceholder": "可选，留空则自动生成",
      "idHelp": "如果留空，后端会自动生成下一个数字字符串 ID",
      "callbackUrlLabel": "回调地址",
      "callbackUrlPlaceholder": "https://example.com/webhook",
      "credentialLabel": "凭证",
      "credentialPlaceholder": "可选，留空则自动生成",
      "credentialHelp": "如果留空，后端会自动生成随机凭证",
      "bearerLabel": "Bearer Token",
      "bearerPlaceholder": "可选，留空则不附带 Authorization 头",
      "bearerHelp": "填写后，后端会在回调请求中附带 `Authorization: Bearer TOKEN`",
      "clearBearerLabel": "清空 Bearer Token",
      "enabledLabel": "启用当前 endpoint",
      "groups": {
        "endpoint": "Endpoint",
        "auth": "凭证与认证"
      }
    },
    "deleteDialog": {
      "title": "删除 webhook endpoint",
      "description": "确认删除 endpoint {id} 吗？删除后会一并移除它关联的所有订阅关系。",
      "confirm": "删除 endpoint"
    },
    "tokenDialog": {
      "title": "Webhook Token",
      "description": "请保存 endpoint {id} 当前可用的 webhook token",
      "headerNameLabel": "请求头名称",
      "tokenLabel": "Webhook Token",
      "tokenHelp": "调用 webhook subscriber 接口时需要使用这个 token，请妥善保管",
      "confirmSaved": "我已保存"
    },
    "subscribers": {
      "title": "{id} 的订阅者",
      "description": "当全局开关和该 endpoint 开关都开启时，这些订阅关系会接收到回调",
      "generatedAt": "生成时间：{date}",
      "userId": "用户 ID",
      "server": "区服",
      "dataType": "数据类型",
      "createdAt": "创建时间",
      "empty": "当前 endpoint 暂无订阅者",
      "totalLabel": "订阅数",
      "usersLabel": "订阅用户",
      "byServer": "按区服",
      "byDataType": "按数据类型"
    },
    "toast": {
      "loadFailedFallback": "操作失败",
      "loadSettingsFailedTitle": "加载 webhook 设置失败",
      "saveSettingsFailedTitle": "保存 webhook 设置失败",
      "loadEndpointsFailedTitle": "加载 webhook endpoint 失败",
      "loadSubscribersFailedTitle": "加载订阅者失败",
      "createFailedTitle": "创建 endpoint 失败",
      "saveFailedTitle": "保存 endpoint 失败",
      "deleteFailedTitle": "删除 endpoint 失败",
      "settingsSaved": "Webhook 设置已保存",
      "created": "Webhook endpoint 已创建",
      "saved": "Webhook endpoint 已保存",
      "deleted": "Webhook endpoint 已删除",
      "savedWithoutToken": "Endpoint 已保存，但由于 JWT 密钥未配置，后端没有返回 token",
      "copyFailedTitle": "复制 Token 失败",
      "copyFailedEmpty": "Token 为空",
      "copyFailedClipboardUnsupported": "当前环境不支持剪贴板操作",
      "copied": "Token 已复制到剪贴板",
      "validation": {
        "callbackRequired": "回调地址不能为空",
        "callbackInvalid": "回调地址必须是合法的 http 或 https URL",
        "idInvalid": "Endpoint ID 不能包含斜杠",
        "credentialInvalid": "凭证不能包含斜杠",
        "jwtSecretInvalid": "JWT 密钥不能是空字符串"
      }
    }
  },
  "adminSponsors": {
    "toolbox": {
      "title": "已认证工具箱用户",
      "description": "管理订单验证和人工认证的赞助资格。曾经赞助过即可永久使用头像框。",
      "add": "添加赞助用户",
      "addDescription": "查找已有工具箱账号，确认赞助记录后为其手动认证",
      "search": "查询用户",
      "searchHint": "工具箱 ID、昵称、邮箱或爱发电 ID",
      "findUser": "查找工具箱用户",
      "loading": "正在加载用户…",
      "empty": "没有符合条件的认证用户",
      "noUser": "未找到可管理的用户，请检查 ID、昵称或邮箱",
      "manage": "管理赞助资格",
      "select": "选择用户",
      "eligible": "已认证",
      "ineligible": "未启用",
      "granted": "手动认证",
      "blocked": "撤销资格",
      "automatic": "恢复自动验证",
      "banned": "账号已封禁",
      "oauth2": "OAuth2 验证",
      "order": "订单号验证",
      "userId": "工具箱 ID：{id}",
      "afdianId": "爱发电 ID：{id}",
      "updated": "{actor} · {date}",
      "target": "为 {name}（{id}）设置赞助资格",
      "access": "资格设置",
      "grantedHelp": "确认该用户曾经赞助过，永久开放头像框。不需要绑定爱发电，也不会新增赞助墙条目。",
      "blockedHelp": "停用该用户的赞助头像框，重新验证订单也不会恢复。保留原有订单、绑定及头像框选择。",
      "automaticHelp": "清除人工设置，重新按已绑定账号的历史赞助记录判断资格",
      "note": "操作备注（必填）",
      "noteHint": "填写赞助来源、认证依据或调整原因，仅管理员可见",
      "noteRequired": "请填写操作备注，最多约 330 个汉字",
      "save": "保存资格",
      "saved": "赞助资格已更新",
      "loadFailed": "赞助用户加载失败，请重试"
    },
    "binding": {
      "title": "工具箱绑定",
      "bound": "已绑定",
      "unbound": "未绑定"
    },
    "title": "赞助者管理",
    "description": "维护赞助者名单展示资料与赞助时长：爱发电时长由订单自动计算，其他渠道的赞助在这里手动录入",
    "generatedAt": "生成时间：{date}",
    "common": {
      "fallback": "—",
      "anonymous": "匿名赞助者"
    },
    "contribution": {
      "amount": "¥{amount}",
      "month": "爱发电 {count} 个月"
    },
    "actions": {
      "refresh": "刷新名单",
      "syncAfdian": "从爱发电同步",
      "edit": "编辑资料",
      "create": "新增赞助者"
    },
    "stats": {
      "total": "赞助者总数",
      "active": "当前赞助",
      "bound": "已绑定工具箱",
      "amount": "记录金额合计",
      "newRecords": "12 个月新增 {count}",
      "formerDetail": "曾经赞助 {count}",
      "boundShare": "占全部赞助者 {percent}",
      "amountDetail": "{count} 位有金额记录",
      "newRecordsTrend": "近 12 个月每月新增的赞助者记录"
    },
    "breakdown": {
      "share": "{count} · {percent}",
      "empty": "暂无数据",
      "source": {
        "title": "来源",
        "description": "全部赞助者按记录来源",
        "unknown": "未标注"
      },
      "plan": {
        "title": "赞助档位",
        "description": "人数最多的 5 个档位",
        "unnamed": "未设置档位",
        "other": "其他 {count} 个档位"
      },
      "expiry": {
        "title": "当前赞助到期",
        "description": "按实际到期时间距今天数",
        "within7": "7 天内",
        "within30": "8–30 天",
        "within90": "31–90 天",
        "later": "90 天以上",
        "none": "无到期时间"
      }
    },
    "source": {
      "afdian": "爱发电",
      "manual": "手动录入",
      "legacy": "旧版数据",
      "imported": "导入"
    },
    "filter": {
      "search": "搜索赞助者",
      "searchPlaceholder": "名称、ID、档位或来源",
      "category": "按状态筛选",
      "all": "全部",
      "noMatch": "没有符合条件的赞助者",
      "clear": "清除筛选"
    },
    "category": {
      "current": "当前赞助",
      "former": "曾经赞助"
    },
    "afdianSync": {
      "enabled": "允许更新",
      "disabled": "不从爱发电更新"
    },
    "list": {
      "title": "赞助者名单",
      "description": "列表按后端返回顺序展示；分类与到期时间由后端根据爱发电订单和手动时长计算",
      "total": "共 {total} 位",
      "filteredTotal": "{count} / {total} 位",
      "manualProfile": "{count} 位手动保护资料",
      "migrationPending": "{count} 位待拆分时长"
    },
    "table": {
      "supporter": "赞助者",
      "tier": "赞助档位",
      "status": "状态",
      "source": "来源",
      "lastSupport": "最近赞助",
      "effectiveExpiry": "实际到期时间",
      "contribution": "赞助贡献",
      "amount": "记录金额",
      "toolbox": "工具箱",
      "protect": "手动保护",
      "protectLabel": "不从爱发电更新 {name} 的资料",
      "expiresOn": "{date} 到期",
      "expiredOn": "{date} 已到期",
      "empty": "暂无赞助者记录"
    },
    "edit": {
      "title": "编辑赞助者资料",
      "profileGroup": "展示资料",
      "name": "显示名称",
      "avatar": "头像 URL",
      "avatarPlaceholder": "https://example.com/avatar.png",
      "planName": "赞助档位",
      "source": "来源",
      "paidAt": "最近赞助时间",
      "paidAtPlaceholder": "未设置",
      "saveProfile": "保存资料",
      "message": "留言",
      "afdianSyncDisabled": "不从爱发电更新这个资料",
      "afdianSyncHelp": "开启后，手动编辑的昵称、头像、档位和留言不会被后续爱发电同步覆盖；爱发电订单仍会计入时长",
      "manualProfileHint": "此处只保存展示用资料和同步策略；爱发电 API key 与 webhook 配置仍应只存在后端"
    },
    "syncDialog": {
      "title": "从爱发电同步？",
      "description": "将向爱发电拉取最新订单并更新所有未关闭同步的赞助者资料与时长。此操作会在后台执行，完成后列表自动刷新。"
    },
    "afdianToggleDialog": {
      "disableTitle": "停止从爱发电更新？",
      "disableDescription": "{name} 的昵称、头像、档位和留言将不再被爱发电同步覆盖；爱发电订单仍会计入时长",
      "confirmDisable": "停止更新",
      "enableTitle": "恢复从爱发电更新？",
      "enableDescription": "下一次同步会用爱发电的资料覆盖 {name} 手动编辑过的昵称、头像、档位和留言",
      "confirmEnable": "恢复更新"
    },
    "duration": {
      "title": "赞助时长",
      "migrationPending": "这位赞助者还保留着旧版的单一到期时间，完成一次爱发电同步后才会拆分为爱发电时长和手动时长，届时才能录入手动时长",
      "afdianPart": "爱发电时长到期",
      "afdianMonths": "共 {count} 个月",
      "manualPart": "手动时长",
      "manualCount": "{count} 条记录",
      "stackRule": "接在爱发电时长之后依次累加",
      "effective": "实际到期时间",
      "none": "无",
      "reported": "爱发电最近一次报告的方案到期时间：{date}",
      "amount": {
        "day": "{count} 天",
        "month": "{count} 个月"
      },
      "orders": {
        "title": "爱发电订单（只读）",
        "empty": "没有爱发电订单",
        "paidAt": "时间",
        "plan": "方案",
        "kind": "时长",
        "amount": "实付",
        "customPlan": "自选方案",
        "months": "{count} 个月",
        "kinds": {
          "no_time": "不计时长",
          "ignored": "不计入"
        }
      },
      "manual": {
        "title": "手动时长",
        "add": "添加手动时长",
        "addDialogTitle": "添加手动时长",
        "editDialogTitle": "编辑手动时长",
        "empty": "还没有手动时长",
        "migrated": "迁移",
        "startsAt": "最早开始：{date}",
        "createdBy": "{user} 录入于 {date}",
        "updatedBy": "{user} 修改于 {date}",
        "edit": "编辑",
        "delete": "删除",
        "deleteTitle": "删除这条手动时长？",
        "deleteDescription": "将删除 {amount} 的手动时长，实际到期时间会随之缩短"
      },
      "form": {
        "amount": "数量",
        "unit": "单位",
        "units": {
          "month": "月（31 天）",
          "day": "天"
        },
        "startsAt": "最早开始时间",
        "startsAtPlaceholder": "现在",
        "startsAtHelp": "留空即为现在。实际从爱发电时长和之前的手动时长结束后才开始计算；只有赞助已中断时才从这里开始，此时不能晚于现在。",
        "note": "备注 / 原因",
        "notePlaceholder": "例如：微信转账 30 元"
      },
      "validation": {
        "amount": "数量必须是正整数（最多 1200 个月或 36600 天）",
        "note": "请填写备注（最多 500 字节）"
      }
    },
    "create": {
      "title": "新增赞助者",
      "description": "用于通过爱发电以外渠道赞助的人。创建后可以在资料里添加手动时长。",
      "submit": "创建"
    },
    "toast": {
      "actionFailedFallback": "操作失败",
      "loadFailedTitle": "加载赞助者失败",
      "saveFailedTitle": "保存赞助者失败",
      "syncFailedTitle": "爱发电同步失败",
      "saved": "赞助者资料已保存",
      "created": "赞助者已创建",
      "synced": "已请求从爱发电同步",
      "afdianSyncDisabled": "已设为不从爱发电更新",
      "afdianSyncEnabled": "已允许从爱发电更新",
      "manualSaved": "手动时长已保存",
      "manualSaveFailedTitle": "保存手动时长失败",
      "manualDeleted": "手动时长已删除",
      "manualDeleteFailedTitle": "删除手动时长失败",
      "validation": {
        "nameRequired": "显示名称不能为空"
      }
    }
  },
  "adminStatistics": {
    "common": {
      "fallback": "—",
      "success": "成功",
      "failure": "失败",
      "otherEntries": "另有 {kinds} 项，共 {count} 条"
    },
    "dashboard": {
      "generatedAt": "数据生成于 {time}",
      "refresh": "刷新",
      "stat": {
        "totalUsers": "用户总数",
        "bindingsPerUser": "人均绑定 {count} 个游戏账号",
        "newRegistrations": "24 小时新注册",
        "vsPrevious24h": "较前 24 小时",
        "totalBindings": "游戏账号绑定",
        "verifiedBindings": "已验证 {count} · {percent}",
        "totalUploads": "累计上传",
        "uploadsPerUser": "人均 {count} 次",
        "uploadsWindow": "{hours} 小时上传",
        "failedWindow": "{hours} 小时上传失败",
        "failureRate": "失败率 {percent}",
        "staff": "管理团队",
        "staffDetail": "超级管理员 {superAdmin} · 管理员 {admin}",
        "banned": "已封禁用户",
        "bannedShare": "占全部用户 {percent}"
      },
      "breakdown": {
        "byServer": "各区服绑定",
        "byServerHint": "全部游戏账号绑定",
        "byMethod": "上传方式",
        "byDataType": "数据类型",
        "windowHint": "最近 {hours} 小时的上传",
        "empty": "暂无数据"
      },
      "chart": {
        "title": "趋势",
        "description": "上传、上传失败和新注册各占一张图，时间轴对齐；鼠标移到任意一张图上可同时查看三项",
        "uploads": "上传",
        "registrations": "新注册",
        "failures": "上传失败",
        "successRate": "成功率",
        "rangeLabel": "时间范围",
        "bucketLabel": "时间粒度",
        "range7d": "近 7 天",
        "range14d": "近 14 天",
        "range30d": "近 30 天",
        "bucketDay": "按日",
        "bucketWeek": "按周",
        "bucketMonth": "按月",
        "tableTime": "时间",
        "empty": "暂无数据"
      },
      "trend": {
        "compare": {
          "day": "后 {n} 天对比前 {n} 天",
          "week": "后 {n} 周对比前 {n} 周",
          "month": "后 {n} 个月对比前 {n} 个月"
        },
        "dailyAverage": "日均",
        "peak": "峰值",
        "failureRate": "失败率",
        "worstRate": "最高失败率",
        "bestRate": "最低失败率"
      },
      "hourly": {
        "title": "近 24 小时上传",
        "description": "每小时的上传次数，失败的部分叠在柱顶；最右一柱是还没过完的这一小时",
        "successRate": "成功率",
        "peakHour": "峰值时段",
        "hourlyAverage": "每小时平均",
        "previousTotal": "前 24 小时",
        "succeeded": "上传成功",
        "failed": "上传失败",
        "chartLabel": "近 24 小时每小时的上传次数，可用左右方向键逐小时查看",
        "readout": "{time}：成功 {success} 次，失败 {failed} 次"
      },
      "matrix": {
        "title": "上传方式 × 数据类型",
        "method": "上传方式",
        "total": "合计"
      },
      "quality": {
        "title": "上传质量",
        "description": "近 24 小时每种上传方式的成功率与处理耗时。",
        "restrictedHint": "管理员看到的数字不含超级管理员和你本人的上传，也不含未通过身份校验的上传。",
        "latencyP50": "处理耗时 P50",
        "latencyP50Hint": "一半的上传快于此",
        "latencyP95": "处理耗时 P95",
        "latencyP95Hint": "95% 的上传快于此",
        "activeAccounts": "活跃游戏账号",
        "activeAccountsHint": "成功上传过的已验证账号",
        "v3Share": "HarukiProxy V3 占比",
        "v2OnlyAccounts": "仍只用 V2 的账号 {count} 个",
        "attempts": "次数",
        "failed": "失败",
        "accounts": "活跃账号",
        "empty": "近 24 小时没有上传"
      },
      "failureStage": {
        "title": "失败阶段",
        "description": "近 24 小时失败的上传停在哪一步",
        "empty": "近 24 小时没有失败的上传",
        "buildContext": "建立上传上下文",
        "accountPolicy": "账号策略检查",
        "decodePayload": "解析数据",
        "validatePayloadIdentity": "校验数据归属",
        "preprocess": "预处理",
        "persist": "保存数据",
        "validateResult": "校验结果",
        "decrypt": "解密",
        "stale": "数据已过期",
        "retrieve": "拉取{type}数据",
        "unknown": "未记录阶段"
      },
      "toast": {
        "loadFailedTitle": "加载仪表盘失败",
        "loadChartFailedTitle": "加载图表失败",
        "loadQualityFailedTitle": "加载上传质量失败",
        "loadFailedFallback": "加载失败"
      }
    },
    "systemLogs": {
      "pagination": {
        "prev": "上一页",
        "next": "下一页",
        "total": "共 {total} 条日志"
      },
      "overview": {
        "title": "概览",
        "scope": "符合筛选条件的全部日志"
      },
      "summary": {
        "total": "总日志",
        "successRate": "成功率",
        "share": "占 {share}",
        "actionKinds": "{count} 种操作",
        "topReason": "最多：{reason}",
        "failureRate": "失败率 {rate}"
      },
      "breakdown": {
        "actions": "操作排行",
        "actionsHint": "范围内出现最多的操作",
        "actorTypes": "操作者类型",
        "actorTypesHint": "这些日志由谁触发",
        "reasons": "失败原因",
        "reasonsHint": "失败日志记录的原因",
        "pageActors": "当前页操作者",
        "pageActorsHint": "只统计下方表格显示的 {count} 条",
        "empty": "暂无数据",
        "noFailures": "范围内没有失败的日志",
        "unknownReason": "未记录原因"
      },
      "actorType": {
        "anonymous": "匿名",
        "user": "用户",
        "admin": "管理员",
        "system": "系统",
        "unknown": "未知"
      },
      "filters": {
        "result": "结果",
        "allResults": "全部",
        "actorType": "操作者类型",
        "allActorTypes": "全部操作者",
        "range": "时间范围"
      },
      "range": {
        "last24h": "最近 24 小时",
        "last7d": "最近 7 天",
        "last30d": "最近 30 天"
      },
      "searchActionPlaceholder": "按操作名搜索…",
      "resetSearch": "清除搜索",
      "refresh": "刷新",
      "exportButton": "导出",
      "table": {
        "result": "结果",
        "action": "操作",
        "actionAndRequest": "操作 / 请求",
        "actor": "操作者",
        "time": "时间",
        "empty": "暂无日志",
        "emptyHint": "所选时间范围内没有日志",
        "emptyFiltered": "没有符合筛选条件的日志，可以放宽条件或扩大时间范围",
        "openDetail": "查看详情"
      },
      "detail": {
        "title": "日志详情",
        "result": "结果",
        "time": "时间",
        "action": "操作",
        "target": "对象",
        "request": "请求",
        "user": "用户",
        "actorType": "操作者类型",
        "requestId": "请求 ID",
        "detail": "详情",
        "copy": "复制详情",
        "copied": "详情已复制",
        "copyFailed": "复制失败"
      },
      "toast": {
        "loadFailedTitle": "加载日志失败",
        "loadSummaryFailedTitle": "加载日志摘要失败",
        "loadDetailFailedTitle": "加载详情失败",
        "loadFailedFallback": "加载失败",
        "exportSuccess": "导出成功",
        "exportFailedTitle": "导出失败",
        "exportFailedFallback": "导出失败"
      }
    },
    "uploadLogs": {
      "pagination": {
        "prev": "上一页",
        "next": "下一页",
        "total": "共 {total} 条记录"
      },
      "filters": {
        "title": "筛选条件",
        "expand": "展开",
        "collapse": "收起",
        "from": "开始时间",
        "fromPlaceholder": "选择开始时间",
        "to": "结束时间",
        "toPlaceholder": "选择结束时间",
        "gameUid": "游戏UID",
        "gameUidPlaceholder": "多个UID用逗号分隔",
        "method": "上传方式",
        "dataType": "数据类型",
        "server": "区服",
        "status": "上传状态",
        "sort": "排序",
        "sortPlaceholder": "排序方式",
        "allMethods": "全部方式",
        "allDataTypes": "全部类型",
        "allServers": "全部区服",
        "allStatuses": "全部状态",
        "selectedMore": "{first} +{count}",
        "activeCount": "已选 {count} 项"
      },
      "overview": {
        "title": "概览",
        "scope": "符合筛选条件的全部上传"
      },
      "table": {
        "status": "状态",
        "user": "用户",
        "owner": "所属用户",
        "actor": "实际上传者",
        "noOwner": "未关联用户",
        "server": "区服",
        "method": "方式",
        "dataType": "数据类型",
        "error": "错误信息",
        "details": "详情",
        "viewDetails": "查看详情",
        "viewError": "查看错误",
        "time": "时间",
        "duration": "耗时",
        "methodAndDataType": "方式 / 类型",
        "empty": "暂无上传日志"
      },
      "actor": {
        "owner": "本人",
        "delegate": "代传",
        "unknown": "无工具箱用户"
      },
      "authMethod": {
        "browserSession": "浏览器会话",
        "oauth2": "OAuth2 应用",
        "iosUserCode": "iOS 用户码",
        "gameSessionProxy": "游戏会话代理",
        "serviceToken": "服务令牌"
      },
      "authorizationSource": {
        "owner": "账号所有者",
        "grant": "写授权"
      },
      "detail": {
        "title": "上传记录详情",
        "description": "所属用户为数据归属方，实际上传者为发起本次上传的工具箱用户",
        "gameUserId": "游戏 UID",
        "authMethod": "身份方式",
        "authorizationSource": "授权来源",
        "grantId": "授权 ID",
        "grantIdHint": "审计快照，对应授权可能已不存在",
        "actorKind": "上传者关系",
        "oauthClientId": "OAuth 客户端",
        "client": "客户端 / 版本",
        "platform": "平台",
        "requestId": "请求 ID",
        "duration": "处理耗时",
        "requestSize": "请求大小",
        "claimedGameUserId": "载荷声明 UID",
        "failureStage": "失败阶段",
        "errorCode": "错误码"
      },
      "errorDialog": {
        "title": "上传失败详情",
        "description": "查看这次上传失败时后端返回的错误信息",
        "close": "关闭"
      },
      "summary": {
        "totalUploads": "总上传数",
        "successRate": "成功率",
        "failureRate": "失败率 {rate}",
        "activeAccounts": "活跃游戏账号",
        "activeAccountsHint": "有成功上传的已验证账号",
        "latency": "处理耗时中位数",
        "latencyDetail": "P95 {p95} · {count} 个样本",
        "latencyNoSamples": "没有耗时记录",
        "volume": {
          "hour": "每小时上传量走势",
          "day": "每日上传量走势"
        },
        "failureVolume": {
          "hour": "每小时失败数走势",
          "day": "每日失败数走势"
        },
        "peak": {
          "hour": "峰值 {count} 次/小时",
          "day": "峰值 {count} 次/天"
        }
      },
      "charts": {
        "byMethod": "按上传方式",
        "byDataType": "按数据类型",
        "byServer": "按区服",
        "failureStages": "失败阶段",
        "noFailures": "范围内没有失败的上传",
        "unknownStage": "未记录阶段",
        "empty": "暂无数据"
      },
      "method": {
        "manual": "手动上传",
        "iosProxy": "iOS代理",
        "iosScript": "iOS脚本",
        "harukiProxy": "HarukiProxy",
        "inherit": "引继码",
        "internal": "内部上传",
        "oauth2": "OAuth2"
      },
      "dataType": {
        "suite": "Suite",
        "mysekai": "MySekai",
        "mysekaiBirthdayParty": "MySekai 生日派对"
      },
      "sort": {
        "uploadTimeDesc": "上传时间 ↓",
        "uploadTimeAsc": "上传时间 ↑",
        "idDesc": "ID ↓",
        "idAsc": "ID ↑"
      },
      "toast": {
        "loadFailedTitle": "加载上传日志失败",
        "loadAnalyticsFailedTitle": "加载上传统计失败",
        "loadFailedFallback": "加载失败",
        "filterFailedTitle": "筛选失败",
        "invalidTimeRange": "开始时间不能晚于结束时间"
      }
    }
  },
  "adminGameBindings": {
    "common": {
      "cancel": "取消",
      "create": "创建"
    },
    "status": {
      "verified": "已验证",
      "unverified": "未验证"
    },
    "stats": {
      "total": "绑定总数",
      "verified": "已验证",
      "verifiedShare": "占全部绑定的 {share}",
      "unverified": "未验证",
      "siteWide": "全站",
      "matching": "符合当前筛选",
      "matchingPage": "第 {page} / {pages} 页",
      "byServer": "区服分布",
      "byServerHint": "全站的全部绑定",
      "noBindings": "还没有游戏账号绑定",
      "loadFailed": "全站统计加载失败",
      "retry": "重试",
      "sharingTitle": "本页共享设置",
      "sharingHint": "仅统计列表当前显示的 {count} 条绑定",
      "sharingEmpty": "当前列表没有绑定",
      "sharingFailed": "列表未能加载，没有可统计的绑定",
      "sharing": {
        "suitePublicApi": "账号数据 · 公开查询",
        "suiteBots": "账号数据 · 同步给 Bot",
        "mysekaiPublicApi": "烤森数据 · 公开查询",
        "mysekaiFixtureApi": "烤森数据 · 家具互助",
        "mysekaiBots": "烤森数据 · 同步给 Bot"
      }
    },
    "filters": {
      "title": "搜索与筛选",
      "verification": "验证状态",
      "allVerification": "全部",
      "addButton": "新增绑定",
      "fuzzySearch": "模糊搜索",
      "fuzzySearchPlaceholder": "游戏ID / 用户名 / 邮箱",
      "exactGameId": "精确游戏ID",
      "exactGameIdPlaceholder": "游戏用户ID",
      "toolboxUserId": "工具箱用户ID",
      "toolboxUserIdPlaceholder": "工具箱用户ID",
      "server": "区服",
      "allServers": "全部区服",
      "sort": "排序",
      "sortPlaceholder": "排序方式",
      "searchButton": "查询"
    },
    "sort": {
      "idDesc": "ID ↓",
      "idAsc": "ID ↑",
      "gameUserIdDesc": "游戏ID ↓",
      "gameUserIdAsc": "游戏ID ↑",
      "userIdDesc": "用户ID ↓",
      "userIdAsc": "用户ID ↑"
    },
    "table": {
      "title": "绑定列表",
      "selectRowOf": "选择游戏账号 {gameUserId}",
      "sharing": {
        "suite": "账号 {on}/{total}",
        "mysekai": "烤森 {on}/{total}",
        "publicApi": "已开启公开查询",
        "none": "无共享设置"
      },
      "role": {
        "admin": "管理员",
        "superAdmin": "超级管理员"
      },
      "selectAll": "全选",
      "selectRow": "选择该行",
      "selectedCount": "已选 {count} 条",
      "batchUnbind": "批量解绑",
      "openMenu": "打开菜单",
      "total": "共 {total} 条记录",
      "empty": "暂无游戏账号绑定记录",
      "columns": {
        "server": "区服",
        "gameId": "游戏ID",
        "account": "游戏账号",
        "verified": "验证",
        "sharing": "已开启的共享",
        "user": "所属用户",
        "actions": "操作"
      },
      "menu": {
        "edit": "编辑",
        "reassign": "转移绑定",
        "unbind": "解绑"
      },
      "batchDialog": {
        "title": "确认批量解绑",
        "description": "将解绑选中的 {count} 条游戏账号绑定，此操作不可撤销",
        "cancel": "取消",
        "confirm": "确认解绑"
      }
    },
    "editDialog": {
      "createTitle": "新增游戏绑定",
      "createDescription": "为用户添加新的游戏账号绑定",
      "editTitle": "编辑游戏绑定",
      "editDescription": "修改游戏账号绑定的数据设置",
      "toolboxUserId": "工具箱用户ID",
      "toolboxUserIdPlaceholder": "输入工具箱用户ID",
      "server": "服务器",
      "gameUserId": "游戏用户ID",
      "gameUserIdPlaceholder": "输入游戏内用户ID",
      "suiteSettingsTitle": "Suite 数据设置",
      "mysekaiSettingsTitle": "MySekai 数据设置",
      "accountTitle": "游戏账号",
      "owner": "所属用户 ID {userId}",
      "identityLockedHint": "区服、游戏 ID 和所属用户不能在这里修改；要换绑到其他用户请使用「转移绑定」",
      "botsHint": "把这类数据同步给对应的 QQ 群 Bot",
      "permissionHelp": {
        "suite": {
          "allowPublicApi": "开启后，任何知道这个 UID 的人都能通过工具箱接口查看该用户上传的账号数据"
        },
        "mysekai": {
          "allowPublicApi": "开启后，任何知道这个 UID 的人都能通过工具箱接口查看该用户上传的烤森数据",
          "allowFixtureApi": "开启后，这个 UID 会出现在烤森家具互助列表，其他玩家可以来访"
        }
      }
    },
    "reassignDialog": {
      "title": "转移游戏账号",
      "description": "将 {server} 游戏 ID {gameId} 从 {fromUser} 转移到目标用户",
      "targetUserIdLabel": "目标用户ID",
      "targetUserIdPlaceholder": "请输入目标工具箱用户ID",
      "confirm": "确认转移"
    },
    "deleteDialog": {
      "title": "确认解绑",
      "description": "此操作将解除 {server} 游戏账号 {gameUserId} 的绑定关系",
      "confirm": "确认解绑"
    },
    "toast": {
      "loadFailedTitle": "加载游戏绑定失败",
      "loadFailedFallback": "加载失败",
      "unbound": "已解绑",
      "unbindFailedTitle": "解绑失败",
      "reassigned": "已转移",
      "reassignFailedTitle": "转移失败",
      "batchUnbindFailedTitle": "批量解绑失败",
      "invalidSelectedRecords": "选中的记录格式无效",
      "batchUnbound": "已批量解绑 {count} 条",
      "bindingUpdated": "绑定已更新",
      "bindingCreated": "绑定已创建",
      "saveFailedTitle": "保存失败"
    }
  },
  "adminUsers": {
    "role": {
      "user": "用户",
      "admin": "管理员",
      "superAdmin": "超级管理员"
    },
    "status": {
      "normal": "正常",
      "banned": "已封禁",
      "deleted": "已删除（旧版）"
    },
    "common": {
      "actions": "操作",
      "allowed": "允许",
      "denied": "禁止",
      "verified": "已验证",
      "unverified": "未验证",
      "success": "成功",
      "failed": "失败",
      "edit": "编辑",
      "save": "保存",
      "cancel": "取消",
      "confirm": "确认",
      "unbound": "未绑定",
      "openMenu": "打开菜单",
      "fallback": "—",
      "delete": "删除",
      "copyId": "复制用户 ID",
      "idCopied": "用户 ID 已复制",
      "copyFailed": "复制失败"
    },
    "management": {
      "title": "用户管理",
      "stats": {
        "totalUsers": "全站用户",
        "newInDays": "近 {days} 天 +{count}",
        "trendLabel": "近 {days} 天每日注册数",
        "staff": "管理团队",
        "staffBreakdown": "超级管理员 {superAdmin} · 管理员 {admin}",
        "banned": "已封禁",
        "shareOfAll": "占全站 {percent}",
        "filtered": "符合筛选",
        "listed": "列表中的用户",
        "listScopeSuperAdmin": "不含你自己的账号",
        "listScopeAdmin": "不含你自己和超级管理员",
        "loadFailed": "统计加载失败",
        "retry": "重新加载统计"
      },
      "pageSummary": {
        "count": "本页 {count} 人",
        "staff": "管理员 {count}",
        "banned": "已封禁 {count}",
        "allowCN": "允许国服 MySekai {count}"
      },
      "filters": {
        "searchLabel": "搜索",
        "searchPlaceholder": "搜索用户名、邮箱、用户 ID 或社交账号…",
        "roleLabel": "角色",
        "roleAll": "全部",
        "statusLabel": "账号状态",
        "statusAll": "全部",
        "allowCNLabel": "国服 MySekai 权限",
        "allowCNAll": "全部",
        "sortLabel": "排序",
        "sortIdDesc": "ID ↓",
        "sortIdAsc": "ID ↑",
        "sortNameDesc": "名称 ↓",
        "sortNameAsc": "名称 ↑",
        "sortCreatedAtDesc": "注册时间 ↓",
        "sortCreatedAtAsc": "注册时间 ↑",
        "createdFromLabel": "注册时间起",
        "createdFromPlaceholder": "按起始时间过滤",
        "createdToLabel": "注册时间止",
        "createdToPlaceholder": "按结束时间过滤",
        "allowCNShort": "国服 MySekai",
        "toggle": "筛选条件"
      },
      "batch": {
        "selectedCount": "已选 {count} 个用户",
        "banButton": "批量封禁",
        "banDialogTitle": "确认批量封禁",
        "banDialogDescription": "确定要封禁选中的 {count} 个用户吗？此操作可以撤销。",
        "banDialogConfirm": "确认封禁",
        "unbanButton": "批量解封",
        "forceLogoutButton": "批量登出",
        "roleButton": "批量角色",
        "roleTitle": "修改选中用户的角色",
        "rolePlaceholder": "选择目标角色",
        "roleConfirm": "确认修改",
        "allowCNButton": "批量国服 MySekai 权限",
        "allowCNTitle": "修改选中用户的国服 MySekai 权限",
        "allowCNPlaceholder": "修改权限状态",
        "allowCNEnable": "允许国服功能",
        "allowCNDisable": "禁止国服功能",
        "allowCNConfirm": "确认修改",
        "forceLogoutDialogTitle": "确认批量登出",
        "forceLogoutDialogDescription": "确定要强制登出选中的 {count} 个用户吗？他们的活跃会话将被注销。",
        "forceLogoutDialogConfirm": "确认登出",
        "roleDialogTitle": "确认变更角色",
        "roleDialogDescription": "确定要将选中的 {count} 个用户的角色变更为 {role} 吗？",
        "roleDialogConfirm": "确认变更"
      },
      "pagination": {
        "prevPage": "上一页",
        "nextPage": "下一页",
        "totalUsers": "共 {total} 个用户",
        "pageSize": "每页显示",
        "jumpToPage": "跳转到页",
        "firstPage": "第一页",
        "lastPage": "最后一页"
      },
      "table": {
        "columns": {
          "username": "用户名",
          "email": "邮箱",
          "role": "角色",
          "allowCN": "国服 MySekai 权限",
          "status": "账号状态",
          "createdAt": "注册时间",
          "user": "用户"
        },
        "empty": "暂无用户数据",
        "loadError": "加载用户列表失败",
        "retry": "重试",
        "emptyFiltered": "没有符合当前筛选条件的用户",
        "selectPage": "全选本页",
        "selectUser": "选择 {name}",
        "viewDetail": "查看详情"
      },
      "toast": {
        "loadFailedTitle": "加载用户列表失败",
        "loadFailedFallback": "加载失败",
        "batchBanSuccess": "已批量封禁 {count} 个用户",
        "batchBanFailedTitle": "批量封禁失败",
        "batchBanFailedFallback": "批量封禁失败",
        "batchUnbanSuccess": "已批量解封 {count} 个用户",
        "batchUnbanFailedTitle": "批量解封失败",
        "batchUnbanFailedFallback": "批量解封失败",
        "batchForceLogoutSuccess": "已批量强制登出 {count} 个用户",
        "batchForceLogoutFailedTitle": "批量强制登出失败",
        "batchForceLogoutFailedFallback": "批量强制登出失败",
        "batchRoleSuccess": "已批量修改 {count} 个用户的角色",
        "batchRoleFailedTitle": "批量修改角色失败",
        "batchRoleFailedFallback": "批量修改角色失败",
        "batchAllowCNSuccess": "已批量修改 {count} 个国服功能权限",
        "batchAllowCNFailedTitle": "批量功能权限失败",
        "batchAllowCNFailedFallback": "批量功能权限失败"
      }
    },
    "detail": {
      "backToList": "返回用户列表",
      "notFound": "用户不存在，可能已被删除或链接有误",
      "header": {
        "userId": "用户 ID",
        "banReason": "封禁原因"
      },
      "stats": {
        "gameBindings": "游戏账号",
        "verifiedCount": "已验证 {count}",
        "authorizedSocials": "授权社交账号",
        "mainSocial": "主绑定：{platform}",
        "noMainSocial": "未绑定主社交平台",
        "uploads": "近 {hours} 小时上传",
        "uploadBreakdown": "成功 {success} · 失败 {failure}",
        "uploadSuccessRate": "成功率 {percent}",
        "noUploads": "该时段内没有上传",
        "systemLogs": "近 {hours} 小时操作记录",
        "lastAt": "最近 {time}",
        "noEvents": "该时段内没有记录"
      },
      "account": {
        "title": "账号设置",
        "roleHelp": "新角色的权限立即生效",
        "iosHelp": "用户在 iOS 快捷指令中上传数据时使用"
      },
      "tabs": {
        "info": "基本信息",
        "activity": "活动记录",
        "oauth": "OAuth 授权",
        "game": "游戏绑定",
        "social": "社交平台",
        "authSocial": "授权社交",
        "ios": "iOS 上传码"
      },
      "info": {
        "role": "角色",
        "accountStatus": "账号状态",
        "email": "邮箱",
        "registeredAt": "注册时间",
        "comingSoon": "开发中...",
        "changeRole": "修改角色：",
        "allowCNFeature": "允许使用国服 MySekai 功能",
        "unban": "解封",
        "ban": "封禁",
        "banDialogTitle": "确认封禁",
        "banDialogDescription": "确定要封禁用户 {name} 吗？",
        "forceLogout": "强制登出",
        "resetPassword": "重置密码",
        "restore": "恢复",
        "delete": "永久删除",
        "deleteDialogTitle": "永久删除账号",
        "deleteDialogDescription": "将永久删除用户 {name}（{userId}）及其登录身份、社交和游戏绑定、数据授权、上传码与引继码保险库。此操作无法恢复；审计和上传历史会保留。",
        "deleteConfirmationLabel": "输入用户 ID {userId} 以确认",
        "deleteConfirmationMismatch": "输入的用户 ID 不匹配",
        "deleteDialogConfirm": "永久删除",
        "forceLogoutDialogTitle": "确认强制登出",
        "forceLogoutDialogDescription": "确定要强制登出用户 {name} 吗？该用户的所有活跃会话都将被注销，需要重新登录。",
        "forceLogoutDialogConfirm": "确认登出",
        "resetPasswordDialogTitle": "确认重置密码",
        "resetPasswordDialogDescription": "确定要重置用户 {name} 的密码吗？当前密码将立即失效，该用户需要重新设置密码后才能登录。",
        "resetPasswordDialogConfirm": "确认重置",
        "roleDialogTitle": "确认修改角色",
        "roleDialogDescription": "确定要将用户 {name} 的角色修改为 {role} 吗？新的权限将立即生效。",
        "roleDialogConfirm": "确认修改"
      },
      "activity": {
        "title": "活动记录",
        "uploadLogsTitle": "上传日志",
        "uploadLogsDescription": "该用户最近的上传记录，包括失败时后端返回的错误详情",
        "viewAllUploads": "在上传日志中查看全部",
        "columns": {
          "action": "操作",
          "result": "结果",
          "path": "路径",
          "time": "时间"
        },
        "empty": "暂无活动记录",
        "listedOf": "显示最近 {listed} 条，共 {total} 条",
        "listedAll": "共 {total} 条",
        "showAll": "显示全部 {count} 条",
        "showFewer": "收起",
        "byActor": "操作者 {actor}"
      },
      "oauth": {
        "title": "OAuth 授权",
        "revokeAll": "撤销全部",
        "total": "共 {count} 个授权",
        "activeCount": "{count} 个有效",
        "device": "设备：{name}",
        "empty": "暂无 OAuth 授权",
        "revokeAllDialogTitle": "撤销全部授权",
        "revokeAllDialogDescription": "此操作将撤销该用户的全部 {count} 个 OAuth 授权，并使其从所有已连接的第三方应用登出。是否继续？",
        "columns": {
          "client": "应用",
          "scopes": "权限范围",
          "createdAt": "授权时间",
          "status": "状态"
        },
        "status": {
          "active": "有效",
          "revoked": "已撤销",
          "clientDisabled": "应用已禁用"
        }
      },
      "game": {
        "title": "游戏账号绑定",
        "add": "添加绑定",
        "columns": {
          "server": "服务器",
          "gameId": "游戏 ID"
        },
        "edit": "编辑游戏绑定",
        "unbind": "解绑游戏账号",
        "empty": "暂无游戏绑定",
        "total": "共 {count} 个账号",
        "sharingSuite": "Suite 共享 {on}/{total}",
        "sharingMysekai": "MySekai 共享 {on}/{total}",
        "unbindDialogTitle": "确认解绑",
        "unbindDialogDescription": "此操作将解绑游戏账号 {gameUserId}，之后可重新添加"
      },
      "social": {
        "title": "社交平台绑定",
        "add": "添加绑定",
        "empty": "暂无社交平台绑定",
        "delete": "删除社交平台绑定",
        "deleteDialogTitle": "确认删除",
        "deleteDialogDescription": "确定要删除此主社交平台绑定吗？之后可重新添加。"
      },
      "authSocial": {
        "title": "授权社交平台",
        "add": "添加授权",
        "columns": {
          "platform": "平台",
          "userId": "用户 ID",
          "comment": "备注"
        },
        "empty": "暂无授权社交平台",
        "total": "共 {count} 个账号",
        "delete": "删除授权社交平台",
        "deleteDialogTitle": "确认删除",
        "deleteDialogDescription": "确定要删除此授权社交平台吗？之后可重新添加。"
      },
      "ios": {
        "title": "iOS 上传码",
        "regenerate": "重新生成",
        "generate": "生成上传码",
        "empty": "暂无上传码",
        "delete": "删除上传码",
        "deleteDialogTitle": "确认删除",
        "deleteDialogDescription": "确定要删除当前的 iOS 上传码吗？之后可重新生成一个新的。",
        "regenerateDialogTitle": "确认重新生成上传码",
        "regenerateDialogDescription": "确定要为用户 {name} 重新生成 iOS 上传码吗？当前上传码将立即失效，该用户需要在快捷指令中更新为新的上传码。",
        "regenerateDialogConfirm": "重新生成"
      },
      "dialog": {
        "email": {
          "title": "修改邮箱",
          "description": "修改用户 {name} 的邮箱地址",
          "newEmail": "新邮箱地址",
          "placeholder": "请输入邮箱地址",
          "invalid": "请输入有效的邮箱地址，例如 name{'@'}example.com",
          "confirm": "确认修改"
        },
        "gameBinding": {
          "title": "添加游戏绑定",
          "description": "为用户 {name} 添加或更新游戏账号绑定",
          "server": "服务器",
          "gameUserId": "游戏用户 ID",
          "gameUserIdPlaceholder": "输入游戏内用户 ID",
          "suiteSettings": "Suite 数据设置",
          "mysekaiSettings": "MySekai 数据设置"
        },
        "social": {
          "addTitle": "添加社交平台绑定",
          "editTitle": "编辑社交平台绑定",
          "description": "管理用户 {name} 的社交平台主绑定信息",
          "platform": "平台",
          "platformPlaceholder": "选择平台",
          "userId": "用户 ID",
          "userIdPlaceholder": "平台上的用户 ID"
        },
        "authSocial": {
          "addTitle": "添加授权社交平台",
          "editTitle": "编辑授权社交平台",
          "description": "管理用户 {name} 的授权社交平台账号",
          "platform": "平台",
          "platformPlaceholder": "选择平台",
          "userId": "用户 ID",
          "userIdPlaceholder": "平台上的用户 ID",
          "comment": "备注",
          "commentPlaceholder": "备注（可选）"
        }
      },
      "toast": {
        "actionFailedFallback": "操作失败",
        "loadUserFailedTitle": "加载用户详情失败",
        "loadActivityFailedTitle": "加载活动记录失败",
        "loadOAuthFailedTitle": "加载 OAuth 授权失败",
        "loadGameBindingsFailedTitle": "加载游戏绑定失败",
        "loadSocialFailedTitle": "加载社交平台绑定失败",
        "loadAuthSocialFailedTitle": "加载授权社交平台失败",
        "banFailedTitle": "封禁失败",
        "banSuccess": "已封禁用户",
        "unbanFailedTitle": "解封失败",
        "unbanSuccess": "已解封用户",
        "forceLogoutFailedTitle": "强制登出失败",
        "forceLogoutSuccess": "已强制登出",
        "deleteFailedTitle": "删除失败",
        "deleteSuccess": "账号及其绑定已永久删除",
        "restoreFailedTitle": "恢复失败",
        "restoreSuccess": "已恢复用户",
        "resetPasswordFailedTitle": "重置密码失败",
        "resetPasswordSuccess": "已重置密码",
        "updateRoleFailedTitle": "更新角色失败",
        "updateRoleSuccess": "已更新角色为 {role}",
        "updateEmailFailedTitle": "更新邮箱失败",
        "updateEmailSuccess": "邮箱已更新",
        "revokeOAuthFailedTitle": "撤销失败",
        "revokeOAuthSuccess": "已撤销 OAuth 授权",
        "deleteGameBindingFailedTitle": "删除失败",
        "deleteGameBindingSuccess": "已删除游戏绑定",
        "toggleCNFailedTitle": "更新失败",
        "cnEnabled": "已开启国服 MySekai",
        "cnDisabled": "已关闭国服 MySekai",
        "saveGameBindingFailedTitle": "保存失败",
        "saveGameBindingSuccess": "游戏绑定已保存",
        "regenerateIOSFailedTitle": "生成失败",
        "missingIOSCode": "接口未返回上传码",
        "regenerateIOSSuccess": "已重新生成 iOS 上传码",
        "deleteIOSFailedTitle": "删除失败",
        "deleteIOSSuccess": "已删除 iOS 上传码",
        "deleteSocialFailedTitle": "删除失败",
        "deleteSocialSuccess": "已删除社交平台绑定",
        "saveSocialFailedTitle": "更新失败",
        "saveSocialSuccess": "社交平台信息已更新",
        "deleteAuthSocialFailedTitle": "删除失败",
        "deleteAuthSocialSuccess": "已删除授权社交平台",
        "saveAuthSocialFailedTitle": "保存失败",
        "saveAuthSocialSuccess": "授权社交平台已保存"
      }
    }
  }
} as const
