import type { RankBorderMode } from "./rank-border"

export type WorldBloomModeSelection = {
  mode: RankBorderMode
  worldBloomCharacterId: string | null
}

export type WorldBloomChapterChoice = {
  value: string
  active?: boolean
  chapterStartAt: number | null
}

/**
 * Keeps the total / World Link chapter selection valid for the selected
 * event. Chapters only exist when the event is a World Link event with at
 * least one started chapter; otherwise the view falls back to the total
 * leaderboard, whatever the persisted state or URL asked for. A chapter id
 * that does not belong to the event is replaced by the default chapter.
 *
 * `event === null` means the event is not resolved yet (master data still
 * loading, or an event the master data does not list): the selection is left
 * alone until there is something to validate against.
 */
export function resolveWorldBloomModeSelection(
  selection: WorldBloomModeSelection,
  event: { isWorldBloom: boolean } | null,
  chapters: readonly WorldBloomChapterChoice[],
  nowSeconds = Math.floor(Date.now() / 1000),
): WorldBloomModeSelection {
  if (!event) {
    return selection
  }
  if (!event.isWorldBloom || chapters.length === 0) {
    return { mode: "normal", worldBloomCharacterId: null }
  }
  if (selection.mode !== "world_bloom") {
    return selection
  }
  if (selection.worldBloomCharacterId && chapters.some((chapter) => chapter.value === selection.worldBloomCharacterId)) {
    return selection
  }
  return { mode: "world_bloom", worldBloomCharacterId: resolveDefaultWorldBloomChapter(chapters, nowSeconds) }
}

/** The running chapter, else the latest started one, else the first listed. */
export function resolveDefaultWorldBloomChapter(
  chapters: readonly WorldBloomChapterChoice[],
  nowSeconds = Math.floor(Date.now() / 1000),
): string | null {
  const active = chapters.find((chapter) => chapter.active)
  if (active) {
    return active.value
  }

  const started = chapters
    .filter((chapter) => chapter.chapterStartAt != null && chapter.chapterStartAt <= nowSeconds)
    .sort((a, b) => (b.chapterStartAt ?? 0) - (a.chapterStartAt ?? 0))

  return started[0]?.value ?? chapters[0]?.value ?? null
}

export function hasWorldBloomChapters(
  event: { isWorldBloom: boolean } | null,
  chapters: readonly WorldBloomChapterChoice[],
): boolean {
  return event?.isWorldBloom === true && chapters.length > 0
}
