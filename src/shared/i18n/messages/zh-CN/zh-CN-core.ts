// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: app, common, turnstile, auth, sidebarUser, home, gameAccountSelect, cardBox, eventRecords, musicProgress, globalSearch, costumes, gachas, playerProfile, training, searchAlias, sekaiRegion, sekaiUnreleased, navigation, webLayout, route, musicLibrary, cards, events, homeSettings, core, catalog
export default {
  "uploadedGameData": {
    "missingTitle": "尚未上传游戏数据",
    "missing": {
      "suite": "该游戏账号还没有上传过游戏数据（Suite，即账号完整数据），请先到「数据上传」页上传，再回来点刷新。",
      "mysekai": "该游戏账号还没有上传过烤森数据（MySekai），请先到「数据上传」页上传，再回来点刷新。",
      "profile": "还没有这个游戏账号的数据，暂时无法读取实时资料。请先到「数据上传」页上传一次游戏数据，再回来点刷新。"
    },
    "missingGranted": "该账号的主人还没有上传游戏数据。请联系对方上传；如果对方已允许你代传，你也可以在「数据上传」页上传。",
    "uploadAction": "前往数据上传页",
    "uploadedAt": "数据上传时间：{time}",
    "grantLapsed": "该账号的授权已过期或被撤销，请联系授权方重新授权。",
    "refreshUpToDate": "数据已是最新",
    "refreshUpdated": "已更新到 {time}",
    "missingAccounts": "有 {count} 个绑定账号尚未上传游戏数据，请先前往数据上传页完成上传。",
    "otherFailures": "另有 {count} 个账号读取失败，请稍后重试。"
  },
  "app": {
    "name": "Haruki工具箱"
  },
  "common": {
    "save": "保存",
    "reset": "重置",
    "cancel": "取消",
    "confirm": "确认",
    "close": "关闭",
    "back": "返回",
    "tip": "提示",
    "actionFailed": "操作失败，请稍后重试",
    "postSuccessWarningTitle": "操作成功，但有后续异常",
    "postSuccessWarningDescription": "后续刷新失败，如页面数据未更新请手动刷新。",
    "guest": "未登录",
    "accountIndex": "账号 {index}",
    "apiResponse": "请求失败",
    "missingUpdatedData": "{context}：服务器返回的数据不完整，请刷新后重试。",
    "selectDateTime": "请选择时间"
  },
  "backendMessages": {
    "notAuthenticated": "你还没有登录，或登录状态已过期。请重新登录后再试。",
    "uploadNotAllowed": "当前账号没有向这个游戏账号上传数据的权限。请使用绑定了该游戏账号的账号上传，或请账号所有者授予你上传权限。",
    "writeGrantExpired": "账号所有者授予你的上传权限已过期或被撤销。请联系所有者重新授权，或改为上传自己绑定的游戏账号。",
    "bindingAccessDenied": "你没有访问这个游戏账号数据的权限。如果是他人授权的账号，授权可能已过期或被撤销，请联系授权方重新授权。",
    "invalidServer": "选择的游戏服务器无效。请重新选择服务器后再试。",
    "uploadProcessFailed": "上传的数据无法处理。请确认文件是完整、未修改的抓包数据，然后重新上传。",
    "mysekaiRetrieveFailed": "无法获取烤森数据（MySekai），可能是这个游戏账号还没有完成烤森（MySekai）教程。请在游戏里完成教程后再试。",
    "suiteRetrieveFailed": "获取游戏数据时发生了未知错误。请稍后重试；如果持续失败，请提交工单反馈。",
    "gameDataRetrieveFailed": "无法从游戏服务器获取数据。请确认引继码和引继密码正确且未过期，稍后再试。",
    "verificationCodeMissing": "游戏个性签名里没有找到验证码。请确认已把整段验证码粘贴进个性签名并保存，退回游戏主页后再试。",
    "verificationCodeMismatch": "游戏个性签名里的验证码与本次生成的不一致。请把最新生成的验证码完整粘贴进个性签名并保存，退回游戏主页后再试。",
    "verificationCodeExpired": "验证码已过期或不存在。请重新生成验证码后再试。",
    "verificationTooManyAttempts": "验证尝试次数过多。请重新生成一个新的验证码后再试。",
    "gameAccountNotFound": "没有找到这个游戏账号。请检查选择的服务器和玩家 ID 是否正确。",
    "gameServerUnavailable": "游戏服务器暂时无法访问，可能正在维护。请稍后再试。",
    "accountBoundByAnotherUser": "这个游戏账号已被其他用户绑定。如果这是你的账号，请提交工单申请处理。",
    "accountBoundByBannedUser": "这个游戏账号被一个已封禁的用户绑定。如果这是你的账号，请提交工单申请处理。",
    "bindingNotVerified": "这个游戏账号的绑定还没有完成验证。请先在游戏账号管理页完成验证。",
    "bindingLocked": "这个绑定已被管理员锁定，暂时无法修改。如有疑问请提交工单。",
    "granteeNotFound": "没有找到要授权的用户。请检查对方的工具箱用户 ID 是否正确。",
    "grantToSelf": "不能给自己授权。请填写其他用户的工具箱用户 ID。",
    "expiresAtNotFuture": "到期时间必须晚于当前时间。请重新选择到期时间。",
    "granteeBanned": "要授权的用户已被封禁，无法授权。",
    "qqBindingExists": "当前账号已经绑定了 QQ。如需更换，请先解除现有绑定。",
    "emailVerificationRequired": "请先完成邮箱验证，再绑定社交平台账号。",
    "codeInvalidOrExpired": "验证码无效或已过期。请重新获取验证码后再试。",
    "codeTooManyAttempts": "验证尝试次数过多。请重新获取验证码后再试。",
    "ticketClosed": "这个工单已经关闭，无法继续回复。如有新问题请新建工单。",
    "ticketNotFound": "没有找到这个工单，可能已被删除。请返回工单列表刷新。",
    "ticketQuotaExceeded": "你的工单数量已达上限。请等待现有工单处理完毕后再新建。",
    "messageLength": "消息内容需要在 1 到 4000 个字符之间。请调整后重新发送。",
    "captchaFailed": "人机验证未通过。请重新完成验证后再试。",
    "invalidVerificationCode": "验证码不正确。请检查后重新输入。",
    "reauthRequired": "需要重新验证密码后才能继续。",
    "consentChallengeExpired": "授权请求已过期或无效。请回到发起授权的应用重新开始。",
    "loginChallengeRequired": "缺少授权参数。请回到发起授权的应用重新开始。",
    "inheritFailed": "引继失败。请确认引继码和引继密码正确，并在游戏内重新生成引继码后再试。",
    "inheritFailedWithCode": "引继失败（游戏服务器返回：{code}）。请确认引继码和引继密码正确，并在游戏内重新生成引继码后再试。",
    "suiteParseFailed": "游戏数据解析失败。请确认上传的是完整、未修改的抓包数据；如果持续失败，请提交工单反馈。",
    "playerDataNotFound": "没有找到这个玩家的数据。请先上传游戏数据后再试。",
    "otpIncorrect": "一次性密码不正确。请检查后重新输入。"
  },
  "turnstile": {
    "loading": "正在加载验证码组件...",
    "loadFailed": "验证码组件加载失败，请检查网络后重试。",
    "retry": "重试加载"
  },
  "auth": {
    "common": {
      "cancel": "取消",
      "loadingFlow": "正在加载登录页面…",
      "restartFlow": "重新开始",
      "loadFlowFailed": "{flow}已过期或暂时无法连接，请点击下方按钮重新开始。",
      "serviceUnavailable": "登录服务暂时无法连接，请稍后重试（错误码 {status}）。",
      "flowNames": {
        "login": "登录页面",
        "registration": "注册页面",
        "recovery": "找回密码页面",
        "verification": "邮箱验证页面",
        "settings": "账号安全设置页面"
      }
    },
    "kratos": {
      "labels": {
        "code": "验证码",
        "codePlaceholder": "请输入收到的验证码",
        "totpCode": "动态验证码",
        "totpCodePlaceholder": "请输入验证器中的 6 位数字",
        "lookupSecret": "备用恢复码",
        "savePassword": "保存密码",
        "continueWithCode": "通过邮箱验证码登录",
        "sendLink": "发送链接",
        "verify": "验证",
        "submit": "提交"
      },
      "messages": {
        "reauthConfirm": "为了保护账号安全，请重新输入密码确认是你本人在操作。",
        "mfaRequired": "请完成第二步验证后继续。",
        "settingsSaved": "设置已保存。",
        "recoverySucceeded": "账号已成功找回。请立即设置一个新密码。",
        "recoveryLinkSent": "找回密码邮件已发送到你填写的邮箱。请查收并点击邮件中的链接；如果没有收到，请检查垃圾邮件并确认邮箱拼写正确。",
        "recoveryCodeSent": "找回密码验证码已发送到你填写的邮箱。请查收并在下方输入；如果没有收到，请检查垃圾邮件并确认邮箱拼写正确。",
        "verificationLinkSent": "验证邮件已发送到你填写的邮箱。请点击邮件中的链接完成验证；如果没有收到，请检查垃圾邮件。",
        "verificationSucceeded": "邮箱验证成功。",
        "verificationCodeSent": "验证码已发送到你填写的邮箱。请查收并在下方输入；如果没有收到，请检查垃圾邮件。",
        "invalidValue": "填写的内容无效，请检查后重新填写。",
        "requiredField": "请填写这一项。",
        "tooShort": "内容太短，请至少输入 {min_length} 个字符。",
        "invalidFormat": "格式不正确，请检查后重新填写。",
        "passwordPolicy": "这个密码不符合安全要求，请换一个更长、更复杂且没有在数据泄露中出现过的密码。",
        "invalidCredentials": "邮箱或密码不正确。请检查后重试；忘记密码可以在下方找回。",
        "accountExists": "这个邮箱已经注册过账号。请直接登录，或使用“忘记密码”找回。",
        "totpInvalid": "验证器中的验证码不正确，请输入最新的验证码。",
        "identifierMissing": "请填写邮箱或用户名。",
        "addressNotVerified": "这个邮箱还没有完成验证。请先查收验证邮件并完成验证。",
        "noTotpDevice": "当前账号还没有设置验证器。",
        "lookupSecretUsed": "这个备用恢复码已经使用过了，请换一个。",
        "noLookupSecret": "当前账号还没有设置备用恢复码。",
        "lookupSecretInvalid": "备用恢复码不正确，请检查后重新输入。",
        "tooLong": "内容太长，请不要超过 {max_length} 个字符。",
        "passwordBreached": "这个密码曾在已知的数据泄露中出现，请换一个密码。",
        "passwordTooSimilar": "密码与邮箱或用户名过于相似，请换一个密码。",
        "passwordTooShort": "密码太短，请至少输入 {min_length} 个字符。",
        "passwordTooLong": "密码太长，请不要超过 {max_length} 个字符。",
        "accountNotActive": "这个账号目前无法使用。如有疑问请联系管理员。",
        "captchaFailed": "人机验证未通过，请重新完成验证。",
        "flowExpired": "页面已过期，请点击下方按钮重新开始。",
        "loginAlreadyCompleted": "这次登录已经完成，请刷新页面。",
        "loginCodeInvalid": "登录验证码无效或已使用，请重新获取。",
        "recoveryTokenInvalid": "找回密码链接无效或已使用，请重新发起找回密码。",
        "recoveryCodeInvalid": "找回密码验证码无效或已使用，请重新获取。",
        "verificationTokenInvalid": "验证链接无效或已使用，请重新发送验证邮件。",
        "verificationCodeInvalid": "验证码无效或已使用，请重新获取。",
        "systemError": "登录服务发生了内部错误，请稍后重试。"
      }
    },
    "toast": {
      "networkError": "网络错误，请检查连接",
      "loginFailedTitle": "登录失败",
      "accountBannedTitle": "账号已被封禁",
      "permissionDenied": "权限不足，请检查账号状态",
      "tryLater": "请稍后再试",
      "logoutSuccessTitle": "已退出登录",
      "invalidReturnToTitle": "登录流程已重置",
      "invalidReturnToDescription": "检测到异常跳转目标，已为您重新发起安全登录流程。",
      "invalidRegistrationReturnToTitle": "注册流程已重置",
      "invalidRegistrationReturnToDescription": "检测到异常跳转目标，已为您重新发起安全注册流程。"
    },
    "login": {
      "title": "登录到 Haruki 工具箱",
      "description": "使用您的邮箱和密码登录",
      "emailLabel": "邮箱",
      "emailPlaceholder": "请输入您的邮箱",
      "passwordLabel": "密码",
      "passwordPlaceholder": "请输入您的密码",
      "forgotPassword": "忘记密码？",
      "submit": "登录",
      "noAccount": "还没有账号？",
      "registerLink": "注册",
      "reasons": {
        "authRequired": "需要登录后才能访问该页面，登录后会自动返回。",
        "adminRequired": "该页面需要管理员账号登录，登录后会自动返回。",
        "sessionExpired": "登录状态已过期，请重新登录，登录后会自动返回。"
      },
      "toast": {
        "enterEmail": "请输入邮箱地址",
        "completeCaptcha": "请先完成人机验证",
        "completeLoginCaptcha": "请先完成人机验证",
        "resetEmailSentTitle": "重置密码邮件已发送",
        "resetEmailSentDescription": "邮件已发送到 {email}",
        "resetFailedTitle": "重置密码失败",
        "loginSuccessTitle": "登录成功",
        "loginSuccessDescription": "欢迎回到Haruki工具箱"
      }
    },
    "register": {
      "title": "注册账号",
      "description": "创建一个新的 Haruki 工具箱账号",
      "usernameLabel": "用户名",
      "usernamePlaceholder": "请输入用户名",
      "emailLabel": "邮箱",
      "emailCodeLabel": "邮箱验证码",
      "emailCodePlaceholder": "请输入收到的验证码",
      "passwordLabel": "密码",
      "passwordPlaceholder": "请输入密码",
      "sending": "发送中...",
      "countdown": "{seconds} 秒后重试",
      "sendCode": "发送验证码",
      "submit": "注册",
      "hasAccount": "已有账号？",
      "goLogin": "去登录"
    },
    "resetPassword": {
      "title": "重置密码",
      "description": "重置您的Haruki工具箱账号的密码",
      "emailLabel": "邮箱",
      "newPasswordLabel": "新密码",
      "newPasswordPlaceholder": "请输入新密码",
      "confirmPasswordLabel": "确认密码",
      "confirmPasswordPlaceholder": "请再次输入新密码",
      "submit": "确认重置"
    },
    "verification": {
      "title": "验证邮箱",
      "description": "完成身份验证流程以激活当前邮箱地址。",
      "submit": "提交验证",
      "continue": "继续"
    },
    "validation": {
      "required": "请填写此项"
    },
    "password": {
      "show": "显示密码",
      "hide": "隐藏密码"
    },
    "error": {
      "title": "登录服务出现问题",
      "description": "登录服务返回了错误，请返回登录页重新开始；如果多次出现，请稍后再试。",
      "retry": "重新加载",
      "backToLogin": "返回登录",
      "missingIdDescription": "链接里缺少错误编号，无法查询具体原因。请返回登录页重新开始。",
      "loadFailedDescription": "无法读取错误详情，请检查网络后重试。",
      "fallbackDescription": "登录服务暂时无法完成这次操作，请返回登录页重新开始。",
      "errorIdLabel": "错误 ID",
      "statusCodeLabel": "状态码",
      "detailsLabel": "详细信息"
    }
  },
  "sidebar": {
    "toggle": "切换侧边栏",
    "title": "导航菜单",
    "description": "站点导航菜单。"
  },
  "sidebarUser": {
    "guestInitial": "未",
    "guestName": "未登录",
    "accountSettings": "账号设置",
    "identitySettings": "登录与安全",
    "gameAccountManagement": "游戏账号管理",
    "harukiBotAuthorization": "HarukiBot数据授权",
    "oauthAuthorizations": "已授权的应用",
    "logout": "退出登录",
    "register": "注册",
    "login": "登录",
    "copyToolboxId": "复制工具箱用户 ID",
    "toolboxIdCopied": "已复制工具箱用户 ID",
    "copyFailed": "复制失败"
  },
  "home": {
    "title": "欢迎使用 Haruki 工具箱",
    "description": "请选择您需要的功能",
    "aboutBanner": {
      "badge": "关于 & 赞助",
      "title": "您的帮助是我们继续下去的动力",
      "desc": "点击查看关于 Project Haruki 以及如何赞助开发者团队"
    },
    "accountAndSettings": "账号与设置",
    "register": "注册",
    "login": "登录",
    "accountSettings": "账号设置",
    "gameAccountManagement": "游戏账号管理",
    "moreLinks": "更多",
    "accountCard": {
      "title": "我的账号",
      "dataUpdatedAt": "数据上传于 {time}",
      "noUploadData": "该账号还没有上传过数据",
      "guestDescription": "登录后绑定游戏账号，即可上传数据、查看档案与个性化功能。",
      "onboarding": {
        "title": "三步开始",
        "step1": "注册并登录",
        "step2": "在「{link}」绑定并验证你的游戏账号",
        "step2Link": "游戏账号管理",
        "step3": "用 iOS 模块 / HarukiProxy {link}一次游戏数据",
        "step3Link": "上传",
        "outro": "之后就能看卡牌、活动记录、组卡等。"
      }
    },
    "externalLinks": "站外链接",
    "harukiBotDocs": "HarukiBot NEO帮助文档",
    "harukiGithub": "Haruki GitHub",
    "legalLinks": "法律与合规",
    "privacyPolicy": "隐私政策",
    "termsOfService": "服务条款",
    "currentEvent": {
      "title": "当前活动（{region}）",
      "optInHint": "加载游戏数据库后可展示当前进行中的活动。",
      "load": "加载当前活动",
      "none": "当前没有进行中的活动。",
      "error": "活动信息加载失败。",
      "ended": "已结束",
      "remainingDays": "剩余 {days} 天 {hours} 小时",
      "remainingHours": "剩余 {hours} 小时 {minutes} 分",
      "remainingMinutes": "剩余 {minutes} 分钟",
      "badge": "进行中",
      "links": {
        "rankBorder": "榜线",
        "deckRecommend": "组卡",
        "detail": "详情"
      }
    }
  },
  "gameAccountSelect": {
    "placeholder": "选择游戏账号",
    "verified": "已验证",
    "default": "默认",
    "none": "你还没有绑定任何游戏账号。",
    "manage": "管理绑定",
    "grantedBadge": "授权",
    "groups": {
      "own": "我的绑定账号",
      "granted": "他人授权的账号"
    }
  },
  "cardBox": {
    "title": "我的卡牌",
    "description": "查看账号的卡牌收集进度",
    "entryLink": "我的卡牌",
    "noAccountHint": "绑定并选择一个游戏账号后即可查看我的卡牌。",
    "refresh": "刷新",
    "loadError": "卡牌数据加载失败",
    "retry": "重试",
    "unknownCharacter": "未知角色",
    "empty": "当前筛选条件下没有卡牌。",
    "total": "共 {total} 张",
    "summary": "已收集 {owned}/{total} · {percent}%",
    "nav": {
      "label": "角色导航"
    },
    "sections": {
      "collapseAll": "全部折叠",
      "expandAll": "全部展开"
    },
    "sort": {
      "id": "ID",
      "rarity": "稀有度",
      "level": "等级",
      "masterRank": "突破"
    },
    "group": {
      "label": "分组",
      "character": "按角色",
      "attr": "按属性",
      "all": "全部卡牌"
    },
    "ownership": {
      "label": "显示",
      "all": "全部",
      "owned": "仅已拥有",
      "missing": "仅未拥有"
    },
    "stats": {
      "title": "收集统计",
      "byUnit": "按团体",
      "byAttr": "按属性",
      "byRarity": "按星级",
      "ownedOfTotal": "{owned}/{total}",
      "percent": "{percent}%"
    },
    "badge": {
      "level": "Lv.{level}"
    }
  },
  "eventRecords": {
    "title": "活动记录",
    "description": "查看账号的活动参与记录",
    "idle": "请选择一个游戏账号以查看活动记录。",
    "loading": "正在加载上传的数据与活动数据…",
    "missingUserData": "当前账号还没有上传游戏数据，请先前往上传数据页面完成上传。",
    "missingGrantedData": "该账号的所有者还没有上传游戏数据，暂时无法查看。",
    "uploadData": "前往上传数据",
    "noData": "你上传的数据里还没有活动记录。",
    "noMatches": "当前筛选条件下没有活动记录。",
    "hiddenByTime": "最近一年没有活动记录，共 {count} 场更早的记录",
    "showAll": "查看全部",
    "loadFailed": "活动记录加载失败。",
    "retry": "重试",
    "refresh": "刷新",
    "summary": {
      "bestRank": "最佳排名",
      "ranked": "有排名场次",
      "participated": "参与活动数",
      "bestPoint": "最高活动 PT",
      "averagePoint": "平均活动 PT"
    },
    "filters": {
      "time": "时间",
      "lastYear": "近一年",
      "all": "全部",
      "custom": "自定义",
      "from": "开始时间",
      "to": "结束时间",
      "type": "活动类型"
    },
    "trend": {
      "title": "活动 PT 趋势",
      "empty": "记录不足，暂时无法绘制趋势图。",
      "point": "活动 PT",
      "rank": "活动排名",
      "showAll": "查看全部",
      "zoomHint": "拖动或缩放下方选区以查看指定范围的活动"
    },
    "sort": {
      "time": "时间",
      "point": "活动 PT",
      "rank": "排名"
    },
    "table": {
      "count": "共 {count} 场",
      "title": "活动历史",
      "event": "活动",
      "type": "类型",
      "point": "活动 PT",
      "rank": "排名",
      "rankFromHonor": "缺少具体排名数据，档位由活动牌子推断"
    },
    "worldLink": {
      "chapters": "{count} 章",
      "showChapters": "展开章节",
      "hideChapters": "收起章节",
      "chapterLabel": "第 {no} 章",
      "finale": "终章"
    }
  },
  "musicProgress": {
    "title": "打歌进度",
    "description": "查看账号的打歌进度与可获取奖励",
    "rewards": {
      "title": "可获取资源",
      "hint": "统计尚未领取的歌曲成就奖励（评分达标 + 各难度连击里程碑），任意模式达成均计入。",
      "unavailable": "你上传的数据里没有歌曲成就领取记录，无法统计可领取奖励。请重新上传一次完整数据后再试。",
      "jewel": "水晶",
      "coin": "金币",
      "shard": "碎片",
      "scoreRank": "评分奖励",
      "allClaimed": "已全部领取"
    },
    "scoreRank": {
      "title": "评分奖励明细",
      "description": "评分是递进的（C → B → A → S），每首歌只有一个当前评分，达到更高评分即同时取得较低评分的奖励；任意模式（单人、多人等）达成均计入。当前评分以你上传的数据中的成就记录为准。",
      "summary": "已获得：{obtained} · 可获取：{remaining} · 已拿满 {complete} / {total} 首",
      "none": "无",
      "filter": {
        "label": "只看",
        "all": "全部",
        "remaining": "未拿满",
        "none": "未达成"
      },
      "sort": {
        "label": "排序",
        "remaining": "可获取水晶",
        "music": "歌曲顺序",
        "rank": "当前评分"
      },
      "visible": "显示 {shown} / {total} 首",
      "current": "当前评分 {rank}",
      "currentNone": "尚未达成任何评分",
      "step": "{rank} 评分：{rewards}",
      "stepReached": "{rank} 评分：{rewards}（已达成）",
      "complete": "已拿满",
      "empty": "没有符合条件的歌曲。",
      "showMore": "显示更多（还有 {count} 首）"
    },
    "refresh": "刷新",
    "retry": "重试",
    "noAccount": "请选择或绑定游戏账号以查看打歌进度。",
    "loading": "正在加载上传的数据与乐曲数据…",
    "missingUserData": "当前账号还没有上传游戏数据，请先前往上传数据页面完成上传。",
    "missingGrantedData": "该账号的所有者还没有上传游戏数据，暂时无法查看。",
    "uploadData": "前往上传数据",
    "noResults": "你上传的数据里还没有歌曲游玩记录，所有歌曲将显示为未游玩。",
    "suiteError": "打歌进度加载失败。",
    "downloading": "正在下载游戏数据库（{progress}%）...",
    "overallTitle": "全难度概览",
    "levelsTitle": "按定数统计",
    "noSongs": "所选区服在该难度下暂无歌曲。",
    "level": "Lv.{level}",
    "levelUnknown": "Lv.?",
    "songCount": "{count} 首",
    "songFilter": {
      "label": "只看",
      "all": "全部",
      "notAllPerfect": "未 AP",
      "notFullCombo": "未 FC",
      "notCleared": "未通关"
    },
    "sections": {
      "collapseAll": "全部折叠",
      "expandAll": "全部展开"
    },
    "matchCount": "{count} / {total} 首",
    "noMatches": "该定数下没有符合条件的歌曲。",
    "rewardsRemaining": "可获取：{list}",
    "detailSummary": "共 {total} 首 · 已通关 {cleared} · FC {fullCombo} · AP {allPerfect}",
    "legend": {
      "allPerfect": "All Perfect",
      "fullCombo": "Full Combo（非 AP）",
      "clear": "Clear（非 FC）",
      "unplayed": "未游玩"
    },
    "status": {
      "allPerfect": "AP",
      "fullCombo": "FC",
      "clear": "CLEAR",
      "unplayed": "—"
    }
  },
  "globalSearch": {
    "title": "快速搜索",
    "description": "在本地游戏数据库中搜索歌曲、卡牌与活动",
    "placeholder": "搜索歌曲、卡牌、活动…",
    "typeToSearch": "输入关键词以搜索歌曲、卡牌与活动",
    "error": "游戏数据库加载失败",
    "retry": "重试",
    "empty": "没有找到匹配的结果",
    "groups": {
      "music": "歌曲",
      "card": "卡牌",
      "event": "活动"
    },
    "footerRegion": "数据区服：{region}",
    "footerHint": "{shortcut} 打开或关闭搜索"
  },
  "costumes": {
    "dressup": {
      "title": "服装搭配",
      "description": "自由组合角色的服装、头饰与发型并进行 3D 预览",
      "region": "区服",
      "character": "角色",
      "characterPlaceholder": "选择角色",
      "body": "服装",
      "head": "头饰",
      "hair": "发型",
      "partPlaceholder": "选择部件",
      "searchPlaceholder": "搜索名称或 ID...",
      "empty": "没有找到匹配项。",
      "hairLockedHint": "该头饰固定发型，发型选项不生效。",
      "reset": "恢复默认",
      "rotateLeft": "向左转",
      "rotateRight": "向右转",
      "resetView": "回正",
      "zoomIn": "放大",
      "zoomOut": "缩小",
      "copyLink": "复制链接",
      "linkCopied": "链接已复制",
      "colorCount": "{count} 色",
      "linkCopyFailed": "复制失败，请手动复制地址栏。",
      "loadError": "服装数据加载失败。",
      "roleLoadError": "该角色的 3D 部件清单加载失败。",
      "retry": "重试"
    },
    "viewer": {
      "loadError": "3D 模型加载失败。",
      "retry": "重试",
      "idle": "请选择要预览的服装。"
    }
  },
  "gachas": {
    "common": {
      "region": "区服",
      "loadError": "卡池数据加载失败",
      "retry": "重试",
      "dateFallback": "待定"
    },
    "type": {
      "ceil": "井卡池",
      "normal": "普通卡池",
      "beginner": "新手卡池",
      "sunormal": "付费特典卡池",
      "subeginner": "新手特典卡池",
      "return": "回归卡池",
      "unknown": "其他"
    },
    "list": {
      "title": "卡池图鉴",
      "description": "浏览 Project Sekai 卡池及出率信息",
      "searchPlaceholder": "按名称或 ID 搜索…",
      "typeLabel": "类型",
      "allTypes": "全部类型",
      "statusLabel": "状态",
      "allStatuses": "全部状态",
      "yearLabel": "年份",
      "allYears": "全部年份",
      "cardLabel": "包含卡牌",
      "allCards": "全部卡牌",
      "cardSearchPlaceholder": "搜索卡牌名或 ID...",
      "cardEmpty": "没有找到卡牌。",
      "removeCardFilter": "移除该卡牌筛选",
      "sortLabel": "排序",
      "filtersTitle": "筛选",
      "resetFilters": "重置筛选",
      "total": "共 {total} 个卡池",
      "empty": "没有符合筛选条件的卡池"
    },
    "detail": {
      "back": "返回卡池一览",
      "notFound": "当前区服的数据里没有这个卡池（#{gachaId}）。可以切换区服再试。",
      "pickups": "PICK UP 成员",
      "poolCards": "卡池全部卡牌",
      "rates": "提供概率",
      "rarity": "稀有度",
      "cardCount": "卡牌数",
      "baseRate": "基础概率",
      "guaranteedRate": "保底概率",
      "guaranteedNote": "十连的第 10 抽保底出现 {rarity} 及以上成员。",
      "behaviors": "招募方式",
      "behaviorType": "类型",
      "spinCount": "抽数",
      "cost": "消耗",
      "executeLimit": "次数限制",
      "colorfulPass": "彩色通行证",
      "ceilItem": "兑换贴纸",
      "summary": "招募说明",
      "description": "注意事项"
    },
    "rarity": {
      "rarity_1": "★1",
      "rarity_2": "★2",
      "rarity_3": "★3",
      "rarity_4": "★4",
      "rarity_birthday": "生日"
    },
    "behaviorType": {
      "normal": "普通招募",
      "over_rarity_3_once": "★3 以上保底一次",
      "over_rarity_4_once": "★4 保底一次",
      "once_a_day": "每日一次",
      "once_a_week": "每周一次"
    },
    "costResource": {
      "jewel": "水晶",
      "paid_jewel": "付费水晶",
      "gacha_ticket": "招募券"
    }
  },
  "playerProfile": {
    "title": "我的档案",
    "description": "查看账号的游戏档案",
    "source": {
      "realtime": "实时数据",
      "snapshot": "上传的数据"
    },
    "noAccountHint": "请先绑定并选择一个游戏账号以查看档案。",
    "loadError": "档案数据加载失败。",
    "retry": "重试",
    "refresh": "刷新",
    "realtimeAsOf": "实时数据更新时间：{time}",
    "unknownCharacter": "未知角色",
    "stats": {
      "title": "游玩统计"
    },
    "snapshotNote": "来自上传的数据 · 上传时间 {time}",
    "unitAverage": "各团均值",
    "header": {
      "title": "基本信息",
      "rank": "Lv.{rank}",
      "gameId": "游戏ID",
      "copy": "复制游戏ID",
      "copied": "游戏ID已复制",
      "copyFailed": "复制失败"
    },
    "deck": {
      "title": "当前卡组",
      "empty": "暂无卡组数据"
    },
    "badge": {
      "level": "Lv.{level}"
    },
    "music": {
      "title": "歌曲通关统计"
    },
    "multiLive": {
      "title": "多人 Live",
      "mvp": "MVP 次数",
      "superStar": "SuperStar 次数"
    },
    "characters": {
      "title": "角色等级",
      "rank": "Rank {rank}",
      "empty": "暂无角色数据"
    },
    "challenge": {
      "title": "挑战Live",
      "summary": "最高分数：{name} · {score}",
      "empty": "暂无挑战Live记录"
    },
    "links": {
      "eventRecords": "活动记录",
      "characterMissions": "角色任务",
      "challengeDetail": "挑战信息"
    },
    "collection": {
      "title": "角色卡牌收集",
      "summary": "已收集 {owned}/{total} · {percent}%",
      "empty": "暂无卡牌数据"
    }
  },
  "training": {
    "layout": {
      "title": "角色养成",
      "description": "查看游戏账号的养成进度",
      "refresh": "刷新"
    },
    "tabs": {
      "challenge": "挑战信息",
      "power": "加成信息",
      "area": "区域道具",
      "bonds": "牵绊",
      "leader": "队长次数",
      "missions": "角色任务"
    },
    "challenge": {
      "title": "挑战信息",
      "description": "查看账号角色的挑战等级与最高分",
      "noAccountHint": "绑定并选择游戏账号后查看挑战信息。",
      "loadError": "挑战数据加载失败。",
      "retry": "重试",
      "refresh": "刷新",
      "unknownCharacter": "未知角色",
      "summary": "最高:{name} · {score}",
      "charactersWithData": "已挑战角色:{count} / {total}",
      "empty": "暂无挑战演出记录",
      "sortByCharacter": "按角色",
      "sortByScore": "按分数",
      "scoreLabel": "分数",
      "stageLabel": "挑战等级",
      "unclaimedLabel": "可领取奖励",
      "jewel": "水晶 ×{count}",
      "shard": "水晶碎片 ×{count}",
      "allClaimed": "奖励已全部领取"
    },
    "power": {
      "title": "加成信息",
      "description": "查看账号的各项加成信息",
      "noAccountHint": "绑定并选择游戏账号后查看加成信息。",
      "loadError": "加成数据加载失败。",
      "retry": "重试",
      "refresh": "刷新",
      "unknownCharacter": "未知角色",
      "sharedAreaTitle": "全角色区域道具",
      "allCharacterBonus": "全角色基础加成",
      "multiUnitBonus": "多团体条件加成",
      "sharedAreaHint": "全角色基础加成已计入下方角色加成。多团体加成单独列出，是否生效及与团体加成的取舍由实际编成决定。",
      "charactersTitle": "角色综合力加成",
      "unitsTitle": "组合加成",
      "attrsTitle": "属性加成",
      "rankBonus": "角色等级",
      "areaItemBonus": "区域道具",
      "fixtureBonus": "MYSEKAI 家具",
      "gateBonus": "MYSEKAI 大门",
      "gateHint": "虚拟歌手的门加成按无支援团体计算，取已拥有门中的最高等级；带支援团体的卡牌使用对应团体的门。",
      "units": {
        "light_sound": "Leo/need",
        "idol": "MORE MORE JUMP!",
        "street": "Vivid BAD SQUAD",
        "theme_park": "Wonderlands×Showtime",
        "school_refusal": "25时,在Nightcord。",
        "piapro": "VIRTUAL SINGER"
      },
      "attrs": {
        "cute": "可爱",
        "cool": "帅气",
        "pure": "纯洁",
        "happy": "快乐",
        "mysterious": "神秘"
      }
    },
    "bonds": {
      "title": "牵绊",
      "description": "查看账号的角色牵绊信息",
      "noAccountHint": "绑定并选择游戏账号后查看牵绊信息。",
      "loadError": "牵绊数据加载失败。",
      "retry": "重试",
      "refresh": "刷新",
      "unknownCharacter": "未知角色",
      "filterLabel": "角色",
      "filterAll": "全部角色",
      "count": "共 {count} 对",
      "level": "牵绊 Lv.{level}",
      "charaRank": "Rank {rank}",
      "needExp": "距下一级还需 {exp} 经验",
      "maxLevel": "已满级",
      "notOwned": "尚未解锁",
      "empty": "暂无牵绊数据",
      "showRewards": "查看各等级奖励",
      "rewardsTitle": "各等级奖励(已达成的置灰)",
      "rewards": {
        "jewel": "水晶 ×{count}",
        "material": "{name} ×{count}",
        "materialFallback": "材料 ×{count}",
        "bondsHonor": "牵绊牌匾 Lv.{level}",
        "bondsHonorWord": "牌匾文字",
        "stamp": "表情贴纸",
        "boostItem": "体力道具 ×{count}",
        "cutInVoice": "牵绊语音",
        "other": "其他奖励"
      }
    },
    "area": {
      "title": "区域道具",
      "description": "查看账号区域道具的等级进度以及升级所需材料",
      "refresh": "刷新",
      "retry": "重试",
      "loadError": "区域道具数据加载失败",
      "noAccountHint": "绑定并选择游戏账号后即可查看区域道具",
      "empty": "当前筛选条件下没有区域道具",
      "filters": {
        "unit": "团体",
        "attr": "属性",
        "character": "角色",
        "tree": "树",
        "flower": "花",
        "allCharacters": "全角色",
        "special": "其他",
        "all": "全部"
      },
      "level": "Lv.{level}",
      "bonus": "+{bonus}%",
      "multiUnitTarget": "多团体编成",
      "multiUnitBonus": "多团体条件加成 +{bonus}%",
      "maxed": "已达当前可升级的最高等级",
      "notInShop": "商店暂未开放",
      "canUpgrade": "可升级",
      "nextLevel": "下一级",
      "nextBonus": "下级加成",
      "showAll": "全部等级"
    },
    "leader": {
      "title": "队长次数",
      "description": "查看账号角色的队长次数累计进度",
      "refresh": "刷新",
      "retry": "重试",
      "loadError": "队长统计数据加载失败",
      "noAccountHint": "绑定并选择游戏账号后即可查看队长统计",
      "limit": "任务上限 {count}",
      "sortByTotal": "按次数",
      "sortByCharacter": "按角色",
      "normalLabel": "通常",
      "exLevel": "EX Lv.{level}",
      "unknownCharacter": "未知角色"
    },
    "missions": {
      "title": "角色任务",
      "description": "查看账号角色任务进度与角色等级预估",
      "refresh": "刷新",
      "retry": "重试",
      "loadError": "角色任务数据加载失败",
      "noAccountHint": "绑定并选择游戏账号后即可查看角色任务",
      "empty": "暂无角色任务数据",
      "character": "角色",
      "unknownCharacter": "角色{id}",
      "rank": "Lv.{rank}",
      "currentExp": "当前经验",
      "pendingExp": "待领取经验",
      "projected": "领取后预计",
      "projectedValue": "Lv.{level}（经验 {exp}）",
      "basicGroup": "基础任务",
      "achievementGroup": "成就任务",
      "exRound": "EX 第 {round} 轮",
      "types": {
        "play_live": "队长次数",
        "play_live_ex": "队长次数(EX)",
        "waiting_room": "休息室次数",
        "waiting_room_ex": "休息室次数(EX)",
        "collect_costume_3d": "服装",
        "collect_stamp": "表情",
        "read_area_talk": "区域对话",
        "read_card_episode_first": "卡面剧情前篇",
        "read_card_episode_second": "卡面剧情后篇",
        "collect_another_vocal": "Another Vocal",
        "area_item_level_up_all_character": "提升全角色区域道具等级",
        "area_item_level_up_character": "单人家具升级次数",
        "area_item_level_up_unit": "团家具升级次数",
        "area_item_level_up_reality_world": "属性道具（树&花）升级次数",
        "collect_member": "卡面",
        "skill_level_up_rare": "技能等级升级次数（★4&生日卡）",
        "skill_level_up_standard": "技能等级升级次数（★1~★3）",
        "master_rank_up_rare": "专精等级升级次数（★4&生日卡）",
        "master_rank_up_standard": "专精等级升级次数（★1~★3）",
        "collect_character_archive_voice": "台词",
        "collect_mysekai_fixture": "MySekai家具数量",
        "collect_mysekai_canvas": "MySekai画布数量",
        "read_mysekai_fixture_unique_character_talk": "MySekai对话"
      }
    }
  },
  "searchAlias": {
    "badge": "别名"
  },
  "sekaiRegion": {
    "followAccount": "跟随当前账号",
    "followAccountResolved": "跟随当前账号（{region}）",
    "followBadge": "跟随账号",
    "labels": {
      "jp": "日服",
      "en": "国际服",
      "tw": "台服",
      "kr": "韩服",
      "cn": "国服"
    }
  },
  "sekaiUnreleased": {
    "badge": "未上线"
  },
  "navigation": {
    "groups": {
      "recommendAndAbout": "推荐与关于",
      "friendshipRecommendation": "友情推荐",
      "eventRankingTools": "活动冲榜工具",
      "projectSekai": "Project SEKAI工具",
      "accountManagement": "账号与管理",
      "harukiBot": "HarukiBot相关",
      "sekaiCatalog": "Sekai 图鉴",
      "sekaiPlayer": "我的游戏数据"
    },
    "items": {
      "friendGroups": "推荐群聊",
      "friendLinks": "友情链接",
      "sponsors": "赞助者名单",
      "deckRecommend": "组卡推荐",
      "eventPlanner": "活动规划",
      "rankBorder": "榜线查询",
      "about": "关于",
      "ptCalculator": "控分计算",
      "uploadData": "数据上传",
      "sekaiStation": "协力车站",
      "botNeoRegistration": "HarukiBot NEO 注册",
      "musicLibrary": "歌曲一览",
      "cards": "卡牌一览",
      "events": "活动图鉴",
      "cardBox": "我的卡牌",
      "eventRecords": "活动记录",
      "musicProgress": "打歌进度",
      "gachas": "卡池图鉴",
      "costumes": "服装搭配",
      "playerProfile": "我的档案",
      "training": "角色养成"
    },
    "notFound": {
      "title": "页面不存在",
      "description": "你访问的地址不存在或已被移动，请检查链接是否正确。",
      "backHome": "返回首页",
      "backPrevious": "返回上一页"
    }
  },
  "webLayout": {
    "nav": {
      "home": "首页",
      "harukiBotGroup": "HarukiBot相关",
      "admin": "管理后台",
      "myTickets": "我的工单",
      "pendingTicketReplies": "{total} 个工单等待你回复",
      "settings": "设置"
    },
    "footer": {
      "copyright": "Seiunx Network & Haruki Dev Team. 保留所有权利。",
      "privacyPolicy": "隐私政策",
      "termsOfService": "服务条款",
      "legalLinks": "法律条款",
      "unofficialNotice": "Haruki 工具箱与 SEGA / Colorful Palette 不存在隶属、授权、背书或官方合作关系。",
      "assetCopyright": "相关游戏资产版权归 SEGA / Colorful Palette 所有。",
      "appVersion": "应用版本",
      "version": "版本",
      "gitCommit": "Git 提交",
      "buildTime": "构建时间"
    }
  },
  "route": {
    "home": "主页",
    "notFound": "页面不存在",
    "settings": "设置",
    "privacy": "隐私政策",
    "tos": "服务条款",
    "about": "关于",
    "friendGroups": "推荐群聊",
    "friendLinks": "友情链接",
    "sponsors": "赞助者名单",
    "deckRecommend": "组卡推荐",
    "rankBorder": "榜线查询",
    "rankBorderDetail": "榜线详情",
    "ptCalculator": "活动Pt计算器",
    "clientConfigGenerator": "Client 配置生成器",
    "uploadData": "上传数据",
    "sekaiStation": "协力车站",
    "botNeoRegistration": "HarukiBot NEO 注册",
    "login": "登录",
    "register": "注册账号",
    "verification": "验证邮箱",
    "resetPassword": "重置密码",
    "error": "身份错误",
    "userSettings": "账号设置",
    "userIdentitySettings": "登录与安全",
    "userIdentityProfileSettings": "用户资料设置",
    "userIdentityPasswordSettings": "修改密码",
    "userIdentityMfaSettings": "多因素认证",
    "userIdentitySocialSettings": "社交登录设置",
    "userIdentitySessionSettings": "登录设备",
    "gameAccountBindings": "绑定游戏账号",
    "harukiBotAuthorization": "HarukiBot数据授权",
    "oauthAuthorizations": "已授权的应用",
    "oauthLogin": "继续登录授权",
    "oauthConsent": "授权第三方应用",
    "oauthLogout": "退出登录确认",
    "oauthDevice": "设备授权",
    "tickets": {
      "mine": "我的工单",
      "create": "创建工单",
      "detail": "工单详情"
    },
    "musicLibrary": {
      "list": "曲库",
      "detail": "歌曲详情",
      "progress": "打歌进度"
    },
    "cards": {
      "list": "卡牌一览",
      "detail": "卡牌详情",
      "box": "我的卡牌"
    },
    "events": {
      "list": "活动图鉴",
      "detail": "活动详情",
      "records": "活动记录"
    },
    "gachas": {
      "list": "卡池图鉴",
      "detail": "卡池详情"
    },
    "costumes": {
      "dressup": "服装搭配"
    },
    "playerProfile": {
      "me": "我的档案"
    },
    "training": {
      "challenge": "挑战信息",
      "power": "加成信息",
      "area": "区域道具",
      "bonds": "牵绊",
      "leader": "队长次数",
      "missions": "角色任务"
    },
    "eventPlanner": {
      "planner": "活动规划"
    },
    "admin": {
      "layout": "管理后台",
      "dashboard": "仪表盘",
      "users": "用户管理",
      "userDetail": "用户详情",
      "oauthClients": "OAuth客户端管理",
      "webhooks": "Webhook 管理",
      "logs": "系统日志",
      "uploadLogs": "上传日志",
      "content": "内容运营",
      "sponsors": "赞助者管理",
      "config": "系统配置",
      "gameBindings": "游戏绑定管理",
      "risk": "风控管理",
      "botSecurity": "Bot 安全告警",
      "tickets": "工单管理"
    }
  },
  "musicLibrary": {
    "eventBox": {
      "short": "{name} {count}箱",
      "title": "{name}的第{count}箱活动曲"
    },
    "list": {
      "title": "曲库",
      "description": "浏览 PJSK 曲库：支持搜索，并按难度、等级、物量、团体与年份筛选。",
      "filters": {
        "region": "区服",
        "search": "搜索",
        "searchPlaceholder": "按标题或别名搜索...",
        "searchPlaceholderNoAlias": "按标题搜索...",
        "title": "筛选",
        "difficulty": "难度",
        "difficultyAll": "全部难度",
        "level": "等级范围",
        "levelMin": "最低",
        "levelMax": "最高",
        "noteCount": "物量",
        "noteCountMode": {
          "exact": "精确",
          "range": "范围"
        },
        "noteCountExactPlaceholder": "如 886",
        "noteCountMin": "最少",
        "noteCountMax": "最多",
        "tag": "标签",
        "character": "角色",
        "characterAll": "全部角色",
        "characterScope": {
          "any": "全部相关",
          "box": "箱曲",
          "vocal": "Vocal",
          "anotherVocal": "Another Vocal"
        },
        "year": "年份",
        "yearAll": "全部年份",
        "sort": "排序方式",
        "sortDirection": {
          "asc": "升序",
          "desc": "降序"
        },
        "reset": "重置筛选"
      },
      "sort": {
        "publishedAt": "发布时间",
        "level": "难度等级",
        "noteCount": "物量",
        "title": "标题"
      },
      "results": {
        "count": "共 {count} 首",
        "empty": "没有符合当前筛选条件的歌曲。",
        "aliasSearching": "正在匹配别名..."
      },
      "downloading": "正在下载游戏数据库... {progress}%",
      "loadError": "曲库数据加载失败：{message}",
      "unknownDate": "未知"
    },
    "difficulty": {
      "easy": "EASY",
      "normal": "NORMAL",
      "hard": "HARD",
      "expert": "EXPERT",
      "master": "MASTER",
      "append": "APPEND"
    },
    "tags": {
      "vocaloid": "虚拟歌手",
      "light_music_club": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands x Showtime",
      "school_refusal": "25时，Nightcord见。",
      "other": "其他",
      "event_box": "箱曲",
      "world_link": "WL（World Link）曲"
    },
    "categories": {
      "mv": "3D MV",
      "mv_2d": "2D MV",
      "image": "静态画面",
      "original": "原版 MV"
    },
    "vocalTypes": {
      "original_song": "原曲",
      "sekai": "SEKAI 版",
      "virtual_singer": "虚拟歌手版",
      "another_vocal": "Another Vocal",
      "instrumental": "伴奏",
      "april_fool_2022": "2022 愚人节版"
    },
    "detail": {
      "back": "返回曲库",
      "notFound": "当前区服的数据里没有这首歌曲（#{musicId}）。可以切换区服再试。",
      "loadError": "曲目数据加载失败：{message}",
      "unknownCharacter": "未知",
      "aliases": {
        "title": "歌曲别名",
        "showMore": "还有 {count} 个",
        "showLess": "收起"
      },
      "info": {
        "composer": "作曲",
        "lyricist": "作词",
        "arranger": "编曲",
        "publishedAt": "发布时间",
        "duration": "时长",
        "bpm": "BPM",
        "id": "ID"
      },
      "difficultiesTitle": "难度信息",
      "table": {
        "difficulty": "难度",
        "level": "等级",
        "noteCount": "物量"
      },
      "vocalsTitle": "Vocal 版本",
      "vocalsEmpty": "暂无 Vocal 版本。",
      "play": "播放",
      "pause": "暂停",
      "chartPreview": {
        "title": "谱面预览",
        "modeDynamic": "动态",
        "modeStatic": "静态",
        "loadError": "谱面加载失败。",
        "retry": "重试",
        "seek": "播放进度",
        "speed": "流速",
        "zoomFit": "适应高度",
        "zoom": "缩放比例",
        "silent": "未找到音频资源，将静默播放。"
      },
      "eventsTitle": "关联活动"
    }
  },
  "cards": {
    "common": {
      "region": "区服",
      "loadError": "卡牌数据加载失败",
      "retry": "重试"
    },
    "list": {
      "title": "卡牌一览",
      "description": "按角色、团体、属性、稀有度、供给类型浏览卡牌",
      "searchPlaceholder": "搜索卡牌称号…",
      "sortLabel": "排序",
      "total": "共 {total} 张卡牌",
      "empty": "没有符合当前筛选条件的卡牌"
    },
    "filter": {
      "title": "筛选",
      "characters": "角色",
      "units": "团体",
      "attrs": "属性",
      "rarity": "稀有度",
      "supply": "供给类型",
      "year": "年份",
      "yearAll": "全部年份",
      "clear": "清除筛选"
    },
    "sort": {
      "releaseDesc": "最新优先",
      "rarityDesc": "稀有度",
      "idAsc": "卡牌 ID"
    },
    "unit": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "25时，Nightcord见。",
      "piapro": "VIRTUAL SINGER"
    },
    "attr": {
      "cute": "可爱",
      "cool": "帅气",
      "pure": "纯洁",
      "happy": "快乐",
      "mysterious": "神秘"
    },
    "rarity": {
      "rarity_1": "1★",
      "rarity_2": "2★",
      "rarity_3": "3★",
      "rarity_4": "4★",
      "rarity_birthday": "生日"
    },
    "supply": {
      "normal": "普通常驻",
      "birthday": "生日限定",
      "term_limited": "期间限定",
      "colorful_festival_limited": "Colorful Fes 限定",
      "bloom_festival_limited": "Bloom Fes 限定",
      "unit_event_limited": "WL（World Link）活动限定",
      "collaboration_limited": "联动限定"
    },
    "detail": {
      "back": "返回图鉴",
      "notFound": "当前区服的数据里没有这张卡牌（#{cardId}）。可以切换区服再试。",
      "artNormal": "特训前",
      "artTrained": "特训后",
      "artLoadFailed": "卡面加载失败",
      "info": "卡牌信息",
      "character": "角色",
      "unit": "团体",
      "supportUnit": "支援团体",
      "attr": "属性",
      "rarity": "稀有度",
      "supply": "供给类型",
      "releaseAt": "上线时间",
      "gachaPhrase": "招募语音",
      "skill": "技能",
      "skillLevel": "等级",
      "skillValue": "数值",
      "skillDuration": "持续时间",
      "skillBeforeTraining": "特训前",
      "skillAfterTraining": "特训后",
      "noSkill": "暂无技能数据",
      "relatedEvents": "关联活动",
      "relatedEventsEmpty": "没有关联活动。",
      "relatedGachas": "关联卡池",
      "relatedGachasEmpty": "没有关联卡池。",
      "costumes": "卡牌服装",
      "costumeDressup": "服装搭配",
      "costumePreviewHint": "点击服装缩略图查看 3D 预览。",
      "costumeSlot": {
        "body": "服装",
        "hair": "发型",
        "head": "头饰"
      },
      "sameCharacter": "该角色的其他卡牌"
    }
  },
  "events": {
    "common": {
      "dateFallback": "—",
      "idLabel": "ID {id}"
    },
    "type": {
      "marathon": "马拉松",
      "cheerful_carnival": "欢乐嘉年华",
      "world_bloom": "连接世界",
      "unknown": "未知类型"
    },
    "attr": {
      "cute": "可爱",
      "cool": "帅气",
      "pure": "纯洁",
      "happy": "快乐",
      "mysterious": "神秘"
    },
    "list": {
      "title": "活动图鉴",
      "description": "浏览 Project SEKAI 活动、加成信息与活动卡片。",
      "regionLabel": "区服",
      "searchLabel": "搜索",
      "searchPlaceholder": "按活动名或 ID 搜索",
      "typeLabel": "活动类型",
      "attrLabel": "加成属性",
      "yearLabel": "年份",
      "allTypes": "全部类型",
      "allAttrs": "全部属性",
      "allYears": "全部年份",
      "filtersTitle": "筛选",
      "resultsCount": "共 {count} 个活动",
      "resetFilters": "重置筛选",
      "loadFailed": "活动数据加载失败。",
      "retry": "重试",
      "empty": "没有符合当前筛选条件的活动。"
    },
    "detail": {
      "back": "返回活动图鉴",
      "loadFailed": "活动数据加载失败。",
      "retry": "重试",
      "notFound": "当前区服的数据里没有这个活动（#{eventId}）。可以切换区服再试。",
      "timelineTitle": "时间线",
      "timeline": {
        "start": "开始",
        "aggregate": "结算",
        "closed": "关闭"
      },
      "countdownToStart": "距开始",
      "countdownToAggregate": "距结算",
      "countdownValue": "{days}天 {hours}小时 {minutes}分 {seconds}秒",
      "bonusTitle": "活动加成",
      "bonusEmpty": "该活动暂无加成数据。",
      "bonusAttrOnly": "所有{attr}卡片",
      "chaptersTitle": "World Link 章节",
      "chapterLabel": "第 {no} 章",
      "chapterFinale": "终章",
      "cardsTitle": "活动卡片",
      "cardsEmpty": "该活动暂无卡片。",
      "links": {
        "rankBorder": "查看榜线",
        "deckRecommend": "活动组卡"
      }
    }
  },
  "homeSettings": {
    "title": "Haruki工具箱设置",
    "description": "配置Haruki工具箱服务器线路、图片加载线路、外观、语言和性能偏好",
    "trigger": "设置",
    "tabs": {
      "preferences": "偏好设置",
      "app": "应用",
      "sekaiData": "游戏数据库",
      "userData": "用户数据"
    },
    "resetDialog": {
      "title": "重置偏好设置？",
      "description": "这会将服务器线路、图片加载线路、外观、语言、低特效模式和隐私偏好恢复为默认值。",
      "confirm": "确认重置"
    },
    "endpoint": {
      "label": "服务器线路",
      "help": "选择服务器连接方式，默认使用直连。若在海外连接困难，可尝试 CDN。",
      "placeholder": "请选择线路",
      "direct": "直连",
      "cdn": "CDN",
      "unavailable": "当前环境没有配置可用的服务器线路。",
      "checking": "测速中",
      "unknown": "未测速",
      "failed": "无法连接",
      "latencyMs": "{ms} ms",
      "refreshLatency": "重新测速"
    },
    "assetEndpoint": {
      "label": "图片加载线路",
      "help": "用于加载卡牌缩略图等游戏资源。首次进入网站会自动选择延迟最低的线路，打开设置时会重新测速。",
      "placeholder": "请选择线路",
      "china": "国内用户推荐",
      "global": "海外用户推荐",
      "chinaCdn": "国内备用线路",
      "checking": "测速中",
      "unknown": "未测速",
      "failed": "无法连接",
      "latencyMs": "{ms} ms"
    },
    "theme": {
      "label": "外观主题",
      "help": "选择您偏好的界面主题",
      "placeholder": "请选择主题",
      "light": "浅色",
      "dark": "深色",
      "system": "跟随系统"
    },
    "locale": {
      "label": "界面语言",
      "help": "语言切换后会立即生效",
      "placeholder": "请选择语言",
      "zhCN": "简体中文",
      "enUS": "English",
      "zhTW": "繁體中文"
    },
    "visualEffects": {
      "label": "低特效模式",
      "help": "开启后会关闭毛玻璃、强阴影等较耗性能的视觉效果，适合移动设备或低功耗场景。"
    },
    "privacy": {
      "hideGameUserIdLabel": "隐藏游戏 UID",
      "hideGameUserIdHelp": "开启后，组卡、上传数据等账号选择器会保留 UID 前 2 位和后 4 位，中间用星号隐藏。"
    },
    "unreleased": {
      "showLabel": "展示未上线内容",
      "showHelp": "开启后，卡牌、活动、曲库、卡池等图鉴会显示当前区服尚未上线的内容。",
      "blurLabel": "未上线内容防剧透模糊",
      "blurHelp": "展示未上线内容时，对其卡面、封面等图片做模糊处理，避免剧透。"
    },
    "appUpdate": {
      "title": "应用更新",
      "description": "检查 Haruki 工具箱的版本更新。",
      "current": "已是最新",
      "available": "有新版本",
      "remoteVersion": "远程版本",
      "remoteCommit": "远程 Git 提交",
      "remoteBuildTime": "远程构建时间",
      "checkedAt": "最近检查：{time}",
      "lastError": "最近一次检查失败，请稍后重试。",
      "notCheckedYet": "尚未检查更新。",
      "check": "检查更新",
      "checking": "检查中...",
      "update": "更新应用",
      "updating": "更新中..."
    },
    "userData": {
      "description": "这里保存的是你各游戏账号已上传数据在本浏览器的副本。点「刷新」会检查服务器上是否有更新的上传；「个人档案」会直接从游戏服务器获取最新信息。",
      "account": "账号",
      "accountPlaceholder": "请选择已绑定账号",
      "noAccount": "当前账号还没有绑定游戏账号。",
      "dataType": "数据类型",
      "types": {
        "suite": "账号数据（Suite）",
        "mysekai": "烤森数据（MySekai）",
        "profile": "个人档案（Profile）"
      },
      "cacheUpdatedAt": "本地缓存",
      "remoteUploadTime": "上传时间",
      "lastCheck": "最近检查",
      "never": "无缓存",
      "cacheHit": "已是最新",
      "cacheUpdated": "已更新",
      "notChecked": "未检查",
      "refresh": "刷新用户数据",
      "refreshing": "刷新中...",
      "clear": "清理用户数据缓存",
      "clearDialog": {
        "title": "清理用户数据缓存？",
        "description": "这会清理当前工具箱账号在本浏览器保存的用户数据缓存，之后需要重新检查或下载。",
        "confirm": "确认清理"
      },
      "logoutCleanupHint": "退出登录时会自动清理当前工具箱账号在本浏览器保存的用户数据缓存。",
      "toast": {
        "alreadyCurrent": "用户数据已是最新",
        "refreshed": "用户数据已刷新",
        "refreshFailed": "用户数据刷新失败",
        "cleared": "用户数据缓存已清理",
        "clearFailed": "用户数据缓存清理失败"
      }
    },
    "toast": {
      "reset": "设置已重置为默认值"
    },
    "sections": {
      "preferences": "外观、语言、网络与隐私偏好，修改后立即生效。",
      "sekaiData": "管理各区服游戏数据库本地缓存与后台更新任务，供选择器、推荐和其他功能复用。"
    },
    "groups": {
      "appearance": "外观",
      "network": "网络",
      "privacy": "隐私与内容"
    }
  },
  "core": {
    "auth": {
      "sessionExpiredTitle": "会话已过期",
      "sessionExpiredDescription": "请重新登录",
      "accountBannedTitle": "账号已被封禁",
      "permissionDeniedTitle": "权限不足",
      "loginRequiredTitle": "请先登录",
      "loginRequiredDescription": "该页面需要登录后访问",
      "requireAdminDescription": "需要管理员权限",
      "requireSuperAdminDescription": "需要超级管理员权限",
      "apiRequestFailedTitle": "请求失败",
      "apiRequestFailedDescription": "服务器暂时无法处理这个请求，请稍后重试。",
      "permissionDeniedDescription": "你没有执行这个操作的权限。如果你认为这是误判，请联系管理员。",
      "accountBannedDescription": "你的账号已被封禁，无法继续使用。如有疑问请联系管理员。",
      "accountBannedWithReason": "你的账号已被封禁，无法继续使用。封禁原因：{reason}",
      "reauthRequired": "需要重新验证密码"
    },
    "errors": {
      "network": "网络连接失败，请检查网络后重试。",
      "timeout": "请求超时，请稍后重试。",
      "rateLimited": "操作太频繁，请稍等片刻后再试。",
      "serverUnavailable": "服务器暂时不可用，请稍后重试（错误码 {status}）。",
      "detail": "详情：{detail}"
    },
    "loadError": {
      "title": "加载失败",
      "description": "请检查网络后重试；如果多次失败，可能是服务暂时不可用。",
      "retry": "重试"
    },
    "sync": {
      "successTitle": "同步设置成功",
      "successDescription": "已成功同步当前账号的云端设置",
      "failedTitle": "同步设置不可用",
      "failedDescription": "云端设置同步失败，请稍后重试。",
      "missingUpdatedDataDescription": "云端设置返回的数据不完整，请刷新后重试。",
      "unexpectedStatusDescription": "云端设置请求返回了异常状态（{status}）。"
    },
    "suitePrefetch": {
      "progressTitle": "正在获取游戏数据",
      "progressDescription": "已完成 {completed}/{total} 个绑定账号",
      "successTitle": "游戏数据已更新",
      "successDescription": "已更新 {updated}/{total} 个绑定账号的游戏数据",
      "partialTitle": "部分账号的游戏数据获取失败",
      "partialDescription": "{failed}/{total} 个账号获取失败，进入相关页面时会自动重试。",
      "failedDescription": "获取绑定账号的游戏数据失败，进入相关页面时会自动重试。"
    },
    "unsupportedBrowser": {
      "title": "不受支持的浏览器",
      "description": "您正在尝试使用不受支持的浏览器访问Haruki工具箱",
      "suggestion": "请改用Chrome、Safari、Firefox等浏览器再使用Haruki工具箱",
      "deviceHint": "要授权设备，请复制下面的页面地址，在系统浏览器中打开后再手动输入设备上显示的代码。",
      "copyDeviceLink": "复制页面地址",
      "copied": "已复制",
      "copyFailed": "复制失败，请手动输入地址"
    },
    "pwa": {
      "updateAvailableTitle": "发现新版本",
      "updateAvailableDescription": "新的应用版本已经准备好，可以立即更新。",
      "updateAvailableDescriptionWithVersion": "新版本 {version} 已经准备好，可以立即更新。",
      "updateAction": "更新应用",
      "laterAction": "稍后",
      "applyingTitle": "正在更新应用",
      "applyingDescription": "更新完成后页面会自动刷新。",
      "currentTitle": "应用已是最新",
      "currentDescription": "当前应用版本已是最新。",
      "checkFailedTitle": "检查更新失败",
      "checkFailedDescription": "无法读取远程构建信息，请稍后重试。",
      "offlineReadyTitle": "离线缓存已准备好",
      "offlineReadyDescription": "已缓存常用页面，下次打开更快。",
      "devTitle": "开发模式",
      "devDescription": "开发模式下不会注册 PWA 更新流程。",
      "forcedUpdateTitle": "当前版本已停止支持",
      "forcedUpdateDescription": "正在更新到 {version}……",
      "forcedUpdateWithInputDescription": "页面将在一分钟后刷新并更新到 {version}，请先复制需要保留的输入内容。",
      "chunkErrorTitle": "部分页面内容加载失败",
      "chunkErrorDescription": "可能已发布新版本，请刷新页面后继续。",
      "reloadAction": "刷新页面"
    }
  },
  "catalog": {
    "region": {
      "label": "区服"
    },
    "search": {
      "label": "搜索",
      "clear": "清除搜索"
    },
    "filters": {
      "title": "筛选",
      "reset": "重置筛选",
      "clearAll": "清除全部",
      "done": "完成",
      "sheetDescription": "调整筛选条件，结果会立即更新。",
    },
    "results": {
      "count": "共 {count} 项",
      "empty": "没有符合当前筛选条件的内容",
      "emptyHint": "试试放宽筛选条件，或切换区服。",
      "loadError": "数据加载失败",
      "retry": "重试",
      "downloading": "正在下载游戏数据… {progress}%",
      "offline": "离线数据",
      "offlineHint": "当前显示的是本地缓存的游戏数据，最新内容可能尚未同步"
    },
    "sort": {
      "label": "排序",
      "asc": "升序",
      "desc": "降序"
    },
    "view": {
      "label": "视图",
      "grid": "网格",
      "list": "列表"
    },
    "pagination": {
      "label": "分页",
      "first": "第一页",
      "prev": "上一页",
      "next": "下一页",
      "last": "最后一页",
      "page": "第 {page} 页",
      "pageOf": "{page} / {total}",
      "pageSize": "每页数量",
      "perPage": "每页 {size}",
      "jump": "跳转到页码",
      "summary": "共 {total} 项 · 第 {page} / {pages} 页"
    },
    "status": {
      "upcoming": "即将开始",
      "ongoing": "进行中",
      "ended": "已结束",
      "upcomingHidden": "即将开始的内容已被隐藏。开启「显示未上线内容」后即可查看。",
      "showUnreleased": "显示未上线内容",
      "endsIn": "剩余 {time}",
      "startsIn": "{time} 后开始",
      "permanent": "常驻"
    },
    "countdown": {
      "toStart": "距开始",
      "toEnd": "距结束",
      "toAggregate": "距结算",
      "reached": "已到达",
      "days": "{days}天",
      "hours": "{hours}小时",
      "minutes": "{minutes}分",
      "seconds": "{seconds}秒"
    },
    "detail": {
      "backToList": "返回{list}",
      "breadcrumb": "页面路径",
      "notFound": "当前区服的数据里没有这个条目。可以切换区服再试。",
      "loadError": "详情数据加载失败",
      "assetName": "内部名称",
      "period": "期间",
      "viewAllCount": "查看全部 ({count})",
      "zoom": "点击放大查看",
      "showMore": "展开",
      "showLess": "收起",
      "tryOtherRegion": "可能存在于其他区服，切换后会自动重新加载。"
    },
    "lightbox": {
      "description": "图片预览",
      "zoomIn": "放大",
      "zoomOut": "缩小",
      "openInNewTab": "新标签页打开",
      "items": "图片",
      "touchZoom": "双击放大 / 缩小",
      "touchSwipe": "左右滑动切换图片"
    },
    "time": {
      "localLabel": "当地时间",
      "serverTime": "{region}时间：{time}",
      "hint": "时间按你所在的时区（{zone}）显示；与{region}时间（{serverZone}）不同时，会在旁边标出{region}时间。",
      "sameZone": "你所在的时区（{zone}）与{region}时间一致。"
    },
    "character": {
      "label": "角色",
      "toggleUnit": "切换 {unit} 全员"
    },
    "unit": {
      "label": "团体"
    },
    "attr": {
      "label": "属性"
    },
    "rarity": {
      "label": "稀有度"
    },
    "year": {
      "label": "年份",
      "all": "全部年份"
    },
    "type": {
      "label": "类型"
    },
    "statusFilter": {
      "label": "状态"
    }
  }
} as const
