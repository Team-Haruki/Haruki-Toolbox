import type { Router } from "vue-router"

interface RedirectToLoginOptions {
    redirect?: string
}

export function resolveSafeRedirectTarget(value: unknown): string | null {
    if (typeof value !== "string") {
        return null
    }

    const normalized = value.trim()
    if (!normalized.startsWith("/")) {
        return null
    }

    if (normalized.startsWith("//")) {
        return null
    }

    return normalized
}

export async function redirectToLogin(
    router: Router,
    options: RedirectToLoginOptions = {}
) {
    if (router.currentRoute.value.path === "/user/login") {
        return
    }

    const redirect = resolveSafeRedirectTarget(options.redirect)

    if (redirect) {
        await router.push({
            path: "/user/login",
            query: { redirect },
        })
        return
    }

    await router.push("/user/login")
}
