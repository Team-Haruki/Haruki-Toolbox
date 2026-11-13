import type { CostumeSlot } from "./costume-options"

/**
 * The game's costume list order (7.1.0 Sekai.CostumeSelectSortOrder.GetSortValue and CostumeSelectCell.ViewData's
 * Get*SortValue / IsSameGroup / MasterCostume3DDataModel.ConvertGroupId): when a part's list opens, the worn costume
 * comes first, then the costumes of the same series as the other two worn parts, then the rest. A lower value sorts
 * earlier; ties keep the list's own order. Every costume counts as unlocked here (the game's Locked* values do not
 * apply to a dress-up tool).
 */

/** CostumeUtility.None3dIds: the 31 "未設定" (unset) head costumes, 1, 3, …, 61. */
export const NONE_HEAD_COSTUME3D_IDS: ReadonlySet<number> = new Set(Array.from({ length: 31 }, (_, index) => index * 2 + 1))

type SeriesKey = { digit: number; groupId: number }

/**
 * MasterCostume3DDataModel's GroupIdDigit / GroupId. Group ids above 1000 name their series by thousands; a non-head
 * costume's small default group (1..100) joins the head-less default series at +100.
 */
export function costumeSeriesKey(costume3dGroupId: number, slot: CostumeSlot): SeriesKey {
  if (costume3dGroupId >= 1001) {
    return { digit: String(costume3dGroupId).length, groupId: Math.trunc(costume3dGroupId / 1000) }
  }
  if (costume3dGroupId >= 1 && costume3dGroupId <= 100 && slot !== "head") {
    const groupId = costume3dGroupId + 100
    return { digit: String(groupId).length, groupId }
  }
  return { digit: String(costume3dGroupId).length, groupId: costume3dGroupId }
}

/** A worn part: its costume3dId and group, for the series comparison. */
export type WornPart = { id: number; costume3dGroupId: number | null } | null

export type SeriesContext = {
  body: WornPart
  head: WornPart
  hair: WornPart
  /** `${headCostume3dId}|${hairCostume3dId}` pairs that cannot be worn together. */
  notAvailable: ReadonlySet<string>
}

function sameSeries(
  cellGroupId: number | null,
  cellSlot: CostumeSlot,
  worn: WornPart,
  wornSlot: CostumeSlot,
): boolean {
  if (cellGroupId == null || worn == null || worn.costume3dGroupId == null) {
    return false
  }
  const a = costumeSeriesKey(cellGroupId, cellSlot)
  const b = costumeSeriesKey(worn.costume3dGroupId, wornSlot)
  return a.digit === b.digit && a.groupId === b.groupId
}

/**
 * The sort value of one list cell: `representativeId` is its default colour, `ids` all its colours (the cell is the
 * worn one when any of them is worn).
 */
export function costumeSeriesSortValue(
  slot: CostumeSlot,
  cell: { representativeId: number; costume3dGroupId: number | null; ids: readonly number[] },
  context: SeriesContext,
): number {
  const worn = context[slot]
  const isSetting = worn != null && cell.ids.includes(worn.id)
  if (slot === "body") {
    // GetSeriesSortValueBody: AllSameSeries 2, HeadSameSeries 4, HairSameSeries 5, Unlocked 13.
    const sameHead = sameSeries(cell.costume3dGroupId, slot, context.head, "head")
    const sameHair = sameSeries(cell.costume3dGroupId, slot, context.hair, "hair")
    const value = sameHead && sameHair ? 2 : sameHead ? 4 : sameHair ? 5 : 13
    return isSetting ? 1 : value
  }
  if (slot === "hair") {
    // GetSeriesSortValueHair: AllSameSeries 2, BodySameSeries 3 (incompatible with the worn accessory 6),
    // HeadSameSeries 4, Compatible 12 / Unlocked 13.
    const compatible = context.head == null || !context.notAvailable.has(`${context.head.id}|${cell.representativeId}`)
    const sameBody = sameSeries(cell.costume3dGroupId, slot, context.body, "body")
    const sameHead = sameSeries(cell.costume3dGroupId, slot, context.head, "head")
    const value = sameBody && sameHead ? 2 : sameBody ? (compatible ? 3 : 6) : sameHead ? 4 : compatible ? 12 : 13
    return isSetting ? 1 : value
  }
  // GetHeadSortValue: the unset head 0, the worn one 1, else GetSeriesSortValueHead: AllSameSeries 2,
  // BodySameSeries 3 (incompatible with the worn hair 6), HairSameSeries 5, Compatible 12 / Unlocked 13.
  if (NONE_HEAD_COSTUME3D_IDS.has(cell.representativeId)) {
    return 0
  }
  if (isSetting) {
    return 1
  }
  const compatible = context.hair == null || !context.notAvailable.has(`${cell.representativeId}|${context.hair.id}`)
  const sameBody = sameSeries(cell.costume3dGroupId, slot, context.body, "body")
  const sameHair = sameSeries(cell.costume3dGroupId, slot, context.hair, "hair")
  return sameBody && sameHair ? 2 : sameBody ? (compatible ? 3 : 6) : sameHair ? 5 : compatible ? 12 : 13
}

/**
 * The SET label: a list cell of the same series (the game's IsSameGroup, as the sort uses it) as one of the other two
 * parts worn now, so it completes that costume. The worn cell itself and the unset head are not labelled.
 */
export function isSameSetCell(
  slot: CostumeSlot,
  cell: { representativeId: number; costume3dGroupId: number | null; ids: readonly number[] },
  context: SeriesContext,
): boolean {
  const worn = context[slot]
  if ((worn != null && cell.ids.includes(worn.id)) || (slot === "head" && NONE_HEAD_COSTUME3D_IDS.has(cell.representativeId))) {
    return false
  }
  return (["body", "head", "hair"] as const).some((other) => other !== slot && sameSeries(cell.costume3dGroupId, slot, context[other], other))
}

/** The cells in the game's order (a stable sort: equal values keep their order). */
export function orderBySeries<T>(
  cells: readonly T[],
  slot: CostumeSlot,
  context: SeriesContext,
  describe: (cell: T) => { representativeId: number; costume3dGroupId: number | null; ids: readonly number[] },
): T[] {
  return cells
    .map((cell, index) => ({ cell, index, value: costumeSeriesSortValue(slot, describe(cell), context) }))
    .sort((a, b) => a.value - b.value || a.index - b.index)
    .map((entry) => entry.cell)
}
