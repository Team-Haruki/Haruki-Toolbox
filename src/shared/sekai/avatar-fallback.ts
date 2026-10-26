/**
 * Text stand-in for a character avatar whose icon has not loaded (or never
 * will): the first grapheme of a CJK name ("星乃一歌" → "星"), else the first
 * letter of the first word ("Hatsune Miku" → "H").
 */
export function resolveAvatarInitial(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim()
  if (!trimmed) {
    return "?"
  }
  const firstWord = trimmed.split(/\s+/)[0] ?? trimmed
  const first = [...firstWord][0] ?? "?"
  return first.toLocaleUpperCase()
}
