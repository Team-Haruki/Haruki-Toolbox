// Where the reader left off: the last episode and its line, remembered per
// device so the page can offer "continue" after they navigated away.

export const STORY_RESUME_KEY = "story-player:resume"

export type StoryResume = {
  /** ScenarioId of the episode */
  sid: string
  /** snippet index reached */
  index: number
  /** when it was saved (ms) */
  at: number
}

/** Remembered positions older than this are not offered any more. */
export const RESUME_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/** A valid record from the stored JSON, or null. */
export function parseStoryResume(raw: string | null | undefined, now = Date.now()): StoryResume | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as unknown
    if (!value || typeof value !== "object") return null
    const { sid, index, at } = value as Record<string, unknown>
    if (typeof sid !== "string" || !/^[\w.-]{1,96}$/.test(sid)) return null
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0) return null
    if (typeof at !== "number" || !Number.isFinite(at) || now - at > RESUME_MAX_AGE_MS) return null
    return { sid, index, at }
  } catch {
    return null
  }
}

export function serializeStoryResume(resume: StoryResume): string {
  return JSON.stringify({ sid: resume.sid, index: resume.index, at: resume.at })
}

/** Only a position past the first lines is worth offering to continue from. */
export function isWorthResuming(resume: StoryResume | null, minIndex = 5): resume is StoryResume {
  return resume != null && resume.index >= minIndex
}

/** The stored record (best effort: private mode etc. gives null). */
export function readStoryResume(now = Date.now()): StoryResume | null {
  try {
    return parseStoryResume(localStorage.getItem(STORY_RESUME_KEY), now)
  } catch {
    return null
  }
}

export function writeStoryResume(resume: StoryResume | null): void {
  try {
    if (resume) localStorage.setItem(STORY_RESUME_KEY, serializeStoryResume(resume))
    else localStorage.removeItem(STORY_RESUME_KEY)
  } catch {
    /* private mode etc. */
  }
}
