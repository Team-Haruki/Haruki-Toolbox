import { pinyin } from "pinyin-pro"

const HAN_PATTERN = /\p{Script=Han}/u
const KANA_PATTERN = /[\u3041-\u30ff]/u
const DIACRITIC_PATTERN = /\p{Diacritic}/gu
const SEPARATOR_PATTERN = /[\s\p{P}\p{S}_]+/gu
const SPACE_PATTERN = /\s+/g
const ID_PREFIX_PATTERN = /^(?:#|id|no\.?)(\d+)$/i
const VARIANT_CACHE_LIMIT = 20_000
const variantCache = new Map<string, string[]>()

const KANA_DIGRAPH_ROMAJI: Readonly<Record<string, string>> = {
  きゃ: "kya",
  きゅ: "kyu",
  きょ: "kyo",
  ぎゃ: "gya",
  ぎゅ: "gyu",
  ぎょ: "gyo",
  しゃ: "sha",
  しゅ: "shu",
  しょ: "sho",
  じゃ: "ja",
  じゅ: "ju",
  じょ: "jo",
  ちゃ: "cha",
  ちゅ: "chu",
  ちょ: "cho",
  ぢゃ: "ja",
  ぢゅ: "ju",
  ぢょ: "jo",
  にゃ: "nya",
  にゅ: "nyu",
  にょ: "nyo",
  ひゃ: "hya",
  ひゅ: "hyu",
  ひょ: "hyo",
  びゃ: "bya",
  びゅ: "byu",
  びょ: "byo",
  ぴゃ: "pya",
  ぴゅ: "pyu",
  ぴょ: "pyo",
  みゃ: "mya",
  みゅ: "myu",
  みょ: "myo",
  りゃ: "rya",
  りゅ: "ryu",
  りょ: "ryo",
  ふぁ: "fa",
  ふぃ: "fi",
  ふぇ: "fe",
  ふぉ: "fo",
  ふゅ: "fyu",
  てぃ: "ti",
  でぃ: "di",
  とぅ: "tu",
  どぅ: "du",
  うぃ: "wi",
  うぇ: "we",
  うぉ: "wo",
  ゔぁ: "va",
  ゔぃ: "vi",
  ゔぇ: "ve",
  ゔぉ: "vo",
}

const KANA_ROMAJI: Readonly<Record<string, string>> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "o",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ゔ: "vu",
  ぁ: "a",
  ぃ: "i",
  ぅ: "u",
  ぇ: "e",
  ぉ: "o",
  ゃ: "ya",
  ゅ: "yu",
  ょ: "yo",
}

export function matchesCommandSearch(parts: readonly string[], search: string): boolean {
  const rawSearch = search.trim()
  if (!rawSearch) {
    return true
  }

  const haystack = buildCommandSearchEntries(parts)
  if (matchesAnyVariant(haystack, buildSearchVariants(rawSearch))) {
    return true
  }

  const tokens = tokenizeSearch(rawSearch)
  return tokens.length > 1 && tokens.every((token) =>
    matchesAnyVariant(haystack, buildSearchVariants(token)),
  )
}

export function buildCommandSearchEntries(parts: readonly string[]): string[] {
  const entries = new Set<string>()
  for (const part of parts) {
    for (const variant of buildSearchVariants(part)) {
      entries.add(variant)
    }
  }

  const joined = parts.filter(Boolean).join(" ")
  for (const variant of buildSearchVariants(joined)) {
    entries.add(variant)
  }

  return [...entries]
}

export function buildSearchVariants(value: string): string[] {
  const cacheKey = value
  const cached = variantCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const variants = new Set<string>()
  const normalized = normalizeSearchText(value)
  addNormalizedVariant(variants, normalized)

  const compactId = compactSearchText(normalized)
  const idMatch = ID_PREFIX_PATTERN.exec(compactId)
  if (idMatch) {
    addNormalizedVariant(variants, idMatch[1])
  }

  if (KANA_PATTERN.test(value)) {
    addRomajiVariants(variants, kanaToRomaji(value))
  }

  if (HAN_PATTERN.test(value)) {
    addPinyinVariants(variants, value)
  }

  const result = [...variants]
  if (variantCache.size > VARIANT_CACHE_LIMIT) {
    variantCache.clear()
  }
  variantCache.set(cacheKey, result)
  return result
}

function matchesAnyVariant(haystack: readonly string[], needles: readonly string[]) {
  return needles.some((needle) =>
    needle !== "" && haystack.some((entry) => entry.includes(needle)),
  )
}

function tokenizeSearch(value: string): string[] {
  return normalizeSearchText(value)
    .replace(SEPARATOR_PATTERN, " ")
    .split(" ")
    .filter(Boolean)
}

function addNormalizedVariant(variants: Set<string>, value: string | null) {
  if (!value) {
    return
  }

  variants.add(value)
  const compact = compactSearchText(value)
  if (compact) {
    variants.add(compact)
  }
}

function addRomajiVariants(variants: Set<string>, value: string | null) {
  const normalized = normalizeSearchText(value ?? "")
  addNormalizedVariant(variants, normalized)
  addNormalizedVariant(variants, normalized.replace(/([aeiou])\1+/g, "$1"))
  addNormalizedVariant(variants, normalized.replace(/ou/g, "o"))
  addNormalizedVariant(variants, normalized.replace(/vii/g, "vy"))
}

function addPinyinVariants(variants: Set<string>, value: string) {
  try {
    const words = pinyin(value, { toneType: "none", type: "array" })
      .map((item) => normalizeSearchText(item))
      .filter(Boolean)
    addNormalizedVariant(variants, words.join(" "))
    addNormalizedVariant(variants, words.join(""))
    addNormalizedVariant(variants, words.map((item) => item[0]).join(""))
  } catch {
    // Pinyin is only a search aid; the base text still remains searchable.
  }
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .toLowerCase()
    .replace(SPACE_PATTERN, " ")
    .trim()
}

function compactSearchText(value: string): string {
  return value.replace(SEPARATOR_PATTERN, "")
}

function kanaToRomaji(value: string): string | null {
  const kana = toHiragana(value.normalize("NFKC"))
  let result = ""
  let doubleNext = false
  let sawKana = false

  for (let index = 0; index < kana.length; index += 1) {
    const current = kana[index]
    if (!current) {
      continue
    }

    if (current === "っ") {
      doubleNext = true
      sawKana = true
      continue
    }

    if (current === "ー") {
      const vowel = lastVowel(result)
      if (vowel) {
        result += vowel
      }
      sawKana = true
      continue
    }

    const digraph = `${current}${kana[index + 1] ?? ""}`
    let romaji = KANA_DIGRAPH_ROMAJI[digraph]
    if (romaji) {
      index += 1
    } else {
      romaji = KANA_ROMAJI[current] ?? current
    }

    if (KANA_ROMAJI[current] || romaji !== current) {
      sawKana = true
    }

    if (doubleNext && /^[bcdfghjklmnpqrstvwxyz]/.test(romaji)) {
      result += romaji.startsWith("ch") ? "t" : romaji[0]
    }
    result += romaji
    doubleNext = false
  }

  return sawKana ? result : null
}

function toHiragana(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0)
    if (code >= 0x30A1 && code <= 0x30F6) {
      return String.fromCharCode(code - 0x60)
    }
    return character
  }).join("")
}

function lastVowel(value: string): string | null {
  for (let index = value.length - 1; index >= 0; index -= 1) {
    const character = value[index]
    if (character && "aeiou".includes(character)) {
      return character
    }
  }
  return null
}
