import { ref } from "vue"
import { usePagination } from "@/composables/usePagination"

type PagedData<T> = {
  items?: T[] | null
  total?: number | null
}

type LoadContext = {
  page: number
  pageSize: number
  requestId: number
}

type UsePagedListOptions<TItem, TResponse> = {
  initialPage?: number
  initialPageSize?: number
  fetchPage: (context: LoadContext) => Promise<TResponse>
  mapResponse?: (response: TResponse) => PagedData<TItem>
  onBeforeLoad?: () => void
  onSuccess?: (response: TResponse) => void | Promise<void>
  onError?: (error: unknown) => void | Promise<void>
}

type LoadOptions = {
  throwOnError?: boolean
  notifyOnError?: boolean
}

function defaultResponseMapper<TItem>(response: unknown): PagedData<TItem> {
  return response as PagedData<TItem>
}

export function usePagedList<TItem, TResponse = PagedData<TItem>>(
  options: UsePagedListOptions<TItem, TResponse>
) {
  const loading = ref(true)
  const items = ref<TItem[]>([])
  const {
    page,
    pageSize,
    total,
    totalPages,
    resetPage,
    prevPage: goPrevPage,
    nextPage: goNextPage,
  } = usePagination(options.initialPage ?? 1, options.initialPageSize ?? 20)

  let latestRequestId = 0
  const mapResponse = options.mapResponse ?? defaultResponseMapper<TItem>

  async function load(loadOptions: LoadOptions = {}) {
    const requestId = ++latestRequestId
    const notifyOnError = loadOptions.notifyOnError ?? true
    loading.value = true

    try {
      options.onBeforeLoad?.()
      const response = await options.fetchPage({
        page: page.value,
        pageSize: pageSize.value,
        requestId,
      })
      if (requestId !== latestRequestId) return
      const pagedData = mapResponse(response)
      items.value = pagedData.items ?? []
      total.value = pagedData.total ?? 0
      if (options.onSuccess) {
        await options.onSuccess(response)
      }
    } catch (error: unknown) {
      if (requestId !== latestRequestId) return
      if (notifyOnError && options.onError) {
        await options.onError(error)
      }
      if (loadOptions.throwOnError) {
        throw error
      }
    } finally {
      if (requestId !== latestRequestId) return
      loading.value = false
    }
  }

  function prevPage() {
    if (goPrevPage()) {
      void load()
    }
  }

  function nextPage() {
    if (goNextPage()) {
      void load()
    }
  }

  function reloadFromFirstPage() {
    resetPage()
    void load()
  }

  return {
    loading,
    items,
    page,
    pageSize,
    total,
    totalPages,
    resetPage,
    load,
    prevPage,
    nextPage,
    reloadFromFirstPage,
  }
}
