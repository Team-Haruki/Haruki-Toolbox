import {toast} from "vue-sonner";
import router from "@/core/router";
import { redirectToLogin } from "@/core/router/navigation";
import {useUserStore} from "@/shared/stores/user";
import { translate } from "@/shared/i18n";
import { deleteAdminSession, getAdminSessions } from "@/modules/admin-sessions/api/sessions";
import { createLogger } from "@/lib/logger";

const logger = createLogger("logout")

async function revokeCurrentAdminSession() {
    try {
        const sessions = await getAdminSessions({ skipErrorToast: true })
        const currentSession = sessions.find((session) => session.current)
        if (!currentSession) {
            return
        }

        await deleteAdminSession(currentSession.sessionTokenId, { skipErrorToast: true })
    } catch (error) {
        logger.warn("Failed to revoke current admin session", error)
    }
}

export async function logout() {
    const userStore = useUserStore();
    const shouldRevokeAdminSession = userStore.isAdmin

    if (shouldRevokeAdminSession) {
        await revokeCurrentAdminSession()
    }

    userStore.clearUser();
    toast.success(translate("auth.toast.logoutSuccessTitle"));
    await redirectToLogin(router);
}
