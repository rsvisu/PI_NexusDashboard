import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { updatePrimaryPalette, palette } from '@primeuix/themes'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark'
    }
  }
})

updatePrimaryPalette(palette('#e7751e')) // Cambiamos el color primario de PrimeVue al color de la marca

// Inicializamos la sesión antes de montar la app:
// así, cuando el guard del router dispare en la primera navegación, 
// la store ya tendrá el estado real
const authStore = useAuthStore()
await authStore.initialize()

app.mount('#app')
