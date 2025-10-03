import './style.css'
import App from './App.vue'
import router from './router'
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import {useUserStore} from "@/components/users/data/store";

const app = createApp(App)
app.use(createPinia())
app.use(router)

app.mount('#app')

const userStore = useUserStore()
userStore.restoreUser()