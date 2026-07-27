<template>
  <div class="prediction-page">
    <div class="page-header">
      <h1>收益预测</h1>
      <p>未来收益趋势预测与置信区间</p>
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
          <span class="value-main">¥{{ item.predictedValue.toLocaleString() }}</span>
          <span class="value-range">区间 ¥{{ item.lowerBound.toLocaleString() }} – ¥{{ item.upperBound.toLocaleString() }}</span>
        </div>
        <div class="prediction-card__bounds">
          <div class="progress-bar" role="img" :aria-label="'收益安全边界'">
            <div
              class="progress-bar__fill progress-bar__fill--safe"
              :style="{ width: barWidth(item) + '%' }"
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
    <p v-if="!predictions.length" class="empty-state">暂无预测数据</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { predictionApi } from '../../services/api'
import type { Prediction } from '../../types'

const predictions = ref<Prediction[]>([])

function confidenceClass(c: number) {
  if (c >= 0.8) return 'status-tag--success'
  if (c >= 0.6) return 'status-tag--warning'
  return 'status-tag--error'
}

function barWidth(item: Prediction) {
  const max = Math.max(...predictions.value.map((p) => p.upperBound), 1)
  return Math.round((item.predictedValue / max) * 100)
}

onMounted(async () => {
  try {
    const { data } = await predictionApi.getRevenue()
    predictions.value = data.data
  } catch {
    // 占位
  }
})
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
  color: var(--color-success);
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
</style>
