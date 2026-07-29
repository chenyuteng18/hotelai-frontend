<template>
  <div class="ops-page">
    <div class="page-header">
      <h1>执行控制面板</h1>
      <p>安全开关与执行记录管理</p>
    </div>

    <div class="card switches-section">
      <h2>三级安全开关</h2>
      <div v-if="loadingSwitches" class="loading-indicator">加载开关配置中...</div>
      <div v-else class="switches-grid">
        <div class="switch-card" :class="switchCardClass(switches.kill_switch)">
          <div class="switch-card__header">
            <span class="switch-card__level">Level 1</span>
            <span class="switch-card__icon" aria-hidden="true">🛑</span>
          </div>
          <h3 class="switch-card__title">Kill Switch</h3>
          <p class="switch-card__desc">紧急停止所有自动执行，立即生效</p>
          <div class="switch-card__control">
            <button
              class="toggle"
              :class="{ 'toggle--on': switches.kill_switch }"
              :aria-pressed="switches.kill_switch"
              :aria-label="'Kill Switch ' + (switches.kill_switch ? '已启用' : '已禁用')"
              :disabled="saving"
              @click="requestToggle('kill_switch')"
            >
              <span class="toggle__knob"></span>
            </button>
            <span class="switch-status">{{ switches.kill_switch ? '已启用' : '已禁用' }}</span>
          </div>
        </div>

        <div class="switch-card" :class="switchCardClass(switches.allow_live_execution)">
          <div class="switch-card__header">
            <span class="switch-card__level">Level 2</span>
            <span class="switch-card__icon" aria-hidden="true">⚡</span>
          </div>
          <h3 class="switch-card__title">Allow Live Execution</h3>
          <p class="switch-card__desc">允许 AI 建议直接执行改价操作</p>
          <div class="switch-card__control">
            <button
              class="toggle"
              :class="{ 'toggle--on': switches.allow_live_execution }"
              :aria-pressed="switches.allow_live_execution"
              :aria-label="'Live Execution ' + (switches.allow_live_execution ? '已启用' : '已禁用')"
              :disabled="switches.kill_switch || saving"
              @click="requestToggle('allow_live_execution')"
            >
              <span class="toggle__knob"></span>
            </button>
            <span class="switch-status">{{ switches.allow_live_execution ? '已启用' : '已禁用' }}</span>
          </div>
        </div>

        <div class="switch-card" :class="switchCardClass(switches.dry_run_baseline)">
          <div class="switch-card__header">
            <span class="switch-card__level">Level 3</span>
            <span class="switch-card__icon" aria-hidden="true">🔬</span>
          </div>
          <h3 class="switch-card__title">Dry Run Baseline</h3>
          <p class="switch-card__desc">仅模拟执行，不实际改价，用于验证策略</p>
          <div class="switch-card__control">
            <button
              class="toggle"
              :class="{ 'toggle--on': switches.dry_run_baseline }"
              :aria-pressed="switches.dry_run_baseline"
              :aria-label="'Dry Run ' + (switches.dry_run_baseline ? '已启用' : '已禁用')"
              :disabled="switches.kill_switch || saving"
              @click="requestToggle('dry_run_baseline')"
            >
              <span class="toggle__knob"></span>
            </button>
            <span class="switch-status">{{ switches.dry_run_baseline ? '已启用' : '已禁用' }}</span>
          </div>
        </div>
      </div>
      <div v-if="saving" class="saving-indicator">保存中...</div>
    </div>

    <div class="card records-section">
      <div class="records-header">
        <h2>最近执行记录</h2>
        <button class="btn" :disabled="loadingRecords" @click="fetchRecords">
          {{ loadingRecords ? '刷新中...' : '刷新' }}
        </button>
      </div>
      <div v-if="!records.length && !loadingRecords" class="empty-state">
        <p>暂无执行记录</p>
        <p class="empty-hint">当 AI 执行改价操作后，记录将显示在此处</p>
      </div>
      <div v-else class="table-wrapper">
        <table class="records-table">
          <thead>
            <tr>
              <th>执行时间</th>
              <th>类型</th>
              <th>房型</th>
              <th>日期</th>
              <th>原价</th>
              <th>新价</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in paginatedRecords" :key="record.id">
              <td>{{ record.executedAt }}</td>
              <td>{{ record.type }}</td>
              <td>{{ record.roomType }}</td>
              <td>{{ record.date }}</td>
              <td>¥{{ record.originalPrice?.toLocaleString() ?? '--' }}</td>
              <td>¥{{ record.newPrice?.toLocaleString() ?? '--' }}</td>
              <td>
                <span class="status-tag" :class="recordStatusClass(record.status)">
                  {{ recordStatusLabel(record.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="records.length > pageSize" class="pagination">
        <button class="btn btn-sm" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
        <span class="pagination__info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="btn btn-sm" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
      </div>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" :type="toastType" :retryable="toastRetryable" @update:show="toastVisible = $event" @retry="toastRetryAction" />
    <ConfirmDialog
      :show="confirmShow"
      :title="confirmTitle"
      :message="confirmMessage"
      :type="confirmDialogType"
      confirm-text="确认执行"
      cancel-text="取消"
      @update:show="confirmShow = $event"
      @confirm="handleConfirm"
      @cancel="confirmShow = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import AppToast from '../../components/common/AppToast.vue'
import ConfirmDialog from '../../components/common/ConfirmDialog.vue'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://118.190.207.62:8080/api',
  timeout: 15000,
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

interface ExecutionRecord {
  id: number
  executedAt: string
  type: string
  roomType: string
  date: string
  originalPrice: number | null
  newPrice: number | null
  status: 'success' | 'failed' | 'skipped' | 'dry_run'
}

const switches = reactive({
  kill_switch: false,
  allow_live_execution: false,
  dry_run_baseline: true,
})

const saving = ref(false)
const loadingSwitches = ref(false)
const records = ref<ExecutionRecord[]>([])
const loadingRecords = ref(false)
const currentPage = ref(1)
const pageSize = 50

const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'error' | 'success' | 'warning'>('error')
const toastRetryable = ref(false)
let toastRetryAction: (() => void) | undefined

const confirmShow = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmDialogType = ref<'default' | 'danger'>('danger')
let confirmAction: (() => void) | null = null

const totalPages = computed(() => Math.ceil(records.value.length / pageSize))
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return records.value.slice(start, start + pageSize)
})

function switchCardClass(enabled: boolean) {
  return enabled ? 'switch-card--active' : ''
}

function showToast(message: string, type: 'error' | 'success' | 'warning' = 'error', retryable = false, retryFn: (() => void) | undefined = undefined) {
  toastMessage.value = message
  toastType.value = type
  toastRetryable.value = retryable
  toastRetryAction = retryFn
  toastVisible.value = true
}

function requestConfirm(title: string, message: string, action: () => void, type: 'default' | 'danger' = 'danger') {
  confirmTitle.value = title
  confirmMessage.value = message
  confirmAction = action
  confirmDialogType.value = type
  confirmShow.value = true
}

function handleConfirm() {
  confirmShow.value = false
  if (confirmAction) {
    confirmAction()
    confirmAction = null
  }
}

function requestToggle(key: keyof typeof switches) {
  const labels: Record<string, string> = {
    kill_switch: 'Kill Switch',
    allow_live_execution: 'Allow Live Execution',
    dry_run_baseline: 'Dry Run Baseline',
  }
  const willEnable = !switches[key]
  const action = willEnable ? '启用' : '禁用'
  requestConfirm(
    `确认${action}${labels[key]}`,
    '确认执行此操作？执行后将立即生效。',
    () => executeToggle(key),
    key === 'kill_switch' && willEnable ? 'danger' : 'default'
  )
}

async function executeToggle(key: keyof typeof switches) {
  switches[key] = !switches[key]
  if (key === 'kill_switch' && switches[key]) {
    switches.allow_live_execution = false
  }
  saving.value = true
  try {
    await http.put('/v1/ops/switches', { ...switches })
    showToast('开关配置已保存', 'success')
  } catch {
    switches[key] = !switches[key]
    showToast('保存开关配置失败，请稍后重试', 'error', true, () => executeToggle(key))
  } finally {
    saving.value = false
  }
}

async function fetchSwitches() {
  loadingSwitches.value = true
  try {
    const { data } = await http.get('/v1/ops/switches')
    Object.assign(switches, data.data)
  } catch {
    showToast('加载开关配置失败', 'error', true, fetchSwitches)
  } finally {
    loadingSwitches.value = false
  }
}

async function fetchRecords() {
  loadingRecords.value = true
  try {
    const { data } = await http.get('/v1/ops/records')
    records.value = data.data || []
  } catch {
    records.value = []
    showToast('加载执行记录失败，请稍后重试', 'error', true, fetchRecords)
  } finally {
    loadingRecords.value = false
  }
}

function recordStatusClass(status: string) {
  if (status === 'success') return 'status-tag--success'
  if (status === 'failed') return 'status-tag--error'
  if (status === 'dry_run') return 'status-tag--info'
  return 'status-tag--default'
}

function recordStatusLabel(status: string) {
  if (status === 'success') return '成功'
  if (status === 'failed') return '失败'
  if (status === 'dry_run') return '模拟'
  return '跳过'
}

onMounted(() => {
  fetchSwitches()
  fetchRecords()
})
</script>

<style scoped>
.switches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.switch-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all 0.2s;
}

.switch-card--active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.switch-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.switch-card__level {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-weight: 600;
  text-transform: uppercase;
}

.switch-card__icon {
  font-size: 24px;
}

.switch-card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.switch-card__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  min-height: 40px;
}

.switch-card__control {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.toggle {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background: #ccc;
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
}

.toggle--on {
  background: var(--color-primary);
}

.toggle__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle--on .toggle__knob {
  transform: translateX(22px);
}

.toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.switch-status {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.loading-indicator {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-tertiary);
  font-size: var(--font-size-sm);
}

.saving-indicator {
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.records-header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-tertiary);
}

.empty-hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.table-wrapper {
  overflow-x: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

.records-table th,
.records-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.records-table th {
  font-weight: 600;
  background: var(--color-bg);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.pagination__info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.btn-sm {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}
</style>
