import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      // Ruta principal de la App:
      // Todas las rutas hijas se renderizan dentro de
      // del <RouterView /> de DefaultLayout
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'conversaciones',
          name: 'conversations',
          component: () => import('../views/ConversationsView.vue'),
        },
        {
          path: 'conversaciones/:id',
          name: 'conversation-detail',
          component: () => import('../views/ConversationDetailView.vue'),
        },
      ],
    },
  ],
})

// Actúa antes de resolver las rutas y decide según si
// el usuario esta autenticado si le deja seguir o le
// redirige al login
router.beforeEach((to) => {
  if (!to.meta.requiresAuth) {
    return true
  }

  const authStore = useAuthStore()
  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  return true
})

export default router
