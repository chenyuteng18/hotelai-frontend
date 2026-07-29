<template>
  <div class="prediction-page">
    <div class="page-header">
      <h1>入住率预测</h1>
      <p>基于历史数据与外部因子的未来入住率预测</p>
    </div>
    <div class="prediction-list">
      <div v-for="item in predictions" :key="item.id" class="card prediction-card">
        <div class="prediction-card__header">
          <span class="prediction-card__date">{{ item.date }}</span>
          <span class="status-tag" :class="confidenceClass(item.confidence)">
            置信度 {{ (item.confidence * 100).toFixed(0) }}%
          </span>
        </div>
        <div class="prediction-card__value">
          <span class="value-main">{{ item.predictedValue }}%</span>
          <span class="value-range">区间 {{ item.lowerBound }}% – {{ item.upperBound }}%</span>
        </div>
        <div class="prediction-card__bounds">
          <div class="progress-bar" role="img" :aria-label="'安全边界进度 ' + item.predictedValue + '%'">
            <div
              class="progress-bar__fill"
              :class="boundClass(item.predictedValue, item.lowerBound, item.upperBound)"
              :style="{ width: item.predictedValue + '%' }"
            ></div>
          </div>
        </div>
        <div v-if="item.factors.length" class="prediction-card__factors">
          <h3>影响因子</h3>
          <ul>
            <li v-for="f in item.factors" :key="f.name">
              <span :class="f.direction === 'positive' ? 'factor-pos' : 'factor-neg'">
                {{ f.direction === 'positive' ? '↑' : '↓' }}
              </span>
              {{ f.name }}（{{ (f.impact * 100).toFixed(0) }}%）
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="!predictions.length" class="empty-state">
      <p>暂无预测数据</p>
      <p class="empty-state__hint">当 AI 完成入住率预测后将在此显示</p>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="fetchData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { predictionApi } from '../../services/api'
import AppToast from '../../components/common/AppToast.vue'
import type { Prediction } from '../../types'

const predictions = ref<Prediction[]>([])
const toastVisible = ref(false)
const toastMessage = ref('')

function confidenceClass(c: number) {
  if (c >= 0.8) return 'status-tag--success'
  if (c >= 0.6) return 'status-tag--warning'
  return 'status-tag--error'
}

function boundClass(val: number, lower: number, upper: number) {
  if (val >= lower && val <= upper) return 'progress-bar__fill--safe'
  if (val < lower) return 'progress-bar__fill--danger'
  return 'progress-bar__fill--warning'
}

async function fetchData() {
  try {
    const { data } = await predictionApi.getOccupancy()
    predictions.value = data.data
  } catch {
    toastMessage.value = '获取入住率预测失败，请稍后重试'
    toastVisible.value = true
  }
}

onMounted(fetchData)
</script>

<style scoped>
.prediction-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.prediction-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.prediction-card__date {
  font-weight: 600;
  font-size: var(--font-size-lg);
}

.prediction-card__value {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.value-main {
  font-size: var(--font-size-title);
  font-weight: 700;
  color: var(--color-primary);
}

.value-range {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.prediction-card__bounds {
  margin-bottom: var(--spacing-md);
}

.prediction-card__factors h3 {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.prediction-card__factors ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.prediction-card__factors li {
  font-size: var(--font-size-xs);
  background: var(--color-bg);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
}

.factor-pos {
  color: var(--color-success);
}

.factor-neg {
  color: var(--color-error);
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
</style>
