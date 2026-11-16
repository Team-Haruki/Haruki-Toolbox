import { expect, test } from "bun:test"
import { createSSRApp, nextTick } from "vue"
import { createI18n } from "vue-i18n"
import { renderToString } from "@vue/server-renderer"
import type { GameAccountDataGrant } from "@/types"

const storage = { length: 0, clear() {}, getItem: () => null, key: () => null, removeItem() {}, setItem() {} }
Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })
const { useGameAccountDataGrants } = await import("./useGameAccountDataGrants")

test("editing a grant without a selected binding preserves its game ID and matching rows", async () => {
  const grant: GameAccountDataGrant = {
    id: 1, ownerUserId: "owner", granteeUserId: "reader", server: "jp",
    gameUserId: "28808221489823746", dataType: "suite", permissions: ["read"],
    expiresAt: "2099-01-01T00:00:00Z", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z",
  }
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document")
  Object.defineProperty(globalThis, "document", { value: { getElementById: () => null }, configurable: true })
  try {
    const app = createSSRApp({
      setup() {
        const state = useGameAccountDataGrants(() => "owner")
        state.ownedGrants.value = [grant]
        state.editGrant(grant)
        expect(state.selectedAccount.value?.userId).toBe(grant.gameUserId)
        expect(state.selectedAccountGrants.value.map((item) => item.id)).toEqual([grant.id])
        expect(state.editingGrant.value?.gameUserId).toBe(grant.gameUserId)
        return () => ""
      },
    })
    app.use(createI18n({ legacy: false, locale: "en-US", messages: {} }))
    await renderToString(app)
    await nextTick()
  } finally {
    if (documentDescriptor) Object.defineProperty(globalThis, "document", documentDescriptor)
    else Reflect.deleteProperty(globalThis, "document")
  }
})
