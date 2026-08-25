// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: admin, adminConfig, adminRisk, adminContent, adminOAuthClients, adminWebhooks, adminSponsors, adminStatistics, adminGameBindings, adminUsers
export default {
  "admin": {
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
        "dashboard": "平台关键指标与上传趋势总览。",
        "users": "查看、搜索与管理工具箱用户。",
        "gameBindings": "查询与调整用户的游戏账号绑定。",
        "risk": "维护风控规则并处置风险事件。",
        "tickets": "处理用户提交的工单与回复。",
        "content": "维护友情链接与推荐群聊等站点内容。",
        "sponsors": "管理赞助者名单的展示。",
        "uploadLogs": "追踪玩家数据上传记录与失败原因。",
        "logs": "查看系统运行日志。",
        "oauthClients": "管理 OAuth 客户端、密钥与回调。",
        "webhooks": "管理平台 Webhook 推送。",
        "config": "调整系统级配置（仅超级管理员可见）。"
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
      "tickets": "工单管理",
      "pendingTickets": "{total} 个待管理员处理的工单"
    }
  },
  "adminConfig": {
    "publicApiKeys": {
      "title": "Public API Keys",
      "description": "管理公共 API 密钥配置（仅超级管理员可操作）"
    },
    "runtime": {
      "title": "运行时配置",
      "description": "管理运行时配置项（修改后立即生效）",
      "saveDialogTitle": "应用运行时配置？",
      "saveDialogDescription": "此更改将立即生效并应用于整个系统。请在继续前确认 JSON 内容正确。",
      "saveDialogConfirm": "应用"
    },
    "toast": {
      "loadApiKeysFailedTitle": "加载 Public API Keys 失败",
      "loadRuntimeFailedTitle": "加载运行时配置失败",
      "loadFailedFallback": "加载失败",
      "apiKeysUpdated": "Public API Keys 更新成功",
      "runtimeUpdated": "运行时配置更新成功",
      "invalidJson": "JSON 格式无效",
      "invalidApiKeysSchema": "公共 API 密钥必须是字符串值组成的 JSON 对象",
      "invalidRuntimeSchema": "运行时配置必须是一个 JSON 对象",
      "saveFailedTitle": "保存失败",
      "saveFailedFallback": "保存失败"
    },
    "loadError": "加载配置失败",
    "retry": "重试",
    "unsavedChanges": "有未保存的更改"
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
    "events": {
      "pagination": {
        "prev": "上一页",
        "next": "下一页"
      },
      "title": "风控事件",
      "createButton": "创建事件",
      "createDialogTitle": "创建风控事件",
      "create": "创建",
      "resolveAction": "标记为已解决",
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
      "saveButton": "保存规则",
      "superAdminOnly": "风控规则仅超级管理员可见。",
      "loadError": "加载风控规则失败。",
      "retry": "重试"
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
  "adminContent": {
    "actions": {
      "edit": "编辑",
      "delete": "删除"
    },
    "tabs": {
      "links": "友情链接管理",
      "groups": "推荐群聊管理"
    },
    "linksTab": {
      "title": "友情链接管理",
      "createButton": "添加友情链接",
      "table": {
        "sortOrder": "排序",
        "name": "名称",
        "url": "URL",
        "tags": "标签",
        "actions": "操作"
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
      "emptyItems": "暂无群聊项目",
      "emptyGroups": "暂无群聊分组"
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
        "sortOrderHint": "数值越小越靠前，相同则按 ID 排序。"
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
      "nameUrlRequired": "请填写名称和URL",
      "invalidLinkUrl": "请输入有效的 http(s) 链接",
      "saveFailedTitle": "保存失败",
      "createFailedTitle": "创建失败",
      "deleteFailedTitle": "删除失败",
      "linkUpdated": "友链已更新",
      "linkCreated": "友链已创建",
      "linkDeleted": "已删除友链",
      "groupNameRequired": "请输入分组名称",
      "groupCreated": "分组已创建",
      "groupUpdated": "分组已更新",
      "groupDeleted": "分组已删除",
      "itemNameRequired": "请填写名称",
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
      "nameLabel": "客户端名称",
      "namePlaceholder": "显示名称",
      "clientTypeLabel": "客户端类型",
      "clientTypePlaceholder": "选择类型",
      "clientTypeConfidential": "Confidential (含Secret)",
      "clientTypePublic": "Public (无Secret)",
      "scopesLabel": "授权范围 (Scopes)",
      "redirectUrisLabel": "回调URI (Redirect URIs)",
      "redirectUriPlaceholder": "https://example.com/callback",
      "addRedirectUri": "添加URI"
    },
    "table": {
      "clientId": "Client ID",
      "name": "名称",
      "redirectUris": "回调URI",
      "status": "状态",
      "createdAt": "创建时间",
      "actions": "操作",
      "publicTag": "Public",
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
      "descriptionSuffix": "吗？",
      "cancel": "取消",
      "confirm": "确认"
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
    "statsDialog": {
      "title": "客户端统计",
      "from": "开始时间",
      "to": "结束时间",
      "bucket": "时间粒度",
      "hour": "按小时",
      "day": "按天",
      "apply": "应用筛选",
      "invalidTimeRange": "开始时间不能晚于结束时间",
      "totalAuthorizations": "总授权",
      "activeAuthorizations": "活跃授权",
      "last30Days": "近30天"
    },
    "secretDialog": {
      "title": "凭证生成成功",
      "description": "请注意：这是 Client Secret 唯一一次出现的时刻，系统不会保存其明文。请务必立即复制并安全保存；如遗失只能重新生成。",
      "copy": "复制",
      "confirmSaved": "我已妥善保存"
    },
    "webhooks": {
      "title": "OAuth client Webhook",
      "description": "管理客户端 {clientId} 的数据更新通知 endpoint。",
      "placeholderHint": "Callback URL 支持 {'{server}'}、{'{data_type}'}、{'{user_id}'} 占位符。",
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
        "description": "Bearer 不会回显；留空表示不设置或保持当前值。",
        "callbackUrl": "Callback URL",
        "callbackUrlPlaceholder": "https://example.com/oauth-webhook/{'{server}'}/{'{data_type}'}/{'{user_id}'}",
        "bearer": "Bearer token",
        "bearerPlaceholder": "可选",
        "bearerReplacePlaceholder": "留空保持当前 bearer",
        "bearerHelp": "保存后前端只会显示是否已配置，不会显示明文。",
        "enabled": "启用 endpoint",
        "enabledHelp": "禁用后后端不会向该 endpoint 发送回调。",
        "clearBearer": "清除已配置 bearer",
        "clearBearerHelp": "开启后保存会删除当前 bearer。"
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
      "webhookSaved": "Webhook endpoint 已保存",
      "webhookDeleted": "Webhook endpoint 已删除",
      "copyFailedTitle": "复制失败",
      "copyFailedSecretEmpty": "Secret 为空",
      "copyFailedClipboardUnsupported": "当前环境不支持剪贴板操作",
      "copied": "已复制到剪贴板",
      "validation": {
        "clientIdAndNameRequired": "客户端ID和名称不能为空",
        "nameRequired": "客户端名称不能为空",
        "redirectUriRequired": "请至少填写一个回调URI",
        "scopeRequired": "请至少选择一个Scope"
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
      "description": "管理全局 webhook 开关和 JWT 密钥配置。",
      "globalStatus": "全局投递状态",
      "globalStatusHint": "只有全局开关和 endpoint 开关都开启时，才会真正发送回调。",
      "jwtSecretStatus": "JWT 密钥状态",
      "jwtSecretStatusHint": "只有配置好 JWT 密钥后，后端才会返回可直接使用的 webhook token。",
      "secretAlertTitle": "JWT 密钥尚未配置",
      "secretAlertDescription": "您仍然可以创建和编辑 endpoint，但在配置 JWT 密钥之前，后端不会返回可用的 webhook token。",
      "enableSwitchLabel": "全局启用 webhook 投递",
      "jwtSecretLabel": "Webhook JWT 密钥",
      "jwtSecretPlaceholder": "留空表示保持当前密钥不变",
      "jwtSecretHelp": "只有在您想替换当前密钥时才需要填写新值。",
      "readOnlyNoticeTitle": "只读视图",
      "readOnlyNoticeDescription": "你可以查看 Webhook 设置和端点，但修改需要超级管理员权限。"
    },
    "list": {
      "title": "Webhook endpoints",
      "description": "查看并管理已注册的 webhook 回调地址。",
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
      "empty": "暂无 webhook endpoint"
    },
    "form": {
      "createTitle": "创建 webhook endpoint",
      "editTitle": "编辑 webhook endpoint",
      "description": "配置回调地址、凭证、Bearer Token 和 endpoint 开关。",
      "idLabel": "Endpoint ID",
      "idPlaceholder": "可选，留空则自动生成",
      "idHelp": "如果留空，后端会自动生成下一个数字字符串 ID。",
      "callbackUrlLabel": "回调地址",
      "callbackUrlPlaceholder": "https://example.com/webhook",
      "credentialLabel": "凭证",
      "credentialPlaceholder": "可选，留空则自动生成",
      "credentialHelp": "如果留空，后端会自动生成随机凭证。",
      "bearerLabel": "Bearer Token",
      "bearerPlaceholder": "可选，留空则不附带 Authorization 头",
      "bearerHelp": "填写后，后端会在回调请求中附带 `Authorization: Bearer TOKEN`。",
      "clearBearerLabel": "清空 Bearer Token",
      "enabledLabel": "启用当前 endpoint"
    },
    "deleteDialog": {
      "title": "删除 webhook endpoint",
      "description": "确认删除 endpoint {id} 吗？删除后会一并移除它关联的所有订阅关系。",
      "confirm": "删除 endpoint"
    },
    "tokenDialog": {
      "title": "Webhook Token",
      "description": "请保存 endpoint {id} 当前可用的 webhook token。",
      "headerNameLabel": "请求头名称",
      "tokenLabel": "Webhook Token",
      "tokenHelp": "调用 webhook subscriber 接口时需要使用这个 token，请妥善保管。",
      "close": "关闭"
    },
    "subscribers": {
      "title": "{id} 的订阅者",
      "description": "当全局开关和该 endpoint 开关都开启时，这些订阅关系会接收到回调。",
      "generatedAt": "生成时间：{date}",
      "userId": "用户 ID",
      "server": "区服",
      "dataType": "数据类型",
      "createdAt": "创建时间",
      "empty": "当前 endpoint 暂无订阅者"
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
      "savedWithoutToken": "Endpoint 已保存，但由于 JWT 密钥未配置，后端没有返回 token。",
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
    "title": "赞助者管理",
    "description": "维护赞助者名单展示资料，并控制手动资料是否允许被爱发电同步覆盖。",
    "generatedAt": "生成时间：{date}",
    "common": {
      "fallback": "—",
      "anonymous": "匿名赞助者"
    },
    "contribution": {
      "amount": "¥{amount}",
      "month": "{count} 个月"
    },
    "actions": {
      "refresh": "刷新名单",
      "syncAfdian": "从爱发电同步",
      "edit": "编辑资料"
    },
    "stats": {
      "total": "赞助者总数",
      "active": "正在赞助",
      "manualProfile": "手动保护资料"
    },
    "status": {
      "active": "正在赞助",
      "past": "曾经赞助"
    },
    "afdianSync": {
      "enabled": "允许更新",
      "disabled": "不从爱发电更新"
    },
    "list": {
      "title": "赞助者名单",
      "description": "列表按后端返回顺序展示；可直接编辑公开资料或保护手动资料。"
    },
    "table": {
      "supporter": "赞助者",
      "tier": "赞助档位",
      "status": "状态",
      "source": "来源",
      "lastSupport": "最近赞助",
      "contribution": "赞助贡献",
      "afdianSync": "爱发电更新",
      "actions": "操作",
      "empty": "暂无赞助者记录"
    },
    "edit": {
      "title": "编辑赞助者资料",
      "name": "显示名称",
      "avatar": "头像 URL",
      "avatarPlaceholder": "https://example.com/avatar.png",
      "planName": "赞助档位",
      "source": "来源",
      "paidAt": "最近赞助时间",
      "planExpiresAt": "赞助到期时间",
      "message": "留言",
      "isActive": "标记为正在赞助",
      "afdianSyncDisabled": "不从爱发电更新这个资料",
      "afdianSyncHelp": "开启后，手动编辑的昵称、头像、档位和留言不会被后续爱发电同步覆盖。",
      "manualProfileHint": "此处只保存展示用资料和同步策略；爱发电 API key 与 webhook 配置仍应只存在后端。"
    },
    "toast": {
      "actionFailedFallback": "操作失败",
      "loadFailedTitle": "加载赞助者失败",
      "saveFailedTitle": "保存赞助者失败",
      "syncFailedTitle": "爱发电同步失败",
      "saved": "赞助者资料已保存",
      "synced": "已请求从爱发电同步",
      "afdianSyncDisabled": "已设为不从爱发电更新",
      "afdianSyncEnabled": "已允许从爱发电更新",
      "validation": {
        "nameRequired": "显示名称不能为空"
      }
    }
  },
  "adminStatistics": {
    "common": {
      "fallback": "—",
      "success": "成功",
      "failure": "失败"
    },
    "dashboard": {
      "stat": {
        "totalUsers": "总用户数",
        "superAdmin": "超级管理员",
        "totalBindings": "游戏绑定",
        "totalUploads": "总上传 (全部)"
      },
      "upload24h": {
        "total": "24h 上传总量",
        "bannedUsers": "被封用户"
      },
      "chart": {
        "title": "趋势图",
        "description": "注册与上传趋势",
        "uploads": "上传",
        "registrations": "注册",
        "failures": "上传失败",
        "successRate": "成功率",
        "range7d": "近 7 天",
        "range30d": "近 30 天",
        "range90d": "近 90 天",
        "bucketDay": "按日",
        "bucketWeek": "按周",
        "bucketMonth": "按月",
        "empty": "暂无数据"
      },
      "toast": {
        "loadFailedTitle": "加载仪表盘失败",
        "loadChartFailedTitle": "加载图表失败",
        "loadFailedFallback": "加载失败"
      }
    },
    "systemLogs": {
      "pagination": {
        "prev": "上一页",
        "next": "下一页",
        "total": "共 {total} 条日志"
      },
      "summary": {
        "total": "总日志"
      },
      "searchPlaceholder": "搜索日志…",
      "exportButton": "导出",
      "table": {
        "result": "结果",
        "action": "操作",
        "request": "方法",
        "user": "用户",
        "time": "时间",
        "empty": "暂无日志"
      },
      "detail": {
        "title": "日志详情",
        "result": "结果",
        "time": "时间",
        "action": "操作",
        "request": "请求",
        "user": "用户",
        "detail": "详情"
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
        "allStatuses": "全部状态"
      },
      "actions": {
        "search": "查询"
      },
      "timeRangeLabel": "时间范围:",
      "table": {
        "status": "状态",
        "user": "用户",
        "server": "区服",
        "method": "方式",
        "dataType": "数据类型",
        "error": "错误信息",
        "viewError": "查看错误",
        "time": "时间",
        "empty": "暂无上传日志"
      },
      "errorDialog": {
        "title": "上传失败详情",
        "description": "查看这次上传失败时后端返回的错误信息。",
        "close": "关闭"
      },
      "summary": {
        "totalUploads": "总上传数",
        "successRate": "成功率"
      },
      "charts": {
        "successRateDistribution": "成功率分布",
        "byMethod": "按上传方式",
        "byDataType": "按数据类型",
        "total": "总计"
      },
      "method": {
        "manual": "手动上传",
        "iosProxy": "iOS代理",
        "iosScript": "iOS脚本",
        "harukiProxy": "HarukiProxy",
        "inherit": "继承码"
      },
      "dataType": {
        "suite": "Suite",
        "mysekai": "MySekai"
      },
      "sort": {
        "uploadTimeDesc": "上传时间 ↓",
        "uploadTimeAsc": "上传时间 ↑",
        "idDesc": "ID ↓",
        "idAsc": "ID ↑"
      },
      "toast": {
        "loadFailedTitle": "加载上传日志失败",
        "loadFailedFallback": "加载失败",
        "filterFailedTitle": "筛选失败",
        "invalidTimeRange": "开始时间不能晚于结束时间"
      }
    }
  },
  "adminGameBindings": {
    "pagination": {
      "prevPage": "上一页",
      "nextPage": "下一页"
    },
    "common": {
      "cancel": "取消",
      "create": "创建"
    },
    "filters": {
      "title": "搜索与筛选",
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
        "description": "将解绑选中的 {count} 条游戏账号绑定，此操作不可撤销。",
        "cancel": "取消",
        "confirm": "确认解绑"
      }
    },
    "editDialog": {
      "createTitle": "新增游戏绑定",
      "createDescription": "为用户添加新的游戏账号绑定。",
      "editTitle": "编辑游戏绑定",
      "editDescription": "修改游戏账号绑定的数据设置。",
      "toolboxUserId": "工具箱用户ID",
      "toolboxUserIdPlaceholder": "输入工具箱用户ID",
      "server": "服务器",
      "gameUserId": "游戏用户ID",
      "gameUserIdPlaceholder": "输入游戏内用户ID",
      "suiteSettingsTitle": "Suite 数据设置",
      "mysekaiSettingsTitle": "MySekai 数据设置"
    },
    "reassignDialog": {
      "title": "转移游戏账号",
      "description": "将 {server} 游戏 ID {gameId} 从 {fromUser} 转移到目标用户。",
      "targetUserIdLabel": "目标用户ID",
      "targetUserIdPlaceholder": "请输入目标工具箱用户ID",
      "confirm": "确认转移"
    },
    "deleteDialog": {
      "title": "确认解绑",
      "description": "此操作将解除 {server} 游戏账号 {gameUserId} 的绑定关系。",
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
      "deleted": "已删除"
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
      "openMenu": "打开菜单"
    },
    "management": {
      "title": "用户管理",
      "filters": {
        "searchLabel": "搜索",
        "searchPlaceholder": "搜索用户名、邮箱或 ID…",
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
        "createdToPlaceholder": "按结束时间过滤"
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
          "createdAt": "注册时间"
        },
        "empty": "暂无用户数据",
        "loadError": "加载用户列表失败",
        "retry": "重试"
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
      "notFound": "用户不存在或加载失败",
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
        "delete": "删除",
        "deleteDialogTitle": "确认删除",
        "deleteDialogDescription": "此操作是软删除，可以恢复。确定要删除用户 {name} 吗？",
        "deleteDialogConfirm": "确认删除"
      },
      "activity": {
        "title": "活动记录",
        "uploadLogsTitle": "上传日志",
        "uploadLogsDescription": "该用户最近的上传记录，包括失败时后端返回的错误详情。",
        "columns": {
          "action": "操作",
          "result": "结果",
          "path": "路径",
          "time": "时间"
        },
        "empty": "暂无活动记录"
      },
      "oauth": {
        "title": "OAuth 授权",
        "revokeAll": "撤销全部",
        "total": "共 {count} 个授权",
        "empty": "暂无 OAuth 授权",
        "revokeAllDialogTitle": "撤销全部授权",
        "revokeAllDialogDescription": "此操作将撤销该用户的全部 OAuth 授权，并使其从所有已连接的第三方应用登出。是否继续？"
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
        "unbindDialogTitle": "确认解绑",
        "unbindDialogDescription": "此操作将解绑游戏账号 {gameUserId}，之后可重新添加。"
      },
      "social": {
        "title": "社交平台绑定",
        "add": "添加绑定",
        "empty": "暂无社交平台绑定",
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
        "deleteDialogTitle": "确认删除",
        "deleteDialogDescription": "确定要删除此授权社交平台吗？之后可重新添加。"
      },
      "ios": {
        "title": "iOS 上传码",
        "regenerate": "重新生成",
        "generate": "生成上传码",
        "empty": "暂无上传码",
        "deleteDialogTitle": "确认删除",
        "deleteDialogDescription": "确定要删除当前的 iOS 上传码吗？之后可重新生成一个新的。"
      },
      "dialog": {
        "email": {
          "title": "修改邮箱",
          "description": "修改用户 {name} 的邮箱地址。",
          "newEmail": "新邮箱地址",
          "placeholder": "请输入邮箱地址",
          "confirm": "确认修改"
        },
        "gameBinding": {
          "title": "添加游戏绑定",
          "description": "为用户 {name} 添加或更新游戏账号绑定。",
          "server": "服务器",
          "gameUserId": "游戏用户 ID",
          "gameUserIdPlaceholder": "输入游戏内用户 ID",
          "suiteSettings": "Suite 数据设置",
          "mysekaiSettings": "MySekai 数据设置"
        },
        "social": {
          "addTitle": "添加社交平台绑定",
          "editTitle": "编辑社交平台绑定",
          "description": "管理用户 {name} 的社交平台主绑定信息。",
          "platform": "平台",
          "platformPlaceholder": "选择平台",
          "userId": "用户 ID",
          "userIdPlaceholder": "平台上的用户 ID"
        },
        "authSocial": {
          "addTitle": "添加授权社交平台",
          "editTitle": "编辑授权社交平台",
          "description": "管理用户 {name} 的授权社交平台账号。",
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
        "deleteSuccess": "已软删除用户",
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
