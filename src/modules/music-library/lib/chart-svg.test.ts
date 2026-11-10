import { describe, expect, it } from "bun:test"
import { stretchChartNoteMiddles } from "./chart-svg"

const BASE = `<symbol id="notes-1" viewBox="0 0 112 56"><image href="https://notes.test/notes_1.png" x="-3" y="-3" width="118" height="62"/></symbol>`
const MIDDLE = `<symbol id="notes-1-middle" viewBox="0 0 134400 56"><image href="https://notes.test/notes_1.png" x="-37200" y="-3" width="141600" height="62"/></symbol>`

describe("stretchChartNoteMiddles", () => {
  it("lets the middle sprite stretch and leaves the cap sprite alone", () => {
    const fixed = stretchChartNoteMiddles(`<svg><defs>${BASE}${MIDDLE}</defs></svg>`)
    expect(fixed).toContain(BASE)
    expect(fixed).toContain(`<symbol id="notes-1-middle" viewBox="0 0 134400 56"><image href="https://notes.test/notes_1.png" x="-37200" y="-3" width="141600" height="62" preserveAspectRatio="none"/></symbol>`)
  })

  it("fixes every note colour and both ways a browser may serialise the tag", () => {
    const serialised = MIDDLE.replace("/></symbol>", "></image></symbol>")
    const fixed = stretchChartNoteMiddles(MIDDLE.replace("notes-1-", "notes-0-") + serialised.replace("notes-1-", "notes-6-"))
    expect(fixed.match(/preserveAspectRatio="none"/g)).toHaveLength(2)
    expect(fixed).toContain(`height="62" preserveAspectRatio="none"></image>`)
  })

  it("does not repeat the attribute when the engine already writes it", () => {
    const already = MIDDLE.replace(`height="62"/>`, `height="62" preserveAspectRatio="none"/>`)
    expect(stretchChartNoteMiddles(already)).toBe(already)
  })

  it("returns other markup unchanged", () => {
    const other = `<svg><image href="jacket.png" width="10" height="10"/></svg>`
    expect(stretchChartNoteMiddles(other)).toBe(other)
  })
})
