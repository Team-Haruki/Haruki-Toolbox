import type { LocationQuery } from "vue-router"
import type { QueryCodec } from "@/composables/useRouteQueryState"
import {
  readQueryEnum,
  readQueryEnumList,
  readQueryInt,
  writeQueryList,
  writeQueryValue,
  type QueryWriteRecord,
} from "@/lib/query-codec"
import { SEKAI_UNITS, type SekaiUnit } from "@/shared/sekai/catalog"
import { SEKAI_EVENT_TYPES, type SekaiEventType } from "@/modules/events/lib/event-filter"
import {
  EVENT_RECORD_SORTS,
  EVENT_RECORD_TIME_MODES,
  type EventRecordSort,
  type EventRecordTimeMode,
} from "@/modules/events/lib/event-records"

/**
 * `/events/records` query state: the time window, type/unit filters and the
 * sort survive a reload or a shared link. Defaults are omitted from the URL.
 */
export type EventRecordsQueryState = {
  time: EventRecordTimeMode
  /** Custom window bounds as epoch milliseconds; only meaningful when `time` is "custom". */
  from: number | null
  to: number | null
  types: SekaiEventType[]
  units: SekaiUnit[]
  sort: EventRecordSort
}

const KEYS = ["time", "from", "to", "types", "units", "sort"] as const
const FILTER_KEYS = ["time", "from", "to", "types", "units"] as const
const COUNT_KEYS = ["time", "types", "units"] as const

export function createDefaultEventRecordsQuery(): EventRecordsQueryState {
  return { time: "year", from: null, to: null, types: [], units: [], sort: "time" }
}

export function parseEventRecordsQuery(query: LocationQuery): EventRecordsQueryState {
  const defaults = createDefaultEventRecordsQuery()
  const time = readQueryEnum(query.time, EVENT_RECORD_TIME_MODES) ?? defaults.time
  return {
    time,
    from: time === "custom" ? readQueryInt(query.from, { min: 0 }) : null,
    to: time === "custom" ? readQueryInt(query.to, { min: 0 }) : null,
    types: readQueryEnumList(query.types, SEKAI_EVENT_TYPES),
    units: readQueryEnumList(query.units, SEKAI_UNITS),
    sort: readQueryEnum(query.sort, EVENT_RECORD_SORTS) ?? defaults.sort,
  }
}

export function serializeEventRecordsQuery(state: EventRecordsQueryState): QueryWriteRecord {
  const custom = state.time === "custom"
  return {
    time: writeQueryValue(state.time, "year"),
    from: custom ? writeQueryValue(state.from) : undefined,
    to: custom ? writeQueryValue(state.to) : undefined,
    types: writeQueryList(state.types),
    units: writeQueryList(state.units),
    sort: writeQueryValue(state.sort, "time"),
  }
}

export const EVENT_RECORDS_QUERY_CODEC: QueryCodec<EventRecordsQueryState> = {
  keys: KEYS,
  filterKeys: FILTER_KEYS,
  countKeys: COUNT_KEYS,
  defaults: createDefaultEventRecordsQuery,
  parse: parseEventRecordsQuery,
  serialize: serializeEventRecordsQuery,
}
