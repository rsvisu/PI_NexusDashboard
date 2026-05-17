import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import DefaultLayout from '../layouts/DefaultLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // ## Login:
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      // ## App:
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
    {
      // ## 404:
      // Captura cualquier ruta no definida arriba
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to, from) => {
  const authStore = useAuthStore()

  // Si se esta autenticado, redirigir de login a home
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  // Si no está autenticado, redirigir a login
  if (!authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // En cualquier otro caso, permitir la ruta
  return true
})

export default router
