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
        "uploadSuccessInheritFallback": "引继码已提交，账号数据已保存",
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
        "description": "输入游戏里的引继 ID 和密码，工具箱会代你登录一次并保存账号数据。",
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
        "alerts": {
          "notesTitle": "使用须知",
          "warning1": {
            "title": "使用前请了解",
            "description": "请妥善保存你的引继 ID 与密码；工具箱服务器不会保存它们。"
          },
          "warning2": {
            "title": "风险说明",
            "text": "本功能会用你的引继码模拟游戏客户端登录一次。官方理论上可能将其视为异常登录，请自行评估风险；不放心请改用 HarukiProxy 或 iOS 模块。"
          },
          "reminder1": {
            "title": "提醒",
            "line1": "仅在您主动勾选后，引继信息才会短期保存在当前浏览器本地。",
            "line2": "本地保存将在 24 小时后自动过期，取消勾选会立即清除已保存的信息。"
          },
          "reminder2": {
            "title": "提醒",
            "text": "使用前请先登录工具箱并在「游戏账号管理」绑定要上传的游戏账号。未绑定时，即使提示上传成功，数据也不会保存。",
            "bindLink": "去绑定"
          }
        },
        "remember": {
          "label": "在当前设备短期记住引继信息",
          "description": "提交成功后记住 24 小时（仅保存在当前浏览器）；取消勾选会立即清除。"
        },
        "confirmDialog": {
          "title": "确认上传数据",
          "dataTypePrefix": "请再次确认您要上传的数据类型：",
          "loginNotice": "你还没有登录工具箱。未在工具箱绑定游戏账号时，即使提示上传成功，数据也不会保存；建议先登录并绑定。",
          "mysekaiNotice": "上传烤森（MySekai）数据需要先登录工具箱，并在「HarukiBot 数据授权」里绑定并验证 QQ 号，否则 Bot 无法为你查询烤森数据。",
          "cancel": "取消",
          "confirm": "确认上传"
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
