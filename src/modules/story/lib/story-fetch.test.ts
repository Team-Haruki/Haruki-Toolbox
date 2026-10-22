import { expect, test } from "bun:test"
import { ScenarioCache } from "@/modules/story/lib/story-fetch"

test("ScenarioCache shares loads, evicts the oldest and forgets failures", async () => {
  const cache = new ScenarioCache<string>(2)
  let loads = 0
  const load = (v: string) => () => {
    loads++
    return Promise.resolve(v)
  }
  expect(await cache.get("a", load("A"))).toBe("A")
  expect(await cache.get("a", load("A2"))).toBe("A")
  await cache.get("b", load("B"))
  await cache.get("c", load("C")) // evicts "a"
  expect(await cache.get("a", load("A3"))).toBe("A3")
  expect(loads).toBe(4)

  await expect(cache.get("x", () => Promise.reject(new Error("down")))).rejects.toThrow("down")
  expect(await cache.get("x", load("X"))).toBe("X")
})
