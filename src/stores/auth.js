import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '../services/supabaseClient.js'
import router from '../router/index.js'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isAuthenticated = computed(() => user.value !== null)

    /**
     * Lee la sesión guardada en localStorage (si existe y sigue vigente)
     * y suscribe un listener para mantener al user  sincronizado con cambios
     * de sesión (login, logout, refresco de token, otra pestaña).
     * Se llama una sola vez desde main.js, antes de montar la app.
     */
    async function initialize() {
        const response = await supabase.auth.getSession()
        const session = response.data.session

        if (session) {
            user.value = session.user
        } else {
            user.value = null
        }

        supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession) {
                user.value = newSession.user
            } else {
                user.value = null
            }
        })
    }

    async function login(email, password) {
        const response = await supabase.auth.signInWithPassword({ email, password })
        if (response.error) {
            throw response.error
        }
        user.value = response.data.user
    }

    async function logout() {
        await supabase.auth.signOut()
        user.value = null
        router.push({ name: 'login' })
    }

    return { user, isAuthenticated, initialize, login, logout }
})