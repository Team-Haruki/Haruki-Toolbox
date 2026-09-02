// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: userSettings, oauth
export default {
  "userSettings": {
    "common": {
      "actionFailedTitle": "操作失敗",
      "missingUserDescription": "使用者資訊缺失，請重新登入",
      "cancel": "取消"
    },
    "sections": {
      "accountTitle": "賬號設定",
      "accountDescription": "管理你的身份、登入與安全相關設定。",
      "harukiBotTitle": "HarukiBot資料授權",
      "harukiBotDescription": "管理社交平臺繫結與授權，供 HarukiBot 查詢你的遊戲資料。",
      "oauthTitle": "OAuth 授權管理",
      "oauthDescription": "管理通過 OAuth 授權訪問你賬號資料的第三方應用。"
    },
    "sekaiData": {
      "region": "區服",
      "masterVersion": "Master 版本",
      "displayVersion": "展示版本",
      "fetchVersion": "拉取版本",
      "localVersion": "本地版本",
      "remoteVersion": "遠端版本",
      "updatedAt": "更新時間",
      "fileCount": "{count} 個檔案",
      "progress": "狀態",
      "actions": "操作",
      "never": "從未更新",
      "regionCacheTitle": "區服快取",
      "summary": {
        "readyRegions": "可用區服",
        "cachedFiles": "已快取檔案",
        "activeTasks": "活動任務"
      },
      "refreshMasterData": "更新",
      "clear": "清理",
      "clearDialog": {
        "title": "清理Master資料快取？",
        "description": "將清理{region}的本地Master資料與music metas快取，需要重新下載後才能繼續使用相關資料。",
        "confirm": "確認清理"
      },
      "queueTitle": "更新佇列",
      "queueEmpty": "暫無更新任務。",
      "queueDetails": {
        "cacheHit": "快取已是最新，沒有下載新檔案。",
        "updated": "已下載並寫入新的快取資料。",
        "completed": "任務已完成。",
        "failed": "任務失敗。",
        "fileProgress": "正在處理 {file}（{current}/{total}）。",
        "file": "正在處理 {file}。",
        "phase": "當前階段：{phase}。"
      },
      "status": {
        "idle": "等待更新",
        "loading": "載入中",
        "ready": "可用",
        "clearing": "清理中",
        "error": "失敗"
      },
      "phases": {
        "queued": "排隊中",
        "checking": "檢查版本",
        "fetching-master": "下載 Master",
        "fetching-music-metas": "下載 Music metas",
        "writing-cache": "寫入快取",
        "ready": "完成",
        "clearing": "清理快取"
      },
      "queueStatus": {
        "queued": "排隊",
        "running": "執行中",
        "done": "完成",
        "error": "失敗"
      }
    },
    "kratosFlow": {
      "title": "身份設定",
      "description": "此頁面用於修改郵箱、密碼和個人資料。",
      "toast": {
        "savedTitle": "設定已更新",
        "profileSavedDescription": "郵箱或暱稱更新成功",
        "passwordSavedDescription": "密碼設定已更新",
        "mfaSavedDescription": "多因素認證設定已更新",
        "socialSavedDescription": "社交登入設定已更新",
        "genericSavedDescription": "身份設定已更新"
      },
      "groups": {
        "profile": "個人資料",
        "password": "密碼",
        "oidc": "社交登入",
        "passkey": "通行金鑰",
        "webauthn": "安全金鑰",
        "totp": "身份驗證器",
        "lookupSecret": "恢復碼"
      }
    },
    "profileCard": {
      "title": "個人資料",
      "description": "頭像、暱稱與郵箱繫結。"
    },
    "securityCard": {
      "title": "安全與登入",
      "description": "密碼、多因素認證、社交登入與會話管理。"
    },
    "account": {
      "title": "頭像設定",
      "description": "管理您的 Haruki 工具箱頭像",
      "changeAvatar": "更換頭像",
      "uploading": "上傳中...",
      "autoUploadHint": "選擇頭像後會自動裁剪為方形並壓縮上傳，無需再點選儲存。",
      "toast": {
        "previewFailedTitle": "預覽失敗",
        "previewFailedDescription": "頭像檔案讀取失敗，請重試",
        "invalidAvatarTypeTitle": "頭像格式不支援",
        "invalidAvatarTypeDescription": "請選擇圖片檔案",
        "avatarTooLargeTitle": "頭像檔案過大",
        "avatarTooLargeDescription": "請選擇小於 {sizeMb} MB 的圖片",
        "savedTitle": "頭像已更新",
        "savedDescription": "頭像上傳成功",
        "saveFailedTitle": "頭像上傳失敗",
        "saveFailedDescription": "頭像上傳失敗，請稍後重試"
      }
    },
    "email": {
      "unbound": "未繫結",
      "title": "郵箱設定",
      "description": "管理您的郵箱繫結資訊",
      "kratosManagedDescription": "郵箱變更與驗證由身份中心統一處理。",
      "kratosManagedHint": "郵箱與暱稱修改都在身份中心處理，完成後返回工具箱即可同步最新狀態。",
      "currentEmailLabel": "當前郵箱",
      "currentNicknameLabel": "當前暱稱",
      "unsetNickname": "未設定",
      "changeButton": "管理郵箱和暱稱",
      "verifyButton": "驗證郵箱",
      "dialog": {
        "title": "更換郵箱",
        "description": "輸入新的郵箱，完成人機驗證併發送驗證碼。",
        "newEmailPlaceholder": "新的郵箱地址",
        "codePlaceholder": "郵箱驗證碼",
        "countdown": "{seconds}s",
        "sendCodeButton": "傳送驗證碼",
        "confirmButton": "確認更換"
      },
      "toast": {
        "invalidNewEmailTitle": "請輸入有效的新郵箱",
        "invalidNewEmailDescription": "請檢查郵箱格式後重試",
        "completeCaptchaTitle": "請先完成人機驗證",
        "completeCaptchaDescription": "通過下方驗證碼後再發送郵件",
        "codeSentTitle": "驗證碼已傳送",
        "codeSentDescription": "已傳送到 {email}，請注意查收",
        "sendCodeFailedTitle": "傳送驗證碼失敗",
        "sendCodeFailedDescription": "傳送驗證碼失敗",
        "inputCodeTitle": "請輸入驗證碼",
        "inputCodeDescription": "請填寫郵箱收到的驗證碼",
        "changeSuccessTitle": "更換郵箱成功",
        "changeSuccessDescription": "請重新登入以生效",
        "changeFailedTitle": "更換郵箱失敗",
        "changeFailedDescription": "更換郵箱失敗"
      }
    },
    "password": {
      "title": "密碼設定",
      "description": "管理您的Haruki工具箱賬號的密碼",
      "kratosManagedDescription": "密碼修改由身份中心統一處理。",
      "kratosManagedHint": "點選下方按鈕後會跳轉到身份設定流程，完成密碼修改後返回即可。",
      "changeButton": "更換密碼",
      "dialog": {
        "title": "更換密碼",
        "description": "請輸入當前密碼和新密碼",
        "oldPasswordLabel": "當前密碼",
        "oldPasswordPlaceholder": "請輸入當前密碼",
        "newPasswordLabel": "新密碼",
        "newPasswordPlaceholder": "請輸入新密碼",
        "confirmPasswordLabel": "確認密碼",
        "confirmPasswordPlaceholder": "請再次輸入新密碼",
        "submit": "提交"
      },
      "toast": {
        "validateFailedTitle": "驗證失敗",
        "oldPasswordRequired": "請輸入當前密碼",
        "newPasswordRequired": "請輸入新密碼",
        "passwordMismatch": "兩次輸入的新密碼不一致", // NOSONAR -- translation key, not a credential
        "passwordMinLength": "新密碼長度至少為8位", // NOSONAR -- translation key, not a credential
        "changeSuccessTitle": "密碼修改成功",
        "changeSuccessDescription": "請重新登入",
        "changeFailedTitle": "密碼修改失敗",
        "changeFailedDescription": "密碼修改失敗"
      }
    },
    "mfa": {
      "title": "多因素認證",
      "description": "管理 TOTP、WebAuthn 與恢復碼等安全認證方式。",
      "hint": "你可以在此頁面繫結或更新 MFA 方式，提升賬號安全性。",
      "manageButton": "管理 MFA"
    },
    "social": {
      "title": "社交登入",
      "description": "管理 Google 等 OIDC 身份提供商繫結。",
      "hint": "你可以在此頁面完成社交賬號繫結或解綁。",
      "manageButton": "管理社交登入"
    },
    "sessions": {
      "title": "會話管理",
      "description": "檢視當前登入會話，並撤銷不可信裝置。",
      "hint": "你可以單獨踢下線某臺裝置，也可以一次性下線其他會話。",
      "manageButton": "管理會話",
      "page": {
        "title": "會話管理",
        "description": "管理當前身份下的活躍會話。",
        "refresh": "重新整理",
        "currentSession": "當前會話",
        "currentTag": "當前",
        "otherSessions": "其他活躍會話",
        "empty": "暫無其他活躍會話。",
        "unknownDevice": "未知裝置",
        "issuedAt": "簽發時間",
        "authenticatedAt": "認證時間",
        "expiresAt": "過期時間",
        "aal": "認證等級",
        "revokeOne": "下線該會話",
        "revokeOthers": "下線其他會話",
        "loadFailed": "載入會話失敗。",
        "revokeFailed": "下線該會話失敗。",
        "revokeOthersFailed": "下線其他會話失敗。"
      }
    },
    "imBinding": {
      "title": "社交平臺賬號繫結設定",
      "description": "管理您的Haruki工具箱賬號的社交平臺賬號繫結資訊",
      "fields": {
        "platform": "平臺",
        "account": "賬號",
        "verificationStatus": "驗證狀態"
      },
      "status": {
        "verified": "已驗證",
        "unverified": "未驗證"
      },
      "unbindButton": "取消繫結",
      "unbindDialog": {
        "title": "確認取消繫結？",
        "description": "取消繫結後，您將無法通過此社交平臺賬號使用HarukiBot查詢您上傳的資料。",
        "confirm": "確認"
      },
      "selectPlatformLabel": "選擇平臺",
      "selectPlatformPlaceholder": "選擇平臺",
      "accountPlaceholder": "請輸入賬號 ID",
      "emailVerifyRequiredHint": "請先完成郵箱驗證，再進行社交平臺賬號繫結操作。",
      "captchaHint": "為防止濫用，請先通過下方驗證碼再發送郵件驗證碼。",
      "actions": {
        "sendEmailCode": "傳送郵件驗證碼",
        "generateCode": "生成驗證碼"
      },
      "dialog": {
        "title": "繫結社交平臺驗證",
        "qqDescription": "請輸入郵件中的驗證碼完成繫結。",
        "otherDescription": "請在對應平臺使用下方驗證碼完成繫結，然後點選“驗證”重新整理狀態。",
        "qqCodePlaceholder": "請輸入郵件驗證碼",
        "verifyButton": "驗證"
      },
      "toast": {
        "emailNotVerifiedTitle": "郵箱未驗證",
        "emailNotVerifiedDescription": "請先驗證郵箱後再進行社交平臺賬號繫結操作",
        "sendFailedTitle": "傳送失敗",
        "completeCaptchaDescription": "請先完成驗證碼驗證",
        "verificationCodeSentTitle": "驗證碼已傳送",
        "verificationCodeSentDescription": "請前往QQ {account} 的郵箱查收",
        "generateFailedTitle": "生成失敗",
        "incompleteResponseDescription": "返回資料不完整",
        "codeGeneratedTitle": "驗證碼已生成",
        "missingQQAccountDescription": "請先填寫 QQ 號",
        "invalidQQAccountDescription": "QQ 號必須為純數字",
        "invalidQQBotAccountDescription": "QQ 官方 Bot 的使用者 OpenID 長度不正確，請檢查是否完整複製",
        "missingAccountDescription": "請填寫需要繫結的賬號 ID",
        "verifyFailedTitle": "驗證失敗",
        "inputQQCodeDescription": "請輸入郵件中的驗證碼",
        "verifySuccessTitle": "驗證成功",
        "verifySuccessDefaultDescription": "已完成繫結",
        "missingStatusTokenDescription": "缺少狀態令牌，請重新生成驗證碼",
        "notVerifiedTitle": "未完成驗證",
        "notVerifiedDescription": "您還沒有完成驗證",
        "notVerifiedFallbackDescription": "請在社交平臺完成驗證後再試",
        "unboundSuccessTitle": "已取消繫結",
        "unboundSuccessDescription": "該社交平臺賬號已與當前賬號解綁"
      }
    },
    "imAuthorization": {
      "title": "授權社交平臺查詢",
      "description": "管理您的Haruki工具箱賬號授權可查詢遊戲賬號資訊的社交平臺",
      "addButton": "新增授權",
      "emptyTitle": "暫無授權的社交平台",
      "emptyDescription": "新增授權後，對應平台的帳號即可查詢你的遊戲帳號資訊。",
      "platformPlaceholder": "請選擇社交平臺",
      "platforms": {
        "qq": "QQ",
        "qqbot": "QQ官方Bot",
        "discord": "Discord",
        "telegram": "Telegram"
      },
      "fields": {
        "platform": "平臺",
        "account": "賬號",
        "remark": "備註",
        "allowFastVerification": "允許快速驗證",
        "allowFastVerificationHint": "開啟後，該使用者可以在HarukiBot中快速通過賬號驗證"
      },
      "fastVerificationBadge": "快速驗證",
      "actions": {
        "edit": "編輯",
        "delete": "刪除"
      },
      "dialog": {
        "createTitle": "新增社交平臺授權",
        "editTitle": "編輯社交平臺授權",
        "descriptionMain": "修改授權可查詢資訊的社交平臺賬號",
        "descriptionHint": "你需要先完成賬號繫結設定才能使用此功能"
      },
      "deleteDialog": {
        "title": "確認刪除",
        "description": "確認刪除 {platform} {userId} 嗎？此操作無法撤銷。",
        "deleting": "刪除中..."
      },
      "toast": {
        "saveFailedTitle": "儲存失敗",
        "accountRequiredDescription": "請輸入賬號",
        "accountQQNumericDescription": "QQ 號必須為純數字",
        "accountQQBotLengthDescription": "QQ 官方 Bot 的使用者 OpenID 長度不正確，請檢查是否完整複製",
        "saveSuccessTitle": "已儲存授權",
        "saveSuccessDescription": "社交平臺賬號授權資訊已更新",
        "deleteSuccessTitle": "已刪除授權",
        "deleteSuccessDescription": "該社交平臺賬號授權已移除",
        "deleteFailedTitle": "刪除失敗"
      }
    },
    "oauthAuthorizations": {
      "title": "已授權的應用",
      "description": "檢視並隨時撤銷已授權訪問你賬號資料的第三方應用。",
      "refresh": "重新整理",
      "emptyTitle": "暫無已授權的應用",
      "emptyDescription": "當你授權第三方應用訪問賬號資料後，它們會顯示在這裡。",
      "authorizedAtPrefix": "授權於",
      "clientType": {
        "bot": "Bot",
        "website": "網站"
      },
      "dialog": {
        "title": "撤銷授權",
        "description": "確認撤銷 {clientName} 的所有訪問許可權嗎？該應用將無法再訪問您的資料。",
        "revoke": "撤銷",
        "revoking": "撤銷中..."
      },
      "toast": {
        "fetchFailedTitle": "獲取授權列表失敗",
        "fetchFailedFallback": "獲取失敗",
        "revokeSuccessTitle": "已撤銷授權",
        "revokeSuccessDescription": "已撤銷 {clientName} 的訪問許可權",
        "revokeFailedTitle": "撤銷失敗",
        "revokeFailedFallback": "撤銷失敗"
      }
    },
    "gameBinding": {
      "title": "遊戲賬號繫結",
      "description": "管理您的 Haruki 工具箱賬號繫結的《世界計劃: 繽紛舞臺 feat. 初音未來》遊戲賬號",
      "alert": {
        "title": "注意",
        "line1Server": "同一個區服",
        "line1Middle": "的",
        "line1GameId": "同一個遊戲ID",
        "line1After": "在Haruki工具箱中僅限一個Haruki工具箱使用者繫結",
        "line2": "Haruki工具箱的賬號繫結資訊與HarukiBot NEO不共享，如果需要在HarukiBot NEO上查詢資料，請先按照Bot使用幫助在Bot上繫結對應的遊戲賬號"
      },
      "addButton": "繫結新賬號",
      "empty": "暫無資料",
      "region": {
        "jp": "日服",
        "en": "國際服",
        "tw": "臺服",
        "kr": "韓服",
        "cn": "國服"
      },
      "table": {
        "server": "區服",
        "userId": "遊戲UID",
        "verificationStatus": "驗證狀態",
        "actions": "操作"
      },
      "status": {
        "verified": "已驗證",
        "unverified": "未驗證",
        "default": "預設"
      },
      "actions": {
        "edit": "編輯",
        "grants": "資料授權",
        "receivedGrants": "收到的授權",
        "delete": "刪除",
        "setDefault": "設為預設賬號"
      },
      "editDialog": {
        "createTitle": "新增賬號",
        "editTitle": "編輯賬號",
        "subtitle": "繫結你的遊戲賬號並配置資料許可權。",
        "verifyHint": "完成驗證後才能儲存繫結。",
        "qqGate": {
          "title": "需要先繫結並驗證 QQ",
          "description": "新增遊戲賬號前，請先在「HarukiBot 資料授權」中繫結並驗證你的 QQ 號。",
          "action": "前往繫結 QQ"
        },
        "basicInfoTitle": "賬號基本資訊",
        "serverPlaceholder": "選擇區服",
        "verifyButton": "驗證",
        "fields": {
          "server": "區服",
          "userId": "遊戲UID",
          "verificationStatus": "驗證狀態"
        },
        "suite": {
          "title": "Suite資料設定",
          "description": "管理您上傳的遊戲賬號的Suite資料設定"
        },
        "mysekai": {
          "title": "MySekai資料設定",
          "description": "管理您上傳的遊戲賬號的MySekai資料設定"
        }
      },
      "deleteDialog": {
        "title": "確認刪除",
        "description": "確認刪除 {server} 的遊戲UID {userId} 嗎？此操作無法撤銷。"
      },
      "verifyDialog": {
        "title": "驗證碼生成成功",
        "description": "請在遊戲內的個性簽名中輸入以下驗證碼完成驗證",
        "copyHint": "點選下方驗證碼即可一鍵複製到剪下板",
        "confirmButton": "我已輸入，關閉此視窗",
        "notice": {
          "keepFullCode": "請務必完整輸入進個性簽名，不要移除斜槓",
          "returnHome": "在遊戲中完成驗證碼輸入之後，請務必退回到主頁確保驗證碼成功儲存，再繼續新增賬號",
          "saveAfterClose": "輸入驗證碼之後，直接關閉此視窗，點選儲存按鈕，即可進行賬號驗證"
        }
      },
      "permissions": {
        "suite": {
          "allowPublicApi": {
            "title": "允許公開API訪問",
            "description": "允許Suite資料通過Haruki工具箱公開API訪問"
          },
          "allowSakura": {
            "title": "允許上傳至SakuraBot",
            "description": "允許Suite資料上傳至SakuraBot"
          },
          "allow8823": {
            "title": "允許上傳至烤森Bot",
            "description": "允許Suite資料上傳至烤森Bot"
          },
          "allowResona": {
            "title": "允許上傳至ResonaBot",
            "description": "允許Suite資料上傳至ResonaBot"
          },
          "allowLuna": {
            "title": "允許上傳至LunaBot",
            "description": "允許Suite資料上傳至LunaBot"
          }
        },
        "mysekai": {
          "allowPublicApi": {
            "title": "允許公開API訪問",
            "description": "允許MySekai資料通過Haruki工具箱公開API訪問"
          },
          "allowFixtureApi": {
            "title": "允許傢俱共享API",
            "description": "允許MySekai賬號UID出現在傢俱共享API"
          },
          "allow8823": {
            "title": "允許上傳至烤森Bot",
            "description": "允許MySekai資料上傳至烤森Bot"
          },
          "allowResona": {
            "title": "允許上傳至ResonaBot",
            "description": "允許MySekai資料上傳至ResonaBot"
          },
          "allowLuna": {
            "title": "允許上傳至LunaBot",
            "description": "允許MySekai資料上傳至LunaBot"
          }
        }
      },
      "grants": {
        "title": "遊戲賬號資料授權",
        "description": "把已驗證賬號的 suite / mysekai / profile 資料臨時授權給其他 Toolbox 使用者讀取。",
        "receivedDescription": "檢視其他 Toolbox 使用者授權給你的遊戲賬號資料。",
        "selectedAccount": "當前賬號：{account}",
        "noSelectedAccount": "未選擇賬號",
        "ownedTitle": "此賬號授權出去的資料",
        "receivedTitle": "別人授權給我的資料",
        "emptyOwned": "該賬號暫無授權",
        "emptyReceived": "暫無收到的授權",
        "fallback": "—",
        "yourUserId": "你的 Toolbox 使用者 ID：",
        "dataType": {
          "suite": "Suite",
          "mysekai": "MySekai",
          "profile": "Profile"
        },
        "actions": {
          "refresh": "重新整理",
          "save": "儲存授權"
        },
        "form": {
          "title": "新增或更新授權",
          "granteeUserId": "被授權 Toolbox 使用者 ID",
          "granteeUserIdPlaceholder": "例如 1234567890",
          "dataType": "資料型別",
          "expiresAt": "過期時間",
          "expiresAtHelp": "必須是未來時間，不提供永久授權。",
          "profileHint": "Profile 是即時資料：被授權使用者每次查看都會經由你的賬號向遊戲伺服器發起請求。"
        },
        "table": {
          "owner": "授權來源",
          "grantee": "被授權使用者",
          "dataType": "資料型別",
          "expiresAt": "過期時間",
          "actions": "操作"
        },
        "validation": {
          "verifiedOnly": "只有已驗證繫結賬號可以建立資料授權",
          "granteeRequired": "請填寫被授權使用者 ID",
          "selfGrant": "不能授權給自己",
          "dataType": "只支援 suite、mysekai 或 profile",
          "futureExpiry": "過期時間必須是未來時間"
        },
        "toast": {
          "loadFailedTitle": "載入資料授權失敗",
          "saveFailedTitle": "儲存資料授權失敗",
          "deleteFailedTitle": "撤銷資料授權失敗",
          "saved": "資料授權已儲存",
          "deleted": "資料授權已撤銷"
        }
      },
      "toast": {
        "setDefaultSuccessTitle": "已設為預設賬號",
        "setDefaultSuccessDescription": "各功能頁面將預設選中該賬號",
        "setDefaultFailedTitle": "設定預設賬號失敗",
        "deleteSuccessTitle": "刪除成功",
        "deleteSuccessDescription": "賬號已解除繫結",
        "deleteFailedTitle": "刪除失敗",
        "saveSuccessTitle": "儲存成功",
        "saveSuccessDescription": "賬號設定已更新",
        "saveFailedTitle": "儲存失敗",
        "verifyBeforeCreateDescription": "新增賬號前請先點選“驗證”生成驗證碼，並在遊戲內完成設定。",
        "uidMustBeNumericDescription": "遊戲UID必須是純數字",
        "generateCodeFailedTitle": "無法生成驗證碼",
        "selectServerAndUidDescription": "請先選擇區服並填寫遊戲UID",
        "missingCodeDescription": "未返回驗證碼",
        "copySuccessTitle": "複製成功",
        "copySuccessDescription": "已成功複製驗證碼，請前往遊戲內填寫您的驗證碼",
        "copyFailedTitle": "複製失敗",
        "clipboardUnsupportedDescription": "當前環境不支援剪貼簿操作，請手動複製驗證碼",
        "copyFallbackDescription": "請手動選擇並複製驗證碼"
      }
    }
  },
  "oauth": {
    "scope": {
      "userRead": "讀取個人資料",
      "bindingsRead": "讀取繫結賬號",
      "gameDataRead": "讀取遊戲資料",
      "gameDataWrite": "上傳遊戲資料",
      "openid": "確認您的身份並使用 Haruki 賬號登入",
      "profile": "獲取您的暱稱",
      "email": "獲取您的信箱地址",
      "offlineAccess": "保持離線訪問並獲取重新整理令牌"
    },
    "login": {
      "unknownApp": "未知應用",
      "title": "登入以繼續",
      "signInDescriptionPrefix": "要繼續訪問 ",
      "signInDescriptionSuffix": "，請先登入您的 Haruki Toolbox 賬號。",
      "readyDescriptionPrefix": "您已登入，繼續前往 ",
      "readyDescriptionSuffix": " 完成授權流程。",
      "continuingTitle": "正在繼續登入",
      "continuingDescriptionPrefix": "正在為 ",
      "continuingDescriptionSuffix": " 準備後續授權流程。",
      "signInButton": "去登入",
      "continueButton": "繼續",
      "cancel": "取消授權",
      "rejectDescription": "該授權請求已在登入前被取消。",
      "invalidTitle": "無效的登入請求",
      "invalidDescription": "缺少必要的登入 challenge，或 challenge 已無效。請從客戶端應用重新發起授權。",
      "backHome": "返回首頁",
      "toast": {
        "failedTitle": "繼續登入失敗",
        "missingRedirect": "未收到重定向地址",
        "retry": "無法繼續登入流程，請重試。"
      }
    },
    "consent": {
      "unknownApp": "未知應用",
      "title": "授權請求",
      "descriptionPrefix": "",
      "descriptionSuffix": " 請求訪問您的 Haruki Toolbox 賬號",
      "continuingDescriptionPrefix": "正在為 ",
      "continuingDescriptionSuffix": " 準備授權流程。",
      "scopeIntro": "該應用將能夠：",
      "noScopesRequested": "該應用未請求額外許可權範圍。",
      "revokeHint": "授權後，您可以隨時在「OAuth 授權管理」頁面撤銷。",
      "reject": "拒絕",
      "authorize": "授權",
      "authorizing": "授權中...",
      "rejectDescription": "資源所有者已拒絕本次授權請求。",
      "invalidTitle": "無效的授權請求",
      "invalidDescription": "缺少必要授權引數，或 challenge 已無效。請從客戶端應用重新發起授權。",
      "backHome": "返回首頁",
      "toast": {
        "failedTitle": "授權失敗",
        "missingRedirect": "未收到重定向地址",
        "retry": "無法完成授權，請重試"
      }
    },
    "logout": {
      "loadingTitle": "正在讀取登出請求",
      "title": "登出",
      "descriptionPrefix": "",
      "descriptionSuffix": " 請求登出您的 Haruki Toolbox 賬號。",
      "genericDescription": "一個第三方應用請求登出您的 Haruki Toolbox 賬號。",
      "confirmHint": "確認後將同時登出本站與已連線第三方應用的登入狀態。",
      "cancel": "取消",
      "confirm": "登出",
      "loggingOut": "正在登出...",
      "invalidTitle": "無效的登出請求",
      "invalidDescription": "缺少必要的 logout challenge，或 challenge 已無效。",
      "backHome": "返回首頁",
      "toast": {
        "failedTitle": "登出失敗",
        "missingRedirect": "未收到重定向地址",
        "retry": "無法完成登出，請重試"
      }
    }
  }
} as const
