import {toast} from "vue-sonner";
import router from "@/router";
import {useUserStore} from "@/store";

export async function logout() {
    const userStore = useUserStore();

    userStore.clearUser();
    toast.success("注销成功");
    await router.push("/user/login");
}
