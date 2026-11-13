// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).
// Namespaces: uploadedGameData, app, common, backendMessages, turnstile, auth, sidebar, sidebarUser, home, gameAccountSelect, cardBox, eventRecords, musicProgress, globalSearch, costumes, gachas, playerProfile, training, searchAlias, sekaiRegion, sekaiUnreleased, navigation, webLayout, route, musicLibrary, cards, events, musicPlayer, homeSettings, core, catalog
export default {
  "uploadedGameData": {
    "missingTitle": "尚未上傳遊戲資料",
    "missing": {
      "suite": "該遊戲帳號還沒有上傳過遊戲資料（Suite，即帳號完整資料），請先到「上傳資料」頁上傳，再回來點重新整理",
      "mysekai": "該遊戲帳號還沒有上傳過烤森資料（MySekai），請先到「上傳資料」頁上傳，再回來點重新整理",
      "profile": "還沒有這個遊戲帳號的資料，暫時無法讀取即時資料。請先到「上傳資料」頁上傳一次遊戲資料，再回來點重新整理。"
    },
    "missingGranted": "該帳號的主人還沒有上傳遊戲資料。請聯絡對方上傳；如果對方已允許你代傳，你也可以在「上傳資料」頁上傳。",
    "uploadAction": "前往上傳資料頁",
    "uploadedAt": "資料上傳時間：{time}",
    "grantLapsed": "該帳號的授權已過期或被撤銷，請聯絡授權方重新授權",
    "refreshUpToDate": "資料已是最新",
    "refreshUpdated": "已更新到 {time}",
    "missingAccounts": "有 {count} 個綁定帳號尚未上傳遊戲資料，請先前往上傳資料頁完成上傳",
    "otherFailures": "另有 {count} 個帳號讀取失敗，請稍後重試"
  },
  "app": {
    "name": "Haruki工具箱"
  },
  "common": {
    "save": "儲存",
    "reset": "重置",
    "cancel": "取消",
    "confirm": "確認",
    "close": "關閉",
    "back": "返回",
    "showPassword": "顯示密碼",
    "hidePassword": "隱藏密碼",
    "tip": "提示",
    "actionFailed": "操作失敗，請稍後重試",
    "postSuccessWarningTitle": "操作成功，但有後續異常",
    "postSuccessWarningDescription": "後續重新整理失敗，如頁面資料未更新請手動重新整理",
    "guest": "未登入",
    "accountIndex": "帳號 {index}",
    "apiResponse": "請求失敗",
    "missingUpdatedData": "{context}：伺服器返回的資料不完整，請重新整理後重試",
    "selectDateTime": "請選擇時間"
  },
  "backendMessages": {
    "notAuthenticated": "你還沒有登入，或登入狀態已過期。請重新登入後再試。",
    "forbidden": "沒有權限訪問此內容。如果你認為這是誤判，請聯絡管理員。",
    "uploadNotAllowed": "當前帳號沒有向這個遊戲帳號上傳資料的權限。請使用綁定了該遊戲帳號的帳號上傳，或請帳號所有者授予你上傳權限。",
    "writeGrantExpired": "帳號所有者授予你的上傳權限已過期或被撤銷。請聯絡所有者重新授權，或改為上傳自己綁定的遊戲帳號。",
    "bindingAccessDenied": "你沒有訪問這個遊戲帳號資料的權限。如果是他人授權的帳號，授權可能已過期或被撤銷，請聯絡授權方重新授權。",
    "invalidServer": "選擇的遊戲伺服器無效。請重新選擇伺服器後再試。",
    "uploadProcessFailed": "上傳的資料無法處理。請確認檔案是完整、未修改的抓包資料，然後重新上傳。",
    "mysekaiRetrieveFailed": "無法獲取烤森資料（MySekai），可能是這個遊戲帳號還沒有完成烤森（MySekai）教程。請在遊戲裡完成教程後再試。",
    "suiteRetrieveFailed": "獲取遊戲資料時發生了未知錯誤。請稍後重試；如果持續失敗，請提交工單反饋。",
    "gameDataRetrieveFailed": "無法從遊戲伺服器獲取資料。請確認引繼碼和引繼密碼正確且未過期，稍後再試。",
    "verificationCodeMissing": "遊戲個性簽名裡沒有找到驗證碼。請確認已把整段驗證碼貼上進個性簽名並儲存，退回遊戲主頁後再試。",
    "verificationCodeMismatch": "遊戲個性簽名裡的驗證碼與本次生成的不一致。請把最新生成的驗證碼完整貼上進個性簽名並儲存，退回遊戲主頁後再試。",
    "verificationCodeExpired": "驗證碼已過期或不存在。請重新生成驗證碼後再試。",
    "verificationTooManyAttempts": "驗證嘗試次數過多。請重新生成一個新的驗證碼後再試。",
    "gameAccountNotFound": "沒有找到這個遊戲帳號。請檢查選擇的伺服器和玩家 ID 是否正確。",
    "gameServerUnavailable": "遊戲伺服器暫時無法訪問，可能正在維護。請稍後再試。",
    "accountBoundByAnotherUser": "這個遊戲帳號已被其他使用者綁定。如果這是你的帳號，請提交工單申請處理。",
    "accountBoundByBannedUser": "這個遊戲帳號被一個已封禁的使用者綁定。如果這是你的帳號，請提交工單申請處理。",
    "bindingNotVerified": "這個遊戲帳號的綁定還沒有完成驗證。請先在遊戲帳號管理頁完成驗證。",
    "bindingLocked": "這個綁定已被管理員鎖定，暫時無法修改。如有疑問請提交工單。",
    "granteeNotFound": "沒有找到要授權的使用者。請檢查對方的工具箱使用者 ID 是否正確。",
    "grantToSelf": "不能給自己授權。請填寫其他使用者的工具箱使用者 ID。",
    "expiresAtNotFuture": "到期時間必須晚於當前時間。請重新選擇到期時間。",
    "granteeBanned": "要授權的使用者已被封禁，無法授權",
    "accountDeletionConfirmationRequired": "請重新整理頁面，並輸入目標使用者 ID 確認永久刪除",
    "accountDeletionBusy": "該帳號有進行中的引繼任務或刪除操作，請等待結束後重試",
    "accountDeletionUnavailable": "刪除尚未完成，請稍後重試",
    "qqBindingExists": "該 QQ 已綁定工具箱帳號。如需換綁，請先在原帳號解除綁定；無法登入原帳號時請聯絡管理員。",
    "emailVerificationRequired": "請先完成信箱驗證，再綁定社交平台帳號",
    "codeInvalidOrExpired": "驗證碼無效或已過期。請重新獲取驗證碼後再試。",
    "codeTooManyAttempts": "驗證嘗試次數過多。請重新獲取驗證碼後再試。",
    "ticketClosed": "這個工單已經關閉，無法繼續回覆。如有新問題請新建工單。",
    "ticketNotFound": "沒有找到這個工單，可能已被刪除。請返回工單列表重新整理。",
    "ticketQuotaExceeded": "你的工單數量已達上限。請等待現有工單處理完畢後再新建。",
    "messageLength": "訊息內容需要在 1 到 4000 個字元之間。請調整後重新發送。",
    "captchaFailed": "人機驗證未通過。請重新完成驗證後再試。",
    "invalidVerificationCode": "驗證碼不正確。請檢查後重新輸入。",
    "reauthRequired": "需要重新驗證密碼後才能繼續",
    "consentChallengeExpired": "授權請求已過期或無效。請回到發起授權的應用重新開始。",
    "loginChallengeRequired": "缺少授權參數。請回到發起授權的應用重新開始。",
    "inheritFailed": "引繼失敗。請確認引繼碼和引繼密碼正確，並在遊戲內重新生成引繼碼後再試。",
    "inheritFailedWithCode": "引繼失敗（遊戲伺服器返回：{code}）。請確認引繼碼和引繼密碼正確，並在遊戲內重新生成引繼碼後再試。",
    "suiteParseFailed": "遊戲資料解析失敗。請確認上傳的是完整、未修改的抓包資料；如果持續失敗，請提交工單反饋。",
    "playerDataNotFound": "沒有找到這個玩家的資料。請先上傳遊戲資料後再試。",
    "otpIncorrect": "一次性密碼不正確。請檢查後重新輸入。"
  },
  "turnstile": {
    "loading": "正在載入驗證碼元件...",
    "loadFailed": "驗證碼元件載入失敗，請檢查網路後重試",
    "retry": "重試載入"
  },
  "auth": {
    "common": {
      "cancel": "取消",
      "loadingFlow": "正在載入…",
      "restartFlow": "重新開始",
      "otherMethods": "其他方式",
      "triggerUnavailable": "通行密鑰暫時不可用，請使用其他方式繼續",
      "loadFlowFailed": "{flow}已過期或無法連線，重新開始即可",
      "serviceUnavailable": "登入服務暫時無法連線，請稍後重試（錯誤碼 {status}）",
      "flowNames": {
        "login": "登入頁面",
        "registration": "註冊頁面",
        "recovery": "找回密碼頁面",
        "verification": "信箱驗證頁面",
        "settings": "帳號安全設定頁面"
      }
    },
    "kratos": {
      "labels": {
        "code": "驗證碼",
        "totpCode": "動態驗證碼",
        "totpCodePlaceholder": "6 位數字",
        "lookupSecret": "備用恢復碼",
        "savePassword": "儲存密碼",
        "continueWithCode": "通過信箱驗證碼登入",
        "sendLink": "傳送連結",
        "verify": "驗證",
        "submit": "提交",
        "next": "下一步",
        "imageAlt": "驗證器 App QR Code"
      },
      "text": {
        "1010001": "登入",
        "1010002": "使用 {provider} 登入",
        "1010003": "為了保護帳號安全，請再次驗證身份，確認是你本人在操作",
        "1010004": "請完成第二步驗證後繼續",
        "1010005": "驗證",
        "1010006": "動態驗證碼",
        "1010007": "備用恢復碼",
        "1010008": "使用安全密鑰登入",
        "1010009": "使用驗證器 App 驗證",
        "1010010": "使用備用恢復碼驗證",
        "1010011": "使用安全密鑰登入",
        "1010012": "請準備好你的安全密鑰（如 USB 金鑰或指紋識別裝置），然後點選「繼續」",
        "1010013": "繼續",
        "1010014": "驗證碼已傳送到你填寫的地址。如果沒有收到，請檢查地址是否填寫正確後重試。",
        "1010015": "傳送登入驗證碼",
        "1010016": "你嘗試用 {provider} 登入，但信箱 {duplicateIdentifier} 已經被另一個帳號使用。請先用下方任一方式登入這個帳號，登入後會把 {provider} 新增為它的另一種登入方式。",
        "1010017": "登入並關聯",
        "1010018": "使用 {provider} 確認",
        "1010019": "獲取驗證碼以繼續",
        "1010020": "我們會向你的地址傳送一個驗證碼",
        "1010021": "使用通行密鑰登入",
        "1010022": "使用密碼登入",
        "1010023": "傳送驗證碼到 {address}",
        "1010024": "使用安全密鑰登入",
        "1010025": "驗證碼已傳送到你的地址。如果沒有收到，請重試。",
        "1010026": "你的帳號由所屬組織管理，請使用組織的單點登入方式登入",
        "1040001": "註冊",
        "1040002": "使用 {provider} 註冊",
        "1040003": "繼續",
        "1040004": "使用安全密鑰註冊",
        "1040005": "驗證碼已傳送到你填寫的地址。如果沒有收到，請檢查地址是否填寫正確，然後重新註冊。",
        "1040006": "傳送註冊驗證碼",
        "1040007": "使用通行密鑰註冊",
        "1040008": "返回",
        "1040009": "請選擇這個帳號的登入方式",
        "1050001": "設定已儲存",
        "1050002": "關聯 {provider} 帳號",
        "1050003": "解除關聯 {provider} 帳號",
        "1050004": "停用驗證器 App",
        "1050005": "驗證器 App QR Code",
        "1050006": "{secret}",
        "1050007": "檢視備用恢復碼",
        "1050008": "生成新的備用恢復碼",
        "1050009": "{secret}",
        "1050010": "這是你的備用恢復碼，每個只能使用一次。請妥善儲存在安全的地方！",
        "1050011": "確認並啟用備用恢復碼",
        "1050012": "新增安全密鑰",
        "1050013": "安全密鑰名稱",
        "1050014": "已於 {usedAt} 使用",
        "1050015": "{secrets}",
        "1050016": "停用備用恢復碼",
        "1050017": "這是驗證器 App 的金鑰。無法掃描 QR Code 時，可以在驗證器中手動輸入它。",
        "1050018": "移除安全密鑰「{display_name}」",
        "1050019": "新增通行密鑰",
        "1050020": "移除通行密鑰「{display_name}」",
        "1050023": "你的帳號由所屬組織管理。如需修改這些設定，請聯絡組織管理員。",
        "1050024": "請先設定第二步驗證方式，然後繼續",
        "1060001": "帳號已成功找回。請儘快修改密碼，或設定其他登入方式。",
        "1060002": "找回密碼郵件已傳送到你填寫的信箱。請點選郵件中的連結；如果沒有收到，請檢查垃圾郵件，並確認填寫的是註冊時使用的信箱。",
        "1060003": "找回密碼驗證碼已傳送到你填寫的信箱。請在下方輸入；如果沒有收到，請檢查垃圾郵件，並確認填寫的是註冊時使用的信箱。",
        "1060004": "找回密碼驗證碼已傳送到 {masked_address}。如果沒有收到，請檢查地址是否正確，並確認使用的是註冊時的地址。",
        "1060005": "請輸入完整的找回地址，以恢復對帳號的訪問",
        "1060006": "你想通過哪種方式找回帳號？",
        "1060007": "返回",
        "1070001": "密碼",
        "1070002": "{title}",
        "1070003": "儲存",
        "1070004": "帳號",
        "1070005": "提交",
        "1070006": "驗證碼",
        "1070007": "信箱",
        "1070008": "重新發送驗證碼",
        "1070009": "繼續",
        "1070010": "找回密碼驗證碼",
        "1070011": "驗證碼",
        "1070012": "註冊驗證碼",
        "1070013": "登入驗證碼",
        "1070014": "登入並關聯",
        "1070015": "請先完成人機驗證再繼續",
        "1070016": "找回地址",
        "1070017": "手機號",
        "1070018": "信箱或手機號",
        "1080001": "驗證郵件已傳送到你填寫的信箱。請點選郵件中的連結完成驗證；如果沒有收到，請檢查垃圾郵件。",
        "1080002": "信箱驗證成功",
        "1080003": "驗證碼已傳送到你填寫的信箱。請在下方輸入；如果沒有收到，請檢查垃圾郵件。",
        "1080004": "驗證碼簡訊已傳送到你填寫的手機號。如果沒有收到，請檢查號碼是否正確。",
        "1080005": "手機號驗證成功",
        "4000001": "填寫的內容無效，請檢查後重新填寫",
        "4000002": "請填寫這一項",
        "4000003": "內容太短，至少需要 {min_length} 個字元",
        "4000004": "格式不正確，請檢查後重新填寫",
        "4000005": "這個密碼不能使用，請換一個密碼",
        "4000006": "信箱或密碼不正確，請檢查後重試。忘記密碼可以點選「忘記密碼？」找回。",
        "4000007": "這個信箱已經註冊過帳號。請直接登入，或使用「忘記密碼」找回。",
        "4000008": "動態驗證碼不正確，請輸入驗證器中最新的驗證碼",
        "4000009": "沒有找到可用於登入的帳號標識，請填寫信箱後重試",
        "4000010": "這個帳號的信箱還沒有完成驗證。請先查收驗證郵件並完成驗證。",
        "4000011": "當前帳號還沒有設定驗證器 App",
        "4000012": "這個備用恢復碼已經使用過了，請換一個",
        "4000013": "當前帳號還沒有設定安全密鑰",
        "4000014": "當前帳號還沒有設定備用恢復碼",
        "4000015": "這個帳號不存在，或者還沒有設定安全密鑰",
        "4000016": "備用恢復碼不正確，請檢查後重新輸入",
        "4000017": "內容太長，最多 {max_length} 個字元",
        "4000018": "數值不能小於 {minimum}",
        "4000019": "數值必須大於 {minimum}",
        "4000020": "數值不能大於 {maximum}",
        "4000021": "數值必須小於 {maximum}",
        "4000022": "數值必須是 {base} 的倍數",
        "4000023": "最多隻能填寫 {max_items} 項",
        "4000024": "至少需要填寫 {min_items} 項",
        "4000025": "不能填寫重複的內容",
        "4000026": "填寫的內容類型不正確",
        "4000027": "已有帳號使用了相同的信箱。請先登入這個帳號，再關聯你的第三方帳號。",
        "4000028": "{identifier} 已經被另一個帳號使用。",
        "4000029": "填寫的內容不符合要求",
        "4000030": "填寫的內容不符合要求",
        "4000031": "密碼與信箱過於相似，請換一個密碼",
        "4000032": "密碼太短，至少需要 {min_length} 個字元",
        "4000033": "密碼太長，最多 {max_length} 個字元",
        "4000034": "這個密碼曾在已知的資料洩露中出現，不能再使用，請換一個密碼",
        "4000035": "這個帳號不存在，或者還沒有開啟驗證碼登入",
        "4000036": "填寫的資訊與之前不一致，請重新開始",
        "4000037": "這個帳號不存在，或者還沒有設定任何登入方式",
        "4000038": "人機驗證未通過，請重試",
        "4000039": "新密碼不能與當前密碼相同",
        "4000040": "請輸入有效的信箱地址",
        "4000041": "請輸入有效的手機號",
        "4000042": "當前帳號還沒有設定裝置金鑰",
        "4000043": "安全密鑰驗證失敗，請重試",
        "4000044": "裝置金鑰簽名無效",
        "4000045": "這個裝置金鑰已無法繼續使用，請重新新增",
        "4000046": "這個裝置金鑰新增時還不支援使用者驗證，已無法繼續使用，請重新新增",
        "4000047": "需要同意後才能繼續",
        "4010001": "登入頁面停留時間過長，已自動重新整理，請重新登入",
        "4010002": "無法處理這次登入請求，請檢查填寫的內容後重試",
        "4010003": "無法處理這次註冊請求，請檢查填寫的內容後重試",
        "4010004": "無法儲存這次設定，請檢查填寫的內容後重試",
        "4010005": "無法處理這次找回密碼請求，請檢查填寫的內容後重試",
        "4010006": "無法處理這次驗證請求，請檢查填寫的內容後重試",
        "4010007": "這次登入已經完成，不能重複提交。請重新整理頁面。",
        "4010008": "登入驗證碼無效或已使用，請重新獲取",
        "4010009": "關聯的登入方式不匹配",
        "4010010": "你輸入的地址與當前帳號的任何地址都不匹配",
        "4010011": "這個帳號已被停用。如有疑問，請聯絡管理員。",
        "4040001": "註冊頁面停留時間過長，已自動重新整理，請重新填寫",
        "4040002": "這次註冊已經完成，不能重複提交",
        "4040003": "註冊驗證碼無效或已使用，請重新獲取",
        "4050001": "設定頁面停留時間過長，已自動重新整理，請重新操作",
        "4050002": "一次只能修改一個地址，請分別修改",
        "4060001": "這次找回密碼已經完成，不能重複提交",
        "4060002": "找回密碼流程出錯，請重新開始",
        "4060003": "連結中缺少找回憑據，請重新發起找回密碼",
        "4060004": "找回密碼連結無效或已使用，請重新發起找回密碼",
        "4060005": "找回密碼頁面停留時間過長，已自動重新整理，請重新操作",
        "4060006": "驗證碼無效或已使用，請檢查後重新輸入，或重新發送驗證碼",
        "4070001": "驗證連結無效或已使用，請重新發送驗證郵件",
        "4070002": "這次驗證已經完成，不能重複提交",
        "4070003": "驗證流程出錯，請重新開始",
        "4070004": "連結中缺少驗證憑據，請重新發送驗證郵件",
        "4070005": "驗證頁面停留時間過長，已自動重新整理，請重新操作",
        "4070006": "驗證碼無效或已使用，請檢查後重新輸入，或重新發送驗證碼",
        "5000001": "登入服務發生了內部錯誤，請稍後重試",
        "5000002": "當前沒有可用的登入方式，請聯絡管理員",
        "5000003": "你的組織要求使用單點登入，但還沒有配置登入方式。請聯絡管理員。"
      },
      "variants": {
        "requiredField": "請填寫{field}",
        "duplicateIdentifierUnknown": "這個信箱",
        "duplicateMethods": "你可以使用{methods}登入。",
        "duplicateProviders": "你也可以使用以下第三方帳號登入：{providers}。",
        "lookupSecretUsed": "已使用"
      },
      "fields": {
        "identifier": "信箱",
        "email": "信箱",
        "traits_email": "信箱",
        "name": "使用者名稱",
        "traits_name": "使用者名稱",
        "password": "密碼",
        "code": "驗證碼",
        "totp_code": "動態驗證碼",
        "lookup_secret": "備用恢復碼",
        "webauthn_register_displayname": "安全密鑰名稱"
      },
      "credentialTypes": {
        "password": "密碼",
        "oidc": "第三方帳號",
        "saml": "第三方帳號",
        "webauthn": "通行密鑰或安全密鑰",
        "passkey": "通行密鑰",
        "code": "信箱驗證碼"
      },
      "reasons": {
        "tooManyAttempts": "嘗試次數過多，這個驗證碼已失效。請重新獲取驗證碼。",
        "codeUsed": "這個驗證碼已經用過了，請重新獲取",
        "invalidEmail": "信箱格式不正確，請檢查後重新填寫",
        "invalidFormat": "格式不正確，請檢查後重新填寫",
        "oidcDenied": "你取消了第三方帳號授權。如需繼續，請重新選擇登入方式。",
        "oidcProviderError": "第三方帳號返回了錯誤，請重試或換一種登入方式",
        "oidcFailed": "第三方帳號登入沒有完成，請重試",
        "oidcPermissions": "第三方帳號缺少必要的授權，請重試並同意所有權限",
        "sessionCookieInvalid": "登入狀態異常，請重試。如果問題持續，請清除本站 Cookie 後再試。",
        "webauthnFailed": "無法讀取通行密鑰或安全密鑰的響應，請重試",
        "credentialMissing": "要移除的金鑰已不存在，請重新整理頁面",
        "lastCredential": "這是你唯一的登入方式，不能移除。請先新增其他登入方式。",
        "noChanges": "沒有需要儲存的修改",
        "lookupRegenerateFirst": "請先生成新的備用恢復碼，再進行確認",
        "lookupNone": "你還沒有備用恢復碼",
        "addressNotVerified": "這個帳號的信箱還沒有完成驗證。請先查收驗證郵件並完成驗證。",
        "alreadySignedIn": "你已經登入了，無需重複操作",
        "flowDisabled": "這項功能目前沒有開放"
      },
      "errors": {
        "security_csrf_violation": "安全校驗未通過，可能是頁面停留時間過長，或在多個標籤頁中同時操作。請返回重新開始；如果反覆出現，請清除本站 Cookie 後再試。",
        "security_identity_mismatch": "這個請求由另一個帳號發起，已被拒絕。請重新開始。",
        "session_already_available": "你已經登入了，無需重複登入",
        "session_aal_already_fulfilled": "你已經完成了所需的驗證",
        "session_aal1_required": "請先登入，再進行第二步驗證",
        "session_aal2_required": "這項操作需要完成第二步驗證。請重新登入並完成驗證。",
        "session_inactive": "登入狀態已失效，請重新登入",
        "session_refresh_required": "為了帳號安全，修改這些設定前需要重新驗證身份",
        "session_verified_address_required": "你的信箱還沒有完成驗證。請先查收驗證郵件並完成驗證。",
        "self_service_flow_expired": "頁面已過期，請返回重新開始",
        "self_service_flow_disabled": "這項功能目前沒有開放",
        "self_service_flow_replaced": "這個頁面已被新的操作替代，請返回重新開始",
        "self_service_flow_return_to_forbidden": "跳轉地址不在允許的範圍內，已停止跳轉。請返回重新開始。",
        "browser_location_change_required": "需要跳轉到其他頁面才能繼續，請重試",
        "invalid_configuration": "登入服務的配置有誤，暫時無法完成這次操作。請稍後再試或聯絡管理員。"
      },
      "errorStatus": {
        "400": "請求無效，請返回登入頁重新開始",
        "401": "登入狀態已失效，請重新登入",
        "403": "請求被拒絕，請返回登入頁重新開始",
        "404": "要查詢的內容不存在或已過期，請返回登入頁重新開始",
        "410": "頁面已過期，請返回登入頁重新開始",
        "500": "登入服務發生了內部錯誤，請稍後重試"
      },
      "errorPage": {
        "technicalDetails": "技術詳情",
        "reasonLabel": "原因"
      },
      "webauthn": {
        "unsupported": "當前瀏覽器不支援通行密鑰或安全密鑰，請換用最新版的 Chrome、Edge、Safari 或 Firefox",
        "notAllowed": "操作已取消或超時。請重試，並在系統彈窗中完成確認。",
        "invalidState": "這個通行密鑰或安全密鑰已經新增過了",
        "aborted": "操作已取消",
        "security": "當前網址不能使用通行密鑰，請確認訪問的是本站的正式地址",
        "failed": "通行密鑰或安全密鑰操作失敗，請重試"
      }
    },
    "toast": {
      "networkError": "網路錯誤，請檢查連線",
      "loginFailedTitle": "登入失敗",
      "accountBannedTitle": "帳號已被封禁",
      "permissionDenied": "權限不足，請檢查帳號狀態",
      "tryLater": "請稍後再試",
      "logoutSuccessTitle": "已退出登入",
      "invalidReturnToTitle": "登入流程已重置",
      "invalidReturnToDescription": "檢測到異常跳轉目標，已為您重新發起安全登入流程",
      "invalidRegistrationReturnToTitle": "註冊流程已重置",
      "invalidRegistrationReturnToDescription": "檢測到異常跳轉目標，已為您重新發起安全註冊流程"
    },
    "login": {
      "description": "使用信箱和密碼登入",
      "title": "登入到 Haruki 工具箱",
      "titleMfa": "兩步驗證",
      "titleRefresh": "確認是你本人",
      "otherMethods": "其他登入方式",
      "otherFactors": "其他驗證方式",
      "emailLabel": "信箱",
      "emailPlaceholder": "name{'@'}example.com",
      "passwordLabel": "密碼",
      "forgotPassword": "忘記密碼？",
      "submit": "登入",
      "noAccount": "還沒有帳號？",
      "registerLink": "註冊",
      "refreshPasskey": {
        "mismatchTitle": "再次驗證沒有完成",
        "mismatchDescription": "裝置沒有返回帳號資訊，無法確認是哪個帳號。退出後用通行密鑰重新登入即可繼續，之後 15 分鐘內不用再驗證。",
        "relogin": "退出並重新登入",
        "reloginFailed": "退出登入失敗，請重試"
      },
      "reasons": {
        "authRequired": "該頁面需要登入，登入後自動返回",
        "adminRequired": "該頁面需要管理員帳號，登入後自動返回",
        "sessionExpired": "登入狀態已過期，重新登入後自動返回"
      },
      "toast": {
        "enterEmail": "請輸入信箱地址",
        "completeCaptcha": "請先完成人機驗證",
        "completeLoginCaptcha": "請先完成人機驗證",
        "resetEmailSentTitle": "重置密碼郵件已傳送",
        "resetEmailSentDescription": "郵件已傳送到 {email}",
        "resetFailedTitle": "重置密碼失敗",
        "loginSuccessTitle": "登入成功",
        "loginSuccessDescription": "歡迎回到Haruki工具箱"
      }
    },
    "register": {
      "description": "建立 Haruki 工具箱帳號",
      "title": "註冊帳號",
      "usernameLabel": "使用者名稱",
      "emailLabel": "信箱",
      "emailCodeLabel": "信箱驗證碼",
      "emailCodePlaceholder": "請輸入收到的驗證碼",
      "passwordLabel": "密碼",
      "sending": "傳送中...",
      "countdown": "{seconds} 秒後重試",
      "sendCode": "傳送驗證碼",
      "submit": "註冊",
      "hasAccount": "已有帳號？",
      "goLogin": "去登入",
      "otherMethods": "其他註冊方式"
    },
    "resetPassword": {
      "description": "重置帳號密碼",
      "title": "重置密碼",
      "emailLabel": "信箱",
      "newPasswordLabel": "新密碼",
      "confirmPasswordLabel": "確認密碼",
      "confirmPasswordPlaceholder": "請再次輸入新密碼",
      "submit": "確認重置"
    },
    "verification": {
      "description": "驗證信箱以啟用帳號",
      "title": "驗證信箱",
      "submit": "提交驗證",
      "continue": "繼續"
    },
    "validation": {
      "required": "請填寫此項"
    },
    "password": {
      "show": "顯示密碼",
      "hide": "隱藏密碼"
    },
    "error": {
      "title": "登入服務出現問題",
      "retry": "重新載入",
      "backToLogin": "返回登入",
      "backToHome": "返回首頁",
      "alreadySignedInTitle": "你已經登入了",
      "missingIdDescription": "連結不完整，返回登入頁重新開始",
      "loadFailedDescription": "無法讀取錯誤詳情，檢查網路後重試",
      "fallbackDescription": "這次操作沒有完成，返回登入頁重新開始",
      "errorIdLabel": "錯誤 ID",
      "statusCodeLabel": "狀態碼",
      "detailsLabel": "詳細資訊"
    }
  },
  "sidebar": {
    "toggle": "切換側邊欄",
    "title": "導航選單",
    "description": "站點導航選單"
  },
  "sidebarUser": {
    "guestInitial": "未",
    "guestName": "未登入",
    "accountSettings": "帳號設定",
    "identitySettings": "登入與安全",
    "gameAccountManagement": "遊戲帳號管理",
    "harukiBotAuthorization": "HarukiBot資料授權",
    "oauthAuthorizations": "已授權的應用",
    "logout": "退出登入",
    "register": "註冊",
    "login": "登入",
    "copyToolboxId": "複製工具箱使用者 ID",
    "toolboxIdCopied": "已複製工具箱使用者 ID",
    "copyFailed": "複製失敗"
  },
  "home": {
    "title": "Haruki 工具箱",
    "description": "Project SEKAI 的圖鑑、衝榜計算和個人資料工具",
    "search": {
      "placeholder": "搜尋歌曲、卡牌、活動"
    },
    "frequent": "常用",
    "status": {
      "needsLogin": "需要登入",
      "needsData": "需要先上傳資料"
    },
    "account": {
      "label": "當前帳號",
      "guestTitle": "三步用上個人資料功能",
      "steps": {
        "signIn": "註冊並登入",
        "bind": "綁定遊戲帳號",
        "upload": "上傳資料"
      }
    },
    "live": {
      "optInHint": "載入遊戲資料後展示當前活動、限時招募和新歌",
      "title": "正在進行",
      "optInTitle": "看看遊戲里正在進行什麼",
      "load": "載入遊戲資料",
      "running": "進行中",
      "upcoming": "即將開始",
      "ended": "已結束",
      "endsIn": "剩餘 {duration}",
      "startsIn": "{duration}後開始",
      "nextStartsIn": "下一期活動 {duration}後開始",
      "duration": {
        "days": "{days} 天 {hours} 小時",
        "hours": "{hours} 小時 {minutes} 分",
        "minutes": "{minutes} 分鐘"
      },
      "eventDetail": "活動詳情",
      "eventCards": "本期卡牌",
      "gachas": "限時招募",
      "newSongs": "新歌",
      "none": "這個區服暫時沒有可展示的內容",
      "error": "遊戲資料載入失敗，稍後再試"
    },
    "trays": {
      "catalog": {
        "hint": "遊戲內容資料庫"
      },
      "player": {
        "hint": "上傳後檢視自己的帳號"
      },
      "event": {
        "hint": "活動期間組卡、算分、看榜"
      },
      "community": {
        "hint": "找車、找群、找我們",
        "title": "聯機與社群"
      }
    },
    "tools": {
      "sponsors": "感謝支援工具箱的各位",
      "about": "專案介紹與開發團隊",
      "friendLinks": "其他好用的 Sekai 站點",
      "friendGroups": "玩家交流群",
      "storyPlayer": "線上閱讀遊戲劇情",
      "gachas": "歷屆卡池與出現的卡牌",
      "events": "歷屆活動與加成、獎勵",
      "cards": "卡牌、技能與卡面",
      "musicLibrary": "歌曲、難度與收錄資訊",
      "training": "各角色的養成進度",
      "eventRecords": "參加過的活動與成績",
      "cardBox": "卡牌收集進度",
      "playerProfile": "帳號的遊戲檔案",
      "uploadData": "把遊戲帳號資料同步到工具箱",
      "deckRecommend": "用你的卡牌算最優卡組",
      "rankBorder": "各檔位榜線與漲速",
      "ptCalculator": "按目標 Pt 算每局加成、體力和分數",
      "eventPlanner": "按小時排活動打歌計畫",
      "musicProgress": "打歌進度與可獲取獎勵",
      "costumes": "搭配服裝、頭飾和髮型，帶 3D 預覽",
      "sekaiStation": "即時彙總國服協力房間號",
      "tickets": "反饋 Bug、帳號問題或建議"
    },
    "aboutBanner": {
      "desc": "瞭解 Project Haruki 和贊助方式",
      "badge": "關於 & 贊助",
      "title": "您的幫助是我們繼續下去的動力"
    },
    "accountAndSettings": "帳號與設定",
    "register": "註冊",
    "login": "登入",
    "accountSettings": "帳號設定",
    "gameAccountManagement": "遊戲帳號管理",
    "moreLinks": "更多",
    "accountCard": {
      "title": "我的帳號",
      "dataUpdatedAt": "資料上傳於 {time}",
      "noUploadData": "該帳號還沒有上傳過資料",
      "guestDescription": "登入後綁定遊戲帳號，即可上傳資料、檢視檔案與個性化功能",
      "onboarding": {
        "title": "三步開始",
        "step1": "註冊並登入",
        "step2": "在「{link}」綁定並驗證你的遊戲帳號",
        "step2Link": "遊戲帳號管理",
        "step3": "用 iOS 模組 / HarukiProxy {link}一次遊戲資料",
        "step3Link": "上傳",
        "outro": "之後就能看卡牌、活動記錄、組卡推薦等"
      }
    },
    "externalLinks": "站外連結",
    "harukiBotDocs": "HarukiBot NEO幫助文件",
    "harukiGithub": "Haruki GitHub",
    "legalLinks": "法律與合規",
    "privacyPolicy": "隱私政策",
    "termsOfService": "服務條款",
    "currentEvent": {
      "title": "當前活動（{region}）",
      "optInHint": "載入遊戲資料庫後可展示當前進行中的活動",
      "load": "載入當前活動",
      "none": "當前沒有進行中的活動",
      "error": "活動資訊載入失敗",
      "ended": "已結束",
      "remainingDays": "剩餘 {days} 天 {hours} 小時",
      "remainingHours": "剩餘 {hours} 小時 {minutes} 分",
      "remainingMinutes": "剩餘 {minutes} 分鐘",
      "badge": "進行中",
      "links": {
        "rankBorder": "榜線",
        "deckRecommend": "組卡推薦",
        "detail": "詳情"
      }
    }
  },
  "gameAccountSelect": {
    "placeholder": "選擇遊戲帳號",
    "verified": "已驗證",
    "default": "預設",
    "none": "你還沒有綁定任何遊戲帳號。",
    "manage": "管理綁定",
    "grantedBadge": "授權",
    "groups": {
      "own": "我的綁定帳號",
      "granted": "他人授權的帳號"
    }
  },
  "cardBox": {
    "description": "帳號的卡牌收集進度",
    "title": "我的卡牌",
    "entryLink": "我的卡牌",
    "noAccountHint": "先選擇或綁定一個遊戲帳號",
    "refresh": "重新整理",
    "loadError": "卡牌資料載入失敗",
    "retry": "重試",
    "unknownCharacter": "未知角色",
    "empty": "當前篩選條件下沒有卡牌",
    "total": "共 {total} 張",
    "summary": "已收集 {owned}/{total} · {percent}%",
    "nav": {
      "label": "角色導航"
    },
    "sections": {
      "collapseAll": "全部摺疊",
      "expandAll": "全部展開"
    },
    "sort": {
      "id": "ID",
      "rarity": "稀有度",
      "level": "等級",
      "masterRank": "突破"
    },
    "group": {
      "label": "分組",
      "character": "按角色",
      "attr": "按屬性",
      "all": "全部卡牌"
    },
    "ownership": {
      "label": "顯示",
      "all": "全部",
      "owned": "僅已擁有",
      "missing": "僅未擁有"
    },
    "stats": {
      "title": "收集統計",
      "byUnit": "按團體",
      "byAttr": "按屬性",
      "byRarity": "按星級",
      "ownedOfTotal": "{owned}/{total}",
      "percent": "{percent}%"
    },
    "badge": {
      "level": "Lv.{level}"
    }
  },
  "eventRecords": {
    "description": "參加過的活動與成績",
    "title": "活動記錄",
    "idle": "先選擇或綁定一個遊戲帳號",
    "loading": "正在載入上傳的資料與活動資料…",
    "missingUserData": "當前帳號還沒有上傳遊戲資料，請先前往上傳資料頁面完成上傳",
    "missingGrantedData": "該帳號的所有者還沒有上傳遊戲資料，暫時無法檢視",
    "uploadData": "前往上傳資料",
    "noData": "你上傳的資料裡還沒有活動記錄",
    "noMatches": "當前篩選條件下沒有活動記錄",
    "hiddenByTime": "最近一年沒有活動記錄，共 {count} 場更早的記錄",
    "showAll": "檢視全部",
    "loadFailed": "活動記錄載入失敗",
    "retry": "重試",
    "refresh": "重新整理",
    "summary": {
      "bestRank": "最佳排名",
      "ranked": "有排名場次",
      "participated": "參與活動數",
      "bestPoint": "最高活動 PT",
      "averagePoint": "平均活動 PT"
    },
    "filters": {
      "time": "時間",
      "lastYear": "近一年",
      "all": "全部",
      "custom": "自定義",
      "from": "開始時間",
      "to": "結束時間",
      "type": "活動類型"
    },
    "trend": {
      "title": "活動 PT 趨勢",
      "empty": "記錄不足，無法繪製趨勢圖",
      "point": "活動 PT",
      "rank": "活動排名",
      "showAll": "檢視全部",
      "rankPanel": "活動排名（越靠上名次越好）",
      "allHidden": "點選上方圖例重新顯示資料",
      "zoomHint": "拖動選區縮放時間範圍"
    },
    "sort": {
      "time": "時間",
      "point": "活動 PT",
      "rank": "排名"
    },
    "table": {
      "count": "共 {count} 場",
      "title": "活動歷史",
      "event": "活動",
      "type": "類型",
      "date": "開始日期",
      "point": "活動 PT",
      "rank": "排名",
      "rankFromHonor": "缺少具體排名資料，檔位由活動牌子推斷"
    },
    "worldLink": {
      "chapters": "{count} 章",
      "showChapters": "展開章節",
      "hideChapters": "收起章節",
      "chapterLabel": "第 {no} 章",
      "finale": "終章"
    }
  },
  "musicProgress": {
    "description": "打歌進度與可獲取獎勵",
    "title": "打歌進度",
    "rewards": {
      "title": "可獲取資源",
      "hint": "未領取的評分與連擊成就獎勵，任意模式均計入",
      "unavailable": "上傳的資料缺少成就領取記錄，重新上傳完整資料後才能統計獎勵",
      "jewel": "水晶",
      "coin": "金幣",
      "shard": "碎片",
      "scoreRank": "評分獎勵",
      "allClaimed": "已全部領取"
    },
    "scoreRank": {
      "title": "評分獎勵明細",
      "description": "評分遞進（C → B → A → S），達到更高評分也會拿到較低評分的獎勵，任意模式均計入",
      "summary": "已獲得：{obtained} · 可獲取：{remaining} · 已拿滿 {complete} / {total} 首",
      "totalHint": "含曲庫全部歌曲；上方各難度只計有該難度譜面的歌曲",
      "none": "無",
      "filter": {
        "label": "只看",
        "all": "全部",
        "remaining": "未拿滿",
        "none": "未達成"
      },
      "sort": {
        "label": "排序",
        "remaining": "可獲取水晶",
        "music": "歌曲順序",
        "rank": "當前評分"
      },
      "visible": "顯示 {shown} / {total} 首",
      "current": "當前評分 {rank}",
      "currentNone": "尚未達成任何評分",
      "step": "{rank} 評分：{rewards}",
      "stepReached": "{rank} 評分：{rewards}（已達成）",
      "complete": "已拿滿",
      "empty": "沒有符合條件的歌曲",
      "showMore": "顯示更多（還有 {count} 首）"
    },
    "refresh": "重新整理",
    "retry": "重試",
    "noAccount": "先選擇或綁定一個遊戲帳號",
    "loading": "正在載入上傳的資料與樂曲資料…",
    "missingUserData": "當前帳號還沒有上傳遊戲資料，請先前往上傳資料頁面完成上傳",
    "missingGrantedData": "該帳號的所有者還沒有上傳遊戲資料，暫時無法檢視",
    "uploadData": "前往上傳資料",
    "noResults": "上傳的資料裡沒有遊玩記錄，所有歌曲顯示為未遊玩",
    "suiteError": "打歌進度載入失敗",
    "downloading": "正在下載遊戲資料庫（{progress}%）...",
    "overallTitle": "全難度概覽",
    "levelsTitle": "按定數統計",
    "noSongs": "所選區服在該難度下暫無歌曲",
    "level": "Lv.{level}",
    "levelUnknown": "Lv.?",
    "songCount": "{count} 首",
    "songFilter": {
      "label": "只看",
      "all": "全部",
      "notAllPerfect": "未 AP",
      "notFullCombo": "未 FC",
      "notCleared": "未通關"
    },
    "sections": {
      "collapseAll": "全部摺疊",
      "expandAll": "全部展開"
    },
    "matchCount": "{count} / {total} 首",
    "noMatches": "該定數下沒有符合條件的歌曲",
    "rewardsRemaining": "可獲取：{list}",
    "detailSummary": "共 {total} 首 · 已通關 {cleared} · FC {fullCombo} · AP {allPerfect}",
    "legend": {
      "allPerfect": "All Perfect",
      "fullCombo": "Full Combo（非 AP）",
      "clear": "Clear（非 FC）",
      "unplayed": "未遊玩"
    },
    "status": {
      "allPerfect": "AP",
      "fullCombo": "FC",
      "clear": "CLEAR",
      "unplayed": "—"
    }
  },
  "globalSearch": {
    "title": "快速搜尋",
    "description": "搜尋遊戲資料和站內頁面",
    "placeholder": "搜尋名稱、拼音、羅馬音或 ID",
    "loading": "正在載入遊戲資料…",
    "loadFailed": "部分遊戲資料載入失敗",
    "retry": "重試",
    "empty": "沒有匹配的結果",
    "groups": {
      "page": "頁面",
      "character": "角色",
      "music": "歌曲",
      "card": "卡牌",
      "event": "活動",
      "gacha": "卡池",
      "story": "劇情"
    },
    "scopes": {
      "label": "搜尋範圍",
      "all": "全部"
    },
    "sections": {
      "recent": "最近開啟",
      "ongoing": "進行中的活動",
      "suggested": "常用頁面",
      "clearRecent": "清除"
    },
    "more": {
      "list": "在{page}中檢視全部 {count} 條",
      "scope": "顯示全部 {count} 條"
    },
    "meta": {
      "cardCount": "{count} 張卡牌",
      "episodes": "{count} 話",
      "storyKind": {
        "unit": "主線劇情",
        "event": "活動劇情",
        "special": "特別劇情"
      }
    },
    "scopeHint": "Tab 切換範圍",
    "footerRegion": "資料區服：{region}"
  },
  "costumes": {
    "dressup": {
      "description": "搭配服裝、頭飾和髮型，帶 3D 預覽",
      "title": "服裝搭配",
      "region": "區服",
      "character": "角色",
      "characterPlaceholder": "選擇角色",
      "body": "服裝",
      "head": "頭飾",
      "hair": "髮型",
      "partPlaceholder": "選擇部件",
      "searchPlaceholder": "搜尋名稱或 ID...",
      "empty": "沒有找到匹配項",
      "hairLockedHint": "該頭飾固定髮型，髮型選項不生效",
      "reset": "恢復預設",
      "rotateLeft": "向左轉",
      "rotateRight": "向右轉",
      "resetView": "回正",
      "zoomIn": "放大",
      "zoomOut": "縮小",
      "copyLink": "複製連結",
      "linkCopied": "連結已複製",
      "colorCount": "{count} 色",
      "linkCopyFailed": "複製失敗，請手動複製位址列",
      "loadError": "服裝資料載入失敗",
      "roleLoadError": "該角色的 3D 部件清單載入失敗",
      "retry": "重試"
    },
    "viewer": {
      "loadError": "3D 模型載入失敗",
      "retry": "重試",
      "idle": "選擇要預覽的服裝"
    }
  },
  "gachas": {
    "common": {
      "region": "區服",
      "loadError": "卡池資料載入失敗",
      "retry": "重試",
      "dateFallback": "待定"
    },
    "type": {
      "ceil": "井卡池",
      "normal": "普通卡池",
      "beginner": "新手卡池",
      "sunormal": "付費特典卡池",
      "subeginner": "新手特典卡池",
      "return": "迴歸卡池",
      "unknown": "其他"
    },
    "list": {
      "description": "歷屆卡池與出率",
      "title": "卡池圖鑑",
      "searchPlaceholder": "按名稱或 ID 搜尋…",
      "typeLabel": "類型",
      "allTypes": "全部類型",
      "statusLabel": "狀態",
      "allStatuses": "全部狀態",
      "yearLabel": "年份",
      "allYears": "全部年份",
      "cardLabel": "包含卡牌",
      "allCards": "全部卡牌",
      "cardSearchPlaceholder": "搜尋卡牌名或 ID...",
      "cardEmpty": "沒有找到卡牌",
      "removeCardFilter": "移除該卡牌篩選",
      "sortLabel": "排序",
      "filtersTitle": "篩選",
      "resetFilters": "重置篩選",
      "total": "共 {total} 個卡池",
      "empty": "沒有符合當前篩選條件的卡池"
    },
    "detail": {
      "back": "返回卡池一覽",
      "notFound": "當前區服沒有這個卡池（#{gachaId}），可切換區服再試",
      "pickups": "PICK UP 成員",
      "poolCards": "卡池全部卡牌",
      "rates": "提供機率",
      "rarity": "稀有度",
      "cardCount": "卡牌數",
      "baseRate": "基礎機率",
      "guaranteedRate": "保底機率",
      "guaranteedNote": "十連第 10 抽保底 {rarity} 及以上",
      "behaviors": "招募方式",
      "behaviorType": "類型",
      "spinCount": "抽數",
      "cost": "消耗",
      "executeLimit": "次數限制",
      "colorfulPass": "彩色通行證",
      "ceilItem": "兌換貼紙",
      "summary": "招募說明",
      "description": "注意事項"
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
      "once_a_week": "每週一次"
    },
    "costResource": {
      "jewel": "水晶",
      "paid_jewel": "付費水晶",
      "gacha_ticket": "招募券"
    }
  },
  "playerProfile": {
    "description": "帳號的遊戲檔案",
    "title": "我的檔案",
    "source": {
      "realtime": "即時資料",
      "snapshot": "上傳的資料"
    },
    "noAccountHint": "綁定並選擇遊戲帳號後檢視檔案",
    "loadError": "檔案資料載入失敗",
    "retry": "重試",
    "refresh": "重新整理",
    "realtimeAsOf": "即時資料更新時間：{time}",
    "unknownCharacter": "未知角色",
    "stats": {
      "title": "遊玩統計"
    },
    "snapshotNote": "來自上傳的資料 · 上傳時間 {time}",
    "unitAverage": "各團均值",
    "header": {
      "title": "基本資訊",
      "rank": "Lv.{rank}",
      "gameId": "遊戲ID",
      "copy": "複製遊戲ID",
      "copied": "遊戲ID已複製",
      "copyFailed": "複製失敗"
    },
    "deck": {
      "title": "當前卡組",
      "empty": "暫無卡組資料"
    },
    "badge": {
      "level": "Lv.{level}"
    },
    "music": {
      "title": "歌曲通關統計",
      "progress": "進度",
      "total": "總數"
    },
    "headline": {
      "allPerfect": "All Perfect",
      "fullCombo": "Full Combo",
      "collection": "卡牌收集率",
      "challenge": "挑戰 Live 最高分",
      "latestEvent": "最近活動排名"
    },
    "roster": {
      "title": "角色總覽",
      "rarityFilter": "按稀有度統計卡牌收集",
      "otherUnit": "其他",
      "challenge": "挑戰"
    },
    "multiLive": {
      "title": "多人 Live",
      "mvp": "MVP 次數",
      "superStar": "SuperStar 次數"
    },
    "characters": {
      "title": "角色等級",
      "rank": "Rank {rank}",
      "empty": "暫無角色資料"
    },
    "challenge": {
      "title": "挑戰Live",
      "summary": "最高分數：{name} · {score}",
      "empty": "暫無挑戰Live記錄"
    },
    "links": {
      "eventRecords": "活動記錄",
      "characterMissions": "角色任務",
      "challengeDetail": "挑戰資訊"
    },
    "collection": {
      "title": "角色卡牌收集",
      "summary": "已收集 {owned}/{total} · {percent}%",
      "empty": "暫無卡牌資料"
    },
    "partialUpload": {
      "title": "以下模組需要上傳的遊戲資料",
      "description": "卡牌收集、挑戰 Live 和活動 Pt 走勢來自上傳的帳號資料（Suite）"
    }
  },
  "training": {
    "layout": {
      "description": "各角色的養成進度",
      "title": "角色養成",
      "refresh": "重新整理"
    },
    "tabs": {
      "challenge": "挑戰資訊",
      "power": "加成資訊",
      "area": "區域道具",
      "bonds": "牽絆",
      "leader": "隊長次數",
      "missions": "角色任務"
    },
    "challenge": {
      "title": "挑戰資訊",
      "noAccountHint": "綁定並選擇遊戲帳號後檢視挑戰資訊",
      "loadError": "挑戰資料載入失敗",
      "retry": "重試",
      "refresh": "重新整理",
      "unknownCharacter": "未知角色",
      "summary": "最高:{name} · {score}",
      "charactersWithData": "已挑戰角色:{count} / {total}",
      "empty": "暫無挑戰演出記錄",
      "sortByCharacter": "按角色",
      "sortByScore": "按分數",
      "scoreLabel": "分數",
      "stageLabel": "挑戰等級",
      "unclaimedLabel": "可領取獎勵",
      "jewel": "水晶 ×{count}",
      "shard": "水晶碎片 ×{count}",
      "allClaimed": "獎勵已全部領取"
    },
    "power": {
      "title": "加成資訊",
      "noAccountHint": "綁定並選擇遊戲帳號後檢視加成資訊",
      "loadError": "加成資料載入失敗",
      "retry": "重試",
      "refresh": "重新整理",
      "unknownCharacter": "未知角色",
      "sharedAreaTitle": "全形色區域道具",
      "allCharacterBonus": "全形色基礎加成",
      "multiUnitBonus": "多團體條件加成",
      "sharedAreaHint": "全形色加成已計入下方各角色；多團體加成是否生效看實際編成",
      "charactersTitle": "角色綜合力加成",
      "unitsTitle": "組合加成",
      "attrsTitle": "屬性加成",
      "rankBonus": "角色等級",
      "areaItemBonus": "區域道具",
      "fixtureBonus": "MYSEKAI 家具",
      "gateBonus": "MYSEKAI 大門",
      "total": "合計",
      "characterColumn": "角色",
      "unitColumn": "團體",
      "attrColumn": "屬性",
      "gateHint": "虛擬歌手按已有門的最高等級計算；帶支援團體的卡用該團體的門",
      "units": {
        "light_sound": "Leo/need",
        "idol": "MORE MORE JUMP!",
        "street": "Vivid BAD SQUAD",
        "theme_park": "Wonderlands×Showtime",
        "school_refusal": "25時,在Nightcord。",
        "piapro": "VIRTUAL SINGER"
      },
      "attrs": {
        "cute": "可愛",
        "cool": "帥氣",
        "pure": "純潔",
        "happy": "快樂",
        "mysterious": "神秘"
      }
    },
    "bonds": {
      "title": "牽絆",
      "noAccountHint": "綁定並選擇遊戲帳號後檢視牽絆資訊",
      "loadError": "牽絆資料載入失敗",
      "retry": "重試",
      "refresh": "重新整理",
      "unknownCharacter": "未知角色",
      "filterLabel": "角色",
      "filterAll": "全部角色",
      "count": "共 {count} 對",
      "level": "牽絆 Lv.{level}",
      "charaRank": "Rank {rank}",
      "needExp": "距下一級還需 {exp} 經驗",
      "maxLevel": "已滿級",
      "notOwned": "尚未解鎖",
      "empty": "暫無牽絆資料",
      "showRewards": "檢視各等級獎勵",
      "rewardsTitle": "各等級獎勵(已達成的置灰)",
      "rewards": {
        "jewel": "水晶 ×{count}",
        "material": "{name} ×{count}",
        "materialFallback": "材料 ×{count}",
        "bondsHonor": "牽絆牌匾 Lv.{level}",
        "bondsHonorWord": "牌匾文字",
        "stamp": "表情貼紙",
        "boostItem": "體力道具 ×{count}",
        "cutInVoice": "牽絆語音",
        "other": "其他獎勵"
      }
    },
    "area": {
      "title": "區域道具",
      "description": "各等級加成與所需材料",
      "refresh": "重新整理",
      "retry": "重試",
      "loadError": "區域道具資料載入失敗",
      "noAccountHint": "綁定並選擇遊戲帳號後即可檢視區域道具",
      "empty": "當前篩選條件下沒有區域道具",
      "filters": {
        "unit": "團體",
        "attr": "屬性",
        "character": "角色",
        "tree": "樹",
        "flower": "花",
        "allCharacters": "全形色",
        "special": "其他",
        "all": "全部"
      },
      "level": "Lv.{level}",
      "bonus": "+{bonus}%",
      "multiUnitTarget": "多團體編成",
      "multiUnitBonus": "多團體條件加成 +{bonus}%",
      "maxed": "已達當前可升級的最高等級",
      "notInShop": "商店暫未開放",
      "canUpgrade": "可升級",
      "nextLevel": "下一級",
      "nextBonus": "下級加成",
      "showAll": "全部等級",
      "materialsLegend": "材料：擁有 / 所需",
      "materialEnough": "數量足夠",
      "materialShort": "數量不足"
    },
    "leader": {
      "title": "隊長次數",
      "refresh": "重新整理",
      "retry": "重試",
      "loadError": "隊長統計資料載入失敗",
      "noAccountHint": "綁定並選擇遊戲帳號後即可檢視隊長統計",
      "limit": "任務上限 {count}",
      "exLimit": "EX 上限 {count}",
      "sortByTotal": "按次數",
      "sortByCharacter": "按角色",
      "normalLabel": "通常",
      "exLevel": "EX Lv.{level}",
      "unknownCharacter": "未知角色"
    },
    "missions": {
      "title": "角色任務",
      "refresh": "重新整理",
      "retry": "重試",
      "loadError": "角色任務資料載入失敗",
      "noAccountHint": "綁定並選擇遊戲帳號後即可檢視角色任務",
      "empty": "暫無角色任務資料",
      "character": "角色",
      "unknownCharacter": "角色{id}",
      "rank": "Lv.{rank}",
      "currentExp": "當前經驗",
      "pendingExp": "待領取經驗",
      "projected": "領取後預計",
      "projectedValue": "Lv.{level}（經驗 {exp}）",
      "basicGroup": "基礎任務",
      "achievementGroup": "成就任務",
      "exRound": "EX 第 {round} 輪",
      "types": {
        "play_live": "隊長次數",
        "play_live_ex": "隊長次數(EX)",
        "waiting_room": "休息室次數",
        "waiting_room_ex": "休息室次數(EX)",
        "collect_costume_3d": "服裝",
        "collect_stamp": "表情",
        "read_area_talk": "區域對話",
        "read_card_episode_first": "卡面劇情前篇",
        "read_card_episode_second": "卡面劇情後篇",
        "collect_another_vocal": "Another Vocal",
        "area_item_level_up_all_character": "提升全形色區域道具等級",
        "area_item_level_up_character": "單人家具升級次數",
        "area_item_level_up_unit": "團家具升級次數",
        "area_item_level_up_reality_world": "屬性道具（樹&花）升級次數",
        "collect_member": "卡面",
        "skill_level_up_rare": "技能等級升級次數（★4&生日卡）",
        "skill_level_up_standard": "技能等級升級次數（★1~★3）",
        "master_rank_up_rare": "專精等級升級次數（★4&生日卡）",
        "master_rank_up_standard": "專精等級升級次數（★1~★3）",
        "collect_character_archive_voice": "台詞",
        "collect_mysekai_fixture": "MySekai家具數量",
        "collect_mysekai_canvas": "MySekai畫布數量",
        "read_mysekai_fixture_unique_character_talk": "MySekai對話"
      }
    }
  },
  "searchAlias": {
    "badge": "別名"
  },
  "sekaiRegion": {
    "followAccount": "跟隨當前帳號",
    "followAccountResolved": "跟隨當前帳號（{region}）",
    "followBadge": "跟隨帳號",
    "labels": {
      "jp": "日服",
      "en": "國際服",
      "tw": "台服",
      "kr": "韓服",
      "cn": "國服"
    }
  },
  "sekaiUnreleased": {
    "badge": "未上線"
  },
  "navigation": {
    "groups": {
      "recommendAndAbout": "推薦與關於",
      "friendshipRecommendation": "友情推薦",
      "eventRankingTools": "活動衝榜工具",
      "projectSekai": "Project SEKAI工具",
      "accountManagement": "帳號與管理",
      "harukiBot": "HarukiBot相關",
      "sekaiCatalog": "Sekai 圖鑑",
      "sekaiPlayer": "我的遊戲資料"
    },
    "items": {
      "friendGroups": "推薦群聊",
      "friendLinks": "友情連結",
      "sponsors": "贊助者名單",
      "deckRecommend": "組卡推薦",
      "eventPlanner": "活動規劃",
      "rankBorder": "榜線查詢",
      "about": "關於",
      "ptCalculator": "控分計算",
      "uploadData": "上傳資料",
      "sekaiStation": "協力車站",
      "botNeoRegistration": "HarukiBot NEO 註冊",
      "musicLibrary": "歌曲一覽",
      "cards": "卡牌一覽",
      "events": "活動圖鑑",
      "cardBox": "我的卡牌",
      "eventRecords": "活動記錄",
      "musicProgress": "打歌進度",
      "gachas": "卡池圖鑑",
      "costumes": "服裝搭配",
      "storyPlayer": "劇情播放",
      "playerProfile": "我的檔案",
      "training": "角色養成"
    },
    "notFound": {
      "title": "頁面不存在",
      "backHome": "返回首頁",
      "backPrevious": "返回上一頁"
    }
  },
  "webLayout": {
    "nav": {
      "home": "首頁",
      "harukiBotGroup": "HarukiBot相關",
      "admin": "管理後台",
      "myTickets": "我的工單",
      "pendingTicketReplies": "{total} 個工單等待你回覆",
      "settings": "設定"
    },
    "scrollJump": {
      "top": "回到頂部",
      "bottom": "跳到底部"
    },
    "footer": {
      "copyright": "Seiunx Network & Haruki Dev Team. 保留所有權利。",
      "privacyPolicy": "隱私政策",
      "termsOfService": "服務條款",
      "legalLinks": "法律條款",
      "unofficialNotice": "Haruki 工具箱與 SEGA / Colorful Palette 不存在隸屬、授權、背書或官方合作關係",
      "assetCopyright": "相關遊戲資產版權歸 SEGA / Colorful Palette 所有",
      "appVersion": "應用版本",
      "version": "版本",
      "gitCommit": "Git 提交",
      "buildTime": "構建時間"
    }
  },
  "route": {
    "sponsorFrames": "贊助頭像框",
    "afdianCallback": "愛發電授權結果",
    "home": "主頁",
    "notFound": "頁面不存在",
    "settings": "設定",
    "privacy": "隱私政策",
    "tos": "服務條款",
    "about": "關於",
    "friendGroups": "推薦群聊",
    "friendLinks": "友情連結",
    "sponsors": "贊助者名單",
    "deckRecommend": "組卡推薦",
    "rankBorder": "榜線查詢",
    "rankBorderDetail": "榜線詳情",
    "ptCalculator": "控分計算",
    "clientConfigGenerator": "Client 配置生成器",
    "uploadData": "上傳資料",
    "sekaiStation": "協力車站",
    "botNeoRegistration": "HarukiBot NEO 註冊",
    "login": "登入",
    "register": "註冊帳號",
    "verification": "驗證信箱",
    "resetPassword": "重置密碼",
    "error": "身份錯誤",
    "userSettings": "帳號設定",
    "userIdentitySettings": "登入與安全",
    "userIdentityProfileSettings": "使用者資料設定",
    "userIdentityPasswordSettings": "修改密碼",
    "userIdentityMfaSettings": "兩步驗證",
    "userIdentitySocialSettings": "社交登入設定",
    "userIdentitySessionSettings": "登入裝置",
    "gameAccountBindings": "遊戲帳號管理",
    "harukiBotAuthorization": "HarukiBot資料授權",
    "oauthAuthorizations": "已授權的應用",
    "oauthLogin": "繼續登入授權",
    "oauthConsent": "授權第三方應用",
    "oauthLogout": "退出登入確認",
    "oauthDevice": "裝置授權",
    "tickets": {
      "mine": "我的工單",
      "create": "建立工單",
      "detail": "工單詳情"
    },
    "musicLibrary": {
      "list": "曲庫",
      "detail": "歌曲詳情",
      "progress": "打歌進度"
    },
    "cards": {
      "list": "卡牌一覽",
      "detail": "卡牌詳情",
      "box": "我的卡牌"
    },
    "events": {
      "list": "活動圖鑑",
      "detail": "活動詳情",
      "records": "活動記錄"
    },
    "gachas": {
      "list": "卡池圖鑑",
      "detail": "卡池詳情"
    },
    "costumes": {
      "dressup": "服裝搭配"
    },
    "story": {
      "player": "劇情播放"
    },
    "playerProfile": {
      "me": "我的檔案"
    },
    "training": {
      "challenge": "挑戰資訊",
      "power": "加成資訊",
      "area": "區域道具",
      "bonds": "牽絆",
      "leader": "隊長次數",
      "missions": "角色任務"
    },
    "eventPlanner": {
      "planner": "活動規劃"
    },
    "admin": {
      "layout": "管理後台",
      "dashboard": "儀表盤",
      "users": "使用者管理",
      "userDetail": "使用者詳情",
      "oauthClients": "OAuth客戶端管理",
      "webhooks": "Webhook 管理",
      "logs": "系統日誌",
      "uploadLogs": "上傳日誌",
      "content": "內容運營",
      "sponsors": "贊助者管理",
      "config": "系統配置",
      "gameBindings": "遊戲綁定管理",
      "risk": "風控管理",
      "botSecurity": "Bot 安全告警",
      "tickets": "工單管理"
    }
  },
  "musicLibrary": {
    "eventBox": {
      "short": "{name} {count}箱",
      "title": "{name}的第{count}箱活動曲"
    },
    "list": {
      "description": "歌曲、難度與收錄資訊",
      "title": "曲庫",
      "filters": {
        "region": "區服",
        "search": "搜尋",
        "searchPlaceholder": "按標題或別名搜尋...",
        "searchPlaceholderNoAlias": "按標題搜尋...",
        "title": "篩選",
        "difficulty": "難度",
        "difficultyAll": "全部難度",
        "level": "等級範圍",
        "levelMin": "最低",
        "levelMax": "最高",
        "noteCount": "物量",
        "noteCountMode": {
          "exact": "精確",
          "range": "範圍"
        },
        "noteCountExactPlaceholder": "如 886",
        "noteCountMin": "最少",
        "noteCountMax": "最多",
        "tag": "標籤",
        "character": "角色",
        "characterAll": "全部角色",
        "characterScope": {
          "any": "全部相關",
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
        "reset": "重置篩選"
      },
      "sort": {
        "publishedAt": "發布時間",
        "level": "難度等級",
        "noteCount": "物量",
        "title": "標題"
      },
      "results": {
        "count": "共 {count} 首歌曲",
        "empty": "沒有符合當前篩選條件的歌曲",
        "aliasSearching": "正在匹配別名..."
      },
      "downloading": "正在下載遊戲資料庫... {progress}%",
      "loadError": "曲庫資料載入失敗：{message}",
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
      "vocaloid": "虛擬歌手",
      "light_music_club": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands x Showtime",
      "school_refusal": "25時，Nightcord見。",
      "other": "其他",
      "event_box": "箱曲",
      "world_link": "WL（World Link）曲"
    },
    "categories": {
      "mv": "3D MV",
      "mv_2d": "2D MV",
      "image": "靜態畫面",
      "original": "原版 MV"
    },
    "vocalTypes": {
      "original_song": "原曲",
      "sekai": "SEKAI 版",
      "virtual_singer": "虛擬歌手版",
      "another_vocal": "Another Vocal",
      "instrumental": "伴奏",
      "april_fool_2022": "2022 愚人節版"
    },
    "detail": {
      "back": "返回曲庫",
      "notFound": "當前區服沒有這首歌曲（#{musicId}），可切換區服再試",
      "loadError": "曲目資料載入失敗：{message}",
      "unknownCharacter": "未知",
      "aliases": {
        "title": "歌曲別名",
        "showMore": "還有 {count} 個",
        "showLess": "收起"
      },
      "info": {
        "composer": "作曲",
        "lyricist": "作詞",
        "arranger": "編曲",
        "publishedAt": "發布時間",
        "duration": "時長",
        "bpm": "BPM",
        "id": "ID"
      },
      "difficultiesTitle": "難度資訊",
      "table": {
        "difficulty": "難度",
        "level": "等級",
        "noteCount": "物量"
      },
      "vocalsTitle": "Vocal 版本",
      "vocalsEmpty": "暫無 Vocal 版本",
      "play": "播放",
      "pause": "暫停",
      "chartPreview": {
        "title": "譜面預覽",
        "modeDynamic": "動態",
        "modeStatic": "靜態",
        "loadError": "譜面載入失敗",
        "retry": "重試",
        "seek": "播放進度",
        "speed": "流速",
        "zoomFit": "適應高度",
        "zoom": "縮放比例",
        "silent": "未找到音訊，靜音播放"
      },
      "eventsTitle": "關聯活動"
    }
  },
  "cards": {
    "common": {
      "region": "區服",
      "loadError": "卡牌資料載入失敗",
      "retry": "重試"
    },
    "list": {
      "description": "卡牌、技能與卡面",
      "title": "卡牌一覽",
      "searchPlaceholder": "搜尋卡牌稱號…",
      "sortLabel": "排序",
      "total": "共 {total} 張卡牌",
      "empty": "沒有符合當前篩選條件的卡牌"
    },
    "filter": {
      "title": "篩選",
      "characters": "角色",
      "units": "團體",
      "attrs": "屬性",
      "rarity": "稀有度",
      "supply": "供給類型",
      "year": "年份",
      "yearAll": "全部年份",
      "clear": "清除篩選"
    },
    "sort": {
      "releaseDesc": "最新優先",
      "rarityDesc": "稀有度",
      "idAsc": "卡牌 ID"
    },
    "unit": {
      "light_sound": "Leo/need",
      "idol": "MORE MORE JUMP!",
      "street": "Vivid BAD SQUAD",
      "theme_park": "Wonderlands×Showtime",
      "school_refusal": "25時，Nightcord見。",
      "piapro": "VIRTUAL SINGER"
    },
    "attr": {
      "cute": "可愛",
      "cool": "帥氣",
      "pure": "純潔",
      "happy": "快樂",
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
      "normal": "普通常駐",
      "birthday": "生日限定",
      "term_limited": "期間限定",
      "colorful_festival_limited": "Colorful Fes 限定",
      "bloom_festival_limited": "Bloom Fes 限定",
      "unit_event_limited": "WL（World Link）活動限定",
      "collaboration_limited": "聯動限定"
    },
    "detail": {
      "back": "返回圖鑑",
      "notFound": "當前區服沒有這張卡牌（#{cardId}），可切換區服再試",
      "artNormal": "特訓前",
      "artTrained": "特訓後",
      "artLoadFailed": "卡面載入失敗",
      "info": "卡牌資訊",
      "character": "角色",
      "unit": "團體",
      "supportUnit": "支援團體",
      "attr": "屬性",
      "rarity": "稀有度",
      "supply": "供給類型",
      "releaseAt": "上線時間",
      "gachaPhrase": "招募語音",
      "skill": "技能",
      "skillLevel": "等級",
      "skillValue": "數值",
      "skillDuration": "持續時間",
      "skillBeforeTraining": "特訓前",
      "skillAfterTraining": "特訓後",
      "noSkill": "暫無技能資料",
      "relatedEvents": "關聯活動",
      "relatedEventsEmpty": "沒有關聯活動",
      "relatedGachas": "關聯卡池",
      "relatedGachasEmpty": "沒有關聯卡池",
      "costumes": "卡牌服裝",
      "costumeDressup": "服裝搭配",
      "costumePreviewHint": "3D 預覽",
      "costumeSlot": {
        "body": "服裝",
        "hair": "髮型",
        "head": "頭飾"
      },
      "sameCharacter": "該角色的其他卡牌"
    }
  },
  "events": {
    "common": {
      "dateFallback": "—",
      "idLabel": "ID {id}"
    },
    "type": {
      "marathon": "馬拉松",
      "cheerful_carnival": "歡樂嘉年華",
      "world_bloom": "連線世界",
      "unknown": "未知類型"
    },
    "attr": {
      "cute": "可愛",
      "cool": "帥氣",
      "pure": "純潔",
      "happy": "快樂",
      "mysterious": "神秘"
    },
    "list": {
      "description": "歷屆活動與加成、獎勵",
      "title": "活動圖鑑",
      "regionLabel": "區服",
      "searchLabel": "搜尋",
      "searchPlaceholder": "按活動名或 ID 搜尋",
      "typeLabel": "活動類型",
      "attrLabel": "加成屬性",
      "yearLabel": "年份",
      "allTypes": "全部類型",
      "allAttrs": "全部屬性",
      "allYears": "全部年份",
      "filtersTitle": "篩選",
      "resultsCount": "共 {count} 個活動",
      "resetFilters": "重置篩選",
      "loadFailed": "活動資料載入失敗",
      "retry": "重試",
      "empty": "沒有符合當前篩選條件的活動"
    },
    "detail": {
      "back": "返回活動圖鑑",
      "loadFailed": "活動資料載入失敗",
      "retry": "重試",
      "notFound": "當前區服沒有這個活動（#{eventId}），可切換區服再試",
      "timelineTitle": "時間線",
      "timeline": {
        "start": "開始",
        "aggregate": "結算",
        "closed": "關閉"
      },
      "countdownToStart": "距開始",
      "countdownToAggregate": "距結算",
      "countdownValue": "{days}天 {hours}小時 {minutes}分 {seconds}秒",
      "bonusTitle": "活動加成",
      "bonusEmpty": "該活動暫無加成資料",
      "bonusAttrOnly": "所有{attr}卡片",
      "chaptersTitle": "World Link 章節",
      "chapterLabel": "第 {no} 章",
      "chapterFinale": "終章",
      "cardsTitle": "活動卡片",
      "cardsEmpty": "該活動暫無卡片",
      "links": {
        "rankBorder": "檢視榜線",
        "deckRecommend": "檢視組卡推薦",
        "story": "播放劇情"
      }
    }
  },
  "musicPlayer": {
    "label": "音樂播放器",
    "play": "播放",
    "pause": "暫停",
    "seek": "播放進度",
    "vocal": "切換演唱版本",
    "vocalsTitle": "演唱版本（切換時不中斷播放）",
    "volume": "音量",
    "mute": "靜音",
    "unmute": "取消靜音",
    "close": "關閉播放器",
    "openSong": "檢視歌曲詳情",
    "error": "音訊載入失敗，請稍後重試",
    "singerSeparator": "、",
    "playSong": "播放 {title}",
    "nowPlaying": "正在播放"
  },
  "homeSettings": {
    "title": "Haruki工具箱設定",
    "description": "線路、外觀、語言和資料快取",
    "trigger": "設定",
    "tabs": {
      "preferences": "偏好設定",
      "app": "應用",
      "sekaiData": "遊戲資料庫",
      "userData": "使用者資料"
    },
    "resetDialog": {
      "title": "重置偏好設定？",
      "description": "線路、外觀、語言、低特效、隱私和播放偏好將恢復預設",
      "confirm": "確認重置"
    },
    "endpoint": {
      "label": "伺服器線路",
      "help": "海外連線不穩時可試 CDN",
      "placeholder": "請選擇線路",
      "direct": "直連",
      "cdn": "CDN",
      "unavailable": "當前環境沒有配置可用的伺服器線路",
      "checking": "測速中",
      "unknown": "未測速",
      "failed": "無法連線",
      "latencyMs": "{ms} ms",
      "refreshLatency": "重新測速"
    },
    "assetEndpoint": {
      "label": "資產線路",
      "help": "卡面和音訊的下載線路，首次訪問時自動選最快的",
      "placeholder": "請選擇線路",
      "global": "海外推薦",
      "chinaCdn": "中國大陸推薦（騰訊雲）",
      "checking": "測速中",
      "unknown": "未測速",
      "failed": "無法連線",
      "latencyMs": "{ms} ms"
    },
    "theme": {
      "label": "外觀主題",
      "placeholder": "請選擇主題",
      "light": "淺色",
      "dark": "深色",
      "system": "跟隨系統"
    },
    "locale": {
      "label": "介面語言",
      "placeholder": "請選擇語言",
      "zhCN": "簡體中文",
      "enUS": "English",
      "zhTW": "繁體中文"
    },
    "visualEffects": {
      "label": "低特效模式",
      "help": "關閉毛玻璃和陰影，更省電"
    },
    "privacy": {
      "hideGameUserIdLabel": "隱藏遊戲 UID",
      "hideGameUserIdHelp": "只顯示前 2 位和後 4 位"
    },
    "unreleased": {
      "showLabel": "展示未上線內容",
      "blurLabel": "未上線內容防劇透模糊"
    },
    "appUpdate": {
      "title": "應用更新",
      "installedTitle": "當前版本",
      "current": "已是最新",
      "available": "有新版本",
      "remoteVersion": "遠端版本",
      "remoteCommit": "遠端 Git 提交",
      "remoteBuildTime": "遠端構建時間",
      "checkedAt": "最近檢查：{time}",
      "lastError": "檢查失敗，請稍後重試",
      "notCheckedYet": "尚未檢查",
      "check": "檢查更新",
      "checking": "檢查中...",
      "update": "更新應用",
      "updating": "更新中..."
    },
    "userData": {
      "refreshHint": "檢查伺服器上有沒有更新的上傳；個人檔案直接從遊戲伺服器獲取",
      "groups": {
        "source": "選擇資料",
        "cache": "快取狀態"
      },
      "account": "帳號",
      "accountPlaceholder": "請選擇已綁定帳號",
      "noAccount": "還沒有綁定遊戲帳號",
      "dataType": "資料類型",
      "types": {
        "suite": "帳號資料（Suite）",
        "mysekai": "烤森資料（MySekai）",
        "profile": "個人檔案（Profile）"
      },
      "cacheUpdatedAt": "本地快取",
      "remoteUploadTime": "上傳時間",
      "lastCheck": "最近檢查",
      "never": "無快取",
      "cacheHit": "已是最新",
      "cacheUpdated": "已更新",
      "notChecked": "未檢查",
      "refresh": "重新整理使用者資料",
      "refreshing": "重新整理中...",
      "clear": "清理使用者資料快取",
      "clearDialog": {
        "title": "清理使用者資料快取？",
        "description": "清除本瀏覽器裡這個帳號的使用者資料快取，之後需要重新下載",
        "confirm": "確認清理"
      },
      "toast": {
        "alreadyCurrent": "使用者資料已是最新",
        "refreshed": "使用者資料已重新整理",
        "refreshFailed": "使用者資料重新整理失敗",
        "cleared": "使用者資料快取已清理",
        "clearFailed": "使用者資料快取清理失敗"
      }
    },
    "toast": {
      "reset": "設定已重置為預設值"
    },
    "groups": {
      "appearance": "外觀",
      "network": "網路",
      "privacy": "隱私與內容",
      "music": "歌曲播放",
      "reset": "重置"
    },
    "reset": {
      "label": "恢復預設設定"
    },
    "music": {
      "preferredVocal": {
        "label": "優先演唱版本",
        "options": {
          "sekai": "SEKAI 版",
          "original": "原曲（原版）"
        }
      }
    }
  },
  "core": {
    "auth": {
      "sessionExpiredTitle": "會話已過期",
      "sessionExpiredDescription": "請重新登入",
      "accountBannedTitle": "帳號已被封禁",
      "permissionDeniedTitle": "權限不足",
      "loginRequiredTitle": "請先登入",
      "loginRequiredDescription": "該頁面需要登入後訪問",
      "requireAdminDescription": "需要管理員權限",
      "requireSuperAdminDescription": "需要超級管理員權限",
      "apiRequestFailedTitle": "請求失敗",
      "apiRequestFailedDescription": "伺服器暫時無法處理這個請求，請稍後重試",
      "permissionDeniedDescription": "你沒有執行這個操作的權限。如果你認為這是誤判，請聯絡管理員。",
      "accountBannedDescription": "你的帳號已被封禁，無法繼續使用。如有疑問請聯絡管理員。",
      "accountBannedWithReason": "你的帳號已被封禁，無法繼續使用。封禁原因：{reason}",
      "reauthRequired": "需要重新驗證密碼"
    },
    "errors": {
      "network": "網路連線失敗，請檢查網路後重試",
      "timeout": "請求超時，請稍後重試",
      "rateLimited": "操作太頻繁，請稍等片刻後再試",
      "serverUnavailable": "伺服器暫時不可用，請稍後重試（錯誤碼 {status}）",
      "forbidden": "沒有權限訪問此內容。如果你認為這是誤判，請聯絡管理員。",
      "unexpectedPayload": "伺服器返回的資料格式不符合預期，請重新整理重試；如果持續出現，請聯絡管理員",
      "detail": "詳情：{detail}"
    },
    "loadError": {
      "title": "載入失敗",
      "description": "請檢查網路後重試",
      "retry": "重試"
    },
    "sync": {
      "successTitle": "同步設定成功",
      "failedTitle": "同步設定不可用",
      "failedDescription": "雲端設定同步失敗，請稍後重試",
      "missingUpdatedDataDescription": "雲端設定返回的資料不完整，請重新整理後重試",
      "unexpectedStatusDescription": "雲端設定請求返回了異常狀態（{status}）"
    },
    "suitePrefetch": {
      "progressTitle": "正在獲取遊戲資料",
      "progressDescription": "已完成 {completed}/{total} 個綁定帳號",
      "successTitle": "遊戲資料已更新",
      "successDescription": "已更新 {updated}/{total} 個綁定帳號的遊戲資料",
      "partialTitle": "部分帳號的遊戲資料獲取失敗",
      "partialDescription": "{failed}/{total} 個帳號獲取失敗，進入相關頁面時會自動重試",
      "failedDescription": "獲取綁定帳號的遊戲資料失敗，進入相關頁面時會自動重試"
    },
    "unsupportedBrowser": {
      "title": "請用瀏覽器開啟",
      "descriptionApp": "{app}自帶的網頁視窗用不了工具箱，換到瀏覽器開啟就好",
      "descriptionGeneric": "App 自帶的網頁視窗用不了工具箱，換到瀏覽器開啟就好",
      "stepsTitle": "怎麼換到瀏覽器開啟",
      "stepMenu": "點右上角的{icon}按鈕",
      "stepMenuAnywhere": "找到頁面的選單或分享按鈕，圖示多半是{icon}",
      "cornerLabel": "按鈕就在這上面",
      "copyFirstTitle": "複製連結，到瀏覽器裡開啟",
      "menuAltTitle": "也可以試試直接切換",
      "menuAltTitleApp": "也可以試試在{app}裡直接切換",
      "stepOpenIos": "選擇「在 Safari 中開啟」或「用瀏覽器開啟」",
      "stepOpenAndroid": "選擇「在瀏覽器開啟」或類似選項",
      "stepDone": "頁面會在瀏覽器裡重新開啟，之後直接在瀏覽器裡使用即可",
      "fallbackTitle": "找不到這個選項？",
      "fallbackBody": "複製下面的連結，貼上到瀏覽器的位址列開啟，推薦用 {browsers}",
      "browsers": {
        "ios": "Safari 或 Chrome",
        "android": "Chrome 或手機自帶瀏覽器",
        "other": "Chrome、Edge、Firefox 或 Safari"
      },
      "linkLabel": "頁面連結",
      "copyLink": "複製連結",
      "copied": "已複製，去瀏覽器貼上開啟吧",
      "copyFailed": "複製失敗，請長按上面的連結手動複製",
      "deviceHint": "要授權裝置，請在瀏覽器裡開啟這個連結，再手動輸入裝置上顯示的代碼",
      "apps": {
        "wechat": "微信",
        "qq": "QQ",
        "weibo": "微博",
        "dingtalk": "釘釘",
        "alipay": "支付寶",
        "douyin": "抖音",
        "tiktok": "TikTok"
      }
    },
    "pwa": {
      "updateAvailableTitle": "發現新版本",
      "updateAvailableDescriptionWithVersion": "版本 {version}",
      "updateAction": "更新應用",
      "laterAction": "稍後",
      "applyingTitle": "正在更新應用",
      "applyingDescription": "完成後頁面會自動重新整理",
      "currentTitle": "應用已是最新",
      "checkFailedTitle": "檢查更新失敗",
      "checkFailedDescription": "請稍後重試",
      "offlineReadyTitle": "離線快取已準備好",
      "devTitle": "開發模式",
      "devDescription": "開發模式下不會註冊 PWA 更新流程",
      "forcedUpdateTitle": "當前版本已停止支援",
      "forcedUpdateDescription": "正在更新到 {version}……",
      "forcedUpdateWithInputDescription": "頁面將在一分鐘後重新整理並更新到 {version}，請先複製需要保留的輸入內容",
      "chunkErrorTitle": "部分頁面內容載入失敗",
      "chunkErrorDescription": "可能已發布新版本，請重新整理頁面後繼續",
      "reloadAction": "重新整理頁面"
    }
  },
  "catalog": {
    "region": {
      "label": "區服"
    },
    "search": {
      "label": "搜尋",
      "clear": "清除搜尋"
    },
    "filters": {
      "title": "篩選",
      "reset": "重置篩選",
      "clearAll": "清除全部",
      "done": "完成",
      "sheetDescription": "調整篩選條件，結果會立即更新"
    },
    "results": {
      "count": "共 {count} 項",
      "empty": "沒有符合當前篩選條件的內容",
      "loadError": "資料載入失敗",
      "retry": "重試",
      "downloading": "正在下載遊戲資料… {progress}%",
      "offline": "離線資料",
      "offlineHint": "本地快取的遊戲資料，可能不是最新"
    },
    "sort": {
      "label": "排序",
      "asc": "升序",
      "desc": "降序"
    },
    "view": {
      "label": "檢視",
      "grid": "網格",
      "list": "列表"
    },
    "pagination": {
      "label": "分頁",
      "first": "第一頁",
      "prev": "上一頁",
      "next": "下一頁",
      "last": "最後一頁",
      "page": "第 {page} 頁",
      "pageOf": "{page} / {total}",
      "pageSize": "每頁數量",
      "perPage": "每頁 {size}",
      "jump": "跳轉到頁碼",
      "summary": "共 {total} 項 · 第 {page} / {pages} 頁"
    },
    "status": {
      "upcoming": "即將開始",
      "ongoing": "進行中",
      "ended": "已結束",
      "upcomingHidden": "即將開始的內容已隱藏",
      "showUnreleased": "顯示未上線內容",
      "endsIn": "剩餘 {time}",
      "startsIn": "{time} 後開始",
      "permanent": "常駐",
      "tbd": "未定"
    },
    "countdown": {
      "toStart": "距開始",
      "toEnd": "距結束",
      "toAggregate": "距結算",
      "reached": "已到達",
      "days": "{days}天",
      "hours": "{hours}小時",
      "minutes": "{minutes}分",
      "seconds": "{seconds}秒"
    },
    "detail": {
      "backToList": "返回{list}",
      "breadcrumb": "頁面路徑",
      "notFound": "當前區服沒有這個條目，可切換區服再試",
      "loadError": "詳情資料載入失敗",
      "assetName": "內部名稱",
      "copyAssetName": "複製內部名稱",
      "assetNameCopied": "已複製內部名稱",
      "period": "期間",
      "viewAllCount": "檢視全部 ({count})",
      "zoom": "檢視大圖",
      "showMore": "展開",
      "showLess": "收起"
    },
    "lightbox": {
      "description": "圖片檢視器",
      "openInNewTab": "新標籤頁開啟",
      "items": "圖片",
      "tools": "圖片工具",
      "loading": "正在載入圖片…",
      "loadFailed": "圖片載入失敗，可以在新標籤頁開啟原圖",
      "rotateLeft": "逆時針旋轉 90°",
      "rotateRight": "順時針旋轉 90°",
      "flipHorizontal": "左右映象",
      "flipVertical": "上下映象",
      "crop": "裁剪",
      "applyCrop": "應用裁剪",
      "cropAspect": "裁剪比例",
      "cropFree": "自由",
      "undo": "撤銷上一步",
      "reset": "還原為原圖",
      "saveOriginal": "儲存原圖",
      "saveEdited": "儲存編輯後的圖片",
      "zoom": "縮放",
      "zoomIn": "放大",
      "zoomOut": "縮小",
      "zoomReset": "恢復適應螢幕"
    },
    "time": {
      "localLabel": "本地時間",
      "serverLabel": "{region}時間",
      "localTime": "本地時間：{time}",
      "switchLabel": "時間顯示的時區",
      "serverTime": "{region}時間：{time}",
      "hint": "按你的時區（{zone}）顯示，{region}時間為 {serverZone}",
      "sameZone": "你所在的時區（{zone}）與{region}時間一致"
    },
    "character": {
      "label": "角色",
      "toggleUnit": "切換 {unit} 全員"
    },
    "unit": {
      "label": "團體"
    },
    "attr": {
      "label": "屬性"
    },
    "rarity": {
      "label": "稀有度"
    },
    "year": {
      "label": "年份",
      "all": "全部年份"
    },
    "type": {
      "label": "類型"
    },
    "statusFilter": {
      "label": "狀態"
    }
  }
} as const
