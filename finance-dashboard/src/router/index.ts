import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/auth/auth'
import HomePage from '@/pages/HomePage.vue'
import CallbackPage from '@/pages/CallbackPage.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import CustomChartPage from '@/pages/CustomChartPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/callback',
      name: 'callback',
      component: CallbackPage,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/custom-chart',
      name: 'custom-chart',
      component: CustomChartPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/change-password',
      name: 'change-password',
      component: () => import('@/pages/ChangePasswordPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/delete-account',
      name: 'delete-account',
      component: () => import('@/pages/DeleteAccountPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'home' }
  }

  if (to.name === 'home' && isAuthenticated.value) {
    return { name: 'dashboard' }
  }
})

export default router
