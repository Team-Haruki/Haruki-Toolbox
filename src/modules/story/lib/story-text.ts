import type { SekaiRegion } from "@/types"

/**
 * Text languages of the story player. Visuals and audio always come from the
 * JP scenario; another language replaces the dialogue with that region's
 * official text (aligned line by line) or with the backend's AI translation
 * for episodes the region does not have.
 */
export const STORY_TEXT_LANGS = ["ja", "zh-Hans", "zh-Hant", "en", "ko", "zh-Hans-ai"] as const
export type StoryTextLang = (typeof STORY_TEXT_LANGS)[number]

/** Official-text languages and the region whose scenario files carry them. */
export const STORY_LANG_REGIONS: Partial<Record<StoryTextLang, SekaiRegion>> = {
  ja: "jp",
  "zh-Hans": "cn",
  "zh-Hant": "tw",
  en: "en",
  ko: "kr",
}

export function isStoryTextLang(value: unknown): value is StoryTextLang {
  return typeof value === "string" && (STORY_TEXT_LANGS as readonly string[]).includes(value)
}

/**
 * Languages to try, in order, for a Toolbox locale: an explicit pick first,
 * then the locale's official text, then (for Chinese) the AI translation, and
 * JP as the last resort.
 */
export function storyLangChain(locale: string, picked: StoryTextLang | null): StoryTextLang[] {
  let chain: StoryTextLang[]
  if (locale === "zh-TW") chain = ["zh-Hant", "zh-Hans", "zh-Hans-ai", "ja"]
  else if (locale.startsWith("zh")) chain = ["zh-Hans", "zh-Hans-ai", "ja"]
  else if (locale.startsWith("en")) chain = ["en", "ja"]
  else chain = ["ja"]
  if (picked) chain = [picked, ...chain.filter((l) => l !== picked)]
  return chain
}

/** Minimal shape of the scenario fields text replacement touches. */
export type StoryTextScenario = {
  TalkData: { WindowDisplayName: string; Body: string }[]
  SpecialEffectData: { EffectType: number; StringVal: string }[]
}

// SpecialEffectType members whose StringVal is player-visible text:
// Telop, PlaceInfo, SimpleSelectable, FullScreenText.
const TEXT_EFFECTS = new Set([8, 18, 23, 24])

/** Kana share of the dialogue letters. */
export function storyKanaRatio(scn: StoryTextScenario): number {
  let letters = 0
  let kana = 0
  for (const t of scn.TalkData) {
    for (const ch of t.Body) {
      if (!/\p{L}/u.test(ch)) continue
      letters++
      if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(ch)) kana++
    }
  }
  return letters === 0 ? 0 : kana / letters
}

/**
 * Regions ship upcoming stories ahead of time with the untranslated JP text
 * (CN had events 188+ that way). Such a file is no translation.
 */
export function isPlaceholderText(scn: StoryTextScenario): boolean {
  return storyKanaRatio(scn) >= 0.3
}

/**
 * Copies another region's text onto the JP scenario when the two align line
 * by line (they normally do); returns null when they do not.
 */
export function applyRegionText<T extends StoryTextScenario>(jp: T, other: StoryTextScenario): T | null {
  if (other.TalkData.length !== jp.TalkData.length) return null
  const out: T = { ...jp }
  out.TalkData = jp.TalkData.map((t, i) => ({
    ...t,
    WindowDisplayName: other.TalkData[i].WindowDisplayName,
    Body: other.TalkData[i].Body,
  }))
  const fx = other.SpecialEffectData
  if (fx.length === jp.SpecialEffectData.length) {
    out.SpecialEffectData = jp.SpecialEffectData.map((e, i) =>
      TEXT_EFFECTS.has(e.EffectType) && fx[i].EffectType === e.EffectType ? { ...e, StringVal: fx[i].StringVal } : e,
    )
  }
  return out
}

/** The backend's AI translation of one episode. */
export type StoryTranslation = {
  scenarioId: string
  lang: string
  model: string
  names: Record<string, string>
  lines: string[]
  /** SpecialEffectData index → translated text effect (telop, place label, choices, full-screen text). */
  effects?: Record<string, string>
  updatedAt: string
}

/** Applies an AI translation; null when it does not fit the scenario. */
export function applyTranslation<T extends StoryTextScenario>(jp: T, tr: StoryTranslation): T | null {
  if (tr.lines.length !== jp.TalkData.length) return null
  const out: T = { ...jp }
  out.TalkData = jp.TalkData.map((t, i) => ({
    ...t,
    WindowDisplayName: tr.names[t.WindowDisplayName] ?? t.WindowDisplayName,
    Body: tr.lines[i] || t.Body,
  }))
  const effects = tr.effects ?? {}
  out.SpecialEffectData = jp.SpecialEffectData.map((e, i) => {
    const text = effects[String(i)]
    return text && TEXT_EFFECTS.has(e.EffectType) ? { ...e, StringVal: text } : e
  })
  return out
}

/** Font family group for a text language (Rodin has no simplified hanzi or hangul). */
export function storyFontScript(lang: StoryTextLang): "ja" | "zh" | "ko" | "latin" {
  if (lang === "ko") return "ko"
  if (lang === "en") return "latin"
  if (lang.startsWith("zh")) return "zh"
  return "ja"
}
