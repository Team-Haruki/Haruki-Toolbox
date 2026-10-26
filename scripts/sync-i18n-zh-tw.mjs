// Regenerates every zh-TW locale bundle from zh-CN with OpenCC (s2twp).
// The zh-TW bundles are fully auto-generated: EVERY string is re-converted on
// each run (so rewritten zh-CN copy never goes stale in zh-TW), key order
// follows zh-CN, orphan keys are dropped, and the TERM_FIXES below are applied
// to the converted output. Run after adding or editing zh-CN strings:
//   bun scripts/sync-i18n-zh-tw.mjs
import { writeFileSync } from "node:fs"
import * as OpenCC from "opencc-js"

const convert = OpenCC.Converter({ from: "cn", to: "twp" })

// OpenCC's twp phrase table picks mainland-flavoured or plain-wrong terms for
// a few words this UI uses everywhere; these are applied to every converted
// zh-TW string. Keep each entry to a Taiwan-standard term.
const TERM_FIXES = [
  [/賬號/g, "帳號"],
  [/賬戶/g, "帳戶"],
  [/繫結/g, "綁定"],
  [/資料型別/g, "資料類型"],
  [/許可權/g, "權限"],
  [/傢俱/g, "家具"],
  // 发布 -> 釋出 is software-release wording; UI dates/events use 發布.
  [/釋出/g, "發布"],
  // 参数 -> 引數 (argument); the Taiwan UI term is 參數.
  [/引數/g, "參數"],
  // 封停用户 is tokenised as 封 + 停用 + 戶; 用户 is 使用者 everywhere else.
  [/封停用戶/g, "封停使用者"],
  // 计划 -> 計劃; Taiwan spells it 計畫 (incl. the official game title 世界計畫).
  [/計劃/g, "計畫"],
  // Taiwan web UI uses 台 (台服, 平台, 後台, 舞台, 這台裝置), not 臺.
  [/臺/g, "台"],
  // 创建 is 建立 in the rest of the generated copy; "创建于" slips through as 創建.
  [/創建/g, "建立"],
  // Keep one verb for clicking.
  [/點擊/g, "點選"],
  // 邮箱 -> 郵箱 is mainland usage; Taiwan says 信箱 for email.
  [/郵箱/g, "信箱"],
  // 数据 is 資料 everywhere else; phrase-table leftovers like 數據延遲 slip through.
  [/數據/g, "資料"],
  // 全屏 (fullscreen) stays as-is through OpenCC; Taiwan says 全螢幕.
  [/全屏/g, "全螢幕"],
]

// Fixes that are only right inside one top-level namespace. OpenCC renders
// 项目 as 專案 (project), which is correct for the public pages, but the
// admin content manager's 项目 are list items (群聊項目).
const SCOPED_TERM_FIXES = {
  adminContent: [[/專案/g, "項目"]],
}

function applyTermFixes(value, fixes) {
  if (typeof value === "string") {
    return fixes.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
  }
  if (Array.isArray(value)) {
    return value.map((inner) => applyTermFixes(inner, fixes))
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, applyTermFixes(inner, fixes)]))
  }
  return value
}

// Converts every string of a zh-CN bundle; the result is in zh-CN key order
// and carries exactly the zh-CN key set, so stale values and orphans cannot
// survive a run.
function convertBundle(source) {
  if (typeof source === "string") {
    return convert(source)
  }
  if (Array.isArray(source)) {
    return source.map(convertBundle)
  }
  if (source && typeof source === "object") {
    return Object.fromEntries(Object.entries(source).map(([key, inner]) => [key, convertBundle(inner)]))
  }
  return source
}

function applyAllTermFixes(bundle) {
  return Object.fromEntries(
    Object.entries(bundle).map(([namespace, value]) => [
      namespace,
      applyTermFixes(value, [...TERM_FIXES, ...(SCOPED_TERM_FIXES[namespace] ?? [])]),
    ]),
  )
}

function collectLeaves(value, prefix, out) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, inner] of Object.entries(value)) {
      collectLeaves(inner, prefix ? `${prefix}.${key}` : key, out)
    }
  } else {
    out.set(prefix, value)
  }
  return out
}

// Compares the regenerated bundle against the previous zh-TW file so the log
// says what moved: new keys, re-converted keys whose text changed, orphans.
function diffStats(previous, next) {
  const before = collectLeaves(previous, "", new Map())
  const after = collectLeaves(next, "", new Map())
  const stats = { added: 0, changed: 0, removed: 0 }
  for (const [key, value] of after) {
    if (!before.has(key)) {
      stats.added += 1
    } else if (JSON.stringify(before.get(key)) !== JSON.stringify(value)) {
      stats.changed += 1
    }
  }
  for (const key of before.keys()) {
    if (!after.has(key)) {
      stats.removed += 1
    }
  }
  return stats
}

function renderBundle(ordered) {
  const header = "// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).\n// Namespaces: " + Object.keys(ordered).join(", ") + "\n"
  // Password-related UI strings trip credential detectors; keep the same
  // suppression marker the hand-written zh-CN bundles carry.
  const body = JSON.stringify(ordered, null, 2)
    .replace(/^(\s*"(?:passwordMinLength|passwordMismatch)": ".*",?)$/gm, "$1 // NOSONAR -- translation key, not a credential")
  return header + "export default " + body + " as const\n"
}

const BUNDLES = ["core", "catalog", "deck", "rank", "tools", "user-settings", "admin", "tickets", "public-pages"]
const ZH_CN_DIR = process.env.SYNC_I18N_ZH_CN_DIR ?? "../src/shared/i18n/messages/zh-CN/"
const ZH_TW_DIR = process.env.SYNC_I18N_ZH_TW_DIR ?? "../src/shared/i18n/messages/zh-TW/"

for (const bundle of BUNDLES) {
  const zh = (await import(`${ZH_CN_DIR}zh-CN-${bundle}.ts`)).default
  const twPath = `${ZH_TW_DIR}zh-TW-${bundle}.ts`
  const previous = (await import(twPath)).default
  const ordered = applyAllTermFixes(convertBundle(zh))
  const stats = diffStats(previous, ordered)
  writeFileSync(new URL(twPath, import.meta.url), renderBundle(ordered))
  console.log(`zh-TW ${bundle}: +${stats.added} added, ~${stats.changed} re-converted, -${stats.removed} orphaned`)
}
