import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import { buildOutsideCharacterNameMap } from "./music-data"

/** One `releaseConditions` row (jp: `id, sentence, releaseConditionType[, …]`). */
export type MusicReleaseCondition = {
  id: number
  sentence: string
  releaseConditionType: string
}

/**
 * Detail-only lookups built by the `music-library/detail-extras` resource.
 * All three files are optional on some servers; missing ones simply leave
 * the maps empty (the sections hide themselves).
 */
export type MusicDetailExtras = {
  outsideCharacterNames: Map<number, string>
  releaseConditionsById: Map<number, MusicReleaseCondition>
  /** musicId → original MV link (`musicOriginals.videoLink`). */
  originalLinkByMusic: Map<number, string>
}

export function buildMusicReleaseConditionMap(rawReleaseConditions: unknown): Map<number, MusicReleaseCondition> {
  const map = new Map<number, MusicReleaseCondition>()
  for (const record of normalizeCatalogRecords(rawReleaseConditions)) {
    const id = normalizeCatalogNumber(record.id)
    const sentence = normalizeCatalogString(record.sentence)
    if (!id || !sentence) {
      continue
    }
    map.set(id, {
      id,
      sentence,
      releaseConditionType: normalizeCatalogString(record.releaseConditionType),
    })
  }
  return map
}

export function buildMusicOriginalLinkMap(rawMusicOriginals: unknown): Map<number, string> {
  const map = new Map<number, string>()
  for (const record of normalizeCatalogRecords(rawMusicOriginals)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const link = normalizeCatalogString(record.videoLink)
    if (musicId && isSafeExternalLink(link) && !map.has(musicId)) {
      map.set(musicId, link)
    }
  }
  return map
}

/** Only http(s) links are rendered as anchors. */
export function isSafeExternalLink(value: string): boolean {
  return /^https?:\/\/\S+$/i.test(value)
}

export function buildMusicDetailExtras(files: Record<string, unknown>): MusicDetailExtras {
  return {
    outsideCharacterNames: buildOutsideCharacterNameMap(files.outsideCharacters),
    releaseConditionsById: buildMusicReleaseConditionMap(files.releaseConditions),
    originalLinkByMusic: buildMusicOriginalLinkMap(files.musicOriginals),
  }
}

/** Hostname shown as the collapsed summary of the "original MV" section. */
export function resolveExternalLinkHost(link: string): string | null {
  try {
    return new URL(link).hostname.replace(/^www\./, "") || null
  } catch {
    return null
  }
}
