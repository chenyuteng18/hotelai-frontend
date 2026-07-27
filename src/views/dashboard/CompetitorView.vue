<template>
  <div class="competitor-page">
    <div class="page-header">
      <h1>竞品分析</h1>
      <p>周边竞品酒店价格与入住率对比</p>
    </div>
    <div class="competitor-grid">
      <div v-for="item in competitors" :key="item.id" class="card competitor-card">
        <div class="competitor-card__header">
          <h2>{{ item.name }}</h2>
          <span class="status-tag status-tag--info">评分 {{ item.rating }}</span>
        </div>
        <div class="competitor-card__metrics">
          <div class="metric">
            <span class="metric__label">均价</span>
            <span class="metric__value">¥{{ item.avgPrice }}</span>
          </div>
          <div class="metric">
            <span class="metric__label">入住率</span>
            <span class="metric__value">{{ item.occupancyRate }}%</span>
          </div>
        </div>
        <div class="competitor-card__chart" aria-label="价格趋势">
          <div
            v-for="(point, i) in item.priceHistory"
            :key="i"
            class="mini-bar"
            :style="{ height: normalizePrice(point.value) + '%' }"
            :title="point.date + ': ¥' + point.value"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { competitorApi } from '../../services/api'
import type { Competitor } from '../../types'

const competitors = ref<Competitor[]>([])

function normalizePrice(val: number) {
  const all = competitors.value.flatMap((c) => c.priceHistory.map((p) => p.value))
  const max = Math.max(...all, 1)
  return Math.round((val / max) * 100)
}

onMounted(async () => {
  try {
    const { data } = await competitorApi.getList()
    competitors.value = data.data
  } catch {
    // 占位
  }
})
</script>

<style scoped>
.competitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}

.competitor-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.competitor-card__header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

.competitor-card__metrics {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-md);
}

.metric__label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.metric__value {
  font-size: var(--font-size-xl);
  font-weight: 700;
}

.competitor-card__chart {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 80px;
}

.mini-bar {
  flex: 1;
  background: var(--color-primary);
  border-radius: 2px 2px 0 0;
  min-height: 3px;
  opacity: 0.7;
}
</style>
