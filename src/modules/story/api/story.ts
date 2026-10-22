import { isAxiosError } from "axios"
import { request } from "@/core/http/call-api"
import type { StoryTranslation } from "@/modules/story/lib/story-text"

export type StoryTranslationResult =
  | { status: "done"; translation: StoryTranslation }
  /** A JP-only episode the backend has not translated yet. */
  | { status: "pending" }
  | { status: "unavailable" }

/** The AI zh-Hans translation of one episode, or why there is none. */
export async function getStoryTranslation(scenarioId: string): Promise<StoryTranslationResult> {
  try {
    const translation = await request<StoryTranslation>(
      `/api/misc/story/translations/${encodeURIComponent(scenarioId)}`,
      { method: "GET", params: { lang: "zh-Hans" } },
    )
    return { status: "done", translation }
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      const status = (error.response.data as { status?: unknown } | undefined)?.status
      return { status: status === "pending" ? "pending" : "unavailable" }
    }
    throw error
  }
}
