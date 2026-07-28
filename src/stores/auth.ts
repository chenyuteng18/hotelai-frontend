import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '../types'
import { authApi } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const { data } = await authApi.login({ username, password })
    token.value = data.data.token
    user.value = data.data.user
    localStorage.setItem('token', data.data.token)
    localStorage.setItem('userRole', data.data.user.role || 'user')
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await authApi.changePassword({ oldPassword, newPassword })
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
  }

  return { token, user, isAuthenticated, login, changePassword, logout }
})
