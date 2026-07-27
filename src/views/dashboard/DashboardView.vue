<template>
  <div class="dashboard">
    <div class="page-header">
      <h1>运营总览</h1>
      <p>酒店核心经营指标实时概览</p>
    </div>
    <div class="stats-grid">
      <div v-for="stat in statsCards" :key="stat.label" class="card stat-card">
        <span class="stat-card__label">{{ stat.label }}</span>
        <span class="stat-card__value">{{ stat.value }}</span>
        <span class="stat-card__trend" :class="stat.trend >= 0 ? 'up' : 'down'">
          {{ stat.trend >= 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}%
        </span>
      </div>
    </div>
    <div class="charts-row">
      <div class="card chart-card">
        <h2 class="chart-card__title">入住率趋势（近 30 天）</h2>
        <div class="chart-placeholder" aria-label="入住率趋势图表">
          <div v-for="(point, i) in occupancyTrend" :key="i" class="chart-bar" :style="{ height: point.value + '%' }" :title="point.date + ': ' + point.value + '%'"></div>
        </div>
      </div>
      <div class="card chart-card">
        <h2 class="chart-card__title">收益趋势（近 30 天）</h2>
        <div class="chart-placeholder" aria-label="收益趋势图表">
          <div v-for="(point, i) in revenueTrend" :key="i" class="chart-bar chart-bar--revenue" :style="{ height: normalizeRevenue(point.value) + '%' }" :title="point.date + ': ¥' + point.value"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { dashboardApi } from '../../services/api'
import type { TrendPoint } from '../../types'

const occupancyRate = ref(0)
const avgDailyRate = ref(0)
const revPar = ref(0)
const totalRevenue = ref(0)
const occupancyTrend = ref<TrendPoint[]>([])
const revenueTrend = ref<TrendPoint[]>([])

const statsCards = computed(() => [
  { label: '入住率', value: occupancyRate.value + '%', trend: 3.2 },
  { label: '平均房价', value: '¥' + avgDailyRate.value, trend: 1.8 },
  { label: 'RevPAR', value: '¥' + revPar.value, trend: 5.1 },
  { label: '总收益', value: '¥' + totalRevenue.value.toLocaleString(), trend: -0.6 },
])

function normalizeRevenue(val: number) {
  const max = Math.max(...revenueTrend.value.map((p) => p.value), 1)
  return Math.round((val / max) * 100)
}

onMounted(async () => {
  try {
    const { data } = await dashboardApi.getStats()
    const stats = data.data
    occupancyRate.value = stats.occupancyRate
    avgDailyRate.value = stats.avgDailyRate
    revPar.value = stats.revPar
    totalRevenue.value = stats.totalRevenue
    occupancyTrend.value = stats.occupancyTrend
    revenueTrend.value = stats.revenueTrend
  } catch {
    // API 不可用时使用占位数据
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-card__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.stat-card__value {
  font-size: var(--font-size-xxl);
  font-weight: 700;
}

.stat-card__trend {
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.stat-card__trend.up {
  color: var(--color-success);
}

.stat-card__trend.down {
  color: var(--color-error);
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--spacing-md);
}

.chart-card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--spacing-md);
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 160px;
  padding-top: var(--spacing-md);
}

.chart-bar {
  flex: 1;
  background: var(--color-primary);
  border-radius: 2px 2px 0 0;
  min-height: 4px;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.chart-bar:hover {
  opacity: 1;
}

.chart-bar--revenue {
  background: var(--color-success);
}

@media (max-width: 768px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
}
</style>
