<template>
  <div class="approval-detail">
    <div class="page-header">
      <router-link to="/approvals" class="back-link">← 返回审批列表</router-link>
      <h1>{{ approval?.title || '审批详情' }}</h1>
    </div>
    <div v-if="approval" class="detail-content">
      <div class="card">
        <div class="detail-meta">
          <span class="status-tag" :class="statusClass(approval.status)">{{ statusLabel(approval.status) }}</span>
          <span class="detail-type">{{ typeLabel(approval.type) }}</span>
        </div>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-item__label">申请人</span>
            <span class="detail-item__value">{{ approval.requester }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">涉及金额</span>
            <span class="detail-item__value">¥{{ approval.amount.toLocaleString() }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-item__label">申请时间</span>
            <span class="detail-item__value">{{ approval.createdAt }}</span>
          </div>
          <div v-if="approval.decidedAt" class="detail-item">
            <span class="detail-item__label">审批时间</span>
            <span class="detail-item__value">{{ approval.decidedAt }}</span>
          </div>
        </div>
        <div class="detail-reason">
          <h3>申请理由</h3>
          <p>{{ approval.reason }}</p>
        </div>
        <div v-if="approval.status === 'pending'" class="detail-actions">
          <button class="btn btn-primary" :disabled="loading" @click="handleApprove">
            通过
          </button>
          <button class="btn btn-danger" :disabled="loading" @click="showReject = true">
            拒绝
          </button>
        </div>
        <div v-if="showReject" class="reject-form">
          <label class="form-label" for="rejectReason">拒绝理由</label>
          <input id="rejectReason" v-model="rejectReason" class="form-input" placeholder="请输入拒绝理由" />
          <button class="btn btn-danger" :disabled="!rejectReason || loading" @click="handleReject">
            确认拒绝
          </button>
        </div>
      </div>
    </div>
    <p v-else class="empty-state">加载中...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { approvalApi } from '../../services/api'
import type { Approval } from '../../types'

const route = useRoute()
const approval = ref<Approval | null>(null)
const loading = ref(false)
const showReject = ref(false)
const rejectReason = ref('')

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

async function handleApprove() {
  if (!approval.value) return
  loading.value = true
  try {
    await approvalApi.approve(approval.value.id)
    approval.value.status = 'approved'
  } finally {
    loading.value = false
  }
}

async function handleReject() {
  if (!approval.value) return
  loading.value = true
  try {
    await approvalApi.reject(approval.value.id, rejectReason.value)
    approval.value.status = 'rejected'
    showReject.value = false
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const { data } = await approvalApi.getDetail(id)
    approval.value = data.data
  } catch {
    // 占位
  }
})
</script>

<style scoped>
.back-link {
  display: inline-block;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-sm);
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.detail-type {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.detail-item__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xs);
}

.detail-item__value {
  font-weight: 600;
}

.detail-reason {
  margin-bottom: var(--spacing-lg);
}

.detail-reason h3 {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.detail-reason p {
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.detail-actions {
  display: flex;
  gap: var(--spacing-md);
}

.reject-form {
  margin-top: var(--spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.empty-state {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xxl);
}
</style>
