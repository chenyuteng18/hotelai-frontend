<template>
  <div class="change-password-page">
    <div class="card change-password-card">
      <div class="page-header">
        <h1>修改密码</h1>
        <p>更新您的账户密码</p>
      </div>
      <form @submit.prevent="handleSubmit" novalidate>
        <div class="form-group">
          <label class="form-label" for="oldPassword">当前密码</label>
          <input
            id="oldPassword"
            v-model="form.oldPassword"
            type="password"
            class="form-input"
            autocomplete="current-password"
            required
            aria-required="true"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="newPassword">新密码</label>
          <input
            id="newPassword"
            v-model="form.newPassword"
            type="password"
            class="form-input"
            autocomplete="new-password"
            required
            aria-required="true"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="confirmPassword">确认新密码</label>
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            class="form-input"
            autocomplete="new-password"
            required
            aria-required="true"
          />
        </div>
        <p v-if="error" class="error-text" role="alert">{{ error }}</p>
        <p v-if="success" class="success-text" role="status">密码修改成功</p>
        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? '提交中...' : '确认修改' }}
          </button>
          <router-link to="/settings" class="btn">返回设置</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = false
  if (form.newPassword !== form.confirmPassword) {
    error.value = '两次输入的新密码不一致'
    return
  }
  if (form.newPassword.length < 6) {
    error.value = '新密码至少 6 位'
    return
  }
  loading.value = true
  try {
    await authStore.changePassword(form.oldPassword, form.newPassword)
    success.value = true
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch {
    error.value = '修改失败，请检查当前密码是否正确'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-password-page {
  max-width: 480px;
  margin: 0 auto;
}

.error-text {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.success-text {
  color: var(--color-success);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.actions {
  display: flex;
  gap: var(--spacing-md);
}
</style>
