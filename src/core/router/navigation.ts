import type { Router } from "vue-router"

interface RedirectToLoginOptions {
    redirect?: string
}

export async function redirectToLogin(
    router: Router,
    options: RedirectToLoginOptions = {}
) {
    if (router.currentRoute.value.path === "/user/login") {
        return
    }

    if (options.redirect) {
        await router.push({
            path: "/user/login",
            query: { redirect: options.redirect },
        })
        return
    }

    await router.push("/user/login")
}
