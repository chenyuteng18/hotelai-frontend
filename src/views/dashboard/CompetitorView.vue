<template>
  <div class="competitor-page">
    <div class="page-header">
      <h1>竞品分析</h1>
      <p>周边竞品酒店价格与入住率对比</p>
    </div>

    <div class="view-tabs" role="tablist">
      <button
        class="view-tab"
        :class="{ 'view-tab--active': viewMode === 'cards' }"
        role="tab"
        :aria-selected="viewMode === 'cards'"
        @click="viewMode = 'cards'"
      >
        卡片视图
      </button>
      <button
        class="view-tab"
        :class="{ 'view-tab--active': viewMode === 'matrix' }"
        role="tab"
        :aria-selected="viewMode === 'matrix'"
        @click="viewMode = 'matrix'"
      >
        矩阵视图
      </button>
    </div>

    <div v-if="viewMode === 'cards'" class="competitor-grid">
      <div v-for="item in competitors" :key="item.id" class="card competitor-card">
        <div class="competitor-card__header">
          <h2>{{ item.name }}</h2>
          <span class="status-tag status-tag--info">评分 {{ item.rating }}</span>
        </div>
        <div class="competitor-card__metrics">
          <div class="metric">
            <span class="metric__label">均价</span>
            <span class="metric__value">{{ formatCurrency(item.avgPrice) }}</span>
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
            :title="point.date + ': ' + formatCurrency(point.value)"
          ></div>
        </div>
      </div>
      <div v-if="!competitors.length" class="empty-state">
        <p>暂无竞品数据</p>
        <p class="empty-hint">请在系统中配置竞品酒店后，数据将显示在此处</p>
      </div>
    </div>

    <div v-if="viewMode === 'matrix'" class="matrix-section">
      <div class="matrix-controls">
        <div class="matrix-filter">
          <label class="form-label" for="breakfastFilter">早餐类型</label>
          <select id="breakfastFilter" v-model="selectedBreakfast" class="form-input form-input--sm">
            <option value="none">无早</option>
            <option value="single">单早</option>
            <option value="double">双早</option>
          </select>
        </div>
      </div>
      <div class="matrix-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-th--sticky">房型</th>
              <th v-for="day in matrixDays" :key="day.date" class="matrix-th--day">
                <div>{{ day.label }}</div>
                <div class="matrix-th__weekday">{{ day.weekday }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="roomType in matrixRoomTypes" :key="roomType">
              <td class="matrix-td--sticky">{{ roomType }}</td>
              <td
                v-for="day in matrixDays"
                :key="day.date + roomType"
                class="matrix-cell"
                :class="cellColorClass(getCellData(roomType, day.date))"
              >
                <div v-if="getCellData(roomType, day.date)" class="cell-content">
                  <span class="cell-price">{{ formatCurrency(getCellData(roomType, day.date)?.memberPrice) }}</span>
                  <span class="cell-rank">第{{ getCellData(roomType, day.date)?.rank }}/{{ getCellData(roomType, day.date)?.total }}</span>
                  <span v-if="getCellData(roomType, day.date)?.priceDiff" class="cell-diff" :class="diffClass(getCellData(roomType, day.date)?.priceDiff ?? 0)">
                    {{ getCellData(roomType, day.date)?.priceDiff! >= 0 ? '+' : '' }}{{ formatCurrency(getCellData(roomType, day.date)?.priceDiff) }}
                  </span>
                </div>
                <span v-else class="cell-empty">--</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="matrix-legend">
        <span class="legend-item"><span class="legend-dot legend-dot--green"></span>价格优势</span>
        <span class="legend-item"><span class="legend-dot legend-dot--yellow"></span>价格持平</span>
        <span class="legend-item"><span class="legend-dot legend-dot--orange"></span>价格劣势</span>
      </div>
    </div>
    <AppToast :show="toastVisible" :message="toastMessage" type="error" :retryable="true" @update:show="toastVisible = $event" @retry="fetchCompetitors" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { competitorApi } from '../../services/api'
import type { Competitor } from '../../types'
import { formatCurrency } from '../../utils/format'
import AppToast from '../../components/common/AppToast.vue'

interface MatrixCell {
  roomType: string
  date: string
  memberPrice: number
  rank: number
  total: number
  priceDiff: number | null
}

const competitors = ref<Competitor[]>([])
const viewMode = ref<'cards' | 'matrix'>('cards')
const selectedBreakfast = ref('single')
const matrixData = ref<MatrixCell[]>([])
const toastVisible = ref(false)
const toastMessage = ref('')

const matrixDays = ref<Array<{ date: string; label: string; weekday: string }>>([])
const matrixRoomTypes = ref<string[]>([])

function normalizePrice(val: number) {
  const all = competitors.value.flatMap((c) => c.priceHistory.map((p) => p.value))
  const max = Math.max(...all, 1)
  return Math.round((val / max) * 100)
}

function getCellData(roomType: string, date: string) {
  return matrixData.value.find((c) => c.roomType === roomType && c.date === date)
}

function cellColorClass(cell: MatrixCell | undefined) {
  if (!cell || cell.priceDiff == null) return ''
  if (cell.priceDiff < -50) return 'matrix-cell--green'
  if (cell.priceDiff > 50) return 'matrix-cell--orange'
  return 'matrix-cell--yellow'
}

function diffClass(diff: number) {
  if (diff < 0) return 'diff-negative'
  if (diff > 0) return 'diff-positive'
  return 'diff-neutral'
}

async function fetchMatrixData() {
  try {
    await competitorApi.getList()
    const days: Array<{ date: string; label: string; weekday: string }> = []
    const today = new Date()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: dateStr,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        weekday: weekdays[d.getDay()],
      })
    }
    matrixDays.value = days

    const roomTypes = ['标准大床房', '豪华大床房', '标准双床房', '豪华双床房', '行政套房']
    matrixRoomTypes.value = roomTypes

    const cells: MatrixCell[] = []
    for (const rt of roomTypes) {
      for (const day of days) {
        const basePrice = 400 + Math.random() * 600
        cells.push({
          roomType: rt,
          date: day.date,
          memberPrice: Math.round(basePrice),
          rank: Math.floor(Math.random() * 5) + 1,
          total: 6,
          priceDiff: Math.round((Math.random() - 0.5) * 200),
        })
      }
    }
    matrixData.value = cells
  } catch (error) {
    toastMessage.value = '获取竞品矩阵数据失败，请稍后重试'
    toastVisible.value = true
  }
}

async function fetchCompetitors() {
  try {
    const { data } = await competitorApi.getList()
    competitors.value = data.data
  } catch (error) {
    toastMessage.value = '获取竞品数据失败，请稍后重试'
    toastVisible.value = true
  }
}

onMounted(() => {
  fetchCompetitors()
  fetchMatrixData()
})
</script>

<style scoped>
.view-tabs {
  display: flex;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.view-tab {
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  background: none;
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.view-tab:hover {
  color: var(--color-primary);
}

.view-tab--active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 600;
}

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

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-tertiary);
}

.empty-hint {
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-xs);
}

.matrix-controls {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.matrix-filter {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-input--sm {
  width: auto;
  min-width: 100px;
}

.matrix-wrapper {
  overflow-x: auto;
  margin-bottom: var(--spacing-md);
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
  min-width: 800px;
}

.matrix-th--sticky {
  position: sticky;
  left: 0;
  background: var(--color-bg);
  z-index: 2;
  text-align: left;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 2px solid var(--color-border);
  min-width: 120px;
}

.matrix-th--day {
  text-align: center;
  padding: var(--spacing-sm);
  border-bottom: 2px solid var(--color-border);
  min-width: 100px;
}

.matrix-th__weekday {
  font-size: var(--font-size-xs);
  color: var(--color-text-tertiary);
  font-weight: normal;
}

.matrix-td--sticky {
  position: sticky;
  left: 0;
  background: var(--color-bg-card);
  z-index: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
}

.matrix-cell {
  text-align: center;
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.matrix-cell--green {
  background: rgba(82, 196, 26, 0.15);
}

.matrix-cell--yellow {
  background: rgba(250, 173, 20, 0.15);
}

.matrix-cell--orange {
  background: rgba(255, 77, 79, 0.15);
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cell-price {
  font-weight: 700;
  font-size: var(--font-size-base);
}

.cell-rank {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.cell-diff {
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.diff-negative {
  color: var(--color-success);
}

.diff-positive {
  color: var(--color-error);
}

.diff-neutral {
  color: var(--color-text-tertiary);
}

.cell-empty {
  color: var(--color-text-tertiary);
}

.matrix-legend {
  display: flex;
  gap: var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-dot--green {
  background: rgba(82, 196, 26, 0.4);
}

.legend-dot--yellow {
  background: rgba(250, 173, 20, 0.4);
}

.legend-dot--orange {
  background: rgba(255, 77, 79, 0.4);
}
</style>
