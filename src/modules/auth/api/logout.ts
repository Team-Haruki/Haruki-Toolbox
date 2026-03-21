import router from "@/core/router";
import { redirectToLogin } from "@/core/router/navigation";
import {useUserStore} from "@/shared/stores/user";
import { createKratosLogoutUrl, redirectToKratosLogout } from "@/modules/auth/lib/kratos";

export async function logout() {
    const userStore = useUserStore();
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
