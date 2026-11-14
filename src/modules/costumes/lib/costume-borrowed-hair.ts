/**
 * Experimental: wear another character's hairstyle, recoloured by the 3D engine with the colours of the
 * current character's own default hair (the recipe's `hairFromCharacterId`). Heads share one size within a gender,
 * so only characters of the same gender lend their hair for now (Mizuki, "secret" in the master, counts as female).
 */

/**
 * Characters whose default hair is not one hue (checked on their default hair textures, 2026-11-14): a root-to-tip
 * gradient (Saki, Tsukasa, Akito, Kanade) or a two-tone split (Toya). The engine maps colours by lightness, so their
 * palette lands on another hairstyle only approximately.
 */
export const MULTI_TONE_HAIR_CHARACTER_IDS: ReadonlySet<number> = new Set([2, 11, 12, 13, 17])

/** The 26 game characters. */
const GAME_CHARACTER_IDS = Array.from({ length: 26 }, (_, index) => index + 1)

/** The head size group of a gameCharacters gender: Mizuki ("secret") has the female head. */
function headGroup(gender: string | undefined): string | undefined {
  return gender === "secret" ? "female" : gender
}

/** Who can lend their default hair to `characterId`: the other game characters of the same head group, in id order. */
export function hairDonors(characterId: number, genderById: ReadonlyMap<number, string>): number[] {
  const group = headGroup(genderById.get(characterId))
  if (group == null) {
    return []
  }
  return GAME_CHARACTER_IDS.filter((id) => id !== characterId && headGroup(genderById.get(id)) === group)
}
