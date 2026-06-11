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
          meta: { section: 'conversaciones' },
        },
        {
          path: 'conversaciones/:id',
          name: 'conversation-detail',
          component: () => import('../views/ConversationDetailView.vue'),
          meta: { section: 'conversaciones' },
        },
        {
          path: 'conocimientos',
          name: 'knowledge',
          component: () => import('../views/KnowledgeView.vue'),
        },
        {
          path: 'feedback',
          name: 'feedback',
          component: () => import('../views/FeedbackView.vue'),
        },
        {
          path: 'configuracion',
          name: 'config',
          component: () => import('../views/ConfigView.vue'),
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

router.beforeEach((to, _from) => {
  const authStore = useAuthStore()

  // Si la ruta requiere autenticación y no se autenticado, redirigir a login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // Si se esta autenticado y se va a login, redirigir a home
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'home' }
  }

  // En cualquier otro caso, permitir la ruta
  return true
})

export default router
