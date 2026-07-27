<template>
  <div class="approvals-page">
    <div class="page-header">
      <h1>审批中心</h1>
      <p>价格调整、库存释放、促销活动审批</p>
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
          <span class="approval-card__amount">¥{{ item.amount.toLocaleString() }}</span>
        </div>
      </router-link>
    </div>
    <p v-if="!filteredApprovals.length" class="empty-state">暂无审批记录</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { approvalApi } from '../../services/api'
import type { Approval } from '../../types'

const approvals = ref<Approval[]>([])
const activeFilter = ref('all')

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

onMounted(async () => {
  try {
    const { data } = await approvalApi.getList()
    approvals.value = data.data.items
  } catch {
    // 占位
  }
})
</script>

<style scoped>
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
</style>
