<template>
  <div class="approvals-page">
    <div v-if="isDataStale" class="warning-banner" role="alert">
      <span class="warning-banner__icon" aria-hidden="true">⚠️</span>
      <span>数据已超过 {{ staleHours }} 小时未更新，最后更新：{{ lastUpdated || '未知' }}</span>
      <button class="btn btn-sm" @click="refreshData">刷新</button>
    </div>

    <div class="page-header">
      <div class="page-header__left">
        <h1>审批中心</h1>
        <p>价格调整、库存释放、促销活动审批</p>
      </div>
      <div class="page-header__right">
        <div class="competitor-stats">
          <div class="stat-item">
            <span class="stat-label">竞对数量</span>
            <span class="stat-value">{{ competitorCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">竞对均价</span>
            <span class="stat-value">¥{{ competitorAvgPrice?.toLocaleString() ?? '--' }}</span>
          </div>
        </div>
        <div class="preview-toggle">
          <label class="toggle-label">
            <input type="checkbox" v-model="previewMode" />
            <span>预览模式</span>
          </label>
          <span v-if="previewMode" class="preview-hint">（不写入数据库）</span>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="btn filter-btn"
        :class="{ 'btn-primary': activeFilter === f.value }"
        :aria-pressed="activeFilter === f.value"
        @click="activeFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="approval-list">
      <router-link
        v-for="item in filteredApprovals"
        :key="item.id"
        :to="'/approvals/' + item.id"
        class="card approval-card"
      >
        <div class="approval-card__left">
          <span class="status-tag" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
          <h2 class="approval-card__title">{{ item.title }}</h2>
          <p class="approval-card__meta">
            {{ typeLabel(item.type) }} · {{ item.requester }} · {{ item.createdAt }}
          </p>
        </div>
        <div class="approval-card__right">
          <span class="approval-card__amount">{{ formatCurrency(item.amount) }}</span>
        </div>
      </router-link>
    </div>

    <div v-if="!filteredApprovals.length" class="empty-state">
      <p>暂无审批记录</p>
      <p class="empty-hint">当有审批记录时将在此显示</p>
    </div>
    <AppToast :show="!!toastMessage" :message="toastMessage" :type="toastType" @update:show="toastMessage = ''" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { approvalApi, competitorApi } from '../../services/api'
import { formatCurrency } from '../../utils/format'
import AppToast from '../../components/common/AppToast.vue'
import type { Approval } from '../../types'

const approvals = ref<Approval[]>([])
const activeFilter = ref('all')
const previewMode = ref(false)
const competitorCount = ref(0)
const competitorAvgPrice = ref<number | null>(null)
const lastUpdated = ref('')
const staleHours = ref(0)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('error')

const filters = [
  { label: '全部', value: 'all' },
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]

const filteredApprovals = computed(() => {
  if (activeFilter.value === 'all') return approvals.value
  return approvals.value.filter((a) => a.status === activeFilter.value)
})

const isDataStale = computed(() => staleHours.value >= 2)

function statusClass(s: string) {
  if (s === 'approved') return 'status-tag--success'
  if (s === 'rejected') return 'status-tag--error'
  return 'status-tag--warning'
}

function statusLabel(s: string) {
  if (s === 'approved') return '已通过'
  if (s === 'rejected') return '已拒绝'
  return '待审批'
}

function typeLabel(t: string) {
  if (t === 'price_change') return '价格调整'
  if (t === 'inventory_release') return '库存释放'
  return '促销活动'
}

async function refreshData() {
  try {
    const { data } = await approvalApi.getList()
    approvals.value = data.data.items
    lastUpdated.value = new Date().toLocaleString()
    staleHours.value = 0
  } catch {
    // silent
  }
}

async function fetchCompetitorStats() {
  try {
    const { data } = await competitorApi.getList()
    const list = data.data || []
    competitorCount.value = list.length
    if (list.length) {
      const total = list.reduce((sum: number, c: { avgPrice: number }) => sum + c.avgPrice, 0)
      competitorAvgPrice.value = Math.round(total / list.length)
    }
  } catch {
    // silent
  }
}

onMounted(async () => {
  try {
    const { data } = await approvalApi.getList()
    approvals.value = data.data.items
    lastUpdated.value = new Date().toLocaleString()
  } catch {
    toastType.value = 'error'
    toastMessage.value = '获取审批列表失败，请稍后重试'
  }
  fetchCompetitorStats()

  // Simulate stale check
  const savedTime = localStorage.getItem('approvals_last_update')
  if (savedTime) {
    const diff = Date.now() - parseInt(savedTime, 10)
    staleHours.value = Math.floor(diff / (1000 * 60 * 60))
  }
  localStorage.setItem('approvals_last_update', Date.now().toString())
})
</script>

<style scoped>
.warning-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-warning-bg);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.warning-banner__icon {
  font-size: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.page-header__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-md);
}

.competitor-stats {
  display: flex;
  gap: var(--spacing-lg);
}

.stat-item {
  text-align: right;
}

.stat-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.stat-value {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.preview-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.preview-hint {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.filter-bar {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 14px;
  font-size: var(--font-size-sm);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.approval-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
  padding: var(--spacing-md) var(--spacing-lg);
  transition: box-shadow 0.2s;
}

.approval-card:hover {
  box-shadow: var(--shadow-md);
}

.approval-card__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: var(--spacing-xs) 0;
}

.approval-card__meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
}

.approval-card__amount {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xxl);
}

.empty-hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.btn-sm {
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}
</style>
