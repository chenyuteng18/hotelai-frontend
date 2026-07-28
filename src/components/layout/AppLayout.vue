<template>
  <div class="layout">
    <aside class="sidebar" :class="{ 'sidebar--collapsed': collapsed }" aria-label="主导航">
      <div class="sidebar__logo">
        <span class="sidebar__logo-icon" aria-hidden="true">H</span>
        <span v-show="!collapsed" class="sidebar__logo-text">HotelAI</span>
      </div>
      <nav class="sidebar__nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="sidebar__link"
          :aria-label="item.label"
        >
          <span class="sidebar__link-icon" aria-hidden="true">{{ item.icon }}</span>
          <span v-show="!collapsed" class="sidebar__link-text">{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <div class="layout__main">
      <header class="header">
        <button
          class="header__toggle"
          :aria-expanded="!collapsed"
          aria-label="切换侧边栏"
          @click="collapsed = !collapsed"
        >
          ☰
        </button>
        <div class="header__center">
          <div class="autopilot-switch" :class="{ 'autopilot-switch--active': autopilotEnabled }">
            <button
              class="autopilot-switch__toggle"
              role="switch"
              :aria-checked="autopilotEnabled"
              aria-label="Autopilot 全局开关"
              @click="toggleAutopilot"
            >
              <span class="autopilot-switch__knob"></span>
              <span class="autopilot-switch__label">Autopilot</span>
            </button>
          </div>
          <div class="integration-status" aria-label="集成状态">
            <span
              v-for="ch in integrationChannels"
              :key="ch.name"
              class="integration-dot"
              :class="'integration-dot--' + ch.status"
              :title="ch.name + '：' + statusText(ch.status)"
            >
              <span class="integration-dot__label">{{ ch.name }}</span>
            </span>
          </div>
        </div>
        <div class="header__right">
          <router-link to="/change-password" class="header__action" aria-label="修改密码">
            修改密码
          </router-link>
          <button class="header__action header__logout" aria-label="退出登录" @click="handleLogout">
            退出
          </button>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { http } from '../../services/api'

const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)
const autopilotEnabled = ref(false)

interface IntegrationChannel {
  name: string
  status: 'online' | 'offline'
}

const integrationChannels = ref<IntegrationChannel[]>([
  { name: '携程', status: 'offline' },
  { name: 'PMS', status: 'offline' },
  { name: '美团', status: 'offline' },
])

function toggleAutopilot() {
  autopilotEnabled.value = !autopilotEnabled.value
  http.put('/v1/autopilot/toggle', { enabled: autopilotEnabled.value }).catch(() => {})
}

function statusText(s: string) {
  if (s === 'online') return '已连接'
  return '未连接'
}

async function fetchIntegrationStatus() {
  try {
    const { data } = await http.get('/v1/integrations/status')
    const list = data.data || data
    if (Array.isArray(list)) {
      integrationChannels.value = list.map((item: any) => ({
        name: item.name,
        status: item.connected ? 'online' : 'offline',
      }))
    }
  } catch {
    // API 不可用时保持默认状态
  }
}

onMounted(() => {
  fetchIntegrationStatus()
})

const navItems = [
  { path: '/calendar', label: '定价日历', icon: '📅' },
  { path: '/dashboard', label: '总览', icon: '📊' },
  { path: '/kanban', label: '收益看板', icon: '📋' },
  { path: '/prediction/occupancy', label: '入住率预测', icon: '📈' },
  { path: '/prediction/revenue', label: '收益预测', icon: '💰' },
  { path: '/prediction/price', label: '房价预测', icon: '🏷️' },
  { path: '/suggestions', label: 'AI 建议', icon: '🤖' },
  { path: '/approvals', label: '审批中心', icon: '✅' },
  { path: '/rooms', label: '房间管理', icon: '🛏️' },
  { path: '/room-types', label: '房型管理', icon: '🏨' },
  { path: '/competitors', label: '竞品分析', icon: '🔍' },
  { path: '/onboarding', label: '开户向导', icon: '📝' },
  { path: '/config', label: '配置管理', icon: '🔧' },
  { path: '/pms-import', label: 'PMS导入', icon: '📥' },
  { path: '/ops', label: '执行控制', icon: '🎛️' },
  { path: '/settings', label: '系统设置', icon: '⚙️' },
]

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background: #001529;
  color: #fff;
  display: flex;
  flex-direction: column;
  transition: width 0.25s ease;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar--collapsed {
  width: 64px;
}

.sidebar__logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  height: var(--header-height);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar__logo-icon {
  width: 32px;
  height: 32px;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.sidebar__logo-text {
  font-size: var(--font-size-lg);
  font-weight: 600;
  white-space: nowrap;
}

.sidebar__nav {
  flex: 1;
  padding: var(--spacing-sm);
  overflow-y: auto;
}

.sidebar__link {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: rgba(255, 255, 255, 0.7);
  transition: all 0.2s;
  margin-bottom: 2px;
}

.sidebar__link:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.sidebar__link.router-link-active {
  color: #fff;
  background: var(--color-primary);
}

.sidebar__link-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.sidebar__link-text {
  white-space: nowrap;
  font-size: var(--font-size-sm);
}

.layout__main {
  flex: 1;
  margin-left: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  transition: margin-left 0.25s ease;
}

.sidebar--collapsed + .layout__main {
  margin-left: 64px;
}

.header {
  height: var(--header-height);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header__toggle {
  background: none;
  border: none;
  font-size: 20px;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.header__toggle:hover {
  background: var(--color-bg);
}

.header__right {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header__action {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  background: none;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.header__action:hover {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.content {
  flex: 1;
  padding: var(--spacing-lg);
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.header__center {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.autopilot-switch__toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  border: 1.5px solid var(--color-border);
  background: var(--color-bg);
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.autopilot-switch--active .autopilot-switch__toggle {
  background: #e6f7ee;
  border-color: #52c41a;
}

.autopilot-switch__knob {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-border);
  transition: background 0.25s ease;
  flex-shrink: 0;
}

.autopilot-switch--active .autopilot-switch__knob {
  background: #52c41a;
  box-shadow: 0 0 6px rgba(82, 196, 26, 0.4);
}

.autopilot-switch__label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.autopilot-switch--active .autopilot-switch__label {
  color: #52c41a;
}

.integration-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.integration-dot {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-tertiary);
  position: relative;
  padding-left: 12px;
}

.integration-dot::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-quaternary, #d9d9d9);
  transition: background 0.3s;
}

.integration-dot--online::before {
  background: #52c41a;
  box-shadow: 0 0 4px rgba(82, 196, 26, 0.5);
}

.integration-dot--offline::before {
  background: #d9d9d9;
}

.integration-dot__label {
  white-space: nowrap;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    width: var(--sidebar-width) !important;
  }

  .sidebar--collapsed {
    transform: translateX(-100%);
  }

  .layout__main {
    margin-left: 0 !important;
  }

  .header__center {
    display: none;
  }
}
</style>
