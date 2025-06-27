import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style.css'
import { createPinia, setActivePinia } from 'pinia'

const pinia = createPinia()
setActivePinia(pinia)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
