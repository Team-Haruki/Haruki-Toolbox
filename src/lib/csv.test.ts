import { describe, expect, it } from "bun:test"
import { formatCsvDateTime, formatFileTimestamp, toCsv } from "./csv"

describe("toCsv", () => {
  it("starts with the UTF-8 mark and ends every row with CRLF", () => {
    expect(toCsv([["排名", "分数"], [1, 2500]])).toBe("﻿排名,分数\r\n1,2500\r\n")
  })

  it("quotes cells that hold a comma, a quote, a line break or outer spaces", () => {
    expect(toCsv([["a,b", 'say "hi"', "two\nlines", " padded "]])).toBe(
      '﻿"a,b","say ""hi""","two\nlines"," padded "\r\n',
    )
  })

  it("writes text that a spreadsheet would run as a formula as text", () => {
    expect(toCsv([["=HYPERLINK(\"http://x\")", "+1", "-1", "@name", "\tcmd"]])).toBe(
      '﻿"\'=HYPERLINK(""http://x"")",\'+1,\'-1,\'@name,\'\tcmd\r\n',
    )
  })

  it("keeps an id longer than a spreadsheet's 15 digits as text", () => {
    expect(toCsv([["123456789012345678", "123456789012345", "1234567890123456a"]])).toBe(
      '\uFEFF"123456789012345678\t",123456789012345,1234567890123456a\r\n',
    )
  })

  it("keeps numbers as numbers, negative ones included, and empties what has no value", () => {
    expect(toCsv([[-42, 0, null, undefined, Number.NaN, Number.POSITIVE_INFINITY]])).toBe("﻿-42,0,,,,\r\n")
  })
})

describe("csv times", () => {
  const at = new Date(2026, 10, 3, 8, 5, 9).getTime()

  it("formats a local time a spreadsheet reads as a date", () => {
    expect(formatCsvDateTime(at)).toBe("2026-11-03 08:05:09")
  })

  it("is empty for a missing or invalid time", () => {
    expect(formatCsvDateTime(null)).toBe("")
    expect(formatCsvDateTime(undefined)).toBe("")
    expect(formatCsvDateTime(Number.NaN)).toBe("")
  })

  it("formats the same time for a file name", () => {
    expect(formatFileTimestamp(at)).toBe("20261103-080509")
  })
})
