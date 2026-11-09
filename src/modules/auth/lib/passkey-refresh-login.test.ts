import { describe, expect, it } from "bun:test"
import {
  buildDiscoverablePasskeyRequest,
  decodeBase64Url,
  encodeBase64Url,
  serializePasskeyAssertion,
} from "./passkey-refresh-login"

const encoder = new TextEncoder()
const bytes = (text: string) => encoder.encode(text)

describe("base64url helpers", () => {
  it("round-trips bytes without padding, using the url alphabet", () => {
    const input = new Uint8Array([251, 255, 0, 62, 63, 1])
    const encoded = encodeBase64Url(input)
    expect(encoded).not.toMatch(/[+/=]/)
    expect(Array.from(decodeBase64Url(encoded))).toEqual(Array.from(input))
  })

  it("encodes a missing buffer as an empty string, like Kratos' script", () => {
    expect(encodeBase64Url(null)).toBe("")
    expect(encodeBase64Url(undefined)).toBe("")
  })

  it("decodes padded standard base64 too", () => {
    expect(new TextDecoder().decode(decodeBase64Url("aGVsbG8="))).toBe("hello")
    expect(new TextDecoder().decode(decodeBase64Url("aGVsbG8"))).toBe("hello")
  })
})

describe("buildDiscoverablePasskeyRequest", () => {
  const challenge = JSON.stringify({
    publicKey: {
      challenge: encodeBase64Url(bytes("refresh-challenge")),
      timeout: 300000,
      rpId: "haruki.seiunx.com",
      userVerification: "preferred",
      allowCredentials: [{ type: "public-key", id: "bHFTWEF1a1E0YklPVEI0a1UyNUVYNUkxVjZYRTZaRzU5UUdXUHFMYlNFZ3dZdmxMekZ5WUE" }],
    },
  })

  it("drops allowCredentials and decodes the challenge, keeping the other options", () => {
    const request = buildDiscoverablePasskeyRequest(challenge)
    expect(request).not.toBeNull()
    expect("allowCredentials" in request!).toBe(false)
    expect(new TextDecoder().decode(request!.challenge as Uint8Array)).toBe("refresh-challenge")
    expect(request!.rpId).toBe("haruki.seiunx.com")
    expect(request!.userVerification).toBe("preferred")
    expect(request!.timeout).toBe(300000)
  })

  it("rejects values that are not a Kratos challenge", () => {
    expect(buildDiscoverablePasskeyRequest("")).toBeNull()
    expect(buildDiscoverablePasskeyRequest("not json")).toBeNull()
    expect(buildDiscoverablePasskeyRequest(JSON.stringify({ publicKey: { rpId: "x" } }))).toBeNull()
    expect(buildDiscoverablePasskeyRequest(JSON.stringify({ publicKey: { challenge: "%%%" } }))).toBeNull()
  })
})

describe("serializePasskeyAssertion", () => {
  it("matches the field layout Kratos' webauthn.js posts", () => {
    const serialized = JSON.parse(
      serializePasskeyAssertion({
        id: "Y3JlZA",
        rawId: bytes("cred").buffer,
        type: "public-key",
        response: {
          authenticatorData: bytes("auth").buffer,
          clientDataJSON: bytes("client").buffer,
          signature: bytes("sig").buffer,
          userHandle: bytes("handle").buffer,
        },
      })
    )
    expect(serialized).toEqual({
      id: "Y3JlZA",
      rawId: encodeBase64Url(bytes("cred")),
      type: "public-key",
      response: {
        authenticatorData: encodeBase64Url(bytes("auth")),
        clientDataJSON: encodeBase64Url(bytes("client")),
        signature: encodeBase64Url(bytes("sig")),
        userHandle: encodeBase64Url(bytes("handle")),
      },
    })
  })

  it("sends an empty userHandle when the authenticator omitted it", () => {
    const serialized = JSON.parse(
      serializePasskeyAssertion({
        id: "x",
        rawId: new ArrayBuffer(0),
        type: "public-key",
        response: {
          authenticatorData: new ArrayBuffer(0),
          clientDataJSON: new ArrayBuffer(0),
          signature: new ArrayBuffer(0),
          userHandle: null,
        },
      })
    )
    expect(serialized.response.userHandle).toBe("")
  })
})
