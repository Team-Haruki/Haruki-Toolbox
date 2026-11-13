export type CsvCell = string | number | null | undefined

/** Excel reads a CSV as the system code page unless the file starts with this mark. */
const UTF8_BOM = "﻿"

/**
 * A spreadsheet runs a cell that starts with one of these as a formula. The
 * text here can be a player's name, so such a cell is written as text.
 */
const FORMULA_START = /^[=+\-@\t\r]/

function formatCell(value: CsvCell): string {
  if (value == null) {
    return ""
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : ""
  }
  const text = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\r\n]|^\s|\s$/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

/** Rows as the text of a CSV file that Excel, Numbers and Sheets open as UTF-8. */
export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return UTF8_BOM + rows.map((row) => row.map(formatCell).join(",")).join("\r\n") + "\r\n"
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * A time in the viewer's time zone as `2026-11-13 18:27:13`, the form a
 * spreadsheet reads as a date whatever its language. Empty for no time.
 */
export function formatCsvDateTime(milliseconds: number | null | undefined): string {
  if (milliseconds == null || !Number.isFinite(milliseconds)) {
    return ""
  }
  const date = new Date(milliseconds)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} `
    + `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** A time in the viewer's time zone as `20261113-182713`, for a file name. */
export function formatFileTimestamp(milliseconds: number): string {
  return formatCsvDateTime(milliseconds).replaceAll("-", "").replaceAll(":", "").replace(" ", "-")
}
