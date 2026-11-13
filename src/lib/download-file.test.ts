import { afterEach, describe, expect, it } from "bun:test"
import { downloadFile } from "./download-file"

describe("downloadFile", () => {
  const realDocument = globalThis.document
  const realCreate = URL.createObjectURL
  const realRevoke = URL.revokeObjectURL
  const realSetTimeout = globalThis.setTimeout

  afterEach(() => {
    globalThis.document = realDocument
    URL.createObjectURL = realCreate
    URL.revokeObjectURL = realRevoke
    globalThis.setTimeout = realSetTimeout
  })

  it("clicks a download link to the content and frees it afterwards", async () => {
    const events: string[] = []
    const blobs: Blob[] = []
    const anchor = {
      href: "",
      download: "",
      click: () => events.push(`click ${anchor.download} ${anchor.href}`),
      remove: () => events.push("remove"),
    }
    globalThis.document = {
      createElement: (tag: string) => {
        events.push(`create ${tag}`)
        return anchor
      },
      body: { appendChild: () => events.push("append") },
    } as unknown as Document
    URL.createObjectURL = (blob: Blob | MediaSource) => {
      blobs.push(blob as Blob)
      return "blob:test"
    }
    URL.revokeObjectURL = (url: string) => {
      events.push(`revoke ${url}`)
    }
    let later: (() => void) | undefined
    globalThis.setTimeout = ((callback: () => void) => {
      later = callback
      return 0
    }) as unknown as typeof setTimeout

    downloadFile("data.csv", "a,b\r\n", "text/csv;charset=utf-8")

    expect(events).toEqual(["create a", "append", "click data.csv blob:test", "remove"])
    expect(blobs[0]?.type).toBe("text/csv;charset=utf-8")
    expect(await blobs[0]?.text()).toBe("a,b\r\n")

    later?.()
    expect(events.at(-1)).toBe("revoke blob:test")
  })
})
