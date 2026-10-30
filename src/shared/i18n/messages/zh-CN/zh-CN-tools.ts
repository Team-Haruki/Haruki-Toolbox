// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: tools, botNeo, sekaiStation
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
          "description": "填写本地监听端口、Bot ID、登录凭证和可选安全校验参数。"
        },
        "routing": {
          "title": "网络路由",
          "description": "配置云端 API 的动态主副节点或固定覆盖端点。"
        },
        "runtime": {
          "title": "运行策略",
          "description": "控制私聊响应、帮助、国服功能、回复引用和全局指令限流。"
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
        "noiseServerPubkey": {
          "label": "Noise 服务端公钥",
          "placeholder": "留空使用 client 内置默认公钥"
        },
        "noiseServerKeyId": {
          "label": "Noise 公钥 Key ID",
          "placeholder": "使用内置公钥时留空"
        },
        "trustRootPubkey": {
          "label": "信任根 Ed25519 公钥",
          "placeholder": "留空使用 client 内置根公钥"
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
          "placeholder": "留空使用 client 内置 routing-v3.json 地址",
          "help": "用于生产/备用节点 failover。固定端点非空时不会生效。"
        },
        "enableDynamicRouting": {
          "label": "启用动态路由",
          "description": "默认开启；关闭后仅使用 client 内置端点和 keyset 允许的端点。"
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
        "mysekaiBirthdayMonitorMode": {
          "label": "生日材料推送模式",
          "placeholder": "选择名单模式",
          "help": "只控制生日材料监听推送，不影响普通指令的运行模式。"
        },
        "mysekaiBirthdayMonitorBlacklist": {
          "label": "生日推送群黑名单",
          "placeholder": "每行或用逗号填写一个群号"
        },
        "mysekaiBirthdayMonitorWhitelist": {
          "label": "生日推送群白名单",
          "placeholder": "每行或用逗号填写一个群号"
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
        "enablePrivateMessage": {
          "label": "响应私聊指令",
          "description": "私聊不受群黑白名单限制，但仍受用户黑名单和限流约束。"
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
        },
        "strictConfigPermissions": {
          "label": "严格检查配置权限",
          "description": "若 configs.yaml 可被同组或其他用户读取则拒绝启动；启用后请设为 0600。"
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
        "builtIn": "当前使用内置端点",
        "dynamicDescription": "client 会读取 routingConfigURL；留空时使用内置 EdgeOne routing-v3.json 地址。",
        "pinnedDescription": "serverEndpointOverride 非空时，client 会直接使用该端点，不再读取动态路由配置。",
        "builtInDescription": "动态路由已关闭，client 只使用内置端点和 keyset 允许的端点。"
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
          "dynamicRouting": "新版 client 默认启用动态路由；routingConfigURL 留空即可使用内置 routing-v3.json。",
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
      "title": "iOS 模块（iPhone / iPad）",
      "description": "生成一个代理模块装进 Shadowrocket、Surge 等代理软件，之后进游戏时数据会自动上传。",
      "tutorialAlert": {
        "label": "图文教程：",
        "linkText": "点击查看",
        "nonZhWarning": "本教程仅有简体中文版本"
      },
      "qxScriptWarning": "Quantumult X 不支持脚本上传模式",
      "cnRestriction": "由于相关法律法规限制，本站不提供国服的烤森（MySekai）功能的安装。",
      "installButton": "快速安装模块",
      "installHint": "点击后会自动打开你选的代理软件并导入模块",
      "copyAction": "复制{label}",
      "copyLabel": {
        "uploadCode": "上传码",
        "moduleUrl": "模块 URL",
        "scriptUrl": "脚本 URL"
      },
      "steps": {
        "configure": {
          "title": "配置",
          "description": "选择代理软件、服务器线路与上传方式。"
        },
        "scope": {
          "title": "范围",
          "description": "选择需要上传数据的区服和数据类型。"
        },
        "install": {
          "title": "获取与安装",
          "prerequisite": "需要先登录并绑定游戏账号。",
          "description": "生成上传码后，可复制 URL 手动安装或一键快速安装。",
          "after": "安装后打开游戏并进入主页一次，上传成功后首页「我的账号」会显示上传时间。"
        }
      },
      "sections": {
        "software": {
          "title": "选择软件",
          "description": "选择需要安装模块的代理工具",
          "placeholder": "请选择软件"
        },
        "endpoint": {
          "title": "服务器线路",
          "description": "国内直连即可；人在海外可选 CDN。",
          "placeholder": "请选择线路"
        },
        "mode": {
          "title": "选择上传数据方式",
          "description": "「脚本上传」可与其他 Bot 的模块同时使用，但偶尔不稳定；「代理上传」更稳定，但同一时间只能装一个工具箱模块。不确定选「代理上传」。",
          "placeholder": "请选择上传方式"
        },
        "chunk": {
          "title": "文件分片大小",
          "description": "一般保持默认即可。数值越大进游戏越快，但部分代理软件可能上传失败。",
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
        "description": "模块用它来证明是你在上传；泄露后请重新生成。",
        "regenerate": "重新生成",
        "generate": "生成上传码",
        "loginRequired": "请先登录",
        "regenerateDialog": {
          "title": "重新生成上传码？",
          "description": "旧的上传码会立即失效，已安装的模块需要用新 URL 重新安装才能继续上传。",
          "confirm": "重新生成"
        }
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
        "proxy": "代理上传",
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
          "label": "账号数据（Suite）",
          "description": "上传你的游戏账号的完整数据"
        },
        "mysekai": {
          "label": "烤森数据（MySekai）",
          "description": "上传你的游戏账号的烤森数据"
        },
        "mysekai_force": {
          "label": "烤森数据（每次进入都上传）",
          "description": "不管游戏里有没有变化，每次进入烤森都重新上传一次。"
        },
        "mysekai_birthday_party": {
          "label": "烤森生日派对",
          "description": "上传烤森生日派对双叶地图数据"
        }
      },
      "toast": {
        "loginRequired": "请先登录",
        "generateCodeSuccess": "上传码生成成功",
        "generateCodeFailedTitle": "生成上传码失败",
        "generateCodeFailedFallback": "请先确认已登录，稍后重试。",
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
      "intro": {
        "title": "上传数据",
        "description": "「上传数据」是把你的游戏账号数据同步到工具箱，供卡牌、活动记录、组卡等功能使用。推荐方式：iPhone/iPad 用「iOS 模块」，Android/Windows 用 HarukiProxy；两者都不行时再用「引继码」。",
        "iosPlatform": "iPhone / iPad",
        "iosMethod": "iOS 模块（推荐）",
        "proxyPlatform": "Android / Windows",
        "proxyMethod": "HarukiProxy 教程",
        "fallbackPlatform": "两者都不行时",
        "fallbackMethod": "引继码（备用）"
      },
      "tabs": {
        "ios": "iOS 模块（iPhone/iPad）",
        "proxy": "HarukiProxy（Android/电脑）",
        "inherit": "引继码（备用）",
        "file": "文件上传（高级）"
      },
      "proxyTab": {
        "title": "HarukiProxy（Android / 电脑）",
        "description": "在 Android 手机或电脑上运行 HarukiProxy，进游戏时数据会自动上传到工具箱。",
        "steps": {
          "install": "按教程在手机或电脑上安装并配置 HarukiProxy。",
          "bind": "先在「游戏账号管理」绑定并验证要上传的游戏账号。",
          "run": "开启 HarukiProxy 后进入游戏主页一次，首页「我的账号」会显示上传时间。"
        },
        "tutorialButton": "查看 HarukiProxy 教程"
      },
      "region": {
        "jp": "日服",
        "en": "国际服",
        "tw": "台服",
        "kr": "韩服",
        "cn": "国服"
      },
      "dataTypes": {
        "suite": "账号数据（Suite）",
        "mysekai": "烤森数据（MySekai）"
      },
      "disabledReason": {
        "loginRequired": "请先登录再使用此功能",
        "noBoundAccount": "您还没有绑定任何账号，请先绑定账号",
        "noWritableAccount": "还没有可以上传的账号。请先在「游戏账号管理」完成账号验证；如果是帮别人上传，需要对方先授权你代传。"
      },
      "uploadStatus": {
        "uploading": "正在上传您的{dataType}数据...",
        "success": "上传成功",
        "failed": "上传失败"
      },
      "toast": {
        "selectAccount": "请选择一个可上传的账号",
        "selectFile": "请选择一个文件",
        "dataTypeNotWritable": "所选账号没有该数据类型的上传权限",
        "uploadForbiddenTitle": "无权上传到该账号",
        "uploadForbiddenDescription": "授权可能已过期、被撤销或绑定已变更，已重新加载可上传账号列表",
        "operationForbiddenTitle": "提交被禁止",
        "operationForbiddenDescription": "由于相关法律法规限制，不允许进行此操作",
        "uploadSuccessTitle": "上传成功",
        "uploadSuccessFileFallback": "文件已上传",
        "uploadFailedTitle": "上传失败",
        "uploadFailedFallback": "上传没有成功，请检查文件和账号后重试；多次失败请提交工单。",
        "inheritIdRequired": "请输入引继 ID",
        "inheritPasswordRequired": "请输入引继密码",
        "inheritIdInvalidDescription": "引继 ID 应为 16 位英文字母与数字的组合（区分大小写）"
      },
      "fileTab": {
        "title": "手动上传文件",
        "description": "上传你用 HarukiProxy 或 iOS 模块保存下来的数据文件。不知道怎么获取文件？看上方「其他上传方式」。",
        "unavailableTitle": "无法使用",
        "forbiddenTitle": "操作已被禁止",
        "forbiddenDescription": "由于相关法律法规限制，不允许进行此操作",
        "fields": {
          "file": "上传文件",
          "chooseFile": "选择文件",
          "noFile": "未选择文件",
          "fileHint": "选择 HarukiProxy 或 iOS 模块保存下来的数据文件，文件会原样上传。",
          "account": "选择账号（区服 / UID）",
          "accountPlaceholder": "请选择可上传的账号",
          "dataType": "选择数据类型",
          "dataTypePlaceholder": "请选择数据类型"
        },
        "actions": {
          "goLogin": "去登录",
          "goBind": "去绑定账号"
        },
        "refreshTargets": "刷新账号",
        "targetsLoading": "正在加载可上传账号...",
        "targetsFailedTitle": "无法获取可上传账号列表",
        "targetsFailedDescription": "已暂时显示你本人的已验证账号；他人授权的账号需刷新后才会出现。",
        "accountNotWritable": "这个账号还不能上传：账号未验证，或对方没有允许你代传。",
        "unavailableChip": "不可用",
        "someAccountsUnavailable": "灰色的账号暂时不能上传：账号未验证，或对方没有允许你代传。",
        "grantedTargetNotice": "这是他人授权给你的账号，上传会直接更新对方账号在工具箱中的数据。",
        "dataTypeLimited": "该账号仅允许上传部分数据类型。",
        "submit": "提交",
        "submitting": "提交中..."
      },
      "inheritTab": {
        "title": "引继码上传数据",
        "description": "输入游戏里的引继 ID 和密码。工具箱会先读取账号信息给你确认，确认后才执行引继，并立刻为你签发新的引继码。",
        "loginRequired": {
          "title": "请先登录工具箱",
          "description": "引继码上传需要登录 Haruki 工具箱：执行引继后，账号凭据和新引继码会加密保存在你的保险库中，只有你本人能查看。",
          "action": "去登录"
        },
        "fields": {
          "inheritId": "引继 ID",
          "inheritIdPlaceholder": "请输入引继 ID",
          "inheritPassword": "引继密码",
          "inheritPasswordPlaceholder": "请输入引继密码",
          "server": "选择区服",
          "serverPlaceholder": "请选择区服",
          "dataType": "选择数据类型",
          "dataTypePlaceholder": "请选择数据类型"
        },
        "newPassword": {
          "label": "新引继码密码",
          "reuse": "沿用本次密码",
          "reuseHint": "新引继码使用你刚输入的密码，方便记忆。",
          "random": "随机生成",
          "randomHint": "生成 12 位字母与数字组成的随机密码。",
          "reuseBlocked": "这个密码不能沿用：需为 8–16 个半角字母、数字或符号，且不含空格。请选择「随机生成」。",
          "reuseInvalid": "沿用的密码需为 8–16 个半角字母、数字或符号（不含空格），请改选「随机生成」",
          "tooLong": "引继密码过长"
        },
        "alerts": {
          "notesTitle": "引继流程与使用须知",
          "warning1": {
            "title": "执行引继后，原手机将无法再登录",
            "description": "日服引继码 24 小时内有效且只能使用一次。工具箱执行引继后，生成引继码的那台设备将无法再登录该账号，工具箱签发的新引继码就是你回到账号的方式，请务必记下。"
          },
          "warning2": {
            "title": "风险说明",
            "text": "本功能会用你的引继码模拟游戏客户端登录。官方理论上可能将其视为异常登录，请自行评估风险；不放心请改用 HarukiProxy 或 iOS 模块。"
          },
          "flow": {
            "title": "流程",
            "step1": "先只读取账号信息（不会使用引继码），请核对昵称和等级。",
            "step2": "你输入 Toolbox 密码（或保险库 PIN）确认后，才会执行引继。确认前随时可以取消，引继码仍然有效。",
            "step3": "执行后立刻签发新的引继码并显示在本页，同时加密保存到你的保险库，24 小时内可再次查看。",
            "step4": "最后获取并保存游戏数据。即使这一步失败，新引继码也会保留。"
          },
          "storage": {
            "title": "我们保存什么",
            "text": "你输入的引继码只在任务进行中使用，不会保存。执行引继后，账号的登录凭据（最多 7 天）和新签发的引继码（24 小时）会用只有你的 Toolbox 密码或保险库 PIN 才能解开的密钥加密保存，管理员也无法查看；你可以随时在下方保险库中销毁。"
          },
          "reminder2": {
            "title": "提醒",
            "text": "使用前请先在「游戏账号管理」绑定要上传的游戏账号。未绑定时，即使提示上传成功，数据也不会保存。",
            "bindLink": "去绑定"
          }
        },
        "submit": "读取账号信息",
        "submitting": "提交中..."
      },
      "inheritJob": {
        "title": "引继进度",
        "summary": "{server} · {dataType}",
        "status": {
          "running": "进行中",
          "awaiting_confirm": "等待确认",
          "succeeded": "已完成",
          "failed": "失败",
          "cancelled": "已取消"
        },
        "connection": {
          "connecting": "正在连接",
          "live": "实时",
          "reconnecting": "正在重连",
          "polling": "定时刷新",
          "closed": "已结束"
        },
        "steps": {
          "bootstrap": "准备连接",
          "preview": "读取账号信息",
          "awaiting_confirm": "等待你确认",
          "execute": "执行引继",
          "vault_store_credential": "保存账号凭据到保险库",
          "login": "登录游戏",
          "issue_new_code": "签发新引继码",
          "vault_store_code": "保存新引继码到保险库",
          "fetch_suite": "获取账号数据",
          "fetch_mysekai": "获取烤森数据",
          "upload": "保存数据",
          "done": "完成"
        },
        "substeps": {
          "cookies": "获取访问凭证",
          "version": "获取游戏版本",
          "inherit_check": "查询账号（不使用引继码）",
          "inherit_execute": "执行引继",
          "auth": "登录认证",
          "issue_code": "签发引继码",
          "suite": "账号数据",
          "suite_followup": "后续请求",
          "home_refresh": "刷新主页",
          "home_refresh_final": "最终刷新",
          "maintenance_check": "检查维护状态",
          "mysekai": "烤森数据",
          "mysekai_followup": "后续请求"
        },
        "stepStatus": {
          "pending": "等待中",
          "running": "进行中",
          "done": "完成",
          "failed": "失败",
          "skipped": "跳过",
          "warning": "部分失败"
        },
        "consumesCode": "从这一步起会使用引继码",
        "codeValidity": {
          "valid": "你输入的引继码没有被使用，仍然有效。",
          "used": "你输入的引继码已被使用，不能再用。",
          "unknown": "无法确定你输入的引继码是否已被使用。请不要在其他设备上重试它，并查看下方保险库是否已保存账号凭据。"
        },
        "errorTitle": "引继未完成",
        "issueFailedTitle": "未能签发新引继码",
        "cancelledTitle": "已取消",
        "succeededTitle": "上传完成",
        "succeededDescription": "账号数据已保存。",
        "expired": "这个任务的记录已过期（任务记录保留 1 小时）。新引继码仍可在下方保险库中查看。",
        "errors": {
          "inherit_invalid": "引继码无效、已使用或已过期。请在游戏中重新生成引继码后再试。",
          "inherit_restricted": "游戏目前不允许这个账号引继。",
          "transfer_restricted": "活动期间该账号的引继次数已用完，未执行引继。",
          "confirm_timeout": "5 分钟内没有确认，任务已自动取消，未执行引继。",
          "cancelled": "已取消，未执行引继。",
          "game_degraded": "游戏服务器暂时不稳定，未执行引继，请稍后再试。",
          "server_busy": "当前引继请求过多，未执行引继，请稍后再试。",
          "game_maintenance": "游戏服务器维护中。",
          "game_unavailable": "游戏服务器暂时无法访问。",
          "game_error": "游戏服务器返回了错误。",
          "execute_uncertain": "执行引继时连接中断，引继码可能已被使用。请不要在其他设备上重试这个引继码，并查看下方保险库是否已保存账号凭据。",
          "login_failed": "账号凭据已保存到保险库，但登录失败。请稍后在下方保险库中重新签发引继码。",
          "fetch_failed": "获取游戏数据失败。新引继码（如已签发）显示在本页并保存在保险库中。",
          "mysekai_unavailable": "获取烤森数据失败，可能尚未完成烤森教程。新引继码（如已签发）显示在本页并保存在保险库中。",
          "upload_failed": "数据保存失败。新引继码（如已签发）显示在本页并保存在保险库中。",
          "upload_forbidden": "该游戏账号已被其他 Toolbox 用户绑定，无法上传。新引继码（如已签发）显示在本页并保存在保险库中。",
          "job_interrupted": "服务重启，任务已中断。",
          "internal_error": "服务器内部错误。"
        },
        "warnings": {
          "issue_code_failed": "未能签发新引继码。账号凭据已保存在保险库中，请立即在下方保险库中重新签发：这是你回到账号的唯一方式。",
          "vault_db_unavailable": "数据库暂时不可用，账号凭据已临时保存，稍后会自动转存。",
          "vault_store_failed": "账号凭据或新引继码没能保存到保险库。请务必立即记下本页显示的新引继码。"
        },
        "actions": {
          "startNew": "开始新的上传",
          "refresh": "刷新状态",
          "goVault": "前往保险库"
        },
        "ackRequired": "请先确认你已记下新引继码",
        "toast": {
          "succeeded": "引继上传完成，账号数据已保存",
          "cancelled": "已取消，引继码未被使用"
        },
        "confirm": {
          "title": "确认要引继的账号",
          "description": "请核对账号信息。到目前为止还没有使用你的引继码。",
          "nickname": "昵称",
          "rank": "等级",
          "userId": "游戏 ID",
          "restriction": {
            "title": "活动期间的引继限制",
            "active": "该账号正处于活动期间的引继限制中",
            "remaining": "剩余可引继次数：{count}",
            "endsAt": "限制结束时间：{time}",
            "worldBloom": "World Link 章节进行中",
            "none": "当前没有引继限制。"
          },
          "warningTitle": "执行后原手机将无法再登录",
          "warningBody": "确认后工具箱会执行引继，账号会从你的手机转移出来，原设备将无法再登录这个账号。工具箱随后会签发新的引继码并显示在本页，请用它在手机上把账号引继回来。",
          "deadline": "剩余确认时间 {time}，超时会自动取消（引继码仍然有效）。",
          "password": "Toolbox 账号密码",
          "passwordHint": "用于加密保存账号凭据和新引继码，只有你本人能解开。",
          "passwordFirstUse": "这是你第一次使用保险库，你的 Toolbox 密码将用来保护它。",
          "pin": "保险库 PIN",
          "pinHint": "你的 Toolbox 账号没有密码（通过 Google、Apple 或通行密钥登录），请输入保险库 PIN。",
          "pinCreate": "设置保险库 PIN",
          "pinCreateHint": "你的 Toolbox 账号没有密码，请设置一个保险库 PIN（8–128 个字符）。PIN 无法找回，忘记后只能重置保险库，已保存的记录会被销毁。",
          "pinRepeat": "再次输入 PIN",
          "pinMismatch": "两次输入的 PIN 不一致",
          "pinFormat": "PIN 需为 8–128 个字符",
          "passwordRequired": "请输入 Toolbox 账号密码",
          "previousPassword": "修改前的旧密码",
          "submit": "确认并执行引继",
          "submitting": "正在验证…",
          "cancel": "取消，不执行引继",
          "cancelling": "正在取消…"
        },
        "newCode": {
          "title": "你的新引继码",
          "description": "请现在就在手机上用这组引继码把账号引继回来，或妥善记下。",
          "inheritId": "引继 ID",
          "password": "引继密码",
          "copy": "复制{label}",
          "copied": "{label}已复制",
          "copyFailed": "复制失败，请手动抄写",
          "expiresIn": "剩余有效期 {time}",
          "expiresAt": "有效期至 {time}",
          "expired": "这组引继码已过期，请在保险库中重新签发。",
          "singleUse": "新引继码 24 小时内有效，且只能使用一次。原手机已无法登录，这是你回到账号的方式。",
          "savedToVault": "已加密保存到你的保险库，24 小时内可在下方保险库再次查看。",
          "unsavedTitle": "立即记下这组引继码",
          "unsavedBody": "这组引继码没能保存到保险库，离开本页后将无法再次查看。请现在就抄下来或截图保存。",
          "ack": "我已记下",
          "acked": "已确认记下"
        }
      },
      "inheritVault": {
        "title": "引继保险库",
        "description": "通过引继码上传时，工具箱会把账号凭据（7 天）和新签发的引继码（24 小时）加密保存在这里，只有你本人能用 Toolbox 密码或保险库 PIN 解开。每次查看或重新签发都会记录并发送邮件通知。",
        "empty": "保险库中没有记录。",
        "notInitialized": "你还没有使用过保险库，第一次确认引继时会自动创建。",
        "loadFailed": "无法加载保险库",
        "refresh": "刷新",
        "entry": {
          "title": "{server} · {uid}",
          "createdAt": "引继于 {time}",
          "credential": "账号凭据",
          "code": "引继码",
          "expiresIn": "剩余 {time}",
          "expired": "已过期",
          "noCode": "无可用引继码",
          "currentCode": "当前引继码",
          "unreadable": "这条记录属于已重置的保险库，无法读取。",
          "pending": "暂存中，数据库恢复后会自动转存"
        },
        "actions": {
          "reveal": "查看引继码",
          "hide": "隐藏",
          "reissue": "重新签发",
          "destroy": "我已在手机上恢复",
          "reset": "重置保险库"
        },
        "reveal": {
          "title": "查看引继码",
          "description": "输入密码以解开保险库。查看会被记录，并向你已验证的邮箱发送通知。"
        },
        "reissue": {
          "title": "重新签发引继码",
          "description": "工具箱会用保存的账号凭据登录并签发新的引继码，之前的引继码会立即失效。需要几秒钟。",
          "modeLabel": "新引继码密码",
          "reuse": "沿用上一个引继码的密码",
          "random": "随机生成"
        },
        "destroy": {
          "title": "销毁这条记录？",
          "description": "请确认你已经在手机上把账号引继回来。记录会立即变为不可读取，并在几分钟内删除，之后无法再查看或重新签发引继码。",
          "confirm": "确认销毁"
        },
        "reset": {
          "title": "重置保险库",
          "description": "重置会丢弃你的保险库密钥，并销毁全部 {count} 条记录，无法撤销。只在忘记了旧密码（例如通过找回密码重置过 Toolbox 密码）或忘记保险库 PIN 时使用。",
          "password": "当前 Toolbox 账号密码",
          "ack": "我明白全部记录都会被销毁",
          "confirm": "重置并销毁全部记录",
          "done": "保险库已重置，销毁了 {count} 条记录"
        },
        "passwordChanged": {
          "title": "需要修改前的旧密码",
          "description": "你的 Toolbox 密码在保险库创建后改过。请输入修改之前的旧密码，之后保险库会改由新密码保护。",
          "forgot": "忘记了旧密码（例如通过找回密码重置过）？只能重置保险库，已保存的记录会被销毁。",
          "resetAction": "重置保险库"
        },
        "unlock": {
          "password": "Toolbox 账号密码",
          "pin": "保险库 PIN",
          "submit": "解锁"
        },
        "toast": {
          "destroyed": "记录已销毁",
          "reissued": "已签发新的引继码"
        }
      },
      "inheritErrors": {
        "invalid_request": "请求格式不正确，请刷新页面后重试。",
        "invalid_server": "只支持日服和国际服。",
        "invalid_upload_type": "不支持的数据类型。",
        "inherit_id_invalid": "引继 ID 格式不正确（应为 16 位字母或数字）。",
        "inherit_password_invalid": "请输入引继密码（最多 64 个字符）。",
        "new_password_mode_invalid": "请选择新引继码密码的方式。",
        "reuse_password_invalid": "这个密码不能沿用（需为 8–16 个半角字符、不含空格），请改选「随机生成」。",
        "mysekai_requires_qq": "上传烤森（MySekai）数据需要先在「HarukiBot 数据授权」绑定并验证 QQ。",
        "job_already_running": "你已有一个进行中的引继任务，请先完成或取消它。",
        "rate_limited": "提交过于频繁（每小时最多 10 次），请稍后再试。",
        "server_busy": "当前引继请求过多，请稍后再试。",
        "game_degraded": "游戏服务器暂时不稳定，请稍后再试。",
        "vault_unavailable": "引继功能暂不可用，请稍后再试。",
        "identity_unavailable": "暂时无法验证你的身份，请稍后再试。",
        "store_unavailable": "服务暂时不可用，请稍后再试。",
        "job_not_found": "任务不存在或已过期。",
        "job_not_awaiting_confirm": "任务当前不在等待确认（可能已确认、已取消或已超时）。",
        "cannot_cancel": "引继已开始执行，无法取消。",
        "unauthenticated": "请先登录工具箱。",
        "ws_ticket_invalid": "实时连接凭证已失效，正在重新连接。",
        "internal_error": "服务器内部错误，请稍后再试。",
        "password_required": "请输入 Toolbox 账号密码。",
        "vault_pin_required": "请输入保险库 PIN。",
        "vault_pin_invalid_format": "保险库 PIN 需为 8–128 个字符。",
        "password_invalid": "Toolbox 账号密码错误。",
        "vault_pin_invalid": "保险库 PIN 错误。",
        "previous_password_invalid": "旧密码无法解开保险库，请再试一次，或重置保险库。",
        "vault_password_changed": "你的 Toolbox 密码在保险库创建后改过，需要输入修改前的旧密码。",
        "vault_not_initialized": "保险库尚未创建。",
        "unlock_rate_limited": "尝试次数过多，请 15 分钟后再试。",
        "entry_not_found": "记录不存在或已过期。",
        "entry_stale": "这条记录属于已重置的保险库，无法读取。",
        "code_not_available": "这条记录没有可用的引继码（已过期或未签发），请重新签发。",
        "no_previous_password": "没有可沿用的旧密码，请改选「随机生成」。",
        "reset_confirmation_required": "请确认重置保险库。",
        "reissue_failed": "重新签发引继码失败，请稍后再试。",
        "reissue_login_failed": "使用保存的凭据登录失败，凭据可能已失效。",
        "reissue_rejected": "游戏服务器拒绝了请求。",
        "client_update_required": "页面版本过旧，请刷新页面。",
        "retryAfter": "请在 {seconds} 秒后重试。",
        "network": "无法连接到服务器，请检查网络后重试。",
        "unknown": "请求失败（HTTP {status}），请稍后再试。"
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
        "targetPtInvalid": "目标活动 Pt 需要是大于 0 的整数。",
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
        "missingBasicPoint": "这首歌暂时没有基础 Pt 数据，请换一首歌或换个难度。"
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
      "hintQqPlaceholder": "你的QQ号",
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
      "credentialLabel": "凭据",
      "copyAction": "复制{label}",
      "saveWarning": "凭据仅显示一次，请立即复制并安全保存，之后将无法再次获取。",
      "configGeneratorTitle": "继续生成 Client 配置",
      "configGeneratorDescription": "打开配置生成器并自动填入 Bot ID 与凭据，后续只需补充端口、模块和名单配置。",
      "configGeneratorButton": "打开配置生成器",
      "registerAnotherButton": "注册另一个"
    },
    "toast": {
      "statusCheckFailed": "检查注册状态失败",
      "statusCheckFailedFallback": "请检查网络后点击「重试」；多次失败可能是服务暂时不可用。",
      "sendFailedTitle": "发送失败",
      "sendFailedFallback": "验证码没有发出去，请检查 QQ 号后重试；多次失败请稍后再试。",
      "missingQQNumber": "请输入 QQ 号",
      "invalidQQNumber": "请输入有效的 QQ 号（5–12 位数字）",
      "rateLimitedTitle": "请求过于频繁",
      "rateLimitedDescription": "请求次数过多，请在 {seconds} 秒后重试。",
      "alreadyRegisteredTitle": "已注册",
      "alreadyRegisteredDescription": "该 QQ 号已有注册的 Bot。",
      "registrationDisabledTitle": "注册已关闭",
      "registrationDisabledDescription": "注册功能当前已关闭。",
      "codeSentTitle": "验证码已发送",
      "codeSentDescription": "请前往 QQ {qq} 的邮箱查收。",
      "registerFailedTitle": "注册失败",
      "registerFailedFallback": "注册没有完成，请确认验证码无误后重试；验证码过期请重新发送。",
      "missingVerificationCode": "请输入验证码",
      "invalidVerificationCode": "验证码是 6 位数字，请检查后重新输入",
      "incompleteResponse": "返回数据不完整",
      "registerSuccessTitle": "注册成功",
      "clipboardUnsupported": "当前环境不支持剪贴板",
      "copySuccess": "{label} 已复制到剪贴板",
      "copyFailed": "复制到剪贴板失败"
    }
  },
  "sekaiStation": {
    "title": "协力车站",
    "description": "实时汇总社交平台上发布的国服协力房间号。",
    "viewOnSekaiStation": "在Sekai Station中查看",
    "notConfigured": "协力车站暂不可用",
    "connection": {
      "connected": "已连接",
      "connecting": "连接中…",
      "disconnected": "已断开",
      "failed": "无法连接到服务器",
      "retryIn": "{n} 秒后重试",
      "retryNow": "立即重试",
      "reconnecting": "正在重新连接…",
      "online": "{n} 人在线"
    },
    "rooms": {
      "list": "房间列表",
      "empty": "暂无房间",
      "emptyFiltered": "当前筛选条件下没有房间",
      "loading": "加载中…",
      "copyId": "复制房间号",
      "copyText": "复制文本",
      "openOriginal": "打开原帖",
      "pin": "置顶",
      "unpin": "取消置顶",
      "copied": "已复制",
      "copyFailed": "复制失败",
      "more": "更多操作",
      "idHint": "点击复制 · 长按 1 秒屏蔽 10 分钟",
      "block": "屏蔽 10 分钟",
      "blocked": "已屏蔽 {id}，10 分钟后恢复",
      "undo": "撤销"
    },
    "settings": {
      "title": "筛选与显示",
      "filter": "筛选",
      "mode": "模式",
      "blacklist": "黑名单",
      "blacklistDesc": "隐藏包含以下关键词的房间",
      "whitelist": "白名单",
      "whitelistDesc": "只显示包含以下关键词的房间",
      "presetTags": "预设标签",
      "keywordPlaceholder": "添加关键词",
      "add": "添加",
      "clear": "清空",
      "removeFilter": "移除过滤词“{name}”",
      "display": "显示",
      "expireTime": "房间显示时长",
      "durationSeconds": "{n} 秒",
      "durationMinutes": "{n} 分钟",
      "fontSize": "字号",
      "lineHeight": "行距",
      "decrease": "减小",
      "increase": "增大"
    },
    "blocked": {
      "title": "临时屏蔽",
      "hint": "10 分钟后自动恢复",
      "empty": "长按房间号 1 秒即可屏蔽",
      "minutesLeft": "剩 {n} 分钟",
      "unblock": "取消屏蔽 {id}",
      "unblockOne": "解除",
      "unblockAll": "全部解除"
    }
  }
} as const
