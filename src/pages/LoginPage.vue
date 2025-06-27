<template>
  <div class="flex items-center justify-center h-screen bg-gray-100 font-sans">
    <div class="w-full max-w-md">
      <div class="text-center bg-white p-12 rounded-lg shadow-lg">
        <h1 class="text-3xl font-bold text-gray-800">Welcome to Calendar</h1>
        <p class="text-gray-600 my-4">Please log in to continue</p>
        
        <form @submit.prevent="handleEmailLogin" class="space-y-6">
          <div>
            <input
              v-model="credentials.email"
              type="email"
              placeholder="Email"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              v-model="credentials.password"
              type="password"
              placeholder="Password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            class="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white border-none rounded-lg text-lg cursor-pointer transition-colors hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        <div class="my-6 flex items-center">
          <div class="flex-grow border-t border-gray-300"></div>
          <span class="px-4 text-gray-500">OR</span>
          <div class="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          class="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg text-lg cursor-pointer transition-colors hover:bg-gray-50"
          @click="handleGoogleLogin"
        >
          <i class="google-icon"></i>
          <span>Login with Google</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getGoogleRedirectUrl } from '../services/api'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const router = useRouter()
const authStore = useAuthStore()

const credentials = reactive({
  email: '',
  password: '',
})

async function handleEmailLogin() {
  try {
    await authStore.login(credentials)
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: 'Invalid email or password. Please try again.',
      confirmButtonColor: '#4285F4',
    })
  }
}

async function handleGoogleLogin() {
  try {
    const redirectUrl = await getGoogleRedirectUrl()
    window.location.href = redirectUrl
  } catch (error) {
    console.error('Failed to get Google login URL:', error)
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: 'Could not connect to Google login. Please try again later.',
      confirmButtonColor: '#4285F4',
    })
  }
}
</script>

<style scoped>
.google-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  background: url('https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg') no-repeat center center;
  background-size: contain;
}
</style> 