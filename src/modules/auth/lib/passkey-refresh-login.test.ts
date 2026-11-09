import { describe, expect, it } from "bun:test"
import {
  buildDiscoverablePasskeyRequest,
  createBrowserPasskeyLoginEnvironment,
  decodeBase64Url,
  encodeBase64Url,
  runDiscoverablePasskeyLogin,
  serializePasskeyAssertion,
  type PasskeyAssertionLike,
  type PasskeyLoginEnvironment,
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

  it("accepts typed-array views as well as raw buffers", () => {
    const view = new Uint8Array([0, 1, 2, 3, 4, 5]).subarray(2, 5)
    expect(encodeBase64Url(view)).toBe(encodeBase64Url(new Uint8Array([2, 3, 4]).buffer))
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

describe("runDiscoverablePasskeyLogin", () => {
  const challenge = JSON.stringify({
    publicKey: {
      challenge: encodeBase64Url(bytes("c")),
      rpId: "haruki.seiunx.com",
      allowCredentials: [{ type: "public-key", id: "Y3JlZA" }],
    },
  })

  const assertion: PasskeyAssertionLike = {
    id: "Y3JlZA",
    rawId: bytes("cred").buffer,
    type: "public-key",
    response: {
      authenticatorData: bytes("auth").buffer,
      clientDataJSON: bytes("client").buffer,
      signature: bytes("sig").buffer,
      userHandle: bytes("handle").buffer,
    },
  }

  function createForm(withField = true) {
    const field = { value: "" }
    let submitted = 0
    return {
      field,
      submitted: () => submitted,
      form: {
        elements: { namedItem: (name: string) => (withField && name === "passkey_login" ? field : null) },
        submit: () => {
          submitted += 1
        },
      },
    }
  }

  function createEnvironment(overrides: Partial<PasskeyLoginEnvironment> = {}) {
    const calls: { aborted: number; requests: PublicKeyCredentialRequestOptions[] } = { aborted: 0, requests: [] }
    const environment: PasskeyLoginEnvironment = {
      supported: true,
      getCredential: async (publicKey) => {
        calls.requests.push(publicKey)
        return assertion
      },
      abortConditionalUi: () => {
        calls.aborted += 1
      },
      ...overrides,
    }
    return { environment, calls }
  }

  it("posts a discoverable assertion through the hidden field", async () => {
    const { form, field, submitted } = createForm()
    const { environment, calls } = createEnvironment()

    await expect(runDiscoverablePasskeyLogin(challenge, form, environment)).resolves.toBe("submitted")
    expect(calls.aborted).toBe(1)
    expect(calls.requests).toHaveLength(1)
    expect("allowCredentials" in calls.requests[0]!).toBe(false)
    expect(JSON.parse(field.value).response.userHandle).toBe(encodeBase64Url(bytes("handle")))
    expect(submitted()).toBe(1)
  })

  it("reports an unsupported browser without touching the form", async () => {
    const { form, submitted } = createForm()
    const { environment, calls } = createEnvironment({ supported: false })

    await expect(runDiscoverablePasskeyLogin(challenge, form, environment)).resolves.toBe("unsupported")
    expect(calls.requests).toHaveLength(0)
    expect(submitted()).toBe(0)
  })

  it("rejects a broken challenge and a form without the result field", async () => {
    const { environment } = createEnvironment()
    await expect(runDiscoverablePasskeyLogin("{}", createForm().form, environment)).resolves.toBe("invalid-challenge")
    await expect(runDiscoverablePasskeyLogin(challenge, createForm(false).form, environment)).resolves.toBe("missing-field")
  })

  it("turns a missing credential into a NotAllowedError", async () => {
    const { form, submitted } = createForm()
    const { environment } = createEnvironment({ getCredential: async () => null })

    await expect(runDiscoverablePasskeyLogin(challenge, form, environment)).rejects.toMatchObject({ name: "NotAllowedError" })
    expect(submitted()).toBe(0)
  })

  it("lets authenticator errors propagate", async () => {
    const { environment } = createEnvironment({
      getCredential: async () => {
        throw new DOMException("cancelled", "AbortError")
      },
    })
    await expect(runDiscoverablePasskeyLogin(challenge, createForm().form, environment)).rejects.toMatchObject({ name: "AbortError" })
  })

  it("reports no support outside a browser", () => {
    expect(createBrowserPasskeyLoginEnvironment().supported).toBe(false)
  })

  it("wires the browser environment to navigator.credentials and the conditional-UI abort handle", async () => {
    const globals = globalThis as unknown as Record<string, unknown>
    const previousWindow = globals.window
    const previousNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator")
    const controller = new AbortController()
    const requests: PublicKeyCredentialRequestOptions[] = []
    const fakeWindow: Record<string, unknown> = {
      PublicKeyCredential: function PublicKeyCredential() {},
      abortPasskeyConditionalUI: controller,
    }
    globals.window = fakeWindow
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        credentials: {
          get: async (options: { publicKey: PublicKeyCredentialRequestOptions }) => {
            requests.push(options.publicKey)
            return assertion
          },
        },
      },
    })
    try {
      const environment = createBrowserPasskeyLoginEnvironment()
      expect(environment.supported).toBe(true)
      environment.abortConditionalUi()
      expect(controller.signal.aborted).toBe(true)
      expect(fakeWindow.abortPasskeyConditionalUI).toBeUndefined()
      const publicKey = buildDiscoverablePasskeyRequest(challenge)!
      await expect(environment.getCredential(publicKey)).resolves.toBe(assertion)
      expect(requests).toEqual([publicKey])
    } finally {
      if (previousWindow === undefined) {
        delete globals.window
      } else {
        globals.window = previousWindow
      }
      if (previousNavigator) {
        Object.defineProperty(globalThis, "navigator", previousNavigator)
      } else {
        delete globals.navigator
      }
    }
  })
})
