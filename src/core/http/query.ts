export type QueryValue = string | number | boolean

export type QueryParams = Record<string, QueryValue>

export function createPageQuery(page: number, pageSize: number): QueryParams {
    return {
        page,
        page_size: pageSize,
    }
}

export function setQueryValue(
    params: QueryParams,
    key: string,
    value: QueryValue | null | undefined
) {
    if (value === null || value === undefined) {
        return
    }

    params[key] = value
}

export function setTrimmedQueryValue(
    params: QueryParams,
    key: string,
    value: string | null | undefined
) {
    if (value === null || value === undefined) {
        return
    }

    const normalized = value.trim()
    if (!normalized) {
        return
    }

    params[key] = normalized
}
