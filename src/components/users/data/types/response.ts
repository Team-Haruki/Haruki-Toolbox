export interface APIResponse<T = unknown> {
    status: number
    message: string
    updatedData?: T
}
