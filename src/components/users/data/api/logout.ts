import {toast} from "vue-sonner";
import {useUserStore} from "@/stores/user"
import { useRouter } from "vue-router";

const userStore = useUserStore()
const router = useRouter()

export async function Logout() {
    userStore.clearUser()
    toast.success("注销成功")
    await router.push("/user/login")
}