// AUTO-GENERATED split of the former monolithic zh-CN locale file.
// Namespaces: navigationPages, sponsor, legal
export default {
  "navigationPages": {
    "friendGroups": {
      "title": "推荐群聊",
      "loading": "载入中...",
      "empty": "暂无推荐群聊",
      "count": "{count} 个群",
      "copyNumber": "复制群号 {number}",
      "copied": "已复制群号 {number}",
      "copyFailed": "复制失败，请手动复制群号",
      "toast": {
        "loadFailedTitle": "加载推荐群聊失败"
      }
    },
    "friendLinks": {
      "title": "友情链接",
      "loading": "载入中...",
      "empty": "暂无友情链接",
      "toast": {
        "loadFailedTitle": "加载友情链接失败"
      }
    },
    "about": {
      "title": "关于 Project Haruki",
      "subtitle": "服务于世界计划玩家的社区计划",
      "projectIntro": {
        "p1Before": "Project Haruki 是",
        "p1Name": "星云网络 (Seiunx Network)",
        "p1After": "旗下的社区计划，由专属的 Haruki Dev Team 负责开发与维护，旨在为《世界计划 缤纷舞台！ feat. 初音未来》的玩家提供更优质的游戏服务与社区支持。",
        "p2": "我们的核心项目包括 HarukiBot NEO 和 Haruki 工具箱。其中，HarukiBot NEO 专注于为中文玩家提供便捷、智能的各种游戏辅助与实用功能。",
        "p3": "此外，我们也自主开发并维护了一系列高性能的开源底层程序与微服务，为整个 Haruki 生态系统注入强大且稳定的性能支撑，让每位玩家都能享受流畅、舒适的使用体验。"
      },
      "structure": {
        "title": "组织结构",
        "haruki": "负责 Project Haruki：HarukiBot NEO、Haruki 工具箱，以及它们背后的服务",
        "seiunx": "负责 Haruki 计划之外的其他开源项目",
        "projectCount": "{count} 个开源项目"
      },
      "contributors": {
        "title": "贡献者",
        "subtitle": "Project Haruki 的开发与维护离不开这些人的支持",
        "count": "{count} 人",
        "filterLabel": "按身份筛选",
        "all": "全部",
        "identities": {
          "founder": {
            "label": "创始人",
            "desc": "Project Haruki 的发起人"
          },
          "core": {
            "label": "核心开发",
            "desc": "HarukiBot NEO 的主要开发与维护者"
          },
          "docs": {
            "label": "文档维护",
            "desc": "HarukiBot NEO 的使用文档维护者"
          },
          "collab": {
            "label": "外部协力",
            "desc": "并不归属 Haruki Dev Team，但为 Project Haruki 提供了不少帮助的人"
          },
          "sponsor": {
            "label": "金牌赞助",
            "desc": "提供了 HarukiBot NEO 使用的服务器以及 Haruki Sekai Asset 站服务器的人"
          }
        },
        "members": {
          "seiun": {
            "name": "星雲希凪",
            "quote": "「有限的生命里追求无限的可能」"
          },
          "lingqian": {
            "name": "灵潜"
          },
          "deseer": {
            "name": "Deseer",
            "quote": "「空に昇つて、光つて、消えて」"
          },
          "storyxy": {
            "name": "storyxy3",
            "quote": "「Beyond Light」"
          },
          "aposetles": {
            "name": "Aposetles",
            "quote": "文档问题反馈喜欢您来"
          },
          "tianshinling": {
            "name": "天音铃"
          },
          "yangzi": {
            "name": "岩崎阳子"
          },
          "watagashi": {
            "name": "綿菓子ウニ"
          },
          "middlered": {
            "name": "MiddleRed"
          },
          "dnaroma": {
            "name": "DNARoma",
            "quote": "\"0.1 + 0.2 = 0.300000004\""
          },
          "yamamoto": {
            "name": "山本"
          }
        }
      },
      "projects": {
        "title": "开源项目",
        "subtitle": "我们编写并维护了一系列开源高性能工具、微服务与应用栈",
        "groups": {
          "haruki": {
            "title": "Haruki Dev Team",
            "desc": "Haruki 计划专属的项目与服务"
          },
          "seiunx": {
            "title": "Seiunx Dev Team",
            "desc": "星云网络旗下的通用开源项目"
          }
        },
        "list": {
          "drawingEngine": {
            "name": "HarukiBot NEO Drawing Engine",
            "desc": "HarukiBot NEO 的图片渲染服务：接收 JSON 请求，输出玩家资料、卡牌、活动、歌曲、谱面等图片。服务层基于自由线程 (free-threaded) 的 Python 3.14 与 FastAPI，绘制由 Rust + Skia 原生渲染器完成。"
          },
          "botBackend": {
            "name": "HarukiBot NEO Backend",
            "desc": "HarukiBot NEO 的核心后端：解析 Bot 指令，查询《世界计划》与 CHUNITHM 数据并生成回复，同时负责 Bot 的注册与鉴权。基于 Go、Fiber 与 Ent。"
          },
          "toolboxBackend": {
            "name": "Haruki Toolbox Backend",
            "desc": "Haruki 工具箱的后端：接收玩家上传的 Suite 与 MySekai 数据并提供查询 API，账号登录与第三方授权由 Ory Kratos 和 Hydra 承担。基于 Go、Fiber 与 Ent，数据存于 PostgreSQL 与 Redis。"
          },
          "deckService": {
            "name": "Deck Service",
            "desc": "组卡推荐 HTTP 服务：用 Rust 与 Axum 提供接口，通过 FFI 调用 C++ 组卡引擎，可静态链接成单个可执行文件。"
          },
          "deckCpp": {
            "name": "Sekai Deck Recommend CPP",
            "desc": "组卡推荐与算分的 C++ 引擎：除枚举搜索外还提供随机化与启发式算法，同时发布 Python 包与 WebAssembly 包。原始实现来自 ルナ茶，部分修改来自 moe-sekai。"
          },
          "scoresRs": {
            "name": "PJSekai Scores RS",
            "desc": "《世界计划》谱面解析与渲染库：读取 .sus 谱面，生成 SVG 谱面图，也可用纯 Rust 渲染器直接输出 PNG 或 JPEG。提供 Rust crate、命令行工具与 Python 包。"
          },
          "toolbox": {
            "name": "Haruki Toolbox",
            "desc": "Haruki 工具箱的 Web 前端：游戏图鉴、活动冲榜计算与个人数据工具。基于 Vue 3 与 TypeScript，界面使用 Shadcn-Vue 与 Tailwind CSS。"
          },
          "assetUpdater": {
            "name": "Haruki Sekai Asset Updater",
            "desc": "《世界计划》游戏资源更新服务：下载并解密资源包，导出图片、音频、视频等素材，再上传到对象存储。基于 Rust，解包使用 unity-rs 与 cridecoder。"
          },
          "sekaiApi": {
            "name": "Haruki Sekai API",
            "desc": "面向《世界计划》五个区服游戏服务器的 API 代理：管理各区服的游戏账号，处理加密通信，并自动更新和分发 master data。基于 Rust 与 Axum。"
          },
          "eventTracker": {
            "name": "Haruki Event Tracker",
            "desc": "《世界计划》活动榜线追踪服务：定时记录各区服的排行数据，提供榜线查询 API 与 WebSocket 实时推送。基于 Rust 与 Axum。"
          },
          "cridecoder": {
            "name": "Cridecoder",
            "desc": "纯 Rust 实现的 CRI 中间件编解码库：支持 ACB、AWB 音频容器与 USM 视频容器的提取和构建，以及 HCA 音频的编解码，并提供 Python 绑定。"
          },
          "unityRs": {
            "name": "Unity RS",
            "desc": "无界面的 Unity 资源读取与导出工具：解析资源包，导出贴图、音频和模型（OBJ、FBX）等。提供 Rust 库、命令行工具以及 Python、Node.js 绑定，实现参考了 AssetStudio 与 AssetStudioMod。"
          }
        }
      },
      "support": {
        "title": "支持 Haruki Dev Team",
        "desc": "Project Haruki 相关项目的开发与维护需要消耗开发团队大量的人力、财力及精力。为了帮助我们做得更好，欢迎您前往我们的爱发电页面进行赞助，或查看我们目前的赞助者名单。",
        "afdianBtn": "赞助我们 (爱发电)",
        "sponsorsBtn": "赞助者名单"
      }
    }
  },
  "sponsor": {
    "hero": {
      "badge": "爱发电赞助",
      "title": "支持 Project Haruki",
      "description": "你的赞助让 HarukiBot NEO 和 Haruki 工具箱持续运行",
      "cta": "前往爱发电赞助",
      "aboutCta": "关于 Project Haruki"
    },
    "summary": {
      "supporters": "赞助者",
      "current": "当前赞助",
      "former": "曾经赞助",
      "updatedAt": "数据更新于 {time}"
    },
    "sections": {
      "planCount": "{count} 人",
      "current": {
        "title": "当前赞助",
        "empty": "暂无正在赞助的赞助者"
      },
      "former": {
        "title": "曾经赞助",
        "empty": "暂无赞助时长已到期的赞助者"
      }
    },
    "supporter": {
      "anonymous": "匿名赞助者",
      "defaultPlan": "爱发电赞助",
      "pastPlan": "曾经赞助",
      "active": "正在赞助",
      "activeUntil": "赞助至 {date}",
      "expiredAt": "已于 {date} 到期",
      "recent": "近期赞助",
      "supportCount": "已赞助 {count} 次"
    },
    "empty": {
      "title": "暂无赞助数据",
      "unavailableTitle": "赞助名单暂不可用",
      "unavailableDescription": "请稍后再来看看"
    }
  },
  "legal": {
    "common": {
      "eyebrow": "法律条款",
      "toc": "目录"
    },
    "privacy": {
      "title": "隐私政策",
      "lastUpdated": "最后更新：2026-10-30",
      "intro": "本隐私政策说明 Haruki 工具箱如何收集、使用、保存、共享和保护您的信息。Haruki Dev Team 是一个民间业余开发维护团体，我们会尽力以清晰、克制和必要的方式处理您的数据。",
      "contactLead": "隐私相关问题请联系：",
      "sections": {
        "controller": {
          "title": "1. 服务提供者与适用范围",
          "paragraphs": {
            "summary": "Haruki 工具箱由 Haruki Dev Team 维护，主要面向中国大陆用户，同时允许全球用户访问和使用。本政策适用于 Haruki 工具箱网站及其相关功能。"
          },
          "bullets": {
            "team": "服务提供者：Haruki Dev Team。我们不是注册公司，而是民间业余开发维护团体。",
            "contact": "联系邮箱见页面上方。",
            "region": "数据主要存储在中国大陆；我们也会使用 CDN 以改善访问体验。",
            "minors": "本服务目前不设置年龄限制。未成年人使用本服务时，建议在监护人知情和指导下进行。"
          }
        },
        "collection": {
          "title": "2. 我们收集的信息",
          "paragraphs": {
            "summary": "为了提供账号、绑定、数据上传、组卡、控分、工单和安全风控等功能，我们会收集您主动提供的信息、使用服务时产生的信息，以及为保障服务运行所必需的技术信息。"
          },
          "bullets": {
            "account": "账号与认证信息：例如邮箱、用户名、头像、OAuth 或第三方登录标识、MFA 状态、登录会话、IP 地址、User-Agent 和其他必要认证信息。",
            "game": "游戏账号与上传数据：例如区服、游戏 UID、玩家昵称、suite 数据、MySekai 数据、上传时间、缓存数据及与绑定账号相关的配置。",
            "profile": "用户 profile 数据会用于页面展示和功能计算，但不会保存到 Haruki 工具箱服务器。",
            "logs": "运行与安全日志：例如访问日志、错误日志、上传日志、风控日志、管理员操作日志和必要的接口调用记录。",
            "storage": "本地数据：我们会使用 Cookie、localStorage、IndexedDB 与 PWA 缓存保存登录状态、设置、缓存数据和离线资源。这些存储是当前服务正常运行所需，暂不提供关闭选项。"
          }
        },
        "usage": {
          "title": "3. 信息用途",
          "paragraphs": {
            "summary": "我们仅在提供和维护 Haruki 工具箱及 HarukiBot NEO 相关高级功能所需的范围内使用您的信息。"
          },
          "bullets": {
            "service": "提供账号登录、游戏账号绑定、数据上传、组卡推荐、控分计算、工单处理和偏好设置同步等功能。",
            "security": "进行身份验证、账号安全保护、接口限流、滥用检测、风控审计和异常排查。",
            "support": "定位故障、回复反馈、处理工单、改进产品体验和维护服务稳定性。",
            "advanced": "在 Haruki 工具箱与 HarukiBot NEO 中提供与您授权或上传数据相关的高级功能。",
            "compliance": "在法律法规、监管要求或保护用户与服务安全所必要的范围内处理相关信息。"
          }
        },
        "retention": {
          "title": "4. 数据保存",
          "paragraphs": {
            "summary": "除非我们主动清理、服务策略调整或法律要求另有规定，服务器端数据理论上会长期保存，以便维持账号绑定、历史上传、风控审计和服务连续性。"
          },
          "bullets": {
            "server": "服务器端数据：游戏账号绑定、上传记录、账号数据（Suite）、烤森数据（MySekai）、日志和管理员操作记录目前没有固定保存期限（引继码保险库除外，见第 5 节）。",
            "local": "本地数据：登出会清理浏览器中的部分本地缓存用户数据，但不会自动删除服务器端已保存的数据。",
            "requests": "删除、导出或注销账号目前不能由用户自助完成；如需处理，请通过联系邮箱向 Haruki Dev Team 提出请求。"
          }
        },
        "inheritVault": {
          "title": "5. 引继码保险库",
          "paragraphs": {
            "summary": "使用引继码上传数据时，工具箱会在你确认后执行引继。执行后，生成引继码的设备将无法再登录该游戏账号，因此我们会为你签发新的引继码，并把账号凭据和新引继码加密保存在你的引继码保险库中，以便你能回到自己的账号。"
          },
          "bullets": {
            "stored": "保存的内容：游戏账号的登录凭据、为该账号新签发的引继码（引继 ID 和密码）、区服、游戏 UID 以及创建和到期时间。你输入的原引继码只在任务进行中使用，执行引继后即丢弃，不会保存。",
            "purpose": "用途：仅用于让你查看新引继码，或在引继码丢失、失效时用保存的凭据重新签发引继码，从而把账号引继回你的设备。我们不会将其用于其他目的。",
            "encryption": "加密方式：凭据和引继码用由你的 Toolbox 密码（无密码的账号使用你设置的保险库 PIN）派生的密钥加密，并再由服务器密钥加密。单独拿到数据库、服务器密钥或你的密码都无法解开。",
            "retention": "保存期限：引继码在签发后 24 小时删除，账号凭据最多保存 7 天；你点击「我已在手机上恢复」后记录立即不可读取，并在几分钟内删除；重置保险库会删除全部记录。",
            "access": "谁能读取：只有你本人，在输入 Toolbox 密码或保险库 PIN 后才能读取；Haruki Dev Team 的管理员和运维人员无法读取。唯一的例外：上传任务进行期间（最长 1 小时），为了在页面上向你显示新引继码，服务器会仅用服务器密钥保存一份最新引继码，任务记录过期后即删除；账号凭据从不以这种方式保存。",
            "audit": "审计与通知：创建、确认、取消任务，保存凭据，查看、重新签发、销毁记录以及创建、迁移和重置保险库密钥都会记入系统日志（不含引继码、密码或完整游戏 UID）；查看或重新签发引继码时，会向你已验证的邮箱发送通知。",
            "delete": "如何删除：你可以随时在「上传数据 → 引继码」页面的保险库中销毁单条记录，或重置整个保险库。若你通过找回密码重置了 Toolbox 密码，旧记录将无法再解开，只能重置保险库。",
            "local": "本地数据：浏览器只记住正在进行的任务编号（最长 1 小时），不会保存引继码或任何密码；旧版「在当前设备记住引继信息」功能已移除，之前保存在浏览器中的引继信息会被自动清除。"
          }
        },
        "sharing": {
          "title": "6. 信息共享与第三方服务",
          "paragraphs": {
            "summary": "我们不会出售您的个人信息，也不会将您的信息用于广告画像。除提供服务所必需、您主动授权或法律要求外，我们不会向无关第三方披露您的信息。"
          },
          "bullets": {
            "noSale": "不会出售、出租或以广告画像为目的共享您的个人信息。",
            "harukiServices": "您上传或绑定的数据默认仅用于 Haruki 工具箱与 HarukiBot NEO 提供高级功能服务；除非您开启公开 API 查询或自行进行 OAuth 授权，第三方服务无法访问这些数据。",
            "google": "如果您使用 Google 登录，Google 会按照其自身政策处理相关第三方登录信息。",
            "cdn": "我们使用 Cloudflare、EdgeOne 和 CDN 服务分发静态资源、改善访问速度和可用性。",
            "email": "我们使用邮件服务发送账号、安全或服务相关邮件。Ory Kratos/Hydra 为自建认证与授权服务。"
          }
        },
        "security": {
          "title": "7. 信息安全",
          "paragraphs": {
            "summary": "我们会采取合理的技术和管理措施保护数据安全，但任何互联网服务都无法保证绝对安全。"
          },
          "bullets": {
            "controls": "我们会使用传输加密、访问控制、权限隔离、日志审计和最小权限等方式降低数据泄露、滥用或未授权访问风险。",
            "limits": "由于本项目由民间业余团队维护，资源和安全能力存在客观限制。发现安全问题时，请优先通过联系邮箱负责任地告知我们。"
          }
        },
        "rights": {
          "title": "8. 您的权利",
          "paragraphs": {
            "summary": "在适用法律允许的范围内，您可以查询、更正、导出、删除部分个人信息或申请注销账号。"
          },
          "bullets": {
            "settings": "您可以在账号设置或相关功能页面管理部分账号信息、绑定信息和偏好设置。",
            "contact": "如果需要删除、导出数据或注销账号，请通过页面上方联系邮箱联系 Haruki Dev Team。",
            "limits": "为了安全、审计、争议处理、服务连续性或法律合规，我们可能无法立即或完整删除某些日志、备份或必要记录。"
          }
        },
        "changes": {
          "title": "9. 政策更新",
          "paragraphs": {
            "summary": "我们可能会根据功能变化、服务调整或合规需要更新本隐私政策。更新后的政策会发布在本页面，并自发布时生效。"
          },
          "bullets": {}
        },
        "contact": {
          "title": "10. 联系我们",
          "paragraphs": {
            "summary": "如果您对本政策、个人信息处理或账号数据有任何疑问，请通过页面上方联系邮箱联系 Haruki Dev Team。"
          },
          "bullets": {}
        }
      }
    },
    "tos": {
      "title": "服务条款",
      "lastUpdated": "最后更新：2026-10-30",
      "intro": "使用 Haruki 工具箱即表示您同意遵守本服务条款。若您不同意本条款，请停止访问或使用本服务。",
      "contactLead": "条款相关问题请联系：",
      "sections": {
        "scope": {
          "title": "1. 适用范围",
          "paragraphs": {
            "summary": "本条款适用于您访问和使用 Haruki 工具箱网站、页面、工具、账号系统、数据上传、组卡、控分、工单和相关功能的全部行为。"
          },
          "bullets": {
            "team": "Haruki 工具箱由 Haruki Dev Team 这一民间业余开发维护团体提供。",
            "unofficial": "Haruki 工具箱是 fan-made / unofficial 项目，与 SEGA、Colorful Palette 及相关权利方不存在隶属、授权、背书或官方合作关系。",
            "global": "本服务主要面向中国大陆用户，同时允许全球用户使用；您应自行确保使用行为符合所在地适用法律法规。"
          }
        },
        "account": {
          "title": "2. 账号责任",
          "paragraphs": {
            "summary": "您应妥善保管账号、密码、MFA、OAuth 授权、游戏引继码及其他凭证，并对账号下的操作负责。"
          },
          "bullets": {
            "credentials": "如发现账号异常、凭证泄露或未经授权的使用，应及时修改密码、撤销授权并联系我们。",
            "dataAccuracy": "您应确保提交、绑定或上传的数据来自您有权使用的账号，并尽量保证信息真实、准确、完整。",
            "adminSupport": "为了处理反馈、工单、风控、安全或服务支持，管理员可能查看与问题相关的用户数据、上传记录、日志和工单内容；引继码保险库中加密保存的账号凭据和引继码除外，管理员无法查看。"
          }
        },
        "acceptableUse": {
          "title": "3. 使用规范",
          "paragraphs": {
            "summary": "您应以合理、合法、善意的方式使用本服务，不得干扰服务运行或损害其他用户、项目维护者或第三方的权益。"
          },
          "bullets": {
            "lawful": "不得利用本服务从事违法违规、侵权、欺诈、骚扰、绕过限制或其他不当行为。",
            "automation": "未经明确许可，不允许任何形式的自动化访问、爬虫、批量请求、批量注册、批量上传或接口滥用。",
            "security": "不得尝试扫描、攻击、破坏、绕过认证、绕过风控、逆向接口限制或获取未授权数据。",
            "rateLimit": "我们可能对异常请求、批量请求或滥用行为进行限流、拒绝服务、封禁账号或阻断访问。"
          }
        },
        "dataUse": {
          "title": "4. 用户数据与授权",
          "paragraphs": {
            "summary": "您上传、绑定或授权的数据默认仅用于 Haruki 工具箱与 HarukiBot NEO 提供高级功能服务。"
          },
          "bullets": {
            "harukiServices": "除非您允许公开 API 查询或自行进行 OAuth 授权，第三方服务无法访问您在 Haruki 工具箱中的绑定和上传数据。",
            "thirdParty": "您通过第三方登录、CDN 或邮件服务产生的数据，可能同时受到对应第三方服务条款与隐私政策约束。",
            "oauth": "如果您主动授权其他应用访问您的账号或数据，请自行确认授权范围和第三方可信度。"
          }
        },
        "betaFeatures": {
          "title": "5. 测试功能与结果准确性",
          "paragraphs": {
            "summary": "部分功能仍处于测试阶段，可能存在计算误差、数据延迟、接口变化或结果不符合预期的情况。"
          },
          "bullets": {
            "deckRecommend": "组卡推荐目前处于测试状态，推荐结果不保证一定最优或完全符合游戏内实际表现。",
            "scoreControl": "控分计算目前处于测试状态，控分结果不保证准确；使用前请自行核对体力消耗、活动配置和游戏内数据。",
            "noGuarantee": "您应自行判断和承担基于推荐、计算或展示结果进行操作所产生的风险。"
          }
        },
        "gameAccountRisk": {
          "title": "6. 游戏账号与引继码风险",
          "paragraphs": {
            "summary": "Haruki 工具箱可能提供与游戏数据更新、上传或引继码相关的辅助功能。您应理解这些操作可能存在账号安全和游戏服务条款风险。"
          },
          "bullets": {
            "transferCode": "因使用引继码更新数据、同步数据或相关操作产生的游戏账号封禁、限制、异常或其他风险，由您自行承担。",
            "accountLoss": "因您未妥善保存引继码、密码、登录凭证或其他账号恢复信息导致的游戏账号丢失，我们不承担责任。"
          }
        },
        "availability": {
          "title": "7. 服务可用性与变更",
          "paragraphs": {
            "summary": "我们会尽力维护服务可用性，但不承诺服务持续、无错误、无中断或永久保留任何功能。"
          },
          "bullets": {
            "changes": "我们可能因维护、安全、滥用防护、成本、产品调整或第三方变化，修改、暂停、限制或下线部分功能。",
            "thirdParty": "第三方登录、CDN、邮件、网络环境、游戏数据来源或其他外部服务异常，可能影响 Haruki 工具箱的可用性。"
          }
        },
        "enforcement": {
          "title": "8. 违规处理",
          "paragraphs": {
            "summary": "如果您违反本条款或存在危害服务、安全、其他用户或项目维护者的行为，我们可以采取必要处理措施。"
          },
          "bullets": {
            "ban": "处理措施包括但不限于限制功能、限流、阻断请求、暂停账号、封禁账号或拒绝继续提供服务。",
            "data": "为调查违规、处理争议、保障安全或满足必要审计需要，我们可能保留相关日志和记录。"
          }
        },
        "links": {
          "title": "9. 第三方链接与开源项目",
          "paragraphs": {
            "summary": "Haruki 工具箱可能包含指向第三方网站、开源仓库、文档或社区资源的链接。"
          },
          "bullets": {
            "external": "第三方网站和服务由其各自运营者负责，我们不控制其内容、可用性、安全性或隐私实践。",
            "openSource": "与开源项目相关的代码、依赖和许可信息，以对应仓库、许可证文件和项目说明为准。"
          }
        },
        "liability": {
          "title": "10. 责任限制",
          "paragraphs": {
            "summary": "在法律允许的范围内，Haruki Dev Team 不对因您使用或无法使用本服务、依赖计算或推荐结果、第三方服务异常、网络故障、不可抗力或非我们可控原因导致的直接或间接损失承担责任。"
          },
          "bullets": {
            "scope": "本服务按现状提供，不构成对游戏结果、账号安全、数据完整性、服务连续性或特定目的适用性的保证。"
          }
        },
        "changes": {
          "title": "11. 条款更新",
          "paragraphs": {
            "summary": "我们可能不定期更新本条款。更新后的条款会发布在本页面，并自发布时生效；您在更新后继续使用本服务，即视为接受修订后的条款。"
          },
          "bullets": {}
        },
        "contact": {
          "title": "12. 联系与争议处理",
          "paragraphs": {
            "summary": "如果您对本条款或服务使用有疑问、反馈或争议，请通过页面上方联系邮箱联系 Haruki Dev Team。我们倾向于通过友好沟通解决问题。"
          },
          "bullets": {}
        }
      }
    }
  }
} as const
