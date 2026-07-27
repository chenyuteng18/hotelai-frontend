<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>系统设置</h1>
      <p>账户与系统偏好配置</p>
    </div>
    <div class="settings-sections">
      <div class="card settings-card">
        <h2>账户信息</h2>
        <div class="settings-item">
          <span class="settings-item__label">用户名</span>
          <span class="settings-item__value">{{ profile.username || '—' }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-item__label">角色</span>
          <span class="settings-item__value">{{ profile.role || '—' }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-item__label">酒店</span>
          <span class="settings-item__value">{{ profile.hotelName || '—' }}</span>
        </div>
        <router-link to="/change-password" class="btn">修改密码</router-link>
      </div>
      <div class="card settings-card">
        <h2>API 配置</h2>
        <div class="settings-item">
          <span class="settings-item__label">接口地址</span>
          <span class="settings-item__value settings-item__value--mono">{{ apiBase }}</span>
        </div>
        <div class="settings-item">
          <span class="settings-item__label">超时时间</span>
          <span class="settings-item__value">15s</span>
        </div>
      </div>
      <div class="card settings-card">
        <h2>关于</h2>
        <div class="settings-item">
          <span class="settings-item__label">版本</span>
          <span class="settings-item__value">HotelAI Frontend v1.0.0</span>
        </div>
        <div class="settings-item">
          <span class="settings-item__label">技术栈</span>
          <span class="settings-item__value">Vue 3 + TypeScript + Vite</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authApi } from '../../services/api'

const profile = ref({ username: '', role: '', hotelName: '' })
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://118.190.207.62:8080/api'

onMounted(async () => {
  try {
    const { data } = await authApi.getProfile()
    profile.value = data.data
  } catch {
    // 占位
  }
})
</script>

<style scoped>
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 600px;
}

.settings-card h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.settings-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.settings-item:last-of-type {
  border-bottom: none;
  margin-bottom: var(--spacing-md);
}

.settings-item__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.settings-item__value {
  font-weight: 500;
}

.settings-item__value--mono {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: var(--font-size-xs);
}
</style>
