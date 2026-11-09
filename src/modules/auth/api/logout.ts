import router from "@/core/router";
import { redirectToLogin } from "@/core/router/navigation";
import {useUserStore} from "@/shared/stores/user";
import { createKratosLogoutUrl, performKratosLogout, redirectToKratosLogout } from "@/modules/auth/lib/kratos";
import { clearDeckRecommendUserDataCache } from "@/modules/deck-recommend/lib/user-data-cache";
import { clearUserSuiteSubsetCache } from "@/shared/sekai/user-snapshot/cache";

async function clearLocalUserState() {
    const userStore = useUserStore();
    const userId = userStore.userId;
    if (userId) {
        await clearDeckRecommendUserDataCache(userId).catch(() => undefined);
        await clearUserSuiteSubsetCache(userId).catch(() => undefined);
    }
    userStore.clearUser();
}

/**
 * Ends the local session without leaving the page. Used by the OIDC
 * RP-initiated logout flow, where Hydra's post-logout redirect owns the
 * navigation instead of Kratos' logout redirect.
 */
export async function logoutInPlace() {
    await clearLocalUserState();
    await performKratosLogout().catch(() => undefined);
}

/**
 * Like logoutInPlace, but a failed Kratos logout is reported to the caller,
 * for flows that must not continue while the session is still alive.
 */
export async function logoutInPlaceStrict() {
    // Kratos first: a failed logout must leave the local state (and the
    // caches) as they were, since the session is still alive.
    await performKratosLogout();
    await clearLocalUserState();
}

export async function logout() {
    await clearLocalUserState();

    if (typeof window !== "undefined") {
        try {
            const logoutUrl = await createKratosLogoutUrl()
            window.location.assign(logoutUrl)
            return
        } catch {
            redirectToKratosLogout()
        }
        return
    }

    await redirectToLogin(router);
}
