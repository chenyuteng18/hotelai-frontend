<template>
  <div class="suggestion-detail">
    <div class="page-header">
      <router-link to="/suggestions" class="back-link">← 返回建议列表</router-link>
      <h1>{{ suggestion?.title || '建议详情' }}</h1>
    </div>
    <div v-if="suggestion" class="detail-content">
      <div class="card detail-card">
        <div class="detail-meta">
          <span class="status-tag" :class="priorityClass(suggestion.priority)">{{ priorityLabel(suggestion.priority) }}</span>
          <span class="status-tag" :class="statusClass(suggestion.status)">{{ statusLabel(suggestion.status) }}</span>
          <span class="detail-date">{{ suggestion.createdAt }}</span>
        </div>
        <p class="detail-desc">{{ suggestion.description }}</p>
        <div class="detail-metrics">
          <div class="metric-box">
            <span class="metric-box__label">预期收益影响</span>
            <span class="metric-box__value">+¥{{ suggestion.expectedImpact.toLocaleString() }}</span>
          </div>
          <div class="metric-box">
            <span class="metric-box__label">安全边界</span>
            <span class="metric-box__value">{{ (suggestion.safetyMargin * 100).toFixed(0) }}%</span>
          </div>
          <div class="metric-box">
            <span class="metric-box__label">执行进度</span>
            <span class="metric-box__value">{{ (suggestion.currentProgress * 100).toFixed(0) }}%</span>
          </div>
        </div>
        <div class="detail-progress">
          <div class="progress-bar">
            <div
              class="progress-bar__fill progress-bar__fill--safe"
              :style="{ width: (suggestion.currentProgress * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="empty-state">加载中...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { suggestionApi } from '../../services/api'
import type { Suggestion } from '../../types'

const route = useRoute()
const suggestion = ref<Suggestion | null>(null)

function priorityClass(p: string) {
  if (p === 'high') return 'status-tag--error'
  if (p === 'medium') return 'status-tag--warning'
  return 'status-tag--default'
}

function priorityLabel(p: string) {
  if (p === 'high') return '高优先'
  if (p === 'medium') return '中优先'
  return '低优先'
}

function statusClass(s: string) {
  if (s === 'approved') return 'status-tag--success'
  if (s === 'rejected') return 'status-tag--error'
  return 'status-tag--info'
}

function statusLabel(s: string) {
  if (s === 'approved') return '已通过'
  if (s === 'rejected') return '已拒绝'
  return '待处理'
}

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const { data } = await suggestionApi.getDetail(id)
    suggestion.value = data.data
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
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.detail-date {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  margin-left: auto;
}

.detail-desc {
  font-size: var(--font-size-base);
  line-height: 1.8;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-secondary);
}

.detail-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.metric-box {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
}

.metric-box__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.metric-box__value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-primary);
}

.empty-state {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xxl);
}
</style>
