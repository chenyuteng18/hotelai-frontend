<template>
  <div class="suggestions-page">
    <div class="page-header">
      <h1>AI 建议</h1>
      <p>智能定价与运营优化建议</p>
    </div>
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="btn filter-btn"
        :class="{ 'btn-primary': activeFilter === f.value }"
        :aria-pressed="activeFilter === f.value"
        @click="activeFilter = f.value; page = 1"
      >
        {{ f.label }}
      </button>
    </div>
    <div class="suggestion-list">
      <router-link
        v-for="item in paginatedSuggestions"
        :key="item.id"
        :to="'/suggestions/' + item.id"
        class="card suggestion-card"
      >
        <div class="suggestion-card__top">
          <span class="status-tag" :class="priorityClass(item.priority)">{{ priorityLabel(item.priority) }}</span>
          <span class="status-tag" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
        </div>
        <h2 class="suggestion-card__title">{{ item.title }}</h2>
        <p class="suggestion-card__desc">{{ item.description }}</p>
        <div class="suggestion-card__footer">
          <span>预期收益 +{{ formatCurrency(item.expectedImpact) }}</span>
          <div class="safety-progress">
            <span class="safety-label">安全边界</span>
            <div class="progress-bar">
              <div
                class="progress-bar__fill"
                :class="item.safetyMargin > 0.7 ? 'progress-bar__fill--safe' : item.safetyMargin > 0.4 ? 'progress-bar__fill--warning' : 'progress-bar__fill--danger'"
                :style="{ width: (item.safetyMargin * 100) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </router-link>
    </div>
    <div v-if="!filteredSuggestions.length" class="empty-state">
      <p>暂无建议</p>
      <p class="empty-state__hint">当 AI 生成建议时将在此显示</p>
    </div>
    <div v-else-if="totalPages > 1" class="pagination">
      <button class="btn" :disabled="page <= 1" @click="page--">上一页</button>
      <span class="pagination__info">{{ page }} / {{ totalPages }}</span>
      <button class="btn" :disabled="page >= totalPages" @click="page++">下一页</button>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { suggestionApi } from '../../services/api'
import { formatCurrency } from '../../utils/format'
import AppToast from '../../components/common/AppToast.vue'
import type { Suggestion } from '../../types'

const suggestions = ref<Suggestion[]>([])
const activeFilter = ref('all')
const page = ref(1)
const pageSize = 20
const toastVisible = ref(false)
const toastMessage = ref('')

const filters = [
  { label: '全部', value: 'all' },
  { label: '待处理', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]

const filteredSuggestions = computed(() => {
  if (activeFilter.value === 'all') return suggestions.value
  return suggestions.value.filter((s) => s.status === activeFilter.value)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredSuggestions.value.length / pageSize)))

const paginatedSuggestions = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredSuggestions.value.slice(start, start + pageSize)
})

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

async function fetchData() {
  try {
    const { data } = await suggestionApi.getList()
    suggestions.value = data.data.items
  } catch {
    toastMessage.value = '获取建议列表失败，请稍后重试'
    toastVisible.value = true
  }
}

onMounted(fetchData)
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

.suggestion-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.suggestion-card {
  display: block;
  color: inherit;
  transition: box-shadow 0.2s, transform 0.2s;
}

.suggestion-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.suggestion-card__top {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.suggestion-card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
}

.suggestion-card__desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
}

.suggestion-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
  color: var(--color-success);
  font-weight: 500;
}

.safety-progress {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 140px;
}

.safety-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  white-space: nowrap;
}

.safety-progress .progress-bar {
  flex: 1;
}

.empty-state {
  text-align: center;
  color: var(--color-text-tertiary);
  padding: var(--spacing-xxl);
}

.empty-state__hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.pagination__info {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
