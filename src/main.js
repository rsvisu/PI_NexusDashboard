import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import { updatePrimaryPalette, palette } from '@primeuix/themes'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.js'

// # App:
const app = createApp(App)

// ## Pinia:
app.use(createPinia())

// Inicializamos el authStore antes del
// router para que el beforeEach del router
// tenga acceso a la sesión del usuario
const authStore = useAuthStore()
await authStore.initialize()

// ## Router:
app.use(router)

// ## PrimeVue:
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark'
    }
  }
})
// Cambiamos el color primario de PrimeVue al color de la marca
updatePrimaryPalette(palette('#e7751e'))

// Servicios de PrimeVue para usar useConfirm() y useToast() en cualquier componente
app.use(ConfirmationService)
app.use(ToastService)

// ## Montaje:
app.mount('#app')
