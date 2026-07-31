import { ref } from "vue"
import { defineStore } from "pinia"
import type { PlannerBrush } from "../lib/planner-calendar"

export type EventPlannerPlan = {
  targetPointInput: string
  currentPointInput: string
  brushes: PlannerBrush[]
  /** Painted calendar cells: hour-start ms (as string) → brush id. */
  cells: Record<string, string>
  updatedAt: number
}

const MAX_STORED_PLANS = 20

/**
 * Persisted calendar plans of the event planner, keyed by
 * `accountKey|dataRegion|eventId` so switching pages (or events) never loses
 * an arranged calendar.
 */
export const useEventPlannerStore = defineStore("event-planner", () => {
    const plans = ref<Record<string, EventPlannerPlan>>({})

    function getPlan(key: string): EventPlannerPlan | null {
        return plans.value[key] ?? null
    }

    function savePlan(key: string, plan: Omit<EventPlannerPlan, "updatedAt">) {
        plans.value = prunePlans({
            ...plans.value,
            [key]: { ...plan, updatedAt: Date.now() },
        })
    }

    function deletePlan(key: string) {
        if (plans.value[key] == null) {
            return
        }

        const next = { ...plans.value }
        delete next[key]
        plans.value = next
    }

    /** Keeps the most recently touched plans so storage stays bounded. */
    function prunePlans(next: Record<string, EventPlannerPlan>): Record<string, EventPlannerPlan> {
        const entries = Object.entries(next)
        if (entries.length <= MAX_STORED_PLANS) {
            return next
        }

        entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt)
        return Object.fromEntries(entries.slice(0, MAX_STORED_PLANS))
    }

    return {
        plans,
        getPlan,
        savePlan,
        deletePlan,
    }
}, {
    persist: {
        pick: ["plans"],
    },
})
