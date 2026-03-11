import { onScopeDispose, watch, type WatchSource, type WatchStopHandle } from "vue"

type DebouncedSource<T = unknown> = WatchSource<T> | ReadonlyArray<WatchSource<T>>

export function useDebouncedWatch<T>(
    source: WatchSource<T>,
    callback: () => void | Promise<void>,
    delay?: number
): WatchStopHandle
export function useDebouncedWatch<T>(
    source: ReadonlyArray<WatchSource<T>>,
    callback: () => void | Promise<void>,
    delay?: number
): WatchStopHandle

export function useDebouncedWatch(
    source: DebouncedSource,
    callback: () => void | Promise<void>,
    delay = 400
): WatchStopHandle {
    let timer: ReturnType<typeof setTimeout> | null = null

    const stop = watch(source, () => {
        if (timer) {
            clearTimeout(timer)
        }
        timer = setTimeout(() => {
            void callback()
        }, delay)
    })

    onScopeDispose(() => {
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
        stop()
    })

    return stop
}
