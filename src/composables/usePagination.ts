import { computed, ref } from "vue"

export function usePagination(initialPage = 1, initialPageSize = 20) {
    const page = ref(initialPage)
    const pageSize = ref(initialPageSize)
    const total = ref(0)

    const totalPages = computed(() =>
        Math.max(1, Math.ceil(total.value / Math.max(pageSize.value, 1)))
    )

    function resetPage() {
        page.value = 1
    }

    function prevPage() {
        if (page.value <= 1) return false
        page.value -= 1
        return true
    }

    function nextPage() {
        if (page.value >= totalPages.value) return false
        page.value += 1
        return true
    }

    function goToPage(target: number) {
        const clamped = Math.min(Math.max(Math.trunc(target), 1), totalPages.value)
        if (!Number.isFinite(clamped) || clamped === page.value) return false
        page.value = clamped
        return true
    }

    return {
        page,
        pageSize,
        total,
        totalPages,
        resetPage,
        prevPage,
        nextPage,
        goToPage,
    }
}
