/** One selectable option in a catalog filter field. */
export type CatalogFieldOption = {
  value: string
  label: string
  /** Small round icon (character avatar, unit logo…). */
  iconUrl?: string | null
  /** Fallback color dot when there is no icon (difficulty, unit color…). */
  color?: string | null
}
