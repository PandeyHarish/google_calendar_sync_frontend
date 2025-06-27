import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: { requiresAuth: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/auth/google/callback',
    name: 'GoogleCallback',
    beforeEnter: async (to, from, next) => {
      const authStore = useAuthStore()
      const urlParams = new URLSearchParams(window.location.search)
      const token = urlParams.get('access_token')

      if (token) {
        localStorage.setItem('access_token', token)
        await authStore.checkAuth()
      }

      // Clean up URL after processing token
      window.history.replaceState({}, document.title, '/')
      next({ name: 'Home' })
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { useAuthStore } = await import('../stores/auth')
  const authStore = useAuthStore()

  // If there's a token in storage but user is not authenticated, check it
  if (authStore.token && !authStore.isAuthenticated) {
    try {
      await authStore.checkAuth()
    } catch (e) {
      console.warn('[Router] Auth check failed:', e)
      localStorage.removeItem('access_token')
    }
  }

  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' })
  }

  if (to.name === 'Login' && isAuthenticated) {
    return next({ name: 'Home' })
  }

  next()
})

export default router
