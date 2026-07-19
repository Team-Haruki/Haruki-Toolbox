import router from "@/core/router";
import { redirectToLogin } from "@/core/router/navigation";
import {useUserStore} from "@/shared/stores/user";
import { createKratosLogoutUrl, redirectToKratosLogout } from "@/modules/auth/lib/kratos";
import { clearDeckRecommendUserDataCache } from "@/modules/deck-recommend/lib/user-data-cache";
import { clearUserSuiteSubsetCache } from "@/shared/sekai/user-snapshot/cache";

export async function logout() {
    const userStore = useUserStore();
    const userId = userStore.userId;
    if (userId) {
        await clearDeckRecommendUserDataCache(userId).catch(() => undefined);
        await clearUserSuiteSubsetCache(userId).catch(() => undefined);
    }
    userStore.clearUser();

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
