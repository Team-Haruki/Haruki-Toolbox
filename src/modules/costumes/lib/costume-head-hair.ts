import type { RuntimeCostumeOption } from "./costume-options"
import { NONE_HEAD_COSTUME3D_IDS } from "./costume-series-order"

/** The role's head / hair rules: pairs that cannot be worn together, and the hair each head brings. */
export type HeadHairRules = {
  /** `${headCostume3dId}|${hairCostume3dId}` pairs of the unit that cannot be worn together. */
  notAvailable: ReadonlySet<string>
  /** head costume3dId → the hair it brings (costume3dModelDefaultHairs). */
  defaultHairs: ReadonlyMap<number, number>
}

type HeadChoice = Pick<RuntimeCostumeOption, "id" | "includesHair">

function overridesHair(head: HeadChoice, hairId: number | null, rules: HeadHairRules): boolean {
  if (NONE_HEAD_COSTUME3D_IDS.has(head.id)) {
    return false
  }
  return head.includesHair || (hairId != null && rules.notAvailable.has(`${head.id}|${hairId}`))
}

/**
 * Whether a head goes with the hair worn now, leaving it as it is: one the hair can be worn with (not a full head set,
 * not a pair the unit forbids), or one that overrides the hair with this very hair (a full head set of the worn
 * hair's own costume, costume3dModelDefaultHairs). The unset head always does.
 */
export function fitsWornHair(head: HeadChoice, hairId: number | null, rules: HeadHairRules): boolean {
  if (!overridesHair(head, hairId, rules)) {
    return true
  }
  return hairId != null && rules.defaultHairs.get(head.id) === hairId
}

/**
 * The hair to show with a newly chosen head. A head that overrides the hair (a full head set with its own hairstyle,
 * or one the hair worn now cannot go with) brings its default hair, when the role has it; otherwise the hair stays.
 */
export function hairForHead(
  head: HeadChoice,
  currentHairId: number | null,
  rules: HeadHairRules,
  hairIds: ReadonlySet<number>,
): number | null {
  if (!overridesHair(head, currentHairId, rules)) {
    return currentHairId
  }
  const hair = rules.defaultHairs.get(head.id)
  return hair != null && hairIds.has(hair) ? hair : currentHairId
}

/**
 * The head to keep with a newly chosen hair. A head that overrides the hair (a full head set, or one the new hair
 * cannot go with) comes off: the unset head, or the role's default head when it has no unset one.
 */
export function headForHair(
  currentHead: HeadChoice | null,
  hairId: number,
  rules: HeadHairRules,
  heads: readonly HeadChoice[],
  defaultHeadId: number | null,
): number | null {
  if (currentHead == null || !overridesHair(currentHead, hairId, rules)) {
    return currentHead?.id ?? null
  }
  const unset = heads.find((head) => NONE_HEAD_COSTUME3D_IDS.has(head.id))
  return unset?.id ?? defaultHeadId ?? currentHead.id
}
