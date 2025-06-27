import { defineStore } from 'pinia'
import { getAuthenticatedUser, loginWithEmail, logoutUser } from '../services/api'
import router from '../router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('access_token') || null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    // Action to set user and token
    setAuth({ user, token }) {
      this.user = user
      this.token = token
      if (token) {
        localStorage.setItem('access_token', token)
      } else {
        localStorage.removeItem('access_token')
      }
    },

    // Login with email and password
    async login(credentials) {
      this.loading = true
      try {
        const response = await loginWithEmail(credentials)
        const token = response.data.access_token

        if (!token) {
          throw new Error('No token received from server')
        }

        localStorage.setItem('access_token', token)
        this.token = token

        const user = await getAuthenticatedUser()
        this.setAuth({ user, token })

        router.push('/')
      } catch (error) {
        this.setAuth({ user: null, token: null })
        throw error // Re-throw to be caught by the component
      } finally {
        this.loading = false
      }
    },

    // Check if a user is logged in (e.g., on page refresh)
    async checkAuth() {
      if (!this.token) return

      this.loading = true
      try {
        const user = await getAuthenticatedUser()
        this.setAuth({ user, token: this.token })
      } catch (error) {
        // Token is invalid or expired
        this.setAuth({ user: null, token: null })
      } finally {
        this.loading = false
      }
    },

    // Logout the user
    async logout() {
      this.loading = true
      try {
        await logoutUser()
      } catch (error) {
        console.error('Logout API call failed, but logging out on frontend anyway.', error)
      } finally {
        this.setAuth({ user: null, token: null })
        router.push('/login')
        this.loading = false
      }
    },

    async disconnectGoogle() {
      this.loading = true
      try {
        await import('../services/api').then(m => m.disconnectGoogle())
        // Optionally, update user state here or in the component
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },
  },
}) 