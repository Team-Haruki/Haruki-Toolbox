# 数据授权账号选择器:新 API 设计方案

> 目标:用户获得他人数据授权后,站内所有游戏账号选择器都能选到这些账号,并明确区分「我的绑定账号」与「他人授权的账号」。本方案不迁就现有 API,而是为选择器设计一个聚合端点作为唯一数据源,由后端适配;前端所有功能门控改为数据驱动。

## 一、现状问题(为什么要新 API)

1. 选择器数据源 `useGameAccountSelection()` 只读 `userStore.gameAccountBindings`(来自 `GET /api/user/{id}/get-settings`),只有本人绑定;收到的授权(`GET .../game-account-grants/received`)是设置弹窗里的孤岛,从未参与账号选择。
2. `received` 列表(后端 `gameAccountDataGrantItem`)只有 `ownerUserId`,没有授权方昵称/头像,直接拿来渲染选择器只能显示一串 UUID。
3. 授权按 `(server, gameUserId, dataType)` 一条一条存,前端要自行按账号去重聚合,还要自己复刻后端的有效性判断(owner 解绑/未验证/被封、过期)——这些谓词在 `CanAccessGameAccountData`(`utils/database/postgresql/game_account_data_grants_ops.go:100`)里,前端无法可靠复制,列表里看得到、读的时候 403 会常态化。
4. 各读取端点授权口径不一致:通用数据端点 `GET .../game-account/:server/:game_user_id/:data_type` 已走 `CanAccessGameAccountData`(含 ViaGrant、304);而 `recommend-data` 走 `validateVerifiedOwnedGameAccountBinding`(仅本人),profile 也仅本人。前端不得不为每个功能硬编码"授权账号能不能用"。

## 二、新 API:聚合可访问账号端点

### `GET /api/user/:toolbox_user_id/accessible-game-accounts`

鉴权同现有绑定路由(`RequireAuthenticatedSelf`)。返回当前用户**可读取数据的全部游戏账号**的归一化列表——本人绑定 + 有效授权,按账号(server + gameUserId)聚合,后端用与读取时完全相同的谓词预过滤。

```json
{
  "generatedAt": "2026-08-25T12:00:00Z",
  "accounts": [
    {
      "server": "jp",
      "gameUserId": "123456789",
      "ownership": "own",
      "verified": true,
      "isDefault": true,
      "capabilities": {
        "suite": {},
        "mysekai": {},
        "profile": {},
        "recommend": {}
      },
      "owner": null
    },
    {
      "server": "jp",
      "gameUserId": "987654321",
      "ownership": "granted",
      "verified": true,
      "isDefault": false,
      "capabilities": {
        "suite": { "expiresAt": "2026-09-30T00:00:00Z" },
        "mysekai": { "expiresAt": "2026-09-01T00:00:00Z" },
        "recommend": { "expiresAt": "2026-09-01T00:00:00Z" }
      },
      "owner": {
        "userId": "b7e2…",
        "name": "某某",
        "avatarPath": "/avatars/xx.png"
      }
    }
  ]
}
```

语义约定:

- **`capabilities` 是唯一的功能门控依据**:key 表示当前请求者对该账号可读的数据能力,值携带该能力的到期时间(本人账号无到期,空对象)。前端不再硬编码"授权账号在 X 功能可用/不可用"——某能力在不在 map 里说了算。以后新增可授权类型,前端选择器零改动。
- `recommend` 是**派生能力**,不是新的授权类型:表示 `recommend-data` 端点对该账号可用。本人恒有;授权账号按「三、2」的模式映射派生(card 模式需 suite,mysekai 模式需 suite+mysekai),`expiresAt` 取所依赖授权中最早的。
- `profile` 目前仅本人(`IsGrantableGameAccountDataType` 排除 profile,OAuth scope 同源),授权账号的 capabilities 里不会出现 profile;将来若放开,只需后端加上这个 key。
- **后端预过滤**:granted 条目仅在 owner 绑定仍 verified、owner/grantee 均未被封、授权未过期时返回(即复用 `CanAccessGameAccountData` 的全部谓词)。列表与读取结果保持"几乎一致",前端仍需容忍窗口期内的 403/404,但那是异常而非常态。
- 同一账号多条授权(不同 dataType)聚合为一个条目;`ownership` 只会是 `own` 或 `granted`(自己绑定的账号即使也被授权,按 own 返回)。
- 排序:own 在前(isDefault 优先),granted 按最近授权时间倒序。

### 后端实现要点(Haruki-Toolbox-Backend)

- 新 handler 放 `internal/modules/usergamebindings/`,注册进 `gameaccount.go` 的绑定路由组。
- 数据来源两段:① 本人绑定(现有 binding 查询);② `ListReceivedGameAccountDataGrants`(已按 `expiresAt > now` 过滤)基础上补三个谓词——owner 绑定 `verified`、owner 未封禁、grantee 未封禁,并 `WithUser` 带出 owner 的 `id/name/avatar_path`(`user.go` 已有 `Name`、`AvatarPath` 字段),一次 join 完成,避免 N+1。
- 按 `(server, gameUserId)` 聚合 dataType → capabilities;`recommend` 按模式映射派生。
- 该端点是读模型,不新增表、不迁移数据。

## 三、读取端点统一授权口径

选择器解决"看得到",还需要"读得动":

1. **通用数据端点**:`GET .../game-account/:server/:game_user_id/:data_type` 已走 `CanAccessGameAccountData`(含 304 条件请求),前端现有 suite/mysekai 缓存管线对授权账号零改动复用。✅ 无需改。
2. **`recommend-data`**(`recommend_data.go:67`):把 `validateVerifiedOwnedGameAccountBinding` 换成 `CanAccessGameAccountData`,模式映射:`challenge/event/…(card 类模式) → 需 suite`,`mysekai 模式 → 需 suite 且 mysekai`。与聚合端点的 `recommend` 派生规则保持同一份映射(建议提成共享函数,两处引用)。
3. **profile**:维持仅本人,作为后续扩展项(若放开:`IsGrantableGameAccountDataType` 加 `profile` + 授权管理 UI 加选项 + 聚合端点自然带出;注意 OAuth 侧 `oauth2/gamedata` 复用同一判断,需同步评估 scope 语义)。

## 四、前端方案

1. **数据源**:新共享 composable(如 `useAccessibleGameAccounts`)登录 hydration 后拉取聚合端点,缓存于 `useUserStore` 与 `gameAccountBindings` 并列;授权增删、绑定增删后失效重拉。选择器从它取数,`get-settings` 的 bindings 继续服务于账号管理页(隐私设置等),互不干扰。
2. **模型**:`SelectableGameAccount` 增加 `ownership`、`capabilities`、`owner`;key 命名空间化(own 保持现状,granted 用 `grant:{server}:{gameUserId}`),避免与已持久化的选中项冲突。
3. **UI**:`GameAccountSelect.vue` 用现有 `SelectGroup`/`SelectLabel` 分两组(「我的绑定账号」/「他人授权的账号」);`GameAccountOption.vue` 对 granted 条目显示 owner 昵称/头像 + 授权徽标 + 到期提示。i18n 三语(zh-CN / zh-TW / en-US)。
4. **功能门控(数据驱动)**:每个功能声明自身需要的能力(events/training/cards/music → `suite`,烤森相关 → `mysekai`,组卡 → `recommend`,player-profile → `profile`),选择器按 `capabilities` 过滤/禁用(禁用时带原因提示)。不再硬编码 ownership 判断。
5. **容错**:读取遇 403/404(列表生成后授权失效)时提示"授权已失效",触发聚合端点重拉,不弹全局错误。

## 五、实施顺序

1. 后端:聚合端点(二)+ `recommend-data` 授权统一(三、2),一并发布。
2. 前端:composable + 选择器分组 + 门控改造(四),对新端点联调。
3. 视需求再评估 profile 授权(三、3)。

新端点为纯增量,现有 `game-account-grants` 管理端点(owned/received/upsert/delete)不动,授权管理弹窗照旧;老前端不受影响,可平滑上线。

## 附:后续可选的授权体验改进(不阻塞本方案)

- **按邮箱/分享码授权**:当前 `PUT .../game-account-grants/:server/:game_user_id/:data_type/:grantee_user_id` 要求授权方知道对方的 toolbox UUID,人际间几乎不可用。可加 `POST .../game-account-grants/resolve-grantee`(邮箱 → userId,或生成一次性分享码由受权方兑换),再走现有 upsert。
- **received 列表补 owner 展示信息**:若聚合端点落地,选择器不再依赖它;但授权管理弹窗的"我收到的授权"页仍建议补 owner 昵称,与聚合端点复用同一 join。
