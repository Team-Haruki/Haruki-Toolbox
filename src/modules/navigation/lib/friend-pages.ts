/**
 * Small readers for the friend links and recommended groups pages. Kept out
 * of the components so they can be unit tested.
 */

/**
 * The host of a link, for the line under a site's name: "sekai.best" rather
 * than the full address. Drops a leading "www."; empty when the address does
 * not parse.
 */
export function resolveLinkHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./i, "")
  } catch {
    return ""
  }
}

/**
 * The group number inside a group's info text ("QQ 730020933" → "730020933"),
 * which is what a visitor pastes into the chat app's search. QQ group numbers
 * are 5 to 12 digits; anything else in the text (a platform name, a note) is
 * left out. null when the text carries no such number, so the page offers no
 * copy button for it.
 */
export function extractGroupNumber(groupInfo: string): string | null {
  for (const candidate of groupInfo.split(/\D+/)) {
    if (candidate.length >= 5 && candidate.length <= 12) {
      return candidate
    }
  }
  return null
}
