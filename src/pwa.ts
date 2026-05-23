const SERVICE_WORKER_UPDATE_INTERVAL_MS = 60 * 60 * 1000

export async function registerAppServiceWorker() {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
        return
    }

    const { registerSW } = await import('virtual:pwa-register')

    registerSW({
        immediate: true,
        onRegisteredSW(_swUrl, registration) {
            if (!registration) {
                return
            }

            window.setInterval(() => {
                if (navigator.onLine) {
                    void registration.update()
                }
            }, SERVICE_WORKER_UPDATE_INTERVAL_MS)
        },
    })
}
