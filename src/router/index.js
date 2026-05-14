import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/conversaciones',
      name: 'conversations',
      component: () => import('../views/ConversationsView.vue'),
    },
    {
      path: '/conversaciones/:id',
      name: 'conversation-detail',
      component: () => import('../views/ConversationDetailView.vue'),
    },
  ],
})

// Guard global: protege todas las rutas excepto /login.
// Como initialize() ya corrió en main.js antes del mount, la store de auth
// está sincronizada con la sesión real en este punto.
router.beforeEach((to) => {
  if (to.name === 'login') {
    return true
  }

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  return true
})

export default router