import { afterEach, describe, expect, test } from "bun:test"
import {
  ASSET_HOST_DOWN_MS,
  isAssetHostDown,
  markAssetHostDown,
  preferAssetHost,
  probeAssetHostFailure,
  resetAssetHostState,
  resolveAssetHostTwinUrl,
  resolveAssetImageFallback,
} from "@/shared/sekai/asset-image-fallback"
import { SEKAI_ASSET_ENDPOINT_ROOTS } from "@/shared/sekai/data-sources"

const CN = SEKAI_ASSET_ENDPOINT_ROOTS.china_cdn
const GLOBAL = SEKAI_ASSET_ENDPOINT_ROOTS.global
const THUMB = `${CN}/jp-assets/startapp/thumbnail/costume/cos0001.png`
const THUMB_GLOBAL = `${GLOBAL}/jp-assets/startapp/thumbnail/costume/cos0001.png`

const answer = (status: number) => (async () => new Response(null, { status })) as unknown as typeof fetch
const fail = (error: unknown) => (async () => {
  throw error
}) as unknown as typeof fetch

afterEach(() => resetAssetHostState())

describe("resolveAssetHostTwinUrl", () => {
  test("maps the China CDN to the same path on the global host", () => {
    expect(resolveAssetHostTwinUrl(THUMB)).toBe(THUMB_GLOBAL)
  })

  test("has no twin for the global host, other hosts or nothing", () => {
    expect(resolveAssetHostTwinUrl(THUMB_GLOBAL)).toBeNull()
    expect(resolveAssetHostTwinUrl("https://images.haruki.seiunx.com/sekai-toolbox/a.png")).toBeNull()
    expect(resolveAssetHostTwinUrl(`${CN}evil.example/a.png`)).toBeNull()
    expect(resolveAssetHostTwinUrl(null)).toBeNull()
  })
})

describe("probeAssetHostFailure", () => {
  test("a network error, a timeout or a 5xx is the host failing", async () => {
    expect(await probeAssetHostFailure(THUMB, fail(new TypeError("Failed to fetch")))).toBe(true)
    expect(await probeAssetHostFailure(THUMB, fail(new DOMException("timed out", "TimeoutError")))).toBe(true)
    expect(await probeAssetHostFailure(THUMB, answer(502))).toBe(true)
  })

  test("a 2xx means the image broke on a working host (cut short): try the twin", async () => {
    expect(await probeAssetHostFailure(THUMB, answer(200))).toBe(true)
  })

  test("a 4xx is the file missing, never a host failure", async () => {
    expect(await probeAssetHostFailure(THUMB, answer(404))).toBe(false)
    expect(await probeAssetHostFailure(THUMB, answer(403))).toBe(false)
  })
})

describe("resolveAssetImageFallback", () => {
  test("gives the twin and marks the host down when it is failing", async () => {
    expect(await resolveAssetImageFallback(THUMB, async () => true)).toBe(THUMB_GLOBAL)
    expect(isAssetHostDown(THUMB)).toBe(true)
  })

  test("gives nothing for a missing file", async () => {
    expect(await resolveAssetImageFallback(THUMB, async () => false)).toBeNull()
    expect(isAssetHostDown(THUMB)).toBe(false)
  })

  test("skips the probe while the host is down", async () => {
    markAssetHostDown(THUMB)
    let probed = false
    expect(await resolveAssetImageFallback(THUMB, async () => (probed = true))).toBe(THUMB_GLOBAL)
    expect(probed).toBe(false)
  })

  test("asks about a missing file once", async () => {
    let probes = 0
    const probe = async () => (probes++, false)
    expect(await resolveAssetImageFallback(THUMB, probe)).toBeNull()
    expect(await resolveAssetImageFallback(THUMB, probe)).toBeNull()
    expect(probes).toBe(1)
  })

  test("a burst of failures on one host shares the first probe", async () => {
    let probes = 0
    let answer!: (failed: boolean) => void
    const probe = () => (probes++, new Promise<boolean>((resolve) => (answer = resolve)))
    const other = `${CN}/jp-assets/startapp/thumbnail/costume/cos0002.png`
    const first = resolveAssetImageFallback(THUMB, probe)
    const second = resolveAssetImageFallback(other, probe)
    answer(true)
    expect(await first).toBe(THUMB_GLOBAL)
    expect(await second).toBe(`${GLOBAL}/jp-assets/startapp/thumbnail/costume/cos0002.png`)
    expect(probes).toBe(1)
  })

  test("has nothing to offer on the global host", async () => {
    expect(await resolveAssetImageFallback(THUMB_GLOBAL, async () => true)).toBeNull()
  })
})

describe("preferAssetHost", () => {
  test("uses the twin while the host is down, then the host again", () => {
    const now = 1_000_000
    expect(preferAssetHost(THUMB, now)).toBe(THUMB)
    markAssetHostDown(THUMB, now)
    expect(preferAssetHost(THUMB, now + 1)).toBe(THUMB_GLOBAL)
    expect(preferAssetHost(THUMB, now + ASSET_HOST_DOWN_MS + 1)).toBe(THUMB)
  })
})
