export const SEKAI_LIVE_BOOST_MULTIPLIERS: Readonly<Record<number, number>> = {
  0: 1,
  1: 5,
  2: 10,
  3: 15,
  4: 20,
  5: 25,
  6: 27,
  7: 29,
  8: 31,
  9: 33,
  10: 35,
}

export function resolveSekaiLiveBoostMultiplier(boost: number | null | undefined): number {
  if (boost == null) {
    return 1
  }

  return SEKAI_LIVE_BOOST_MULTIPLIERS[boost] ?? 1
}
