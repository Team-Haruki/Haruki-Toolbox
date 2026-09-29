# JP 7.0.0 差异与 Toolbox 适配

核查日期：2026-09-30。本文区分客户端结构差异、master 快照变化和本仓库实际支持范围。

## 来源与复现

交接资料位于 `~/Documents/General/pjsk-jp-7.0.0/`，包含 `README.md`、`tools/parse_dump.py`、`tools/diff.py`、`il2cpp-diff-6.8.1-to-7.0.0.txt` 和两份 master schema 快照。客户端来源为 [middlered/sekay v6.8.1_ios](https://github.com/middlered/sekay/releases/tag/v6.8.1_ios) 与 [v7.0.0_ios](https://github.com/middlered/sekay/releases/tag/v7.0.0_ios) 的 `il2cpp_analysis.zip`。

重新对导出后的 `681.json`、`700.json` 执行交接目录的 `tools/diff.py`，输出与归档差异逐字节一致。新增 API 路径另外通过两版 `stringliteral.json` 差集核对。字段定义来自 `dump.cs` 的 `[Key]`，不能将“客户端声明字段”与“当前 master 每行都存在的字段”等同。

## 差异数量

| 对比范围 | 结果 |
| --- | --- |
| 客户端 SuiteMaster：6.8.1 → 7.0.0 | 新增 8 张表，无表删除或既有字段类型变更 |
| Master keyed 类 | 新增 12 类：8 个独立表、3 个 VirtualLive 嵌套对象、1 个未挂入 SuiteMaster 的类 |
| 既有 Master keyed 类 | 11 类新增 15 个字段 |
| SuiteUser | 新增 6 个 key |
| User keyed 类 | 新增 16 类，4 个既有类新增 6 个字段 |
| 游戏 API 路径 | 新增 3 条：首页看板卡、MySekai 批量采集、MySekai 商店兑换 |
| 脚本覆盖的 Sekai 命名空间枚举 | 33 组变化：18 个新枚举、15 个既有枚举变化 |
| master 快照：6.8.0.61 → 7.0.0.13 | 409 → 417 张表；7 张既有顶层表新增 10 个 JSON key；129 张既有表行数变化 |

App 6.8.0 / 6.8.1 的版本差异不代表 master 结构有差异；这里仅保留两份数据快照的版本标识，不推断它们在 6.8.0 与 6.8.1 之间发生过结构变化。129 张表的行数变化包含常规卡牌、活动和资源更新，不能全部归因于 7.0.0 新功能。交接 README 的“12 组枚举”是适配摘要，并非全部客户端枚举差异；脚本也没有统计所有命名空间。

新增的 8 张表与新快照行数：

| 表 | 行数 |
| --- | ---: |
| honorBackgrounds | 52 |
| honorWords | 52 |
| mysekaiShops | 25 |
| mysekaiShopCosts | 25 |
| mysekaiSiteBulkHarvests | 41 |
| mysekaiSiteBulkHarvestTargets | 18 |
| mysekaiSiteBulkHarvestTargetGroups | 4 |
| mysekaiBlueprintTermMysekaiMaterialCosts | 5 |

已有内容的主要变化：门新增 shuffle 类型及无等级数据的第 6 个门，原有 5 个门最高 70 级；区域道具 56 每级有全角色和多团体条件两行效果；称号增加自定义背景、文字和勋章；虚拟 Live 增加应援奖励、溢出奖励和替代消耗；蓝图增加分页、限定材料组及制作次数上限。`craftLimit`、`expiredAt` 等字段在客户端定义存在而快照可能缺省，读取应容错。

## 本仓库适配范围

- 组卡临时覆盖：显示全角色区域道具，保留普通效果和多团体条件标记，单个等级覆盖同时作用于该道具所有效果。门最高等级继续来自当前区服 master，无等级门不生成升级选项。原始多行 master 不做折叠。
- 养成区域道具：同道具同等级保留多行，分别展示基础加成与多团体条件加成；升级材料每级只计一次。
- 养成综合力：全角色基础效果计入各角色，多团体效果单独列出，不在缺少卡组信息时假定生效。VS 门加成按用户门最高等级选择，同等级保留用户数据顺序；选中无等级定义的门时贡献为 0。
- 角色任务：纳入 `area_item_level_up_all_character`。
- 称号：保留 `honorBackgroundId` / `honorWordId`，按可选 master 数据解析自定义资源，并保持旧数据回退。按 `isMedalDisplayed` 和等级显示勋章，新规则的星星每 10 级循环。
- 活动和招募奖励：补充 `honor_background`、`honor_word`、`virtual_item` 三语标签。
- 上传和共享 suite 缓存：已有 Blob / 开放记录透传，无新增字段白名单限制，无需修改上传协议。

所有启用条件来自实际 master 表、字段或资源，不按 JP 或客户端版本写死；新资源只由使用它的功能按需加载。

## 规则核查边界

`multi_unit` 不属于 `Sekai.UnitType`，不加入通用团体枚举。客户端另有 `CardUtility.MultiUnitBonusEvaluation`（ByDeck / ForceOn / ForceOff），它不在原始脚本筛选的 Sekai 命名空间中。

多团体规则应引用交接记录的逐卡集合判定，不能独立使用“含 VS 即多团体”的简化句。全无 support 的 VS 队伍是例外，空队伍和单卡也需要按实际算法处理。区域道具与同团加成互斥的反编译细节沿用交接记录；本次 IDA worker 无法打开数据库，未重新确认其控制流。

交接 README 的两处补充：用户称号资源的 ID 字段是 `honorBackgroundId`、`honorWordId`，不是 `id`；新增资源字符串还包含 `honor_medal/medal`。

## 上游依赖与未覆盖功能

项目固定的 npm `haruki-sekai-deck-recommend-cpp` 已升级为 0.4.1。后续无等级门的上游 PR #9 和多团体加成 PR #10 已合并至提交 `ab800540`；对该提交本地编译的 WASM 已使用真实 suite 完成 53 项断言验证，结果见 [组卡引擎本地验证](jp-7.0.0-engine-validation.md)。

0.3.8 的问题仍可复现：拥有门 6 会报缺少等级数据，多团体编成会漏算道具 56 的条件效果。本地修复版及正式 npm 0.4.1 均通过这两个场景和全部 53 项集成断言；Toolbox 9.4.0 已更新精确依赖及锁文件。

Toolbox 当前没有虚拟 Live 应援、MySekai 商店兑换、批量采集或蓝图制作页面，此次不新增这些游戏操作入口，也不直接调用客户端游戏 API。服务端数据库新表部署、抓包上传脚本和其他项目的适配不在本仓库验证范围。国际服 6.0.0 是否包含部分新表未独立核实，兼容行为仍按表是否存在决定。

## 资源与验证

已只读检查公开资产节点的实际导出文件：背景 `startapp/honor_background/honor_bg_style_01_01/degree_sub.png` 为 180×80，`degree_main.png` 为 380×80；文字平铺为 `startapp/honor_word/honor_word_01_01_01.png` 至 `_04.png`，均为 380×80（编号是两位，不能用 `_1`）；勋章当前导出 `startapp/honor_medal/medal/icon_degree_medal1.png`，64×72。

当前个人资料与榜线采用 `sub` 紧凑称号，不绘制 main 文字层；文字选择用于可访问名称，背景选择用于图片。完整 main 称号布局不在本次页面范围内。勋章规则依据已有客户端核查记录（`contracts/drawing-700.md`）：称号有等级表、组标记允许且等级 ≥11 时启用，档位为 `min(floor((level-1)/10),9)`。勋章使用 Toolbox 的紧凑排版，不声称还原 Unity prefab 坐标；未来档位素材缺失时经图片恢复流程后隐藏。

验证：`bun run quality`（lint、导入检查、typecheck、1268 项单元测试）通过；`bun run build` 通过；`bun run e2e` 的 21 项现有浏览器测试通过。单元回归覆盖效果行顺序、全角色/条件加成分离、缺省目标、升级材料不重复累计、40/70 级门与无等级门、最高等级选择及同级顺序、称号默认/跨组回退、旧区服无新表、实时自定义称号更新，以及勋章 10/11/20/21/91/100 级边界。
