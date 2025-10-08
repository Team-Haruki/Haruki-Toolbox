import './style.css'
import App from './App.vue'
import router from './router'
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import {useUserStore} from "@/store";


const app = createApp(App)
app.use(createPinia())
const userStore = useUserStore()
userStore.restoreUser()
app.use(router)
app.mount('#app')

