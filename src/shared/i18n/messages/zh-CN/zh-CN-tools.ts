// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: tools, botNeo
export default {
  "tools": {
    "clientConfigGenerator": {
      "title": "Haruki Client 配置生成器",
      "description": "按新版 Haruki Client 的 configs.yaml 字段生成本地配置，包含动态路由、控制 API、模块与黑白名单策略。",
      "summary": {
        "modules": "启用模块",
        "admins": "管理员",
        "scopes": "策略范围"
      },
      "sections": {
        "identity": {
          "title": "基础身份",
          "description": "填写本地监听端口、Bot ID、登录凭证和可选加密参数。"
        },
        "routing": {
          "title": "网络路由",
          "description": "配置云端 API 的动态主副节点或固定覆盖端点。"
        },
        "runtime": {
          "title": "运行策略",
          "description": "控制帮助、国服功能、回复引用和全局指令限流。"
        },
        "modules": {
          "title": "模块与功能范围",
          "description": "按 manifest 的 command_module 控制基础模块，再按 cloud 当前 client_policy_scope 设置功能级策略。"
        },
        "access": {
          "title": "权限名单",
          "description": "按 scope 填写群黑名单、群白名单、用户黑名单和 Bot 管理员 QQ。"
        }
      },
      "fields": {
        "host": {
          "label": "监听地址",
          "placeholder": "127.0.0.1"
        },
        "port": {
          "label": "OneBot 端口"
        },
        "controlApiPort": {
          "label": "控制 API 端口"
        },
        "botId": {
          "label": "Bot ID",
          "placeholder": "从注册流程获取"
        },
        "credential": {
          "label": "登录凭证",
          "placeholder": "粘贴 Haruki Client credential"
        },
        "authEncryptionKey": {
          "label": "认证加密密钥",
          "placeholder": "可留空，或填 64 位 hex AES-256 key"
        },
        "noiseServerPubkey": {
          "label": "Noise 服务端公钥",
          "placeholder": "通常由认证响应自动获取，可留空"
        },
        "controlApiAccessToken": {
          "label": "控制 API 访问令牌",
          "description": "开启后控制 API 需要 Bearer Token；关闭时写入 null。",
          "placeholder": "本机控制接口访问令牌"
        },
        "serverEndpointOverride": {
          "label": "固定服务端端点",
          "placeholder": "群内如果没有通知则留空",
          "help": "仅在群内通知要求固定端点时填写；没有通知则留空。"
        },
        "routingConfigURL": {
          "label": "动态路由配置 URL",
          "placeholder": "留空使用 client 内置 EdgeOne 默认地址",
          "help": "用于生产/备用节点 failover。固定端点非空时不会生效。"
        },
        "runMode": {
          "label": "运行模式",
          "placeholder": "选择运行模式"
        },
        "helpContent": {
          "label": "自定义帮助内容",
          "placeholder": "留空使用默认帮助内容"
        },
        "enableGroupCommandLimit": {
          "label": "启用全局指令限流",
          "description": "限制所有群合计的每小时/每日成功调用次数，0 表示不限制。"
        },
        "globalCommandHourlyLimit": {
          "label": "每小时上限"
        },
        "globalCommandDailyLimit": {
          "label": "每日上限"
        },
        "enableModules": {
          "label": "启用模块",
          "placeholder": "选择模块",
          "help": "通过下拉选择 command_module；all 表示启用全部模块。card/music/mysekai 等是云端业务分类，不是这里的基础模块名。"
        },
        "featurePolicyModes": {
          "label": "功能级策略模式",
          "placeholder": "选择功能 scope",
          "help": "只在某个功能需要覆盖全局运行模式时添加；没有单独策略时保持为空即可。"
        },
        "blacklists": {
          "label": "群黑名单",
          "placeholder": "all: 123456, 789012\nprofile: 345678"
        },
        "whitelists": {
          "label": "群白名单",
          "placeholder": "all: 123456, 789012\nmysekai: 345678"
        },
        "userBlacklists": {
          "label": "用户黑名单",
          "placeholder": "all: 10001, 10002\nprofile: 10003"
        },
        "botAdmins": {
          "label": "Bot 管理员 QQ",
          "placeholder": "114514\n1919810",
          "help": "管理员可在群内使用 Haruki Client 控制命令。"
        }
      },
      "toggles": {
        "enableHelp": {
          "label": "帮助命令",
          "description": "允许内置帮助响应。"
        },
        "enableCN": {
          "label": "国服功能",
          "description": "启用 CN 相关功能。"
        },
        "enableReplyMessage": {
          "label": "引用回复",
          "description": "回复结果时引用原消息。"
        },
        "sendBase64Image": {
          "label": "图片转 Base64",
          "description": "客户端下载 Cloud 图片后以 base64 发送给 OneBot。"
        },
        "mysekaiBirthdayMonitorNotifyEmpty": {
          "label": "生日空结果通知",
          "description": "烤森生日材料监听无命中时也发送通知。"
        },
        "enableParamEcho": {
          "label": "参数错误回显",
          "description": "Cloud 参数解析错误时允许回显具体参数。"
        }
      },
      "actions": {
        "addModule": "添加模块",
        "addFeaturePolicy": "添加策略",
        "addAccessRow": "添加",
        "addBotAdmin": "添加管理员",
        "removeRow": "删除这一行",
        "copy": "复制 YAML",
        "download": "下载 configs.yaml",
        "reset": "重置"
      },
      "moduleSelector": {
        "allModules": "全部模块",
        "moduleOption": "模块：{value}",
        "placeholder": "选择模块"
      },
      "policyEditor": {
        "scopeLabel": "功能 scope",
        "scopePlaceholder": "选择功能",
        "modePlaceholder": "选择策略",
        "empty": "没有功能需要单独策略时，这里保持为空。"
      },
      "accessEditor": {
        "scopeLabel": "名单 scope",
        "scopePlaceholder": "选择全局、模块或功能",
        "globalGroup": "全局",
        "moduleGroup": "模块",
        "featureGroup": "功能",
        "globalScope": "全局：all",
        "moduleScope": "模块：{value}",
        "featureScope": "功能：{value}",
        "groupIdLabel": "群号",
        "groupIdPlaceholder": "群号",
        "userIdLabel": "用户 QQ",
        "userIdPlaceholder": "用户 QQ",
        "botAdminPlaceholder": "管理员 QQ",
        "blacklistsDescription": "选择全局、模块或功能范围，再添加需要禁用的群。",
        "whitelistsDescription": "选择全局、模块或功能范围，再添加允许使用的群。",
        "userBlacklistsDescription": "选择全局、模块或功能范围，再添加需要禁用的用户 QQ。"
      },
      "runMode": {
        "blacklist": "黑名单模式",
        "whitelist": "白名单模式"
      },
      "routingState": {
        "dynamic": "当前使用动态路由",
        "pinned": "当前固定服务端端点",
        "dynamicDescription": "serverEndpointOverride 为空时，client 会读取 routingConfigURL；routingConfigURL 为空则使用内置 EdgeOne 默认地址。",
        "pinnedDescription": "serverEndpointOverride 非空时，client 会直接使用该端点，不再读取动态路由配置。"
      },
      "preview": {
        "title": "configs.yaml 预览",
        "description": "右侧内容会随表单实时更新，可直接复制到 Haruki Client 工作目录。"
      },
      "prefill": {
        "title": "已从注册结果带入",
        "description": "Bot ID 与凭据已自动填入配置表单，ownerId 仅用于确认注册来源，不会写入 configs.yaml。",
        "ownerId": "ownerId：{value}",
        "botId": "Bot ID：{value}",
        "credential": "Credential 已填入"
      },
      "notes": {
        "title": "填写说明",
        "description": "生成器只在浏览器本地处理内容，不会提交凭证。",
        "items": {
          "dynamicRouting": "routingConfigURL 是新版 client 的动态路由入口，留空即可走默认生产配置。",
          "accessToken": "controlApiAccessToken 不需要鉴权时保持关闭，YAML 会写成 null。",
          "listSyntax": "名单可以逐行添加 scope 和群号/QQ，生成器会自动合并为 client 需要的 YAML。"
        }
      },
      "toast": {
        "reset": "已重置为默认配置",
        "copySuccess": "configs.yaml 已复制到剪贴板",
        "copyFailed": "复制失败，请检查浏览器剪贴板权限",
        "downloadSuccess": "configs.yaml 已开始下载"
      }
    },
    "iosModules": {
      "title": "iOS模块生成器",
      "description": "生成自定义的iOS代理模块",
      "tutorialAlert": {
        "textBefore": "本文教程可以",
        "linkText": "点击这里",
        "textAfter": "观看",
        "nonZhWarning": "本教程仅有简体中文版本"
      },
      "qxScriptWarning": "Quantumult X 不支持脚本上传模式",
      "cnRestriction": "由于相关法律法规限制，本站不提供国服的MySekai功能的安装。",
      "installButton": "快速安装模块",
      "installHint": "点击后将调用对应软件的安装协议",
      "copyLabel": {
        "uploadCode": "上传码",
        "moduleUrl": "模块URL",
        "scriptUrl": "脚本URL"
      },
      "steps": {
        "configure": {
          "title": "配置",
          "description": "选择代理软件、服务端域名与上传方式。"
        },
        "scope": {
          "title": "范围",
          "description": "选择需要上传数据的区服和数据类型。"
        },
        "install": {
          "title": "获取与安装",
          "description": "生成上传码后，可复制 URL 手动安装或一键快速安装。"
        }
      },
      "sections": {
        "software": {
          "title": "选择软件",
          "description": "选择需要安装模块的代理工具",
          "placeholder": "请选择软件"
        },
        "endpoint": {
          "title": "选择工具箱域名",
          "description": "选择要使用的工具箱服务端域名\n默认情况下使用直连即可\n如果你人不在中国大陆使用困难的话，选择CDN可能有改善",
          "placeholder": "请选择域名"
        },
        "mode": {
          "title": "选择上传数据方式",
          "description": "脚本上传可以和其他Bot的模块共存，也不会受到工具箱服务端代理宕机的影响，但是不一定稳定\n如果使用脚本上传不稳定，可以切换为重定向代理法",
          "placeholder": "请选择上传方式"
        },
        "chunk": {
          "title": "文件分片大小",
          "description": "分片大小越大，进游戏速度越快，但是有可能软件顶不住\n除非你了解这个东西是做什么的，不然不需要更改",
          "unit": "MB"
        },
        "regions": {
          "title": "选择区服",
          "description": "选择需要上传数据的游戏服务器（可多选）"
        },
        "dataTypes": {
          "title": "选择数据类型",
          "description": "选择需要上传的数据类型（可多选）"
        }
      },
      "uploadCode": {
        "title": "上传码",
        "description": "用于验证模块和脚本的访问权限",
        "regenerate": "重新生成",
        "generate": "生成上传码",
        "loginRequired": "请先登录"
      },
      "generatedUrls": {
        "title": "生成的 URL",
        "description": "可以复制 URL 手动安装，或点击下方按钮快速安装",
        "moduleUrl": "模块 URL",
        "scriptUrl": "脚本 URL"
      },
      "software": {
        "surge": "Surge",
        "shadowrocket": "Shadowrocket",
        "loon": "Loon",
        "qx": "Quantumult X",
        "stash": "Stash"
      },
      "endpointOptions": {
        "direct": "Direct (直连)",
        "cdn": "CDN (加速)"
      },
      "modeOptions": {
        "proxy": "重定向代理法",
        "script": "脚本上传"
      },
      "region": {
        "jp": "日服",
        "en": "国际服",
        "tw": "台服",
        "kr": "韩服",
        "cn": "国服"
      },
      "dataTypes": {
        "suite": {
          "label": "Suite",
          "description": "上传你的游戏账号的完整数据"
        },
        "mysekai": {
          "label": "MySekai",
          "description": "上传你的游戏账号的MySekai数据"
        },
        "mysekai_force": {
          "label": "MySekai (强制刷新)",
          "description": "每次进入都强制刷新MySekai数据"
        },
        "mysekai_birthday_party": {
          "label": "MySekai生日派对",
          "description": "上传MySekai生日派对双叶地图数据"
        }
      },
      "toast": {
        "loginRequired": "请先登录",
        "generateCodeSuccess": "上传码生成成功",
        "generateCodeFailedTitle": "生成上传码失败",
        "generateCodeFailedFallback": "未知错误",
        "copyEmpty": "复制内容为空",
        "clipboardUnsupported": "当前环境不支持剪贴板操作",
        "copySuccess": "{label}已复制到剪贴板",
        "copyFailed": "复制到剪贴板失败，请检查浏览器权限设置",
        "qxScriptFallback": "Quantumult X 不支持脚本上传模式，已切换为代理模式",
        "unsupportedClient": "不支持的客户端",
        "installUnsupported": "当前环境不支持快速安装"
      }
    },
    "uploadData": {
      "groupNotice1": "Haruki游乐园QQ 1群: {groupId}",
      "groupNotice2": "Haruki游乐园QQ 2群: {groupId}",
      "groupTitle": "Haruki游乐园 QQ 群",
      "group1Label": "1 群",
      "group2Label": "2 群",
      "tutorialNotice": {
        "title": "其他上传方式",
        "androidProxy": {
          "platform": "Android / Windows",
          "linkText": "HarukiProxy 教程"
        },
        "iosModule": {
          "platform": "iOS / iPadOS",
          "linkText": "使用 iOS 模块"
        }
      },
      "tabs": {
        "file": "文件上传",
        "inherit": "继承码上传",
        "ios": "iOS模块"
      },
      "region": {
        "jp": "日服",
        "en": "国际服",
        "tw": "台服",
        "kr": "韩服",
        "cn": "国服"
      },
      "dataTypes": {
        "suite": "Suite",
        "mysekai": "MySekai"
      },
      "disabledReason": {
        "loginRequired": "请先登录再使用此功能",
        "noBoundAccount": "您还没有绑定任何账号，请先绑定账号"
      },
      "uploadStatus": {
        "uploading": "正在上传您的{dataType}数据...",
        "success": "上传成功",
        "failed": "上传失败"
      },
      "toast": {
        "selectAccount": "请选择一个账号",
        "selectFile": "请选择一个文件",
        "operationForbiddenTitle": "提交被禁止",
        "operationForbiddenDescription": "由于相关法律法规限制，不允许进行此操作",
        "uploadSuccessTitle": "上传成功",
        "uploadSuccessFileFallback": "文件已上传",
        "uploadSuccessInheritFallback": "继承码已上传",
        "uploadFailedTitle": "上传失败",
        "uploadFailedFallback": "上传失败",
        "inheritIncompleteTitle": "请填写完整的继承信息",
        "inheritIncompleteDescription": "继承ID和继承密码均为必填项",
        "inheritIdInvalidTitle": "继承ID格式不正确",
        "inheritIdInvalidDescription": "继承ID应为16位英文字母与数字的组合（区分大小写）"
      },
      "fileTab": {
        "title": "手动上传文件",
        "description": "此选项可以手动上传你捕获的数据",
        "unavailableTitle": "无法使用",
        "forbiddenTitle": "操作已被禁止",
        "forbiddenDescription": "由于相关法律法规限制，不允许进行此操作",
        "fields": {
          "file": "上传文件",
          "account": "选择账号（区服 / UID）",
          "accountPlaceholder": "请选择已绑定的账号",
          "dataType": "选择数据类型",
          "dataTypePlaceholder": "请选择数据类型"
        },
        "submit": "提交",
        "submitting": "提交中..."
      },
      "inheritTab": {
        "title": "继承码上传数据",
        "description": "此选项可以提交你的继承码到Haruki工具箱后端捕获你需要的数据",
        "fields": {
          "inheritId": "继承ID",
          "inheritIdPlaceholder": "请输入继承ID",
          "inheritPassword": "继承密码",
          "inheritPasswordPlaceholder": "请输入继承密码",
          "server": "选择区服",
          "serverPlaceholder": "请选择区服",
          "dataType": "选择数据类型",
          "dataTypePlaceholder": "请选择数据类型"
        },
        "alerts": {
          "notesTitle": "使用须知",
          "warning1": {
            "title": "警告",
            "description": "请妥善保存您的引继ID与密码！Haruki工具箱服务器不会保存您的引继ID与密码！"
          },
          "warning2": {
            "title": "警告",
            "line1": "尽管开发者已经尽最大可能将 API 请求优化得尽可能像一个正常 app 请求，使用风险仍然需要自负。",
            "line2": "如果你认为这个风险你负担不起，请不要使用本功能。"
          },
          "reminder1": {
            "title": "提醒",
            "line1": "仅在您主动勾选后，引继信息才会短期保存在当前浏览器本地。",
            "line2": "本地保存将在 24 小时后自动过期，取消勾选会立即清除已保存的信息。"
          },
          "reminder2": {
            "title": "提醒",
            "line1": "使用该功能虽然不需要登录Haruki工具箱账号",
            "line2": "但是如果你没有在Haruki工具箱绑定你要获取数据的游戏账号",
            "line3": "即使通知上传成功，也不会写入数据库",
            "line4": "请务必先在Haruki工具箱绑定你要获取数据的游戏账号",
            "bindLink": "绑定游戏账号"
          }
        },
        "remember": {
          "label": "在当前设备短期记住引继信息",
          "description": "仅保存在本地浏览器，24 小时后自动过期；取消勾选会立即清除。"
        },
        "submit": "提交",
        "submitting": "提交中..."
      }
    },
    "pointCalculator": {
      "title": "活动 Pt 控分计算器",
      "description": "根据目标活动 Pt 和歌曲基础 Pt，反推所需活动加成与可打分数区间。",
      "tips": {
        "title": "小提示",
        "beta": "测试中",
        "boostConfig": "控分之前请务必确保您的体力消耗（Live Boost）配置正确，谨防控分失败。",
        "testingPrefix": "该功能处于测试状态，",
        "testingSuffix": "如果遇到任何问题请联系 Haruki Dev Team 进行反馈。",
        "deckRecommend": "控分结果会有“加成组卡”按钮，方便快速跳转组卡。"
      },
      "fields": {
        "region": "数据服务器",
        "music": "歌曲",
        "loadingMusic": "正在准备歌曲...",
        "musicPlaceholder": "请选择歌曲",
        "musicSearchPlaceholder": "搜索歌曲名、#ID、假名、拼音或罗马音...",
        "musicEmpty": "没有找到歌曲。",
        "targetPt": "目标活动 Pt",
        "targetPtPlaceholder": "请输入目标活动 Pt",
        "maxResults": "输出结果上限",
        "maxResultsPlaceholder": "默认 10",
        "bonusRange": "自定义加成范围",
        "bonusRangeHelp": "只搜索该范围内的活动加成，默认按 100% 到 435% 计算，可填写 0% 到 1000%。",
        "customBonusFloor": "自定义加成下限",
        "customBonusFloorPlaceholder": "默认 100",
        "customBonusCap": "自定义加成上限",
        "customBonusCapPlaceholder": "默认 435",
        "bonusRangeInvalid": "加成范围需要是 0 到 1000 之间的整数，且下限不能大于上限。",
        "boostIndex": "体力消耗（Live Boost）",
        "boostIndexAll": "全部档位",
        "boostIndexOption": "{index} 火（{rate}倍）",
        "advanced": "高级选项"
      },
      "actions": {
        "calculate": "开始计算",
        "buildDeck": "加成组卡"
      },
      "meta": {
        "title": "计算数据",
        "music": "歌曲：{value}",
        "basicPoint": "基础 Pt：{value}",
        "bonusRange": "加成范围：{min}% ~ {max}%",
        "missingBasicPoint": "当前歌曲缺少 music metas 基础 Pt，无法计算。"
      },
      "result": {
        "title": "计算结果",
        "placeholder": "输入目标活动 Pt 后会在这里显示可用方案。",
        "summary": "共找到 {count} 组方案。",
        "empty": "还没有计算结果。",
        "deckBonus": "所需加成 {value}%",
        "boost": "{index} 火 / {rate}倍",
        "scoreRangeLabel": "可打分数区间",
        "noMatchTitle": "未找到符合条件的方案",
        "noMatchDescription": "请尝试调整目标 Pt、体力消耗（Live Boost）或自定义加成上限。"
      }
    }
  },
  "botNeo": {
    "title": "HarukiBot NEO 注册",
    "description": "注册 HarukiBot NEO 实例并获取 Bot 凭据",
    "disabled": {
      "title": "注册暂未开放",
      "description": "HarukiBot NEO 注册功能当前已关闭，请稍后再试。",
      "retryButton": "重试"
    },
    "input": {
      "warningTitle": "注意",
      "warningDescription": "请使用你本人正在使用的QQ大号（不是接入 HarukiBot NEO 作为 Bot 的QQ号）注册，否则将会被拒绝进入QQ群聊。",
      "warningGroup": "NEO 分布式QQ群: 111612548",
      "qqLabel": "QQ 号",
      "qqPlaceholder": "请输入 QQ 号",
      "hint": "验证码将发送至您的 QQ 邮箱（{qq}{'@'}qq.com），有效期 10 分钟。",
      "sendButton": "发送验证码",
      "cooldownButton": "{seconds} 秒后可重试"
    },
    "verify": {
      "codeSentHint": "验证码已发送至 {qq}{'@'}qq.com，请查收邮箱。",
      "codeLabel": "验证码",
      "codePlaceholder": "请输入 6 位验证码",
      "backButton": "返回",
      "registerButton": "注册",
      "resendButton": "重新发送验证码",
      "resendCooldown": "{seconds} 秒后可重新发送"
    },
    "result": {
      "successTitle": "注册成功",
      "successDescription": "您的 HarukiBot NEO 实例已创建，请保存以下凭据信息。",
      "botIdLabel": "Bot ID",
      "credentialLabel": "凭据（JWT）",
      "saveWarning": "凭据仅显示一次，请立即复制并安全保存，之后将无法再次获取。",
      "configGeneratorTitle": "继续生成 Client 配置",
      "configGeneratorDescription": "打开配置生成器并自动带入 ownerId、Bot ID 和 Credential，后续只需补充端口、模块和名单配置。",
      "configGeneratorButton": "打开配置生成器",
      "registerAnotherButton": "注册另一个"
    },
    "toast": {
      "statusCheckFailed": "检查注册状态失败",
      "sendFailedTitle": "发送失败",
      "invalidQQNumber": "请输入有效的 QQ 号",
      "rateLimitedTitle": "请求过于频繁",
      "rateLimitedDescription": "请求次数过多，请在 {seconds} 秒后重试。",
      "alreadyRegisteredTitle": "已注册",
      "alreadyRegisteredDescription": "该 QQ 号已有注册的 Bot。",
      "registrationDisabledTitle": "注册已关闭",
      "registrationDisabledDescription": "注册功能当前已关闭。",
      "codeSentTitle": "验证码已发送",
      "codeSentDescription": "请前往 QQ {qq} 的邮箱查收。",
      "registerFailedTitle": "注册失败",
      "missingVerificationCode": "请输入验证码",
      "incompleteResponse": "返回数据不完整",
      "registerSuccessTitle": "注册成功",
      "clipboardUnsupported": "当前环境不支持剪贴板",
      "copySuccess": "{label} 已复制到剪贴板",
      "copyFailed": "复制到剪贴板失败"
    }
  }
} as const
