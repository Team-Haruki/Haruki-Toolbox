import {toast} from "vue-sonner";
import {useUserStore} from "@/stores/user"

const userStore = useUserStore()

function Logout() {
    userStore.clearUser()
    toast.success("注销成功")
    router.push("/user/login")
}