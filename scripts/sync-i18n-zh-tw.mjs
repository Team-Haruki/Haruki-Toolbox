// Fills zh-TW locale bundles with OpenCC (s2twp) conversions of any keys
// that exist in zh-CN but are missing in zh-TW, without touching keys that
// were already (possibly hand-)translated. Run after adding zh-CN strings:
//   bun scripts/sync-i18n-zh-tw.mjs
import { writeFileSync } from "node:fs"
import * as OpenCC from "opencc-js"

const convert = OpenCC.Converter({ from: "cn", to: "twp" })
const BUNDLES = ["core", "catalog", "deck", "rank", "tools", "user-settings", "admin", "tickets", "public-pages"]

function fillMissing(source, target, stats) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === "string") {
      if (typeof target[key] !== "string") {
        target[key] = convert(value)
        stats.added += 1
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      if (target[key] == null || typeof target[key] !== "object") {
        target[key] = {}
      }
      fillMissing(value, target[key], stats)
    } else if (!(key in target)) {
      target[key] = structuredClone(value)
      stats.added += 1
    }
  }
}

// Rewrites target objects in the source's key order so zh-TW stays
// structurally aligned with zh-CN (filled keys otherwise append at the end).
function reorderLikeSource(source, target) {
  const out = {}
  for (const key of Object.keys(source)) {
    const sourceValue = source[key]
    const targetValue = target[key]
    out[key] =
      sourceValue && typeof sourceValue === "object" && !Array.isArray(sourceValue) &&
      targetValue && typeof targetValue === "object" && !Array.isArray(targetValue)
        ? reorderLikeSource(sourceValue, targetValue)
        : targetValue
  }
  return out
}

function dropOrphans(source, target, stats) {
  for (const key of Object.keys(target)) {
    if (!(key in source)) {
      delete target[key]
      stats.removed += 1
    } else if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      dropOrphans(source[key], target[key], stats)
    }
  }
}

for (const bundle of BUNDLES) {
  const zh = (await import(`../src/shared/i18n/messages/zh-CN/zh-CN-${bundle}.ts`)).default
  const twPath = `../src/shared/i18n/messages/zh-TW/zh-TW-${bundle}.ts`
  const tw = structuredClone((await import(twPath)).default)
  const stats = { added: 0, removed: 0 }
  fillMissing(zh, tw, stats)
  dropOrphans(zh, tw, stats)
  const ordered = reorderLikeSource(zh, tw)
  const header = "// AUTO-GENERATED zh-TW locale bundle (OpenCC s2twp from zh-CN).\n// Namespaces: " + Object.keys(ordered).join(", ") + "\n"
  writeFileSync(new URL(twPath, import.meta.url), header + "export default " + JSON.stringify(ordered, null, 2) + " as const\n")
  console.log(`zh-TW ${bundle}: +${stats.added} filled, -${stats.removed} orphaned`)
}
