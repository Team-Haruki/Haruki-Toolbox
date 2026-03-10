import {toast} from "vue-sonner";
import router from "@/core/router";
import { redirectToLogin } from "@/core/router/navigation";
import {useUserStore} from "@/shared/stores/user";
import { translate } from "@/shared/i18n";

export async function logout() {
    const userStore = useUserStore();

    userStore.clearUser();
    toast.success(translate("auth.toast.logoutSuccessTitle"));
    await redirectToLogin(router);
}
