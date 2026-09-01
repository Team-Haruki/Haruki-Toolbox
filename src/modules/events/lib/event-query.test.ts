import { describe, expect, test } from "bun:test"
import {
  buildEventsActiveChips,
  createDefaultEventsQuery,
  eventsQueryCodec,
  parseEventsQuery,
  serializeEventsQuery,
  type EventsQueryState,
} from "./event-query"

const chipContext = {
  typeLabel: (value: string) => `type:${value}`,
  statusLabel: (value: string) => `status:${value}`,
  unitLabel: (value: string) => `unit:${value}`,
  attrLabel: (value: string) => `attr:${value}`,
  characterName: (id: number) => `char${id}`,
}

const t = (key: string, params?: Record<string, unknown>) => `${key}${params ? `:${params.value}` : ""}`

describe("events query codec", () => {
  test("defaults serialize to an empty record", () => {
    const record = serializeEventsQuery(createDefaultEventsQuery())
    expect(Object.values(record).filter((value) => value != null)).toEqual([])
  })

  test("round-trips a full state", () => {
    const state: EventsQueryState = {
      q: "stella",
      type: ["marathon", "world_bloom"],
      status: ["ongoing", "ended"],
      units: ["light_sound", "piapro"],
      attrs: ["cute", "cool"],
      chars: [1, 21],
      year: 2024,
      sort: "id",
      dir: "asc",
      page: 3,
      size: 60,
    }
    const record = serializeEventsQuery(state)
    expect(record).toEqual({
      q: "stella",
      type: "marathon,world_bloom",
      status: "ongoing,ended",
      units: "light_sound,piapro",
      attrs: "cute,cool",
      chars: "1,21",
      year: "2024",
      sort: "id",
      dir: "asc",
      page: "3",
      size: "60",
    })
    expect(parseEventsQuery(record as Record<string, string>)).toEqual(state)
  })

  test("tolerates garbage and drops unknown enum values", () => {
    const state = parseEventsQuery({
      q: ["  spaced  ", "other"],
      type: "marathon,challenge,world_bloom",
      status: "soon,ongoing",
      units: "idol,vocaloid",
      attrs: "cute,spicy",
      chars: "0,-1,abc,3,3,4",
      year: "1999",
      sort: "name",
      dir: "sideways",
      page: "-4",
      size: "17",
    })
    expect(state).toEqual({
      ...createDefaultEventsQuery(),
      q: "spaced",
      type: ["marathon", "world_bloom"],
      status: ["ongoing"],
      units: ["idol"],
      attrs: ["cute"],
      chars: [3, 4],
    })
  })

  test("filter keys exclude sort, direction and paging", () => {
    expect(eventsQueryCodec.filterKeys).toEqual(["q", "type", "status", "units", "attrs", "chars", "year"])
    expect(eventsQueryCodec.keys).toContain("sort")
    expect(eventsQueryCodec.keys).toContain("page")
    expect(eventsQueryCodec.keys).toContain("size")
  })
})

describe("buildEventsActiveChips", () => {
  test("returns no chips for the default state", () => {
    expect(buildEventsActiveChips(createDefaultEventsQuery(), chipContext, t)).toEqual([])
  })

  test("builds one removable chip per active key", () => {
    const chips = buildEventsActiveChips(
      {
        ...createDefaultEventsQuery(),
        q: "wonder",
        type: ["cheerful_carnival"],
        status: ["upcoming", "ongoing"],
        units: ["street"],
        attrs: ["pure"],
        chars: [9, 10],
        year: 2023,
      },
      chipContext,
      t,
    )
    expect(chips.map((chip) => chip.key)).toEqual(["q", "type", "status", "units", "attrs", "chars", "year"])
    expect(chips[0].label).toBe("eventCatalog.chips.search:wonder")
    expect(chips[2].label).toBe("eventCatalog.chips.status:status:upcoming / status:ongoing")
    expect(chips[5].label).toBe("eventCatalog.chips.characters:char9 / char10")
    expect(chips[6].label).toBe("eventCatalog.chips.year:2023")
  })
})
