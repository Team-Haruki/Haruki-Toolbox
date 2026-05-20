# Toolbox 组卡推荐接入计划

## 背景

Toolbox 将接入 `haruki-sekai-deck-recommend-cpp` 的 wasm 组卡推荐能力。前端负责拉取用户数据、维护分区服 master/meta 缓存、加载 wasm worker、展示参数表单和推荐结果。

组卡推荐不是一次性孤立功能。master data、music metas、asset URL 解析、活动选择、歌曲选择、角色选择、卡牌缩略图组装都需要做成可复用模块，后续活动功能、歌曲功能和其他 Sekai 工具也会复用。

## 数据源与缓存

### Master Data

- JP: `haruki-sekai-master`
- EN: `haruki-sekai-en-master`
- TW: `haruki-sekai-tc-master`
- KR: `haruki-sekai-kr-master`
- CN: `haruki-sekai-sc-master`

版本检查地址：

```text
https://sekai-master-cdn.haruki.seiunx.com/${repo}/versions/current_version.json?t=${nanoseconds}
```

版本规则：

- JP/EN 使用 `dataVersion` 作为展示版本和 JSON 拉取版本。
- TW/KR/CN 使用 `dataVersion` 作为展示版本，使用 `cdnVersion` 拉取具体 master JSON。

Master 更新应由后台异步队列处理。页面调用 `ensureSekaiData(region)` 后：

- 若已有可用缓存，立即使用缓存并后台检查更新。
- 若无缓存，页面显示当前 region 的准备状态。
- 下载、解析、IndexedDB 写入都应放在 worker 中，避免阻塞主线程。
- 新版本下载完成后再原子切换 active version，失败时保留旧缓存。

### Music Metas

Music metas 源：

- JP: `https://sekai-data.3-3.dev/music_metas.json`
- CN: `https://sekai-data.3-3.dev/music_metas-cn.json`
- TW: `https://sekai-data.3-3.dev/music_metas-tc.json`
- EN: `https://sekai-data.3-3.dev/music_metas-en.json`
- KR: `https://sekai-data.3-3.dev/music_metas-kr.json`

Music metas 与 master data 一起按区服缓存，但保持独立 key，方便单独刷新和诊断。

## 静态资源分发

### 游戏资源 CDN

卡牌、歌曲、活动等游戏资源使用可切换 asset endpoint：

- 中国用户优先：`https://sekai-assets.haruki.seiunx.com/{region}-assets`
- 海外用户优先：`https://sekai-assets-bdf29c81.seiunx.net/{region}-assets`

路径解析模块需要支持 `startapp` / `ondemand` fallback。例如卡牌缩略图：

```text
{assetBase}/{region}-assets/startapp/thumbnail/chara/{assetBundleName}_normal.png
{assetBase}/{region}-assets/startapp/thumbnail/chara/{assetBundleName}_after_training.png
```

### Toolbox 静态 UI 素材

Drawing API 使用的边框、属性、稀有度、突破等小图不属于 `{region}-assets`，需要单独做静态分发。计划在 `images.haruki.seiunx.com` 下划独立目录，例如：

```text
https://images.haruki.seiunx.com/sekai-toolbox/static_images/...
```

首批需要分发：

- 稀有度行标题 icon：一星、二星、三星、四星、生日。
- 卡牌边框：`static_images/card/frame_rarity_1.png` 等。
- 属性 icon：`static_images/card/attr_icon_*.png`。
- 星星/生日 icon：`rare_star_normal.png`、`rare_star_after_training.png`、`rare_birthday.png`。
- 突破 icon：`train_rank_0.png` 到 `train_rank_5.png`。
- 烤森画布 icon：`mysekai/icon/category_icon/icon_canvas.png`。
- 角色 icon：沿用 Drawing API 的 `static_images/chara_icon/*`。

前端应通过统一 resolver 生成这些 URL，不在组件里硬编码完整 CDN。

## 页面结构

新增 `src/modules/deck-recommend` 模块。

建议路由：

```ts
{
  path: "/deck-recommend",
  component: () => import("@/modules/deck-recommend/views/DeckRecommend.vue"),
  meta: { titleKey: "route.deckRecommend", requiresAuth: true },
}
```

页面采用工作台结构：

- 配置区：账号、数据服务器、组卡模式、Live 类型、活动/角色/歌曲/难度、养成配置、高级参数。
- 数据状态区：当前区服 master/meta 版本、后台更新队列、缓存状态。
- 结果区：运行状态、算法耗时、卡组结果、卡牌缩略图与指标。

## 表单控件

### 账号

账号选择使用登录用户的已绑定账号。默认数据服务器与账号区服一致，但允许用户切换数据服务器。

这样可以支持 EN/TW/KR/CN 用户使用自己的账号数据，尝试 JP 当前活动配置。

### 数据服务器

数据服务器决定：

- master data region
- music metas region
- asset region
- wasm `region`

用户数据仍来自账号所属区服的后端接口。

### 组卡模式

首批模式：

- 活动组卡
- 挑战组卡
- 加成组卡
- 烤森组卡
- 最强组卡：综合力最高
- 最强组卡：技能实效最高

模式映射到 wasm options 时保持一层纯函数，例如 `buildRecommendOptions(formState)`，便于测试。

### Live 类型

UI 展示：

- solo
- multi
- auto
- carnival

映射规则：

- `solo` -> wasm `solo`
- `multi` -> wasm `multi`
- `auto` -> wasm `auto`，挑战模式下为 `challenge_auto`
- `carnival` 仅作为 UI 文案可选项，实际传给 wasm 时应按 wasm `LiveType` 使用 `cheerful`
- 烤森模式强制 `mysekai`

### 活动选择

现阶段先使用 select，但必须抽成可替换模块：

- `EventSelect.vue`
- `useEventOptions(region)`
- `resolveEventOption(masterData, eventId)`

后续活动功能会扩展筛选、当前活动、活动类型、属性、组合、WL 章节等能力，组卡页面不应直接耦合复杂筛选逻辑。

### 歌曲选择

现阶段先使用 select，但同样抽成可替换模块：

- `MusicSelect.vue`
- `useMusicOptions(region)`
- `resolveMusicDifficulties(musicId, musicMetas, masterData)`

歌曲难度必须根据当前歌曲实际存在的难度渲染。

后续歌曲功能会加入筛选、排序、别名搜索、难度筛选等能力，组卡页面只消费选择结果。

### 角色选择

角色数据来自 master `gameCharacters.json`：

- 使用角色 ID 映射名字。
- select option 左侧显示角色 icon。
- 角色 icon 使用统一静态资源 resolver，不在组件里拼死路径。

建议拆成：

- `CharacterSelect.vue`
- `useCharacterOptions(region)`
- `resolveCharacterIconUrl(characterId)`

## 卡牌养成配置

使用 data table 展示稀有度配置。

行：

- 一星
- 二星
- 三星
- 四星
- 生日

行标题渲染为：

```text
[icon_image]([一星/二星/三星/四星/生日])
```

列：

- 禁用
- 满级
- 前后篇
- 满突破
- 满技能
- 烤森画布

默认值：

| 稀有度 | 禁用 | 满级 | 前后篇 | 满突破 | 满技能 |
| --- | --- | --- | --- | --- | --- |
| 一星 | 否 | 是 | 是 | 是 | 是 |
| 二星 | 否 | 是 | 是 | 是 | 是 |
| 三星 | 否 | 是 | 是 | 是 | 是 |
| 四星 | 否 | 是 | 是 | 否 | 否 |
| 生日 | 否 | 是 | 是 | 否 | 否 |

注意：这与 Haruki-Cloud 现有默认值略有不同。Toolbox UI 按此表作为默认值。

## wasm 调用

wasm 推荐必须放在 worker 中执行。主线程负责表单状态和结果展示，worker 负责：

- 创建 `haruki-sekai-deck-recommend-cpp` engine。
- 加载 master data。
- 加载 music metas。
- 执行 recommend。
- 返回结果、耗时、错误。

加成组卡的 `target=bonus` 应折叠到 DFS 精确求解语义。烤森 `rl` 可以沿用 Cloud 思路补 `ga`、`dfs_ga` fallback。

## 结果展示与缩略图

推荐结果卡牌需要结合 master 和 wasm 返回值组装：

- `card_id`
- `level`
- `master_rank`
- `skill_level`
- `skill_score_up`
- `event_bonus_rate`
- `episode1_read`
- `episode2_read`
- `after_training`
- `default_image`
- `has_canvas_bonus`

缩略图规则参考 Drawing API `get_card_full_thumbnail` 和 Cloud `BuildCardThumbnail`：

- 卡面本体来自 `{region}-assets`。
- frame、attr、rare star、train rank 来自 `images.haruki.seiunx.com` 的 Toolbox 静态素材目录。
- `default_image` 优先决定展示花前/花后卡面，避免 BFes 双技能卡展示错误。
- `after_training` 表示拥有卡状态，不能简单等同于展示卡面。

首版可以用纯前端 DOM/CSS 叠图，后续如果需要导出图片，再考虑 canvas 复刻 Drawing API 的组合流程。

## 模块建议

共享层：

- `src/shared/sekai/master-data`
- `src/shared/sekai/music-metas`
- `src/shared/sekai/assets`
- `src/shared/sekai/update-queue`

组卡模块：

- `src/modules/deck-recommend/views/DeckRecommend.vue`
- `src/modules/deck-recommend/components/DeckRecommendForm.vue`
- `src/modules/deck-recommend/components/CardTrainingConfigTable.vue`
- `src/modules/deck-recommend/components/DeckResultList.vue`
- `src/modules/deck-recommend/components/CardThumbnail.vue`
- `src/modules/deck-recommend/components/EventSelect.vue`
- `src/modules/deck-recommend/components/MusicSelect.vue`
- `src/modules/deck-recommend/components/CharacterSelect.vue`
- `src/modules/deck-recommend/api/recommend-data.ts`
- `src/modules/deck-recommend/lib/options.ts`
- `src/modules/deck-recommend/lib/card-thumbnail.ts`
- `src/modules/deck-recommend/workers/recommend.worker.ts`

## 分阶段实现

1. 建立共享 Sekai 数据层：region/repo 映射、version resolver、URL resolver、IndexedDB cache、后台更新队列。
2. 接入 Toolbox 静态图片 CDN resolver，并准备首批 `static_images` 素材路径表。
3. 建立可替换的活动、歌曲、角色 select 组件。
4. 搭建组卡页面表单和养成配置 data table。
5. 接入后端 recommend-data API 和 wasm worker，跑通最小推荐链路。
6. 实现结果展示、卡面缩略图叠图和算法耗时展示。
7. 加入设置页缓存管理、PWA/service worker runtime cache 和更多筛选能力。
