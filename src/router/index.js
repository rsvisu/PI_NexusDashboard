import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

export default router
