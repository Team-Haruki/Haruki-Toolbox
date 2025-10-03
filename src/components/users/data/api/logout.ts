import {toast} from "vue-sonner";
import {useRouter} from "vue-router";
import {useUserStore} from "@/components/users/data/store";

export async function logout() {
    const userStore = useUserStore();
    const router = useRouter();

    userStore.clearUser();
    toast.success("注销成功");
    await router.push("/user/login");
}