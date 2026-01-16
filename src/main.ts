import './style.css'
import App from './App.vue'
import router from './router'
import {createApp} from 'vue'
import {createPinia} from 'pinia'
import {createPersistedState} from "pinia-plugin-persistedstate";
import {useUserStore} from "@/store";


const app = createApp(App)
const pinia = createPinia()
pinia.use(createPersistedState())
app.use(pinia)
const userStore = useUserStore()
userStore.checkExpiration()
app.use(router)
app.mount('#app')

