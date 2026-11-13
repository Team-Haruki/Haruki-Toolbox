import type { HarukiMotionEntry } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

export type CostumeMotionType = HarukiMotionEntry["motionType"]

/** The stage's default: the current role's own CostumeShop motion, following character and unit changes. */
export const MOTION_FOLLOW = "follow"

/** A motion as the recipe takes it; `motionRoleId` null is the role's own. */
export type CostumeMotionChoice = { motionType: CostumeMotionType; motionRoleId: string | null }

const MOTION_VALUE = /^(costume|result|preview):(\d+:[a-z_]+)$/

/** The `?motion=` / picker value of a motion: `<type>:<characterId>:<unit>`. */
export function motionValue(motion: Pick<HarukiMotionEntry, "motionType" | "motionRoleId">): string {
  return `${motion.motionType}:${motion.motionRoleId}`
}

/** The recipe motion of a picker value; null for an unknown value. */
export function parseMotionValue(value: string): CostumeMotionChoice | null {
  if (value === MOTION_FOLLOW) {
    return { motionType: "costume", motionRoleId: null }
  }
  const match = MOTION_VALUE.exec(value)
  return match ? { motionType: match[1] as CostumeMotionType, motionRoleId: match[2]! } : null
}

/**
 * The picker's order: each character's motions together (by character id, its units in the content's order, the
 * CostumeShop motion before the Live result one), then the preview loops.
 */
export function orderMotions(motions: readonly HarukiMotionEntry[]): HarukiMotionEntry[] {
  const typeOrder = { costume: 0, result: 1, preview: 2 } as const
  return motions
    .map((motion, index) => ({ motion, index }))
    .sort((a, b) => {
      const aPreview = a.motion.characterId == null
      const bPreview = b.motion.characterId == null
      if (aPreview !== bPreview) {
        return aPreview ? 1 : -1
      }
      return (a.motion.characterId ?? 0) - (b.motion.characterId ?? 0)
        || typeOrder[a.motion.motionType] - typeOrder[b.motion.motionType]
        || a.index - b.index
    })
    .map((entry) => entry.motion)
}
