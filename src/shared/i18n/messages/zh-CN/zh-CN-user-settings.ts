// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: userSettings, oauth
export default {
  "userSettings": {
    "common": {
      "actionFailedTitle": "操作失败",
      "missingUserDescription": "用户信息缺失，请重新登录",
      "cancel": "取消"
    },
    "sections": {
      "accountTitle": "账号设置",
      "accountDescription": "管理你的身份、登录与安全相关设置。",
      "harukiBotTitle": "HarukiBot数据授权",
      "harukiBotDescription": "管理社交平台绑定与授权，供 HarukiBot 查询你的游戏数据。",
      "oauthTitle": "OAuth 授权管理",
      "oauthDescription": "管理通过 OAuth 授权访问你账号数据的第三方应用。"
    },
    "sekaiData": {
      "region": "区服",
      "masterVersion": "Master 版本",
      "displayVersion": "展示版本",
      "fetchVersion": "拉取版本",
      "localVersion": "本地版本",
      "remoteVersion": "远程版本",
      "updatedAt": "更新时间",
      "fileCount": "{count} 个文件",
      "progress": "状态",
      "actions": "操作",
      "never": "从未更新",
      "regionCacheTitle": "区服缓存",
      "summary": {
        "readyRegions": "可用区服",
        "cachedFiles": "已缓存文件",
        "activeTasks": "活动任务"
      },
      "refreshMasterData": "更新",
      "clear": "清理",
      "clearDialog": {
        "title": "清理Master数据缓存？",
        "description": "将清理{region}的本地Master数据与music metas缓存，需要重新下载后才能继续使用相关数据。",
        "confirm": "确认清理"
      },
      "queueTitle": "更新队列",
      "queueEmpty": "暂无更新任务。",
      "queueDetails": {
        "cacheHit": "缓存已是最新，没有下载新文件。",
        "updated": "已下载并写入新的缓存数据。",
        "completed": "任务已完成。",
        "failed": "任务失败。",
        "fileProgress": "正在处理 {file}（{current}/{total}）。",
        "file": "正在处理 {file}。",
        "phase": "当前阶段：{phase}。"
      },
      "status": {
        "idle": "等待更新",
        "loading": "加载中",
        "ready": "可用",
        "clearing": "清理中",
        "error": "失败"
      },
      "phases": {
        "queued": "排队中",
        "checking": "检查版本",
        "fetching-master": "下载 Master",
        "fetching-music-metas": "下载 Music metas",
        "writing-cache": "写入缓存",
        "ready": "完成",
        "clearing": "清理缓存"
      },
      "queueStatus": {
        "queued": "排队",
        "running": "运行中",
        "done": "完成",
        "error": "失败"
      }
    },
    "kratosFlow": {
      "title": "身份设置",
      "description": "此页面用于修改邮箱、密码和个人资料。",
      "toast": {
        "savedTitle": "设置已更新",
        "profileSavedDescription": "邮箱或昵称更新成功",
        "passwordSavedDescription": "密码设置已更新",
        "mfaSavedDescription": "多因素认证设置已更新",
        "socialSavedDescription": "社交登录设置已更新",
        "genericSavedDescription": "身份设置已更新"
      },
      "groups": {
        "profile": "个人资料",
        "password": "密码",
        "oidc": "社交登录",
        "passkey": "通行密钥",
        "webauthn": "安全密钥",
        "totp": "身份验证器",
        "lookupSecret": "恢复码"
      }
    },
    "profileCard": {
      "title": "个人资料",
      "description": "头像、昵称与邮箱绑定。"
    },
    "securityCard": {
      "title": "安全与登录",
      "description": "密码、多因素认证、社交登录与会话管理。"
    },
    "account": {
      "title": "头像设置",
      "description": "管理您的 Haruki 工具箱头像",
      "changeAvatar": "更换头像",
      "uploading": "上传中...",
      "autoUploadHint": "选择头像后会自动裁剪为方形并压缩上传，无需再点击保存。",
      "toast": {
        "previewFailedTitle": "预览失败",
        "previewFailedDescription": "头像文件读取失败，请重试",
        "invalidAvatarTypeTitle": "头像格式不支持",
        "invalidAvatarTypeDescription": "请选择图片文件",
        "avatarTooLargeTitle": "头像文件过大",
        "avatarTooLargeDescription": "请选择小于 {sizeMb} MB 的图片",
        "savedTitle": "头像已更新",
        "savedDescription": "头像上传成功",
        "saveFailedTitle": "头像上传失败",
        "saveFailedDescription": "头像上传失败，请稍后重试"
      }
    },
    "email": {
      "unbound": "未绑定",
      "title": "邮箱设置",
      "description": "管理您的邮箱绑定信息",
      "kratosManagedDescription": "邮箱变更与验证由身份中心统一处理。",
      "kratosManagedHint": "邮箱与昵称修改都在身份中心处理，完成后返回工具箱即可同步最新状态。",
      "currentEmailLabel": "当前邮箱",
      "currentNicknameLabel": "当前昵称",
      "unsetNickname": "未设置",
      "changeButton": "管理邮箱和昵称",
      "verifyButton": "验证邮箱",
      "dialog": {
        "title": "更换邮箱",
        "description": "输入新的邮箱，完成人机验证并发送验证码。",
        "newEmailPlaceholder": "新的邮箱地址",
        "codePlaceholder": "邮箱验证码",
        "countdown": "{seconds}s",
        "sendCodeButton": "发送验证码",
        "confirmButton": "确认更换"
      },
      "toast": {
        "invalidNewEmailTitle": "请输入有效的新邮箱",
        "invalidNewEmailDescription": "请检查邮箱格式后重试",
        "completeCaptchaTitle": "请先完成人机验证",
        "completeCaptchaDescription": "通过下方验证码后再发送邮件",
        "codeSentTitle": "验证码已发送",
        "codeSentDescription": "已发送到 {email}，请注意查收",
        "sendCodeFailedTitle": "发送验证码失败",
        "sendCodeFailedDescription": "发送验证码失败",
        "inputCodeTitle": "请输入验证码",
        "inputCodeDescription": "请填写邮箱收到的验证码",
        "changeSuccessTitle": "更换邮箱成功",
        "changeSuccessDescription": "请重新登录以生效",
        "changeFailedTitle": "更换邮箱失败",
        "changeFailedDescription": "更换邮箱失败"
      }
    },
    "password": {
      "title": "密码设置",
      "description": "管理您的Haruki工具箱账号的密码",
      "kratosManagedDescription": "密码修改由身份中心统一处理。",
      "kratosManagedHint": "点击下方按钮后会跳转到身份设置流程，完成密码修改后返回即可。",
      "changeButton": "更换密码",
      "dialog": {
        "title": "更换密码",
        "description": "请输入当前密码和新密码",
        "oldPasswordLabel": "当前密码",
        "oldPasswordPlaceholder": "请输入当前密码",
        "newPasswordLabel": "新密码",
        "newPasswordPlaceholder": "请输入新密码",
        "confirmPasswordLabel": "确认密码",
        "confirmPasswordPlaceholder": "请再次输入新密码",
        "submit": "提交"
      },
      "toast": {
        "validateFailedTitle": "验证失败",
        "oldPasswordRequired": "请输入当前密码",
        "newPasswordRequired": "请输入新密码",
        "passwordMismatch": "两次输入的新密码不一致",
        "passwordMinLength": "新密码长度至少为8位",
        "changeSuccessTitle": "密码修改成功",
        "changeSuccessDescription": "请重新登录",
        "changeFailedTitle": "密码修改失败",
        "changeFailedDescription": "密码修改失败"
      }
    },
    "mfa": {
      "title": "多因素认证",
      "description": "管理 TOTP、WebAuthn 与恢复码等安全认证方式。",
      "hint": "你可以在此页面绑定或更新 MFA 方式，提升账号安全性。",
      "manageButton": "管理 MFA"
    },
    "social": {
      "title": "社交登录",
      "description": "管理 Google 等 OIDC 身份提供商绑定。",
      "hint": "你可以在此页面完成社交账号绑定或解绑。",
      "manageButton": "管理社交登录"
    },
    "sessions": {
      "title": "会话管理",
      "description": "查看当前登录会话，并撤销不可信设备。",
      "hint": "你可以单独踢下线某台设备，也可以一次性下线其他会话。",
      "manageButton": "管理会话",
      "page": {
        "title": "会话管理",
        "description": "管理当前身份下的活跃会话。",
        "refresh": "刷新",
        "currentSession": "当前会话",
        "currentTag": "当前",
        "otherSessions": "其他活跃会话",
        "empty": "暂无其他活跃会话。",
        "unknownDevice": "未知设备",
        "issuedAt": "签发时间",
        "authenticatedAt": "认证时间",
        "expiresAt": "过期时间",
        "aal": "认证等级",
        "revokeOne": "下线该会话",
        "revokeOthers": "下线其他会话",
        "loadFailed": "加载会话失败。",
        "revokeFailed": "下线该会话失败。",
        "revokeOthersFailed": "下线其他会话失败。"
      }
    },
    "imBinding": {
      "title": "社交平台账号绑定设置",
      "description": "管理您的Haruki工具箱账号的社交平台账号绑定信息",
      "fields": {
        "platform": "平台",
        "account": "账号",
        "verificationStatus": "验证状态"
      },
      "status": {
        "verified": "已验证",
        "unverified": "未验证"
      },
      "unbindButton": "取消绑定",
      "unbindDialog": {
        "title": "确认取消绑定？",
        "description": "取消绑定后，您将无法通过此社交平台账号使用HarukiBot查询您上传的数据。",
        "confirm": "确认"
      },
      "selectPlatformLabel": "选择平台",
      "selectPlatformPlaceholder": "选择平台",
      "accountPlaceholder": "请输入账号 ID",
      "emailVerifyRequiredHint": "请先完成邮箱验证，再进行社交平台账号绑定操作。",
      "captchaHint": "为防止滥用，请先通过下方验证码再发送邮件验证码。",
      "actions": {
        "sendEmailCode": "发送邮件验证码",
        "generateCode": "生成验证码"
      },
      "dialog": {
        "title": "绑定社交平台验证",
        "qqDescription": "请输入邮件中的验证码完成绑定。",
        "otherDescription": "请在对应平台使用下方验证码完成绑定，然后点击“验证”刷新状态。",
        "qqCodePlaceholder": "请输入邮件验证码",
        "verifyButton": "验证"
      },
      "toast": {
        "emailNotVerifiedTitle": "邮箱未验证",
        "emailNotVerifiedDescription": "请先验证邮箱后再进行社交平台账号绑定操作",
        "sendFailedTitle": "发送失败",
        "completeCaptchaDescription": "请先完成验证码验证",
        "verificationCodeSentTitle": "验证码已发送",
        "verificationCodeSentDescription": "请前往QQ {account} 的邮箱查收",
        "generateFailedTitle": "生成失败",
        "incompleteResponseDescription": "返回数据不完整",
        "codeGeneratedTitle": "验证码已生成",
        "missingQQAccountDescription": "请先填写 QQ 号",
        "invalidQQAccountDescription": "QQ 号必须为纯数字",
        "invalidQQBotAccountDescription": "QQ 官方 Bot 的用户 OpenID 长度不正确，请检查是否完整复制",
        "missingAccountDescription": "请填写需要绑定的账号 ID",
        "verifyFailedTitle": "验证失败",
        "inputQQCodeDescription": "请输入邮件中的验证码",
        "verifySuccessTitle": "验证成功",
        "verifySuccessDefaultDescription": "已完成绑定",
        "missingStatusTokenDescription": "缺少状态令牌，请重新生成验证码",
        "notVerifiedTitle": "未完成验证",
        "notVerifiedDescription": "您还没有完成验证",
        "notVerifiedFallbackDescription": "请在社交平台完成验证后再试",
        "unboundSuccessTitle": "已取消绑定",
        "unboundSuccessDescription": "该社交平台账号已与当前账号解绑"
      }
    },
    "imAuthorization": {
      "title": "授权社交平台查询",
      "description": "管理您的Haruki工具箱账号授权可查询游戏账号信息的社交平台",
      "addButton": "新增授权",
      "emptyTitle": "暂无授权的社交平台",
      "emptyDescription": "添加授权后，对应平台的账号即可查询你的游戏账号信息。",
      "platformPlaceholder": "请选择社交平台",
      "platforms": {
        "qq": "QQ",
        "qqbot": "QQ官方Bot",
        "discord": "Discord",
        "telegram": "Telegram"
      },
      "fields": {
        "platform": "平台",
        "account": "账号",
        "remark": "备注",
        "allowFastVerification": "允许快速验证",
        "allowFastVerificationHint": "开启后，该用户可以在HarukiBot中快速通过账号验证"
      },
      "fastVerificationBadge": "快速验证",
      "actions": {
        "edit": "编辑",
        "delete": "删除"
      },
      "dialog": {
        "createTitle": "新增社交平台授权",
        "editTitle": "编辑社交平台授权",
        "descriptionMain": "修改授权可查询信息的社交平台账号",
        "descriptionHint": "你需要先完成账号绑定设置才能使用此功能"
      },
      "deleteDialog": {
        "title": "确认删除",
        "description": "确认删除 {platform} {userId} 吗？此操作无法撤销。",
        "deleting": "删除中..."
      },
      "toast": {
        "saveFailedTitle": "保存失败",
        "accountRequiredDescription": "请输入账号",
        "accountQQNumericDescription": "QQ 号必须为纯数字",
        "accountQQBotLengthDescription": "QQ 官方 Bot 的用户 OpenID 长度不正确，请检查是否完整复制",
        "saveSuccessTitle": "已保存授权",
        "saveSuccessDescription": "社交平台账号授权信息已更新",
        "deleteSuccessTitle": "已删除授权",
        "deleteSuccessDescription": "该社交平台账号授权已移除",
        "deleteFailedTitle": "删除失败"
      }
    },
    "oauthAuthorizations": {
      "title": "已授权的应用",
      "description": "查看并随时撤销已授权访问你账号数据的第三方应用。",
      "refresh": "刷新",
      "emptyTitle": "暂无已授权的应用",
      "emptyDescription": "当你授权第三方应用访问账号数据后，它们会显示在这里。",
      "authorizedAtPrefix": "授权于",
      "clientType": {
        "bot": "Bot",
        "website": "网站"
      },
      "dialog": {
        "title": "撤销授权",
        "description": "确认撤销 {clientName} 的所有访问权限吗？该应用将无法再访问您的数据。",
        "revoke": "撤销",
        "revoking": "撤销中..."
      },
      "toast": {
        "fetchFailedTitle": "获取授权列表失败",
        "fetchFailedFallback": "获取失败",
        "revokeSuccessTitle": "已撤销授权",
        "revokeSuccessDescription": "已撤销 {clientName} 的访问权限",
        "revokeFailedTitle": "撤销失败",
        "revokeFailedFallback": "撤销失败"
      }
    },
    "gameBinding": {
      "title": "游戏账号绑定",
      "description": "管理您的 Haruki 工具箱账号绑定的《世界计划: 缤纷舞台 feat. 初音未来》游戏账号",
      "alert": {
        "title": "注意",
        "line1Server": "同一个区服",
        "line1Middle": "的",
        "line1GameId": "同一个游戏ID",
        "line1After": "在Haruki工具箱中仅限一个Haruki工具箱用户绑定",
        "line2": "Haruki工具箱的账号绑定信息与HarukiBot NEO不共享，如果需要在HarukiBot NEO上查询数据，请先按照Bot使用帮助在Bot上绑定对应的游戏账号"
      },
      "addButton": "绑定新账号",
      "empty": "暂无数据",
      "region": {
        "jp": "日服",
        "en": "国际服",
        "tw": "台服",
        "kr": "韩服",
        "cn": "国服"
      },
      "table": {
        "server": "区服",
        "userId": "游戏UID",
        "verificationStatus": "验证状态",
        "actions": "操作"
      },
      "status": {
        "verified": "已验证",
        "unverified": "未验证",
        "default": "默认"
      },
      "actions": {
        "edit": "编辑",
        "grants": "数据授权",
        "receivedGrants": "收到的授权",
        "delete": "删除",
        "setDefault": "设为默认账号"
      },
      "editDialog": {
        "createTitle": "新增账号",
        "editTitle": "编辑账号",
        "subtitle": "绑定你的游戏账号并配置数据权限。",
        "verifyHint": "完成验证后才能保存绑定。",
        "qqGate": {
          "title": "需要先绑定并验证 QQ",
          "description": "添加游戏账号前，请先在「HarukiBot 数据授权」中绑定并验证你的 QQ 号。",
          "action": "前往绑定 QQ"
        },
        "basicInfoTitle": "账号基本信息",
        "serverPlaceholder": "选择区服",
        "verifyButton": "验证",
        "fields": {
          "server": "区服",
          "userId": "游戏UID",
          "verificationStatus": "验证状态"
        },
        "suite": {
          "title": "Suite数据设置",
          "description": "管理您上传的游戏账号的Suite数据设置"
        },
        "mysekai": {
          "title": "MySekai数据设置",
          "description": "管理您上传的游戏账号的MySekai数据设置"
        }
      },
      "deleteDialog": {
        "title": "确认删除",
        "description": "确认删除 {server} 的游戏UID {userId} 吗？此操作无法撤销。"
      },
      "verifyDialog": {
        "title": "验证码生成成功",
        "description": "请在游戏内的个性签名中输入以下验证码完成验证",
        "copyHint": "点击下方验证码即可一键复制到剪切板",
        "confirmButton": "我已输入，关闭此窗口",
        "notice": {
          "keepFullCode": "请务必完整输入进个性签名，不要移除斜杠",
          "returnHome": "在游戏中完成验证码输入之后，请务必退回到主页确保验证码成功保存，再继续添加账号",
          "saveAfterClose": "输入验证码之后，直接关闭此窗口，点击保存按钮，即可进行账号验证"
        }
      },
      "permissions": {
        "suite": {
          "allowPublicApi": {
            "title": "允许公开API访问",
            "description": "允许Suite数据通过Haruki工具箱公开API访问"
          },
          "allowSakura": {
            "title": "允许上传至SakuraBot",
            "description": "允许Suite数据上传至SakuraBot"
          },
          "allow8823": {
            "title": "允许上传至烤森Bot",
            "description": "允许Suite数据上传至烤森Bot"
          },
          "allowResona": {
            "title": "允许上传至ResonaBot",
            "description": "允许Suite数据上传至ResonaBot"
          },
          "allowLuna": {
            "title": "允许上传至LunaBot",
            "description": "允许Suite数据上传至LunaBot"
          }
        },
        "mysekai": {
          "allowPublicApi": {
            "title": "允许公开API访问",
            "description": "允许MySekai数据通过Haruki工具箱公开API访问"
          },
          "allowFixtureApi": {
            "title": "允许家具共享API",
            "description": "允许MySekai账号UID出现在家具共享API"
          },
          "allow8823": {
            "title": "允许上传至烤森Bot",
            "description": "允许MySekai数据上传至烤森Bot"
          },
          "allowResona": {
            "title": "允许上传至ResonaBot",
            "description": "允许MySekai数据上传至ResonaBot"
          },
          "allowLuna": {
            "title": "允许上传至LunaBot",
            "description": "允许MySekai数据上传至LunaBot"
          }
        }
      },
      "grants": {
        "title": "游戏账号数据授权",
        "description": "把已验证账号的 suite / mysekai / profile 数据临时授权给其他 Toolbox 用户读取。",
        "receivedDescription": "查看其他 Toolbox 用户授权给你的游戏账号数据。",
        "selectedAccount": "当前账号：{account}",
        "noSelectedAccount": "未选择账号",
        "ownedTitle": "此账号授权出去的数据",
        "receivedTitle": "别人授权给我的数据",
        "emptyOwned": "该账号暂无授权",
        "emptyReceived": "暂无收到的授权",
        "fallback": "—",
        "yourUserId": "你的 Toolbox 用户 ID：",
        "dataType": {
          "suite": "Suite",
          "mysekai": "MySekai",
          "profile": "Profile"
        },
        "actions": {
          "refresh": "刷新",
          "save": "保存授权"
        },
        "form": {
          "title": "新增或更新授权",
          "granteeUserId": "被授权 Toolbox 用户 ID",
          "granteeUserIdPlaceholder": "例如 1234567890",
          "dataType": "数据类型",
          "expiresAt": "过期时间",
          "expiresAtHelp": "必须是未来时间，不提供永久授权。",
          "profileHint": "Profile 是实时数据：被授权用户每次查看都会经由你的账号向游戏服务器发起请求。"
        },
        "table": {
          "owner": "授权来源",
          "grantee": "被授权用户",
          "dataType": "数据类型",
          "expiresAt": "过期时间",
          "actions": "操作"
        },
        "validation": {
          "verifiedOnly": "只有已验证绑定账号可以创建数据授权",
          "granteeRequired": "请填写被授权用户 ID",
          "selfGrant": "不能授权给自己",
          "dataType": "只支持 suite、mysekai 或 profile",
          "futureExpiry": "过期时间必须是未来时间"
        },
        "toast": {
          "loadFailedTitle": "加载数据授权失败",
          "saveFailedTitle": "保存数据授权失败",
          "deleteFailedTitle": "撤销数据授权失败",
          "saved": "数据授权已保存",
          "deleted": "数据授权已撤销"
        }
      },
      "toast": {
        "setDefaultSuccessTitle": "已设为默认账号",
        "setDefaultSuccessDescription": "各功能页面将默认选中该账号",
        "setDefaultFailedTitle": "设置默认账号失败",
        "deleteSuccessTitle": "删除成功",
        "deleteSuccessDescription": "账号已解除绑定",
        "deleteFailedTitle": "删除失败",
        "saveSuccessTitle": "保存成功",
        "saveSuccessDescription": "账号设置已更新",
        "saveFailedTitle": "保存失败",
        "verifyBeforeCreateDescription": "新增账号前请先点击“验证”生成验证码，并在游戏内完成设置。",
        "uidMustBeNumericDescription": "游戏UID必须是纯数字",
        "generateCodeFailedTitle": "无法生成验证码",
        "selectServerAndUidDescription": "请先选择区服并填写游戏UID",
        "missingCodeDescription": "未返回验证码",
        "copySuccessTitle": "复制成功",
        "copySuccessDescription": "已成功复制验证码，请前往游戏内填写您的验证码",
        "copyFailedTitle": "复制失败",
        "clipboardUnsupportedDescription": "当前环境不支持剪贴板操作，请手动复制验证码",
        "copyFallbackDescription": "请手动选择并复制验证码"
      }
    }
  },
  "oauth": {
    "scope": {
      "userRead": "读取个人资料",
      "bindingsRead": "读取绑定账号",
      "gameDataRead": "读取游戏数据",
      "gameDataWrite": "上传游戏数据",
      "offlineAccess": "保持离线访问并获取刷新令牌"
    },
    "login": {
      "unknownApp": "未知应用",
      "title": "登录以继续",
      "signInDescriptionPrefix": "要继续访问 ",
      "signInDescriptionSuffix": "，请先登录您的 Haruki Toolbox 账号。",
      "readyDescriptionPrefix": "您已登录，继续前往 ",
      "readyDescriptionSuffix": " 完成授权流程。",
      "continuingTitle": "正在继续登录",
      "continuingDescriptionPrefix": "正在为 ",
      "continuingDescriptionSuffix": " 准备后续授权流程。",
      "signInButton": "去登录",
      "continueButton": "继续",
      "cancel": "取消授权",
      "rejectDescription": "该授权请求已在登录前被取消。",
      "invalidTitle": "无效的登录请求",
      "invalidDescription": "缺少必要的登录 challenge，或 challenge 已无效。请从客户端应用重新发起授权。",
      "backHome": "返回首页",
      "toast": {
        "failedTitle": "继续登录失败",
        "missingRedirect": "未收到重定向地址",
        "retry": "无法继续登录流程，请重试。"
      }
    },
    "consent": {
      "unknownApp": "未知应用",
      "title": "授权请求",
      "descriptionPrefix": "",
      "descriptionSuffix": " 请求访问您的 Haruki Toolbox 账号",
      "continuingDescriptionPrefix": "正在为 ",
      "continuingDescriptionSuffix": " 准备授权流程。",
      "scopeIntro": "该应用将能够：",
      "noScopesRequested": "该应用未请求额外权限范围。",
      "revokeHint": "授权后，您可以随时在「OAuth 授权管理」页面撤销。",
      "reject": "拒绝",
      "authorize": "授权",
      "authorizing": "授权中...",
      "rejectDescription": "资源所有者已拒绝本次授权请求。",
      "invalidTitle": "无效的授权请求",
      "invalidDescription": "缺少必要授权参数，或 challenge 已无效。请从客户端应用重新发起授权。",
      "backHome": "返回首页",
      "toast": {
        "failedTitle": "授权失败",
        "missingRedirect": "未收到重定向地址",
        "retry": "无法完成授权，请重试"
      }
    }
  }
} as const
