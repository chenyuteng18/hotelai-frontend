<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__header">
        <span class="login-card__logo" aria-hidden="true">H</span>
        <h1>HotelAI</h1>
        <p>酒店智能收益管理系统</p>
      </div>
      <form class="login-form" @submit.prevent="handleLogin" novalidate>
        <div class="form-group">
          <label class="form-label" for="username">用户名</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="form-input"
            placeholder="请输入用户名"
            autocomplete="username"
            required
            aria-required="true"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            class="form-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            required
            aria-required="true"
          />
        </div>
        <p v-if="error" class="login-error" role="alert">{{ error }}</p>
        <button type="submit" class="btn btn-primary login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({ username: '', password: '' })
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.username || !form.password) {
    error.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await authStore.login(form.username, form.password)
    router.push('/dashboard')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '登录失败，请检查用户名和密码'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #001529 0%, #003a70 100%);
  padding: var(--spacing-lg);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xxl) var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.login-card__header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-card__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  color: #fff;
  font-size: var(--font-size-title);
  font-weight: 700;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.login-card__header h1 {
  font-size: var(--font-size-xxl);
  font-weight: 600;
}

.login-card__header p {
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}

.login-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.login-btn {
  width: 100%;
  justify-content: center;
  padding: 12px;
  font-size: var(--font-size-lg);
}
</style>
